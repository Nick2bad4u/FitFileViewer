/**
 * DOM helper utilities used across renderer code to reduce repeated null checks
 * and implicit element property access.
 */

import {
    getDomHelpersRuntime,
    type DomHelpersRuntime,
} from "./domHelpersRuntime.js";

type CheckedElement = HTMLElement & { checked: boolean };
type DisabledElement = HTMLElement & { disabled: boolean };
type ValueElement = HTMLElement & { value: string };

const ELEMENT_NODE = 1;

/**
 * Add a class to an element if present.
 *
 * @throws Error if className is empty.
 */
export function addClass(el: unknown, className: string): void {
    if (!className) {
        throw new Error(
            "Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty."
        );
    }
    if (isHTMLElement(el)) {
        el.classList.add(className);
    }
}

/** Remove all children from an element. */
export function clearElement(el: unknown): void {
    if (isHTMLElement(el)) {
        while (el.firstChild) {
            el.firstChild.remove();
        }
    }
}

/** Focus an element if possible. */
export function focus(el: unknown): void {
    if (isHTMLElement(el) && typeof el.focus === "function") {
        el.focus();
    }
}

/** Get checked state for checkbox/radio-like elements if supported. */
export function getChecked(el: unknown): boolean | undefined {
    if (isHTMLElement(el) && hasCheckedProperty(el)) {
        return Boolean(el.checked);
    }
    return undefined;
}

/** Dataset convenience getter. */
export function getData(el: unknown, key: string): string | undefined {
    if (isHTMLElement(el) && el.dataset) {
        return el.dataset[key];
    }
    return undefined;
}

/** Get value for input-like elements if supported. */
export function getValue(el: unknown): string | undefined {
    if (isHTMLElement(el) && hasValueProperty(el)) {
        return String(el.value);
    }
    return undefined;
}

/** Type guard for element-like DOM nodes used by this legacy renderer. */
export function isHTMLElement(el: unknown): el is HTMLElement {
    if (!el || typeof el !== "object") {
        return false;
    }
    return "nodeType" in el && el.nodeType === ELEMENT_NODE;
}

/**
 * Attach an event listener when the target is element-like.
 *
 * @returns Cleanup callback that removes the listener by aborting its signal.
 */
export function on(
    el: unknown,
    type: string,
    handler: (ev: Event) => void,
    runtime: DomHelpersRuntime = getDomHelpersRuntime()
): (() => void) | undefined {
    if (isHTMLElement(el)) {
        const controller = runtime.createAbortController();
        el.addEventListener(type, handler, { signal: controller.signal });
        return () => {
            controller.abort();
        };
    }
    return undefined;
}

/**
 * Query a single element, returning a narrowed HTMLElement or null.
 *
 * @throws Error if selector is empty.
 */
export function query(
    selector: string,
    root?: ParentNode,
    runtime: DomHelpersRuntime = getDomHelpersRuntime()
): HTMLElement | null {
    if (typeof selector !== "string" || selector.length === 0) {
        // Match native behavior: throw on empty/invalid selector input.
        throw new Error(
            'Failed to execute "querySelector" on "Document": The provided selector is empty.'
        );
    }
    const queryRoot = root ?? runtime.getDocument();
    const el = queryRoot.querySelector(selector);
    return isHTMLElement(el) ? el : null;
}

/**
 * Query all matching elements and filter to element-like DOM nodes.
 *
 * @throws Error if selector is empty.
 */
export function queryAll(
    selector: string,
    root?: ParentNode,
    runtime: DomHelpersRuntime = getDomHelpersRuntime()
): HTMLElement[] {
    if (typeof selector !== "string" || selector.length === 0) {
        // Match native behavior and test expectation to throw on invalid selectors.
        throw new Error(
            'Failed to execute "querySelectorAll" on "Document": The provided selector is empty.'
        );
    }

    const queryRoot = root ?? runtime.getDocument();
    const list = queryAllSafely(queryRoot, selector);
    if (!list) {
        return [];
    }

    try {
        return Array.from(list).filter((element): element is HTMLElement =>
            isHTMLElement(element)
        );
    } catch {
        const result: HTMLElement[] = [];
        const length = readArrayLikeLength(list);
        for (let i = 0; i < length; i++) {
            const el = list[i];
            if (isHTMLElement(el)) {
                result.push(el);
            }
        }
        return result;
    }
}

/**
 * Remove a class from an element if present.
 *
 * @throws Error if className is empty.
 */
export function removeClass(el: unknown, className: string): void {
    if (!className) {
        throw new Error(
            "Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty."
        );
    }
    if (isHTMLElement(el)) {
        el.classList.remove(className);
    }
}

/**
 * Assert a required element exists and return it as HTMLElement.
 *
 * @throws Error if selector is empty or no element matches.
 */
export function requireElement(
    selector: string,
    root?: ParentNode,
    runtime: DomHelpersRuntime = getDomHelpersRuntime()
): HTMLElement {
    const el = query(selector, root, runtime);
    if (!el) {
        throw new Error(`Required element not found: ${selector}`);
    }
    return el;
}

/** Set checked state for checkbox/radio-like elements if supported. */
export function setChecked(el: unknown, checked: unknown): void {
    if (isHTMLElement(el) && hasCheckedProperty(el)) {
        el.checked = Boolean(checked);
    }
}

/** Dataset convenience setter. */
export function setData(el: unknown, key: string, value: unknown): void {
    if (isHTMLElement(el) && el.dataset) {
        el.dataset[key] = String(value);
    }
}

/** Toggle disabled flag for form controls that support it. */
export function setDisabled(el: unknown, disabled: unknown): void {
    if (isHTMLElement(el) && hasDisabledProperty(el)) {
        el.disabled = Boolean(disabled);
    }
}

/** Apply a style property if possible. */
export function setStyle(el: unknown, prop: string, value: unknown): void {
    if (
        isHTMLElement(el) &&
        el.style &&
        typeof el.style.setProperty === "function"
    ) {
        el.style.setProperty(prop, String(value));
    }
}

/** Safely set textContent on an element if it exists. */
export function setText(
    el: unknown,
    value: string | number | null | undefined
): void {
    if (isHTMLElement(el) && value != null) {
        el.textContent = String(value);
    }
}

/** Set value for input-like elements if possible. */
export function setValue(
    el: unknown,
    value: string | number | null | undefined
): void {
    if (isHTMLElement(el) && hasValueProperty(el) && value != null) {
        el.value = String(value);
    }
}

function hasCheckedProperty(el: HTMLElement): el is CheckedElement {
    return "checked" in el;
}

function hasDisabledProperty(el: HTMLElement): el is DisabledElement {
    return "disabled" in el;
}

function hasValueProperty(el: HTMLElement): el is ValueElement {
    return "value" in el;
}

function queryAllSafely(
    root: ParentNode,
    selector: string
): NodeListOf<Element> | ArrayLike<Element> | undefined {
    try {
        if (typeof root.querySelectorAll === "function") {
            return root.querySelectorAll(selector);
        }
    } catch {
        // If a mocked implementation throws, return empty list for safety.
    }
    return undefined;
}

function readArrayLikeLength(list: ArrayLike<Element>): number {
    const length = list.length;
    return typeof length === "number" ? length : 0;
}
