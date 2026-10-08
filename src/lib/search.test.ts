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
