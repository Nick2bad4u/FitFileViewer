interface ProcessLike {
    readonly env?: unknown;
    readonly versions?: unknown;
}

interface PreloadProcessEnvironment {
    readonly NODE_ENV?: unknown;
}

interface PreloadProcessVersions {
    readonly electron?: unknown;
}

function getProcessNodeEnvironment(
    processRef: ProcessLike | undefined
): string | undefined {
    const value = getPreloadProcessEnvironment(processRef).NODE_ENV;
    return typeof value === "string" ? value : undefined;
}

function getProcessElectronVersion(
    processRef: ProcessLike | undefined
): string | undefined {
    const value = getPreloadProcessVersions(processRef).electron;
    return typeof value === "string" ? value : undefined;
}

function getPreloadProcessEnvironment(
    processRef: ProcessLike | undefined
): PreloadProcessEnvironment {
    try {
        return toPreloadProcessEnvironment(processRef?.env);
    } catch {
        return {};
    }
}

function getPreloadProcessVersions(
    processRef: ProcessLike | undefined
): PreloadProcessVersions {
    try {
        return toPreloadProcessVersions(processRef?.versions);
    } catch {
        return {};
    }
}

export function isPreloadDevelopmentMode(
    processRef: ProcessLike | undefined = process
): boolean {
    return getProcessNodeEnvironment(processRef) === "development";
}

export function isPreloadElectronRuntime(
    processRef: ProcessLike | undefined = process
): boolean {
    return getProcessElectronVersion(processRef) !== undefined;
}

function isPreloadObjectRecord(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function toPreloadProcessEnvironment(
    value: unknown
): PreloadProcessEnvironment {
    return isPreloadObjectRecord(value) ? value : {};
}

function toPreloadProcessVersions(value: unknown): PreloadProcessVersions {
    return isPreloadObjectRecord(value) ? value : {};
}

export function shouldEnforceGenericIpcAllowlist(
    processRef: ProcessLike | undefined = process
): boolean {
    return isPreloadElectronRuntime(processRef);
}
