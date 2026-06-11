import { afterEach, describe, expect, it, vi } from "vitest";

import {
    installElectronAPIDefinePropertyInterceptor,
    installRendererElectronApiRegistration,
    installRendererElectronAPIProxy,
    isVitestManualMockEnvironment,
    registerRendererElectronAPI,
    registerRendererElectronAPIFromPropertyDescriptor,
    startRendererElectronAPITestPolling,
} from "../../../electron-app/renderer/electronApiRegistration.js";
import {
    getRendererElectronApi,
    resetRendererElectronApiCandidate,
} from "../../../electron-app/utils/runtime/electronApiRuntime.js";

function createOptions(scope: typeof globalThis = {} as typeof globalThis) {
    const state = {
        clearedInterval: undefined as number | undefined,
        intervalCallback: undefined as (() => void) | undefined,
        menuActions: [] as unknown[],
        scheduledCount: 0,
        themeChanges: [] as string[],
        unloadHandler: undefined as (() => void) | undefined,
    };
    const options = {
        addEventListener: vi.fn((eventName: string, handler: EventListener) => {
            if (eventName === "beforeunload") {
                state.unloadHandler = handler as () => void;
            }
        }),
        clearInterval: vi.fn((handle: number) => {
            state.clearedInterval = handle;
        }),
        defineProperty: Object.defineProperty,
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
        scope,
        setInterval: vi.fn((callback: () => void) => {
            state.intervalCallback = callback;
            return 7;
        }),
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
    const originalDefineProperty = Object.defineProperty;

    afterEach(() => {
        Object.defineProperty = originalDefineProperty;
        resetRendererElectronApiCandidate();
        vi.restoreAllMocks();
    });

    it("registers menu, theme, and development hooks from an Electron API", async () => {
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
        ).toBe(api);
    });

    it("registers the captured Electron API candidate without installing a production global proxy", async () => {
        expect.assertions(5);

        const scope = {} as typeof globalThis;
        const { api, emitMenu, isDevelopment } = createElectronApi();
        const { options, state } = createOptions(scope);

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
        ).toBe(api);
    });

    it("installs an electronAPI accessor that registers reassigned API values", () => {
        expect.assertions(3);

        const scope = {} as typeof globalThis;
        const { api, emitMenu } = createElectronApi();
        const { options, state } = createOptions(scope);

        installRendererElectronAPIProxy(options);
        Reflect.set(scope, "electronAPI", api);
        emitMenu("open-file");

        expect(Reflect.get(scope, "electronAPI")).toBe(api);
        expect(state.menuActions).toStrictEqual(["open-file"]);
        expect(state.scheduledCount).toBe(1);
    });

    it("intercepts test defineProperty electronAPI assignments", () => {
        expect.assertions(3);

        const scope = {} as typeof globalThis;
        const { api, emitTheme } = createElectronApi();
        const { options, state } = createOptions(scope);

        installElectronAPIDefinePropertyInterceptor(options);
        Object.defineProperty(scope, "electronAPI", {
            configurable: true,
            value: api,
        });
        emitTheme("light");

        expect(Reflect.get(scope, "electronAPI")).toBe(api);
        expect(state.themeChanges).toStrictEqual(["light"]);
        expect(state.scheduledCount).toBe(2);
    });

    it("polls Electron API changes in manual mock environments and cleans up on unload", () => {
        expect.assertions(4);

        const scope = {} as typeof globalThis;
        const { api, emitMenu } = createElectronApi();
        const { options, state } = createOptions(scope);

        startRendererElectronAPITestPolling(options);
        Reflect.set(scope, "electronAPI", api);
        state.intervalCallback?.();
        emitMenu("about");
        state.unloadHandler?.();

        expect(state.menuActions).toStrictEqual(["about"]);
        expect(state.scheduledCount).toBe(2);
        expect(state.clearedInterval).toBe(7);
        expect(options.removeEventListener).toHaveBeenCalledWith(
            "beforeunload",
            state.unloadHandler
        );
    });

    it("detects the Vitest manual mock registry marker", () => {
        expect.assertions(2);

        expect(isVitestManualMockEnvironment({} as typeof globalThis)).toBe(
            false
        );
        expect(
            isVitestManualMockEnvironment({
                __vitest_manual_mocks__: new Map(),
            } as unknown as typeof globalThis)
        ).toBe(true);
    });

    it("registers value property descriptors only", () => {
        expect.assertions(2);

        const { api } = createElectronApi();
        const { options, state } = createOptions();

        registerRendererElectronAPIFromPropertyDescriptor({}, options);
        registerRendererElectronAPIFromPropertyDescriptor(
            { value: api },
            options
        );

        expect(state.scheduledCount).toBe(2);
        expect(state.menuActions).toStrictEqual([]);
    });
});
