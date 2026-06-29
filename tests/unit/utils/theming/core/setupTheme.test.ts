import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

const stateManagerMocks = vi.hoisted(() => {
    return {
        getState: vi.fn<(key: string) => unknown>(() => undefined),
        setState:
            vi.fn<(key: string, value: unknown, meta?: unknown) => void>(),
        subscribe:
            vi.fn<(key: string, handler: (value: unknown) => void) => void>(),
    };
});

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => stateManagerMocks
);

async function importSetupThemeModule() {
    return import("../../../../../electron-app/utils/theming/core/setupTheme.js");
}

type SetupThemeElectronApi = {
    getTheme: ReturnType<typeof vi.fn<() => Promise<string>>>;
};

function createElectronApiScope(
    api: SetupThemeElectronApi
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

describe("setupTheme", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let subscribeHandlers: Array<(theme: unknown) => void>;
    let externalListener: ((theme: unknown) => void) | null;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        stateManagerMocks.getState.mockReturnValue(undefined);
        stateManagerMocks.setState.mockReturnValue(undefined);
        subscribeHandlers = [];
        externalListener = null;
        stateManagerMocks.subscribe.mockImplementation((_key, handler) => {
            subscribeHandlers.push(handler);
        });
        localStorage.clear();
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    function requireValue<T>(value: T | null | undefined, message: string): T {
        if (value === null || value === undefined) {
            throw new Error(message);
        }

        return value;
    }

    it("applies theme from main process and reacts to change events", async () => {
        expect.assertions(12);

        const applyTheme = vi.fn<(theme: string) => void>();
        const electronApiScope = createElectronApiScope({
            getTheme: vi.fn<() => Promise<string>>().mockResolvedValue("light"),
        });
        const listenForThemeChange = vi.fn<
            (callback: (theme: unknown) => void) => void
        >((callback: (theme: unknown) => void) => {
            externalListener = callback;
        });

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(applyTheme, listenForThemeChange, {
            electronApiScope,
        });

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(stateManagerMocks.setState).toHaveBeenCalledWith(
            "ui.theme",
            "light",
            { source: "setupTheme" }
        );
        expect(localStorage.getItem("ffv-theme")).toBe("light");
        expect(stateManagerMocks.subscribe).toHaveBeenCalledWith(
            "ui.theme",
            expect.any(Function)
        );
        expect(listenForThemeChange).toHaveBeenCalledWith(
            expect.any(Function),
            { electronApiScope }
        );

        // simulate external change notification
        expect(externalListener).toBeTypeOf("function");
        const handleExternalThemeChange = requireValue(
            externalListener,
            "Theme change listener was not registered"
        );
        handleExternalThemeChange("dark");
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(localStorage.getItem("ffv-theme")).toBe("dark");

        // simulate state-driven change
        const handler = subscribeHandlers[0];
        expect(handler).toBeTypeOf("function");
        stateManagerMocks.getState.mockReturnValueOnce("light");
        handler?.("auto");
        expect(stateManagerMocks.setState).toHaveBeenCalledWith(
            "ui.previousTheme",
            "system",
            { source: "setupTheme" }
        );
        expect(applyTheme).toHaveBeenCalledWith("auto");
    });

    it("uses stored theme when main process returns default", async () => {
        expect.assertions(3);

        const applyTheme = vi.fn<(theme: string) => void>();
        const electronApiScope = createElectronApiScope({
            getTheme: vi.fn<() => Promise<string>>().mockResolvedValue("dark"),
        });
        localStorage.setItem("ffv-theme", "light");

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(applyTheme, undefined, {
            electronApiScope,
        });

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(localStorage.getItem("ffv-theme")).toBe("light");
    });

    it("defaults to stored theme when electron API is unavailable", async () => {
        expect.assertions(3);

        const applyTheme = vi.fn<(theme: string) => void>();
        localStorage.setItem("ffv-theme", "light");

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(applyTheme, undefined);

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "[ThemeSetup] ElectronAPI getTheme not available, using default theme"
        );
    });

    it("rejects malformed scoped getTheme values and falls back to default theme", async () => {
        expect.assertions(4);

        const applyTheme = vi.fn<(theme: string) => void>();
        const getElectronAPI = vi.fn<() => unknown>(() => ({
            getTheme: "light",
        }));
        const electronApiScope: RendererElectronApiScope = {
            getElectronAPI,
        };

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(applyTheme, undefined, {
            electronApiScope,
        });

        expect(result).toBe("dark");
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "[ThemeSetup] ElectronAPI getTheme not available, using default theme"
        );
    });

    it("rejects missing scoped getTheme values and falls back to default theme", async () => {
        expect.assertions(4);

        const applyTheme = vi.fn<(theme: string) => void>();
        const getElectronAPI = vi.fn<() => unknown>(() => ({}));
        const electronApiScope: RendererElectronApiScope = {
            getElectronAPI,
        };

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(applyTheme, undefined, {
            electronApiScope,
        });

        expect(result).toBe("dark");
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "[ThemeSetup] ElectronAPI getTheme not available, using default theme"
        );
    });

    it("logs warning when localStorage access fails", async () => {
        expect.assertions(3);

        const applyTheme = vi.fn<(theme: string) => void>();
        const electronApiScope = createElectronApiScope({
            getTheme: vi.fn<() => Promise<string>>().mockResolvedValue("dark"),
        });
        const storageProto = Object.getPrototypeOf(localStorage) as Storage;
        const getItemSpy = vi
            .spyOn(storageProto, "getItem")
            .mockImplementation(() => {
                throw new Error("storage failure");
            });

        try {
            const { setupTheme } = await importSetupThemeModule();
            const result = await setupTheme(applyTheme, undefined, {
                electronApiScope,
            });

            expect(result).toBe("dark");
            expect(applyTheme).toHaveBeenCalledWith("dark");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ThemeSetup] Failed to read from localStorage: storage failure"
            );
        } finally {
            getItemSpy.mockRestore();
        }
    });

    it("returns default theme when applyTheme is invalid", async () => {
        expect.assertions(2);

        const { setupTheme } = await importSetupThemeModule();
        const result = await setupTheme(
            undefined as unknown as (theme: string) => void
        );

        expect(result).toBe("dark");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[ThemeSetup] Error during theme setup: applyTheme must be a function"
        );
    });
});
