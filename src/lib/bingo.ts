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

export const emptyMarks = (size: BoardSize): Mark[] =>
  Array.from({ length: size * size }, (): Mark => 0);

const NEXT_MARK: Record<Mark, Mark> = { 0: 1, 1: 2, 2: 0 };

export const cycleMark = (marks: readonly Mark[], index: number): Mark[] =>
  marks.map((mark, i) => (i === index ? NEXT_MARK[mark] : mark));
