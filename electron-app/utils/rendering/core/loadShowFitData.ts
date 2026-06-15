import type { FitMessages } from "../../../shared/fit";

type ShowFitDataInput = FitMessages | Record<string, unknown>;

/**
 * Lazily render decoded FIT data through the typed module import instead of
 * the retired `window.showFitData` bridge.
 */
export async function renderDecodedFitData(
    data: ShowFitDataInput,
    filePath: string
): Promise<void> {
    const { showFitData } = await import("./showFitData.js");
    showFitData(data, filePath);
}
