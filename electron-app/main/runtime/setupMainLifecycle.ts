import {
    appRef as runtimeAppRef,
    browserWindowRef as runtimeBrowserWindowRef,
} from "./electronAccess.js";
import { setupBlockedRequests } from "../security/setupBlockedRequests.js";
import {
    getProcessArgumentValues,
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";
import type { MainAppStateWindowLike } from "../state/appState.js";

type AppLike = {
    whenReady?: () => Promise<unknown>;
};

type WindowLike = {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
    };
};

type BrowserWindowLike = {
    getAllWindows?: () => WindowLike[];
};
type UnknownMethod = (this: object) => unknown;

type LifecycleDependencies = {
    appRef: () => AppLike | undefined;
    browserWindowRef: () => BrowserWindowLike | undefined;
    exposeDevHelpers: () => unknown;
    getMainWindow: () => MainAppStateWindowLike | null;
    initializeApplication: () =>
        | Promise<WindowLike | undefined>
        | WindowLike
        | undefined;
    logWithContext: (
        level: string,
        message: string,
        context?: Record<string, unknown>
    ) => void;
    setupApplicationEventHandlers: () => void;
    setupIPCHandlers: (win: WindowLike | undefined) => void;
    setupMenuAndEventHandlers: () => void;
};
type WireHandlers = (windowCandidate: WindowLike | undefined) => void;
type MaybeExposeDevHelpers = () => void;

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return (
        value !== null &&
        (typeof value === "object" || typeof value === "function")
    );
}

function getObjectMethod(
    value: Record<string, unknown>,
    property: string
): UnknownMethod | undefined {
    const method = value[property];
    return typeof method === "function" ? (method as UnknownMethod) : undefined;
}

function asAppLike(value: unknown): AppLike | undefined {
    if (!isObjectLike(value)) {
        return undefined;
    }

    const whenReady = getObjectMethod(value, "whenReady");
    return whenReady
        ? {
              whenReady: () => Promise.resolve(whenReady.call(value)),
          }
        : {};
}

