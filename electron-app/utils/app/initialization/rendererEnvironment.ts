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

interface RendererEnvironmentInputRecord {
    readonly __DEVELOPMENT__?: unknown;
    readonly developmentFlag?: unknown;
    readonly document?: unknown;
    readonly electronApiCandidate?: unknown;
    readonly location?: unknown;
}

interface RendererDocumentRecord {
    readonly documentElement?: unknown;
}

interface RendererDocumentElementRecord {
    readonly dataset?: unknown;
}

interface RendererDatasetRecord {
    readonly devMode?: unknown;
}

interface RendererElectronDevModeRecord {
    readonly __devMode?: unknown;
}

interface RendererLocationRecord {
    readonly hostname?: unknown;
    readonly href?: unknown;
    readonly protocol?: unknown;
    readonly search?: unknown;
}

function rendererEnvironmentRuntime(): RendererEnvironmentRuntime {
    return getRendererEnvironmentRuntime();
}

function getRendererLocationParts(
    environmentInput: RendererEnvironmentInput
): RendererLocationParts {
    const locationRecord = toLocationRecord(environmentInput.location);

    return {
        hostname:
            typeof locationRecord.hostname === "string"
                ? locationRecord.hostname
                : "",
        href:
            typeof locationRecord.href === "string" ? locationRecord.href : "",
        protocol:
            typeof locationRecord.protocol === "string"
                ? locationRecord.protocol
                : "",
        search:
            typeof locationRecord.search === "string"
                ? locationRecord.search
                : "",
    };
}

function hasDocumentDevModeFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    const documentRecord = toDocumentRecord(environmentInput.document);
    const documentElement = toDocumentElementRecord(
        documentRecord.documentElement
    );
    const dataset = toDatasetRecord(documentElement.dataset);

    return Object.hasOwn(dataset, "devMode");
}

function hasElectronDevModeCandidateFlag(
    environmentInput: RendererEnvironmentInput
): boolean {
    return isElectronDevModeCandidate(environmentInput.electronApiCandidate);
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

function toDatasetRecord(value: unknown): RendererDatasetRecord {
    return toObject(value);
}

function toDocumentElementRecord(
    value: unknown
): RendererDocumentElementRecord {
    return toObject(value);
}

function toDocumentRecord(value: unknown): RendererDocumentRecord {
    return toObject(value);
}

function toEnvironmentInputRecord(
    value: unknown
): RendererEnvironmentInputRecord {
    return toObject(value);
}

function toLocationRecord(value: unknown): RendererLocationRecord {
    return toObject(value);
}

function isElectronDevModeCandidate(value: unknown): value is {
    readonly __devMode: unknown;
} {
    return toElectronDevModeRecord(value).__devMode !== undefined;
}

function toElectronDevModeRecord(
    value: unknown
): RendererElectronDevModeRecord {
    return toObject(value);
}

function toRendererEnvironmentInput(
    input: RendererEnvironmentInput | object
): RendererEnvironmentInput {
    const inputRecord = toEnvironmentInputRecord(input);

    return {
        developmentFlag:
            "developmentFlag" in inputRecord
                ? inputRecord.developmentFlag
                : inputRecord.__DEVELOPMENT__,
        document: inputRecord.document,
        electronApiCandidate: inputRecord.electronApiCandidate,
        location: inputRecord.location,
    };
}

/**
 * Gets the renderer environment name from focused renderer runtime markers.
 *
 * @param environmentInput - Focused renderer environment input. Defaults to the
 *   current renderer runtime values.
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
 * @param environmentInput - Focused renderer environment input. Defaults to the
 *   current renderer runtime values.
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
            hasElectronDevModeCandidateFlag(resolvedEnvironmentInput)
        );
    } catch {
        return false;
    }
}
