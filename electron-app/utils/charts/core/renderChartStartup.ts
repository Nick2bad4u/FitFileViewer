import {
    abortSharedConfigurationListener,
    isSharedConfigurationListenerRegistered,
    registerSharedConfigurationListenerController,
} from "./chartListenerState.js";

interface RegisterChartStartupParams {
    loadSharedConfiguration(): unknown;
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
 * Registers renderer startup bridges.
 *
 * @param params - Startup dependencies supplied by renderChartJS.
 */
export function registerChartStartup(params: RegisterChartStartupParams): void {
    registerSharedConfigurationLoader(() => params.loadSharedConfiguration());
}
