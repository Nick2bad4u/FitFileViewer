import { querySelectorByIdFlexible } from "../utils/ui/dom/elementIdUtils.js";
import { validateRendererDomElements } from "./domStartupValidation.js";

type RendererDomAccessLogLevel = "error" | "warn";
type RendererDomAccessLogger = (
    level: RendererDomAccessLogLevel,
    ...args: unknown[]
) => void;

type RendererDomAccessOptions = {
    readonly documentTarget: Document;
    readonly logRenderer: RendererDomAccessLogger;
};

type RendererDomAccess = {
    readonly getFileInput: () => HTMLInputElement | null;
    readonly getOpenFileButton: () => HTMLButtonElement | null;
    readonly validateDOMElements: () => boolean;
};

export function createRendererDomAccess(
    options: RendererDomAccessOptions
): RendererDomAccess {
    return {
        getFileInput: () =>
            querySelectorByIdFlexible(
                options.documentTarget,
                "#file_input"
            ) as HTMLInputElement | null,
        getOpenFileButton: () =>
            querySelectorByIdFlexible(
                options.documentTarget,
                "#open_file_btn"
            ) as HTMLButtonElement | null,
        validateDOMElements: () =>
            validateRendererDomElements(
                options.documentTarget,
                options.logRenderer
            ),
    };
}
