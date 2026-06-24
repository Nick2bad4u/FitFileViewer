import {
    getElectronApiStartupHooks,
    registerStartupElectronHooks,
    type RendererApplyTheme as ApplyTheme,
} from "./electronApiStartupHooks.js";
import { getRendererApplicationStartupRuntime } from "./applicationStartupRuntime.js";
import {
    getRendererErrorMessage,
    type RendererErrorEventHandlers,
} from "./errorHandling.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";
import type { RendererAddEventListener } from "./runtimeEnvironment.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import type {
    ListenForThemeChange,
    RendererHandleOpenFile,
    RendererSetupListeners,
    RendererSetupTheme,
    ShowNotification,
    ShowUpdateNotification,
} from "./coreModuleResolution.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type { AppDomainStateGetter } from "../utils/state/domain/appDomainState.js";

type RendererStartupLogLevel = "error" | "log" | "warn";
type RendererStartupLogger = (
    level: RendererStartupLogLevel,
    ...args: unknown[]
) => void;

const applicationStartupRuntime = getRendererApplicationStartupRuntime();

export interface RendererDependencies {
    applyTheme: ApplyTheme | undefined;
    handleOpenFile: RendererHandleOpenFile | undefined;
    isOpeningFileRef: { value: boolean };
    listenForThemeChange: ListenForThemeChange | undefined;
    openFileBtn: HTMLElement | null;
    setLoading: (loading: boolean) => void;
    showAboutModal: ((html?: string) => void) | undefined;
    showNotification: ShowNotification | undefined;
    showUpdateNotification: ShowUpdateNotification | undefined;
}

export type RendererApplicationStartupCoreModules = Readonly<{
    readonly AppActions: Record<string, unknown> | undefined;
    readonly applyTheme: ApplyTheme | undefined;
    readonly getAppDomainState: AppDomainStateGetter | undefined;
    readonly handleOpenFile: RendererHandleOpenFile | undefined;
    readonly listenForThemeChange: ListenForThemeChange | undefined;
    readonly setupListeners: RendererSetupListeners | undefined;
    readonly setupTheme: RendererSetupTheme | undefined;
    readonly showAboutModal: ((html?: string) => void) | undefined;
    readonly showNotification: ShowNotification | undefined;
    readonly showUpdateNotification: ShowUpdateNotification | undefined;
}>;

interface RendererApplicationStartupOptions {
    addEventListener: RendererAddEventListener;
    ensureCoreModules: () => Promise<RendererApplicationStartupCoreModules>;
    errorHandlers: RendererErrorEventHandlers;
    getElectronApiScope: () => RendererElectronApiScope;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isDevelopmentMode: () => boolean;
    isOpeningFileRef: { value: boolean };
    logRenderer: RendererStartupLogger;
    performanceMonitor: RendererPerformanceMonitor;
    setLoading: (loading: boolean) => void;
    setupCreditsMarquee: () => void;
    validateDOMElements: () => boolean;
}

