import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    formatRuntimeTsconfigIssues,
    runValidateRuntimeTsconfig,
    validateRuntimeTsconfigFiles,
} from "../../../scripts/validate-runtime-tsconfig.mjs";

const temporaryRoots: string[] = [];

type Logger = {
    error: (message: string) => void;
    log: (message: string) => void;
};

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-runtime-tsconfig-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeFile(repositoryRoot: string, relativePath: string): void {
    const absolutePath = path.join(repositoryRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, "export {};\n");
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

describe("validate-runtime-tsconfig script", () => {
    it("accepts the current runtime file list", () => {
        expect.assertions(1);

        expect(validateRuntimeTsconfigFiles()).toStrictEqual([]);
    });

    it("reports malformed, duplicated, and stale runtime entries", () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        writeFile(repositoryRoot, "electron-app/main.ts");

        expect(
            validateRuntimeTsconfigFiles({
                repositoryRoot,
                tsconfig: {
                    files: [
                        "electron-app/main.ts",
                        "electron-app/main.ts",
                        "electron-app/missing.ts",
                        "electron-app/legacy.js",
                        42,
                    ],
                },
            })
        ).toStrictEqual([
            {
                file: "electron-app/main.ts",
                reason: "runtime file entry is duplicated",
            },
            {
                file: "electron-app/missing.ts",
                reason: "runtime file entry does not exist",
            },
            {
                file: "electron-app/legacy.js",
                reason: "runtime file entries must be TypeScript source files",
            },
            {
                file: "electron-app/legacy.js",
                reason: "runtime file entry does not exist",
            },
            {
                file: "42",
                reason: "runtime file entries must be strings",
            },
        ]);
    });

    it("reports preload modules missing from the runtime file list", () => {
        expect.assertions(1);

        const repositoryRoot = makeTemporaryRoot();
        writeFile(repositoryRoot, "electron-app/main.ts");
        writeFile(repositoryRoot, "electron-app/preload/fileApiDomain.ts");

        expect(
            validateRuntimeTsconfigFiles({
                repositoryRoot,
                tsconfig: {
                    files: ["electron-app/main.ts"],
                },
            })
        ).toStrictEqual([
            {
                file: "electron-app/preload/fileApiDomain.ts",
                reason: "preload runtime source file is missing from tsconfig.runtime.json",
            },
        ]);
    });

    it("formats runtime file list issues for CLI output", () => {
        expect.assertions(1);

        expect(
            formatRuntimeTsconfigIssues([
                {
                    file: "electron-app/missing.ts",
                    reason: "runtime file entry does not exist",
                },
            ])
        ).toBe("- electron-app/missing.ts: runtime file entry does not exist");
    });

    it("returns nonzero and logs issues for invalid runtime configs", () => {
        expect.assertions(2);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");
        const logger: Logger = {
            error: vi.fn<Logger["error"]>(),
            log: vi.fn<Logger["log"]>(),
        };
        writeJson(tsconfigPath, {
            files: ["electron-app/missing.ts"],
        });

        const status = runValidateRuntimeTsconfig({
            logger,
            repositoryRoot,
            tsconfigPath,
        });

        expect(status).toBe(1);
        expect(logger.error).toHaveBeenCalledWith(
            "[validate-runtime-tsconfig] Found 1 runtime file list issue(s):\n- electron-app/missing.ts: runtime file entry does not exist"
        );
    });

    it("returns zero and logs success for valid runtime configs", () => {
        expect.assertions(2);

        const repositoryRoot = makeTemporaryRoot();
        const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");
        const logger: Logger = {
            error: vi.fn<Logger["error"]>(),
            log: vi.fn<Logger["log"]>(),
        };
        writeFile(repositoryRoot, "electron-app/main.ts");
        writeJson(tsconfigPath, {
            files: ["electron-app/main.ts"],
        });

        const status = runValidateRuntimeTsconfig({
            logger,
            repositoryRoot,
            tsconfigPath,
        });

        expect(status).toBe(0);
        expect(logger.log).toHaveBeenCalledWith(
            "[validate-runtime-tsconfig] Runtime file list is valid."
        );
    });
});
