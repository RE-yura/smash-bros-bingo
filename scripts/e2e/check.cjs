// 主な操作をブラウザで一通り確かめる（PASS / FAIL を1行ずつ出す）
// Usage: node scripts/e2e/check.cjs <base-url>
const { BOARD, baseUrl, launch, outDir, run } = require("./lib.cjs");

const BASE = baseUrl();
const OUT = outDir();

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const params = (page) => new URL(page.url()).searchParams;
const board = (page) => page.getByRole("group", { name: "ビンゴカード" });
const cells = (page) => board(page).getByRole("button");
const iconsLoaded = (page) =>
  page.waitForFunction(
    (selector) => {
      const imgs = [...document.querySelectorAll(`${selector} img`)];
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    },
    BOARD,
    { timeout: 15000 },
  );

run(async () => {
  const browser = await launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  // 1. 初回: カードが自動生成され URL が置き換わる
  await page.goto(BASE);
  await page.waitForURL(/cells=/);
  check(
    "first visit generates a 5x5 card",
    params(page).get("size") === "5" && (await cells(page).count()) === 25,
  );
  const historyAtStart = await page.evaluate(() => history.length);
  await iconsLoaded(page);
  check("official icons load", true);
  await page.screenshot({ path: `${OUT}/desktop-5x5.png`, fullPage: true });

  // 2. クリックで 赤 → 青 → なし
  const first = cells(page).nth(0);
  const name = (await first.getAttribute("title")) ?? "";
  await first.click();
  await page.waitForURL(/marks=1/);
  check("click 1 -> red", (await first.getAttribute("aria-label")) === `${name}（赤）`);
  await first.click();
  await page.waitForURL(/marks=2/);
  check("click 2 -> blue", (await first.getAttribute("aria-label")) === `${name}（青）`);
  await first.click();
  await page.waitForURL((u) => !u.searchParams.has("marks"));
  check("click 3 -> none (marks omitted)", (await first.getAttribute("aria-label")) === name);

  // 3. 素早い連続クリック（同じティックで2回）
  await page.evaluate((selector) => {
    const button = document.querySelectorAll(`${selector} button`)[1];
    button.click();
    button.click();
  }, BOARD);
  await page.waitForTimeout(300);
  check(
    "two rapid clicks both apply",
    params(page).get("marks")?.[1] === "2",
    `marks=${params(page).get("marks")}`,
  );
  check(
    "cell clicks do not add history entries",
    (await page.evaluate(() => history.length)) === historyAtStart,
  );

  // 4. リロードで色が残る
  const marksBefore = params(page).get("marks");
  await page.reload();
  await page.waitForLoadState("networkidle");
  check("marks survive reload", params(page).get("marks") === marksBefore);
  check(
    "blue cell restored after reload",
    ((await cells(page).nth(1).getAttribute("aria-label")) ?? "").endsWith("（青）"),
  );

  // 5. 別タブで同じ URL → 同じカード
  const shared = page.url();
  const other = await context.newPage();
  await other.goto(shared);
  await other.waitForLoadState("networkidle");
  const sameCard =
    other.url() === shared && (await cells(other).nth(0).getAttribute("title")) === name;
  check("shared URL reproduces the card", sameCard);
  await other.close();

  // 6. 3x3 を生成 → 戻る で 5x5 に戻る（設定欄も）
  await page.getByText("3×3", { exact: true }).click();
  await page.getByRole("button", { name: "新しいカードを生成" }).click();
  await page.waitForURL(/size=3/);
  check("generate 3x3", (await cells(page).count()) === 9 && !params(page).has("marks"));
  await page.goBack();
  await page.waitForURL(/size=5/);
  check(
    "back returns to the previous 5x5 card",
    (await cells(page).count()) === 25 && params(page).get("marks") === marksBefore,
  );
  check(
    "settings follow the URL after back",
    await page.locator('input[name="size"][value="5"]').isChecked(),
  );

  // 7. 旧形式のリンク
  await page.goto(`${BASE}#/?size=5&fighters=%E3%83%9E%E3%83%AA%E3%82%AA`);
  await page.waitForURL(/cells=/);
  check("old hash link opens with a fresh card", (await cells(page).count()) === 25);

  // 8. cells に constructor
  const ids = params(page).get("cells").split(".");
  ids[0] = "constructor";
  await page.goto(`${BASE}?size=5&cells=${ids.join(".")}`);
  await page.waitForURL(
    (u) => !(u.searchParams.get("cells") ?? "constructor").includes("constructor"),
  );
  check("prototype-like id in cells triggers a new card", (await cells(page).count()) === 25);

  // 9. 画像をブロック → 代わりの表示 → 解除して新しいカードでアイコン
  await context.route("**/www.smashbros.com/**", (route) => route.abort());
  await page.reload();
  await page.waitForFunction(
    (selector) => document.querySelectorAll(`${selector} img`).length === 0,
    BOARD,
    {
      timeout: 15000,
    },
  );
  check(
    "fallback initials replace blocked icons",
    (await board(page).locator("span.grid.rounded-full").count()) === 25,
  );
  await page.screenshot({ path: `${OUT}/fallback.png`, fullPage: true });
  await context.unroute("**/www.smashbros.com/**");
  await page.getByRole("button", { name: "新しいカードを生成" }).click();
  await iconsLoaded(page);
  const imgCount = await board(page).locator("img").count();
  check("icons come back on a new card after unblocking", imgCount === 25, `imgs=${imgCount}`);

  // 10. 幅 375px で 3/5/7（横スクロールなし、全マスに名前）
  await page.setViewportSize({ width: 375, height: 800 });
  for (const size of [3, 5, 7]) {
    await page.getByText(`${size}×${size}`, { exact: true }).click();
    await page.getByRole("button", { name: "新しいカードを生成" }).click();
    await page.waitForURL(new RegExp(`size=${size}`));
    await iconsLoaded(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check(`375px ${size}x${size}: no horizontal scroll`, overflow <= 0, `overflow=${overflow}px`);
    const names = await board(page).locator(".line-clamp-2:visible").count();
    check(
      `375px ${size}x${size}: every cell shows a name`,
      names === size * size,
      `names=${names}`,
    );
    await page.screenshot({ path: `${OUT}/mobile-${size}x${size}.png`, fullPage: true });
  }

  // 11. 1280px で 7x7
  await page.setViewportSize({ width: 1280, height: 900 });
  const overflowDesktop = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check("1280px 7x7: no horizontal scroll", overflowDesktop <= 0);
  await page.screenshot({ path: `${OUT}/desktop-7x7.png`, fullPage: true });

  const unexpected = errors.filter((e) => !/smashbros\.com|ERR_FAILED|net::/.test(e));
  check(
    "no unexpected console errors",
    unexpected.length === 0,
    unexpected.slice(0, 3).join(" | "),
  );

  await browser.close();
  console.log(`${results.filter(Boolean).length}/${results.length} passed (screenshots: ${OUT})`);
  return results.every(Boolean);
});
