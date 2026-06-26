import { describe, expect, it, vi } from "vitest";

import { getOpenPowerEstimationSettingsModalRuntime } from "../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModalRuntime.js";
import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";

describe("getOpenPowerEstimationSettingsModalRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getOpenPowerEstimationSettingsModalRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production document defaults", () => {
        expect.assertions(4);

        const runtime = getOpenPowerEstimationSettingsModalRuntime();
        const overlay = runtime.createElement("div");
        overlay.className = "power-estimation-settings-overlay";

        try {
            runtime.appendToBody(overlay);

            expect(overlay).toBeInstanceOf(HTMLDivElement);
            expect(runtime.bodyContains(overlay)).toBe(true);
            expect(overlay.parentElement).toBe(document.body);
            expect(document.body.lastElementChild).toBe(overlay);
        } finally {
            overlay.remove();
        }
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(5);

        const runtime = getOpenPowerEstimationSettingsModalRuntime({});
        const element = document.createElement("div");

        expect(() => runtime.createAbortController()).toThrow(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
        );
        expect(() => runtime.appendToBody(element)).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
        expect(() => runtime.bodyContains(element)).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
    });

    it("registers document keydown listeners through the injected event target", () => {
        expect.assertions(3);

        let keydownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("derives document keydown listeners from the scoped document provider", () => {
        expect.assertions(3);

        let keydownCount = 0;
        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new KeyboardEvent("keydown"));

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(keydownCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("routes all defaults through provider functions", () => {
        expect.assertions(9);

        let keydownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor
        );
        const getDocument = vi.fn(() => documentEventTarget);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            getAbortController,
            getDocument,
            getDocumentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));
        const overlay = runtime.createElement("div");
        overlay.className = "power-estimation-settings-overlay";
        runtime.appendToBody(overlay);

        expect(runtime.createAbortController()).toBe(controller);
        expect(runtime.bodyContains(overlay)).toBe(true);
        expect(documentEventTarget.body.firstElementChild).toBe(overlay);
        expect(overlay).toBeInstanceOf(HTMLDivElement);
        expect(getDocument).toHaveBeenCalledTimes(3);
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(keydownCount).toBe(1);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(9);

        const AbortControllerConstructor = vi.fn();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const createElement = vi.spyOn(documentEventTarget, "createElement");
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            AbortController:
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            documentEventTarget,
        } as unknown as Parameters<
            typeof getOpenPowerEstimationSettingsModalRuntime
        >[0]);
        const element = document.createElement("div");

        expect(() => runtime.createAbortController()).toThrow(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
        );
        expect(() => runtime.appendToBody(element)).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
        expect(() => runtime.bodyContains(element)).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });
});
