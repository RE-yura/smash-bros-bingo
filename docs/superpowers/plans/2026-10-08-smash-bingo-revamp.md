# スマブラビンゴ 全面改修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スマブラビンゴを Vite+ / TanStack Router / Tailwind CSS v4 / React 19 に移行し、URL に全状態を保存する作りに直したうえで、各マスに公式のファイターアイコンを表示する。

**Architecture:** 状態はすべて URL のクエリ（`size` / `dlc` / `mii` / `cells` / `marks`）に置く。TanStack Router のルートは `/` の1つだけで、`validateSearch` が URL を型付きの `BingoSearch` に変換する。カードが無ければ `beforeLoad` で生成して redirect する。ロジックは React に依存しない純粋な関数（`src/data/`, `src/lib/`）にまとめて Vitest で単体テストし、UI は Tailwind のクラスだけで組む。

**Tech Stack:** Vite+ 1.1.0（`vp`。Vite 8 互換コア / oxlint / oxfmt / Vitest 5 を同梱）、React 19.3、@tanstack/react-router 1.170、Tailwind CSS 4.3（`@tailwindcss/vite`）、TypeScript 7.0、npm 11.12.1

**Spec:** `docs/superpowers/specs/2026-10-08-smash-bingo-revamp-design.md`

## Global Constraints

- Node.js: `^22.18.0 || ^24.11.0 || >=26.0.0`（package.json の `engines.node`）
- パッケージマネージャーは npm（`"packageManager": "npm@11.12.1"`）。pnpm / bun は使わない
- 本番の依存パッケージは `react`、`react-dom`、`@tanstack/react-router` の3つだけ。zod などのライブラリは追加しない
- `vite` は `"npm:@voidzero-dev/vite-plus-core@1.1.0"` への別名指定にし、`overrides` にも同じ指定を書く
- 本番ビルドの `base` は `/smash-bros-bingo/`、開発時は `/`
- テストは `vite-plus/test` から読み込む（`vitest` を直接読み込まない）
- スタイルは Tailwind のクラスだけで書く。JSX の `style` 属性は使わない
- 画面の文言は日本語。フッターの文言は「非公式のファンサイトです。画像の著作権は任天堂ほか各権利者に帰属します。」
- アイコン URL: `https://www.smashbros.com/assets_v2/img/fighter/pict/{icon}.png`
- URL のクエリ: `size`（3/5/7）、`dlc` / `mii`（`1` のときだけ書く）、`cells`（ID を `.` 区切り）、`marks`（`0`/`1`/`2` を連結。全部 0 なら書かない）
- コミットメッセージは既存の形式（`✨ feat: …` / `🐛 fix: …` / `♻️ refactor: …` / `🔧 chore: …` / `📝 docs: …` / `✅ test: …`）。末尾に次の2行を付ける:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg
  ```
- Vite+ のコマンドは `vp check` / `vp test` / `vp build` を直接使う（`npm run` 経由でも動くが、`vp` が「npm スクリプトなら `vpr` を使って」という注意を出すだけで害はない）

## Review Focus

1. `cells` に `constructor` や `__proto__` のようなプロトタイプ由来の名前が入った URL → 知らない ID として扱い、カードを作り直す（オブジェクトのキー参照で受け付けてしまわない）。Task 2 と Task 4 にテストを入れる。
2. `cells` の形が崩れた URL（空の区切り `mario..link`、末尾の `.`、日本語名、大文字の ID）→ エラーにならず、新しいカードが表示される。Task 4 にテストを入れる。
3. 旧形式の共有リンク（`/#/?size=5&fighters=マリオ,…`）→ エラーにならず、新しいカードが表示される。Task 4 に「知らないパラメータを無視する」テストを入れ、Task 7 でブラウザ確認する。
4. 新しいカードを作ったとき、前のファイターの「画像の読み込み失敗」状態が別のファイターに引き継がれない。Task 5 でマスの `key` を `${index}:${id}` にし、Task 7 でブラウザ確認する。
5. マスを素早く続けてクリックしても、すべてのクリックが反映される（古い `marks` を元に上書きしない）。Task 5 で `navigate` に関数形式の `search: (prev) => …` を使い、Task 7 でブラウザ確認する。

---

## File Structure

| ファイル                                                                              | 状態 | 役割                                                       |
| ------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------- |
| `package.json` / `package-lock.json`                                                  | 変更 | 依存とスクリプト                                           |
| `vite.config.ts`                                                                      | 変更 | Vite+ の設定（ビルド・lint・fmt）                          |
| `tsconfig.json`                                                                       | 変更 | 1つにまとめた TypeScript 設定                              |
| `tsconfig.app.json` / `tsconfig.node.json` / `src/vite-env.d.ts` / `eslint.config.js` | 削除 | `tsconfig.json` と `vite.config.ts` に統合                 |
| `.github/workflows/static.yml`                                                        | 変更 | setup-vp で check / test / build → Pages                   |
| `src/data/fighters.ts` (+ `.test.ts`)                                                 | 新規 | ファイターのデータと検索・アイコン URL・代替色             |
| `src/lib/bingo.ts` (+ `.test.ts`)                                                     | 新規 | 盤面サイズ・マークの型、候補作成、シャッフル、色の切り替え |
| `src/lib/search.ts` (+ `.test.ts`)                                                    | 新規 | URL ⇔ `BingoSearch` の変換と検証、新しいカードの生成       |
| `src/router.ts`                                                                       | 新規 | TanStack Router のルート定義と型登録                       |
| `src/main.tsx`                                                                        | 変更 | ルーターを描画するだけ                                     |
| `src/styles.css`                                                                      | 新規 | Tailwind の読み込みとテーマ                                |
| `src/components/BingoPage.tsx`                                                        | 新規 | URL を読み、操作を `navigate` に変換する画面全体           |
| `src/components/SettingsForm.tsx`                                                     | 新規 | サイズ・DLC・Mii の設定と生成ボタン                        |
| `src/components/BingoBoard.tsx`                                                       | 新規 | size×size のグリッド                                       |
| `src/components/FighterCell.tsx`                                                      | 新規 | 1マス分のボタン                                            |
| `src/components/FighterIcon.tsx`                                                      | 新規 | 公式アイコンと、読めないときの代わりの表示                 |
| `src/App.tsx` / `src/App.css` / `src/index.css` / `src/assets/react.svg`              | 削除 | 新しい構成に置き換え                                       |
| `index.html`                                                                          | 変更 | `lang="ja"`、説明、ファビコン                              |
| `public/favicon.svg`                                                                  | 新規 | 自作ファビコン                                             |
| `public/vite.svg`                                                                     | 削除 | 置き換え                                                   |
| `README.md`                                                                           | 変更 | 日本語で書き直し                                           |

---

### Task 1: ツールチェーンを Vite+ に移行し、既存パッケージを最新化する

**Files:**

- Modify: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `.github/workflows/static.yml`, `src/App.tsx`
- Delete: `tsconfig.app.json`, `tsconfig.node.json`, `src/vite-env.d.ts`, `eslint.config.js`

**Interfaces:**

- Consumes: なし
- Produces: `vp check`（fmt + lint + 型チェック）、`vp test`、`vp build` が使える状態。以降のタスクはこの3コマンドで検証する。

- [ ] **Step 1: package.json を書き換える**

`react-router-dom` は Task 5 で外すので、ここでは残す。

