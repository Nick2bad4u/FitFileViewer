import { DragDropHandler } from "../utils/ui/dragDropHandler.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

export interface MainUiDragDropHandlerOptions {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
}

export function createMainUiDragDropHandler({
    electronApiScope,
}: MainUiDragDropHandlerOptions = {}): DragDropHandler {
    return new DragDropHandler({ electronApiScope });
}
