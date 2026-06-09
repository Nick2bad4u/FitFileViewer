import { describe, expect, it, vi } from "vitest";

import { sendFitFileToAltFitReader } from "../../../../../electron-app/utils/files/import/sendFitFileToAltFitReader.js";
import { FILE_CONSTANTS, UI_CONSTANTS } from "../../../../../electron-app/utils/config/constants.js";

const IFRAME_ID = UI_CONSTANTS.DOM_IDS.ALT_FIT_IFRAME;
const IFRAME_PATH = FILE_CONSTANTS.IFRAME_PATHS.ALT_FIT;

function resetTestState(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
}

describe("sendFitFileToAltFitReader", () => {
    it("posts a FIT file payload to an already loaded Alt FIT iframe", () => {
        expect.assertions(2);

        resetTestState();

        const iframe = document.createElement("iframe");
        iframe.id = IFRAME_ID;
        iframe.src = `${globalThis.location.origin}${IFRAME_PATH}`;
        document.body.append(iframe);
        const contentWindow = iframe.contentWindow as Window;

        const postMessageSpy = vi
            .spyOn(contentWindow, "postMessage")
            .mockImplementation(() => {});

        sendFitFileToAltFitReader(Uint8Array.from([65, 66]).buffer);

        expect(postMessageSpy).toHaveBeenCalledWith(
            { base64: "QUI=", type: "fit-file" },
            globalThis.location.origin
        );
        expect(iframe.id).toBe(IFRAME_ID);

        resetTestState();
    });

    it("loads the Alt FIT iframe before posting when it is not already loaded", () => {
        expect.assertions(2);

        resetTestState();

        const iframe = document.createElement("iframe");
        iframe.id = IFRAME_ID;
        document.body.append(iframe);

        sendFitFileToAltFitReader(Uint8Array.from([67]).buffer);

        expect(iframe.getAttribute("src")).toBe(IFRAME_PATH);

        const loadedContentWindow = iframe.contentWindow as Window;
        const postMessageSpy = vi
            .spyOn(loadedContentWindow, "postMessage")
            .mockImplementation(() => {});

        iframe.dispatchEvent(new Event("load"));

        expect(postMessageSpy).toHaveBeenCalledWith(
            { base64: "Qw==", type: "fit-file" },
            globalThis.location.origin
        );

        resetTestState();
    });

    it("warns when the Alt FIT iframe is missing", () => {
        expect.assertions(1);

        resetTestState();

        const warn = vi.fn<(message: string) => void>();

        sendFitFileToAltFitReader(new ArrayBuffer(0), {
            console: {
                error: vi.fn(),
                warn,
            },
        });

        expect(warn).toHaveBeenCalledExactlyOnceWith(
            "Alt FIT iframe not found"
        );

        resetTestState();
    });
});
