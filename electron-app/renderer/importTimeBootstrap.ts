import type {
    ListenForThemeChange,
    ShowNotification,
    ShowUpdateNotification,
} from "./startupCallbackTypes.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type { SetupThemeOptions } from "../utils/theming/core/setupTheme.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import type {
    AppStartTimeGetter,
    AppStartTimeSubscriber,
} from "../utils/state/domain/appDomainState.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

type RendererHandleOpenFile = SetupListenersOptions["handleOpenFile"];
type RendererSetupListeners = (options: SetupListenersOptions) => unknown;
type RendererSetupTheme = (
    applyTheme: (theme: string, withTransition?: boolean) => void,
    listenForThemeChange: ListenForThemeChange,
    options?: SetupThemeOptions
) => unknown;

interface RendererImportTimeBootstrapOptions {
    applyTheme: (theme: string, withTransition?: boolean) => void;
    getElectronApiScope: () => RendererElectronApiScope;
    getAppStartTime: AppStartTimeGetter;
    handleOpenFile: RendererHandleOpenFile;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: RendererFileOpeningStateRef;
    listenForThemeChange: ListenForThemeChange;
    setLoading: (loading: boolean) => void;
    showAboutModal: ((html?: string) => void) | undefined;
    showNotification: ShowNotification | undefined;
    showUpdateNotification: ShowUpdateNotification | undefined;
    setupListeners: RendererSetupListeners;
    setupTheme: RendererSetupTheme;
    subscribeToAppStartTime: AppStartTimeSubscriber;
}

export interface RendererImportTimeBootstrap {
    scheduleAppDomainStateTouch: () => void;
    scheduleImportTimeListenersSetup: () => void;
    scheduleImportTimeStateInitialization: () => void;
    scheduleImportTimeThemeSetup: () => void;
}

export function createRendererImportTimeBootstrap({
    applyTheme,
    getElectronApiScope,
    getAppStartTime,
    handleOpenFile,
    getOpenFileButton,
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
}: RendererImportTimeBootstrapOptions): RendererImportTimeBootstrap {
    async function initializeImportTimeStateManager(): Promise<void> {
        await initializeStateManager();
        try {
            getAppStartTime();
        } catch {
            /* Ignore errors */
        }
    }

    function scheduleAppDomainStateTouch(): void {
        void touchAppDomainState();
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
        const deps = createSetupListenersOptions({
            electronApiScope: getElectronApiScope(),
            handleOpenFile,
            isOpeningFileRef,
            openFileBtn: getOpenFileButton(),
            setLoading,
            showAboutModal,
            showNotification,
            showUpdateNotification:
                showUpdateNotification === undefined
                    ? undefined
                    : adaptShowUpdateNotification(showUpdateNotification),
        });

        if (deps !== undefined) {
            setupListeners(deps);
        }
    }

    async function setupImportTimeTheme(): Promise<void> {
        setupTheme(applyTheme, listenForThemeChange, {
            electronApiScope: getElectronApiScope(),
        });
    }

    async function touchAppDomainState(): Promise<void> {
        try {
            getAppStartTime();
            subscribeToAppStartTime(() => {});
        } catch {
            /* Ignore errors */
        }
    }

    return {
        scheduleAppDomainStateTouch,
        scheduleImportTimeListenersSetup,
        scheduleImportTimeStateInitialization,
        scheduleImportTimeThemeSetup,
    };
}

function createSetupListenersOptions(dependencies: {
    readonly electronApiScope: SetupListenersOptions["electronApiScope"];
    readonly handleOpenFile: SetupListenersOptions["handleOpenFile"];
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
        bootstrap.scheduleAppDomainStateTouch();
    } catch {
        /* Ignore errors */
    }
}
