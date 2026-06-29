import {
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

type StateManagerDefaultsDocumentRuntime = {
    readonly title?: string | undefined;
};

type StateManagerDefaultsPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface StateManagerDefaultsRuntimeScope {
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
    readonly getDocument:
        | (() => StateManagerDefaultsDocumentRuntime | undefined)
        | undefined;
    readonly getPerformance:
        | (() => StateManagerDefaultsPerformanceRuntime | undefined)
        | undefined;
}

export interface StateManagerDefaultsRuntime {
    getDefaultDocumentTitle: () => string;
    getStartTime: () => number;
}

const defaultStateManagerDefaultsRuntimeScope: StateManagerDefaultsRuntimeScope =
    {
        getDateNow: getBrowserDateNow,
        getDocument: getBrowserDocument,
        getPerformance: getBrowserPerformance,
    };

function getRequiredStartClock(
    scope: StateManagerDefaultsRuntimeScope
): () => number {
    const performance = getScopedPerformance(scope);
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    const dateNow = getScopedDateNow(scope);
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("stateManagerDefaultsRuntime requires a clock");
}

function getScopedDateNow(
    scope: StateManagerDefaultsRuntimeScope
): (() => number) | undefined {
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError(
            "stateManagerDefaultsRuntime requires a dateNow provider"
        );
    }

    return scope.getDateNow();
}

function getScopedDocument(
    scope: StateManagerDefaultsRuntimeScope
): StateManagerDefaultsDocumentRuntime | undefined {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "stateManagerDefaultsRuntime requires a document provider"
        );
    }

    return scope.getDocument();
}

function getScopedPerformance(
    scope: StateManagerDefaultsRuntimeScope
): StateManagerDefaultsPerformanceRuntime | undefined {
    if (typeof scope.getPerformance !== "function") {
        throw new TypeError(
            "stateManagerDefaultsRuntime requires a performance provider"
        );
    }

    return scope.getPerformance();
}

export function getStateManagerDefaultsRuntime(
    scope: StateManagerDefaultsRuntimeScope = defaultStateManagerDefaultsRuntimeScope
): StateManagerDefaultsRuntime {
    return {
        getDefaultDocumentTitle(): string {
            const document = getScopedDocument(scope);
            const title = document?.title;
            return typeof title === "string" && title.length > 0
                ? title
                : "Fit File Viewer";
        },
        getStartTime(): number {
            return getRequiredStartClock(scope)();
        },
    };
}
