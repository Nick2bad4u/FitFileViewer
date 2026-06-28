type ElectronAPI = import("../shared/preloadApi").ElectronAPI;

import { createElectronApiAppInfoDomain } from "./electronApiAppInfoDomain.js";
import { createElectronApiClipboardDomain } from "./electronApiClipboardDomain.js";
import { createElectronApiDeveloperDomain } from "./electronApiDeveloperDomain.js";
import { createElectronApiDiagnosticsDomain } from "./electronApiDiagnosticsDomain.js";
import { createElectronApiDialogDomain } from "./electronApiDialogDomain.js";
import { composeElectronApiDomains } from "./electronApiDomainComposition.js";
import { createElectronApiExternalDomain } from "./electronApiExternalDomain.js";
import { type ElectronApiFactoryOptions } from "./electronApiFactoryOptions.js";
import { createElectronApiFileDomain } from "./electronApiFileDomain.js";
import { createElectronApiMenuDomain } from "./electronApiMenuDomain.js";
import { createElectronApiStateDomain } from "./electronApiStateDomain.js";

export function createElectronApi({
    apiDiagnostics,
    appInfoApi,
    clipboardBridge,
    devtoolsMenuApi,
    fileApi,
    fitBrowserApi,
    gyazoExternalApi,
    mainStateApi,
    menuEventApi,
    openFile,
    openFileDialog,
    openFolderDialog,
    openOverlayDialog,
    preloadEventApi,
    shellExternalApi,
    themeApi,
}: ElectronApiFactoryOptions): ElectronAPI {
    const appInfoDomain = createElectronApiAppInfoDomain({
        appInfoApi,
        themeApi,
    });
    const clipboardDomain = createElectronApiClipboardDomain({
        clipboardBridge,
    });
    const developerDomain = createElectronApiDeveloperDomain({
        devtoolsMenuApi,
    });
    const diagnosticsDomain = createElectronApiDiagnosticsDomain({
        apiDiagnostics,
    });
    const dialogDomain = createElectronApiDialogDomain({
        openFile,
        openFileDialog,
        openFolderDialog,
        openOverlayDialog,
    });
    const externalDomain = createElectronApiExternalDomain({
        gyazoExternalApi,
        shellExternalApi,
    });
    const fileDomain = createElectronApiFileDomain({
        fileApi,
        fitBrowserApi,
    });
    const menuDomain = createElectronApiMenuDomain({
        menuEventApi,
        preloadEventApi,
    });
    const stateDomain = createElectronApiStateDomain({ mainStateApi });

    return composeElectronApiDomains({
        appInfoDomain,
        clipboardDomain,
        developerDomain,
        diagnosticsDomain,
        dialogDomain,
        externalDomain,
        fileDomain,
        menuDomain,
        stateDomain,
    });
}