export function createRendererApplicationStartup(
    options: RendererApplicationStartupOptions
): () => Promise<void> {
    async function initializeApplication(): Promise<void> {
        options.performanceMonitor.start("app_initialization");
        const startupListenerController =
            applicationStartupRuntime.createAbortController();

        try {
            options.logRenderer(
                "log",
                "[Renderer] Starting application initialization..."
            );

            await options.initializeStateManager();

            if (!options.validateDOMElements()) {
                throw new Error("Required DOM elements are missing");
            }

            const openFileBtn = options.getOpenFileButton();
            options.addEventListener(
                "unhandledrejection",
                options.errorHandlers.onUnhandledRejectionEvent,
                { signal: startupListenerController.signal }
            );
            options.addEventListener(
                "error",
                options.errorHandlers.onUncaughtErrorEvent,
                { signal: startupListenerController.signal }
            );

            const coreModules = await options.ensureCoreModules();
            const dependencies = createRendererDependencies(
                coreModules,
                openFileBtn,
                options
            );

            await initializeComponents(
                dependencies,
                options,
                startupListenerController
            );

            const electronApiHooks = getElectronApiStartupHooks({
                getElectronApiScope: options.getElectronApiScope,
            });
            if (electronApiHooks !== null) {
                registerStartupElectronHooks(
                    electronApiHooks,
                    openFileBtn,
                    coreModules.showAboutModal,
                    coreModules.applyTheme
                );
            }

            try {
                if (coreModules.getAppDomainState !== undefined) {
                    coreModules.getAppDomainState("app.startTime");
                }
            } catch {
                /* Ignore errors */
            }

            markApplicationInitialized(coreModules.AppActions);

            const initTime =
                options.performanceMonitor.end("app_initialization");
            options.logRenderer(
                "log",
                `[Renderer] Application initialized successfully in ${initTime.toFixed(2)}ms`
            );

            if (
                options.isDevelopmentMode() &&
                coreModules.showNotification !== undefined
            ) {
                coreModules.showNotification(
                    `App initialized in ${initTime.toFixed(0)}ms`,
                    "success",
                    3000
                );
            }
        } catch (error) {
            options.performanceMonitor.end("app_initialization");
            options.logRenderer(
                "error",
                "[Renderer] Failed to initialize application:",
                error
            );

            try {
                const coreModules = await options.ensureCoreModules();
                if (coreModules.showNotification !== undefined) {
                    coreModules.showNotification(
                        `Initialization failed: ${getRendererErrorMessage(error)}`,
                        "error",
                        10_000
                    );
                }
            } catch {
                /* Ignore errors */
            }
        }
    }

    return initializeApplication;
}

async function initializeAsyncComponents(
    options: RendererApplicationStartupOptions,
    startupListenerController: AbortController
): Promise<void> {
    try {
        const electronApiHooks = getElectronApiStartupHooks({
            getElectronApiScope: options.getElectronApiScope,
        });

        if (electronApiHooks?.recentFiles !== undefined) {
            try {
                await electronApiHooks.recentFiles();
                options.logRenderer(
                    "log",
                    "[Renderer] Recent files API available"
                );
            } catch (error) {
                options.logRenderer(
                    "warn",
                    "[Renderer] Recent files initialization failed:",
                    error
                );
            }
        }

        if (
            electronApiHooks?.checkForUpdates !== undefined &&
            !options.isDevelopmentMode()
        ) {
            try {
                const updateCheckTimer = applicationStartupRuntime.setTimeout(
                    () => {
                        electronApiHooks.checkForUpdates?.();
                    },
                    5000
                );
                options.addEventListener(
                    "beforeunload",
                    () => {
                        applicationStartupRuntime.clearTimeout(
                            updateCheckTimer
                        );
                    },
                    {
                        once: true,
                        signal: startupListenerController.signal,
                    }
                );
            } catch (error) {
                options.logRenderer(
                    "warn",
                    "[Renderer] Update check failed:",
                    error
                );
            }
        }
    } catch (error) {
        options.logRenderer(
            "warn",
            "[Renderer] Some async components failed to initialize:",
            error
        );
    }
}

