import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type VsCodeTask = {
    args?: string[];
    command?: string;
    label?: string;
};

type VsCodeTasksJson = {
    tasks?: VsCodeTask[];
};

function readVsCodeTasks(): VsCodeTask[] {
    const tasksJson = JSON.parse(
        readFileSync(path.join(process.cwd(), ".vscode", "tasks.json"), "utf8")
    ) as VsCodeTasksJson;

    return tasksJson.tasks ?? [];
}

describe("vs code workspace tasks", () => {
    it("keeps editor tasks aligned with root-owned npm scripts", () => {
        expect.assertions(4);

        const tasks = readVsCodeTasks();
        const taskLabels = tasks.map((task) => task.label);
        const taskCommands = tasks.map((task) => task.command);
        const taskArgs = tasks.flatMap((task) => task.args ?? []);

        expect(taskLabels).toStrictEqual([
            "build runtime from root",
            "test from root",
            "lint electron app from root",
            "typecheck from root",
        ]);
        expect(new Set(taskCommands)).toStrictEqual(new Set(["npm"]));
        expect(taskArgs).not.toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^electron-app[\\/]tests[\\/]/u),
            ])
        );
        expect(taskArgs.join(" ")).not.toMatch(
            /(?:--workspace|--prefix|-w)\s+electron-app/u
        );
    });
});
