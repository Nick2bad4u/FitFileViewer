import { afterEach, describe, expect, it, vi } from "vitest";

import {
    callUnknownFunction,
    ensureCoreModules,
    resolveExactManualMock,
    resolveManualMock,
    toModuleRecord,
} from "../../../electron-app/renderer/coreModuleResolution.js";

type ManualMockRegistryGlobal = typeof globalThis & {
    __vitest_manual_mocks__?: Map<string, unknown>;
};

function getManualMockGlobal(): ManualMockRegistryGlobal {
    return globalThis as ManualMockRegistryGlobal;
}

function setManualMockRegistry(registry: Map<string, unknown>): void {
    getManualMockGlobal().__vitest_manual_mocks__ = registry;
}

describe("renderer core module resolution", () => {
    afterEach(() => {
        Reflect.deleteProperty(globalThis, "__vitest_manual_mocks__");
        vi.restoreAllMocks();
    });

    it("calls only function candidates", () => {
        expect.assertions(2);

        const callable = vi.fn((value: string) => `called ${value}`);

        expect(callUnknownFunction(callable, ["ok"])).toBe("called ok");
        expect(callUnknownFunction("not callable", ["ignored"])).toBe(
            undefined
        );
    });

    it("normalizes record candidates", () => {
        expect.assertions(2);

        const record = { ready: true };

        expect(toModuleRecord(record)).toBe(record);
        expect(toModuleRecord(null)).toStrictEqual({});
    });

    it("resolves exact and suffix-matched manual mocks", () => {
        expect.assertions(3);

        const exactMock = { default: { exact: true } };
        const suffixMock = { suffix: true };
        setManualMockRegistry(
            new Map<string, unknown>([
                ["../../utils/files/import/handleOpenFile.js", exactMock],
                [
                    "../../../electron-app/utils/theming/core/theme.js",
                    suffixMock,
                ],
            ])
        );

        expect(
            resolveExactManualMock("../../utils/files/import/handleOpenFile.js")
        ).toStrictEqual({ exact: true });
        expect(resolveManualMock("/utils/theming/core/theme.js")).toStrictEqual(
            suffixMock
        );
        expect(resolveManualMock("/utils/missing.js")).toBeNull();
    });

    it("builds the core module facade from manual mocks", async () => {
        expect.assertions(9);

        const applyTheme = vi.fn();
        const handleOpenFile = vi.fn();
        const listenForThemeChange = vi.fn();
        const setupListeners = vi.fn();
        const setupTheme = vi.fn();
        const showAboutModal = vi.fn();
        const showNotification = vi.fn();
        const showUpdateNotification = vi.fn();
        const subscribe = vi.fn();
        const getState = vi.fn();
        const AppActions = { setInitialized: vi.fn() };
        const masterStateManager = { initialize: vi.fn() };
        const uiStateManager = { ready: true };

        setManualMockRegistry(
            new Map<string, unknown>([
                [
                    "../../utils/ui/notifications/showNotification.js",
                    { showNotification },
                ],
                [
                    "../../utils/files/import/handleOpenFile.js",
                    { handleOpenFile },
                ],
                ["../../utils/theming/core/setupTheme.js", { setupTheme }],
                [
                    "../../utils/ui/notifications/showUpdateNotification.js",
                    { showUpdateNotification },
                ],
                ["../../utils/app/lifecycle/listeners.js", { setupListeners }],
                ["../../utils/ui/modals/aboutModal.js", { showAboutModal }],
                [
                    "../../utils/theming/core/theme.js",
                    { applyTheme, listenForThemeChange },
                ],
                [
                    "../../utils/state/core/masterStateManager.js",
                    { masterStateManager },
                ],
                ["../../utils/app/lifecycle/appActions.js", { AppActions }],
                [
                    "../../utils/state/domain/appState.js",
                    { getState, subscribe },
                ],
                [
                    "../../utils/state/domain/uiStateManager.js",
                    { uiStateManager },
                ],
            ])
        );

        const coreModules = await ensureCoreModules();

        expect(coreModules.AppActions).toBe(AppActions);
        expect(coreModules.applyTheme).toBe(applyTheme);
        expect(coreModules.handleOpenFile).toBe(handleOpenFile);
        expect(coreModules.listenForThemeChange).toBe(listenForThemeChange);
        expect(coreModules.masterStateManager).toBe(masterStateManager);
        expect(coreModules.setupListeners).toBe(setupListeners);
        expect(coreModules.showNotification).toBe(showNotification);
        expect(coreModules.subscribeAppDomain).toBe(subscribe);
        expect(coreModules.uiStateManager).toBe(uiStateManager);
    });
});
