import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.resolve(__dirname, "../docs/api");

/**
 * Optional explicit label overrides for specific API module directories.
 * Falls back to a generic prettifier when not present.
 */
/** @type {Map<string, string>} */
const LABEL_OVERRIDES = new Map([
    ["fitParser", "FIT Parser"],
    ["main-ui", "Main UI"],
    ["main", "Main Process"],
    ["mainProcessStateClient", "Main Process State Client"],
    ["mainProcessStateManager", "Main Process State Manager"],
    ["preload", "Preload"],
    ["renderer", "Renderer"],
    ["stylelint.config", "Stylelint Config"],
    ["ui", "UI Components"],
    ["utils", "Utilities"],
    ["vitest.config", "Vitest Config"],
    ["windowStateUtils", "Window State Utils"],
]);

/**
 * Convert a directory name like "main-ui" or "mainProcessStateClient" into a
 * human-friendly label.
 *
 * @param {string} dirName
 * @returns {string}
 */
function prettifyLabel(dirName) {
    const override = LABEL_OVERRIDES.get(dirName);
    if (override) {
        return override;
    }

    // Replace dashes/underscores with spaces
    let result = dirName.replace(/[-_]+/g, " ");

    // Insert spaces before capital letters in camelCase / PascalCase
    result = result.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    // Capitalize each word
    result = result
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return result;
}

/**
 * Write a Docusaurus _category_.json file to the given directory.
 *
 * @param {string} dirPath
 * @param {string} label
 * @returns {Promise<void>}
 */
async function generateCategoryFile(dirPath, label) {
    const filePath = path.join(dirPath, "_category_.json");
    const data = {
        label,
    };

    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
    // Root category for the generated API docs
    await generateCategoryFile(apiDir, "Generated API Docs");

    const entries = await readdir(apiDir, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory());

    await Promise.all(
        directories.map(async (entry) => {
            const dirName = entry.name; // e.g. "fitParser", "main", "ui"
            const dirPath = path.join(apiDir, dirName);
            const label = prettifyLabel(dirName);
            await generateCategoryFile(dirPath, label);
        })
    );
}

main().catch((error) => {
    // Log but do not hard-crash the build; sidebar labels falling back to
    // defaults is better than failing the entire docs build.
    console.error("[generate-api-categories] Failed to generate category files:", error);
});
