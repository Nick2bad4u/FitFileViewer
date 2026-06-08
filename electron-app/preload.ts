/**
 * Preload script exposes a typed, secure IPC API to the renderer via
 * contextBridge. The runtime build bundles this typed source to a
 * CommonJS-compatible preload.js for Electron.
 */
import { startDefaultPreloadEntrypoint } from "./preload/preloadEntrypoint.js";

startDefaultPreloadEntrypoint();
