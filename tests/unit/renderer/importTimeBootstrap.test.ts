import { describe, expect, it, vi } from "vitest";

import {
    createRendererImportTimeBootstrap,
    runRendererImportTimeBootstrap,
    type RendererImportTimeBootstrap,
} from "../../../electron-app/renderer/importTimeBootstrap.js";
import type { SetupListenersOptions } from "../../../electron-app/utils/app/lifecycle/listeners.js";

function createBootstrap(
    overrides: Partial<RendererImportTimeBootstrap> = {}
): RendererImportTimeBootstrap {
    return {
        scheduleAppDomainStateTouch: vi.fn(),
        scheduleImportTimeListenersSetup: vi.fn(),
        scheduleImportTimeStateInitialization: vi.fn(),
        scheduleImportTimeThemeSetup: vi.fn(),
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
        expect.assertions(10);

        const openFileButton = document.createElement("button");
        const initializeStateManager = vi.fn(async () => undefined);
        const isOpeningFileRef = { value: false };
        const setLoading = vi.fn();
        const electronApiScope = {
            getElectronAPI: () => ({ readFile: vi.fn() }),
        };
        const getElectronApiScope = vi.fn(() => electronApiScope);
        const applyTheme = vi.fn();
        const getAppStartTime = vi.fn();
        const handleOpenFile = vi.fn();
        const listenForThemeChange = vi.fn();
        const showAboutModal = vi.fn();
        const showNotification = vi.fn();
        const receivedUpdateNotifications: unknown[][] = [];
        const showUpdateNotification = vi.fn(
            (
                message: string,
                type?: string,
                duration?: number,
                withAction?: boolean | string
            ) => {
                receivedUpdateNotifications.push([
                    message,
                    type,
                    duration,
                    withAction,
                ]);
            }
        );
        const subscribeToAppStartTime = vi.fn();
        let setupListenersOptions: SetupListenersOptions | undefined;
        const setupListeners = vi.fn((options: SetupListenersOptions) => {
            setupListenersOptions = options;
        });
        const setupTheme = vi.fn();
        const {
            scheduleAppDomainStateTouch,
            scheduleImportTimeListenersSetup,
            scheduleImportTimeStateInitialization,
            scheduleImportTimeThemeSetup,
        } = createRendererImportTimeBootstrap({
            applyTheme,
            getElectronApiScope,
            getAppStartTime,
            handleOpenFile,
            getOpenFileButton: () => openFileButton,
            initializeStateManager,
            isOpeningFileRef,
            listenForThemeChange,
            setLoading,
            showAboutModal,
            showNotification,
            showUpdateNotification,
            setupListeners,
            setupTheme,
            subscribeToAppStartTime,
        });

        scheduleImportTimeThemeSetup();
        scheduleImportTimeListenersSetup();
        scheduleImportTimeStateInitialization();
        scheduleAppDomainStateTouch();
        await flushImportTimeWork();

        expect(setupTheme).toHaveBeenCalledWith(
            applyTheme,
            listenForThemeChange,
            { electronApiScope }
        );
        expect(setupListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                handleOpenFile,
                electronApiScope,
                isOpeningFileRef,
                openFileBtn: openFileButton,
                setLoading,
            })
        );
        expect(getElectronApiScope).toHaveBeenCalledTimes(2);
        expect(initializeStateManager).toHaveBeenCalledOnce();
        expect(getAppStartTime).toHaveBeenCalledTimes(2);
        expect(subscribeToAppStartTime).toHaveBeenCalledWith(
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
        expect(showAboutModal).not.toHaveBeenCalled();
    });

    it("lets state startup own state manager initialization", async () => {
        expect.assertions(2);

        let initialized = false;
        const initializeStateManager = vi.fn(async () => {
            initialized = true;
        });
        const { scheduleImportTimeStateInitialization } =
            createRendererImportTimeBootstrap({
                applyTheme: vi.fn(),
                getElectronApiScope: () => ({ getElectronAPI: () => null }),
                getAppStartTime: vi.fn(),
                handleOpenFile: vi.fn(),
                getOpenFileButton: () => null,
                initializeStateManager,
                isOpeningFileRef: { value: false },
                listenForThemeChange: vi.fn(),
                setLoading: vi.fn(),
                showAboutModal: vi.fn(),
                showNotification: vi.fn(),
                showUpdateNotification: vi.fn(),
                setupListeners: vi.fn(),
                setupTheme: vi.fn(),
                subscribeToAppStartTime: vi.fn(),
            });

        scheduleImportTimeStateInitialization();
        await flushImportTimeWork();

        expect(initialized).toBe(true);
        expect(initializeStateManager).toHaveBeenCalledOnce();
    });

    it("runs import-time setup and state touch in renderer order", () => {
        expect.assertions(1);

        const calls: string[] = [];
        const controller = createBootstrap({
            scheduleAppDomainStateTouch: vi.fn(() => {
                calls.push("state-touch");
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
            "state-touch",
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
        expect(controller.scheduleAppDomainStateTouch).toHaveBeenCalledOnce();
    });
});
