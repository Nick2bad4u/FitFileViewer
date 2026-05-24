function getGlobalBooleanFlag(globalScope, flagName) {
    return Reflect.get(globalScope, flagName);
}
function getRendererLocationParts(globalScope) {
    const locationRecord = toRecord(Reflect.get(globalScope, "location"));
    return {
        hostname: getStringProperty(locationRecord, "hostname"),
        href: getStringProperty(locationRecord, "href"),
        protocol: getStringProperty(locationRecord, "protocol"),
        search: getStringProperty(locationRecord, "search"),
    };
}
function getStringProperty(record, propertyName) {
    const value = record[propertyName];
    return typeof value === "string" ? value : "";
}
function hasDocumentDevModeFlag(globalScope) {
    const documentRecord = toRecord(Reflect.get(globalScope, "document"));
    const documentElement = toRecord(documentRecord["documentElement"]);
    const dataset = toRecord(documentElement["dataset"]);
    return Object.hasOwn(dataset, "devMode");
}
function hasElectronDevModeFlag(globalScope) {
    const electronApi = toRecord(Reflect.get(globalScope, "electronAPI"));
    return Reflect.get(electronApi, "__devMode") !== undefined;
}
function isDebugRendererLocation(locationParts) {
    return (
        locationParts.search.includes("debug=true") ||
        locationParts.protocol === "file:" ||
        locationParts.href.includes("electron")
    );
}
function isLocalDevelopmentHost(hostname) {
    return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.includes("dev")
    );
}
function toRecord(value) {
    return typeof value === "object" && value !== null ? value : {};
}
/**
 * Gets the renderer environment name from the current global runtime markers.
 *
 * @param globalScope - Global-like object to inspect. Defaults to `globalThis`.
 *
 * @returns The detected renderer environment name.
 */
export function getEnvironment(globalScope = globalThis) {
    return isDevelopmentMode(globalScope) ? "development" : "production";
}
/**
 * Detects whether the renderer is running with development-mode markers.
 *
 * @param globalScope - Global-like object to inspect. Defaults to `globalThis`.
 *
 * @returns Whether the renderer should use development-mode behavior.
 */
export function isDevelopmentMode(globalScope = globalThis) {
    try {
        const locationParts = getRendererLocationParts(globalScope);
        return (
            isLocalDevelopmentHost(locationParts.hostname) ||
            isDebugRendererLocation(locationParts) ||
            getGlobalBooleanFlag(globalScope, "__DEVELOPMENT__") === true ||
            hasDocumentDevModeFlag(globalScope) ||
            hasElectronDevModeFlag(globalScope)
        );
    } catch {
        return false;
    }
}