async function initializeComponents(
    dependencies: RendererDependencies,
    options: RendererApplicationStartupOptions,
    startupListenerController: AbortController
): Promise<void> {
    try {
        options.performanceMonitor.start("theme_setup");
        options.logRenderer("log", "[Renderer] Setting up theme system...");
        try {
            const { setupTheme: setupThemeDyn } =
                await options.ensureCoreModules();
            setupThemeDyn?.(
                dependencies.applyTheme,
                dependencies.listenForThemeChange
            );
        } catch {
            /* Ignore errors */
        }
        options.performanceMonitor.end("theme_setup");

        try {
            options.setupCreditsMarquee();
        } catch (error) {
            options.logRenderer(
                "warn",
                "[Renderer] Failed to initialize credits marquee:",
                error
            );
        }

        options.performanceMonitor.start("listeners_setup");
        options.logRenderer("log", "[Renderer] Setting up event listeners...");
        try {
            const { setupListeners: setupListenersDyn } =
                await options.ensureCoreModules();
            const setupListenerDependencies =
                createSetupListenersOptions(dependencies);
            if (setupListenerDependencies !== undefined) {
                setupListenersDyn?.(setupListenerDependencies);
            }
        } catch {
            try {
                const { setupListeners } = await options.ensureCoreModules();
                const setupListenerDependencies =
                    createSetupListenersOptions(dependencies);
                if (setupListenerDependencies !== undefined) {
                    setupListeners?.(setupListenerDependencies);
                }
            } catch (error) {
                options.logRenderer(
                    "warn",
                    "[Renderer] Listener setup skipped or failed:",
                    getErrorMessage(error)
                );
            }
        }
        options.performanceMonitor.end("listeners_setup");

        options.performanceMonitor.start("async_components");
        options.logRenderer(
            "log",
            "[Renderer] Initializing async components..."
        );
        await initializeAsyncComponents(options, startupListenerController);
        options.performanceMonitor.end("async_components");

        options.logRenderer(
            "log",
            "[Renderer] All components initialized successfully"
        );
    } catch (error) {
        options.logRenderer(
            "error",
            "[Renderer] Component initialization failed:",
            error
        );
        throw error;
    }
}

function createRendererDependencies(
    coreModules: RendererApplicationStartupCoreModules,
    openFileBtn: HTMLElement | null,
    options: RendererApplicationStartupOptions
): RendererDependencies {
    return {
        applyTheme: coreModules.applyTheme,
        handleOpenFile: coreModules.handleOpenFile,
        isOpeningFileRef: options.isOpeningFileRef,
        listenForThemeChange: coreModules.listenForThemeChange,
        openFileBtn,
        setLoading: options.setLoading,
        showAboutModal: coreModules.showAboutModal,
        showNotification: coreModules.showNotification,
        showUpdateNotification: coreModules.showUpdateNotification,
    };
}

function createSetupListenersOptions(
    dependencies: RendererDependencies
): SetupListenersOptions | undefined {
    const {
        handleOpenFile,
        showAboutModal,
        showNotification,
        showUpdateNotification,
    } = dependencies;
    if (
        handleOpenFile === undefined ||
        showAboutModal === undefined ||
        showNotification === undefined ||
        showUpdateNotification === undefined
    ) {
        return undefined;
    }

    return {
        handleOpenFile,
        isOpeningFileRef: dependencies.isOpeningFileRef,
        openFileBtn: dependencies.openFileBtn as HTMLButtonElement | null,
        setLoading: dependencies.setLoading,
        showAboutModal,
        showNotification,
        showUpdateNotification: adaptShowUpdateNotification(
            showUpdateNotification
        ),
    };
}

function adaptShowUpdateNotification(
    showUpdateNotification: ShowUpdateNotification
): SetupListenersOptions["showUpdateNotification"] {
    return (message, typeOrDuration, durationOrMode, mode) => {
        const type =
            typeof typeOrDuration === "string" ? typeOrDuration : undefined;
        const duration =
            typeof typeOrDuration === "number"
                ? typeOrDuration
                : typeof durationOrMode === "number"
                  ? durationOrMode
                  : undefined;
        const action =
            typeof durationOrMode === "string" ? durationOrMode : mode;

        return showUpdateNotification(message, type, duration, action);
    };
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function markApplicationInitialized(
    appActions: Record<string, unknown> | undefined
): void {
    const setInitialized = appActions?.["setInitialized"];
    if (typeof setInitialized === "function") {
        const setInitializedFn =
            /** @type {(initialized: boolean) => unknown} */ setInitialized;
        setInitializedFn(true);
    }
}
