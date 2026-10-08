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
  // URL からは "3" / "5" / "7" の1文字だけを受け付ける（"3.0" や " 3" は不正として扱う）
  const size = typeof value === "string" && /^[357]$/.test(value) ? Number(value) : value;
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
