type ElectronDevtoolsMenuApi =
    import("../shared/preloadApi").ElectronDevtoolsMenuApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiDeveloperDomain({
    devtoolsMenuApi,
}: Pick<
    ElectronApiFactoryOptions,
    "devtoolsMenuApi"
>): ElectronDevtoolsMenuApi {
    return {
        injectMenu: devtoolsMenuApi.injectMenu,
    };
}
