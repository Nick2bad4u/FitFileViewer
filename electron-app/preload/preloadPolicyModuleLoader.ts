import { validateDevtoolsInjectMenuPayload } from "../shared/devtoolsMenuPolicy.js";
import { validateExternalUrl } from "../shared/externalUrlPolicy.js";
import {
    validateFitBrowserRelativePath,
    validateFitBrowserRootFolderPath,
} from "../shared/fitBrowserPathPolicy.js";
import { validateFitFilePathInput } from "../shared/fitFilePathPolicy.js";
import {
    validateMainStateOperationIdInput,
    validateMainStatePathInput,
} from "../shared/mainStatePathPolicy.js";

type PreloadPolicyModules = import("./preloadModuleTypes").PreloadPolicyModules;

export function loadPreloadPolicyModules(): PreloadPolicyModules {
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
