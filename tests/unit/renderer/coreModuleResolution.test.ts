import { afterEach, describe, expect, it, vi } from "vitest";

import {
    ensureCoreModules,
    resetRendererCoreModuleTestOverrides,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    setRendererCoreModuleTestOverrides,
} from "../../../electron-app/renderer/coreModuleResolution.js";

function setTestOverrideRegistry(registry: Map<string, unknown>): void {
    setRendererCoreModuleTestOverrides(registry);
}

describe("renderer core module resolution", () => {
    afterEach(() => {
        resetRendererCoreModuleTestOverrides();
        vi.restoreAllMocks();
    });

    it("resolves exact and suffix-matched test overrides", () => {
        expect.assertions(3);

        const exactMock = { default: { exact: true } };
        const suffixMock = { suffix: true };
        setTestOverrideRegistry(
            new Map<string, unknown>([
                ["../../utils/files/import/handleOpenFile.js", exactMock],
                [
                    "../../../electron-app/utils/theming/core/theme.js",
                    suffixMock,
                ],
            ])
        );

        expect(
            resolveExactRendererCoreTestOverride(
                "../../utils/files/import/handleOpenFile.js"
            )
        ).toStrictEqual({ exact: true });
        expect(
            resolveRendererCoreTestOverride("/utils/theming/core/theme.js")
        ).toStrictEqual(suffixMock);
        expect(resolveRendererCoreTestOverride("/utils/missing.js")).toBeNull();
    });

    it("builds the core module facade from test overrides", async () => {
        expect.assertions(11);

        const applyTheme = vi.fn();
        const handleOpenFile = vi.fn();
        const listenForThemeChange = vi.fn();
        const setupListeners = vi.fn();
        const setupTheme = vi.fn();
        const showAboutModal = vi.fn();
        const showNotification = vi.fn();
        const showUpdateNotification = vi.fn();
        const subscribeToAppOpeningFile = vi.fn();
        const subscribeToAppStartTime = vi.fn();
        const getAppStartTime = vi.fn();
        const AppActions = {
            setFileOpening: vi.fn(),
            setInitialized: vi.fn(),
        };
        const masterStateManager = { initialize: vi.fn() };
        const uiStateManager = { ready: true };

        setTestOverrideRegistry(
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
                    "../../utils/state/domain/appDomainState.js",
                    {
                        getAppStartTime,
                        subscribeToAppOpeningFile,
                        subscribeToAppStartTime,
                    },
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
        expect(coreModules.getAppStartTime).toBe(getAppStartTime);
        expect(coreModules.subscribeToAppOpeningFile).toBe(
            subscribeToAppOpeningFile
        );
        expect(coreModules.subscribeToAppStartTime).toBe(
            subscribeToAppStartTime
        );
        expect(coreModules.uiStateManager).toBe(uiStateManager);
    });
});
