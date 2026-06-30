export interface DomPurifyRuntime {
    sanitize(
        html: string,
        options: {
            ALLOWED_ATTR: string[];
            ALLOWED_TAGS: string[];
            FORBID_ATTR: string[];
            FORBID_CONTENTS: string[];
            FORBID_TAGS: string[];
            RETURN_DOM_FRAGMENT: true;
        }
    ): DocumentFragment;
}

type DomPurifyRuntimeCandidate = Readonly<{
    readonly sanitize?: unknown;
}>;

let registeredDomPurifyRuntime: DomPurifyRuntime | undefined;

function isObjectCandidate(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDomPurifyRuntimeCandidate(
    value: unknown
): DomPurifyRuntimeCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function readRuntimeValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
}

export function registerDomPurifyRuntime(runtime: DomPurifyRuntime): void {
    registeredDomPurifyRuntime = runtime;
}

export function clearDomPurifyRuntimeForTests(): void {
    registeredDomPurifyRuntime = undefined;
}

export function resolveDomPurifyRuntime(): DomPurifyRuntime | undefined {
    return registeredDomPurifyRuntime;
}

export function isDomPurifyRuntime(value: unknown): value is DomPurifyRuntime {
    const runtime = toDomPurifyRuntimeCandidate(value);
    return (
        runtime !== undefined &&
        typeof readRuntimeValue(() => runtime.sanitize) === "function"
    );
}
