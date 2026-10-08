// 回帰テスト: アイコンの読み込みに失敗したあと、同じ位置に同じファイターがいる
// 別のカードへ移ったら、そのマスのアイコンも読み込み直されること
// Usage: node scripts/e2e/stale-fallback.cjs <base-url>
const { BOARD, baseUrl, launch, run } = require("./lib.cjs");

const BASE = baseUrl();

run(async () => {
  const browser = await launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const board = page.getByRole("group", { name: "ビンゴカード" });

  await context.route("**/www.smashbros.com/**", (route) => route.abort());
  await page.goto(BASE);
  await page.waitForURL(/cells=/);
  await page.waitForFunction(
    (selector) => document.querySelectorAll(`${selector} img`).length === 0,
    BOARD,
  );
  await context.unroute("**/www.smashbros.com/**");

  // 先頭2マスだけ入れ替えた別のカードへ、ページを読み込み直さずに移動する
  const url = new URL(page.url());
  const ids = url.searchParams.get("cells").split(".");
  [ids[0], ids[1]] = [ids[1], ids[0]];
  url.searchParams.set("cells", ids.join("."));
  await page.evaluate((next) => {
    history.pushState(history.state, "", next);
    window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
  }, url.toString());
  await page.waitForURL((u) => u.searchParams.get("cells") === ids.join("."));
  await page.waitForTimeout(1500);

  const imgs = await board.locator("img").count();
  const ok = imgs === 25;
  console.log(
    `${ok ? "PASS" : "FAIL"} icons reload on a new card with same-position fighters — imgs=${imgs}/25`,
  );
  await browser.close();
  return ok;
});
