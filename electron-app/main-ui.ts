/** Main renderer UI entrypoint. Startup wiring lives in focused renderer
modules. */
import { initializeMainUiStartup } from "./renderer/mainUiStartup.js";

const mainUiStartup = await initializeMainUiStartup();

export const { mainUiDragDropHandler } = mainUiStartup;
export const { requestMainUiMenuInjection } = mainUiStartup;
export const { runMainUiDevelopmentCleanup } = mainUiStartup;
