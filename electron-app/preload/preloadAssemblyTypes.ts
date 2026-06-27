type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type ElectronApiDiagnosticsApi =
    import("./preloadModuleTypes").ElectronApiDiagnosticsApi;
type ElectronAppInfoApi = import("./preloadModuleTypes").ElectronAppInfoApi;
type ElectronClipboardApi = import("./preloadModuleTypes").ElectronClipboardApi;
type ElectronDevtoolsMenuApi =
    import("./preloadModuleTypes").ElectronDevtoolsMenuApi;
type ElectronDialogApi = import("./preloadModuleTypes").ElectronDialogApi;
type ElectronFileApi = import("./preloadModuleTypes").ElectronFileApi;
type ElectronFitBrowserApi =
    import("./preloadModuleTypes").ElectronFitBrowserApi;
type ElectronGyazoExternalApi =
    import("./preloadModuleTypes").ElectronGyazoExternalApi;
type ElectronMainStateApi = import("./preloadModuleTypes").ElectronMainStateApi;
type ElectronMenuEventApi = import("./preloadModuleTypes").ElectronMenuEventApi;
type ElectronPreloadEventApi =
    import("./preloadModuleTypes").ElectronPreloadEventApi;
type ElectronShellExternalApi =
    import("./preloadModuleTypes").ElectronShellExternalApi;
type ElectronThemeApi = import("./preloadModuleTypes").ElectronThemeApi;
type IpcBridgeCatalog = import("./preloadModuleTypes").IpcBridgeCatalog;
type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
type PreloadContextBridge = import("./preloadModuleTypes").PreloadContextBridge;
type PreloadIpcHelpers = import("./preloadModuleTypes").PreloadIpcHelpers;
type PreloadIpcRenderer = import("./preloadModuleTypes").PreloadIpcRenderer;
type PreloadLog = import("./preloadModuleTypes").PreloadLog;
type PreloadValidators = import("./preloadModuleTypes").PreloadValidators;
type CreateApiDiagnostics = import("./preloadModuleTypes").CreateApiDiagnostics;
type CreateAppInfoApi = import("./preloadModuleTypes").CreateAppInfoApi;
type CreateClipboardBridge =
    import("./preloadModuleTypes").CreateClipboardBridge;
type CreateDevtoolsMenuApi =
    import("./preloadModuleTypes").CreateDevtoolsMenuApi;
type CreateFileApi = import("./preloadModuleTypes").CreateFileApi;
type CreateFitBrowserApi = import("./preloadModuleTypes").CreateFitBrowserApi;
type CreateGyazoExternalApi =
    import("./preloadModuleTypes").CreateGyazoExternalApi;
type CreateMainStateApi = import("./preloadModuleTypes").CreateMainStateApi;
type CreateMainStateBridge =
    import("./preloadModuleTypes").CreateMainStateBridge;
type CreateMenuEventApi = import("./preloadModuleTypes").CreateMenuEventApi;
type CreatePreloadEventApi =
    import("./preloadModuleTypes").CreatePreloadEventApi;
type CreatePreloadIpcHelpers =
    import("./preloadModuleTypes").CreatePreloadIpcHelpers;
type CreatePreloadLogger = import("./preloadModuleTypes").CreatePreloadLogger;
type CreatePreloadValidators =
    import("./preloadModuleTypes").CreatePreloadValidators;
type CreateShellExternalApi =
    import("./preloadModuleTypes").CreateShellExternalApi;
type CreateThemeApi = import("./preloadModuleTypes").CreateThemeApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;
type ExposeDevelopmentToolsGlobal =
    import("./preloadModuleTypes").ExposeDevelopmentToolsGlobal;
type ExposeElectronApi = import("./preloadModuleTypes").ExposeElectronApi;
type RegisterPreloadBeforeExitHandler =
    import("./preloadModuleTypes").RegisterPreloadBeforeExitHandler;
type ResolvePreloadElectronBridge =
    import("./preloadModuleTypes").ResolvePreloadElectronBridge;
