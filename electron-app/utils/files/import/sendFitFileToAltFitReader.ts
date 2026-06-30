import { convertArrayBufferToBase64 } from "../../formatting/converters/convertArrayBufferToBase64.js";
import { FILE_CONSTANTS, UI_CONSTANTS } from "../../config/constants.js";
import {
    getAltFitSenderRuntimeEnvironment,
    type AltFitSenderLogger,
} from "./altFitSenderRuntime.js";

type AltFitSenderDependencies = {
    console?: AltFitSenderLogger;
    getElementById?: (id: string) => HTMLElement | null;
    location?: Pick<Location, "origin" | "protocol">;
};

function getTargetOrigin(
    location: Pick<Location, "origin" | "protocol"> | undefined
): string {
    return location?.protocol === "file:" ? "*" : (location?.origin ?? "*");
}

export function sendFitFileToAltFitReader(
    arrayBuffer: ArrayBuffer,
    dependencies: AltFitSenderDependencies = {}
): void {
    const runtimeEnvironment = getAltFitSenderRuntimeEnvironment();
    const logger = dependencies.console ?? runtimeEnvironment.console;
    const getElementById =
        dependencies.getElementById ?? runtimeEnvironment.getElementById;
    const location = dependencies.location ?? runtimeEnvironment.location;
    const iframe = getElementById(UI_CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);

    if (!iframe) {
        logger.warn("Alt FIT iframe not found");
        return;
    }

    if (!runtimeEnvironment.isIFrameElement(iframe)) {
        logger.warn("Alt FIT iframe target is not an iframe");
        return;
    }

    const postToIframe = (): boolean => {
        try {
            const base64 = convertArrayBufferToBase64(arrayBuffer);
            const targetOrigin = getTargetOrigin(location);
            return runtimeEnvironment.postMessageToIFrame(
                iframe,
                { base64, type: "fit-file" },
                targetOrigin
            );
        } catch (error) {
            logger.error("Error posting message to iframe:", error);
            return false;
        }
    };

    if (!iframe.src?.includes(FILE_CONSTANTS.IFRAME_PATHS.ALT_FIT)) {
        const abortController = runtimeEnvironment.createAbortController();
        iframe.src = FILE_CONSTANTS.IFRAME_PATHS.ALT_FIT;
        iframe.addEventListener("load", postToIframe, {
            once: true,
            signal: abortController.signal,
        });
        return;
    }

    if (iframe.src && postToIframe()) {
        return;
    }

    const abortController = runtimeEnvironment.createAbortController();
    iframe.addEventListener("load", postToIframe, {
        once: true,
        signal: abortController.signal,
    });
}
