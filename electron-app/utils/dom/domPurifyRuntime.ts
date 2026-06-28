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

let registeredDomPurifyRuntime: DomPurifyRuntime | undefined;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function setDomPurifyRuntime(runtime: unknown): void {
    registeredDomPurifyRuntime = isDomPurifyRuntime(runtime)
        ? runtime
        : undefined;
}

export function clearDomPurifyRuntimeForTests(): void {
    registeredDomPurifyRuntime = undefined;
}

export function resolveDomPurifyRuntime(): DomPurifyRuntime | undefined {
    return registeredDomPurifyRuntime;
}

export function isDomPurifyRuntime(value: unknown): value is DomPurifyRuntime {
    return (
        isRecord(value) && typeof value["sanitize"] === "function"
    );
}
