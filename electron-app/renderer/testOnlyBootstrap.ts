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
    readonly setupListeners?: RendererTestSetupListeners | undefined;
}>;
type RendererTestSetupThemeOverrideModule = Readonly<{
    readonly setupTheme?: RendererTestSetupTheme | undefined;
}>;
type RendererTestThemeOverrideModule = Readonly<{
    readonly applyTheme?: (() => void) | undefined;
    readonly listenForThemeChange?: (() => void) | undefined;
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

    return toTestSetupListenersOverrideModule(override)?.setupListeners;
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

    return toTestSetupThemeOverrideModule(override)?.setupTheme;
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

    const themeOverrideModule = toTestThemeOverrideModule(override);
    if (themeOverrideModule === undefined) {
        return {
            applyTheme: undefined,
            listenForThemeChange: undefined,
        };
    }

    return {
        applyTheme: themeOverrideModule.applyTheme,
        listenForThemeChange: themeOverrideModule.listenForThemeChange,
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

function toTestSetupListenersOverrideModule(
    value: unknown
): RendererTestSetupListenersOverrideModule | undefined {
    if (
        typeof value !== "object" ||
        value === null ||
        !("setupListeners" in value)
    ) {
        return undefined;
    }

    const setupListeners = toRendererTestSetupListeners(value.setupListeners);
    return setupListeners === undefined ? undefined : { setupListeners };
}

function toTestSetupThemeOverrideModule(
    value: unknown
): RendererTestSetupThemeOverrideModule | undefined {
    if (
        typeof value !== "object" ||
        value === null ||
        !("setupTheme" in value)
    ) {
        return undefined;
    }

    const setupTheme = toRendererTestSetupTheme(value.setupTheme);
    return setupTheme === undefined ? undefined : { setupTheme };
}

function toTestThemeOverrideModule(
    value: unknown
): RendererTestThemeOverrideModule | undefined {
    if (typeof value !== "object" || value === null) {
        return undefined;
    }

    const applyTheme =
        "applyTheme" in value ? toNoopFunction(value.applyTheme) : undefined;
    const listenForThemeChange =
        "listenForThemeChange" in value
            ? toNoopFunction(value.listenForThemeChange)
            : undefined;

    if (applyTheme === undefined && listenForThemeChange === undefined) {
        return undefined;
    }

    return {
        applyTheme,
        listenForThemeChange,
    };
}

function toNoopFunction(value: unknown): (() => void) | undefined {
    return isNoopFunction(value) ? value : undefined;
}

function isNoopFunction(value: unknown): value is () => void {
    return typeof value === "function";
}

function toRendererTestSetupListeners(
    value: unknown
): RendererTestSetupListeners | undefined {
    return isRendererTestSetupListeners(value) ? value : undefined;
}

function isRendererTestSetupListeners(
    value: unknown
): value is RendererTestSetupListeners {
    return typeof value === "function";
}

function toRendererTestSetupTheme(
    value: unknown
): RendererTestSetupTheme | undefined {
    return isRendererTestSetupTheme(value) ? value : undefined;
}

function isRendererTestSetupTheme(
    value: unknown
): value is RendererTestSetupTheme {
    return typeof value === "function";
}
