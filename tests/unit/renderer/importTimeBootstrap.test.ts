import { describe, expect, it, vi } from "vitest";

import {
    createRendererImportTimeBootstrap,
    runRendererImportTimeBootstrap,
    type RendererImportTimeCoreModules,
    type RendererImportTimeBootstrap,
} from "../../../electron-app/renderer/importTimeBootstrap.js";
import type { SetupListenersOptions } from "../../../electron-app/utils/app/lifecycle/listeners.js";

function createBootstrap(
    overrides: Partial<RendererImportTimeBootstrap> = {}
): RendererImportTimeBootstrap {
    return {
        scheduleAppDomainStateCoverageTouch: vi.fn(),
        scheduleImportTimeListenersSetup: vi.fn(),
        scheduleImportTimeStateInitialization: vi.fn(),
        scheduleImportTimeThemeSetup: vi.fn(),
        ...overrides,
    };
}

function createCoreModules(
    overrides: Partial<RendererImportTimeCoreModules> = {}
): RendererImportTimeCoreModules {
    return {
        applyTheme: vi.fn(),
        getAppStartTime: vi.fn(),
        handleOpenFile: vi.fn(),
        listenForThemeChange: vi.fn(),
        setupListeners: vi.fn(),
        setupTheme: vi.fn(),
        showAboutModal: vi.fn(),
        showNotification: vi.fn(),
        showUpdateNotification: vi.fn(),
        subscribeToAppStartTime: vi.fn(),
        ...overrides,
    };
}

