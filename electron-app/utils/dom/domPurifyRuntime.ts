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
        typeof value === "object" &&
        value !== null &&
        typeof (value as { sanitize?: unknown }).sanitize === "function"
    );
}
