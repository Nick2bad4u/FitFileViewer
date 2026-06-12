import { startPreloadScript } from "./preloadBootstrap.js";

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
    startPreloadEntrypoint();
}

export function startPreloadEntrypoint(
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
    });
}