```json
{
  "name": "smash-bros-bingo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview",
    "check": "vp check",
    "test": "vp test"
  },
  "dependencies": {
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "tailwindcss": "^4.3.3",
    "typescript": "^7.0.2",
    "vite": "npm:@voidzero-dev/vite-plus-core@1.1.0",
    "vite-plus": "1.1.0"
  },
  "overrides": {
    "vite": "npm:@voidzero-dev/vite-plus-core@1.1.0"
  },
  "engines": {
    "node": "^22.18.0 || ^24.11.0 || >=26.0.0"
  },
  "packageManager": "npm@11.12.1"
}
```

- [ ] **Step 2: 依存を入れ直す**

Run: `rm -rf node_modules package-lock.json && npm install --no-audit --no-fund`
Expected: エラーなく完了する。続けて `npm ls vite` を実行し、すべての `vite` が `npm:@voidzero-dev/vite-plus-core@1.1.0` に解決されている（`deduped`）ことを確認する。

- [ ] **Step 3: vite.config.ts を書き換える**

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/smash-bros-bingo/" : "/",
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  fmt: {},
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: { correctness: "error" },
    env: { browser: true, builtin: true },
    rules: {
      "no-console": "error",
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error",
      "react/only-export-components": ["error", { allowConstantExport: true }],
    },
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
  },
}));
```

- [ ] **Step 4: tsconfig を1つにまとめる**

`tsconfig.app.json`、`tsconfig.node.json`、`src/vite-env.d.ts`、`eslint.config.js` を `git rm` で削除し、`tsconfig.json` を次の内容にする。

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "types": ["vite-plus/client"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 5: GitHub Actions を setup-vp に切り替える**

まず各アクションのメジャータグが存在することを確認する。

Run: `for r in actions/checkout:v7 actions/configure-pages:v6 actions/upload-pages-artifact:v5 actions/deploy-pages:v5; do gh api "repos/${r%%:*}/git/ref/tags/${r##*:}" -q .ref; done`
Expected: `refs/tags/v7` などが4行表示される。404 になったものは `gh release view -R <repo> --json tagName` の正確なバージョン（例: `v7.0.1`）に置き換える。

`.github/workflows/static.yml` を次の内容にする。

```yaml
# main への push で、チェック・テスト・ビルドを行い GitHub Pages にデプロイする
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  # Actions タブから手動でも実行できるようにする
  workflow_dispatch:

# GITHUB_TOKEN に Pages へのデプロイを許可する
permissions:
  contents: read
  pages: write
  id-token: write

# 同時に走るデプロイは1つだけにする
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Set up Vite+
        # タグ v1 は更新が止まっているので、正確なバージョンで固定する
        uses: voidzero-dev/setup-vp@v1.21.1
        with:
          node-version: "24"
          cache: true
      - name: Check
        run: vp check
      - name: Test
        run: vp test
      - name: Build
        run: vp build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 6: フォーマットを当てて、検査結果を見る**

Run: `vp check --fix; vp check`
Expected: フォーマットは通る。旧 `src/App.tsx` で lint / 型のエラーが出る（`console.log` と、`noUncheckedIndexedAccess` による `possibly 'undefined'`）。

- [ ] **Step 7: 旧 App.tsx を最小限直す（このファイルは Task 5 で削除する）**

`src/App.tsx` で次の3か所を直す。

1. `useEffect` 内の `console.log(...)` 2行を削除する（前回指摘した問題の解消）。
2. `shuffle` の入れ替えを `[newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!];` にする。
3. `clickStates[i][j]` の2か所を `clickStates[i]?.[j] ?? 0` にする。

ほかにもエラーが出たら、同じ方針（このファイルは消すので、最小限の修正）で直す。

- [ ] **Step 8: 検査とビルドが通ることを確認する**

Run: `vp check && vp build`
Expected: `vp check` でエラー0件。`vp build` が `dist/index.html` と `dist/assets/*.js` を出力する。`grep -o '/smash-bros-bingo/assets/[^"]*' dist/index.html` で、本番の base が付いていることを確認する。

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "🔧 chore: migrate toolchain to Vite+ and update packages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 2: ファイターのデータ

**Files:**

- Create: `src/data/fighters.ts`
- Test: `src/data/fighters.test.ts`

**Interfaces:**

- Consumes: なし
- Produces:
  - `type FighterKind = "base" | "dlc" | "mii"`
  - `type Fighter = { id: string; name: string; series: string; kind: FighterKind; icon: string }`
  - `const FIGHTERS: readonly Fighter[]`（86件、公式番号順）
  - `findFighter(id: string): Fighter | undefined`
  - `isFighterId(value: unknown): value is string`
  - `iconUrl(fighter: Fighter): string`
  - `seriesColorClass(series: string): string`（`bg-xxx-600` 形式の Tailwind クラス）

- [ ] **Step 1: 失敗するテストを書く**

`src/data/fighters.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test";
import { FIGHTERS, findFighter, iconUrl, isFighterId, seriesColorClass } from "./fighters";

describe("FIGHTERS", () => {
  it("contains 86 fighters with unique ids", () => {
    expect(FIGHTERS).toHaveLength(86);
    expect(new Set(FIGHTERS.map((f) => f.id)).size).toBe(86);
  });

  it("uses URL-safe ids without dots", () => {
    for (const fighter of FIGHTERS) expect(fighter.id).toMatch(/^[a-z0-9_]+$/);
  });

  it("has 71 base, 3 Mii and 12 DLC fighters", () => {
    const count = (kind: string) => FIGHTERS.filter((f) => f.kind === kind).length;
    expect([count("base"), count("mii"), count("dlc")]).toEqual([71, 3, 12]);
  });

  it("shares the official Mii icon across the three Mii types", () => {
    const miis = FIGHTERS.filter((f) => f.kind === "mii");
    expect(miis.map((f) => f.icon)).toEqual(["mii_fighter", "mii_fighter", "mii_fighter"]);
  });
});

describe("findFighter / isFighterId", () => {
  it("finds fighters by id", () => {
    expect(findFighter("bowser")?.name).toBe("クッパ");
    expect(isFighterId("piranha_plant")).toBe(true);
  });

  it.each(["luigi2", "", "constructor", "__proto__", "toString", "MARIO"])(
    "rejects unknown or prototype-like id %j",
    (id) => {
      expect(findFighter(id)).toBeUndefined();
      expect(isFighterId(id)).toBe(false);
    },
  );

  it("rejects non-string values", () => {
    expect(isFighterId(42)).toBe(false);
    expect(isFighterId(undefined)).toBe(false);
  });
});

describe("iconUrl", () => {
  it("points at the official pict icon by its official file name", () => {
    const bowser = findFighter("bowser")!;
    expect(iconUrl(bowser)).toBe("https://www.smashbros.com/assets_v2/img/fighter/pict/koopa.png");
  });
});

describe("seriesColorClass", () => {
  it("is deterministic and returns a Tailwind background class", () => {
    expect(seriesColorClass("mario")).toBe(seriesColorClass("mario"));
    expect(seriesColorClass("mario")).toMatch(/^bg-[a-z]+-\d{3}$/);
  });

  it("spreads the series over several colors", () => {
    const colors = new Set(FIGHTERS.map((f) => seriesColorClass(f.series)));
    expect(colors.size).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `vp test src/data`
Expected: FAIL（`./fighters` が見つからない）

- [ ] **Step 3: 実装する**

`src/data/fighters.ts`（`series` と `icon` は公式データ `https://www.smashbros.com/assets_v2/data/fighter.json` の `series` と `file`、`name` は旧 `App.tsx` の表記を引き継いだもの）:

