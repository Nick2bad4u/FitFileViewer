import type { StateUpdateOptions } from "../core/stateManager.js";
import { setRendererTablesRendered } from "./appActionsState.js";
import { setRendererChartsRendered } from "./rendererChartRenderState.js";
import { setRendererMapRendered } from "./rendererMapRenderState.js";

export function resetRendererRenderLifecycle(
    options: StateUpdateOptions = {}
): void {
    setRendererChartsRendered(false, options);
    setRendererMapRendered(false, options);
    setRendererTablesRendered(false, options);
}
