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

// 表示幅: 半角は 0.5、全角は 1 として数える
const displayWidth = (text: string) =>
  Array.from(text).reduce((width, char) => {
    const code = char.codePointAt(0) ?? 0;
    return width + (code < 0x80 || (code >= 0xff61 && code <= 0xff9f) ? 0.5 : 1);
  }, 0);

describe("shortName", () => {
  it("is set for every name too wide for the smallest cells", () => {
    const missing = FIGHTERS.filter((f) => displayWidth(f.name) >= 8 && !f.shortName);
    expect(missing.map((f) => f.name)).toEqual([]);
  });

  it("fits the smallest cells", () => {
    const tooWide = FIGHTERS.filter((f) => f.shortName && displayWidth(f.shortName) > 6);
    expect(tooWide.map((f) => f.shortName)).toEqual([]);
  });

  it("uses the agreed abbreviations", () => {
    expect(findFighter("captain_falcon")?.shortName).toBe("Cファルコン");
    expect(findFighter("mii_brawler")?.shortName).toBe("Mii格闘");
    expect(findFighter("mr_game_and_watch")?.shortName).toBe("ゲムヲ");
  });
});
