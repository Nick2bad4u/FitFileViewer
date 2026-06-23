type ElectronGyazoExternalApi =
    import("../shared/preloadApi").ElectronGyazoExternalApi;
type ElectronShellExternalApi =
    import("../shared/preloadApi").ElectronShellExternalApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiExternalDomain({
    gyazoExternalApi,
    shellExternalApi,
}: Pick<
    ElectronApiFactoryOptions,
    "gyazoExternalApi" | "shellExternalApi"
>): ElectronGyazoExternalApi & ElectronShellExternalApi {
    return {
        onGyazoOAuthCallback: gyazoExternalApi.onGyazoOAuthCallback,
        openExternal: shellExternalApi.openExternal,
        startGyazoServer: gyazoExternalApi.startGyazoServer,
        stopGyazoServer: gyazoExternalApi.stopGyazoServer,
    };
}
