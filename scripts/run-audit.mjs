import { spawnSync } from "node:child_process";

const environment = { ...process.env };
delete environment.npm_config_allow_scripts;
delete environment.NPM_CONFIG_ALLOW_SCRIPTS;

const npmCliPath = process.env.npm_execpath;

function runNpmAudit(arguments_) {
    const command = npmCliPath
        ? process.execPath
        : process.platform === "win32"
          ? "npm.cmd"
          : "npm";
    const commandArguments = npmCliPath
        ? [npmCliPath, ...arguments_]
        : arguments_;
    const result = spawnSync(command, commandArguments, {
        cwd: process.cwd(),
        env: environment,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `npm audit failed with exit code ${result.status ?? 1}`
        );
    }
}

runNpmAudit(["audit", "--audit-level=moderate"]);
runNpmAudit([
    "--prefix",
    "docusaurus",
    "audit",
    "--audit-level=high",
]);
