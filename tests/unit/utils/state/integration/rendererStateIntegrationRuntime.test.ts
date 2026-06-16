// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { getRendererStateIntegrationRuntime } from "../../../../../electron-app/utils/state/integration/rendererStateIntegrationRuntime.js";

describe("getRendererStateIntegrationRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 79 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getRendererStateIntegrationRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient browser primitives for explicit scopes", () => {
        expect.assertions(3);

        const utils = getRendererStateIntegrationRuntime({});

        expect(() => utils.setTimeout(() => {}, 0)).toThrow(
            "rendererStateIntegration requires a setTimeout runtime"
        );
        expect(() => {
            utils.clearTimeout(79 as ReturnType<typeof globalThis.setTimeout>);
        }).toThrow("rendererStateIntegration requires a clearTimeout runtime");
        expect(() =>
            utils.addDocumentClickListener(() => undefined, {})
        ).toThrow(
            "rendererStateIntegration requires a document event-target runtime"
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const utils = getRendererStateIntegrationRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(utils.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererStateIntegrationRuntime({});

        expect(() => utils.createAbortController()).toThrow(
            "rendererStateIntegration requires an AbortController runtime"
        );
    });

    it("registers document click listeners through the injected event target", () => {
        expect.assertions(3);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        let clickCount = 0;
        const listener = () => {
            clickCount += 1;
        };
        const utils = getRendererStateIntegrationRuntime({
            documentEventTarget,
        });

        utils.addDocumentClickListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new MouseEvent("click"));

        expect(addEventListener).toHaveBeenCalledWith("click", listener, {
            signal: controller.signal,
        });
        expect(clickCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("routes document click listeners through provider functions", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        let clickCount = 0;
        const utils = getRendererStateIntegrationRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        utils.addDocumentClickListener(
            () => {
                clickCount += 1;
            },
            { signal: controller.signal }
        );
        documentEventTarget.dispatchEvent(new MouseEvent("click"));

        expect(clickCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(8);

        const callback = vi.fn<() => void>();
        let clickCount = 0;
        const delayMs = Number("5000");
        const timer = 79 as ReturnType<typeof globalThis.setTimeout>;
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const utils = getRendererStateIntegrationRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(utils.createAbortController()).toBe(controller);
        utils.addDocumentClickListener(
            () => {
                clickCount += 1;
            },
            { signal: controller.signal }
        );
        document.dispatchEvent(new MouseEvent("click"));
        expect(utils.setTimeout(callback, delayMs)).toBe(timer);
        utils.clearTimeout(timer);

        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(clickCount).toBe(1);
        expect(document.body.childElementCount).toBe(0);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });
});
