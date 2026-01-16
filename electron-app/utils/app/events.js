/**
 * @fileoverview Legacy listener entrypoint.
 *
 * This module previously hosted a full implementation of renderer UI+IPC wiring.
 * That duplicated (and occasionally diverged from) the canonical implementation in
 * `utils/app/lifecycle/listeners.js`.
 *
 * To prevent drift, this file is now a thin re-export.
 */

export { setupListeners } from "./lifecycle/listeners.js";
