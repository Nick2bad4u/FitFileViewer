/** Runtime environment names used by the renderer bootstrap. */
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import { getRendererEnvironmentRuntime } from "./rendererEnvironmentRuntime.js";

export type RendererEnvironmentName = "development" | "production";

interface RendererLocationParts {
    hostname: string;
    href: string;
    protocol: string;
    search: string;
}

function getGlobalBooleanFlag(globalScope: object, flagName: string): unknown {
    return Reflect.get(globalScope, flagName);
}

const rendererEnvironmentRuntime = getRendererEnvironmentRuntime();

function getRendererLocationParts(globalScope: object): RendererLocationParts {
    const locationRecord = toRecord(Reflect.get(globalScope, "location"));

    return {
        hostname: getStringProperty(locationRecord, "hostname"),
        href: getStringProperty(locationRecord, "href"),
        protocol: getStringProperty(locationRecord, "protocol"),
        search: getStringProperty(locationRecord, "search"),
    };
}

function getStringProperty(
    record: Record<string, unknown>,
    propertyName: string
): string {
    const value = record[propertyName];

    return typeof value === "string" ? value : "";
}

function hasDocumentDevModeFlag(globalScope: object): boolean {
    const documentRecord = toRecord(Reflect.get(globalScope, "document"));
    const documentElement = toRecord(documentRecord["documentElement"]);
    const dataset = toRecord(documentElement["dataset"]);

    return Object.hasOwn(dataset, "devMode");
}

function hasElectronDevModeFlag(globalScope: object): boolean {
    return (
        getRendererElectronApi(
            isElectronDevModeApi,
            globalScope as RendererElectronApiScope
        ) !== null
    );
}

function isDebugRendererLocation(
    locationParts: RendererLocationParts
): boolean {
    return (
        locationParts.search.includes("debug=true") ||
        locationParts.protocol === "file:" ||
        locationParts.href.includes("electron")
    );
}

function isLocalDevelopmentHost(hostname: string): boolean {
    return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.includes("dev")
    );
}

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

function isElectronDevModeApi(value: unknown): value is {
    readonly __devMode: unknown;
} {
    return Reflect.get(toRecord(value), "__devMode") !== undefined;
}

/**
 * Gets the renderer environment name from the current global runtime markers.
 *
 * @param globalScope - Global-like object to inspect. Defaults to the current
 *   renderer global scope.
 *
 * @returns The detected renderer environment name.
 */
export function getEnvironment(
    globalScope: object = rendererEnvironmentRuntime.getDefaultRendererEnvironmentScope()
): RendererEnvironmentName {
    return isDevelopmentMode(globalScope) ? "development" : "production";
}

/**
 * Detects whether the renderer is running with development-mode markers.
 *
 * @param globalScope - Global-like object to inspect. Defaults to the current
 *   renderer global scope.
 *
 * @returns Whether the renderer should use development-mode behavior.
 */
export function isDevelopmentMode(
    globalScope: object = rendererEnvironmentRuntime.getDefaultRendererEnvironmentScope()
): boolean {
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
