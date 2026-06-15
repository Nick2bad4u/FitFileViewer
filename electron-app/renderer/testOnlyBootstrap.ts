import {
    getRendererTestOnlyBootstrapRuntime,
    type RendererTestOnlyBootstrapRuntime,
} from "./testOnlyBootstrapRuntime.js";

type RendererUnknownFunctionCaller = (
    candidate: unknown,
    args?: unknown[]
) => unknown;

type RendererTestOverrideResolver = (specifier: string) => null | unknown;

interface RendererTestOnlyBootstrapOptions {
    callUnknownFunction: RendererUnknownFunctionCaller;
    getOpenFileButton: () => HTMLElement | null;
    isOpeningFileRef: { value: boolean };
    resolveExactRendererCoreTestOverride: RendererTestOverrideResolver;
    resolveRendererCoreTestOverride: RendererTestOverrideResolver;
    scheduleImportTimeThemeSetup: () => void;
    setLoading: (loading: boolean) => void;
}

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
            const setupListenersFn = moduleRecord["setupListeners"];
            options.callUnknownFunction(setupListenersFn, [
                {
                    applyTheme: () => {},
                    handleOpenFile: () => {},
                    isOpeningFileRef: options.isOpeningFileRef,
                    listenForThemeChange: () => {},
                    openFileBtn: options.getOpenFileButton(),
                    setLoading: options.setLoading,
                    showAboutModal: () => {},
                    showNotification: () => {},
                    showUpdateNotification: () => {},
                },
            ]);
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
            const setupThemeFn = setupThemeModule["setupTheme"];
            const applyThemeFn = themeModule["applyTheme"];
            const listenForThemeChangeFn = themeModule["listenForThemeChange"];
            if (
                typeof setupThemeFn === "function" &&
                typeof applyThemeFn === "function" &&
                typeof listenForThemeChangeFn === "function"
            ) {
                options.callUnknownFunction(setupThemeFn, [
                    applyThemeFn,
                    listenForThemeChangeFn,
                ]);
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
    unloadTarget: EventTarget,
    onTestDOMContentLoadedSetupListeners: () => void,
    runtime: RendererTestOnlyBootstrapRuntime =
        getRendererTestOnlyBootstrapRuntime()
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
    windowTarget: EventTarget,
    unloadTarget: EventTarget,
    onTestWindowLoadSetupTheme: () => void,
    runtime: RendererTestOnlyBootstrapRuntime =
        getRendererTestOnlyBootstrapRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const removeTestWindowLoadThemeSetupListener = (): void => {
        abortController.abort();
    };

    windowTarget.addEventListener("load", onTestWindowLoadSetupTheme, {
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
        readonly unloadTarget: EventTarget;
        readonly windowTarget: EventTarget;
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
            targets.windowTarget,
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
