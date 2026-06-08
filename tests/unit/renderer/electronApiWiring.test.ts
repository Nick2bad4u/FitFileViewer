import { afterEach, describe, expect, it, vi } from "vitest";

import { installRendererElectronApiWiring } from "../../../electron-app/renderer/electronApiWiring.js";

function createElectronApi() {
    let menuCallback: ((action: unknown) => void) | undefined;
    let themeCallback: ((theme: string) => void) | undefined;

    return {
        api: {
            isDevelopment: vi.fn(async () => false),
            onMenuAction(callback: (action: unknown) => void): void {
                menuCallback = callback;
            },
            onThemeChanged(callback: (theme: string) => void): void {
                themeCallback = callback;
            },
        },
        emitMenuAction(action: unknown): void {
            menuCallback?.(action);
        },
        emitThemeChanged(theme: string): void {
            themeCallback?.(theme);
        },
    };
}

function callUnknownFunction(target: unknown, args: unknown[] = []): unknown {
    return typeof target === "function" ? target(...args) : undefined;
}

describe("renderer Electron API wiring", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("registers menu and theme callbacks through the composed Electron API wiring", async () => {
        expect.assertions(5);

        const fileInput = {
            click: vi.fn(),
        } as unknown as HTMLInputElement;
        const scope = {} as typeof globalThis;
        const { api, emitMenuAction, emitThemeChanged } = createElectronApi();
        const applyTheme = vi.fn<(theme: string) => void>();
        const scheduleStateInitialization = vi.fn();
        Reflect.set(scope, "electronAPI", api);

        installRendererElectronApiWiring({
            addEventListener: vi.fn(),
            callUnknownFunction,
            clearInterval: vi.fn(),
            defineProperty: Object.defineProperty,
            ensureCoreModules: async () => ({ applyTheme }),
            getFileInput: () => fileInput,
            logRenderer: vi.fn(),
            removeEventListener: vi.fn(),
            scheduleStateInitialization,
            scope,
            setInterval: vi.fn(),
        });

        emitMenuAction("open-file");
        emitThemeChanged("dark");
        await Promise.resolve();

        expect(fileInput.click).toHaveBeenCalledOnce();
        expect(applyTheme).toHaveBeenCalledExactlyOnceWith("dark");
        expect(scheduleStateInitialization).toHaveBeenCalled();
        expect(api.isDevelopment).toHaveBeenCalledTimes(2);
        expect(Reflect.get(scope, "electronAPI")).toBe(api);
    });
});
