type RendererUnknownFunctionCaller = (
    candidate: unknown,
    args?: unknown[]
) => unknown;

type ManualMockResolver = (specifier: string) => null | unknown;

interface RendererTestOnlyBootstrapOptions {
    callUnknownFunction: RendererUnknownFunctionCaller;
    getOpenFileButton: () => HTMLElement | null;
    isOpeningFileRef: { value: boolean };
    resolveExactManualMock: ManualMockResolver;
    resolveManualMock: ManualMockResolver;
    scheduleImportTimeThemeSetup: () => void;
    setLoading: (loading: boolean) => void;
}

export function createTestDOMContentLoadedSetupHandler(
    options: RendererTestOnlyBootstrapOptions
): () => void {
    return () => {
        try {
            const moduleRecord = toModuleRecord(
                options.resolveExactManualMock(
                    "../../utils/app/lifecycle/listeners.js"
                ) ??
                    options.resolveManualMock(
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
                options.resolveExactManualMock(
                    "../../utils/theming/core/setupTheme.js"
                ) ??
                    options.resolveManualMock(
                        "/utils/theming/core/setupTheme.js"
                    )
            );
            const themeModule = toModuleRecord(
                options.resolveExactManualMock(
                    "../../utils/theming/core/theme.js"
                ) ?? options.resolveManualMock("/utils/theming/core/theme.js")
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
    onTestDOMContentLoadedSetupListeners: () => void
): void {
    const abortController = new AbortController();
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
    onTestWindowLoadSetupTheme: () => void
): void {
    const abortController = new AbortController();
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

function toModuleRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}
