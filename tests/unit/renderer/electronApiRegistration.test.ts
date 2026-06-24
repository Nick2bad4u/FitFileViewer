import { afterEach, describe, expect, it, vi } from "vitest";

import {
    installRendererElectronApiRegistration,
    registerRendererElectronAPI,
} from "../../../electron-app/renderer/electronApiRegistration.js";
import { getRendererElectronApi } from "../../../electron-app/utils/runtime/electronApiRuntime.js";

function createOptions() {
    const state = {
        menuActions: [] as unknown[],
        scheduledCount: 0,
        themeChanges: [] as string[],
    };
    const options = {
        electronApiCandidate: undefined,
        onMenuAction: (action: unknown) => {
            state.menuActions.push(action);
        },
        onThemeChanged: (theme: string) => {
            state.themeChanges.push(theme);
        },
        removeEventListener: vi.fn(),
        scheduleStateInitialization: () => {
            state.scheduledCount += 1;
        },
    };

    return { options, state };
}

function createElectronApi() {
    let menuCallback: ((action: unknown) => void) | undefined;
    let themeCallback: ((theme: string) => void) | undefined;
    const isDevelopment = vi.fn<() => Promise<boolean>>(() =>
        Promise.resolve(true)
    );

    return {
        api: {
            isDevelopment,
            onMenuAction(callback: (action: unknown) => void): void {
                menuCallback = callback;
            },
            onThemeChanged(callback: (theme: string) => void): void {
                themeCallback = callback;
            },
        },
        emitMenu(action: unknown): void {
            menuCallback?.(action);
        },
        emitTheme(theme: string): void {
            themeCallback?.(theme);
        },
        isDevelopment,
    };
}

describe("renderer Electron API registration", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("registers menu, theme, and development hooks without seeding the shared fallback", async () => {
        expect.assertions(5);

        const { api, emitMenu, emitTheme, isDevelopment } = createElectronApi();
        const { options, state } = createOptions();

        registerRendererElectronAPI(api, options);
        emitMenu("about");
        emitTheme("dark");
        await Promise.resolve();

        expect(state.menuActions).toStrictEqual(["about"]);
        expect(state.themeChanges).toStrictEqual(["dark"]);
        expect(state.scheduledCount).toBe(1);
        expect(isDevelopment).toHaveBeenCalledOnce();
        expect(
            getRendererElectronApi(
                (value): value is typeof api => value === api
            )
        ).toBeNull();
    });

    it("registers the captured Electron API candidate without installing a production global proxy", async () => {
        expect.assertions(5);

        const scope = {} as typeof globalThis;
        const { api, emitMenu, isDevelopment } = createElectronApi();
        const { options, state } = createOptions();

        installRendererElectronApiRegistration({
            ...options,
            electronApiCandidate: api,
        });
        emitMenu("open-file");
        await Promise.resolve();

        expect(state.menuActions).toStrictEqual(["open-file"]);
        expect(state.scheduledCount).toBe(1);
        expect(isDevelopment).toHaveBeenCalledOnce();
        expect(Reflect.get(scope, "electronAPI")).toBeUndefined();
        expect(
            getRendererElectronApi(
                (value): value is typeof api => value === api
            )
        ).toBeNull();
    });

    it("ignores ambient globals during registration", () => {
        expect.assertions(3);

        const originalDefineProperty = Object.defineProperty;
        const testGlobal = {
            unrelatedGlobalState: new Map(),
            electronAPI: createElectronApi().api,
        };
        const { options, state } = createOptions();

        installRendererElectronApiRegistration(options);

        expect(Object.defineProperty).toBe(originalDefineProperty);
        expect(state.menuActions).toStrictEqual([]);
        expect(Reflect.get(testGlobal, "electronAPI")).toBeDefined();
    });
});
