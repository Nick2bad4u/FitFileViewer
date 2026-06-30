import {
    getElectronApiStartupHooks,
    registerStartupElectronHooks,
    type RendererApplyTheme as ApplyTheme,
} from "./electronApiStartupHooks.js";
import {
    getRendererApplicationStartupRuntime,
    type RendererApplicationStartupRuntime,
} from "./applicationStartupRuntime.js";
import {
    getRendererErrorMessage,
    type RendererErrorEventHandlers,
} from "./errorHandling.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";
import type { RendererAddEventListener } from "./runtimeEnvironment.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import type {
    ListenForThemeChange,
    ShowAboutModal,
    ShowNotification,
    ShowUpdateNotification,
} from "./startupCallbackTypes.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type { SetupThemeOptions } from "../utils/theming/core/setupTheme.js";
import type { AppStartTimeGetter } from "../utils/state/domain/appDomainState.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

type RendererStartupLogLevel = "error" | "log" | "warn";
type RendererStartupLogger = (
    level: RendererStartupLogLevel,
    ...args: unknown[]
) => void;

type RendererHandleOpenFile = SetupListenersOptions["handleOpenFile"];
type RendererSetupListeners = (options: SetupListenersOptions) => unknown;
type RendererSetupTheme = (
    applyTheme: ApplyTheme,
    listenForThemeChange: ListenForThemeChange,
    options?: SetupThemeOptions
) => unknown;

export interface RendererDependencies {
    applyTheme: ApplyTheme;
    electronApiScope: RendererElectronApiScope;
    handleOpenFile: RendererHandleOpenFile;
    isOpeningFileRef: RendererFileOpeningStateRef;
    listenForThemeChange: ListenForThemeChange;
    openFileBtn: HTMLElement | null;
    setLoading: (loading: boolean) => void;
    showAboutModal: ShowAboutModal | undefined;
    showNotification: ShowNotification;
    showUpdateNotification: ShowUpdateNotification | undefined;
}

export type RendererApplicationStartupActions = Readonly<{
    readonly setInitialized: (initialized: boolean) => void;
}>;

interface RendererApplicationStartupOptions {
    addEventListener: RendererAddEventListener;
    appActions: RendererApplicationStartupActions;
    applyTheme: ApplyTheme;
    errorHandlers: RendererErrorEventHandlers;
    getElectronApiScope: () => RendererElectronApiScope;
    getAppStartTime: AppStartTimeGetter;
    handleOpenFile: RendererHandleOpenFile;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isDevelopmentMode: () => boolean;
    isOpeningFileRef: RendererFileOpeningStateRef;
    listenForThemeChange: ListenForThemeChange;
    logRenderer: RendererStartupLogger;
    performanceMonitor: RendererPerformanceMonitor;
    runtime?: RendererApplicationStartupRuntime | undefined;
    setLoading: (loading: boolean) => void;
    showAboutModal: ShowAboutModal | undefined;
    showNotification: ShowNotification;
    showUpdateNotification: ShowUpdateNotification | undefined;
    setupListeners: RendererSetupListeners;
    setupTheme: RendererSetupTheme;
    setupCreditsMarquee: () => void;
    validateDOMElements: () => boolean;
}

