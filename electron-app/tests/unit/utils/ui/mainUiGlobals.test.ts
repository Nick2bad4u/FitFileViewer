import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getState: vi.fn<(path: string) => unknown>(),
    setState:
        vi.fn<
            (
                path: string,
                value: unknown,
                options?: { silent: boolean; source: string }
            ) => void
        >(),
}));

vi.mock(import("../../../../utils/state/core/stateManager.js"), () => mocks);

import {
    defineGlobalDataProperty,
    registerLegacyGlobals,
} from "../../../../utils/ui/mainUiGlobals.js";

type LegacyGlobals = typeof globalThis & {
    cleanupEventListeners?: () => void;
    globalData?: unknown;
    renderChartJS?: (
        data: unknown,
        filePath: string,
        options?: unknown
    ) => void;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => Promise<void>;
    showFitData?: (fitData: unknown, filePath: string) => void;
};

const GLOBAL_DATA_PROPERTY = "globalData";
const IFRAME_ID = "alt-fit-iframe";
const IFRAME_PATH = "/alt-fit-reader.html";

function resetTestState(): void {
    document.body.innerHTML = "";
    Reflect.deleteProperty(globalThis, GLOBAL_DATA_PROPERTY);
    const legacyGlobal = globalThis as LegacyGlobals;
    Reflect.deleteProperty(legacyGlobal, "cleanupEventListeners");
    Reflect.deleteProperty(legacyGlobal, "renderChartJS");
    Reflect.deleteProperty(legacyGlobal, "sendFitFileToAltFitReader");
    Reflect.deleteProperty(legacyGlobal, "showFitData");
    vi.restoreAllMocks();
    mocks.getState.mockReset();
    mocks.setState.mockReset();
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
        showFitData: vi.fn<(fitData: unknown, filePath: string) => void>(),
        validateElement:
            vi.fn<(id: string) => HTMLElement | null>(validateElement),
    };
}

describe("mainUiGlobals", () => {
    it("bridges globalData through the state manager", () => {
        expect.assertions(3);

        resetTestState();
        mocks.getState.mockReturnValue({ active: true });

        defineGlobalDataProperty();
        const legacyGlobal = globalThis as LegacyGlobals;

        expect(legacyGlobal.globalData).toStrictEqual({ active: true });

        legacyGlobal.globalData = { active: false };

        expect(mocks.getState).toHaveBeenCalledWith("globalData");
        expect(mocks.setState).toHaveBeenCalledWith(
            "globalData",
            { active: false },
            { silent: false, source: "main-ui.js" }
        );

        resetTestState();
    });

    it("registers renderer compatibility globals", () => {
        expect.assertions(3);

        resetTestState();

        const dependencies = createDependencies(() => null);
        registerLegacyGlobals(dependencies);

        const legacyGlobal = globalThis as LegacyGlobals;

        expect(legacyGlobal.showFitData).toBe(dependencies.showFitData);
        expect(legacyGlobal.renderChartJS).toBe(dependencies.renderChartJS);
        expect(legacyGlobal.cleanupEventListeners).toBe(
            dependencies.cleanupEventListeners
        );

        resetTestState();
    });

    it("posts a FIT file payload to an already loaded Alt FIT iframe", async () => {
        expect.assertions(3);

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

        const result = await (
            globalThis as LegacyGlobals
        ).sendFitFileToAltFitReader?.(Uint8Array.from([65, 66]).buffer);

        expect({ result }).toStrictEqual({ result: undefined });
        expect(postMessageSpy).toHaveBeenCalledWith(
            { base64: "QUI=", type: "fit-file" },
            globalThis.location.origin
        );
        expect(dependencies.validateElement).toHaveBeenCalledWith(IFRAME_ID);

        resetTestState();
    });

    it("loads the Alt FIT iframe before posting when it is not already loaded", async () => {
        expect.assertions(2);

        resetTestState();

        const iframe = document.createElement("iframe");
        document.body.append(iframe);
        const dependencies = createDependencies(() => iframe);
        registerLegacyGlobals(dependencies);

        await (globalThis as LegacyGlobals).sendFitFileToAltFitReader?.(
            Uint8Array.from([67]).buffer
        );

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
        expect.assertions(2);

        resetTestState();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        registerLegacyGlobals(createDependencies(() => null));

        const result = await (
            globalThis as LegacyGlobals
        ).sendFitFileToAltFitReader?.(new ArrayBuffer(0));

        expect({ result }).toStrictEqual({ result: undefined });
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
            "Alt FIT iframe not found"
        );

        resetTestState();
    });
});
