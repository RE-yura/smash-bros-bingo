# スマブラビンゴ 全面改修 設計書

- 日付: 2026-10-08
- ブランチ: `feat/revamp`

## 1. 目的と前提

### 依頼内容

1. 前回の調査で指摘した問題をすべて直す
2. ツールチェーンを Vite+（oxlint・oxfmt を含む）に、ルーターを TanStack Router に移行する
3. 残る依存パッケージを最新版に上げる
4. 名前だけのマスに画像を付けて、ファイターをひと目で見分けられるようにする

### 決定事項（ブレインストーミングで合意）

- ファイター画像は smashbros.com の公式顔アイコン（`pict`、200×200）を直接参照する。リポジトリには画像を置かない。
- 画面は Tailwind CSS v4 で作り直す。
- 状態はすべて URL に集約する。ルートはコードで1つだけ定義し、URL に `#` を使わない（ブラウザ履歴方式）。
- 旧形式の共有リンク（`#/?size=5&fighters=マリオ,…`）は互換対応しない。
- パッケージマネージャーは npm のまま。
- GitHub Pages（`https://re-yura.github.io/smash-bros-bingo/`）へのデプロイは継続する。

### 成功基準

- `vp check`（フォーマット・lint・型チェック）、`vp test`、`vp build` がすべて通る
- GitHub Actions から Pages へのデプロイが成功する
- 共有 URL を開くと、サイズ・カードの中身・マスの色がそのまま再現される
- 各マスにファイターのアイコンが表示され、画像が読めないときも名前で判別できる
- 幅 375px のスマホ表示で、3×3・5×5・7×7 のどれも横スクロールせずに操作できる

## 2. ツールチェーンと依存パッケージ

### 移行の進め方

- `vp migrate` を実行し、差分を確認してから手で整える。
- `vite.config.ts` は `vite-plus` から `defineConfig` を読み込む。oxlint の設定（`lint`）と oxfmt の設定（`fmt`）も同じファイルにまとめる。
- ESLint のルール（React Hooks の推奨ルール、react-refresh の `only-export-components`）は、oxlint に標準で入っている `react` プラグインの同等ルールで置き換える。あわせて `no-console` を有効にする。
- `base` は今と同じく、本番ビルドだけ `/smash-bros-bingo/` にする。

### 依存パッケージ（2026-10-08 時点の最新版）

| 種類 | パッケージ | バージョン |
|---|---|---|
| dependencies | `react` / `react-dom` | 19.3 |
| dependencies | `@tanstack/react-router` | 1.170 |
| devDependencies | `vite-plus`（Vite 8 互換コア・oxlint・oxfmt・Vitest 5 を同梱） | 1.1 |
| devDependencies | `@vitejs/plugin-react` | 6.1 |
| devDependencies | `tailwindcss` / `@tailwindcss/vite` | 4.3 |
| devDependencies | `typescript`（エディタ用。型チェックは `vp check` が行う） | 7.0 |
| devDependencies | `@types/react` / `@types/react-dom` | 19.3 |

削除するもの: `react-router-dom`、`vite`（vite-plus が提供）、`@eslint/js`、`eslint`、`eslint-plugin-react-hooks`、`eslint-plugin-react-refresh`、`globals`、`typescript-eslint`、`eslint.config.js`、`overrides` フィールド。

### package.json

- `name` を `smash-bros-bingo` にする。
- `packageManager` を `npm@11.12.1` にする。
- `engines.node` に Vite+ の要件 `^22.18.0 || ^24.11.0 || >=26.0.0` を書く。
- スクリプト: `dev` → `vp dev`、`build` → `vp build`、`preview` → `vp preview`、`check` → `vp check`、`test` → `vp test`。

### tsconfig

- TypeScript 7 で削除・変更された項目に合わせて `tsconfig.app.json` / `tsconfig.node.json` を整理する。
- `target` と `lib` は ES2023 以上に上げる。

### GitHub Actions（`.github/workflows/static.yml`）

- `actions/setup-node` と `npm ci` の代わりに `voidzero-dev/setup-vp@v1.21.1` を使う（Node 24、`cache: true`）。タグ `v1` は更新が止まっているので、正確なバージョンで固定する。
- 実行順: `vp check` → `vp test` → `vp build`。その後 `dist` を Pages にアップロードしてデプロイする。
- `actions/checkout`、`actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages` も最新版に上げる。

## 3. データと状態

### ファイターのデータ（`src/data/fighters.ts`）

```ts
export type FighterKind = "base" | "dlc" | "mii";

export type Fighter = {
  id: string; // URL に入れる英字 ID。公式サイトの画像名と同じ（例: "mario"）
  name: string; // 日本語の表示名
  series: string; // 出典シリーズ。画像が出ないときの色分けに使う
  kind: FighterKind;
  icon: string; // 公式アイコンのファイル名。Mii は3タイプとも "mii_fighter"
};
```

