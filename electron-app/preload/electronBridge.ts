import * as electronModule from "electron";

interface PreloadContextBridge {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

interface PreloadElectronBridge {
    contextBridge?: null | PreloadContextBridge;
    default?: null | PreloadElectronBridge;
    ipcRenderer?: null | PreloadIpcRenderer;
}

interface PreloadElectronBridgeResolution {
    contextBridge: null | PreloadContextBridge | undefined;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
}

interface PreloadIpcRenderer {
    invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
    off?: (
        channel: string,
        listener: (event: object, ...args: unknown[]) => void
    ) => void;
    on?: (
        channel: string,
        listener: (event: object, ...args: unknown[]) => void
    ) => void;
    removeAllListeners?: (channel: string) => void;
    removeListener?: (
        channel: string,
        listener: (event: object, ...args: unknown[]) => void
    ) => void;
    send?: (channel: string, ...args: unknown[]) => void;
}

interface ResolvePreloadElectronBridgeOptions {
    electronBridgeOverride?: null | PreloadElectronBridge;
}

function getModuleLoadError(error: unknown): Error {
    return error instanceof Error ? error : new Error("Module loading failed");
}

function isPreloadObjectRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function loadElectronBridge(): null | PreloadElectronBridge {
    return unwrapElectronBridge(electronModule);
}

function resolveBridgePart<T>(
    override: null | PreloadElectronBridge,
    loadBridge: () => null | PreloadElectronBridge,
    pick: (bridge: PreloadElectronBridge) => null | T | undefined
): null | T | undefined {
    let lastError: unknown;
    try {
        const overridePart = override === null ? undefined : pick(override);
        if (overridePart !== undefined) {
            return overridePart;
        }

        const bridge = loadBridge();
        return bridge === null ? undefined : pick(bridge);
    } catch (error) {
        lastError = error;
    }

    if (override === null) {
        throw getModuleLoadError(lastError);
    }
    return null;
}

export function resolvePreloadElectronBridge({
    electronBridgeOverride,
}: ResolvePreloadElectronBridgeOptions): PreloadElectronBridgeResolution {
    const override =
        electronBridgeOverride === undefined ? null : electronBridgeOverride;
    const loadBridge = () => loadElectronBridge();

    return {
        contextBridge: resolveBridgePart(
            override,
            loadBridge,
            (bridge) => bridge.contextBridge
        ),
        ipcRenderer: resolveBridgePart(
            override,
            loadBridge,
            (bridge) => bridge.ipcRenderer
        ),
    };
}

function unwrapElectronBridge(value: unknown): null | PreloadElectronBridge {
    if (!isPreloadObjectRecord(value)) {
        return null;
    }

    if (
        value["contextBridge"] !== undefined ||
        value["ipcRenderer"] !== undefined
    ) {
        return value;
    }

    if (value["default"] !== undefined) {
        return unwrapElectronBridge(value["default"]);
    }

    return value;
}
