import { describe, expect, it, vi } from "vitest";

import type { CreateFieldTogglesSectionRuntimeScope } from "../../../../../electron-app/utils/ui/components/createFieldTogglesSectionRuntime.js";
import { getCreateFieldTogglesSectionRuntime } from "../../../../../electron-app/utils/ui/components/createFieldTogglesSectionRuntime.js";

describe("getCreateFieldTogglesSectionRuntime", () => {
    it("creates elements and queries field checkbox toggles through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateFieldTogglesSectionRuntime({
            getDocument: () => document,
        });
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
            getCustomEvent: () => CustomEvent,
            getDispatchEvent: () => dispatchEvent,
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
            getAbortController: () => AbortController,
            getHTMLInputElement: () => HTMLInputElement,
        });
        const controller = runtime.createAbortController();
        const input = document.createElement("input");

        expect(controller.signal.aborted).toBe(false);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreateFieldTogglesSectionRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(
            AbortController
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
            getClearTimeout: () => clearTimeoutMock,
            getSetTimeout: () => setTimeoutMock,
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
        const runtimeWithInvalidAbortController =
            getCreateFieldTogglesSectionRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as typeof AbortController,
            });
        const runtimeWithInvalidCustomEvent =
            getCreateFieldTogglesSectionRuntime({
                getCustomEvent: () =>
                    "CustomEvent" as unknown as typeof CustomEvent,
            });
        const runtimeWithInvalidInputElement =
            getCreateFieldTogglesSectionRuntime({
                getHTMLInputElement: () =>
                    "HTMLInputElement" as unknown as typeof HTMLInputElement,
            });

        expect(() => runtime.createElement("div")).toThrow(
            "createFieldTogglesSection requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createFieldTogglesSection requires an AbortController runtime"
        );
        expect(() => runtime.createCustomEvent("event")).toThrow(
            "createFieldTogglesSection requires a CustomEvent runtime"
        );
        expect(() => runtime.dispatchEvent(new Event("x"))).toThrow(
            "createFieldTogglesSection requires a dispatchEvent runtime"
        );
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

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(7);

        const timer = Symbol("field-toggle-timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const legacyScope = {
            AbortController,
            clearTimeout: vi.fn<typeof clearTimeout>(),
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            document,
            HTMLInputElement,
            setTimeout: vi.fn<typeof setTimeout>(() => timer),
        } as unknown as CreateFieldTogglesSectionRuntimeScope;
        const runtime = getCreateFieldTogglesSectionRuntime(legacyScope);

        expect(() => runtime.createElement("div")).toThrow(
            "createFieldTogglesSection requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createFieldTogglesSection requires an AbortController runtime"
        );
        expect(() => runtime.createCustomEvent("event")).toThrow(
            "createFieldTogglesSection requires a CustomEvent runtime"
        );
        expect(() => runtime.dispatchEvent(new Event("x"))).toThrow(
            "createFieldTogglesSection requires a dispatchEvent runtime"
        );
        expect(() =>
            runtime.isHTMLInputElement(document.createElement("input"))
        ).toThrow(
            "createFieldTogglesSection requires an HTMLInputElement runtime"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "createFieldTogglesSection requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "createFieldTogglesSection requires a clearTimeout runtime"
        );
    });
});
