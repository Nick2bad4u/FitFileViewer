type ElectronDevtoolsMenuApi =
    import("../shared/preloadApi").ElectronDevtoolsMenuApi;

export interface ElectronApiDeveloperDomainOptions {
    devtoolsMenuApi: ElectronDevtoolsMenuApi;
}

export function createElectronApiDeveloperDomain({
    devtoolsMenuApi,
}: ElectronApiDeveloperDomainOptions): ElectronDevtoolsMenuApi {
    return {
        injectMenu: devtoolsMenuApi.injectMenu,
    };
}