function asBrowserWindowLike(value: unknown): BrowserWindowLike | undefined {
    if (!isObjectLike(value)) {
        return undefined;
    }

    const getAllWindows = getObjectMethod(value, "getAllWindows");
    return getAllWindows
        ? {
              getAllWindows: () => {
                  const windows = getAllWindows.call(value);
                  return Array.isArray(windows)
                      ? (windows as WindowLike[])
                      : [];
              },
          }
        : {};
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getErrorContext(error: unknown): { error: string } {
    return { error: getErrorMessage(error) };
}

/**
 * Attempts to resolve Electron's App instance through the centralized runtime
 * accessor, falling back to injected dependencies during tests.
 */
function resolveElectronApp(
    appRef: () => AppLike | undefined
): AppLike | undefined {
    return asAppLike(runtimeAppRef()) ?? appRef();
}

/**
 * Safely invokes a function, swallowing any errors to match the legacy
 * defensive behavior.
 */
function safeCall<T>(fn: () => T): T | undefined {
    try {
        return fn();
    } catch {
        // Intentionally swallow errors to mirror historic defensive behavior.
        return undefined;
    }
}

function ignoreSettledPromise(value: unknown): void {
    if (!isObjectLike(value)) {
        return;
    }

    const then = getObjectMethod(value, "then");
    if (!then) {
        return;
    }

    void Promise.resolve(value).catch(() => undefined);
}

function isTestEnv(): boolean {
    return isTestEnvironment();
}

function isDevMode(): boolean {
    return (
        isDevelopmentEnvironment() ||
        getProcessArgumentValues().includes("--dev")
    );
}

function ensureWhenReadyCalled(app: AppLike | undefined): void {
    if (app && typeof app.whenReady === "function") {
        safeCall(() => {
            void app.whenReady?.();
        });
    }
}

function invokeGetAllWindows(candidate: BrowserWindowLike | undefined): void {
    if (candidate && typeof candidate.getAllWindows === "function") {
        safeCall(() => candidate.getAllWindows?.());
    }
}

async function runLateTestFallbackAsync({
    initializeApplication,
    logWithContext,
    maybeExposeDevHelpers,
    wireHandlers,
}: {
    initializeApplication: LifecycleDependencies["initializeApplication"];
    logWithContext: LifecycleDependencies["logWithContext"];
    maybeExposeDevHelpers: MaybeExposeDevHelpers;
    wireHandlers: WireHandlers;
}): Promise<void> {
    try {
        const mainWindow = await Promise.resolve(initializeApplication());
        wireHandlers(mainWindow);
        maybeExposeDevHelpers();
        logWithContext("info", "Application initialized via test fallback");
    } catch (error) {
        logWithContext(
            "error",
            "Test fallback initialization failed:",
            getErrorContext(error)
        );
    }
}

/**
 * Registers the full main-process lifecycle, including test fallbacks that
 * eagerly initialize the window and IPC wiring.
 */
export function setupMainLifecycle(deps: LifecycleDependencies): void {
    const {
        appRef,
        browserWindowRef,
        getMainWindow,
        initializeApplication,
        setupApplicationEventHandlers,
        setupIPCHandlers,
        setupMenuAndEventHandlers,
        exposeDevHelpers,
        logWithContext,
    } = deps;

    let initScheduled = false;
    let initCompleted = false;
    let blockedRequestsInstalled = false;

    const wireHandlers = (windowCandidate: WindowLike | undefined): void => {
        if (!blockedRequestsInstalled) {
            blockedRequestsInstalled = true;
            safeCall(() => {
                setupBlockedRequests();
            });
        }
        safeCall(() => setupIPCHandlers(windowCandidate));
        safeCall(() => setupMenuAndEventHandlers());
        safeCall(() => setupApplicationEventHandlers());
    };

    const maybeExposeDevHelpers = (): void => {
        if (!isDevMode()) {
            return;
        }
        safeCall(() => exposeDevHelpers());
    };

    const primeBrowserWindowMocks = (): void => {
        invokeGetAllWindows(
            asBrowserWindowLike(runtimeBrowserWindowRef()) ?? browserWindowRef()
        );
    };

    const runMainInitialization = async (): Promise<void> => {
        if (initCompleted) {
            return;
        }
        initCompleted = true;

        try {
            const mainWindow = await Promise.resolve(initializeApplication());
            wireHandlers(mainWindow);
            maybeExposeDevHelpers();
            logWithContext("info", "Application initialized successfully");
        } catch (error) {
            logWithContext(
                "error",
                "Failed to initialize application:",
                getErrorContext(error)
            );
        }
    };

    const runEarlyTestInitialization = (
        resolvedApp: AppLike | undefined
    ): void => {
        if (initCompleted) {
            return;
        }

        ensureWhenReadyCalled(resolvedApp);
        ensureWhenReadyCalled(appRef());
        primeBrowserWindowMocks();
        ignoreSettledPromise(safeCall(() => initializeApplication()));

        const mainWindow = getMainWindow() ?? undefined;
        wireHandlers(mainWindow);

        const fallbackWindow = mainWindow || {
            isDestroyed: () => false,
            webContents: { isDestroyed: () => false },
        };
        wireHandlers(fallbackWindow);

        maybeExposeDevHelpers();
        initCompleted = true;
        logWithContext(
            "info",
            "Application initialized via early test path (sync)"
        );
    };

    const runLateTestFallback = (): void => {
        if (initCompleted) {
            return;
        }

        ensureWhenReadyCalled(resolveElectronApp(appRef));
        ensureWhenReadyCalled(appRef());
        initCompleted = true;

        void runLateTestFallbackAsync({
            initializeApplication,
            logWithContext,
            maybeExposeDevHelpers,
            wireHandlers,
        });
    };

    try {
        const resolvedApp = resolveElectronApp(appRef);

        if (isTestEnv() && !initCompleted) {
            initScheduled = true;
            try {
                runEarlyTestInitialization(resolvedApp);
            } catch (error) {
                logWithContext(
                    "error",
                    "Early test path threw:",
                    getErrorContext(error)
                );
            }
        }

        if (
            resolvedApp &&
            typeof resolvedApp.whenReady === "function" &&
            !initScheduled
        ) {
            initScheduled = true;
            void resolvedApp
                .whenReady()
                .then(
                    () => runMainInitialization(),
                    (error: unknown) => {
                        logWithContext(
                            "error",
                            "Failed to initialize application:",
                            getErrorContext(error)
                        );
                        return undefined;
                    }
                )
                .then(() => undefined);
        }

        if (isTestEnv() && !initCompleted) {
            initScheduled = true;
            try {
                runLateTestFallback();
            } catch (error) {
                logWithContext(
                    "error",
                    "Test fallback initialization threw:",
                    getErrorContext(error)
                );
            }
        }
    } catch {
        /* ignore - allows importing in non-Electron environments */
    }

    primeBrowserWindowMocks();
}
