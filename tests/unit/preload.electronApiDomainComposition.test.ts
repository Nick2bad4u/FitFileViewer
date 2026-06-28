import { describe, expect, it, vi } from "vitest";

import {
    composeElectronApiDomains,
    type ElectronApiDomains,
} from "../../electron-app/preload/electronApiDomainComposition.js";

type DomainFunction = (...args: unknown[]) => unknown;

const exposedElectronApiKeys = [
    "addRecentFile",
    "checkForUpdates",
    "decodeFitFile",
    "getAppVersion",
    "getChannelInfo",
    "getChromeVersion",
    "getElectronVersion",
    "getErrors",
    "getFitBrowserFolder",
    "getLicenseInfo",
    "getMainState",
    "getMetrics",
    "getNodeVersion",
    "getOperation",
    "getOperations",
    "getPlatformInfo",
    "getTheme",
    "injectMenu",
    "installUpdate",
    "isFitBrowserEnabled",
    "listenToMainState",
    "listFitBrowserFolder",
    "notifyFitFileLoaded",
    "onDecoderOptionsChanged",
    "onExportFile",
    "onFitBrowserEnabledChanged",
    "onGyazoOAuthCallback",
    "onMenuAbout",
    "onMenuCheckForUpdates",
    "onMenuExport",
    "onMenuKeyboardShortcuts",
    "onMenuOpenFile",
    "onMenuOpenOverlay",
    "onMenuPrint",
    "onMenuRestartUpdate",
    "onMenuSaveAs",
    "onOpenAccentColorPicker",
    "onOpenRecentFile",
    "onOpenSummaryColumnSelector",
    "onSetFontSize",
    "onSetHighContrast",
    "onSetTheme",
    "onShowNotification",
    "onUnloadFitFile",
    "onUpdateEvent",
    "openExternal",
    "openFile",
    "openFileDialog",
    "openFolderDialog",
    "openOverlayDialog",
    "parseFitFile",
    "readFile",
    "recentFiles",
    "requestExport",
    "requestSaveAs",
    "sendThemeChanged",
    "setFitBrowserEnabled",
    "setFitBrowserFolder",
    "setFullScreen",
    "setMainState",
    "startGyazoServer",
    "stopGyazoServer",
    "subscribeToMainState",
    "unlistenFromMainState",
    "validateAPI",
    "writeClipboardPngDataUrl",
    "writeClipboardText",
] as const;

function createDomainFunction<T extends DomainFunction>(): T {
    return vi.fn() as unknown as T;
}

function createElectronApiDomains(): ElectronApiDomains {
    return {
        appInfoDomain: {
            getAppVersion: createDomainFunction(),
            getChromeVersion: createDomainFunction(),
            getElectronVersion: createDomainFunction(),
            getLicenseInfo: createDomainFunction(),
            getNodeVersion: createDomainFunction(),
            getPlatformInfo: createDomainFunction(),
            getTheme: createDomainFunction(),
        },
        clipboardDomain: {
            writeClipboardPngDataUrl: createDomainFunction(),
            writeClipboardText: createDomainFunction(),
        },
        developerDomain: {
            injectMenu: createDomainFunction(),
        },
        diagnosticsDomain: {
            getChannelInfo: createDomainFunction(),
            validateAPI: createDomainFunction(),
        },
        dialogDomain: {
            openFile: createDomainFunction(),
            openFileDialog: createDomainFunction(),
            openFolderDialog: createDomainFunction(),
            openOverlayDialog: createDomainFunction(),
        },
        externalDomain: {
            onGyazoOAuthCallback: createDomainFunction(),
            openExternal: createDomainFunction(),
            startGyazoServer: createDomainFunction(),
            stopGyazoServer: createDomainFunction(),
        },
        fileDomain: {
            addRecentFile: createDomainFunction(),
            decodeFitFile: createDomainFunction(),
            getFitBrowserFolder: createDomainFunction(),
            isFitBrowserEnabled: createDomainFunction(),
            listFitBrowserFolder: createDomainFunction(),
            onFitBrowserEnabledChanged: createDomainFunction(),
            parseFitFile: createDomainFunction(),
            readFile: createDomainFunction(),
            recentFiles: createDomainFunction(),
            setFitBrowserEnabled: createDomainFunction(),
            setFitBrowserFolder: createDomainFunction(),
        },
        menuDomain: {
            checkForUpdates: createDomainFunction(),
            installUpdate: createDomainFunction(),
            notifyFitFileLoaded: createDomainFunction(),
            onDecoderOptionsChanged: createDomainFunction(),
            onExportFile: createDomainFunction(),
            onMenuAbout: createDomainFunction(),
            onMenuCheckForUpdates: createDomainFunction(),
            onMenuExport: createDomainFunction(),
            onMenuKeyboardShortcuts: createDomainFunction(),
            onMenuOpenFile: createDomainFunction(),
            onMenuOpenOverlay: createDomainFunction(),
            onMenuPrint: createDomainFunction(),
            onMenuRestartUpdate: createDomainFunction(),
            onMenuSaveAs: createDomainFunction(),
            onOpenAccentColorPicker: createDomainFunction(),
            onOpenRecentFile: createDomainFunction(),
            onOpenSummaryColumnSelector: createDomainFunction(),
            onSetFontSize: createDomainFunction(),
            onSetHighContrast: createDomainFunction(),
            onSetTheme: createDomainFunction(),
            onShowNotification: createDomainFunction(),
            onUnloadFitFile: createDomainFunction(),
            onUpdateEvent: createDomainFunction(),
            requestExport: createDomainFunction(),
            requestSaveAs: createDomainFunction(),
            sendThemeChanged: createDomainFunction(),
            setFullScreen: createDomainFunction(),
        },
        stateDomain: {
            getErrors: createDomainFunction(),
            getMainState: createDomainFunction(),
            getMetrics: createDomainFunction(),
            getOperation: createDomainFunction(),
            getOperations: createDomainFunction(),
            listenToMainState: createDomainFunction(),
            setMainState: createDomainFunction(),
            subscribeToMainState: createDomainFunction(),
            unlistenFromMainState: createDomainFunction(),
        },
    };
}

describe("electron API domain composition", () => {
    it("exposes the explicit public Electron API allowlist from split domains", () => {
        expect.assertions(5);

        const domains = createElectronApiDomains();
        const api = composeElectronApiDomains(domains);

        expect(Object.keys(api).sort()).toStrictEqual(
            [...exposedElectronApiKeys].sort()
        );
        expect(api.getAppVersion).toBe(domains.appInfoDomain.getAppVersion);
        expect(api.openExternal).toBe(domains.externalDomain.openExternal);
        expect(api.getMainState).toBe(domains.stateDomain.getMainState);
        expect(api.writeClipboardText).toBe(
            domains.clipboardDomain.writeClipboardText
        );
    });
});
