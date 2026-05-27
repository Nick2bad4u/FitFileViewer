import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import prettier from "prettier";

import { repositoryRoot as defaultRepositoryRoot } from "./lib/workspaces.mjs";

export const runtimeTsconfigPath = path.join(
    defaultRepositoryRoot,
    "tsconfig.runtime.json"
);

export function resolveOutputPath(
    tsconfig,
    file,
    repositoryRoot = defaultRepositoryRoot
) {
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
        path.resolve(repositoryRoot, rootDir),
        path.resolve(repositoryRoot, file)
    );

    return path.join(
        repositoryRoot,
        outDir,
        relativeToRoot.replace(/\.ts$/u, ".js")
    );
}

export function readRuntimeOutputFiles({
    fileSystem = fs,
    repositoryRoot = defaultRepositoryRoot,
    tsconfigPath = runtimeTsconfigPath,
} = {}) {
    const tsconfig = JSON.parse(fileSystem.readFileSync(tsconfigPath, "utf8"));

    if (!Array.isArray(tsconfig.files)) {
        throw new TypeError("tsconfig.runtime.json must contain a files array");
    }

    return tsconfig.files
        .filter((file) => typeof file === "string" && file.endsWith(".ts"))
        .map((file) => resolveOutputPath(tsconfig, file, repositoryRoot))
        .filter((file) => fileSystem.existsSync(file));
}

export async function formatRuntimeOutputFile(
    file,
    { fileSystem = fs, prettierModule = prettier } = {}
) {
    let source;
    try {
        source = fileSystem.readFileSync(file, "utf8");
    } catch (error) {
        if (error && error.code === "ENOENT") {
            return;
        }

        throw error;
    }

    const options = (await prettierModule.resolveConfig(file)) ?? {};
    const formatted = await prettierModule.format(source, {
        ...options,
        filepath: file,
    });

    if (formatted !== source) {
        fileSystem.mkdirSync(path.dirname(file), { recursive: true });
        fileSystem.writeFileSync(file, formatted);
    }
}

export async function formatRuntimeOutputFiles(files, options = {}) {
    for (const file of files) {
        await formatRuntimeOutputFile(file, options);
    }
}

export async function runFormatRuntimeOutput(options = {}) {
    await formatRuntimeOutputFiles(readRuntimeOutputFiles(options), options);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await runFormatRuntimeOutput();
}
