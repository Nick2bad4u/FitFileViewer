import { describe, expect, it, vi } from "vitest";

import { registerLegacyGlobals } from "../../../../electron-app/utils/ui/mainUiGlobals.js";

type LegacyGlobals = typeof globalThis & {
    cleanupEventListeners?: () => void;
    renderChartJS?: (
        data: unknown,
        filePath: string,
        options?: unknown
    ) => void;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => Promise<void>;
};

const IFRAME_ID = "alt-fit-iframe";
const IFRAME_PATH = "/alt-fit-reader.html";

function resetTestState(): void {
    document.body.replaceChildren();
    const legacyGlobal = globalThis as LegacyGlobals;
    Reflect.deleteProperty(legacyGlobal, "cleanupEventListeners");
    Reflect.deleteProperty(legacyGlobal, "renderChartJS");
    Reflect.deleteProperty(legacyGlobal, "sendFitFileToAltFitReader");
    vi.restoreAllMocks();
}

function createDependencies(
    validateElement: (id: string) => HTMLElement | null
) {
    return {
        cleanupEventListeners: vi.fn<() => void>(),
        constants: {
            DOM_IDS: { ALT_FIT_IFRAME: IFRAME_ID },
            IFRAME_PATHS: { ALT_FIT: IFRAME_PATH },
        },
        renderChartJS:
            vi.fn<
                (data: unknown, filePath: string, options?: unknown) => void
            >(),
        validateElement:
            vi.fn<(id: string) => HTMLElement | null>(validateElement),
    };
}

function getRequiredFitFileSender(): (
    arrayBuffer: ArrayBuffer
) => Promise<void> {
    const sender = (globalThis as LegacyGlobals).sendFitFileToAltFitReader;
    expect(sender).toBeTypeOf("function");
    return sender as (arrayBuffer: ArrayBuffer) => Promise<void>;
}

describe("mainUiGlobals", () => {
    it("registers renderer compatibility globals", () => {
        expect.assertions(2);

        resetTestState();

        const dependencies = createDependencies(() => null);
        registerLegacyGlobals(dependencies);

        const legacyGlobal = globalThis as LegacyGlobals;

        expect(legacyGlobal.renderChartJS).toBe(dependencies.renderChartJS);
        expect(legacyGlobal.cleanupEventListeners).toBe(
            dependencies.cleanupEventListeners
        );

        resetTestState();
    });

    it("posts a FIT file payload to an already loaded Alt FIT iframe", async () => {
        expect.assertions(4);

        resetTestState();

        const iframe = document.createElement("iframe");
        iframe.id = IFRAME_ID;
        iframe.src = `${globalThis.location.origin}${IFRAME_PATH}`;
        document.body.append(iframe);
        const contentWindow = iframe.contentWindow as Window;

        const postMessageSpy = vi
            .spyOn(contentWindow, "postMessage")
            .mockImplementation(() => {});
        const dependencies = createDependencies(() => iframe);
        registerLegacyGlobals(dependencies);

        const result = await getRequiredFitFileSender()(
            Uint8Array.from([65, 66]).buffer
        );

        expect({ result }).toStrictEqual({ result: undefined });
        expect(postMessageSpy).toHaveBeenCalledWith(
            { base64: "QUI=", type: "fit-file" },
            globalThis.location.origin
        );
        expect(dependencies.validateElement).toHaveBeenCalledWith(IFRAME_ID);

        resetTestState();
    });

    it("loads the Alt FIT iframe before posting when it is not already loaded", async () => {
        expect.assertions(3);

        resetTestState();

        const iframe = document.createElement("iframe");
        document.body.append(iframe);
        const dependencies = createDependencies(() => iframe);
        registerLegacyGlobals(dependencies);

        await getRequiredFitFileSender()(Uint8Array.from([67]).buffer);

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

    it("warns when the Alt FIT iframe is missing", async () => {
        expect.assertions(3);

        resetTestState();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        registerLegacyGlobals(createDependencies(() => null));

        const result = await getRequiredFitFileSender()(new ArrayBuffer(0));

        expect({ result }).toStrictEqual({ result: undefined });
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
            "Alt FIT iframe not found"
        );

        resetTestState();
    });
});
