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
