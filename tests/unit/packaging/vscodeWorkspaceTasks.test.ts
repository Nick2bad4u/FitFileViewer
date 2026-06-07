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
    "files.exclude"?: Record<string, boolean>;
    "github.copilot.chat.codeGeneration.instructions"?: string;
    "search.exclude"?: Record<string, boolean>;
    "stylelint.configFile"?: string;
    "vitest.rootConfig"?: string;
};

const expectedRootTaskCommands = {
    "build runtime from root": ["run", "build:runtime-ts"],
    "lint app from root": ["run", "lint:app"],
    "test from root": ["test"],
    "typecheck from root": ["run", "typecheck"],
} as const;

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

function getTaskByLabel(tasks: VsCodeTask[], label: string): VsCodeTask {
    const task = tasks.find((candidate) => candidate.label === label);

    if (!task) {
        throw new Error(`Expected VS Code task: ${label}`);
    }

    return task;
}

function getTaskCommandMap(tasks: VsCodeTask[]): Record<string, string[]> {
    return Object.fromEntries(
        tasks.map((task) => [task.label, task.args ?? []])
    );
}

function delegatesToElectronAppPackage(task: VsCodeTask): boolean {
    const args = task.args ?? [];
    const commandParts = [task.command ?? "", ...args];

    return commandParts.some((part) =>
        /(?:^|[\\/])electron-app(?:[\\/]|$)|^(?:--workspace|--prefix|-w)$/u.test(
            part
        )
    );
}

describe("vs code workspace tasks", () => {
    it("keeps editor tasks aligned with root-owned npm scripts", () => {
        expect.assertions(5);

        const tasks = readVsCodeTasks();
        const taskLabels = tasks.map((task) => task.label);
        const taskCommands = tasks.map((task) => task.command);
        const taskCwds = tasks.map((task) => task.options?.cwd);

        expect(taskLabels).toStrictEqual([
            "build runtime from root",
            "test from root",
            "lint app from root",
            "typecheck from root",
        ]);
        expect(getTaskCommandMap(tasks)).toStrictEqual(
            expectedRootTaskCommands
        );
        expect(new Set(taskCommands)).toStrictEqual(new Set(["npm"]));
        expect(new Set(taskCwds)).toStrictEqual(
            new Set(["${workspaceFolder}"])
        );
        expect(tasks.filter(delegatesToElectronAppPackage)).toStrictEqual([]);
    });

    it("keeps lint app task using the root lint script", () => {
        expect.assertions(1);

        expect(
            getTaskByLabel(readVsCodeTasks(), "lint app from root")
        ).toMatchObject({
            args: ["run", "lint:app"],
            command: "npm",
            options: {
                cwd: "${workspaceFolder}",
            },
        });
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

    it("keeps generated output hidden from editor views", () => {
        expect.assertions(1);

        const settings = readVsCodeSettings();
        const generatedOutputExcludes = {
            ".cache": true,
            artifacts: true,
            coverage: true,
            dist: true,
            "FitFileViewer*.flatpak": true,
            "FitFileViewer*.flatpak.zip": true,
            types: true,
            "flatpak-build-dir": true,
            "flatpak-repo": true,
            html: true,
            logs: true,
            out: true,
            "playwright-report": true,
            "release-dist": true,
            temp: true,
            "test-results": true,
        };

        expect({
            filesExclude: settings["files.exclude"],
            searchExclude: settings["search.exclude"],
        }).toStrictEqual({
            filesExclude: {
                ...generatedOutputExcludes,
                "**/.git": false,
            },
            searchExclude: generatedOutputExcludes,
        });
    });
});
