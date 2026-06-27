import {
    getRendererTestOnlyBootstrapRuntime,
    type RendererTestOnlyBootstrapRuntime,
} from "./testOnlyBootstrapRuntime.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

type RendererTestOverrideResolver = (specifier: string) => null | unknown;
type RendererTestSetupListeners = (
    dependencies: RendererTestSetupListenersDependencies
) => unknown;
type RendererTestSetupTheme = (
    applyTheme: () => void,
    listenForThemeChange: () => void
) => unknown;
type RendererTestSetupListenersOverrideModule = Readonly<{
    setupListeners?: unknown;
}>;
type RendererTestSetupThemeOverrideModule = Readonly<{
    setupTheme?: unknown;
}>;
type RendererTestThemeOverrideModule = Readonly<{
    applyTheme?: unknown;
    listenForThemeChange?: unknown;
}>;

interface RendererTestSetupListenersDependencies {
    readonly applyTheme: () => void;
    readonly handleOpenFile: () => void;
    readonly isOpeningFileRef: RendererFileOpeningStateRef;
    readonly listenForThemeChange: () => void;
    readonly openFileBtn: HTMLElement | null;
    readonly setLoading: (loading: boolean) => void;
    readonly showAboutModal: () => void;
    readonly showNotification: () => void;
    readonly showUpdateNotification: () => void;
}

interface RendererTestOnlyBootstrapOptions {
    getOpenFileButton: () => HTMLElement | null;
    isOpeningFileRef: RendererFileOpeningStateRef;
    resolveExactRendererCoreTestOverride: RendererTestOverrideResolver;
    resolveRendererCoreTestOverride: RendererTestOverrideResolver;
    scheduleImportTimeThemeSetup: () => void;
    setLoading: (loading: boolean) => void;
}

type RendererTestOnlyBootstrapEventTarget = Pick<
    EventTarget,
    "addEventListener"
>;

export function createTestDOMContentLoadedSetupHandler(
    options: RendererTestOnlyBootstrapOptions
): () => void {
    return () => {
        try {
            const setupListenersFn = getTestSetupListenersOverride(options);
            setupListenersFn?.({
                applyTheme: () => {},
                handleOpenFile: () => {},
                isOpeningFileRef: options.isOpeningFileRef,
                listenForThemeChange: () => {},
                openFileBtn: options.getOpenFileButton(),
                setLoading: options.setLoading,
                showAboutModal: () => {},
                showNotification: () => {},
                showUpdateNotification: () => {},
            });
        } catch {
            /* Ignore errors */
        }
    };
}

export function createTestWindowLoadThemeSetupHandler(
    options: RendererTestOnlyBootstrapOptions
): () => void {
    return () => {
        try {
            const setupThemeFn = getTestSetupThemeOverride(options);
            const themeOverrides = getTestThemeOverrides(options);
            if (
                setupThemeFn !== undefined &&
                themeOverrides.applyTheme !== undefined &&
                themeOverrides.listenForThemeChange !== undefined
            ) {
                setupThemeFn(
                    themeOverrides.applyTheme,
                    themeOverrides.listenForThemeChange
                );
                return;
            }
        } catch {
            /* Ignore errors */
        }

        options.scheduleImportTimeThemeSetup();
    };
}

function getTestSetupListenersOverride(
    options: RendererTestOnlyBootstrapOptions
): RendererTestSetupListeners | undefined {
    const override =
        options.resolveExactRendererCoreTestOverride(
            "../../utils/app/lifecycle/listeners.js"
        ) ??
        options.resolveRendererCoreTestOverride(
            "/utils/app/lifecycle/listeners.js"
        );

    if (!isTestSetupListenersOverrideModule(override)) {
        return undefined;
    }

    return toRendererTestSetupListeners(override.setupListeners);
}

function getTestSetupThemeOverride(
    options: RendererTestOnlyBootstrapOptions
): RendererTestSetupTheme | undefined {
    const override =
        options.resolveExactRendererCoreTestOverride(
            "../../utils/theming/core/setupTheme.js"
        ) ??
        options.resolveRendererCoreTestOverride(
            "/utils/theming/core/setupTheme.js"
        );

    if (!isTestSetupThemeOverrideModule(override)) {
        return undefined;
    }

    return toRendererTestSetupTheme(override.setupTheme);
}

