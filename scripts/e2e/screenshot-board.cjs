// 盤面だけのスクリーンショットを撮る（見た目の変更前後を見比べるとき用。確認の合否は出さない）
// Usage: node scripts/e2e/screenshot-board.cjs <page-url> <viewport-width> <out.png>
//   例: node scripts/e2e/screenshot-board.cjs "http://localhost:5173/?size=5&cells=…&marks=…" 375 /tmp/board.png
const { BOARD, launch, run } = require("./lib.cjs");

const [url, width, out] = process.argv.slice(2);
if (!url || !width || !out) {
  console.error(
    "Usage: node scripts/e2e/screenshot-board.cjs <page-url> <viewport-width> <out.png>",
  );
  process.exit(2);
}

run(async () => {
  const browser = await launch();
  const page = await browser.newPage({
    viewport: { width: Number(width), height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(url);
  const board = page.getByRole("group", { name: "ビンゴカード" });
  await board.waitFor();
  await page.waitForFunction(
    (selector) =>
      [...document.querySelectorAll(`${selector} img`)].every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
    BOARD,
  );
  await board.screenshot({ path: out });
  await browser.close();
  console.log(`saved ${out}`);
  return true;
});
