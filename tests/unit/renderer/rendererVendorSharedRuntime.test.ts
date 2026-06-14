import { describe, expect, it } from "vitest";

import { getRendererVendorSharedRuntime } from "../../../electron-app/renderer/rendererVendorSharedRuntime.js";

describe("rendererVendorSharedRuntime", () => {
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
                CustomEvent,
                eventTarget,
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
                CustomEvent: undefined,
                eventTarget: new EventTarget(),
            }).dispatchRendererVendorEntryLoadedEvent("vendor-ready", {})
        ).toBe(false);
        expect(
            getRendererVendorSharedRuntime({
                CustomEvent,
                eventTarget: undefined,
            }).dispatchRendererVendorEntryLoadedEvent("vendor-ready", {})
        ).toBe(false);
    });
});
