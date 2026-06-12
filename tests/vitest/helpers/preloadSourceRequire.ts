import fs from "node:fs";
import Module, { createRequire } from "node:module";
import path from "node:path";

import ts from "typescript";

const transformedPreloadSourceModules = new Map<string, unknown>();

type CompilableCommonJsModule = NodeJS.Module & {
    _compile: (code: string, filename: string) => void;
    filename: string;
    paths: string[];
};

type CommonJsModuleConstructor = {
    new (id: string): CompilableCommonJsModule;
    _nodeModulePaths: (from: string) => string[];
};

const CommonJsModule = Module as unknown as CommonJsModuleConstructor;

export function createPreloadSourceRequire(
    filename = path.join(process.cwd(), "electron-app", "preload.ts")
): NodeJS.Require {
    const baseRequire = createRequire(filename);
    const preloadRequire = ((moduleId: string) => {
        const resolvedModulePath = baseRequire.resolve(moduleId);
        if (
            isPreloadTypeScriptSource(resolvedModulePath) &&
            hasTypeScriptSourceExport(resolvedModulePath)
        ) {
            return loadTransformedPreloadSourceModule(resolvedModulePath);
        }

        return baseRequire(moduleId);
    }) as NodeJS.Require;

    Object.assign(preloadRequire, baseRequire);
    return preloadRequire;
}

function loadTransformedPreloadSourceModule(filename: string): unknown {
    const cachedModule = transformedPreloadSourceModules.get(filename);
    if (cachedModule) {
        return cachedModule;
    }

    const moduleSource = fs.readFileSync(filename, "utf8");
    const compiledModule = new CommonJsModule(filename);
    compiledModule.filename = filename;
    compiledModule.paths = CommonJsModule._nodeModulePaths(
        path.dirname(filename)
    );

    const { outputText } = ts.transpileModule(moduleSource, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2024,
        },
        fileName: filename,
    });
    compiledModule._compile(outputText, filename);
    transformedPreloadSourceModules.set(filename, compiledModule.exports);

    return compiledModule.exports;
}

function isPreloadTypeScriptSource(filename: string): boolean {
    const preloadRoot = path.join(process.cwd(), "electron-app", "preload");
    const relativePath = path.relative(preloadRoot, filename);

    return (
        !path.isAbsolute(relativePath) &&
        !relativePath.startsWith("..") &&
        path.extname(filename) === ".ts"
    );
}

function hasTypeScriptSourceExport(filename: string): boolean {
    return /\bexport\s+(?:async\s+)?(?:class|const|function|interface|let|type|var)\b/u.test(
        fs.readFileSync(filename, "utf8")
    );
}
