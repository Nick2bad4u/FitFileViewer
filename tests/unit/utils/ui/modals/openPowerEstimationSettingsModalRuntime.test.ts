import { describe, expect, it, vi } from "vitest";

import { getOpenPowerEstimationSettingsModalRuntime } from "../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModalRuntime.js";

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
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(2);

        const runtime = getOpenPowerEstimationSettingsModalRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
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

    it("routes all defaults through provider functions", () => {
        expect.assertions(5);

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
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            getAbortController,
            getDocumentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));

        expect(runtime.createAbortController()).toBe(controller);
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(keydownCount).toBe(1);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(4);

        const AbortControllerConstructor = vi.fn();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            documentEventTarget,
        } as unknown as Parameters<
            typeof getOpenPowerEstimationSettingsModalRuntime
        >[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
    });
});