function getTestThemeOverrides(options: RendererTestOnlyBootstrapOptions): {
    readonly applyTheme: (() => void) | undefined;
    readonly listenForThemeChange: (() => void) | undefined;
} {
    const override =
        options.resolveExactRendererCoreTestOverride(
            "../../utils/theming/core/theme.js"
        ) ??
        options.resolveRendererCoreTestOverride("/utils/theming/core/theme.js");

    if (!isTestThemeOverrideModule(override)) {
        return {
            applyTheme: undefined,
            listenForThemeChange: undefined,
        };
    }

    return {
        applyTheme: toNoopFunction(override.applyTheme),
        listenForThemeChange: toNoopFunction(
            override.listenForThemeChange
        ),
    };
}

export function registerTestDOMContentLoadedSetupListener(
    documentTarget: Document,
    unloadTarget: RendererTestOnlyBootstrapEventTarget,
    onTestDOMContentLoadedSetupListeners: () => void,
    runtime: RendererTestOnlyBootstrapRuntime = getRendererTestOnlyBootstrapRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const removeTestDOMContentLoadedSetupListener = (): void => {
        abortController.abort();
    };

    documentTarget.addEventListener(
        "DOMContentLoaded",
        onTestDOMContentLoadedSetupListeners,
        { once: false, signal }
    );
    unloadTarget.addEventListener(
        "beforeunload",
        removeTestDOMContentLoadedSetupListener,
        { signal }
    );
}

export function registerTestWindowLoadThemeSetupListener(
    rendererEventTarget: RendererTestOnlyBootstrapEventTarget,
    unloadTarget: RendererTestOnlyBootstrapEventTarget,
    onTestWindowLoadSetupTheme: () => void,
    runtime: RendererTestOnlyBootstrapRuntime = getRendererTestOnlyBootstrapRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const removeTestWindowLoadThemeSetupListener = (): void => {
        abortController.abort();
    };

    rendererEventTarget.addEventListener("load", onTestWindowLoadSetupTheme, {
        signal,
    });
    unloadTarget.addEventListener(
        "beforeunload",
        removeTestWindowLoadThemeSetupListener,
        { signal }
    );
}

export function registerRendererTestOnlyBootstrap(
    options: RendererTestOnlyBootstrapOptions,
    targets: {
        readonly documentTarget: Document;
        readonly rendererEventTarget: RendererTestOnlyBootstrapEventTarget;
        readonly unloadTarget: RendererTestOnlyBootstrapEventTarget;
    }
): void {
    try {
        const onTestDOMContentLoadedSetupListeners =
            createTestDOMContentLoadedSetupHandler(options);
        const onTestWindowLoadSetupTheme =
            createTestWindowLoadThemeSetupHandler(options);

        registerTestDOMContentLoadedSetupListener(
            targets.documentTarget,
            targets.unloadTarget,
            onTestDOMContentLoadedSetupListeners
        );
        registerTestWindowLoadThemeSetupListener(
            targets.rendererEventTarget,
            targets.unloadTarget,
            onTestWindowLoadSetupTheme
        );
    } catch {
        /* Ignore errors */
    }
}

function toNoopFunction(value: unknown): (() => void) | undefined {
    return typeof value === "function" ? (value as () => void) : undefined;
}

function isTestOverrideModuleRecord(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function isTestSetupListenersOverrideModule(
    value: unknown
): value is RendererTestSetupListenersOverrideModule {
    return isTestOverrideModuleRecord(value);
}

function isTestSetupThemeOverrideModule(
    value: unknown
): value is RendererTestSetupThemeOverrideModule {
    return isTestOverrideModuleRecord(value);
}

function isTestThemeOverrideModule(
    value: unknown
): value is RendererTestThemeOverrideModule {
    return isTestOverrideModuleRecord(value);
}

function toRendererTestSetupListeners(
    value: unknown
): RendererTestSetupListeners | undefined {
    return typeof value === "function"
        ? (value as RendererTestSetupListeners)
        : undefined;
}

function toRendererTestSetupTheme(
    value: unknown
): RendererTestSetupTheme | undefined {
    return typeof value === "function"
        ? (value as RendererTestSetupTheme)
        : undefined;
}
