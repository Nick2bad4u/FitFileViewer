interface PreloadRuntimeEnvironment {
    consoleRef: Console;
    processRef: NodeJS.Process;
}

export function getDefaultPreloadRuntimeEnvironment(): PreloadRuntimeEnvironment {
    return {
        consoleRef: console,
        processRef: process,
    };
}
