import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type VsCodeTask = {
    args?: string[];
    command?: string;
    label?: string;
    options?: {
        cwd?: string;
    };
};

type VsCodeTasksJson = {
    tasks?: VsCodeTask[];
};

type VsCodeWorkspaceSettings = {
    "github.copilot.chat.codeGeneration.instructions"?: string;
    "stylelint.configFile"?: string;
    "vitest.rootConfig"?: string;
};

function readVsCodeSettings(): VsCodeWorkspaceSettings {
    return JSON.parse(
        readFileSync(
            path.join(process.cwd(), ".vscode", "settings.json"),
            "utf8"
        )
    ) as VsCodeWorkspaceSettings;
}

function readVsCodeTasks(): VsCodeTask[] {
    const tasksJson = JSON.parse(
        readFileSync(path.join(process.cwd(), ".vscode", "tasks.json"), "utf8")
    ) as VsCodeTasksJson;

    return tasksJson.tasks ?? [];
}

describe("vs code workspace tasks", () => {
    it("keeps editor tasks aligned with root-owned npm scripts", () => {
        expect.assertions(5);

        const tasks = readVsCodeTasks();
        const taskLabels = tasks.map((task) => task.label);
        const taskCommands = tasks.map((task) => task.command);
        const taskCwds = tasks.map((task) => task.options?.cwd);
        const taskArgs = tasks.flatMap((task) => task.args ?? []);
        const nestedElectronTestArgs = taskArgs.filter((taskArg) =>
            /^electron-app[\\/]tests[\\/]/u.test(taskArg)
        );

        expect(taskLabels).toStrictEqual([
            "build runtime from root",
            "test from root",
            "lint electron app from root",
            "typecheck from root",
        ]);
        expect(new Set(taskCommands)).toStrictEqual(new Set(["npm"]));
        expect(new Set(taskCwds)).toStrictEqual(
            new Set(["${workspaceFolder}"])
        );
        expect(nestedElectronTestArgs).toStrictEqual([]);
        expect(taskArgs.join(" ")).not.toMatch(
            /(?:--workspace|--prefix|-w)\s+electron-app/u
        );
    });

    it("keeps editor guidance aligned with root-owned TypeScript entrypoints", () => {
        expect.assertions(3);

        const settings = readVsCodeSettings();
        const instructions =
            settings["github.copilot.chat.codeGeneration.instructions"] ?? "";

        expect({
            stylelintConfigFile: settings["stylelint.configFile"],
            vitestRootConfig: settings["vitest.rootConfig"],
        }).toStrictEqual({
            stylelintConfigFile: "${workspaceFolder}/stylelint.config.mjs",
            vitestRootConfig: "${workspaceFolder}/vitest.config.ts",
        });
        expect(instructions).toContain(
            "electron-app/main.ts, electron-app/preload.ts, electron-app/renderer.ts, and electron-app/main-ui.ts"
        );
        expect(instructions).not.toMatch(
            /\b(?:main|preload|renderer)\.js\b|vscode-extension\/|vis\//u
        );
    });
});
