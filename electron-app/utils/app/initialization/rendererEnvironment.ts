/** Runtime environment names used by the renderer bootstrap. */
import {
    getRendererEnvironmentRuntime,
    type RendererEnvironmentInput,
    type RendererEnvironmentRuntime,
} from "./rendererEnvironmentRuntime.js";

export type RendererEnvironmentName = "development" | "production";

interface RendererLocationParts {
    hostname: string;
    href: string;
    protocol: string;
    search: string;
}

function rendererEnvironmentRuntime(): RendererEnvironmentRuntime {
    return getRendererEnvironmentRuntime();
}

function getRendererLocationParts(
    environmentInput: RendererEnvironmentInput
): RendererLocationParts {
    const locationRecord = toRecord(environmentInput.location);

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

function hasDocumentDevModeFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    const documentRecord = toRecord(environmentInput.document);
    const documentElement = toRecord(documentRecord["documentElement"]);
    const dataset = toRecord(documentElement["dataset"]);

    return Object.hasOwn(dataset, "devMode");
}

function hasElectronDevModeFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    const environmentInputRecord = toRecord(environmentInput);

    return isElectronDevModeApi(environmentInputRecord["electronAPI"]);
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

function toRendererEnvironmentInput(
    input: RendererEnvironmentInput | object
): RendererEnvironmentInput {
    const inputRecord = toRecord(input);

    return {
        developmentFlag:
            "developmentFlag" in inputRecord
                ? inputRecord["developmentFlag"]
                : inputRecord["__DEVELOPMENT__"],
        document: inputRecord["document"],
        electronAPI: inputRecord["electronAPI"],
        location: inputRecord["location"],
    };
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
    environmentInput:
        | RendererEnvironmentInput
        | object = rendererEnvironmentRuntime().getDefaultRendererEnvironmentInput()
): RendererEnvironmentName {
    return isDevelopmentMode(environmentInput) ? "development" : "production";
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
    environmentInput:
        | RendererEnvironmentInput
        | object = rendererEnvironmentRuntime().getDefaultRendererEnvironmentInput()
): boolean {
    try {
        const resolvedEnvironmentInput =
            toRendererEnvironmentInput(environmentInput);
        const locationParts = getRendererLocationParts(
            resolvedEnvironmentInput
        );

        return (
            isLocalDevelopmentHost(locationParts.hostname) ||
            isDebugRendererLocation(locationParts) ||
            resolvedEnvironmentInput.developmentFlag === true ||
            hasDocumentDevModeFlag(resolvedEnvironmentInput) ||
            hasElectronDevModeFlag(resolvedEnvironmentInput)
        );
    } catch {
        return false;
    }
}
