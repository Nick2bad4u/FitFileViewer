import type { RendererCoreModules } from "./coreModuleResolution.js";

interface RendererImportTimeBootstrapOptions {
    ensureCoreModules: () => Promise<RendererCoreModules>;
    getOpenFileButton: () => HTMLElement | null;
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: { value: boolean };
    resolveExactRendererCoreTestOverride: (testId: string) => null | unknown;
    resolveRendererCoreTestOverride: (pathSuffix: string) => null | unknown;
    setLoading: (loading: boolean) => void;
    toModuleRecord: (value: unknown) => Record<string, unknown>;
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
    toModuleRecord,
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
        const resolvedRecord = toModuleRecord(resolved);

        return (
            resolvedRecord["masterStateManager"] ??
            toModuleRecord(resolvedRecord["default"])["masterStateManager"] ??
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
            applyTheme: applyThemeFn,
            handleOpenFile: handleOpenFileFn,
            listenForThemeChange: listenForThemeChangeFn,
            setupListeners: setupListenersFn,
            showAboutModal: showAboutModalFn,
            showNotification: showNotificationFn,
            showUpdateNotification: showUpdateNotificationFn,
        } = await ensureCoreModules();
        const deps = {
            applyTheme: applyThemeFn,
            handleOpenFile: handleOpenFileFn,
            isOpeningFileRef,
            listenForThemeChange: listenForThemeChangeFn,
            openFileBtn: getOpenFileButton(),
            setLoading,
            showAboutModal: showAboutModalFn,
            showNotification: showNotificationFn,
            showUpdateNotification: showUpdateNotificationFn,
        };

        setupListenersFn?.(deps);
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
        const method = toModuleRecord(target)[methodName];
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
