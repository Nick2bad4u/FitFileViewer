export type AltFitSenderLogger = Pick<Console, "error" | "warn">;

export interface AltFitSenderRuntimeEnvironment {
    readonly console: AltFitSenderLogger;
    readonly createAbortController: () => AbortController;
    readonly getElementById: (id: string) => HTMLElement | null;
    readonly location?: Pick<Location, "origin" | "protocol">;
}

interface AltFitSenderRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly console: AltFitSenderLogger;
    readonly document?: Pick<Document, "getElementById">;
    readonly location?: Pick<Location, "origin" | "protocol">;
}

export function getAltFitSenderRuntimeEnvironment(
    scope: AltFitSenderRuntimeScope = globalThis
): AltFitSenderRuntimeEnvironment {
    return {
        console: scope.console,
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "Alt FIT sender requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getElementById: (id) => scope.document?.getElementById(id) ?? null,
        ...(scope.location === undefined ? {} : { location: scope.location }),
    };
}
