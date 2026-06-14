import { describe, expect, it, vi } from "vitest";

import { getCreateFieldTogglesSectionRuntime } from "../../../../../electron-app/utils/ui/components/createFieldTogglesSectionRuntime.js";

describe("getCreateFieldTogglesSectionRuntime", () => {
    it("creates elements and queries field checkbox toggles through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateFieldTogglesSectionRuntime({ document });
        const fieldToggle = runtime.createElement("div");
        const checkbox = runtime.createElement("input");
        checkbox.type = "checkbox";
        fieldToggle.className = "field-toggle";
        fieldToggle.append(checkbox);
        document.body.append(fieldToggle);

        const toggles = runtime.queryFieldCheckboxToggles();

        expect(fieldToggle).toBeInstanceOf(HTMLDivElement);
        expect(toggles).toHaveLength(1);
        expect(toggles[0]).toBe(checkbox);

        document.body.replaceChildren();
    });

    it("creates custom events and dispatches through the injected event target", () => {
        expect.assertions(3);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getCreateFieldTogglesSectionRuntime({
            CustomEvent,
            dispatchEvent,
            document,
        });
        const event = runtime.createCustomEvent("fieldToggleChanged", {
            detail: { field: "power" },
        });

        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(event.detail).toStrictEqual({ field: "power" });
    });

    it("creates abort controllers and checks input elements through injected runtimes", () => {
        expect.assertions(3);

        const runtime = getCreateFieldTogglesSectionRuntime({
            AbortController,
            HTMLInputElement,
            document,
        });
        const controller = runtime.createAbortController();
        const input = document.createElement("input");

        expect(controller.signal.aborted).toBe(false);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const timer = Symbol("timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const timeoutMs = Number("100");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
        const runtime = getCreateFieldTogglesSectionRuntime({
            clearTimeout: clearTimeoutMock,
            document,
            setTimeout: setTimeoutMock,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getCreateFieldTogglesSectionRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "createFieldTogglesSection requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "createFieldTogglesSection requires a clearTimeout runtime"
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(7);

        const runtime = getCreateFieldTogglesSectionRuntime({});
        const runtimeWithoutDocumentWindowConstructors =
            getCreateFieldTogglesSectionRuntime({
                document: {
                    createElement: document.createElement.bind(document),
                    querySelectorAll: document.querySelectorAll.bind(document),
                } as Document,
            });
        const runtimeWithInvalidAbortController =
            getCreateFieldTogglesSectionRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });
        const runtimeWithInvalidCustomEvent =
            getCreateFieldTogglesSectionRuntime({
                CustomEvent: "CustomEvent" as unknown as typeof CustomEvent,
                document,
            });
        const runtimeWithInvalidInputElement =
            getCreateFieldTogglesSectionRuntime({
                HTMLInputElement:
                    "HTMLInputElement" as unknown as typeof HTMLInputElement,
                document,
            });

        expect(() => runtime.createElement("div")).toThrow(
            "createFieldTogglesSection requires a document runtime"
        );
        expect(() =>
            runtimeWithoutDocumentWindowConstructors.createAbortController()
        ).toThrow(
            "createFieldTogglesSection requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithoutDocumentWindowConstructors.createCustomEvent("event")
        ).toThrow("createFieldTogglesSection requires a CustomEvent runtime");
        expect(() =>
            runtimeWithoutDocumentWindowConstructors.dispatchEvent(
                new Event("x")
            )
        ).toThrow("createFieldTogglesSection requires a dispatchEvent runtime");
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createFieldTogglesSection requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidCustomEvent.createCustomEvent("event")
        ).toThrow("createFieldTogglesSection requires a CustomEvent runtime");
        expect(() =>
            runtimeWithInvalidInputElement.isHTMLInputElement(
                document.createElement("input")
            )
        ).toThrow(
            "createFieldTogglesSection requires an HTMLInputElement runtime"
        );
    });
});