export function createRendererApplicationStartup(
    options: RendererApplicationStartupOptions
): () => Promise<void> {
    const runtime = options.runtime ?? getRendererApplicationStartupRuntime();

    async function initializeApplication(): Promise<void> {
        options.performanceMonitor.start("app_initialization");
        const startupListenerController = runtime.createAbortController();

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

            const dependencies = createRendererDependencies(
                openFileBtn,
                options
            );

            await initializeComponents(
                dependencies,
                options,
                startupListenerController,
                runtime
            );

            const electronApiHooks = getElectronApiStartupHooks({
                getElectronApiScope: options.getElectronApiScope,
            });
            if (electronApiHooks !== null) {
                registerStartupElectronHooks(
                    electronApiHooks,
                    openFileBtn,
                    options.showAboutModal,
                    options.applyTheme
                );
            }

            try {
                options.getAppStartTime();
            } catch {
                /* Ignore errors */
            }

            markApplicationInitialized(options.appActions);

            const initTime =
                options.performanceMonitor.end("app_initialization");
            options.logRenderer(
                "log",
                `[Renderer] Application initialized successfully in ${initTime.toFixed(2)}ms`
            );

            if (options.isDevelopmentMode()) {
                scheduleStartupNotification(
                    options,
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

            scheduleStartupNotification(
                options,
                `Initialization failed: ${getRendererErrorMessage(error)}`,
                "error",
                10_000
            );
        }
    }

    return initializeApplication;
}

function scheduleStartupNotification(
    options: {
        logRenderer: RendererStartupLogger;
        showNotification: ShowNotification;
    },
    message: string,
    type: "error" | "success",
    timeout: number
): void {
    void Promise.resolve()
        .then(() => options.showNotification(message, type, timeout))
        .catch((error: unknown) => {
            options.logRenderer(
                "warn",
                "[Renderer] Startup notification failed:",
                error
            );
        });
}

async function initializeAsyncComponents(
    options: RendererApplicationStartupOptions,
    startupListenerController: AbortController,
    runtime: RendererApplicationStartupRuntime
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
                const updateCheckTimer = runtime.setTimeout(() => {
                    electronApiHooks.checkForUpdates?.();
                }, 5000);
                options.addEventListener(
                    "beforeunload",
                    () => {
                        runtime.clearTimeout(updateCheckTimer);
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
    startupListenerController: AbortController,
    runtime: RendererApplicationStartupRuntime
): Promise<void> {
    try {
        options.performanceMonitor.start("theme_setup");
        options.logRenderer("log", "[Renderer] Setting up theme system...");
        try {
            options.setupTheme(
                dependencies.applyTheme,
                dependencies.listenForThemeChange,
                { electronApiScope: dependencies.electronApiScope }
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
            const setupListenerDependencies =
                createSetupListenersOptions(dependencies);
            if (setupListenerDependencies !== undefined) {
                options.setupListeners(setupListenerDependencies);
            }
        } catch (error) {
            options.logRenderer(
                "warn",
                "[Renderer] Listener setup skipped or failed:",
                getErrorMessage(error)
            );
        }
        options.performanceMonitor.end("listeners_setup");

        options.performanceMonitor.start("async_components");
        options.logRenderer(
            "log",
            "[Renderer] Initializing async components..."
        );
        await initializeAsyncComponents(
            options,
            startupListenerController,
            runtime
        );
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
    openFileBtn: HTMLElement | null,
    options: RendererApplicationStartupOptions
): RendererDependencies {
    return {
        applyTheme: options.applyTheme,
        electronApiScope: options.getElectronApiScope(),
        handleOpenFile: options.handleOpenFile,
        isOpeningFileRef: options.isOpeningFileRef,
        listenForThemeChange: options.listenForThemeChange,
        openFileBtn,
        setLoading: options.setLoading,
        showAboutModal: options.showAboutModal,
        showNotification: options.showNotification,
        showUpdateNotification: options.showUpdateNotification,
    };
}

function createSetupListenersOptions(
    dependencies: RendererDependencies
): SetupListenersOptions | undefined {
    const {
        handleOpenFile,
        electronApiScope,
        showAboutModal,
        showNotification,
        showUpdateNotification,
    } = dependencies;
    if (
        showAboutModal === undefined ||
        showNotification === undefined ||
        showUpdateNotification === undefined
    ) {
        return undefined;
    }

    return {
        electronApiScope,
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
        const duration = resolveUpdateNotificationDuration(
            typeOrDuration,
            durationOrMode
        );
        const action =
            typeof durationOrMode === "string" ? durationOrMode : mode;

        return showUpdateNotification(message, type, duration, action);
    };
}

function resolveUpdateNotificationDuration(
    typeOrDuration: number | string | undefined,
    durationOrMode: number | string | undefined
): number | undefined {
    if (typeof typeOrDuration === "number") {
        return typeOrDuration;
    }

    return typeof durationOrMode === "number" ? durationOrMode : undefined;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function markApplicationInitialized(
    appActions: RendererApplicationStartupActions
): void {
    appActions.setInitialized(true);
}
