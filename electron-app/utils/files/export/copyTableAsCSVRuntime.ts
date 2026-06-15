type ClipboardTextWriter = {
    writeText?: (text: string) => Promise<void> | void;
};

export interface CopyTableAsCSVRuntimeScope {
    readonly document?: Document | undefined;
    readonly navigator?:
        | {
              readonly clipboard?: ClipboardTextWriter | undefined;
          }
        | undefined;
}

export interface CopyTableAsCSVRuntime {
    copyTextUsingBrowserClipboard: (text: string) => Promise<boolean>;
    copyTextUsingLegacyExecCommand: (
        text: string,
        styles: Partial<CSSStyleDeclaration>
    ) => void;
}

function getDocument(scope: CopyTableAsCSVRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("copyTableAsCSV requires a document runtime");
    }

    return runtimeDocument;
}

const defaultCopyTableAsCSVRuntimeScope: CopyTableAsCSVRuntimeScope =
    globalThis;

export function getCopyTableAsCSVRuntime(
    scope: CopyTableAsCSVRuntimeScope = defaultCopyTableAsCSVRuntimeScope
): CopyTableAsCSVRuntime {
    return {
        async copyTextUsingBrowserClipboard(text): Promise<boolean> {
            try {
                const clipboard = scope.navigator?.clipboard;
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
            styles: Partial<CSSStyleDeclaration>
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