- 並び順は公式のファイター番号順にする。
- 収録数は今と同じ（基本71、Mii 3、DLC 12、計86）。表記は今のリストを引き継ぐ。
- Mii の ID は `mii_brawler` / `mii_swordfighter` / `mii_gunner` とする（公式サイトに個別の画像はない）。
- アイコンの URL は `https://www.smashbros.com/assets_v2/img/fighter/pict/{icon}.png`。パックンフラワーとホムラ･ヒカリは推測した名前（`piranha_plant`、`pyra`、`pyra_mythra`）では 404 になったので、実装時に公式サイトから正しい名前を調べる。そのうえで、全86件の URL が 200 を返すことを一度だけ確認する（このチェックはリポジトリには入れない）。

### URL の形式

例: `https://re-yura.github.io/smash-bros-bingo/?size=5&dlc=1&mii=1&cells=mario.link.kirby…&marks=0120…`

| パラメータ | 中身 | 不正なとき |
|---|---|---|
| `size` | `3` / `5` / `7` | 5 として扱う |
| `dlc` | `1` なら DLC ファイターを候補に含める | 含めない |
| `mii` | `1` なら Mii ファイターを候補に含める | 含めない |
| `cells` | ファイター ID を `.` でつないだもの（size² 個） | 知らない ID・重複・個数違いがあれば、カードなしとして扱う |
| `marks` | 各マスの色を1文字ずつ（`0`=なし、`1`=赤、`2`=青） | 長さが size² でない、または `0`〜`2` 以外の文字を含むなら、全マス `0` |

- TanStack Router は標準で URL の値を JSON として読み書きする。そのままだと `marks=1200` が数値になったり、文字列に `"` が付いたりする。そこで、ルーター作成時に `parseSearch` / `stringifySearch` を `URLSearchParams` を使う関数に差し替え、値はすべて文字列のまま受け渡す。
- 型への変換と値のチェックは、ルートの `validateSearch` で自前の関数を使って行う。zod は使わない。
- `validateSearch` は例外を投げない。不正な値は上の表どおりに直す。
- `cells` のチェックは「知っている ID か」「重複がないか」「個数が size² か」の3点だけにする。`dlc` / `mii` は次に作るカードの設定にすぎない。なので、`dlc` が無い URL のカードに DLC ファイターが入っていても、そのまま表示する。

`validateSearch` が返す型:

```ts
type BingoSearch = {
  size: 3 | 5 | 7;
  dlc: boolean;
  mii: boolean;
  cells?: string[]; // 検証済みのファイター ID。カードなしなら undefined
  marks: Mark[]; // size² 個。Mark = 0 | 1 | 2
};
```

URL に書き出すときは、`dlc` / `mii` が false なら省略する。`marks` が全部 `0` なら省略する。

### 画面の操作と URL の関係

- **初めて開いたとき（`cells` がない、または不正）:** 現在の `size` / `dlc` / `mii` でカードを自動生成し、`replace: true` で URL を書き換える（履歴は増やさない）。
- **「新しいカードを生成」を押したとき:** 設定欄の値と新しい `cells` で `navigate` する。履歴に追加するので、ブラウザの「戻る」で前のカードに戻れる。`marks` は空になる。
- **マスをクリックしたとき:** そのマスの色を 白→赤→青→白 と進め、`marks` だけを `replace: true` で書き換える。
- **設定欄:** サイズ・DLC・Mii は「次に作るカードの設定」として、コンポーネントの state で持つ。初期値は URL から取る。表示中のカードは常に URL の `size` と `cells` から描画する。

### ロジック（`src/lib/`、React に依存しない関数）

- `bingo.ts`
  - `buildPool(options: { dlc: boolean; mii: boolean }): Fighter[]`
  - `generateCells(pool: Fighter[], size: number, random?: () => number): string[]`: Fisher–Yates でシャッフルし、先頭の size² 件の ID を返す。乱数は引数で差し替えられる。基本ファイターだけでも 71 ≥ 49 なので、7×7 でも足りる。
  - `cycleMark(marks: Mark[], index: number): Mark[]`: 指定したマスだけ 0→1→2→0 と進めた新しい配列を返す。
- `search.ts`
  - `parseSearch` / `stringifySearch`: `URLSearchParams` を使った読み書き
  - `validateBingoSearch(raw: Record<string, unknown>): BingoSearch`
  - `toSearchParams(search: BingoSearch)`: 書き出し用。省略ルールを適用する

## 4. 画面（Tailwind CSS v4）

### 全体

- `@tailwindcss/vite` を使う。`src/styles.css` に `@import "tailwindcss";` と `@theme`（赤・青チームの色、背景色、フォント）を書く。
- 今の `index.css`、`App.css`、`App.tsx` 内の CSS 文字列、インラインの style 指定はすべて廃止する。
- 見た目の方向: 暗い背景にマスを明るい面として浮かせ、赤と青の色分けをはっきり見せる。テーマはこの1つだけにする。
- フォントはシステムの日本語フォント（`"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`）を使い、Web フォントは読み込まない。
- `index.html` は `lang="ja"` にし、`<meta name="description">` を加える。

### コンポーネント構成

