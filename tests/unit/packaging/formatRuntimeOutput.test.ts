import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    formatRuntimeOutputFile,
    readRuntimeOutputFiles,
    resolveOutputPath,
    runFormatRuntimeOutput,
} from "../../../scripts/format-runtime-output.mjs";

const temporaryRoots: string[] = [];

type FakePrettier = {
    format: (source: string, options: { filepath: string }) => Promise<string>;
    resolveConfig: (file: string) => Promise<Record<string, unknown>>;
};

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-runtime-format-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, undefined, 4)}\n`);
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("format-runtime-output script", () => {
    it("resolves emitted JavaScript paths from the runtime tsconfig shape", () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfig = {
            compilerOptions: {
                outDir: "electron-app/dist",
                rootDir: "electron-app",
            },
        };

        expect(
            resolveOutputPath(
                tsconfig,
                "electron-app/utils/example.ts",
                repositoryRoot
            )
        ).toBe(
            path.join(
                repositoryRoot,
                "electron-app",
                "dist",
                "utils",
                "example.js"
            )
        );
    });

    it("finds existing runtime output files for TypeScript entries only", () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");
        const existingOutput = path.join(
            repositoryRoot,
            "electron-app",
            "dist",
            "main.js"
        );
        writeJson(tsconfigPath, {
            compilerOptions: {
                outDir: "electron-app/dist",
                rootDir: "electron-app",
            },
            files: [
                "electron-app/main.ts",
                "electron-app/missing.ts",
                "electron-app/legacy.js",
            ],
        });
        fs.mkdirSync(path.dirname(existingOutput), { recursive: true });
        fs.writeFileSync(existingOutput, "const value=1;");

        expect(
            readRuntimeOutputFiles({ repositoryRoot, tsconfigPath })
        ).toStrictEqual([existingOutput]);
    });

    it("rejects runtime tsconfigs without a files array", () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");
        writeJson(tsconfigPath, { compilerOptions: {} });

        expect(() =>
            readRuntimeOutputFiles({ repositoryRoot, tsconfigPath })
        ).toThrow("tsconfig.runtime.json must contain a files array");
    });

    it("formats a runtime output file using resolved Prettier options", async () => {
        expect.assertions(4);

        const repositoryRoot = makeTemporaryRoot();
        const outputFile = path.join(
            repositoryRoot,
            "electron-app",
            "dist",
            "main.js"
        );
        const prettierModule: FakePrettier = {
            format: vi.fn<FakePrettier["format"]>(
                async (source: string) => `${source.trim()}\n`
            ),
            resolveConfig: vi.fn<FakePrettier["resolveConfig"]>(async () => ({
                tabWidth: 4,
            })),
        };

        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, "const value = 1;   ");

        await formatRuntimeOutputFile(outputFile, { prettierModule });

        expect(fs.readFileSync(outputFile, "utf8")).toBe("const value = 1;\n");
        expect(prettierModule.resolveConfig).toHaveBeenCalledWith(outputFile);
        expect(prettierModule.format).toHaveBeenCalledOnce();
        expect(vi.mocked(prettierModule.format).mock.calls[0]).toStrictEqual([
            "const value = 1;   ",
            {
                filepath: outputFile,
                tabWidth: 4,
            },
        ]);
    });

    it("formats all discovered runtime outputs", async () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");
        const outputFile = path.join(
            repositoryRoot,
            "electron-app",
            "dist",
            "main.js"
        );
        const prettierModule: FakePrettier = {
            format: vi.fn<FakePrettier["format"]>(async (source: string) =>
                source.replace("=1", "= 1")
            ),
            resolveConfig: vi.fn<FakePrettier["resolveConfig"]>(
                async () => ({})
            ),
        };

        writeJson(tsconfigPath, {
            compilerOptions: {
                outDir: "electron-app/dist",
                rootDir: "electron-app",
            },
            files: ["electron-app/main.ts"],
        });
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, "const value=1;");

        await runFormatRuntimeOutput({
            prettierModule,
            repositoryRoot,
            tsconfigPath,
        });

        expect(fs.readFileSync(outputFile, "utf8")).toBe("const value= 1;");
    });
});
