import { describe, expect, it, vi } from "vitest";

import {
    addEventListenerWithCleanup,
    cleanupEventListeners,
    validateElectronAPI,
    validateElement,
} from "../../../../electron-app/utils/ui/mainUiDomUtils.js";
import type { RendererElectronApiScope } from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

function getRequiredMockCall<T extends unknown[]>(calls: T[], index = 0): T {
    const call = calls[index];

    if (!call) {
        throw new Error(`Expected mock call ${index}`);
    }

    return call;
}

function resetTestState(): void {
    cleanupEventListeners();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
}

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

describe("mainUiDomUtils", () => {
    it("tracks event listeners and removes them during cleanup", () => {
        expect.assertions(2);

        resetTestState();

        const button = document.createElement("button");
        const handler = vi.fn<(event: Event) => void>();

        addEventListenerWithCleanup(button, "click", handler);
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        cleanupEventListeners();
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(handler).toHaveBeenCalledOnce();
        expect(getRequiredMockCall(handler.mock.calls)[0].type).toBe("click");

        resetTestState();
    });

    it("resolves listener cleanup controllers through the injected runtime", () => {
        expect.assertions(4);

        resetTestState();

        const button = document.createElement("button");
        const handler = vi.fn<(event: Event) => void>();
        const abortController = new AbortController();
        const abort = vi.fn(() => {
            abortController.abort();
        });
        const runtime = {
            createAbortController: vi.fn(() => ({
                abort,
                signal: abortController.signal,
            })),
        };

        addEventListenerWithCleanup(
            button,
            "click",
            handler,
            undefined,
            runtime
        );
        cleanupEventListeners();
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(abort).toHaveBeenCalledOnce();
        expect(abortController.signal.aborted).toBe(true);
        expect(handler).not.toHaveBeenCalled();

        resetTestState();
    });

    it("warns when a listener cannot be registered", () => {
        expect.assertions(2);

        resetTestState();

        const failure = new Error("listener failed");
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        class FailingTarget extends EventTarget {
            public override addEventListener(
                _type: string,
                _callback: EventListenerOrEventListenerObject | null,
                _options?: AddEventListenerOptions | boolean
            ): void {
                throw failure;
            }
        }

        expect(
            addEventListenerWithCleanup(
                new FailingTarget(),
                "drop",
                vi.fn<(event: Event) => void>()
            )
        ).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            "[main-ui] Failed to add event listener for drop",
            failure
        );

        resetTestState();
    });

    it("rejects a missing electron API", () => {
        expect.assertions(1);

        resetTestState();

        expect({ isValid: validateElectronAPI() }).toStrictEqual({
            isValid: false,
        });

        resetTestState();
    });

    it("rejects an electron API without a FIT decoder function", () => {
        expect.assertions(1);

        resetTestState();

        const electronApiScope = createElectronApiScope({
            decodeFitFile: "not-a-function",
        });

        expect({
            isValid: validateElectronAPI(electronApiScope),
        }).toStrictEqual({ isValid: false });

        resetTestState();
    });

    it("accepts an electron API with a FIT decoder function", () => {
        expect.assertions(1);

        resetTestState();

        const electronApiScope = createElectronApiScope({
            decodeFitFile: vi.fn<(buffer: ArrayBuffer) => unknown>(),
        });

        expect({
            isValid: validateElectronAPI(electronApiScope),
        }).toStrictEqual({ isValid: true });

        resetTestState();
    });

    it("finds elements with flexible id variants", () => {
        expect.assertions(2);

        resetTestState();

        const element = document.createElement("div");
        element.id = "alt-fit-iframe";
        document.body.append(element);

        expect(validateElement("alt_fit_iframe")).toBe(element);
        expect(validateElement("altFitIframe")).toBe(element);

        resetTestState();
    });

    it("warns when an element cannot be found", () => {
        expect.assertions(2);

        resetTestState();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(validateElement("missing_element")).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            'Element with ID "missing_element" not found'
        );

        resetTestState();
    });
});
