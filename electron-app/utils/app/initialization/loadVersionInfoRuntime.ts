import { getBrowserDocument } from "../../runtime/browserRuntime.js";
import {
    getProcessStringValue as getRuntimeProcessStringValue,
    getProcessVersionValue as getRuntimeProcessVersionValue,
    type RuntimeProcessStringPropertyName,
} from "../../runtime/processEnvironment.js";

type LoadVersionInfoDocument = Pick<Document, "querySelector">;
type LoadVersionInfoRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface LoadVersionInfoRuntimeScope {
    readonly getDocument:
        | (() => LoadVersionInfoDocument | undefined)
        | undefined;
    readonly getProcessStringValue:
        | ((name: RuntimeProcessStringPropertyName) => string | undefined)
        | undefined;
    readonly getProcessVersionValue:
        | ((name: string) => string | undefined)
        | undefined;
}

export interface LoadVersionInfoRuntime {
    readonly getProcessStringValue: (
        name: RuntimeProcessStringPropertyName
    ) => string | undefined;
    readonly getProcessVersionValue: (name: string) => string | undefined;
    readonly queryVersionNumber: (selector: string) => Element | null;
}

const defaultLoadVersionInfoRuntimeScope: LoadVersionInfoRuntimeScope = {
    getDocument: getBrowserDocument,
    getProcessStringValue: getRuntimeProcessStringValue,
    getProcessVersionValue: getRuntimeProcessVersionValue,
};

function getRequiredProvider<T>(
    provider: LoadVersionInfoRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`loadVersionInfo requires a ${providerName}`);
    }

    return provider;
}

function getRequiredDocument(
    scope: LoadVersionInfoRuntimeScope
): LoadVersionInfoDocument {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document provider"
    )();
    if (!runtimeDocument) {
        throw new TypeError("loadVersionInfo requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredProcessStringReader(
    scope: LoadVersionInfoRuntimeScope
): (name: RuntimeProcessStringPropertyName) => string | undefined {
    if (typeof scope.getProcessStringValue !== "function") {
        throw new TypeError(
            "loadVersionInfo requires a process string provider"
        );
    }

    return scope.getProcessStringValue;
}

function getRequiredProcessVersionReader(
    scope: LoadVersionInfoRuntimeScope
): (name: string) => string | undefined {
    if (typeof scope.getProcessVersionValue !== "function") {
        throw new TypeError(
            "loadVersionInfo requires a process version provider"
        );
    }

    return scope.getProcessVersionValue;
}

export function getLoadVersionInfoRuntime(
    scope: LoadVersionInfoRuntimeScope = defaultLoadVersionInfoRuntimeScope
): LoadVersionInfoRuntime {
    return {
        getProcessStringValue(name): string | undefined {
            return getRequiredProcessStringReader(scope)(name);
        },
        getProcessVersionValue(name): string | undefined {
            return getRequiredProcessVersionReader(scope)(name);
        },
        queryVersionNumber(selector): Element | null {
            return getRequiredDocument(scope).querySelector(selector);
        },
    };
}
