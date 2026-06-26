type ElectronGyazoExternalApi =
    import("../shared/preloadApi").ElectronGyazoExternalApi;
type ElectronShellExternalApi =
    import("../shared/preloadApi").ElectronShellExternalApi;

export interface ElectronApiExternalDomainOptions {
    gyazoExternalApi: ElectronGyazoExternalApi;
    shellExternalApi: ElectronShellExternalApi;
}

export function createElectronApiExternalDomain({
    gyazoExternalApi,
    shellExternalApi,
}: ElectronApiExternalDomainOptions): ElectronGyazoExternalApi &
    ElectronShellExternalApi {
    return {
        onGyazoOAuthCallback: gyazoExternalApi.onGyazoOAuthCallback,
        openExternal: shellExternalApi.openExternal,
        startGyazoServer: gyazoExternalApi.startGyazoServer,
        stopGyazoServer: gyazoExternalApi.stopGyazoServer,
    };
}
