import {
    abortSharedConfigurationListener,
    isSharedConfigurationListenerRegistered,
    registerSharedConfigurationListenerController,
} from "./chartListenerState.js";

interface RegisterChartStartupParams {
    chartActions: unknown;
    loadSharedConfiguration(): unknown;
    setGlobalChartActions(actions: unknown): void;
}

function registerSharedConfigurationLoader(
    loadSharedConfiguration: () => unknown
): void {
    if (
        globalThis.window === undefined ||
        typeof globalThis.addEventListener !== "function" ||
        isSharedConfigurationListenerRegistered()
    ) {
        return;
    }

    const signal = registerSharedConfigurationListenerController();

    globalThis.addEventListener(
        "DOMContentLoaded",
        () => {
            try {
                loadSharedConfiguration();
            } finally {
                abortSharedConfigurationListener();
            }
        },
        {
            once: true,
            signal,
        }
    );
}

/**
 * Registers renderer startup bridges that still need global runtime
 * integration.
 *
 * @param params - Startup dependencies supplied by renderChartJS.
 */
export function registerChartStartup(params: RegisterChartStartupParams): void {
    registerSharedConfigurationLoader(() => params.loadSharedConfiguration());

    try {
        params.setGlobalChartActions(params.chartActions);
    } catch {
        // Ignore legacy bridge exposure failures in SSR and tests.
    }
}
