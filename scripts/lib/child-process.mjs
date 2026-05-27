import process from "node:process";

const windowsCommandShims = new Set([
    "npm",
    "npx",
    "pnpm",
    "yarn",
]);

export function resolveCommandForPlatform(
    command,
    platform = process.platform
) {
    if (platform !== "win32" || !windowsCommandShims.has(command)) {
        return command;
    }

    return `${command}.cmd`;
}
