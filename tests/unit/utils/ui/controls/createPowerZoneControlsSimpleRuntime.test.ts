import { describe, expect, it, vi } from "vitest";

import { getPowerZoneControlsSimpleRuntime } from "../../../../../electron-app/utils/ui/controls/createPowerZoneControlsSimpleRuntime.js";

describe("getPowerZoneControlsSimpleRuntime", () => {
    it("creates DOM elements and queries through the injected document", () => {
        expect.assertions(4);

        const runtime = getPowerZoneControlsSimpleRuntime({ document });
        const section = runtime.createElement("div");
        section.id = "power-zone-controls";
        document.body.append(section);

        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.querySelector("#power-zone-controls")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        expect(runtime.isHTMLElement(document.createTextNode("power"))).toBe(
            false
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getPowerZoneControlsSimpleRuntime({
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
        const runtime = getPowerZoneControlsSimpleRuntime({
            document,
            localStorage: {
                getItem: vi.fn((key: string) => storage.get(key) ?? null),
                setItem: vi.fn((key: string, value: string) => {
                    storage.set(key, value);
                }),
            },
        });

        expect(
            runtime.getStorageItem("power-zone-controls-collapsed")
        ).toBeNull();
        runtime.setStorageItem("power-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("power-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(storage.get("power-zone-controls-collapsed")).toBe("true");
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(6);

        const runtime = getPowerZoneControlsSimpleRuntime({});
        const runtimeWithoutAbortController = getPowerZoneControlsSimpleRuntime(
            {
                document: { defaultView: undefined } as Document,
            }
        );
        const runtimeWithoutStorage = getPowerZoneControlsSimpleRuntime({
            document: { defaultView: undefined } as Document,
        });
        const runtimeWithInvalidAbortController =
            getPowerZoneControlsSimpleRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });
        const runtimeWithInvalidHTMLElement = getPowerZoneControlsSimpleRuntime(
            {
                document,
                HTMLElement: "HTMLElement" as unknown as typeof HTMLElement,
            }
        );
        const runtimeWithInvalidStorage = getPowerZoneControlsSimpleRuntime({
            document,
            localStorage: "localStorage" as unknown as Storage,
        });

        expect(() => runtime.createElement("div")).toThrow(
            "createPowerZoneControlsSimple requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "createPowerZoneControlsSimple requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createPowerZoneControlsSimple requires an AbortController runtime"
        );
        expect(() => runtimeWithInvalidHTMLElement.isHTMLElement({})).toThrow(
            "createPowerZoneControlsSimple requires an HTMLElement runtime"
        );
        expect(() =>
            runtimeWithInvalidStorage.getStorageItem(
                "power-zone-controls-collapsed"
            )
        ).toThrow(
            "createPowerZoneControlsSimple requires a localStorage runtime"
        );
        expect(() =>
            runtimeWithoutStorage.getStorageItem(
                "power-zone-controls-collapsed"
            )
        ).toThrow(
            "createPowerZoneControlsSimple requires a localStorage runtime"
        );
    });
});
