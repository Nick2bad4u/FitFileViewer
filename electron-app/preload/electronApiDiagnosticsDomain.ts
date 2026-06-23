type ElectronApiDiagnosticsApi =
    import("../shared/preloadApi").ElectronApiDiagnosticsApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiDiagnosticsDomain({
    apiDiagnostics,
}: Pick<
    ElectronApiFactoryOptions,
    "apiDiagnostics"
>): ElectronApiDiagnosticsApi {
    return {
        getChannelInfo: apiDiagnostics.getChannelInfo,
        validateAPI: apiDiagnostics.validateAPI,
    };
}
