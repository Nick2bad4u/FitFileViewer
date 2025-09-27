import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const MODULE_SPECIFIER = "../../../../../utils/theming/core/setupTheme.js";

const stateManagerMocks = vi.hoisted(() => {
    return {
        getState: vi.fn<(key: string) => unknown>(() => undefined),
        setState: vi.fn<(key: string, value: unknown, meta?: unknown) => void>(),
        subscribe: vi.fn<(key: string, handler: (value: unknown) => void) => void>(),
    };
});

vi.mock("../../../../../utils/state/core/stateManager.js", () => stateManagerMocks);

describe("setupTheme", () => {
    const originalConsole = {
        error: console.error,
        warn: console.warn,
        log: console.log,
    };
    let subscribeHandlers: Array<(theme: unknown) => void>;
    let externalListener: ((theme: unknown) => void) | null;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        stateManagerMocks.getState.mockImplementation(() => undefined);
        stateManagerMocks.setState.mockImplementation(() => undefined);
        subscribeHandlers = [];
        externalListener = null;
        stateManagerMocks.subscribe.mockImplementation((_key, handler) => {
            subscribeHandlers.push(handler);
        });
        localStorage.clear();
        (globalThis as any).electronAPI = undefined;
        console.error = vi.fn();
        console.warn = vi.fn();
        console.log = vi.fn();
    });

    afterEach(() => {
        (globalThis as any).electronAPI = undefined;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.log = originalConsole.log;
    });

    it("applies theme from main process and reacts to change events", async () => {
        const applyTheme = vi.fn();
        (globalThis as any).electronAPI = {
            getTheme: vi.fn().mockResolvedValue("light"),
        };
        const listenForThemeChange = vi.fn((callback: (theme: unknown) => void) => {
            externalListener = callback;
        });

    const { setupTheme } = await import(MODULE_SPECIFIER);
        const result = await setupTheme(applyTheme, listenForThemeChange);

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(stateManagerMocks.setState).toHaveBeenCalledWith("ui.theme", "light", { source: "setupTheme" });
        expect(localStorage.getItem("fitFileViewer_theme")).toBe("light");
        expect(stateManagerMocks.subscribe).toHaveBeenCalledWith("ui.theme", expect.any(Function));
        expect(listenForThemeChange).toHaveBeenCalledWith(expect.any(Function));

        // simulate external change notification
        expect(externalListener).not.toBeNull();
        externalListener?.("dark");
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(localStorage.getItem("fitFileViewer_theme")).toBe("dark");

        // simulate state-driven change
        const handler = subscribeHandlers[0];
        expect(handler).toBeTypeOf("function");
        stateManagerMocks.getState.mockReturnValueOnce("light");
        handler?.("auto");
        expect(stateManagerMocks.setState).toHaveBeenCalledWith("ui.previousTheme", "auto", { source: "setupTheme" });
        expect(applyTheme).toHaveBeenCalledWith("auto");
    });

    it("uses stored theme when main process returns default", async () => {
        const applyTheme = vi.fn();
        (globalThis as any).electronAPI = {
            getTheme: vi.fn().mockResolvedValue("dark"),
        };
        localStorage.setItem("fitFileViewer_theme", "light");

    const { setupTheme } = await import(MODULE_SPECIFIER);
        const result = await setupTheme(applyTheme, undefined);

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(localStorage.getItem("fitFileViewer_theme")).toBe("light");
    });

    it("defaults to stored theme when electron API is unavailable", async () => {
        const applyTheme = vi.fn();
        (globalThis as any).electronAPI = undefined;
        localStorage.setItem("fitFileViewer_theme", "light");

        const { setupTheme } = await import(MODULE_SPECIFIER);
        const result = await setupTheme(applyTheme, undefined);

        expect(result).toBe("light");
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("getTheme not available"));
    });

    it("logs warning when localStorage access fails", async () => {
        const applyTheme = vi.fn();
        (globalThis as any).electronAPI = {
            getTheme: vi.fn().mockResolvedValue("dark"),
        };
        const storageProto = Object.getPrototypeOf(localStorage) as Storage;
        const getItemSpy = vi.spyOn(storageProto, "getItem").mockImplementation(() => {
            throw new Error("storage failure");
        });

        try {
            const { setupTheme } = await import(MODULE_SPECIFIER);
            const result = await setupTheme(applyTheme, undefined);

            expect(result).toBe("dark");
            expect(applyTheme).toHaveBeenCalledWith("dark");
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Failed to read from localStorage"));
        } finally {
            getItemSpy.mockRestore();
        }
    });

    it("returns default theme when applyTheme is invalid", async () => {
        (globalThis as any).electronAPI = {
            getTheme: vi.fn().mockResolvedValue("light"),
        };

    const { setupTheme } = await import(MODULE_SPECIFIER);
        const result = await setupTheme(undefined as unknown as (theme: string) => void);

        expect(result).toBe("dark");
        expect(console.error).toHaveBeenCalled();
    });
});
