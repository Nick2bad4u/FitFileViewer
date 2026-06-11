{
    interface PreloadRuntimeEnvironment {
        consoleRef: Console;
        globalScope: object;
        processRef: NodeJS.Process;
    }

    function getDefaultPreloadRuntimeEnvironment(): PreloadRuntimeEnvironment {
        return {
            consoleRef: console,
            globalScope: globalThis,
            processRef: process,
        };
    }

    module.exports = {
        getDefaultPreloadRuntimeEnvironment,
    };
}
