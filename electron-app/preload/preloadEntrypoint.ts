import { startPreloadScript } from "./preloadBootstrap.js";
import { getDefaultPreloadRuntimeEnvironment } from "./preloadRuntimeEnvironment.js";

type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadElectronBridge =
    import("./preloadModuleTypes").PreloadElectronBridge;

interface StartPreloadEntrypointOptions {
    consoleRef?: Console;
    electronBridgeOverride?: null | PreloadElectronBridge;
    globalScope?: object;
    processRef?: NodeJS.Process;
}

/** Starts the Electron preload script with the runtime Node globals. */
export function startDefaultPreloadEntrypoint(): void {
    startPreloadEntrypoint(
        require,
        getDefaultPreloadRuntimeEnvironment()
    );
}

export function startPreloadEntrypoint(
    requireModule: NodeJS.Require,
    {
        consoleRef,
        electronBridgeOverride,
        globalScope,
        processRef,
    }: StartPreloadEntrypointOptions = {}
): void {
    startPreloadScript({
        ...(consoleRef === undefined ? {} : { consoleRef }),
        ...(electronBridgeOverride === undefined
            ? {}
            : { electronBridgeOverride }),
        ...(globalScope === undefined ? {} : { globalScope }),
        ...(processRef === undefined ? {} : { processRef }),
        requireModule: requireModule as PreloadModuleRequire,
    });
}
