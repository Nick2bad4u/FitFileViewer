/**
 * Main renderer UI entrypoint. Startup wiring lives in focused renderer
 * modules.
 */
import { initializeMainUiStartup } from "./renderer/mainUiStartup.js";

await initializeMainUiStartup();
