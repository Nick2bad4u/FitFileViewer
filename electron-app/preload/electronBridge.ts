{
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
        globalScope?: object;
        requireModule: (moduleId: string) => unknown;
    }

    const ELECTRON_MODULE_ID = ["electron"].join("");

    function getModuleLoadError(error: unknown): Error {
        return error instanceof Error
            ? error
            : new Error("Module loading failed");
    }

    function getOverride(
        globalScope: object
    ): null | PreloadElectronBridge | undefined {
        return Reflect.get(globalScope, "__electronHoistedMock") as
            | null
            | PreloadElectronBridge
            | undefined;
    }

    function isPreloadObjectRecord(
        value: unknown
    ): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    function loadElectronBridge(
        requireModule: (moduleId: string) => unknown
    ): null | PreloadElectronBridge {
        const electronModule = requireModule(ELECTRON_MODULE_ID);

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
            if (overridePart !== null && overridePart !== undefined) {
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

    function resolvePreloadElectronBridge({
        globalScope = globalThis,
        requireModule,
    }: ResolvePreloadElectronBridgeOptions): PreloadElectronBridgeResolution {
        const override = getOverride(globalScope) ?? null;
        const loadBridge = () => loadElectronBridge(requireModule);

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

    function unwrapElectronBridge(
        value: unknown
    ): null | PreloadElectronBridge {
        if (!isPreloadObjectRecord(value)) {
            return null;
        }

        if ("contextBridge" in value || "ipcRenderer" in value) {
            return value as PreloadElectronBridge;
        }

        if ("default" in value) {
            return unwrapElectronBridge(value["default"]);
        }

        return value as PreloadElectronBridge;
    }

    module.exports = {
        resolvePreloadElectronBridge,
    };
}
