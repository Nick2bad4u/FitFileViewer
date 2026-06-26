import {
    abortSharedConfigurationListener,
    isSharedConfigurationListenerRegistered,
    registerSharedConfigurationListenerController,
} from "./chartListenerState.js";
import {
    getRenderChartStartupRuntime,
    type RenderChartStartupRuntime,
} from "./renderChartStartupRuntime.js";

interface RegisterChartStartupParams {
    loadSharedConfiguration(): unknown;
    runtime?: RenderChartStartupRuntime | undefined;
}

function registerSharedConfigurationLoader(
    loadSharedConfiguration: () => unknown,
    runtime: RenderChartStartupRuntime
): void {
    if (
        !runtime.canRegisterDOMContentLoadedListener() ||
        isSharedConfigurationListenerRegistered()
    ) {
        return;
    }

    const signal = registerSharedConfigurationListenerController();

    runtime.addDOMContentLoadedListener(
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
 * Registers chart startup listeners.
 *
 * @param params - Startup dependencies supplied by renderChartJS.
 */
export function registerChartStartup(params: RegisterChartStartupParams): void {
    const runtime = params.runtime ?? getRenderChartStartupRuntime();

    registerSharedConfigurationLoader(
        () => params.loadSharedConfiguration(),
        runtime
    );
}
