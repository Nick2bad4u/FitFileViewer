import {
    getBrowserClipboard,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

type ClipboardTextWriter = {
    writeText?: (text: string) => Promise<void> | void;
};

export interface CopyTableAsCSVRuntimeScope {
    readonly getClipboard: (() => ClipboardTextWriter | undefined) | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
}

export interface CopyTableAsCSVRuntime {
    copyTextUsingBrowserClipboard: (text: string) => Promise<boolean>;
    copyTextUsingLegacyExecCommand: (
        text: string,
        styles: Readonly<Partial<CSSStyleDeclaration>>
    ) => void;
}

function getDocument(scope: CopyTableAsCSVRuntimeScope): Document {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError("copyTableAsCSV requires a document provider");
    }

    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("copyTableAsCSV requires a document runtime");
    }

    return runtimeDocument;
}

function getClipboard(
    scope: CopyTableAsCSVRuntimeScope
): ClipboardTextWriter | undefined {
    const getClipboardRef = scope.getClipboard;
    if (typeof getClipboardRef !== "function") {
        throw new TypeError("copyTableAsCSV requires a clipboard provider");
    }

    return getClipboardRef();
}

const defaultCopyTableAsCSVRuntimeScope: CopyTableAsCSVRuntimeScope = {
    getClipboard: getBrowserClipboard,
    getDocument: getBrowserDocument,
};

export function getCopyTableAsCSVRuntime(
    scope: CopyTableAsCSVRuntimeScope = defaultCopyTableAsCSVRuntimeScope
): CopyTableAsCSVRuntime {
    return {
        async copyTextUsingBrowserClipboard(text): Promise<boolean> {
            const clipboard = getClipboard(scope);
            try {
                if (typeof clipboard?.writeText !== "function") {
                    return false;
                }

                await clipboard.writeText(text);
                return true;
            } catch {
                return false;
            }
        },
        copyTextUsingLegacyExecCommand(
            text,
            styles: Readonly<Partial<CSSStyleDeclaration>>
        ): void {
            const runtimeDocument = getDocument(scope);
            const textarea = runtimeDocument.createElement("textarea");
            textarea.value = text;

            Object.assign(textarea.style, styles);
            runtimeDocument.body.append(textarea);
            textarea.focus();
            textarea.select();

            try {
                const successful = runtimeDocument.execCommand("copy");
                if (!successful) {
                    throw new Error("execCommand('copy') returned false");
                }
            } finally {
                textarea.remove();
            }
        },
    };
}
