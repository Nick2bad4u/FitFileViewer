type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadPolicyModules = Pick<
    PreloadModuleRegistry,
    | "validateDevtoolsInjectMenuPayload"
    | "validateExternalUrl"
    | "validateFitBrowserRelativePath"
    | "validateFitBrowserRootFolderPath"
    | "validateFitFilePathInput"
    | "validateMainStateOperationIdInput"
    | "validateMainStatePathInput"
>;

export function loadPreloadPolicyModules(): PreloadPolicyModules {
    const { validateDevtoolsInjectMenuPayload } =
        require("../shared/devtoolsMenuPolicy.js") as {
            validateDevtoolsInjectMenuPayload: PreloadModuleRegistry["validateDevtoolsInjectMenuPayload"];
        };
    const { validateExternalUrl } =
        require("../shared/externalUrlPolicy.js") as {
            validateExternalUrl: PreloadModuleRegistry["validateExternalUrl"];
        };
    const { validateFitBrowserRelativePath, validateFitBrowserRootFolderPath } =
        require("../shared/fitBrowserPathPolicy.js") as {
            validateFitBrowserRelativePath: PreloadModuleRegistry["validateFitBrowserRelativePath"];
            validateFitBrowserRootFolderPath: PreloadModuleRegistry["validateFitBrowserRootFolderPath"];
        };
    const { validateFitFilePathInput } =
        require("../shared/fitFilePathPolicy.js") as {
            validateFitFilePathInput: PreloadModuleRegistry["validateFitFilePathInput"];
        };
    const { validateMainStateOperationIdInput, validateMainStatePathInput } =
        require("../shared/mainStatePathPolicy.js") as {
            validateMainStateOperationIdInput: PreloadModuleRegistry["validateMainStateOperationIdInput"];
            validateMainStatePathInput: PreloadModuleRegistry["validateMainStatePathInput"];
        };

    return {
        validateDevtoolsInjectMenuPayload,
        validateExternalUrl,
        validateFitBrowserRelativePath,
        validateFitBrowserRootFolderPath,
        validateFitFilePathInput,
        validateMainStateOperationIdInput,
        validateMainStatePathInput,
    };
}
