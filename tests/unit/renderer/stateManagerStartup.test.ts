import { describe, expect, it, vi } from "vitest";

import { createRendererStateStartup } from "../../../electron-app/renderer/stateManagerStartup.js";

describe("renderer state manager startup", () => {
    it("initializes the state manager and mirrors file-opening state", async () => {
        expect.assertions(5);

        const initialize = vi.fn<() => void>();
        const subscribers = new Map<string, (value: unknown) => void>();
        const utils = createRendererStateStartup({
            ensureCoreModules: async () => ({
                masterStateManager: {
                    initialize,
                },
            }),
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

        expect(initialize).toHaveBeenCalledOnce();
        expect([...subscribers.keys()]).toStrictEqual(["app.isOpeningFile"]);
        expect(utils.isOpeningFileRef.value).toBe(false);

        subscribers.get("app.isOpeningFile")?.(true);

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
            subscribe: vi.fn(),
            toModuleRecord: (target) =>
                target && typeof target === "object"
                    ? (target as Record<string, unknown>)
                    : {},
        });

        await expect(utils.initializeStateManager()).rejects.toThrow(
            "masterStateManager.initialize missing"
        );

        expect(utils.isOpeningFileRef.value).toBe(false);
    });
});
