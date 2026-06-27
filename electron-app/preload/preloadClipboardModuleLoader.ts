import { createClipboardBridge } from "./clipboardBridge.js";

type PreloadClipboardModules =
    import("./preloadAssemblyTypes").PreloadClipboardModules;

export function loadPreloadClipboardModules(): PreloadClipboardModules {
    return {
        createClipboardBridge,
    };
}