```ts
export type FighterKind = "base" | "dlc" | "mii";

export type Fighter = {
  /** URL に入れる英字 ID（英語名ベース）。`.` は URL の区切りなので使わない */
  id: string;
  name: string;
  /** 公式データのシリーズキー。アイコンが読めないときの色分けに使う */
  series: string;
  kind: FighterKind;
  /** 公式アイコンのファイル名 */
  icon: string;
};

/** 公式のファイター番号順 */
export const FIGHTERS: readonly Fighter[] = [
  { id: "mario", name: "マリオ", series: "mario", kind: "base", icon: "mario" },
  {
    id: "donkey_kong",
    name: "ドンキーコング",
    series: "donkeykong",
    kind: "base",
    icon: "donkey_kong",
  },
  { id: "link", name: "リンク", series: "zelda", kind: "base", icon: "link" },
  { id: "samus", name: "サムス", series: "metroid", kind: "base", icon: "samus" },
  { id: "dark_samus", name: "ダークサムス", series: "metroid", kind: "base", icon: "dark_samus" },
  { id: "yoshi", name: "ヨッシー", series: "yoshi", kind: "base", icon: "yoshi" },
  { id: "kirby", name: "カービィ", series: "kirby", kind: "base", icon: "kirby" },
  { id: "fox", name: "フォックス", series: "starfox", kind: "base", icon: "fox" },
  { id: "pikachu", name: "ピカチュウ", series: "pokemon", kind: "base", icon: "pikachu" },
  { id: "luigi", name: "ルイージ", series: "mario", kind: "base", icon: "luigi" },
  { id: "ness", name: "ネス", series: "mother", kind: "base", icon: "ness" },
  {
    id: "captain_falcon",
    name: "キャプテン・ファルコン",
    series: "f-zero",
    kind: "base",
    icon: "captain_falcon",
  },
  { id: "jigglypuff", name: "プリン", series: "pokemon", kind: "base", icon: "purin" },
  { id: "peach", name: "ピーチ", series: "mario", kind: "base", icon: "peach" },
  { id: "daisy", name: "デイジー", series: "mario", kind: "base", icon: "daisy" },
  { id: "bowser", name: "クッパ", series: "mario", kind: "base", icon: "koopa" },
  {
    id: "ice_climbers",
    name: "アイスクライマー",
    series: "iceclimber",
    kind: "base",
    icon: "ice_climber",
  },
  { id: "sheik", name: "シーク", series: "zelda", kind: "base", icon: "sheik" },
  { id: "zelda", name: "ゼルダ", series: "zelda", kind: "base", icon: "zelda" },
  { id: "dr_mario", name: "ドクターマリオ", series: "mario", kind: "base", icon: "dr_mario" },
  { id: "pichu", name: "ピチュー", series: "pokemon", kind: "base", icon: "pichu" },
  { id: "falco", name: "ファルコ", series: "starfox", kind: "base", icon: "falco" },
  { id: "marth", name: "マルス", series: "fireemblem", kind: "base", icon: "marth" },
  { id: "lucina", name: "ルキナ", series: "fireemblem", kind: "base", icon: "lucina" },
  { id: "young_link", name: "こどもリンク", series: "zelda", kind: "base", icon: "young_link" },
  { id: "ganondorf", name: "ガノンドロフ", series: "zelda", kind: "base", icon: "ganondorf" },
  { id: "mewtwo", name: "ミュウツー", series: "pokemon", kind: "base", icon: "mewtwo" },
  { id: "roy", name: "ロイ", series: "fireemblem", kind: "base", icon: "roy" },
  { id: "chrom", name: "クロム", series: "fireemblem", kind: "base", icon: "chrom" },
  {
    id: "mr_game_and_watch",
    name: "Mr.ゲーム＆ウォッチ",
    series: "gamewatch",
    kind: "base",
    icon: "mr_game_and_watch",
  },
  { id: "meta_knight", name: "メタナイト", series: "kirby", kind: "base", icon: "meta_knight" },
  { id: "pit", name: "ピット", series: "palutena", kind: "base", icon: "pit" },
  { id: "dark_pit", name: "ブラックピット", series: "palutena", kind: "base", icon: "black_pit" },
  {
    id: "zero_suit_samus",
    name: "ゼロスーツサムス",
    series: "metroid",
    kind: "base",
    icon: "zero_suit_samus",
  },
  { id: "wario", name: "ワリオ", series: "wario", kind: "base", icon: "wario" },
  { id: "snake", name: "スネーク", series: "metalgear", kind: "base", icon: "snake" },
  { id: "ike", name: "アイク", series: "fireemblem", kind: "base", icon: "ike" },
  {
    id: "pokemon_trainer",
    name: "ポケモントレーナー",
    series: "pokemon",
    kind: "base",
    icon: "pokemon_trainer",
  },
  {
    id: "diddy_kong",
    name: "ディディーコング",
    series: "donkeykong",
    kind: "base",
    icon: "diddy_kong",
  },
  { id: "lucas", name: "リュカ", series: "mother", kind: "base", icon: "lucas" },
  { id: "sonic", name: "ソニック", series: "sonic", kind: "base", icon: "sonic" },
  { id: "king_dedede", name: "デデデ", series: "kirby", kind: "base", icon: "dedede" },
  {
    id: "olimar",
    name: "ピクミン&オリマー",
    series: "pikmin",
    kind: "base",
    icon: "pikmin_and_olimar",
  },
  { id: "lucario", name: "ルカリオ", series: "pokemon", kind: "base", icon: "lucario" },
  { id: "rob", name: "ロボット", series: "famicomrobot", kind: "base", icon: "robot" },
  { id: "toon_link", name: "トゥーンリンク", series: "zelda", kind: "base", icon: "toon_link" },
  { id: "wolf", name: "ウルフ", series: "starfox", kind: "base", icon: "wolf" },
  { id: "villager", name: "むらびと", series: "doubutsu", kind: "base", icon: "murabito" },
  { id: "mega_man", name: "ロックマン", series: "rockman", kind: "base", icon: "rockman" },
  {
    id: "wii_fit_trainer",
    name: "Wii Fitトレーナー",
    series: "wii_fit",
    kind: "base",
    icon: "wii_fit_trainer",
  },
  {
    id: "rosalina_and_luma",
    name: "ロゼッタ＆チコ",
    series: "mario",
    kind: "base",
    icon: "rosetta_and_chiko",
  },
  {
    id: "little_mac",
    name: "リトル・マック",
    series: "punch_out",
    kind: "base",
    icon: "little_mac",
  },
  { id: "greninja", name: "ゲッコウガ", series: "pokemon", kind: "base", icon: "gekkouga" },
  {
    id: "mii_brawler",
    name: "Miiファイター（格闘タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  {
    id: "mii_swordfighter",
    name: "Miiファイター（剣術タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  {
    id: "mii_gunner",
    name: "Miiファイター（射撃タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  { id: "palutena", name: "パルテナ", series: "palutena", kind: "base", icon: "palutena" },
  { id: "pac_man", name: "パックマン", series: "pacman", kind: "base", icon: "pac_man" },
  { id: "robin", name: "ルフレ", series: "fireemblem", kind: "base", icon: "reflet" },
  { id: "shulk", name: "シュルク", series: "xenoblade", kind: "base", icon: "shulk" },
  { id: "bowser_jr", name: "クッパJr.", series: "mario", kind: "base", icon: "koopa_jr" },
  { id: "duck_hunt", name: "ダックハント", series: "duckhunt", kind: "base", icon: "duck_hunt" },
  { id: "ryu", name: "リュウ", series: "streetfighter", kind: "base", icon: "ryu" },
  { id: "ken", name: "ケン", series: "streetfighter", kind: "base", icon: "ken" },
  { id: "cloud", name: "クラウド", series: "finalfantasy", kind: "base", icon: "cloud" },
  { id: "corrin", name: "カムイ", series: "fireemblem", kind: "base", icon: "kamui" },
  { id: "bayonetta", name: "ベヨネッタ", series: "bayonetta", kind: "base", icon: "bayonetta" },
  { id: "inkling", name: "インクリング", series: "splatoon", kind: "base", icon: "inkling" },
  { id: "ridley", name: "リドリー", series: "metroid", kind: "base", icon: "ridley" },
  { id: "simon", name: "シモン", series: "dracula", kind: "base", icon: "simon" },
  { id: "richter", name: "リヒター", series: "dracula", kind: "base", icon: "richter" },
  {
    id: "king_k_rool",
    name: "キングクルール",
    series: "donkeykong",
    kind: "base",
    icon: "king_k_rool",
  },
  { id: "isabelle", name: "しずえ", series: "doubutsu", kind: "base", icon: "shizue" },
  { id: "incineroar", name: "ガオガエン", series: "pokemon", kind: "base", icon: "gaogaen" },
  {
    id: "piranha_plant",
    name: "パックンフラワー",
    series: "mario",
    kind: "dlc",
    icon: "packun_flower",
  },
  { id: "joker", name: "ジョーカー", series: "persona", kind: "dlc", icon: "joker" },
  { id: "hero", name: "勇者", series: "dragonquest", kind: "dlc", icon: "dq_hero" },
  {
    id: "banjo_and_kazooie",
    name: "バンジョー&カズーイ",
    series: "banjo_and_kazooie",
    kind: "dlc",
    icon: "banjo_and_kazooie",
  },
  { id: "terry", name: "テリー", series: "garou", kind: "dlc", icon: "terry" },
  { id: "byleth", name: "ベレス", series: "fireemblem", kind: "dlc", icon: "byleth" },
  { id: "min_min", name: "ミェンミェン", series: "arms", kind: "dlc", icon: "minmin" },
  { id: "steve", name: "スティーブ", series: "minecraft", kind: "dlc", icon: "steve" },
  { id: "sephiroth", name: "セフィロス", series: "finalfantasy", kind: "dlc", icon: "sephiroth" },
  { id: "pyra_mythra", name: "ホムラ･ヒカリ", series: "xenoblade", kind: "dlc", icon: "homura" },
  { id: "kazuya", name: "カズヤ", series: "tekken", kind: "dlc", icon: "kazuya" },
  { id: "sora", name: "ソラ", series: "kingdomhearts", kind: "dlc", icon: "sora" },
];

const FIGHTERS_BY_ID: ReadonlyMap<string, Fighter> = new Map(FIGHTERS.map((f) => [f.id, f]));

export const findFighter = (id: string): Fighter | undefined => FIGHTERS_BY_ID.get(id);

export const isFighterId = (value: unknown): value is string =>
  typeof value === "string" && FIGHTERS_BY_ID.has(value);

export const iconUrl = (fighter: Fighter): string =>
  `https://www.smashbros.com/assets_v2/img/fighter/pict/${fighter.icon}.png`;

