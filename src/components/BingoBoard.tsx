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
