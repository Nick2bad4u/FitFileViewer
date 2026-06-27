type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
type PreloadContextBridge = import("./preloadModuleTypes").PreloadContextBridge;
type PreloadIpcRenderer = import("./preloadModuleTypes").PreloadIpcRenderer;
type PreloadLog = import("./preloadModuleTypes").PreloadLog;
type PreloadApiAssemblyContextModules =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContextModules;

interface CreatePreloadApiAssemblyContextOptions {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadApiAssemblyContextModules;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}

export function createPreloadApiAssemblyContext({
    constants,
    contextBridge,
    ipcRenderer,
    modules,
    preloadLog,
    processRef,
}: CreatePreloadApiAssemblyContextOptions): PreloadApiAssemblyContext {
    const {
        createPreloadIpcHelpers,
        createPreloadValidators,
        shouldEnforceGenericIpcAllowlist:
            shouldEnforceGenericIpcAllowlistForProcess,
    } = modules;
    const {
        validateCallback,
        validateChannelName,
        validateOptionalNonEmptyString,
        validateRequiredNonEmptyString,
    } = createPreloadValidators(preloadLog);
    const {
        createSafeEventHandler,
        createSafeInvokeHandler,
        createSafeSendHandler,
        removeIpcListener,
    } = createPreloadIpcHelpers({
        ipcRenderer,
        preloadLog,
        validateDevtoolsInjectMenuPayload:
            modules.validateDevtoolsInjectMenuPayload,
        validateExternalUrl: modules.validateExternalUrl,
        validateFitBrowserRelativePath: modules.validateFitBrowserRelativePath,
        validateFitBrowserRootFolderPath:
            modules.validateFitBrowserRootFolderPath,
        validateFitFilePathInput: modules.validateFitFilePathInput,
        validateMainStateOperationIdInput:
            modules.validateMainStateOperationIdInput,
        validateMainStatePathInput: modules.validateMainStatePathInput,
        validateCallback,
    });
    const shouldEnforceGenericIpcAllowlist =
        processRef !== undefined &&
        shouldEnforceGenericIpcAllowlistForProcess(processRef);
    const assemblyContextBase = {
        constants,
        contextBridge,
        createSafeEventHandler,
        createSafeInvokeHandler,
        createSafeSendHandler,
        ipcRenderer,
        modules,
        preloadLog,
        removeIpcListener,
        shouldEnforceGenericIpcAllowlist,
        validateCallback,
        validateChannelName,
        validateOptionalNonEmptyString,
        validateRequiredNonEmptyString,
    };

    return processRef === undefined
        ? assemblyContextBase
        : { ...assemblyContextBase, processRef };
}
