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

describe("renderer Electron API wiring", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("registers menu and theme callbacks through the composed Electron API wiring", async () => {
        expect.assertions(4);

        const fileInput = {
            click: vi.fn(),
        } as unknown as HTMLInputElement;
        const { api, emitMenuAction, emitThemeChanged } = createElectronApi();
        const applyTheme = vi.fn<(theme: string) => void>();
        const scheduleStateInitialization = vi.fn();

        installRendererElectronApiWiring({
            electronApiCandidate: api,
            ensureCoreModules: async () => ({ applyTheme }),
            getFileInput: () => fileInput,
            logRenderer: vi.fn(),
            scheduleStateInitialization,
        });

        emitMenuAction("open-file");
        emitThemeChanged("dark");
        await Promise.resolve();

        expect(fileInput.click).toHaveBeenCalledOnce();
        expect(applyTheme).toHaveBeenCalledExactlyOnceWith("dark");
        expect(scheduleStateInitialization).toHaveBeenCalled();
        expect(api.isDevelopment).toHaveBeenCalledOnce();
    });
});
