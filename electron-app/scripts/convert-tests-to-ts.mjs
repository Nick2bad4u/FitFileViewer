/*
 * Recursively rename test files to TypeScript extensions inside electron-app/tests
 * - *.test.js  -> *.test.ts
 * - *.spec.js  -> *.spec.ts
 * Skips files already using .ts/.tsx/.mts/.cts
 */
import { lstat, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const TESTS_DIR = path.resolve(__dirname, "..", "tests");

async function main() {
    try {
        await stat(TESTS_DIR);
    } catch {
        console.warn(`[convert-tests-to-ts] Tests directory not found: ${TESTS_DIR}`);
        return;
    }
    await walk(TESTS_DIR);
}

/** @param {string} dir */
async function walk(dir) {
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        console.warn(`[convert-tests-to-ts] Skipping unreadable directory: ${dir}`);
        return;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        try {
            // eslint-disable-next-line no-await-in-loop -- Intentional sequential FS access to avoid overwhelming the filesystem and to preserve deterministic traversal
            const lst = await lstat(full);
            if (lst.isSymbolicLink()) {
                // Avoid following symlinks to prevent escaping tests directory or broken targets
                continue;
            }
            if (lst.isDirectory()) {
                // eslint-disable-next-line no-await-in-loop -- Recursion is intentionally sequential to limit open handles and simplify error handling
                await walk(full);
                continue;
            }
        } catch {
            console.warn(`[convert-tests-to-ts] Skipping entry due to error: ${full}`);
            continue;
        }

        if (!full.endsWith(".js")) continue;
        if (/(\.d\.js|\.ts|\.tsx|\.mts|\.cts)$/.test(full)) continue;
        if (!/(\.test\.js|\.spec\.js)$/.test(full)) continue;
        const newFile = full.replace(/\.test\.js$/, ".test.ts").replace(/\.spec\.js$/, ".spec.ts");
        try {
            // eslint-disable-next-line no-await-in-loop -- Renames are performed one-by-one to avoid race conditions on the same directory
            await rename(full, newFile);
            console.log(`[convert-tests-to-ts] Renamed: ${full} -> ${newFile}`);
        } catch (error) {
            console.error(`[convert-tests-to-ts] Failed to rename ${full}:`, error);
        }
    }
}

main().catch((error) => {
    console.error("[convert-tests-to-ts] Unexpected error:", error);
    process.exitCode = 1;
});
