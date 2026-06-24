import {
    createMainUiDevelopmentCleanup,
    createMainUiMenuInjectionRequester,
} from "./mainUiDevelopmentActions.js";
import { createMainUiDragDropHandler } from "./mainUiDragDropStartup.js";
import { getMainUiElectronApi } from "./mainUiElectronApi.js";
import { getBrowserMainUiRuntimeEnvironmentScope } from "./mainUiBrowserRuntime.js";
import { createMainUiExternalLinkLifecycle } from "./mainUiExternalLinks.js";
import { getMainUiRuntimeEnvironment } from "./mainUiRuntimeEnvironment.js";
import { registerMainUiShutdownHook } from "./mainUiShutdown.js";
import { logMainUiStateStartup } from "./mainUiStateStartup.js";
import { registerMainUiSummaryColumnSelector } from "./mainUiSummarySelectorRegistration.js";
import { initializeMainUiThemeSync } from "./mainUiThemeSync.js";
import {
    createMainUiUnloadFitFile,
    registerMainUiUnloadHandlers,
} from "./mainUiUnloadFlow.js";
import { initializeMainUiVendorStartup } from "./mainUiVendorStartup.js";
import { setupWindow } from "../utils/app/initialization/setupWindow.js";
import { UI_CONSTANTS } from "../utils/config/constants.js";

type MainUiLogLevel = "error" | "info" | "warn";

export interface MainUiStartupHandles {
    readonly mainUiDragDropHandler: ReturnType<
        typeof createMainUiDragDropHandler
    >;
    readonly requestMainUiMenuInjection: ReturnType<
        typeof createMainUiMenuInjectionRequester
    >;
    readonly runMainUiDevelopmentCleanup: ReturnType<
        typeof createMainUiDevelopmentCleanup
    >;
}

const mainUiRuntimeEnvironment = getMainUiRuntimeEnvironment(
    getBrowserMainUiRuntimeEnvironmentScope()
);
const mainUiConsole = mainUiRuntimeEnvironment.consoleRef;

const MAIN_UI_CONSTANTS = {
    DOM_IDS: UI_CONSTANTS.DOM_IDS,
    SUMMARY_COLUMN_SELECTOR_DELAY: UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
} as const;

function logMainUi(
    level: MainUiLogLevel,
    message: string,
    ...args: unknown[]
): void {
    const log = mainUiConsole[level];
    if (typeof log === "function") {
        log.call(mainUiConsole, message, ...args);
    }
}

export async function initializeMainUiStartup(): Promise<MainUiStartupHandles> {
    const electronApiScope = {
        getElectronAPI: () => mainUiRuntimeEnvironment.electronApiCandidate,
    };
    const getElectronAPI = () => getMainUiElectronApi(electronApiScope);
    const unloadFitFile = createMainUiUnloadFitFile({
        contentIds: [
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_MAP,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_DATA,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_CHART,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
        ],
        getElectronAPI,
        logMainUi,
    });

    initializeMainUiThemeSync({ getElectronAPI, logMainUi });

    const electronAPI = getElectronAPI();
    registerMainUiSummaryColumnSelector({
        delay: MAIN_UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
        electronAPI,
        gearButtonSelector: ".summary-gear-btn",
        logMainUi,
        summaryTabId: MAIN_UI_CONSTANTS.DOM_IDS.TAB_SUMMARY,
    });
    registerMainUiUnloadHandlers({
        electronAPI,
        unloadButtonId: MAIN_UI_CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN,
        unloadFitFile,
    });

    const mainUiDragDropHandler = createMainUiDragDropHandler({
        electronApiScope,
    });

    void setupWindow();

    const externalLinks = createMainUiExternalLinkLifecycle({
        electronApiScope,
    });
    registerMainUiShutdownHook({
        cleanupExternalLinks: externalLinks.cleanup,
        logMainUi,
    });
    externalLinks.install();

    const requestMainUiMenuInjection = createMainUiMenuInjectionRequester({
        getElectronAPI,
        logMainUi,
    });
    const runMainUiDevelopmentCleanup = createMainUiDevelopmentCleanup({
        logMainUi,
    });

    logMainUiStateStartup({ logMainUi });

    await initializeMainUiVendorStartup({ logMainUi });

    return {
        mainUiDragDropHandler,
        requestMainUiMenuInjection,
        runMainUiDevelopmentCleanup,
    };
}
