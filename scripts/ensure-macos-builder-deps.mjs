import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { resolveCommandForPlatform } from "./lib/child-process.mjs";
import { repositoryRoot } from "./lib/workspaces.mjs";

const require = createRequire(path.join(repositoryRoot, "package.json"));
export const dmgLicensePackageName = "dmg-license";
export const installDmgLicenseArgs = [
    "install",
    "--force",
    "--no-save",
    "--package-lock=false",
    "--no-audit",
    "--no-fund",
    dmgLicensePackageName,
];

export function isPackageAvailable(
    packageName = dmgLicensePackageName,
    resolver = (specifier) => require.resolve(specifier)
) {
    try {
        resolver(`${packageName}/package.json`);
        return true;
    } catch {
        return false;
    }
}

export function ensureMacosBuilderDependencies(options = {}) {
    const commandRunner = options.commandRunner ?? spawnSync;
    const logger = options.logger ?? console.log;
    const platform = options.platform ?? process.platform;
    const resolver =
        options.resolver ?? ((specifier) => require.resolve(specifier));

    if (platform !== "darwin") {
        logger("[ensure-macos-builder-deps] Skipping non-macOS runner.");
        return 0;
    }

    if (isPackageAvailable(dmgLicensePackageName, resolver)) {
        logger("[ensure-macos-builder-deps] dmg-license is available.");
        return 0;
    }

    logger("[ensure-macos-builder-deps] Installing dmg-license.");

    const result = commandRunner(
        resolveCommandForPlatform("npm", platform),
        installDmgLicenseArgs,
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = ensureMacosBuilderDependencies();
}
