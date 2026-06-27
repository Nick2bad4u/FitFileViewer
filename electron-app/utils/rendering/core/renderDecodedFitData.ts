import type { FitMessages } from "../../../shared/fit";
import type { RendererElectronApiScope } from "../../runtime/electronApiRuntime.js";

type ShowFitDataInput = FitMessages | Record<string, unknown>;

type RenderDecodedFitDataOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

/**
 * Lazily render decoded FIT data through the typed rendering module.
 */
export async function renderDecodedFitData(
    data: ShowFitDataInput,
    filePath: string,
    options: RenderDecodedFitDataOptions = {}
): Promise<void> {
    const { showFitData } = await import("./showFitData.js");
    showFitData(data, filePath, {
        electronApiScope: options.electronApiScope,
    });
}
