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
