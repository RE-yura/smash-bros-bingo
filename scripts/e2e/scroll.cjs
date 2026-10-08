// 回帰テスト: スマホの画面でスクロールしてからマスをタップしても、スクロール位置が変わらないこと
// Usage: node scripts/e2e/scroll.cjs <base-url>
const { baseUrl, launch, loadPlaywright, run } = require("./lib.cjs");

const BASE = baseUrl();

run(async () => {
  const browser = await launch();
  const context = await browser.newContext({
    ...loadPlaywright().devices["iPhone 13"],
    defaultBrowserType: undefined,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}?size=7`);
  await page.waitForURL(/cells=/);
  const cells = page.getByRole("group", { name: "ビンゴカード" }).getByRole("button");
  await cells.nth(48).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.scrollY);
  await cells.nth(44).tap();
  await page.waitForURL(/marks=/);
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.scrollY);
  const ok = before > 0 && Math.abs(after - before) < 2;
  console.log(
    `${ok ? "PASS" : "FAIL"} tap keeps scroll position — before=${before} after=${after}`,
  );
  await browser.close();
  return ok;
});
