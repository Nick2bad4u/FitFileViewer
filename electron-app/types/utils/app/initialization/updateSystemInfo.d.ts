/**
 * Known fields displayed in the system information panel.
 */
export type SystemInfoField =
    | "author"
    | "chrome"
    | "electron"
    | "license"
    | "node"
    | "platform"
    | "version";
/**
 * System information values accepted by the display updater.
 */
export type SystemInfoRecord = Partial<Record<SystemInfoField, unknown>>;
/**
 * Clears the cached DOM elements.
 */
export function clearSystemInfoCache(): void;
/**
 * Updates the system information display in the UI.
 *
 * Takes a system information object and updates the corresponding DOM elements
 * with version, runtime, and platform information. Uses cached DOM elements for
 * performance and validates both input and DOM structure.
 *
 * @param info - System information object.
 * @returns True if update was successful, false otherwise.
 */
export function updateSystemInfo(info: unknown): boolean;
