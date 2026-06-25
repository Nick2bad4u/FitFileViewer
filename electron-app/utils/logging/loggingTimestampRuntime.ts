type LoggingTimestampDateConstructor = new () => { toISOString: () => string };

export interface LoggingTimestampRuntimeScope {
    readonly getDateConstructor?:
        | (() => LoggingTimestampDateConstructor | undefined)
        | undefined;
}

export interface LoggingTimestampRuntime {
    isoNow: () => string;
}

const defaultLoggingTimestampRuntimeScope: LoggingTimestampRuntimeScope = {
    getDateConstructor: () => Date,
};

function getRequiredDateConstructor(
    scope: LoggingTimestampRuntimeScope
): LoggingTimestampDateConstructor {
    const DateConstructor = scope.getDateConstructor?.();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("loggingTimestampRuntime requires a date constructor");
}

export function loggingTimestampRuntime(
    scope: LoggingTimestampRuntimeScope = defaultLoggingTimestampRuntimeScope
): LoggingTimestampRuntime {
    return {
        isoNow(): string {
            const DateConstructor = getRequiredDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}
