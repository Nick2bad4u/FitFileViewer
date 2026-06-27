import { describe, expect, it } from "vitest";

import {
    cleanupRendererStateManagerState,
    createRendererLifecycleCleanup,
    resetRendererOpeningState,
} from "../../../electron-app/renderer/lifecycleCleanup.js";

function createErrorHandlers() {
    return {
        onUncaughtErrorEvent: (): void => {},
        onUnhandledRejectionEvent: (): void => {},
    };
}

describe("renderer lifecycle cleanup", () => {
    it("removes renderer error listeners and cleans initialized state managers", async () => {
        expect.assertions(5);

        const actions: Array<[string, boolean]> = [];
        const logs: unknown[][] = [];
        const removedEvents: string[] = [];
        let managerCleanupCalled = false;
        let managerCleanupThisMatches = false;
        const masterStateManager = {
            isInitialized: true,
            cleanup() {
                managerCleanupCalled = true;
                managerCleanupThisMatches = this === masterStateManager;
            },
        };
        const lifecycle = {
            execute: createRendererLifecycleCleanup({
                errorHandlers: createErrorHandlers(),
                getCoreModules: () =>
                    Promise.resolve({
                        AppActions: {
                            setFileOpening(value: boolean): void {
                                actions.push(["setFileOpening", value]);
                            },
                            setInitialized(value: boolean): void {
                                actions.push(["setInitialized", value]);
                            },
                        },
                        masterStateManager,
                    }),
                isOpeningFileRef: { value: true },
                logRenderer: (...args: unknown[]) => {
                    logs.push(args);
                },
                removeEventListener: (eventName) => {
                    removedEvents.push(eventName);
                },
            }),
        };

        lifecycle.execute();
        await Promise.resolve();

        expect(removedEvents).toStrictEqual(["unhandledrejection", "error"]);
        expect(actions).toStrictEqual([
            ["setInitialized", false],
            ["setFileOpening", false],
        ]);
        expect(managerCleanupCalled).toBe(true);
        expect(managerCleanupThisMatches).toBe(true);
        expect(logs).toStrictEqual([
            ["log", "[Renderer] Performing cleanup..."],
            ["log", "[Renderer] Cleanup completed"],
        ]);
    });

    it("resets lifecycle state through actions when the state manager is not initialized", async () => {
        expect.assertions(2);

        const actions: Array<[string, boolean]> = [];
        const isOpeningFileRef = { value: true };

        await cleanupRendererStateManagerState({
            errorHandlers: createErrorHandlers(),
            getCoreModules: () =>
                Promise.resolve({
                    AppActions: {
                        setFileOpening(value: boolean): void {
                            actions.push(["setFileOpening", value]);
                        },
                        setInitialized(value: boolean): void {
                            actions.push(["setInitialized", value]);
                        },
                    },
                    masterStateManager: { isInitialized: false },
                }),
            isOpeningFileRef,
            logRenderer: () => {},
            removeEventListener: () => {},
        });

        expect(actions).toStrictEqual([
            ["setInitialized", false],
            ["setFileOpening", false],
        ]);
        expect(isOpeningFileRef.value).toBe(false);
    });

    it("resets local opening state when core module cleanup fails", async () => {
        expect.assertions(1);

        const isOpeningFileRef = { value: true };

        await cleanupRendererStateManagerState({
            errorHandlers: createErrorHandlers(),
            getCoreModules: () => Promise.reject(new Error("missing modules")),
            isOpeningFileRef,
            logRenderer: () => {},
            removeEventListener: () => {},
        });

        expect(isOpeningFileRef.value).toBe(false);
    });

    it("resets local opening state for malformed core module shapes", async () => {
        expect.assertions(1);

        const isOpeningFileRef = { value: true };

        await cleanupRendererStateManagerState({
            errorHandlers: createErrorHandlers(),
            getCoreModules: () =>
                Promise.resolve({
                    AppActions: "not actions",
                    masterStateManager: null,
                }),
            isOpeningFileRef,
            logRenderer: () => {},
            removeEventListener: () => {},
        });

        expect(isOpeningFileRef.value).toBe(false);
    });

    it("resets local opening state directly", () => {
        expect.assertions(1);

        const isOpeningFileRef = { value: true };

        resetRendererOpeningState({
            isOpeningFileRef,
        });

        expect(isOpeningFileRef.value).toBe(false);
    });

    it("logs synchronous cleanup failures", () => {
        expect.assertions(1);

        const cleanupError = new Error("listener remove failed");
        const logs: unknown[][] = [];
        const lifecycle = {
            execute: createRendererLifecycleCleanup({
                errorHandlers: createErrorHandlers(),
                getCoreModules: () =>
                    Promise.resolve({
                        AppActions: {},
                        masterStateManager: {},
                    }),
                isOpeningFileRef: { value: true },
                logRenderer: (...args: unknown[]) => {
                    logs.push(args);
                },
                removeEventListener: () => {
                    throw cleanupError;
                },
            }),
        };

        lifecycle.execute();

        expect(logs.at(-1)).toStrictEqual([
            "error",
            "[Renderer] Cleanup failed:",
            cleanupError,
        ]);
    });
});
