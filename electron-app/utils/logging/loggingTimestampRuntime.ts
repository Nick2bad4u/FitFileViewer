type LoggingTimestampDateConstructor = new () => { toISOString: () => string };

export interface LoggingTimestampRuntimeScope {
    readonly getDateConstructor: LoggingTimestampRuntimeProvider<LoggingTimestampDateConstructor>;
}

export interface LoggingTimestampRuntime {
    isoNow: () => string;
}

type LoggingTimestampRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultLoggingTimestampRuntimeScope: LoggingTimestampRuntimeScope = {
    getDateConstructor: () => Date,
};

function getRequiredDateConstructor(
    getDateConstructor: () => LoggingTimestampDateConstructor | undefined
): LoggingTimestampDateConstructor {
    const DateConstructor = getDateConstructor();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("loggingTimestampRuntime requires a date constructor");
}

export function loggingTimestampRuntime(
    scope: LoggingTimestampRuntimeScope = defaultLoggingTimestampRuntimeScope
): LoggingTimestampRuntime {
    const getDateConstructor = getRequiredProvider(
        scope.getDateConstructor,
        "date constructor"
    );

    return {
        isoNow(): string {
            const DateConstructor =
                getRequiredDateConstructor(getDateConstructor);
            return new DateConstructor().toISOString();
        },
    };
}

function getRequiredProvider<T>(
    provider: LoggingTimestampRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `loggingTimestampRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}
