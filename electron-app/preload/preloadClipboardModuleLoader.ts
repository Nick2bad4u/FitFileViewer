import { createClipboardBridge } from "./clipboardBridge.js";

type PreloadClipboardModules =
    import("./preloadModuleTypes").PreloadClipboardModules;

export function loadPreloadClipboardModules(): PreloadClipboardModules {
    return {
        createClipboardBridge,
    };
}