type ShouldEnforceGenericIpcAllowlist =
    import("./preloadModuleTypes").ShouldEnforceGenericIpcAllowlist;
type ValidateDevtoolsInjectMenuPayload =
    import("./preloadModuleTypes").ValidateDevtoolsInjectMenuPayload;
type ValidateExternalUrl = import("./preloadModuleTypes").ValidateExternalUrl;
type ValidateFitBrowserRelativePath =
    import("./preloadModuleTypes").ValidateFitBrowserRelativePath;
type ValidateFitBrowserRootFolderPath =
    import("./preloadModuleTypes").ValidateFitBrowserRootFolderPath;
type ValidateFitFilePathInput =
    import("./preloadModuleTypes").ValidateFitFilePathInput;
type ValidateMainStateOperationIdInput =
    import("./preloadModuleTypes").ValidateMainStateOperationIdInput;
type ValidateMainStatePathInput =
    import("./preloadModuleTypes").ValidateMainStatePathInput;

export type CreateElectronApi = (
    options: ElectronApiFactoryOptions
) => ElectronAPI;

export type CreatePreloadApiAssemblyContext = (options: {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadApiAssemblyContextModules;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}) => PreloadApiAssemblyContext;

export type CreatePreloadClipboardApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadClipboardApiDomain;

export type CreatePreloadDeveloperApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDeveloperApiDomain;

export type CreatePreloadDiagnosticsApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDiagnosticsApiDomain;

export type CreatePreloadDialogApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDialogApiDomain;

export type CreatePreloadExternalApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadExternalApiDomain;

export type CreatePreloadFileApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadFileApiDomain;

export type CreatePreloadIpcEventApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadIpcEventApiDomain;

export type CreatePreloadStateApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadStateApiDomain;

export type CreatePreloadSystemApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadSystemApiDomain;

export type AssemblePreloadApi = (options: {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    createElectronApi: CreateElectronApi;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadApiAssemblyInputModules;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}) => ElectronAPI;

export interface PreloadRuntime {
    assemblePreloadApi: AssemblePreloadApi;
    constants: PreloadConstants;
    createElectronApi: CreateElectronApi;
    modules: PreloadRuntimeModules;
}

export interface PreloadApiAssemblyModules {
    createPreloadApiAssemblyContext: CreatePreloadApiAssemblyContext;
    createPreloadClipboardApiDomain: CreatePreloadClipboardApiDomain;
    createPreloadDeveloperApiDomain: CreatePreloadDeveloperApiDomain;
    createPreloadDiagnosticsApiDomain: CreatePreloadDiagnosticsApiDomain;
    createPreloadDialogApiDomain: CreatePreloadDialogApiDomain;
    createPreloadExternalApiDomain: CreatePreloadExternalApiDomain;
    createPreloadFileApiDomain: CreatePreloadFileApiDomain;
    createPreloadIpcEventApiDomain: CreatePreloadIpcEventApiDomain;
    createPreloadStateApiDomain: CreatePreloadStateApiDomain;
    createPreloadSystemApiDomain: CreatePreloadSystemApiDomain;
}

export interface PreloadClipboardModules {
    createClipboardBridge: CreateClipboardBridge;
}

export interface PreloadDeveloperModules {
    createApiDiagnostics: CreateApiDiagnostics;
    createDevtoolsMenuApi: CreateDevtoolsMenuApi;
    exposeDevelopmentToolsGlobal: ExposeDevelopmentToolsGlobal;
}

export interface PreloadExternalModules {
    createGyazoExternalApi: CreateGyazoExternalApi;
    createShellExternalApi: CreateShellExternalApi;
}

export interface PreloadLifecycleModules {
    isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
    registerPreloadBeforeExitHandler: RegisterPreloadBeforeExitHandler;
}

export interface PreloadSystemModules {
    createAppInfoApi: CreateAppInfoApi;
    createThemeApi: CreateThemeApi;
}

export interface PreloadFileModules {
    createFileApi: CreateFileApi;
    createFitBrowserApi: CreateFitBrowserApi;
}

