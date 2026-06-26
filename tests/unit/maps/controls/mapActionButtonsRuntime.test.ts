import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getMapActionButtonsRuntime,
    type MapActionButtonTimer,
    type MapActionButtonsRuntimeScope,
} from "../../../../electron-app/utils/maps/controls/mapActionButtonsRuntime.js";
import type {
    BrowserClearTimeout,
    BrowserMutationObserverConstructor,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";

describe("getMapActionButtonsRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("uses the injected timer scheduler", () => {
        expect.assertions(3);

        let callbackRan = false;
        let scheduledDelayMs = 0;
        const runtime = getMapActionButtonsRuntime({
            getSetTimeout: () =>
                function setTimeout(callback, delayMs): MapActionButtonTimer {
                    scheduledDelayMs = delayMs;
                    callback();
                    return 7 as MapActionButtonTimer;
                },
        });
        const retryDelayMs = Number.parseInt("150", 10);

        const timer = runtime.setTimeout(() => {
            callbackRan = true;
        }, retryDelayMs);

        expect(timer).toBe(7);
        expect(callbackRan).toBe(true);
        expect(scheduledDelayMs).toBe(retryDelayMs);
    });

    it("uses the injected timer clearer", () => {
        expect.assertions(1);

        let clearedTimer: MapActionButtonTimer | undefined;
        const runtime = getMapActionButtonsRuntime({
            getClearTimeout: () =>
                function clearTimeout(timer: MapActionButtonTimer): void {
                    clearedTimer = timer;
                },
        });
        const timer = 9 as MapActionButtonTimer;

        runtime.clearTimeout(timer);

        expect(clearedTimer).toBe(timer);
    });

    it("uses the injected date clock", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getMapActionButtonsRuntime({
            getDateNow: () => dateNow,
        });

        expect(runtime.dateNow()).toBe(123);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production DOM, constructor, timer, and clock defaults", () => {
        expect.assertions(13);

        const callback = vi.fn<() => void>();
        const mutationCallback = vi.fn<MutationCallback>();
        const delayMs = Number("150");
        const timer = 8 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const dateNowMock = vi.spyOn(Date, "now").mockReturnValue(456);
        const observer = {
            disconnect: vi.fn(),
            observe: vi.fn(),
            takeRecords: vi.fn(() => []),
        } satisfies MutationObserver;
        const MutationObserverMock = vi.fn(function FakeMutationObserver(
            this: unknown,
            receivedCallback: MutationCallback
        ) {
            expect(receivedCallback).toBe(mutationCallback);
            return observer;
        });

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("MutationObserver", MutationObserverMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getMapActionButtonsRuntime();
        const element = document.createElement("button");
        const keyboardEvent = new KeyboardEvent("keydown");
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(runtime.getDocument()).toBe(document);
        expect(runtime.isHTMLElement(element)).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.createMutationObserver(mutationCallback)).toBe(observer);
        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(runtime.dateNow()).toBe(456);
        expect(dateNowMock).toHaveBeenCalled();
        expect(MutationObserverMock).toHaveBeenCalledOnce();
        expect(callback).not.toHaveBeenCalled();
    });

    it("uses the injected document and HTMLElement providers", () => {
        expect.assertions(3);

        const documentRef = document;
        const element = documentRef.createElement("button");
        const runtime = getMapActionButtonsRuntime({
            getDocument: () => documentRef,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.getDocument()).toBe(documentRef);
        expect(runtime.isHTMLElement(element)).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });

    it("uses injected KeyboardEvent and MutationObserver providers", () => {
        expect.assertions(4);

        const observer = {
            disconnect: vi.fn(),
            observe: vi.fn(),
            takeRecords: vi.fn(() => []),
        } satisfies MutationObserver;
        const callback = vi.fn<MutationCallback>();
        const MutationObserverConstructor = vi.fn(function FakeMutationObserver(
            this: unknown,
            receivedCallback: MutationCallback
        ) {
            expect(receivedCallback).toBe(callback);
            return observer;
        });
        const runtime = getMapActionButtonsRuntime({
            getKeyboardEvent: () => KeyboardEvent,
            getMutationObserver: () =>
                MutationObserverConstructor as unknown as BrowserMutationObserverConstructor,
        });

        expect(runtime.createMutationObserver(callback)).toBe(observer);
        expect(MutationObserverConstructor).toHaveBeenCalledOnce();
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
    });

    it("does not borrow ambient timers or clocks for explicit scopes", () => {
        expect.assertions(7);

        const runtime = getMapActionButtonsRuntime({});

        expect(() => runtime.dateNow()).toThrow(
            "mapActionButtonsRuntime requires dateNow"
        );
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapActionButtonsRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapActionButtonsRuntime requires clearTimeout"
        );
        expect(() => runtime.getDocument()).toThrow(
            "mapActionButtonsRuntime requires document"
        );
        expect(() => runtime.createMutationObserver(() => undefined)).toThrow(
            "mapActionButtonsRuntime requires MutationObserver"
        );
        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
    });

    it("ignores legacy direct timer and clock scope properties", () => {
        expect.assertions(8);

        const dateNow = vi.fn<() => number>(() => 123);

        const runtime = getMapActionButtonsRuntime({
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            dateNow,
            document,
            HTMLElement,
            KeyboardEvent,
            MutationObserver,
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as MapActionButtonsRuntimeScope);

        expect(() => runtime.dateNow()).toThrow(
            "mapActionButtonsRuntime requires dateNow"
        );
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapActionButtonsRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapActionButtonsRuntime requires clearTimeout"
        );
        expect(() => runtime.getDocument()).toThrow(
            "mapActionButtonsRuntime requires document"
        );
        expect(() => runtime.createMutationObserver(() => undefined)).toThrow(
            "mapActionButtonsRuntime requires MutationObserver"
        );
        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
        expect(dateNow).not.toHaveBeenCalled();
    });
});
