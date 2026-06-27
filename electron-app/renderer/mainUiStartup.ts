import {
    createMainUiDevelopmentCleanup,
    createMainUiMenuInjectionRequester,
} from "./mainUiDevelopmentActions.js";
import { createMainUiDragDropHandler } from "./mainUiDragDropStartup.js";
import {
    getMainUiMenuInjectionElectronApi,
    getMainUiSummarySelectorElectronApi,
    getMainUiThemeSyncElectronApi,
    getMainUiUnloadElectronApi,
} from "./mainUiElectronApi.js";
import { getBrowserMainUiRuntimeEnvironmentScope } from "./mainUiBrowserRuntime.js";
import { createMainUiExternalLinkLifecycle } from "./mainUiExternalLinks.js";
import {
    getMainUiRuntimeEnvironment,
    type MainUiRuntimeEnvironment,
} from "./mainUiRuntimeEnvironment.js";
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
import { createRendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

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

export interface MainUiStartupOptions {
    readonly runtimeEnvironment?: MainUiRuntimeEnvironment | undefined;
}

const MAIN_UI_CONSTANTS = {
    DOM_IDS: UI_CONSTANTS.DOM_IDS,
    SUMMARY_COLUMN_SELECTOR_DELAY: UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
} as const;

function createMainUiLogger(consoleRef: Console) {
    return (
        level: MainUiLogLevel,
        message: string,
        ...args: unknown[]
    ): void => {
        const log = consoleRef[level];
        if (typeof log === "function") {
            log.call(consoleRef, message, ...args);
        }
    };
}

function getDefaultMainUiRuntimeEnvironment(): MainUiRuntimeEnvironment {
    return getMainUiRuntimeEnvironment(
        getBrowserMainUiRuntimeEnvironmentScope()
    );
}

export async function initializeMainUiStartup({
    runtimeEnvironment = getDefaultMainUiRuntimeEnvironment(),
}: MainUiStartupOptions = {}): Promise<MainUiStartupHandles> {
    const logMainUi = createMainUiLogger(runtimeEnvironment.consoleRef);
    const electronApiScope = createRendererElectronApiScope(
        () => runtimeEnvironment.electronApiCandidate
    );
    const getMenuInjectionElectronAPI = () =>
        getMainUiMenuInjectionElectronApi(electronApiScope);
    const getThemeSyncElectronAPI = () =>
        getMainUiThemeSyncElectronApi(electronApiScope);
    const getUnloadElectronAPI = () =>
        getMainUiUnloadElectronApi(electronApiScope);
    const documentRef = runtimeEnvironment.documentRef;
    const unloadFitFile = createMainUiUnloadFitFile({
        contentIds: [
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_MAP,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_DATA,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_CHART,
            MAIN_UI_CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
        ],
        dateNow: runtimeEnvironment.dateNow,
        documentRef,
        getElectronAPI: getUnloadElectronAPI,
        logMainUi,
    });

    initializeMainUiThemeSync({
        getElectronAPI: getThemeSyncElectronAPI,
        logMainUi,
    });

    const summaryElectronAPI =
        getMainUiSummarySelectorElectronApi(electronApiScope);
    const unloadElectronAPI = getUnloadElectronAPI();
    registerMainUiSummaryColumnSelector({
        delay: MAIN_UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
        electronAPI: summaryElectronAPI,
        gearButtonSelector: ".summary-gear-btn",
        logMainUi,
        summaryTabId: MAIN_UI_CONSTANTS.DOM_IDS.TAB_SUMMARY,
    });
    registerMainUiUnloadHandlers({
        electronAPI: unloadElectronAPI,
        unloadButtonId: MAIN_UI_CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN,
        unloadFitFile,
    });

    const mainUiDragDropHandler = createMainUiDragDropHandler({
        electronApiScope,
    });

    void setupWindow({ electronApiScope });

    const externalLinks = createMainUiExternalLinkLifecycle({
        documentRef,
        electronApiScope,
    });
    registerMainUiShutdownHook({
        cleanupExternalLinks: externalLinks.cleanup,
        logMainUi,
    });
    externalLinks.install();

    const requestMainUiMenuInjection = createMainUiMenuInjectionRequester({
        getElectronAPI: getMenuInjectionElectronAPI,
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