const FALLBACK_COLORS = [
  "bg-rose-600",
  "bg-orange-600",
  "bg-amber-600",
  "bg-lime-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
] as const;

/** シリーズごとに決まった背景色クラスを返す（アイコンが読めないときの代わりの表示用） */
export function seriesColorClass(series: string): string {
  let hash = 0;
  for (const char of series) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `vp test src/data && vp check`
Expected: すべて PASS。`vp check` でエラー0件（フォーマット違反が出たら `vp check --fix`）。

- [ ] **Step 5: コミット**

```bash
git add src/data
git commit -m "✨ feat: add fighter data with official icon names

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 3: カードのロジック（候補・シャッフル・色）

**Files:**

- Create: `src/lib/bingo.ts`
- Test: `src/lib/bingo.test.ts`

**Interfaces:**

- Consumes: `FIGHTERS`, `type Fighter`（Task 2）
- Produces:
  - `const BOARD_SIZES: readonly [3, 5, 7]`、`type BoardSize = 3 | 5 | 7`
  - `type Mark = 0 | 1 | 2`（0=なし、1=赤、2=青）
  - `type CardSettings = { size: BoardSize; dlc: boolean; mii: boolean }`
  - `isBoardSize(value: unknown): value is BoardSize`
  - `buildPool(options: { dlc: boolean; mii: boolean }): Fighter[]`
  - `generateCells(pool: readonly Fighter[], size: BoardSize, random?: () => number): string[]`
  - `emptyMarks(size: BoardSize): Mark[]`
  - `cycleMark(marks: readonly Mark[], index: number): Mark[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/bingo.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test";
import { FIGHTERS } from "../data/fighters";
import { buildPool, cycleMark, emptyMarks, generateCells, isBoardSize, type Mark } from "./bingo";

// 再現できるシャッフルのための小さな乱数生成器（mulberry32）
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe("buildPool", () => {
  it.each([
    [false, false, 71],
    [true, false, 83],
    [false, true, 74],
    [true, true, 86],
  ])("dlc=%s mii=%s -> %i fighters", (dlc, mii, expected) => {
    expect(buildPool({ dlc, mii })).toHaveLength(expected);
  });

  it("only contains base fighters when DLC and Mii are off", () => {
    expect(buildPool({ dlc: false, mii: false }).every((f) => f.kind === "base")).toBe(true);
  });
});

describe("generateCells", () => {
  const pool = buildPool({ dlc: false, mii: false });

  it.each([3, 5, 7] as const)("fills a %i-wide card with unique fighters from the pool", (size) => {
    const cells = generateCells(pool, size, seeded(size));
    expect(cells).toHaveLength(size * size);
    expect(new Set(cells).size).toBe(cells.length);
    const poolIds = new Set(pool.map((f) => f.id));
    expect(cells.every((id) => poolIds.has(id))).toBe(true);
  });

  it("is reproducible with the same random source", () => {
    expect(generateCells(pool, 5, seeded(42))).toEqual(generateCells(pool, 5, seeded(42)));
  });

  it("shuffles: different seeds give different cards", () => {
    expect(generateCells(pool, 5, seeded(1))).not.toEqual(generateCells(pool, 5, seeded(2)));
  });

  it("does not mutate the pool", () => {
    const before = pool.map((f) => f.id);
    generateCells(pool, 7, seeded(7));
    expect(pool.map((f) => f.id)).toEqual(before);
  });

  it("handles a random source that returns values close to 1", () => {
    expect(new Set(generateCells(pool, 3, () => 0.999999)).size).toBe(9);
  });

  it("throws when the pool is smaller than the card", () => {
    expect(() => generateCells(FIGHTERS.slice(0, 8), 3)).toThrow(RangeError);
  });
});

describe("cycleMark", () => {
  it("cycles none -> red -> blue -> none", () => {
    let marks: Mark[] = emptyMarks(3);
    const seen: Mark[] = [];
    for (let i = 0; i < 3; i++) {
      marks = cycleMark(marks, 4);
      seen.push(marks[4]!);
    }
    expect(seen).toEqual([1, 2, 0]);
  });

  it("only changes the clicked cell and returns a new array", () => {
    const marks = emptyMarks(3);
    expect(cycleMark(marks, 0)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(marks).toEqual(emptyMarks(3));
  });
});

describe("emptyMarks / isBoardSize", () => {
  it("creates size x size empty marks", () => {
    expect(emptyMarks(5)).toEqual(Array.from({ length: 25 }, () => 0));
  });

  it("accepts only 3, 5 and 7", () => {
    expect([3, 5, 7].every((n) => isBoardSize(n))).toBe(true);
    expect([0, 4, 9, "5", Number.NaN, undefined].some((n) => isBoardSize(n))).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `vp test src/lib/bingo`
Expected: FAIL（`./bingo` が見つからない）

- [ ] **Step 3: 実装する**

`src/lib/bingo.ts`:

```ts
import { FIGHTERS, type Fighter } from "../data/fighters";

export const BOARD_SIZES = [3, 5, 7] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];

/** 0 = なし、1 = 赤、2 = 青 */
export type Mark = 0 | 1 | 2;

export type CardSettings = { size: BoardSize; dlc: boolean; mii: boolean };

export const isBoardSize = (value: unknown): value is BoardSize =>
  (BOARD_SIZES as readonly unknown[]).includes(value);

export function buildPool({ dlc, mii }: Pick<CardSettings, "dlc" | "mii">): Fighter[] {
  return FIGHTERS.filter(
    (f) => f.kind === "base" || (f.kind === "dlc" && dlc) || (f.kind === "mii" && mii),
  );
}

/** 候補を Fisher–Yates でシャッフルし、先頭の size² 件の ID を返す */
export function generateCells(
  pool: readonly Fighter[],
  size: BoardSize,
  random: () => number = Math.random,
): string[] {
  const count = size * size;
  if (pool.length < count) {
    throw new RangeError(`fighter pool has ${pool.length} entries but the card needs ${count}`);
  }
  const ids = pool.map((f) => f.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = ids[i]!;
    ids[i] = ids[j]!;
    ids[j] = tmp;
  }
  return ids.slice(0, count);
}

export const emptyMarks = (size: BoardSize): Mark[] => new Array<Mark>(size * size).fill(0);

const NEXT_MARK: Record<Mark, Mark> = { 0: 1, 1: 2, 2: 0 };

export const cycleMark = (marks: readonly Mark[], index: number): Mark[] =>
  marks.map((mark, i) => (i === index ? NEXT_MARK[mark] : mark));
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `vp test src/lib/bingo && vp check`
Expected: すべて PASS、`vp check` でエラー0件

- [ ] **Step 5: コミット**

```bash
git add src/lib/bingo.ts src/lib/bingo.test.ts
git commit -m "✨ feat: add card generation and mark cycling logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 4: URL ⇔ 状態の変換と検証

**Files:**

- Create: `src/lib/search.ts`
- Test: `src/lib/search.test.ts`

**Interfaces:**

- Consumes: `isFighterId`（Task 2）、`buildPool` / `generateCells` / `emptyMarks` / `isBoardSize` / `type BoardSize` / `type CardSettings` / `type Mark`（Task 3）
- Produces:
  - `type BingoSearch = CardSettings & { cells?: string[]; marks: Mark[] }`
  - `validateBingoSearch(raw: Record<string, unknown>): BingoSearch`（URL 由来の文字列と型付きの値の両方を受け付け、2回通しても結果が変わらない）
  - `toSearchParams(search: BingoSearch): URLSearchParams`
  - `parseSearch(searchStr: string): Record<string, string>`（TanStack Router の `parseSearch` 用）
  - `stringifySearch(search: Record<string, unknown>): string`（TanStack Router の `stringifySearch` 用。`?` 付き、または空文字）
  - `newCardSearch(settings: CardSettings, random?: () => number): BingoSearch`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/search.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test";
import { buildPool, emptyMarks } from "./bingo";
import {
  newCardSearch,
  parseSearch,
  stringifySearch,
  toSearchParams,
  validateBingoSearch,
  type BingoSearch,
} from "./search";

// 基本ファイターの先頭9人（mario … pikachu）
const cells9 = buildPool({ dlc: false, mii: false })
  .slice(0, 9)
  .map((f) => f.id);
const fromUrl = (query: string) => validateBingoSearch(parseSearch(query));

describe("validateBingoSearch", () => {
  it("reads a valid URL", () => {
    expect(fromUrl(`?size=3&dlc=1&cells=${cells9.join(".")}&marks=012000000`)).toEqual({
      size: 3,
      dlc: true,
      mii: false,
      cells: cells9,
      marks: [0, 1, 2, 0, 0, 0, 0, 0, 0],
    });
  });

  it("defaults to an empty 5x5 setting without DLC or Mii", () => {
    expect(fromUrl("")).toEqual({
      size: 5,
      dlc: false,
      mii: false,
      cells: undefined,
      marks: emptyMarks(5),
    });
  });

  it.each(["4", "abc", "", "-3", "3.5", "9"])("falls back to size 5 for size=%j", (size) => {
    expect(fromUrl(`?size=${size}`).size).toBe(5);
  });

  it("treats anything other than 1 as false for dlc and mii", () => {
    expect(fromUrl("?dlc=true&mii=0")).toMatchObject({ dlc: false, mii: false });
  });

  it.each([
    ["an unknown id", [...cells9.slice(0, 8), "luigi2"]],
    ["a prototype key", [...cells9.slice(0, 8), "constructor"]],
    ["__proto__", [...cells9.slice(0, 8), "__proto__"]],
    ["an upper-case id", [...cells9.slice(0, 8), "LUIGI"]],
    ["a duplicate", [...cells9.slice(0, 8), cells9[0]!]],
    ["too few cells", cells9.slice(0, 8)],
    ["too many cells", [...cells9, "luigi"]],
  ])("drops the card when cells contain %s", (_label, ids) => {
    expect(fromUrl(`?size=3&cells=${ids.join(".")}`).cells).toBeUndefined();
  });

  it.each(["mario..link", ".", "mario.", "%E3%83%9E%E3%83%AA%E3%82%AA"])(
    "drops malformed cells=%j",
    (cells) => {
      expect(fromUrl(`?size=3&cells=${cells}`).cells).toBeUndefined();
    },
  );

  it("drops the card when size and cell count disagree", () => {
    expect(fromUrl(`?size=5&cells=${cells9.join(".")}`).cells).toBeUndefined();
  });

  it.each(["01200000", "0120000000", "01200000x", "0120000-1", "", "0 0000000"])(
    "resets invalid marks=%j",
    (marks) => {
      expect(fromUrl(`?size=3&cells=${cells9.join(".")}&marks=${marks}`).marks).toEqual(
        emptyMarks(3),
      );
    },
  );

  it("keeps digit-only marks as a sequence (not a number)", () => {
    expect(fromUrl(`?size=3&cells=${cells9.join(".")}&marks=120000000`).marks).toEqual([
      1, 2, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it("returns the same result for already-validated values", () => {
    const once = fromUrl(`?size=3&mii=1&cells=${cells9.join(".")}&marks=210000000`);
    expect(validateBingoSearch(once)).toEqual(once);
  });

  it("ignores unknown parameters such as the old fighters list", () => {
    expect(fromUrl("?size=3&fighters=%E3%83%9E%E3%83%AA%E3%82%AA")).toEqual(fromUrl("?size=3"));
  });
});

describe("toSearchParams / stringifySearch", () => {
  it("omits false flags and all-zero marks", () => {
    const search: BingoSearch = {
      size: 3,
      dlc: false,
      mii: false,
      cells: cells9,
      marks: emptyMarks(3),
    };
    expect(toSearchParams(search).toString()).toBe(`size=3&cells=${cells9.join(".")}`);
  });

  it("writes flags and marks when they are set", () => {
    const search: BingoSearch = {
      size: 3,
      dlc: true,
      mii: true,
      cells: cells9,
      marks: [1, 2, 0, 0, 0, 0, 0, 0, 0],
    };
    expect(toSearchParams(search).toString()).toBe(
      `size=3&dlc=1&mii=1&cells=${cells9.join(".")}&marks=120000000`,
    );
  });

  it("round-trips through the URL", () => {
    const search: BingoSearch = {
      size: 3,
      dlc: true,
      mii: false,
      cells: cells9,
      marks: [2, 0, 0, 0, 1, 0, 0, 0, 0],
    };
    expect(fromUrl(stringifySearch(search))).toEqual(search);
  });

  it("prefixes ? and normalizes invalid input", () => {
    expect(stringifySearch({ size: "9", junk: "x" })).toBe("?size=5");
  });
});

describe("newCardSearch", () => {
  it("creates a fresh card from the settings", () => {
    const search = newCardSearch({ size: 7, dlc: true, mii: true }, () => 0.5);
    expect(search).toMatchObject({ size: 7, dlc: true, mii: true });
    expect(search.cells).toHaveLength(49);
    expect(search.marks).toEqual(emptyMarks(7));
    expect(validateBingoSearch(search)).toEqual(search);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `vp test src/lib/search`
Expected: FAIL（`./search` が見つからない）

- [ ] **Step 3: 実装する**

`src/lib/search.ts`:

```ts
import { isFighterId } from "../data/fighters";
import {
  buildPool,
  emptyMarks,
  generateCells,
  isBoardSize,
  type BoardSize,
  type CardSettings,
  type Mark,
} from "./bingo";

export type BingoSearch = CardSettings & {
  /** 検証済みのファイター ID（size² 件）。カードが無いときは undefined */
  cells?: string[];
  marks: Mark[];
};

const DEFAULT_SIZE: BoardSize = 5;
const CELL_SEPARATOR = ".";

// URL 由来の文字列と、ナビゲーション時に渡される型付きの値の両方を受け付ける
const toList = (value: unknown, separator: string): unknown[] | undefined => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(separator);
  return undefined;
};

const toSize = (value: unknown): BoardSize => {
  const size = typeof value === "string" ? Number(value) : value;
  return isBoardSize(size) ? size : DEFAULT_SIZE;
};

const toFlag = (value: unknown): boolean => value === true || value === "1";

const toCells = (value: unknown, size: BoardSize): string[] | undefined => {
  const list = toList(value, CELL_SEPARATOR);
  if (!list || list.length !== size * size) return undefined;
  if (!list.every(isFighterId)) return undefined;
  if (new Set(list).size !== list.length) return undefined;
  return list;
};

const isMark = (value: unknown): value is Mark => value === 0 || value === 1 || value === 2;

const toMark = (value: unknown): unknown =>
  typeof value === "string" && /^[012]$/.test(value) ? Number(value) : value;

const toMarks = (value: unknown, size: BoardSize): Mark[] => {
  const list = toList(value, "")?.map(toMark);
  if (!list || list.length !== size * size || !list.every(isMark)) return emptyMarks(size);
  return list;
};

export function validateBingoSearch(raw: Record<string, unknown>): BingoSearch {
  const size = toSize(raw.size);
  return {
    size,
    dlc: toFlag(raw.dlc),
    mii: toFlag(raw.mii),
    cells: toCells(raw.cells, size),
    marks: toMarks(raw.marks, size),
  };
}

export function toSearchParams(search: BingoSearch): URLSearchParams {
  const params = new URLSearchParams({ size: String(search.size) });
  if (search.dlc) params.set("dlc", "1");
  if (search.mii) params.set("mii", "1");
  if (search.cells) params.set("cells", search.cells.join(CELL_SEPARATOR));
  if (search.marks.some((mark) => mark !== 0)) params.set("marks", search.marks.join(""));
  return params;
}

/** TanStack Router の parseSearch。値は JSON として解釈せず、文字列のまま渡す */
export const parseSearch = (searchStr: string): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(searchStr));

/** TanStack Router の stringifySearch。検証で形を整えてから書き出す */
export const stringifySearch = (search: Record<string, unknown>): string => {
  const query = toSearchParams(validateBingoSearch(search)).toString();
  return query ? `?${query}` : "";
};

export function newCardSearch(settings: CardSettings, random?: () => number): BingoSearch {
  return {
    size: settings.size,
    dlc: settings.dlc,
    mii: settings.mii,
    cells: generateCells(buildPool(settings), settings.size, random),
    marks: emptyMarks(settings.size),
  };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `vp test src/lib && vp check`
Expected: すべて PASS、`vp check` でエラー0件

- [ ] **Step 5: コミット**

```bash
git add src/lib/search.ts src/lib/search.test.ts
git commit -m "✨ feat: encode bingo state in URL search params

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 5: TanStack Router と Tailwind で画面を作り直す

**Files:**

- Create: `src/router.ts`, `src/styles.css`, `src/components/BingoPage.tsx`, `src/components/SettingsForm.tsx`, `src/components/BingoBoard.tsx`, `src/components/FighterCell.tsx`, `src/components/FighterIcon.tsx`
- Modify: `src/main.tsx`, `package.json`, `package-lock.json`
- Delete: `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/react.svg`

**Interfaces:**

- Consumes: `findFighter` / `iconUrl` / `seriesColorClass` / `type Fighter`（Task 2）、`BOARD_SIZES` / `cycleMark` / `type BoardSize` / `type CardSettings` / `type Mark`（Task 3）、`newCardSearch` / `parseSearch` / `stringifySearch` / `validateBingoSearch`（Task 4）
- Produces: `router`（`src/router.ts`）。ルート `/` の search の型は `BingoSearch`

- [ ] **Step 1: ルーターのパッケージを入れ替える**

Run: `npm uninstall react-router-dom && npm install @tanstack/react-router@^1.170.41`
Expected: package.json の dependencies が `@tanstack/react-router`、`react`、`react-dom` の3つになる

- [ ] **Step 2: 旧ファイルを削除する**

Run: `git rm src/App.tsx src/App.css src/index.css src/assets/react.svg`

- [ ] **Step 3: テーマを書く**

`src/styles.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif;
  --color-ink: #0d0f14;
  --color-panel: #171a22;
  --color-cell: #f3efe6;
  --color-team-red: #e5484d;
  --color-team-blue: #3e63dd;
}

@layer base {
  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-ink);
    background-image:
      radial-gradient(60rem 30rem at 50% -10rem, rgb(229 72 77 / 0.18), transparent),
      radial-gradient(50rem 30rem at 100% 110%, rgb(62 99 221 / 0.16), transparent);
    background-attachment: fixed;
    color: var(--color-zinc-100);
    -webkit-tap-highlight-color: transparent;
  }
}
```

- [ ] **Step 4: アイコンとマスのコンポーネントを書く**

`src/components/FighterIcon.tsx`:

```tsx
import { useState, type JSX } from "react";
import { iconUrl, seriesColorClass, type Fighter } from "../data/fighters";

export function FighterIcon({ fighter }: { fighter: Fighter }): JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`grid aspect-square w-full place-items-center rounded-full font-black text-white ${seriesColorClass(fighter.series)}`}
      >
        <span className="text-[length:clamp(10px,20cqi,28px)] leading-none">
          {Array.from(fighter.name)[0]}
        </span>
      </span>
    );
  }

  return (
    <img
      src={iconUrl(fighter)}
      alt=""
      width={200}
      height={200}
      referrerPolicy="no-referrer"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className="block aspect-square w-full object-contain"
    />
  );
}
```

`src/components/FighterCell.tsx`:

```tsx
import type { JSX } from "react";
import type { Fighter } from "../data/fighters";
import type { Mark } from "../lib/bingo";
import { FighterIcon } from "./FighterIcon";

const MARK_STYLES: Record<Mark, string> = {
  0: "bg-cell text-ink hover:bg-white",
  1: "bg-team-red text-white hover:brightness-110",
  2: "bg-team-blue text-white hover:brightness-110",
};

const MARK_LABELS: Record<Mark, string> = { 0: "", 1: "（赤）", 2: "（青）" };

type Props = { fighter: Fighter; mark: Mark; onClick: () => void };

export function FighterCell({ fighter, mark, onClick }: Props): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${fighter.name}${MARK_LABELS[mark]}`}
      title={fighter.name}
      className={`@container flex aspect-square min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg p-1 shadow-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-1.5 ${MARK_STYLES[mark]}`}
    >
      <span className="block w-[72%] rounded-full bg-white/90 p-[6%] @min-[4.5rem]:w-[52%]">
        <FighterIcon fighter={fighter} />
      </span>
      <span
        aria-hidden="true"
        className="hidden text-center text-[length:clamp(10px,11cqi,16px)] leading-tight font-bold @min-[4.5rem]:line-clamp-2"
      >
        {fighter.name}
      </span>
    </button>
  );
}
```

- [ ] **Step 5: 盤面と設定欄のコンポーネントを書く**

`src/components/BingoBoard.tsx`:

```tsx
import type { JSX } from "react";
import { findFighter } from "../data/fighters";
import type { BoardSize, Mark } from "../lib/bingo";
import { FighterCell } from "./FighterCell";

const GRID_STYLES: Record<BoardSize, string> = {
  3: "grid-cols-3 gap-2 sm:gap-3",
  5: "grid-cols-5 gap-1.5 sm:gap-2",
  7: "grid-cols-7 gap-1 sm:gap-1.5",
};

type Props = {
  size: BoardSize;
  cells: readonly string[];
  marks: readonly Mark[];
  onCellClick: (index: number) => void;
};

export function BingoBoard({ size, cells, marks, onCellClick }: Props): JSX.Element {
  return (
    <div
      role="group"
      aria-label="ビンゴカード"
      className={`mx-auto grid w-full max-w-[640px] ${GRID_STYLES[size]}`}
    >
      {cells.map((id, index) => {
        const fighter = findFighter(id);
        if (!fighter) return null;
        return (
          // 位置と ID の組み合わせを key にして、新しいカードで画像の失敗状態を引き継がない
          <FighterCell
            key={`${index}:${id}`}
            fighter={fighter}
            mark={marks[index] ?? 0}
            onClick={() => onCellClick(index)}
          />
        );
      })}
    </div>
  );
}
```

`src/components/SettingsForm.tsx`:

```tsx
import { useState, type JSX } from "react";
import { BOARD_SIZES, type CardSettings } from "../lib/bingo";

type Props = {
  initial: CardSettings;
  onGenerate: (settings: CardSettings) => void;
};

export function SettingsForm({ initial, onGenerate }: Props): JSX.Element {
  const [settings, setSettings] = useState(initial);

  return (
    <form
      className="flex flex-col items-center gap-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10 sm:flex-row sm:flex-wrap sm:justify-center"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate(settings);
      }}
    >
      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">カードのサイズ</legend>
        {BOARD_SIZES.map((size) => (
          <label key={size} className="cursor-pointer">
            <input
              type="radio"
              name="size"
              value={size}
              checked={settings.size === size}
              onChange={() => setSettings((current) => ({ ...current, size }))}
              className="peer sr-only"
            />
            <span className="block rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 tabular-nums ring-1 ring-white/15 transition peer-checked:bg-white peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
              {size}×{size}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-4">
        <Toggle
          label="DLC を含む"
          checked={settings.dlc}
          onChange={(dlc) => setSettings((current) => ({ ...current, dlc }))}
        />
        <Toggle
          label="Mii を含む"
          checked={settings.mii}
          onChange={(mii) => setSettings((current) => ({ ...current, mii }))}
        />
      </div>

      <button
        type="submit"
        className="cursor-pointer rounded-xl bg-linear-to-r from-team-red to-team-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
      >
        新しいカードを生成
      </button>
    </form>
  );
}

type ToggleProps = { label: string; checked: boolean; onChange: (checked: boolean) => void };

function Toggle({ label, checked, onChange }: ToggleProps): JSX.Element {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-5 accent-team-red"
      />
      {label}
    </label>
  );
}
```

- [ ] **Step 6: 画面全体とルーターを書く**

`src/components/BingoPage.tsx`:

```tsx
import { getRouteApi } from "@tanstack/react-router";
import type { JSX } from "react";
import { cycleMark } from "../lib/bingo";
import { newCardSearch } from "../lib/search";
import { BingoBoard } from "./BingoBoard";
import { SettingsForm } from "./SettingsForm";

const routeApi = getRouteApi("/");

export function BingoPage(): JSX.Element {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          <span className="text-team-red">スマブラ</span>
          <span className="text-team-blue">ビンゴ</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          大乱闘スマッシュブラザーズ SPECIAL のファイターでビンゴカードを作ろう
        </p>
      </header>

      <SettingsForm
        // 「戻る」などで URL の設定が変わったら、設定欄を URL の値に戻す
        key={`${search.size}:${search.dlc}:${search.mii}`}
        initial={{ size: search.size, dlc: search.dlc, mii: search.mii }}
        onGenerate={(settings) => void navigate({ search: newCardSearch(settings) })}
      />

      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-zinc-300">
        <span>マスをクリック:</span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded-sm bg-team-red" />赤
        </span>
        <span aria-hidden="true">→</span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded-sm bg-team-blue" />青
        </span>
        <span aria-hidden="true">→</span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded-sm bg-cell" />
          なし
        </span>
      </p>

      {search.cells && (
        <BingoBoard
          size={search.size}
          cells={search.cells}
          marks={search.marks}
          onCellClick={(index) =>
            void navigate({
              // 最新の URL の値から計算するので、続けてクリックしても取りこぼさない
              search: (prev) => ({ ...prev, marks: cycleMark(prev.marks, index) }),
              replace: true,
            })
          }
        />
      )}

      <footer className="mt-auto pt-6 text-center text-xs leading-relaxed text-zinc-500">
        非公式のファンサイトです。画像の著作権は任天堂ほか各権利者に帰属します。
      </footer>
    </div>
  );
}
```

`src/router.ts`:

```ts
import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { BingoPage } from "./components/BingoPage";
import { newCardSearch, parseSearch, stringifySearch, validateBingoSearch } from "./lib/search";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: validateBingoSearch,
  beforeLoad: ({ search }) => {
    // カードが無い（初回・不正な URL）ときは、描画前に生成して URL を置き換える
    if (!search.cells) {
      throw redirect({ to: "/", search: newCardSearch(search), replace: true });
    }
  },
  component: BingoPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
  // 本番は "/smash-bros-bingo/"、開発時は "/"
  basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
  parseSearch,
  stringifySearch,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

`src/main.tsx`:

```tsx
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root element not found");

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

- [ ] **Step 7: 検査・テスト・ビルドを通す**

Run: `vp check --fix; vp check && vp test && vp build`
Expected: エラー0件、全テスト PASS、ビルド成功。型エラーで `BingoPage` の型が循環して推論できないと言われた場合は、戻り値の型注釈（`: JSX.Element`）が付いているか確認する。

- [ ] **Step 8: 開発サーバーで動作を見る**

Run: `vp dev`（バックグラウンドで起動）し、ブラウザで `http://localhost:5173/` を開く（run スキル、またはこのセッションで使えるブラウザ操作ツールを使う）。
Expected:

- 開くとすぐ `?size=5&cells=…` に置き換わり、5×5 のカードにアイコンと名前が表示される
- マスをクリックすると 赤 → 青 → なし と変わり、URL の `marks` が更新される。リロードしても色が残る
- サイズを 3×3 にして生成すると 3×3 になり、ブラウザの「戻る」で前の 5×5 に戻る（設定欄も 5×5 に戻る）
- コンソールにエラーが出ていない

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "✨ feat: rebuild UI with TanStack Router, Tailwind and fighter icons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 6: ファビコン・index.html・README

**Files:**

- Create: `public/favicon.svg`
- Modify: `index.html`, `README.md`
- Delete: `public/vite.svg`

**Interfaces:**

- Consumes: なし
- Produces: なし

- [ ] **Step 1: ファビコンを置き換える**

Run: `git rm public/vite.svg`

`public/favicon.svg`（斜めに赤が揃った 3×3 のビンゴ。任天堂の素材は使わない）:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0d0f14"/>
  <rect x="4" y="4" width="7" height="7" rx="1.5" fill="#e5484d"/>
  <rect x="12.5" y="4" width="7" height="7" rx="1.5" fill="#f3efe6"/>
  <rect x="21" y="4" width="7" height="7" rx="1.5" fill="#3e63dd"/>
  <rect x="4" y="12.5" width="7" height="7" rx="1.5" fill="#f3efe6"/>
  <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="#e5484d"/>
  <rect x="21" y="12.5" width="7" height="7" rx="1.5" fill="#3e63dd"/>
  <rect x="4" y="21" width="7" height="7" rx="1.5" fill="#3e63dd"/>
  <rect x="12.5" y="21" width="7" height="7" rx="1.5" fill="#f3efe6"/>
  <rect x="21" y="21" width="7" height="7" rx="1.5" fill="#e5484d"/>
</svg>
```

- [ ] **Step 2: index.html を書き換える**

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="大乱闘スマッシュブラザーズ SPECIAL のファイターでビンゴカードを作れる非公式ファンサイト"
    />
    <meta name="theme-color" content="#0d0f14" />
    <title>スマブラビンゴ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: README を書き直す**

`README.md`:

```markdown
# スマブラビンゴ

大乱闘スマッシュブラザーズ SPECIAL のファイターでビンゴカードを作る、非公式のファンサイトです。

https://re-yura.github.io/smash-bros-bingo/

## 遊び方

1. カードのサイズ（3×3 / 5×5 / 7×7）と、DLC ファイター・Mii ファイターを含めるかを選び、「新しいカードを生成」を押します。
2. マスをクリックすると、赤 → 青 → なし の順に色が変わります。2人（2チーム）で色を分けて使えます。
3. カードの中身と色はすべて URL に入っています。URL を共有すると、相手も同じカードを開けます。

## 開発

[Vite+](https://viteplus.dev/)（`vp` コマンド）を使います。Node.js は `^22.18.0 || ^24.11.0 || >=26.0.0` が必要です。

| コマンド         | 内容                                              |
| ---------------- | ------------------------------------------------- |
| `vp install`     | 依存パッケージをインストール                      |
| `vp dev`         | 開発サーバーを起動                                |
| `vp check`       | フォーマット（oxfmt）・lint（oxlint）・型チェック |
| `vp check --fix` | フォーマットと lint の自動修正                    |
| `vp test`        | 単体テスト（Vitest）                              |
| `vp build`       | 本番ビルド（`dist/` に出力）                      |
| `vp preview`     | 本番ビルドをローカルで確認                        |

`main` ブランチに push すると、GitHub Actions が `vp check` → `vp test` → `vp build` を実行し、GitHub Pages にデプロイします。

## 構成

- React 19 + TanStack Router（ページは1つ。状態はすべて URL のクエリに保存）
- Tailwind CSS v4
- ファイターのアイコンは公式サイト（smashbros.com）の画像を直接読み込んでいます。読み込めないときは名前の1文字目を表示します。

## 権利表記

非公式のファンサイトです。任天堂および各権利者とは関係ありません。画像の著作権は任天堂ほか各権利者に帰属します。
```

- [ ] **Step 4: 検査とビルドを通し、ファビコンのパスを確認する**

Run: `vp check --fix; vp check && vp build && grep -o 'href="[^"]*favicon.svg"' dist/index.html && ls dist/favicon.svg`
Expected: エラー0件。`href="/smash-bros-bingo/favicon.svg"` が表示され、`dist/favicon.svg` が存在する

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "📝 docs: rewrite README and replace favicon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015SMGKH6TcUHaQsbYVuLsEg"
```

---

### Task 7: 最終確認

**Files:**

- なし（問題が見つかったら該当ファイルを直し、`🐛 fix: …` でコミットする）

**Interfaces:**

- Consumes: Task 1〜6 のすべて
- Produces: 検証済みのブランチ

- [ ] **Step 1: 自動チェックをすべて通す**

Run: `vp check && vp test && vp build`
Expected: すべて成功

- [ ] **Step 2: 全86件のアイコン URL を確認する（リポジトリには入れない一度きりの確認）**

Run:

```bash
grep -oE 'icon: "[a-z0-9_]+"' src/data/fighters.ts | sed 's/icon: "//; s/"//' | sort -u | while read icon; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.smashbros.com/assets_v2/img/fighter/pict/$icon.png")
  [ "$code" = 200 ] || echo "NG $icon $code"
done; echo done
```

Expected: `NG` の行が無く、`done` だけが表示される

- [ ] **Step 3: 本番と同じ base でブラウザ確認する**

Run: `vp preview`（バックグラウンドで起動。表示された URL、通常は `http://localhost:4173/smash-bros-bingo/` を開く）
Expected（幅 375px と 1280px の両方で確認する）:

- 3×3・5×5・7×7 のどれも横スクロールが出ない。7×7 を幅 375px で見ると名前が隠れ、アイコンだけになる
- アイコンが表示される。マスのクリックで 赤 → 青 → なし と変わる。リロードしても色が残る
- URL を別のタブで開くと、同じカードと色が再現される
- 「戻る」で前のカードに戻れる。マスのクリックでは履歴が増えない
- マスを素早く何度もクリックしても、すべてのクリックが反映される（Review Focus 5）
- `/smash-bros-bingo/#/?size=5&fighters=%E3%83%9E%E3%83%AA%E3%82%AA` を開くと、エラーにならず新しいカードが表示される（Review Focus 3）
- `cells` の一部を `constructor` に書き換えた URL を開くと、新しいカードが自動で生成される（Review Focus 1）
- DevTools で `www.smashbros.com` へのリクエストをブロックしてリロードすると、名前の1文字目が色付きの丸で表示される。ブロックを解除して「新しいカードを生成」を押すと、すべてのマスでアイコンが表示される（Review Focus 4）
- ファビコンが自作の SVG になっている。コンソールにエラーが出ていない

- [ ] **Step 4: ブランチ全体をレビューする**

ブランチ全体（`main...HEAD`）を、Fable モデルのレビュアーにレビューしてもらう。指摘は superpowers:receiving-code-review の手順で検証し、正しいものだけ直してコミットする。
