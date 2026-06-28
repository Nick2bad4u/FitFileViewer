import { describe, expect, it, vi } from "vitest";

import {
    getRendererVendorSharedRuntime,
    type RendererVendorSharedRuntimeScope,
} from "../../../electron-app/renderer/rendererVendorSharedRuntime.js";

describe("rendererVendorSharedRuntime", () => {
    it("dispatches renderer vendor readiness events through renderer browser runtime providers", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const receivedDetails: unknown[] = [];
        globalThis.addEventListener(
            "vendor-ready",
            (event) => {
                if (event instanceof CustomEvent) {
                    receivedDetails.push(event.detail);
                }
            },
            { signal: controller.signal }
        );
        const { dispatchRendererVendorEntryLoadedEvent } =
            getRendererVendorSharedRuntime();
        const detail = { entryName: "core" };

        expect(
            dispatchRendererVendorEntryLoadedEvent("vendor-ready", detail)
        ).toBe(true);
        controller.abort();
        expect(receivedDetails).toStrictEqual([detail]);
    });

    it("dispatches renderer vendor readiness events through the injected target", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const eventTarget = new EventTarget();
        const receivedDetails: unknown[] = [];
        eventTarget.addEventListener(
            "vendor-ready",
            (event) => {
                if (event instanceof CustomEvent) {
                    receivedDetails.push(event.detail);
                }
            },
            { signal: controller.signal }
        );
        const { dispatchRendererVendorEntryLoadedEvent } =
            getRendererVendorSharedRuntime({
                getCustomEvent: () => CustomEvent,
                getEventTarget: () => eventTarget,
            });
        const detail = { entryName: "core" };

        expect(
            dispatchRendererVendorEntryLoadedEvent("vendor-ready", detail)
        ).toBe(true);
        controller.abort();
        expect(receivedDetails).toStrictEqual([detail]);
    });

    it("returns false when event dispatch primitives are unavailable", () => {
        expect.assertions(2);

        expect(
            getRendererVendorSharedRuntime({
                getCustomEvent: () => undefined,
                getEventTarget: () => new EventTarget(),
            }).dispatchRendererVendorEntryLoadedEvent("vendor-ready", {})
        ).toBe(false);
        expect(
            getRendererVendorSharedRuntime({
                getCustomEvent: () => CustomEvent,
                getEventTarget: () => undefined,
            }).dispatchRendererVendorEntryLoadedEvent("vendor-ready", {})
        ).toBe(false);
    });

    it("rejects legacy direct CustomEvent and event target scope properties", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        const dispatchEvent = vi.spyOn(eventTarget, "dispatchEvent");

        expect(() =>
            getRendererVendorSharedRuntime({
                CustomEvent,
                eventTarget,
            } as unknown as RendererVendorSharedRuntimeScope)
        ).toThrow(
            "rendererVendorSharedRuntime requires a CustomEvent provider"
        );
        expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it("fails clearly when browser runtime providers are omitted", () => {
        expect.assertions(2);

        expect(() =>
            getRendererVendorSharedRuntime(
                {} as unknown as RendererVendorSharedRuntimeScope
            )
        ).toThrow(
            "rendererVendorSharedRuntime requires a CustomEvent provider"
        );

        expect(() =>
            getRendererVendorSharedRuntime({
                getCustomEvent: () => CustomEvent,
            } as unknown as RendererVendorSharedRuntimeScope)
        ).toThrow(
            "rendererVendorSharedRuntime requires an event target provider"
        );
    });
});
