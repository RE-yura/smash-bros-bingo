// ブラウザ確認スクリプトの共通部品
// Playwright はプロジェクトの依存に入れず、初回実行時に node_modules/.cache に入れて使う。
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const PLAYWRIGHT_VERSION = "1.64.0";
const ROOT = path.join(__dirname, "..", "..");
const DEPS_DIR = path.join(ROOT, "node_modules", ".cache", "e2e-playwright");

function loadPlaywright() {
  const entry = path.join(DEPS_DIR, "node_modules", "playwright");
  if (!fs.existsSync(entry)) {
    console.log(`Playwright ${PLAYWRIGHT_VERSION} を ${DEPS_DIR} に入れます…`);
    fs.mkdirSync(DEPS_DIR, { recursive: true });
    execFileSync(
      "npm",
      [
        "install",
        "--prefix",
        DEPS_DIR,
        "--no-save",
        "--no-audit",
        "--no-fund",
        `playwright@${PLAYWRIGHT_VERSION}`,
      ],
      { stdio: "inherit" },
    );
  }
  return require(entry);
}

/** 既定ではインストール済みの Google Chrome を使う。E2E_BROWSER_CHANNEL= （空）なら Playwright の Chromium */
function launch() {
  const channel = process.env.E2E_BROWSER_CHANNEL ?? "chrome";
  return loadPlaywright().chromium.launch(channel ? { channel } : {});
}

/** スクリーンショットの保存先（E2E_OUT_DIR で変更可） */
function outDir() {
  const dir = process.env.E2E_OUT_DIR ?? path.join(os.tmpdir(), "smash-bros-bingo-e2e");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** 第1引数のベース URL（例: http://localhost:4173/smash-bros-bingo/） */
function baseUrl() {
  const base = process.argv[2];
  if (!base) {
    console.error(`Usage: node ${path.relative(ROOT, process.argv[1])} <base-url>`);
    process.exit(2);
  }
  return base;
}

/** main を実行し、失敗した確認があれば終了コード 1、スクリプト自体のエラーなら 2 で終わる */
function run(main) {
  main()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((error) => {
      console.error("SCRIPT ERROR", error);
      process.exit(2);
    });
}

const BOARD = '[aria-label="ビンゴカード"]';

module.exports = { BOARD, ROOT, baseUrl, launch, loadPlaywright, outDir, run };
