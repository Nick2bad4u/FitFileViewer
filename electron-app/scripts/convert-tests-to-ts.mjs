#!/usr/bin/env node
/*
 * Recursively rename test files to TypeScript extensions inside electron-app/tests
 * - *.test.js  -> *.test.ts
 * - *.spec.js  -> *.spec.ts
 * Skips files already using .ts/.tsx/.mts/.cts
 */
import { readdir, rename, stat, lstat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESTS_DIR = path.resolve(__dirname, "..", "tests");

/** @param {string} dir */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`[convert-tests-to-ts] Skipping unreadable directory: ${dir}`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    try {
      const lst = await lstat(full);
      if (lst.isSymbolicLink()) {
        // Avoid following symlinks to prevent escaping tests directory or broken targets
        continue;
      }
      if (lst.isDirectory()) {
        await walk(full);
        continue;
      }
    } catch (err) {
      console.warn(`[convert-tests-to-ts] Skipping entry due to error: ${full}`);
      continue;
    }

    if (!full.endsWith(".js")) continue;
    if (/(\.d\.js|\.ts|\.tsx|\.mts|\.cts)$/.test(full)) continue;
    if (!/(\.test\.js|\.spec\.js)$/.test(full)) continue;
    const newFile = full.replace(/\.test\.js$/, ".test.ts").replace(/\.spec\.js$/, ".spec.ts");
    try {
      await rename(full, newFile);
      console.log(`[convert-tests-to-ts] Renamed: ${full} -> ${newFile}`);
    } catch (err) {
      console.error(`[convert-tests-to-ts] Failed to rename ${full}:`, err);
    }
  }
}

async function main() {
  try {
    await stat(TESTS_DIR);
  } catch {
    console.warn(`[convert-tests-to-ts] Tests directory not found: ${TESTS_DIR}`);
    return;
  }
  await walk(TESTS_DIR);
}

main().catch((e) => {
  console.error("[convert-tests-to-ts] Unexpected error:", e);
  process.exitCode = 1;
});
