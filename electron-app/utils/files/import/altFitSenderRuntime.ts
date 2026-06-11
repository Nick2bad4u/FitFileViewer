export type AltFitSenderLogger = Pick<Console, "error" | "warn">;

export interface AltFitSenderRuntimeEnvironment {
    readonly console: AltFitSenderLogger;
    readonly getElementById: (id: string) => HTMLElement | null;
    readonly location?: Pick<Location, "origin" | "protocol">;
}

interface AltFitSenderRuntimeScope {
    readonly console: AltFitSenderLogger;
    readonly document?: Pick<Document, "getElementById">;
    readonly location?: Pick<Location, "origin" | "protocol">;
}

export function getAltFitSenderRuntimeEnvironment(
    scope: AltFitSenderRuntimeScope = globalThis
): AltFitSenderRuntimeEnvironment {
    return {
        console: scope.console,
        getElementById: (id) => scope.document?.getElementById(id) ?? null,
        ...(scope.location === undefined ? {} : { location: scope.location }),
    };
}