export interface PreloadIpcModules {
    createMenuEventApi: CreateMenuEventApi;
    createPreloadEventApi: CreatePreloadEventApi;
    createPreloadIpcHelpers: CreatePreloadIpcHelpers;
    createPreloadLogger: CreatePreloadLogger;
    createPreloadValidators: CreatePreloadValidators;
    exposeElectronApi: ExposeElectronApi;
    ipcBridgeCatalog: IpcBridgeCatalog;
    resolvePreloadElectronBridge: ResolvePreloadElectronBridge;
    shouldEnforceGenericIpcAllowlist: ShouldEnforceGenericIpcAllowlist;
}

export interface PreloadPolicyModules {
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateExternalUrl: ValidateExternalUrl;
    validateFitBrowserRelativePath: ValidateFitBrowserRelativePath;
    validateFitBrowserRootFolderPath: ValidateFitBrowserRootFolderPath;
    validateFitFilePathInput: ValidateFitFilePathInput;
    validateMainStateOperationIdInput: ValidateMainStateOperationIdInput;
    validateMainStatePathInput: ValidateMainStatePathInput;
}

export interface PreloadStateModules {
    createMainStateApi: CreateMainStateApi;
    createMainStateBridge: CreateMainStateBridge;
}

export interface PreloadApiAssemblyContextModules
    extends
        PreloadClipboardModules,
        PreloadDeveloperModules,
        PreloadExternalModules,
        PreloadFileModules,
        PreloadIpcModules,
        PreloadLifecycleModules,
        PreloadPolicyModules,
        PreloadStateModules,
        PreloadSystemModules {}

export interface PreloadApiAssemblyInputModules
    extends PreloadApiAssemblyContextModules, PreloadApiAssemblyModules {}

export type PreloadRuntimeModules = PreloadApiAssemblyInputModules;

export interface PreloadApiAssemblyContext {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    createSafeEventHandler: PreloadIpcHelpers["createSafeEventHandler"];
    createSafeInvokeHandler: PreloadIpcHelpers["createSafeInvokeHandler"];
    createSafeSendHandler: PreloadIpcHelpers["createSafeSendHandler"];
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadApiAssemblyContextModules;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
    removeIpcListener: PreloadIpcHelpers["removeIpcListener"];
    shouldEnforceGenericIpcAllowlist: boolean;
    validateCallback: PreloadValidators["validateCallback"];
    validateChannelName: PreloadValidators["validateChannelName"];
    validateOptionalNonEmptyString: PreloadValidators["validateOptionalNonEmptyString"];
    validateRequiredNonEmptyString: PreloadValidators["validateRequiredNonEmptyString"];
}

export interface PreloadClipboardApiDomain {
    clipboardBridge: ElectronClipboardApi;
}

export interface PreloadDeveloperApiDomain {
    devtoolsMenuApi: ElectronDevtoolsMenuApi;
}

export interface PreloadDiagnosticsApiDomain {
    apiDiagnostics: ElectronApiDiagnosticsApi;
}

export interface PreloadDialogApiDomain {
    openFile: ElectronDialogApi["openFile"];
    openFileDialog: ElectronDialogApi["openFileDialog"];
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
    openOverlayDialog: ElectronDialogApi["openOverlayDialog"];
}

export interface PreloadExternalApiDomain {
    gyazoExternalApi: ElectronGyazoExternalApi;
    shellExternalApi: ElectronShellExternalApi;
}

export interface PreloadSystemApiDomain {
    appInfoApi: ElectronAppInfoApi;
    themeApi: ElectronThemeApi;
}

export interface PreloadFileApiDomain {
    fileApi: ElectronFileApi;
    fitBrowserApi: ElectronFitBrowserApi;
}

export interface PreloadIpcEventApiDomain {
    preloadEventApi: ElectronPreloadEventApi;
    menuEventApi: ElectronMenuEventApi;
}

export interface PreloadStateApiDomain {
    mainStateApi: ElectronMainStateApi;
}
