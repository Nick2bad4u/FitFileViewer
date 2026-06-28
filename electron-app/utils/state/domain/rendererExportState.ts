import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export { normalizeRendererExporting } from "./rendererExportContract.js";
import { normalizeRendererExporting } from "./rendererExportContract.js";

const RENDERER_EXPORTING_STATE_PATH = "ui.isExporting";

export function isRendererExporting(): boolean {
    return normalizeRendererExporting(getState(RENDERER_EXPORTING_STATE_PATH));
}

export function setRendererExporting(
    exporting: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_EXPORTING_STATE_PATH,
        normalizeRendererExporting(exporting),
        {
            source: "rendererExportState.setExporting",
            ...options,
        }
    );
}
