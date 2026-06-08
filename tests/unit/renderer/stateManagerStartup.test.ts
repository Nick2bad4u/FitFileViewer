import { describe, expect, it, vi } from "vitest";

import { createRendererStateStartup } from "../../../electron-app/renderer/stateManagerStartup.js";

describe("renderer state manager startup", () => {
    it("initializes the state manager and exposes the legacy state proxy", async () => {
        expect.assertions(12);

        const setInitialized = vi.fn<(value: boolean) => void>();
        const setFileOpening = vi.fn<(value: boolean) => void>();
        const initialize = vi.fn<() => void>();
        const state = {
            app: {
                initialized: true,
                isOpeningFile: false,
            },
        };
        const subscribers = new Map<string, (value: unknown) => void>();
        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                AppActions: {
                    setFileOpening,
                    setInitialized,
                },
                masterStateManager: {
                    getState: () => state,
                    initialize,
                },
            }),
            getState: (path) => (path === "app.startTime" ? 123 : undefined),
            logRenderer: vi.fn(),
            subscribe: (path, callback) => {
                subscribers.set(path, callback);
            },
            toModuleRecord: (target) =>
                target && typeof target === "object"
                    ? (target as Record<string, unknown>)
                    : {},
        });

        await utils.initializeStateManager();
        await utils.initializeStateManager();

        const appState = utils.getAppState();
        expect(initialize).toHaveBeenCalledOnce();
        expect(appState?.isInitialized).toBe(true);
        expect(appState?.isOpeningFile).toBe(false);
        expect(appState?.startTime).toBe(123);

        if (appState) {
            appState.isInitialized = false;
            appState.isOpeningFile = true;
        }

        expect(setInitialized).toHaveBeenCalledWith(false);
        expect(setFileOpening).toHaveBeenCalledWith(true);
        expect(utils.isOpeningFileRef.value).toBe(true);

        subscribers.get("app.isOpeningFile")?.(false);

        expect(utils.isOpeningFileRef.value).toBe(false);
        expect([...subscribers.keys()]).toStrictEqual(["app.isOpeningFile"]);

        state.app.initialized = false;
        state.app.isOpeningFile = true;

        expect(appState?.isInitialized).toBe(false);
        expect(appState?.isOpeningFile).toBe(true);

        utils.resetStateInitializationForTests();

        expect(utils.isOpeningFileRef.value).toBe(false);
    });

    it("keeps a fallback legacy state when initialization fails", async () => {
        expect.assertions(4);

        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                masterStateManager: {},
            }),
            getState: vi.fn(),
            logRenderer: vi.fn(),
            subscribe: vi.fn(),
            toModuleRecord: (target) =>
                target && typeof target === "object"
                    ? (target as Record<string, unknown>)
                    : {},
        });

        await expect(utils.initializeStateManager()).rejects.toThrow(
            "masterStateManager.initialize missing"
        );

        const appState = utils.getAppState();

        expect(appState?.isInitialized).toBe(false);
        expect(appState?.isOpeningFile).toBe(false);
        expect(appState?.startTime).toBeTypeOf("number");
    });
});
