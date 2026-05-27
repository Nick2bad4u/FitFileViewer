import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

import { resolveCommandForPlatform } from "./lib/child-process.mjs";

const require = createRequire(import.meta.url);

if (process.platform !== "darwin") {
    console.log("[ensure-macos-builder-deps] Skipping non-macOS runner.");
    process.exit(0);
}

try {
    require.resolve("dmg-license/package.json");
    console.log("[ensure-macos-builder-deps] dmg-license is available.");
} catch {
    console.log("[ensure-macos-builder-deps] Installing dmg-license.");

    const result = spawnSync(
        resolveCommandForPlatform("npm"),
        [
            "install",
            "--force",
            "--no-save",
            "--package-lock=false",
            "--no-audit",
            "--no-fund",
            "dmg-license",
        ],
        {
            stdio: "inherit",
        }
    );

    if (result.error) {
        throw result.error;
    }

    process.exitCode = result.status ?? 1;
}
