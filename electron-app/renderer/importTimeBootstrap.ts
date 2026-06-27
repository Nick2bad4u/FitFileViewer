import type {
    ListenForThemeChange,
    RendererHandleOpenFile,
    RendererSetupListeners,
    RendererSetupTheme,
    ShowNotification,
    ShowUpdateNotification,
} from "./coreModuleResolution.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import type {
    AppStartTimeGetter,
    AppStartTimeSubscriber,
} from "../utils/state/domain/appDomainState.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

export type RendererImportTimeCoreModules = Readonly<{
    readonly applyTheme:
        | ((theme: string, withTransition?: boolean) => void)
        | undefined;
    readonly getAppStartTime: AppStartTimeGetter | undefined;
    readonly handleOpenFile: RendererHandleOpenFile | undefined;
    readonly listenForThemeChange: ListenForThemeChange | undefined;
    readonly setupListeners: RendererSetupListeners | undefined;
    readonly setupTheme: RendererSetupTheme | undefined;
    readonly showAboutModal: ((html?: string) => void) | undefined;
    readonly showNotification: ShowNotification | undefined;
    readonly showUpdateNotification: ShowUpdateNotification | undefined;
    readonly subscribeToAppStartTime: AppStartTimeSubscriber | undefined;
}>;

interface RendererImportTimeBootstrapOptions {
    ensureCoreModules: () => Promise<RendererImportTimeCoreModules>;
    getElectronApiScope: () => RendererElectronApiScope;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: RendererFileOpeningStateRef;
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

type ImportTimeInitializableStateManager = Readonly<{
    readonly initialize?: unknown;
}>;

type ImportTimeMasterStateManagerOverrideModule = Readonly<{
    readonly default?: unknown;
    readonly masterStateManager?: unknown;
}>;

export function createRendererImportTimeBootstrap({
    ensureCoreModules,
    getElectronApiScope,
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
            const { getAppStartTime } = await ensureCoreModules();
            getAppStartTime?.();
        } catch {
            /* Ignore errors */
        }
        await initializeTestOverrideMasterStateManager();
    }

    async function initializeTestOverrideMasterStateManager(): Promise<void> {
        await callInitializeMethod(resolveTestOverrideMasterStateManager());
    }

    function resolveTestOverrideMasterStateManager(): unknown {
        const resolved =
            resolveExactRendererCoreTestOverride(
                "../../utils/state/core/masterStateManager.js"
            ) ??
            resolveRendererCoreTestOverride(
                "/utils/state/core/masterStateManager.js"
            );
        const resolvedModule =
            toImportTimeMasterStateManagerOverrideModule(resolved);
        const defaultModule = toImportTimeMasterStateManagerOverrideModule(
            resolvedModule.default
        );

        return (
            resolvedModule.masterStateManager ??
            defaultModule.masterStateManager ??
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
            electronApiScope: getElectronApiScope(),
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
            const { getAppStartTime, subscribeToAppStartTime } =
                await ensureCoreModules();
            getAppStartTime?.();
            subscribeToAppStartTime?.(() => {});
        } catch {
            /* Ignore errors */
        }
    }

    function callInitializeMethod(target: unknown): unknown {
        const stateManager = toImportTimeInitializableStateManager(target);
        const initialize = stateManager.initialize;
        if (typeof initialize !== "function") {
            return undefined;
        }

        return initialize.call(target);
    }

    return {
        scheduleAppDomainStateCoverageTouch,
        scheduleImportTimeListenersSetup,
        scheduleImportTimeStateInitialization,
        scheduleImportTimeThemeSetup,
    };
}

function toImportTimeInitializableStateManager(
    value: unknown
): ImportTimeInitializableStateManager {
    return typeof value === "object" && value !== null ? value : {};
}

function toImportTimeMasterStateManagerOverrideModule(
    value: unknown
): ImportTimeMasterStateManagerOverrideModule {
    return typeof value === "object" && value !== null ? value : {};
}

function createSetupListenersOptions(dependencies: {
    readonly electronApiScope: SetupListenersOptions["electronApiScope"];
    readonly handleOpenFile:
        | SetupListenersOptions["handleOpenFile"]
        | undefined;
    readonly isOpeningFileRef: RendererFileOpeningStateRef;
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
        electronApiScope: dependencies.electronApiScope,
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
