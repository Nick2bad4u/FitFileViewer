import type { FitMessages } from "../../../shared/fit";

type ShowFitDataInput = FitMessages | Record<string, unknown>;

/**
 * Lazily render decoded FIT data through the typed rendering module.
 */
export async function renderDecodedFitData(
    data: ShowFitDataInput,
    filePath: string
): Promise<void> {
    const { showFitData } = await import("./showFitData.js");
    showFitData(data, filePath);
}
