import { describe, expect, it, vi } from "vitest";

import {
    createRendererFileOpeningStateRef,
    createRendererStateStartup,
    isRendererFileOpening,
    setRendererFileOpeningState,
} from "../../../electron-app/renderer/stateManagerStartup.js";

describe("renderer state manager startup", () => {
    it("initializes the state manager and mirrors file-opening state", async () => {
        expect.assertions(5);

        const initialize = vi.fn<() => void>();
        let openingFileSubscriber: ((value: unknown) => void) | undefined;
        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                masterStateManager: {
                    initialize,
                },
                subscribeToAppOpeningFile: (callback) => {
                    openingFileSubscriber = callback;
                },
            }),
            logRenderer: vi.fn(),
        });

        await utils.initializeStateManager();
        await utils.initializeStateManager();

        expect(initialize).toHaveBeenCalledOnce();
        expect(openingFileSubscriber).toBeTypeOf("function");
        expect(utils.isOpeningFileRef.value).toBe(false);

        openingFileSubscriber?.(true);

        expect(utils.isOpeningFileRef.value).toBe(true);

        utils.resetStateInitializationForTests();

        expect(utils.isOpeningFileRef.value).toBe(false);
    });

    it("resets initialization tracking when initialization fails", async () => {
        expect.assertions(2);

        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                masterStateManager: {},
            }),
            logRenderer: vi.fn(),
        });

        await expect(utils.initializeStateManager()).rejects.toThrow(
            "masterStateManager.initialize missing"
        );

        expect(utils.isOpeningFileRef.value).toBe(false);
    });

    it("requires the app-opening subscription facade", async () => {
        expect.assertions(2);

        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                masterStateManager: {
                    initialize: vi.fn(),
                },
            }),
            logRenderer: vi.fn(),
        });

        await expect(utils.initializeStateManager()).rejects.toThrow(
            "subscribeToAppOpeningFile missing"
        );

        expect(utils.isOpeningFileRef.value).toBe(false);
    });

    it("owns renderer file-opening state through named helpers", () => {
        expect.assertions(4);

        const utils = createRendererFileOpeningStateRef();

        expect(utils).toStrictEqual({ value: false });
        expect(isRendererFileOpening(utils)).toBe(false);

        setRendererFileOpeningState(utils, true);

        expect(isRendererFileOpening(utils)).toBe(true);

        setRendererFileOpeningState(utils, false);

        expect(isRendererFileOpening(utils)).toBe(false);
    });
});
