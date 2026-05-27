import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    apiDir,
    generateApiCategories,
    prettifyLabel,
} from "../../../scripts/generate-api-categories.mjs";

const temporaryRoots: string[] = [];

function makeTemporaryApiDir(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-generate-api-categories-")
    );
    const temporaryApiDir = path.join(temporaryRoot, "docs", "api");

    fs.mkdirSync(path.join(temporaryApiDir, "fitParser"), {
        recursive: true,
    });
    fs.mkdirSync(path.join(temporaryApiDir, "mainProcessStateClient"), {
        recursive: true,
    });
    temporaryRoots.push(temporaryRoot);

    return temporaryApiDir;
}

function readCategory(directory: string): { label: string } {
    return JSON.parse(
        fs.readFileSync(path.join(directory, "_category_.json"), "utf8")
    ) as { label: string };
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("generate-api-categories script", () => {
    it("uses the root-owned Docusaurus API docs path", () => {
        expect.assertions(2);

        expect(apiDir).toBe(
            path.join(process.cwd(), "docusaurus", "docs", "api")
        );
        expect(apiDir).not.toContain(`${path.sep}electron-app${path.sep}`);
    });

    it("prettifies generated API directory labels", () => {
        expect.assertions(4);

        expect(prettifyLabel("fitParser")).toBe("FIT Parser");
        expect(prettifyLabel("main-ui")).toBe("Main UI");
        expect(prettifyLabel("mainProcessStateClient")).toBe(
            "Main Process State Client"
        );
        expect(prettifyLabel("custom_moduleName")).toBe("Custom Module Name");
    });

    it("writes category files for the API root and child modules", async () => {
        expect.assertions(3);

        const temporaryApiDir = makeTemporaryApiDir();

        await generateApiCategories(temporaryApiDir);

        expect(readCategory(temporaryApiDir)).toStrictEqual({
            label: "Generated API Docs",
        });
        expect(
            readCategory(path.join(temporaryApiDir, "fitParser"))
        ).toStrictEqual({
            label: "FIT Parser",
        });
        expect(
            readCategory(path.join(temporaryApiDir, "mainProcessStateClient"))
        ).toStrictEqual({
            label: "Main Process State Client",
        });
    });
});
