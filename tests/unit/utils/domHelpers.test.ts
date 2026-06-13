// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    addClass,
    clearElement,
    focus,
    getChecked,
    getData,
    getValue,
    isHTMLElement,
    on,
    query,
    queryAll,
    removeClass,
    requireElement,
    setChecked,
    setData,
    setDisabled,
    setStyle,
    setText,
    setValue,
} from "../../../electron-app/utils/dom/index.js";

describe("dom helpers", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "test-container";
        document.body.append(container);
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("identifies element nodes without accepting other values", () => {
        expect.assertions(1);

        expect({
            documentNode: isHTMLElement(document),
            elementNode: isHTMLElement(document.createElement("div")),
            nullValue: isHTMLElement(null),
            textNode: isHTMLElement(document.createTextNode("text")),
            typedNodeLikeObject: isHTMLElement({ nodeType: 1 }),
        }).toStrictEqual({
            documentNode: false,
            elementNode: true,
            nullValue: false,
            textNode: false,
            typedNodeLikeObject: true,
        });
    });

    it("queries one or many matching elements within an optional root", () => {
        expect.assertions(3);

        const section = document.createElement("section"),
            primaryButton = document.createElement("button"),
            secondaryButton = document.createElement("button");
        primaryButton.className = "action";
        primaryButton.id = "primary";
        primaryButton.textContent = "Primary";
        secondaryButton.className = "action";
        secondaryButton.textContent = "Secondary";
        section.append(primaryButton, secondaryButton);
        container.append(section);

        expect(requireElement("#primary", container).textContent).toBe(
            "Primary"
        );
        expect(query(".missing", container)).toBeNull();
        expect({
            actionTexts: queryAll(".action", container).map(
                (element) => element.textContent
            ),
            missingCount: queryAll(".missing", container).length,
        }).toStrictEqual({
            actionTexts: ["Primary", "Secondary"],
            missingCount: 0,
        });
    });

    it("throws consistent errors for missing required elements and empty selectors", () => {
        expect.assertions(3);

        expect(() => query("")).toThrow(
            'Failed to execute "querySelector" on "Document": The provided selector is empty.'
        );
        expect(() => queryAll("")).toThrow(
            'Failed to execute "querySelectorAll" on "Document": The provided selector is empty.'
        );
        expect(() => requireElement(".missing", container)).toThrow(
            "Required element not found: .missing"
        );
    });

    it("returns required elements when present", () => {
        expect.assertions(1);

        const button = document.createElement("button");
        button.className = "save";
        container.append(button);

        expect(requireElement(".save", container)).toBe(button);
    });

    it("sets text, classes, styles, and datasets on element inputs", () => {
        expect.assertions(3);

        const element = document.createElement("div");
        container.append(element);

        setText(element, "Ready");
        addClass(element, "active");
        setStyle(element, "background-color", "red");
        setData(element, "activityId", 123);

        expect(element.textContent).toBe("Ready");
        expect({
            activityId: getData(element, "activityId"),
            classes: [...element.classList],
            style: element.style.backgroundColor,
        }).toStrictEqual({
            activityId: "123",
            classes: ["active"],
            style: "red",
        });

        removeClass(element, "active");
        clearElement(element);

        expect({
            childNodeCount: element.childNodes.length,
            classes: [...element.classList],
        }).toStrictEqual({
            childNodeCount: 0,
            classes: [],
        });
    });

    it("preserves existing text and value when nullable values are provided", () => {
        expect.assertions(2);

        const input = document.createElement("input");
        const label = document.createElement("span");
        input.value = "original";
        label.textContent = "Original";

        setValue(input, null);
        setValue(input, undefined);
        setText(label, null);
        setText(label, undefined);

        expect(input.value).toBe("original");
        expect(label.textContent).toBe("Original");
    });

    it("sets form value, checked, and disabled state when supported", () => {
        expect.assertions(3);

        const input = document.createElement("input");
        const checkbox = document.createElement("input");
        const button = document.createElement("button");
        checkbox.type = "checkbox";

        setValue(input, 42);
        setChecked(checkbox, "yes");
        setDisabled(button, 1);

        expect(getValue(input)).toBe("42");
        expect({
            buttonDisabled: button.disabled,
            checkboxChecked: getChecked(checkbox),
        }).toStrictEqual({
            buttonDisabled: true,
            checkboxChecked: true,
        });

        setChecked(checkbox, 0);
        setDisabled(button, "");

        expect({
            buttonDisabled: button.disabled,
            checkboxChecked: getChecked(checkbox),
        }).toStrictEqual({
            buttonDisabled: false,
            checkboxChecked: false,
        });
    });

    it("returns undefined for unsupported value, checked, and data reads", () => {
        expect.assertions(1);

        const div = document.createElement("div");

        expect({
            checked: getChecked(div),
            data: getData(null, "key"),
            value: getValue(div),
        }).toStrictEqual({
            checked: undefined,
            data: undefined,
            value: undefined,
        });
    });

    it("ignores invalid element inputs for mutating helpers", () => {
        expect.assertions(2);

        const bodyBefore = document.body.innerHTML;

        expect([
            clearElement(null),
            focus(null),
            removeClass(null, "missing"),
            setChecked(null, true),
            setData(null, "key", "value"),
            setDisabled(null, true),
            setStyle(null, "color", "red"),
            setText(null, "value"),
            setValue(null, "value"),
        ]).toStrictEqual([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        ]);
        expect(document.body.innerHTML).toBe(bodyBefore);
    });

    it("throws for empty class names before touching the element", () => {
        expect.assertions(3);

        const element = document.createElement("div");
        element.className = "stable";

        expect(() => addClass(element, "")).toThrow(
            "Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty."
        );
        expect(() => removeClass(element, "")).toThrow(
            "Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty."
        );
        expect(element.className).toBe("stable");
    });

    it("attaches event listeners and returns cleanup callbacks", () => {
        expect.assertions(2);

        const button = document.createElement("button");
        const handler = vi.fn<(event: Event) => void>();

        const cleanup = on(button, "click", handler);
        button.click();
        cleanup?.();
        button.click();

        expect(handler).toHaveBeenCalledOnce();
        const [event] = handler.mock.calls[0] ?? [];
        expect(event).toBeInstanceOf(MouseEvent);
    });

    it("resolves event listener cleanup controllers through the injected runtime", () => {
        expect.assertions(4);

        const button = document.createElement("button");
        const handler = vi.fn<(event: Event) => void>();
        const abortController = new AbortController();
        const abort = vi.fn(() => {
            abortController.abort();
        });
        const runtime = {
            createAbortController: vi.fn(() => ({
                abort,
                signal: abortController.signal,
            })),
        };

        const cleanup = on(button, "click", handler, runtime);
        cleanup?.();
        button.click();

        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(abort).toHaveBeenCalledOnce();
        expect(abortController.signal.aborted).toBe(true);
        expect(handler).not.toHaveBeenCalled();
    });

    it("returns undefined when attaching an event to invalid targets", () => {
        expect.assertions(2);

        const handler = vi.fn<(event: Event) => void>();

        expect(on(null, "click", handler)).toBeUndefined();
        expect(handler).not.toHaveBeenCalled();
    });

    it("focuses elements with a focus method and propagates focus failures", () => {
        expect.assertions(2);

        const input = document.createElement("input");
        container.append(input);
        focus(input);
        expect(document.activeElement).toBe(input);

        input.focus = () => {
            throw new Error("Focus failed");
        };

        expect(() => focus(input)).toThrow("Focus failed");
    });
});
