import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const electronAppDir = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const tsconfigPath = path.join(electronAppDir, "tsconfig.runtime.json");
const prettierBin = require.resolve("prettier/bin/prettier.cjs");
const batchSize = 40;

function resolveOutputPath(tsconfig, file) {
    const compilerOptions =
        tsconfig && typeof tsconfig === "object"
            ? tsconfig.compilerOptions
            : undefined;
    const outDir =
        compilerOptions &&
        typeof compilerOptions === "object" &&
        typeof compilerOptions.outDir === "string"
            ? compilerOptions.outDir
            : ".";
    const rootDir =
        compilerOptions &&
        typeof compilerOptions === "object" &&
        typeof compilerOptions.rootDir === "string"
            ? compilerOptions.rootDir
            : ".";
    const relativeToRoot = path.relative(
        path.resolve(electronAppDir, rootDir),
        path.resolve(electronAppDir, file)
    );

    return path.join(
        electronAppDir,
        outDir,
        relativeToRoot.replace(/\.ts$/u, ".js")
    );
}

function readRuntimeOutputFiles() {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

    if (!Array.isArray(tsconfig.files)) {
        throw new TypeError("tsconfig.runtime.json must contain a files array");
    }

    return tsconfig.files
        .filter((file) => typeof file === "string" && file.endsWith(".ts"))
        .map((file) => resolveOutputPath(tsconfig, file))
        .filter((file) => fs.existsSync(file));
}

function runPrettier(files) {
    for (let index = 0; index < files.length; index += batchSize) {
        const batch = files.slice(index, index + batchSize);
        const result = spawnSync(
            process.execPath,
            [
                prettierBin,
                "--write",
                ...batch,
            ],
            {
                cwd: electronAppDir,
                stdio: "inherit",
            }
        );

        if (result.error) {
            console.error(
                "format-runtime-output: failed to run prettier",
                result.error
            );
            process.exit(1);
        }

        if (result.status !== 0) {
            process.exit(result.status ?? 1);
        }
    }
}

runPrettier(readRuntimeOutputFiles());
