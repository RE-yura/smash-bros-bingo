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
      className={`@container aspect-square min-w-0 cursor-pointer rounded-lg shadow-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${MARK_STYLES[mark]}`}
    >
      {/* 余白・アイコン・文字の大きさはマスの幅（cqi）に合わせる */}
      <span className="flex size-full flex-col items-center justify-center gap-[3cqi] p-[6cqi]">
        <span className="block w-[46%] shrink-0 @min-[5rem]:w-[52%]">
          <FighterIcon fighter={fighter} />
        </span>
        <span
          aria-hidden="true"
          className="line-clamp-2 w-full text-center text-balance [line-break:strict] text-[length:clamp(8px,19cqi,10px)] leading-[1.15] font-bold @min-[5rem]:text-[length:clamp(10px,11cqi,16px)]"
        >
          {/* 狭いマスでは略称、広いマスでは正式名 */}
          <span className="@min-[5rem]:hidden">{fighter.shortName ?? fighter.name}</span>
          <span className="hidden @min-[5rem]:inline">{fighter.name}</span>
        </span>
      </span>
    </button>
  );
}
