import {
    getRendererTestOnlyBootstrapRuntime,
    type RendererTestOnlyBootstrapRuntime,
} from "./testOnlyBootstrapRuntime.js";

type RendererTestOverrideResolver = (specifier: string) => null | unknown;
type RendererTestSetupListeners = (
    dependencies: RendererTestSetupListenersDependencies
) => unknown;
type RendererTestSetupTheme = (
    applyTheme: () => void,
    listenForThemeChange: () => void
) => unknown;

interface RendererTestSetupListenersDependencies {
    readonly applyTheme: () => void;
    readonly handleOpenFile: () => void;
    readonly isOpeningFileRef: { value: boolean };
    readonly listenForThemeChange: () => void;
    readonly openFileBtn: HTMLElement | null;
    readonly setLoading: (loading: boolean) => void;
    readonly showAboutModal: () => void;
    readonly showNotification: () => void;
    readonly showUpdateNotification: () => void;
}

interface RendererTestOnlyBootstrapOptions {
    getOpenFileButton: () => HTMLElement | null;
    isOpeningFileRef: { value: boolean };
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
            const moduleRecord = toModuleRecord(
                options.resolveExactRendererCoreTestOverride(
                    "../../utils/app/lifecycle/listeners.js"
                ) ??
                    options.resolveRendererCoreTestOverride(
                        "/utils/app/lifecycle/listeners.js"
                    )
            );
            const setupListenersFn = toRendererTestSetupListeners(
                moduleRecord["setupListeners"]
            );
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
            const setupThemeModule = toModuleRecord(
                options.resolveExactRendererCoreTestOverride(
                    "../../utils/theming/core/setupTheme.js"
                ) ??
                    options.resolveRendererCoreTestOverride(
                        "/utils/theming/core/setupTheme.js"
                    )
            );
            const themeModule = toModuleRecord(
                options.resolveExactRendererCoreTestOverride(
                    "../../utils/theming/core/theme.js"
                ) ??
                    options.resolveRendererCoreTestOverride(
                        "/utils/theming/core/theme.js"
                    )
            );
            const setupThemeFn = toRendererTestSetupTheme(
                setupThemeModule["setupTheme"]
            );
            const applyThemeFn = toNoopFunction(themeModule["applyTheme"]);
            const listenForThemeChangeFn = toNoopFunction(
                themeModule["listenForThemeChange"]
            );
            if (
                setupThemeFn !== undefined &&
                applyThemeFn !== undefined &&
                listenForThemeChangeFn !== undefined
            ) {
                setupThemeFn(applyThemeFn, listenForThemeChangeFn);
                return;
            }
        } catch {
            /* Ignore errors */
        }

        options.scheduleImportTimeThemeSetup();
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
    globalEventTarget: RendererTestOnlyBootstrapEventTarget,
    unloadTarget: RendererTestOnlyBootstrapEventTarget,
    onTestWindowLoadSetupTheme: () => void,
    runtime: RendererTestOnlyBootstrapRuntime = getRendererTestOnlyBootstrapRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const removeTestWindowLoadThemeSetupListener = (): void => {
        abortController.abort();
    };

    globalEventTarget.addEventListener("load", onTestWindowLoadSetupTheme, {
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
        readonly globalEventTarget: RendererTestOnlyBootstrapEventTarget;
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
            targets.globalEventTarget,
            targets.unloadTarget,
            onTestWindowLoadSetupTheme
        );
    } catch {
        /* Ignore errors */
    }
}

function toModuleRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

function toNoopFunction(value: unknown): (() => void) | undefined {
    return typeof value === "function" ? (value as () => void) : undefined;
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
