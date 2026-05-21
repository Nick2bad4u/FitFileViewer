interface ChartStartupGlobal {
    _fitFileViewerSharedConfigurationAbortController?: AbortController;
    _fitFileViewerSharedConfigurationListener?: unknown;
}

interface RegisterChartStartupParams {
    chartActions: unknown;
    chartGlobal: ChartStartupGlobal;
    loadSharedConfiguration(): unknown;
    setGlobalChartActions(actions: unknown): void;
}

function registerSharedConfigurationLoader(
    chartGlobal: ChartStartupGlobal,
    loadSharedConfiguration: () => unknown
): void {
    if (
        globalThis.window === undefined ||
        typeof globalThis.addEventListener !== "function" ||
        chartGlobal._fitFileViewerSharedConfigurationListener
    ) {
        return;
    }

    const abortController = new AbortController();
    chartGlobal._fitFileViewerSharedConfigurationAbortController =
        abortController;
    chartGlobal._fitFileViewerSharedConfigurationListener = true;

    globalThis.addEventListener(
        "DOMContentLoaded",
        () => {
            try {
                loadSharedConfiguration();
            } finally {
                abortController.abort();
            }
        },
        {
            once: true,
            signal: abortController.signal,
        }
    );
}

/**
 * Registers renderer startup bridges that still need global runtime
 * integration.
 *
 * @param params - Startup dependencies supplied by renderChartJS.
 */
export function registerChartStartup({
    chartActions,
    chartGlobal,
    loadSharedConfiguration,
    setGlobalChartActions,
}: RegisterChartStartupParams): void {
    registerSharedConfigurationLoader(chartGlobal, loadSharedConfiguration);

    try {
        setGlobalChartActions(chartActions);
    } catch {
        // Ignore legacy bridge exposure failures in SSR and tests.
    }
}
