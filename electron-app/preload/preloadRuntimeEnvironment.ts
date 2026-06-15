interface PreloadRuntimeEnvironment {
    consoleRef: Console;
    globalScope: object;
    processRef: NodeJS.Process;
}

export function getDefaultPreloadRuntimeEnvironment(): PreloadRuntimeEnvironment {
    return {
        consoleRef: console,
        globalScope: globalThis,
        processRef: process,
    };
}
