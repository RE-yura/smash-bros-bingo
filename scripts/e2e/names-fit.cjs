// 全ファイターを 3x3 / 5x5 / 7x7 のカードに並べ、いくつかの画面幅で
// 名前が2行に収まらない（切れる）マスや、中身がはみ出すマスが無いかを調べる
// Usage: node scripts/e2e/names-fit.cjs <base-url>
const fs = require("node:fs");
const path = require("node:path");
const { BOARD, ROOT, baseUrl, launch, run } = require("./lib.cjs");

const BASE = baseUrl();
const WIDTHS = [320, 375, 390, 414, 768, 1280];
const ids = [
  ...fs
    .readFileSync(path.join(ROOT, "src", "data", "fighters.ts"), "utf8")
    .matchAll(/id: "([a-z0-9_]+)"/g),
].map((m) => m[1]);

// size² 人ずつのカードに分け、最後のカードは先頭のファイターで埋める
const chunks = (size) => {
  const n = size * size;
  const result = [];
  for (let i = 0; i < ids.length; i += n) {
    const chunk = ids.slice(i, i + n);
    for (const id of ids) if (chunk.length < n && !chunk.includes(id)) chunk.push(id);
    result.push(chunk);
  }
  return result;
};

run(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  let problems = 0;
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const size of [3, 5, 7]) {
      let cellWidth = 0;
      const modes = new Set();
      for (const chunk of chunks(size)) {
        await page.goto(`${BASE}?size=${size}&cells=${chunk.join(".")}`);
        await page.getByRole("group", { name: "ビンゴカード" }).waitFor();
        const report = await page.evaluate(
          (selector) =>
            [...document.querySelectorAll(`${selector} button`)].map((button) => {
              const inner = button.firstElementChild;
              const name = inner.querySelector(".line-clamp-2");
              const shown = [...name.children].find((c) => getComputedStyle(c).display !== "none");
              return {
                label: button.getAttribute("title"),
                shown: shown?.textContent ?? "",
                width: button.getBoundingClientRect().width,
                clamped: name.scrollHeight > name.clientHeight + 1,
                overflow: inner.scrollHeight > inner.clientHeight + 1,
              };
            }),
          BOARD,
        );
        for (const cell of report) {
          cellWidth = cell.width;
          modes.add(cell.shown === cell.label ? "full" : "short");
          if (cell.clamped || cell.overflow) {
            problems++;
            console.log(
              `NG ${width}px ${size}x${size} cell=${cell.width.toFixed(1)}px "${cell.shown}" (${cell.label})` +
                `${cell.clamped ? " clamped" : ""}${cell.overflow ? " overflow" : ""}`,
            );
          }
        }
      }
      console.log(
        `${width}px ${size}x${size}: cell=${cellWidth.toFixed(1)}px names=${[...modes].join("+")}`,
      );
    }
  }
  await browser.close();
  console.log(
    problems === 0 ? `PASS all ${ids.length} names fit` : `FAIL ${problems} cells do not fit`,
  );
  return problems === 0;
});