| ファイル | 役割 |
|---|---|
| `src/main.tsx` | ルーターを作って描画する（`basepath` は `import.meta.env.BASE_URL`、`parseSearch` / `stringifySearch` は差し替え版） |
| `src/router.tsx` | ルートの定義（ルート1つと、`validateSearch` 付きの index ルート）と型登録 |
| `src/components/BingoPage.tsx` | URL を読み、自動生成・カード生成・マスのクリックを `navigate` に変換する |
| `src/components/SettingsForm.tsx` | サイズ（3/5/7 の切り替えボタン）、DLC・Mii のトグル、生成ボタン |
| `src/components/BingoBoard.tsx` | size×size の CSS グリッド。幅は `min(100%, 640px)`、マスは正方形 |
| `src/components/FighterCell.tsx` | 1マス分の `<button>`。アイコン、名前、色の状態を表示する |
| `src/components/FighterIcon.tsx` | 公式アイコンの `<img>`。読み込みに失敗したら、代わりの表示に切り替える |

ほかに、ヘッダー（タイトル「スマブラビンゴ」）、凡例（「クリックで 赤 → 青 → なし」と色見本）、フッターを置く。フッターには「非公式のファンサイトです。画像の著作権は任天堂ほか各権利者に帰属します。」と書く。

### マスの表示

- アイコンを上、名前を下に置く。名前は最大2行で、はみ出す分は省略する。
- 名前を出すかどうかは Tailwind v4 のコンテナクエリで決める。マスの幅が狭いとき（スマホで 7×7 のときなど）は名前を隠す。その場合も `aria-label` と `title` で名前がわかるようにする。
- 色の状態: 0 は明るい面、1 は赤、2 は青で塗る。アイコンは見えたままにする。`aria-label` は「マリオ（赤）」の形にする。
- `<img>` には `referrerPolicy="no-referrer"`、`decoding="async"`、`alt=""` を付ける（名前はボタン側の `aria-label` で伝えるため）。
- 画像が出ないときは、名前の1文字目を色付きの丸で表示する。色は `series` の文字列から決まった計算で選ぶ（8色程度のパレットから選択）。

## 5. 前回指摘した問題の解消

| 問題 | 対応 |
|---|---|
| 共有 URL で開くと、マスの大きさとセレクトボックスが 5×5 のまま | カードは常に URL の `size` から描画し、設定欄の初期値も URL から取る（3章） |
| マスの色が保存されない | `marks` パラメータに保存する（3章） |
| README が Vite テンプレートのまま | 日本語で書き直す（概要、公開 URL、遊び方、開発コマンド、画像の著作権についての注記） |
| package.json の name が `vite-react-typescript-starter` | `smash-bros-bingo` にする |
| `console.log` が残っている | 削除する。oxlint の `no-console` で再発を防ぐ |
| ファビコンのファイルがない | 自作の SVG（赤・青のマスを含む 3×3 のグリッド。任天堂の素材は使わない）を `public/favicon.svg` に置く |
| （追加）`useMemo` の結果の配列を `splice` で書き換えている | 3章の作り直しでこの処理自体がなくなる |
| （追加）`index.html` が `lang="en"` | `lang="ja"` にする |

## 6. テストと動作確認

### 単体テスト（`vp test`、Vitest 5、Node 環境）

- `fighters.ts`: 全86件、ID の重複なし、`kind` ごとの件数（71/3/12）、Mii の `icon` が `mii_fighter`
- `buildPool`: DLC・Mii のオン/オフ4通りで件数が正しい
- `generateCells`: 件数が size²、重複なし、すべて候補に含まれる、同じ乱数なら同じ結果
- `cycleMark`: 0→1→2→0 と進み、ほかのマスは変わらない
- `validateBingoSearch`: 正常な値をそのまま返す。不正な `size` は 5 になる。知らない ID・重複・個数違いはカードなしになる。不正な `marks` は全部 0 になる。
- `parseSearch` / `stringifySearch` / `toSearchParams`: 往復しても値が変わらない。`marks=1200` が数値にならない。省略ルールが効いている。

コンポーネントのテストは書かない（jsdom などの依存が増えるため）。画面は次の手順で確認する。

### 画面の手動確認

- `vp dev` と、本番と同じ base で動く `vp build && vp preview` の両方で確認する。
- アイコンが表示される。マスをクリックすると 白→赤→青→白 と変わる。リロードしても色が残る。URL を別のタブで開くと同じ状態が再現される。
- 「戻る」で前のカードに戻れる。マスのクリックでは履歴が増えない。
- 幅 375px と 1280px で、3×3・5×5・7×7 のどれも横スクロールせずに操作できる。
- 画像を読めないとき（DevTools で smashbros.com へのリクエストをブロック）に、代わりの表示が出る。
- `cells` を書き換えた不正な URL を開くと、新しいカードが自動で生成される。

## 7. 作らないもの

- ビンゴが揃ったかの判定
- 旧形式の共有リンクへの互換対応
- ファイターのアイコン画像の同梱、オフライン対応・PWA
- ライトテーマとダークテーマの切り替え
- 多言語対応