async function flushImportTimeWork(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("renderer import-time bootstrap", () => {
    it("calls import-time core module functions directly", async () => {
        expect.assertions(11);

        const openFileButton = document.createElement("button");
        const initializeStateManager = vi.fn(async () => undefined);
        const masterStateManager = { initialize: vi.fn() };
        const isOpeningFileRef = { value: false };
        const setLoading = vi.fn();
        const electronApiScope = {
            getElectronAPI: () => ({ readFile: vi.fn() }),
        };
        const getElectronApiScope = vi.fn(() => electronApiScope);
        const receivedUpdateNotifications: unknown[][] = [];
        let setupListenersOptions: SetupListenersOptions | undefined;
        const coreModules = createCoreModules({
            setupListeners: vi.fn((options: SetupListenersOptions) => {
                setupListenersOptions = options;
            }),
            showUpdateNotification: (message, type, duration, withAction) => {
                receivedUpdateNotifications.push([
                    message,
                    type,
                    duration,
                    withAction,
                ]);
            },
        });
        const {
            scheduleAppDomainStateCoverageTouch,
            scheduleImportTimeListenersSetup,
            scheduleImportTimeStateInitialization,
            scheduleImportTimeThemeSetup,
        } = createRendererImportTimeBootstrap({
            ensureCoreModules: async () => coreModules,
            getElectronApiScope,
            getOpenFileButton: () => openFileButton,
            initializeStateManager,
            isOpeningFileRef,
            resolveExactRendererCoreTestOverride: (testId) =>
                testId === "../../utils/state/core/masterStateManager.js"
                    ? { masterStateManager }
                    : null,
            resolveRendererCoreTestOverride: () => null,
            setLoading,
        });

        scheduleImportTimeThemeSetup();
        scheduleImportTimeListenersSetup();
        scheduleImportTimeStateInitialization();
        scheduleAppDomainStateCoverageTouch();
        await flushImportTimeWork();

        expect(coreModules.setupTheme).toHaveBeenCalledWith(
            coreModules.applyTheme,
            coreModules.listenForThemeChange
        );
        expect(coreModules.setupListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                handleOpenFile: coreModules.handleOpenFile,
                electronApiScope,
                isOpeningFileRef,
                openFileBtn: openFileButton,
                setLoading,
            })
        );
        expect(getElectronApiScope).toHaveBeenCalledOnce();
        expect(initializeStateManager).toHaveBeenCalledOnce();
        expect(masterStateManager.initialize).toHaveBeenCalledOnce();
        expect(coreModules.getAppStartTime).toHaveBeenCalled();
        expect(coreModules.subscribeToAppStartTime).toHaveBeenCalledWith(
            expect.any(Function)
        );
        expect(receivedUpdateNotifications).toHaveLength(0);
        expect(setupListenersOptions).toBeDefined();
        setupListenersOptions?.showUpdateNotification(
            "Update available",
            4000,
            "download"
        );
        expect(receivedUpdateNotifications).toStrictEqual([
            [
                "Update available",
                undefined,
                4000,
                "download",
            ],
        ]);
        expect(coreModules.showAboutModal).not.toHaveBeenCalled();
    });

    it("initializes default-exported master state manager test overrides", async () => {
        expect.assertions(4);

        let initializedStateManager = false;
        let initializedMasterStateManager = false;
        const initializeStateManager = vi.fn(async () => {
            initializedStateManager = true;
        });
        const masterStateManager = {
            initialize: vi.fn(() => {
                initializedMasterStateManager = true;
            }),
        };
        const { scheduleImportTimeStateInitialization } =
            createRendererImportTimeBootstrap({
                ensureCoreModules: async () => createCoreModules(),
                getElectronApiScope: () => ({ getElectronAPI: () => null }),
                getOpenFileButton: () => null,
                initializeStateManager,
                isOpeningFileRef: { value: false },
                resolveExactRendererCoreTestOverride: (testId) =>
                    testId === "../../utils/state/core/masterStateManager.js"
                        ? { default: { masterStateManager } }
                        : null,
                resolveRendererCoreTestOverride: () => null,
                setLoading: vi.fn(),
            });

        scheduleImportTimeStateInitialization();
        await flushImportTimeWork();

        expect(initializedStateManager).toBe(true);
        expect(initializedMasterStateManager).toBe(true);
        expect(initializeStateManager).toHaveBeenCalledOnce();
        expect(masterStateManager.initialize).toHaveBeenCalledOnce();
    });

    it("ignores malformed master state manager test overrides", async () => {
        expect.assertions(2);

        const initializeStateManager = vi.fn(async () => undefined);
        const { scheduleImportTimeStateInitialization } =
            createRendererImportTimeBootstrap({
                ensureCoreModules: async () => createCoreModules(),
                getElectronApiScope: () => ({ getElectronAPI: () => null }),
                getOpenFileButton: () => null,
                initializeStateManager,
                isOpeningFileRef: { value: false },
                resolveExactRendererCoreTestOverride: () => "not-a-module",
                resolveRendererCoreTestOverride: () => null,
                setLoading: vi.fn(),
            });

        scheduleImportTimeStateInitialization();
        await expect(flushImportTimeWork()).resolves.toBeUndefined();

        expect(initializeStateManager).toHaveBeenCalledOnce();
    });

    it("runs import-time setup and coverage touches in renderer order", () => {
        expect.assertions(1);

        const calls: string[] = [];
        const controller = createBootstrap({
            scheduleAppDomainStateCoverageTouch: vi.fn(() => {
                calls.push("coverage");
            }),
            scheduleImportTimeListenersSetup: vi.fn(() => {
                calls.push("listeners");
            }),
            scheduleImportTimeStateInitialization: vi.fn(() => {
                calls.push("state");
            }),
            scheduleImportTimeThemeSetup: vi.fn(() => {
                calls.push("theme");
            }),
        });

        runRendererImportTimeBootstrap(controller);

        expect(calls).toStrictEqual([
            "theme",
            "state",
            "listeners",
            "coverage",
            "coverage",
        ]);
    });

    it("isolates setup errors so later import-time setup still runs", () => {
        expect.assertions(4);

        const controller = createBootstrap({
            scheduleImportTimeListenersSetup: vi.fn(() => {
                throw new Error("listeners failed");
            }),
            scheduleImportTimeStateInitialization: vi.fn(() => {
                throw new Error("state failed");
            }),
            scheduleImportTimeThemeSetup: vi.fn(() => {
                throw new Error("theme failed");
            }),
        });

        expect(() => {
            runRendererImportTimeBootstrap(controller);
        }).not.toThrow();

        expect(controller.scheduleImportTimeThemeSetup).toHaveBeenCalledOnce();
        expect(
            controller.scheduleImportTimeStateInitialization
        ).toHaveBeenCalledOnce();
        expect(
            controller.scheduleAppDomainStateCoverageTouch
        ).toHaveBeenCalledTimes(2);
    });
});
