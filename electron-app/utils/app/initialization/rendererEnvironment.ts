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
    const locationRecord = toObject(environmentInput.location);

    return {
        hostname: getStringProperty(locationRecord, "hostname"),
        href: getStringProperty(locationRecord, "href"),
        protocol: getStringProperty(locationRecord, "protocol"),
        search: getStringProperty(locationRecord, "search"),
    };
}

function getStringProperty(
    record: object,
    propertyName: string
): string {
    const value = Reflect.get(record, propertyName);

    return typeof value === "string" ? value : "";
}

function hasDocumentDevModeFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    const documentRecord = toObject(environmentInput.document);
    const documentElement = toObject(
        Reflect.get(documentRecord, "documentElement")
    );
    const dataset = toObject(Reflect.get(documentElement, "dataset"));

    return Object.hasOwn(dataset, "devMode");
}

function hasElectronDevModeFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    return isElectronDevModeApi(environmentInput.electronAPI);
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

function toObject(value: unknown): object {
    return typeof value === "object" && value !== null ? value : {};
}

function isElectronDevModeApi(value: unknown): value is {
    readonly __devMode: unknown;
} {
    return Reflect.get(toObject(value), "__devMode") !== undefined;
}

function toRendererEnvironmentInput(
    input: RendererEnvironmentInput | object
): RendererEnvironmentInput {
    const inputRecord = toObject(input);

    return {
        developmentFlag:
            "developmentFlag" in inputRecord
                ? Reflect.get(inputRecord, "developmentFlag")
                : Reflect.get(inputRecord, "__DEVELOPMENT__"),
        document: Reflect.get(inputRecord, "document"),
        electronAPI: Reflect.get(inputRecord, "electronAPI"),
        location: Reflect.get(inputRecord, "location"),
    };
}

/**
 * Gets the renderer environment name from focused renderer runtime markers.
 *
 * @param environmentInput - Focused renderer environment input. Defaults to
 *   the current renderer runtime values.
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
 * @param environmentInput - Focused renderer environment input. Defaults to
 *   the current renderer runtime values.
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
