type ElectronApiDiagnosticsApi =
    import("../shared/preloadApi").ElectronApiDiagnosticsApi;

export interface ElectronApiDiagnosticsDomainOptions {
    apiDiagnostics: ElectronApiDiagnosticsApi;
}

export function createElectronApiDiagnosticsDomain({
    apiDiagnostics,
}: ElectronApiDiagnosticsDomainOptions): ElectronApiDiagnosticsApi {
    return {
        getChannelInfo: apiDiagnostics.getChannelInfo,
        validateAPI: apiDiagnostics.validateAPI,
    };
}
