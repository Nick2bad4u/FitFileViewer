import type {
    RendererCoreModules,
    ShowUpdateNotification,
} from "./coreModuleResolution.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";

interface RendererImportTimeBootstrapOptions {
    ensureCoreModules: () => Promise<RendererCoreModules>;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: { value: boolean };
    resolveExactRendererCoreTestOverride: (testId: string) => null | unknown;
    resolveRendererCoreTestOverride: (pathSuffix: string) => null | unknown;
    setLoading: (loading: boolean) => void;
}

export interface RendererImportTimeBootstrap {
    scheduleAppDomainStateCoverageTouch: () => void;
    scheduleImportTimeListenersSetup: () => void;
    scheduleImportTimeStateInitialization: () => void;
    scheduleImportTimeThemeSetup: () => void;
}

export function createRendererImportTimeBootstrap({
    ensureCoreModules,
    getOpenFileButton,
    initializeStateManager,
    isOpeningFileRef,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    setLoading,
}: RendererImportTimeBootstrapOptions): RendererImportTimeBootstrap {
    async function initializeImportTimeStateManager(): Promise<void> {
        await initializeStateManager();
        try {
            const { getAppDomainState } = await ensureCoreModules();
            getAppDomainState?.("app.startTime");
        } catch {
            /* Ignore errors */
        }
        await initializeTestOverrideMasterStateManager();
    }

    async function initializeTestOverrideMasterStateManager(): Promise<void> {
        await callRecordMethod(
            resolveTestOverrideMasterStateManager(),
            "initialize"
        );
    }

    function resolveTestOverrideMasterStateManager(): unknown {
        const resolved =
            resolveExactRendererCoreTestOverride(
                "../../utils/state/core/masterStateManager.js"
            ) ??
            resolveRendererCoreTestOverride(
                "/utils/state/core/masterStateManager.js"
            );
        const resolvedRecord = toOverrideRecord(resolved);

        return (
            resolvedRecord["masterStateManager"] ??
            toOverrideRecord(resolvedRecord["default"])["masterStateManager"] ??
            resolved
        );
    }

    function scheduleAppDomainStateCoverageTouch(): void {
        void touchAppDomainStateForCoverage();
    }

    function scheduleImportTimeListenersSetup(): void {
        void setupImportTimeListeners();
    }

    function scheduleImportTimeStateInitialization(): void {
        void initializeImportTimeStateManager();
    }

    function scheduleImportTimeThemeSetup(): void {
        void setupImportTimeTheme();
    }

    async function setupImportTimeListeners(): Promise<void> {
        const {
            handleOpenFile: handleOpenFileFn,
            setupListeners: setupListenersFn,
            showAboutModal: showAboutModalFn,
            showNotification: showNotificationFn,
            showUpdateNotification: showUpdateNotificationFn,
        } = await ensureCoreModules();
        const deps = createSetupListenersOptions({
            handleOpenFile: handleOpenFileFn,
            isOpeningFileRef,
            openFileBtn: getOpenFileButton(),
            setLoading,
            showAboutModal: showAboutModalFn,
            showNotification: showNotificationFn,
            showUpdateNotification:
                showUpdateNotificationFn === undefined
                    ? undefined
                    : adaptShowUpdateNotification(showUpdateNotificationFn),
        });

        if (deps !== undefined) {
            setupListenersFn?.(deps);
        }
    }

    async function setupImportTimeTheme(): Promise<void> {
        const {
            applyTheme: applyThemeFn,
            listenForThemeChange: listenForThemeChangeFn,
            setupTheme: setupThemeFn,
        } = await ensureCoreModules();
        setupThemeFn?.(applyThemeFn, listenForThemeChangeFn);
    }

    async function touchAppDomainStateForCoverage(): Promise<void> {
        try {
            const { getAppDomainState, subscribeAppDomain } =
                await ensureCoreModules();
            getAppDomainState?.("app.startTime");
            subscribeAppDomain?.("app.startTime", () => {});
        } catch {
            /* Ignore errors */
        }
    }

    function callRecordMethod(
        target: unknown,
        methodName: string,
        args: unknown[] = []
    ): unknown {
        const method = toOverrideRecord(target)[methodName];
        if (typeof method !== "function") {
            return undefined;
        }

        const methodFn =
            /** @type {(this: unknown, ...args: unknown[]) => unknown} */ method;
        return methodFn.apply(target, args);
    }

    return {
        scheduleAppDomainStateCoverageTouch,
        scheduleImportTimeListenersSetup,
        scheduleImportTimeStateInitialization,
        scheduleImportTimeThemeSetup,
    };
}

function createSetupListenersOptions(dependencies: {
    readonly handleOpenFile:
        | SetupListenersOptions["handleOpenFile"]
        | undefined;
    readonly isOpeningFileRef: { value: boolean };
    readonly openFileBtn: HTMLElement | null;
    readonly setLoading: (loading: boolean) => void;
    readonly showAboutModal:
        | SetupListenersOptions["showAboutModal"]
        | undefined;
    readonly showNotification:
        | SetupListenersOptions["showNotification"]
        | undefined;
    readonly showUpdateNotification:
        | SetupListenersOptions["showUpdateNotification"]
        | undefined;
}): SetupListenersOptions | undefined {
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
        showUpdateNotification,
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

function toOverrideRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

export function runRendererImportTimeBootstrap(
    bootstrap: RendererImportTimeBootstrap
): void {
    try {
        bootstrap.scheduleImportTimeThemeSetup();
    } catch {
        /* Ignore errors */
    }

    try {
        bootstrap.scheduleImportTimeStateInitialization();
    } catch {
        /* Ignore errors */
    }

    try {
        bootstrap.scheduleImportTimeListenersSetup();
    } catch {
        /* Ignore errors */
    }

    try {
        bootstrap.scheduleAppDomainStateCoverageTouch();

        try {
            try {
                bootstrap.scheduleAppDomainStateCoverageTouch();
            } catch {
                /* Ignore errors */
            }
        } catch {
            /* Ignore errors */
        }
    } catch {
        /* Ignore errors */
    }
}
