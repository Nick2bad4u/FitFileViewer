interface ProcessLike {
    env?: Record<string, unknown>;
    versions?: Record<string, unknown>;
}

function getProcessEnvValue(
    processRef: ProcessLike | undefined,
    name: string
): string | undefined {
    const env = processRef?.env;
    if (!isPreloadObjectRecord(env)) {
        return undefined;
    }

    const value = Reflect.get(env, name);
    return typeof value === "string" ? value : undefined;
}

function getProcessVersionValue(
    processRef: ProcessLike | undefined,
    name: string
): string | undefined {
    const versions = processRef?.versions;
    if (!isPreloadObjectRecord(versions)) {
        return undefined;
    }

    const value = Reflect.get(versions, name);
    return typeof value === "string" ? value : undefined;
}

export function isPreloadDevelopmentMode(
    processRef: ProcessLike | undefined = process
): boolean {
    return getProcessEnvValue(processRef, "NODE_ENV") === "development";
}

export function isPreloadElectronRuntime(
    processRef: ProcessLike | undefined = process
): boolean {
    return getProcessVersionValue(processRef, "electron") !== undefined;
}

function isPreloadObjectRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function shouldEnforceGenericIpcAllowlist(
    processRef: ProcessLike | undefined = process
): boolean {
    return isPreloadElectronRuntime(processRef);
}
