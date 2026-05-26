import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const tsconfigPath = path.join(repositoryRoot, "tsconfig.runtime.json");

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
        path.resolve(repositoryRoot, rootDir),
        path.resolve(repositoryRoot, file)
    );

    return path.join(
        repositoryRoot,
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

async function formatRuntimeOutputFile(file) {
    let source;
    try {
        source = fs.readFileSync(file, "utf8");
    } catch (error) {
        if (error && error.code === "ENOENT") {
            return;
        }

        throw error;
    }

    const options = (await prettier.resolveConfig(file)) ?? {};
    const formatted = await prettier.format(source, {
        ...options,
        filepath: file,
    });

    if (formatted !== source) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, formatted);
    }
}

async function runPrettier(files) {
    for (const file of files) {
        await formatRuntimeOutputFile(file);
    }
}

await runPrettier(readRuntimeOutputFiles());
