import { describe, expect, it, vi } from "vitest";

import {
    createRendererImportTimeBootstrap,
    runRendererImportTimeBootstrap,
    type RendererImportTimeBootstrap,
} from "../../../electron-app/renderer/importTimeBootstrap.js";
import type { RendererCoreModules } from "../../../electron-app/renderer/coreModuleResolution.js";

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
    overrides: Partial<RendererCoreModules> = {}
): RendererCoreModules {
    return {
        AppActions: undefined,
        applyTheme: vi.fn(),
        getAppDomainState: vi.fn(),
        handleOpenFile: vi.fn(),
        listenForThemeChange: vi.fn(),
        masterStateManager: {},
        setupListeners: vi.fn(),
        setupTheme: vi.fn(),
        showAboutModal: vi.fn(),
        showNotification: vi.fn(),
        showUpdateNotification: vi.fn(),
        subscribeAppDomain: vi.fn(),
        subscribeAppDomainPath: vi.fn(),
        uiStateManager: {},
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
        expect.assertions(8);

        const openFileButton = document.createElement("button");
        const initializeStateManager = vi.fn(async () => undefined);
        const masterStateManager = { initialize: vi.fn() };
        const isOpeningFileRef = { value: false };
        const setLoading = vi.fn();
        const coreModules = createCoreModules();
        const bootstrap = createRendererImportTimeBootstrap({
            ensureCoreModules: async () => coreModules,
            getOpenFileButton: () => openFileButton,
            initializeStateManager,
            isOpeningFileRef,
            resolveExactRendererCoreTestOverride: (testId) =>
                testId === "../../utils/state/core/masterStateManager.js"
                    ? { masterStateManager }
                    : null,
            resolveRendererCoreTestOverride: () => null,
            setLoading,
            toModuleRecord: (value) =>
                typeof value === "object" && value !== null
                    ? (value as Record<string, unknown>)
                    : {},
        });

        bootstrap.scheduleImportTimeThemeSetup();
        bootstrap.scheduleImportTimeListenersSetup();
        bootstrap.scheduleImportTimeStateInitialization();
        bootstrap.scheduleAppDomainStateCoverageTouch();
        await flushImportTimeWork();

        expect(coreModules.setupTheme).toHaveBeenCalledWith(
            coreModules.applyTheme,
            coreModules.listenForThemeChange
        );
        expect(coreModules.setupListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                handleOpenFile: coreModules.handleOpenFile,
                isOpeningFileRef,
                openFileBtn: openFileButton,
                setLoading,
            })
        );
        expect(initializeStateManager).toHaveBeenCalledOnce();
        expect(masterStateManager.initialize).toHaveBeenCalledOnce();
        expect(coreModules.getAppDomainState).toHaveBeenCalledWith(
            "app.startTime"
        );
        expect(coreModules.subscribeAppDomain).toHaveBeenCalledWith(
            "app.startTime",
            expect.any(Function)
        );
        expect(coreModules.showAboutModal).not.toHaveBeenCalled();
        expect(coreModules.showUpdateNotification).not.toHaveBeenCalled();
    });

    it("runs import-time setup and coverage touches in renderer order", () => {
        expect.assertions(1);

        const calls: string[] = [];
        const bootstrap = createBootstrap({
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

        runRendererImportTimeBootstrap(bootstrap);

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

        const bootstrap = createBootstrap({
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
            runRendererImportTimeBootstrap(bootstrap);
        }).not.toThrow();

        expect(bootstrap.scheduleImportTimeThemeSetup).toHaveBeenCalledOnce();
        expect(
            bootstrap.scheduleImportTimeStateInitialization
        ).toHaveBeenCalledOnce();
        expect(
            bootstrap.scheduleAppDomainStateCoverageTouch
        ).toHaveBeenCalledTimes(2);
    });
});
