import { getRouteApi } from "@tanstack/react-router";
import type { JSX } from "react";
import { cycleMark } from "../lib/bingo";
import { newCardSearch, validateBingoSearch } from "../lib/search";
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
        onGenerate={(settings) => void navigate({ to: "/", search: newCardSearch(settings) })}
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
          // 新しいカードでは全マスを作り直し、画像の読み込み失敗の状態を持ち越さない
          key={search.cells.join(".")}
          size={search.size}
          cells={search.cells}
          marks={search.marks}
          onCellClick={(index) =>
            void navigate({
              to: "/",
              // 最新の URL の値から計算するので、続けてクリックしても取りこぼさない
              search: (prev) => {
                // prev は root と index の search の合併型なので、検証して BingoSearch に確定させる
                const current = validateBingoSearch(prev);
                return { ...current, marks: cycleMark(current.marks, index) };
              },
              replace: true,
              // 色を変えるだけなので、スクロール位置はそのままにする（既定では先頭に戻る）
              resetScroll: false,
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
