import { describe, expect, it, vi } from "vitest";

import { getHRZoneControlsRuntime } from "../../../../../electron-app/utils/ui/controls/createHRZoneControlsRuntime.js";

describe("getHRZoneControlsRuntime", () => {
    it("creates DOM elements and queries through the injected document", () => {
        expect.assertions(4);

        const runtime = getHRZoneControlsRuntime({ document });
        const section = runtime.createElement("div");
        section.id = "hr-zone-controls";
        document.body.append(section);

        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.querySelector("#hr-zone-controls")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        expect(runtime.isHTMLElement(document.createTextNode("hr"))).toBe(
            false
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getHRZoneControlsRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("reads and writes through the injected storage runtime", () => {
        expect.assertions(3);

        const storage = new Map<string, string>();
        const runtime = getHRZoneControlsRuntime({
            document,
            localStorage: {
                getItem: vi.fn((key: string) => storage.get(key) ?? null),
                setItem: vi.fn((key: string, value: string) => {
                    storage.set(key, value);
                }),
            },
        });

        expect(runtime.getStorageItem("hr-zone-controls-collapsed")).toBeNull();
        runtime.setStorageItem("hr-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("hr-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(storage.get("hr-zone-controls-collapsed")).toBe("true");
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(6);

        const runtime = getHRZoneControlsRuntime({});
        const runtimeWithoutAbortController = getHRZoneControlsRuntime({
            document: { defaultView: undefined } as Document,
        });
        const runtimeWithoutStorage = getHRZoneControlsRuntime({
            document: { defaultView: undefined } as Document,
        });
        const runtimeWithInvalidAbortController = getHRZoneControlsRuntime({
            AbortController:
                "AbortController" as unknown as typeof AbortController,
            document,
        });
        const runtimeWithInvalidHTMLElement = getHRZoneControlsRuntime({
            document,
            HTMLElement: "HTMLElement" as unknown as typeof HTMLElement,
        });
        const runtimeWithInvalidStorage = getHRZoneControlsRuntime({
            document,
            localStorage: "localStorage" as unknown as Storage,
        });

        expect(() => runtime.createElement("div")).toThrow(
            "createHRZoneControls requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow("createHRZoneControls requires an AbortController runtime");
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow("createHRZoneControls requires an AbortController runtime");
        expect(() => runtimeWithInvalidHTMLElement.isHTMLElement({})).toThrow(
            "createHRZoneControls requires an HTMLElement runtime"
        );
        expect(() =>
            runtimeWithInvalidStorage.getStorageItem(
                "hr-zone-controls-collapsed"
            )
        ).toThrow("createHRZoneControls requires a localStorage runtime");
        expect(() =>
            runtimeWithoutStorage.getStorageItem("hr-zone-controls-collapsed")
        ).toThrow("createHRZoneControls requires a localStorage runtime");
    });
});
