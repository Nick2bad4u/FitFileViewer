/**
 * DOM Helper utilities
 * Centralized, typed query & assertion helpers used across renderer code to
 * reduce repeated null checks and implicit any / Element property errors.
 *
 * These are JSDoc-annotated so TypeScript (checkJs) can narrow results.
 */
/** @template {Element} T
 *  @typedef {T & { [key:string]: any }} AnyElement */
/**
 * Add a class to an element if present.
 * @param {Element|null|undefined} el
 * @param {string} className
 * @throws {Error} If className is empty
 */
export function addClass(el: Element | null | undefined, className: string): void;
/**
 * Remove all children from an element (no-op if invalid).
 * @param {Element|null|undefined} el
 */
export function clearElement(el: Element | null | undefined): void;
/**
 * Focus an element if possible.
 * @param {Element|null|undefined} el
 */
export function focus(el: Element | null | undefined): void;
/**
 * Get checked state for checkbox/radio if supported.
 * @param {Element|null|undefined} el
 * @returns {boolean|undefined}
 */
export function getChecked(el: Element | null | undefined): boolean | undefined;
/**
 * Dataset convenience getter.
 * @param {Element|null|undefined} el
 * @param {string} key
 * @returns {string|undefined}
 */
export function getData(el: Element | null | undefined, key: string): string | undefined;
/**
 * Get value for input-like elements (returns undefined if unavailable).
 * @param {Element|null|undefined} el
 * @returns {string|undefined}
 */
export function getValue(el: Element | null | undefined): string | undefined;
/**
 * Type guard to assert a value is an HTMLElement (vs generic Element or null).
 * @param {any} el
 * @returns {el is HTMLElement}
 */
export function isHTMLElement(el: any): el is HTMLElement;
/**
 * Attach an event listener with automatic type narrowing and safe guard.
 * @param {Element|null|undefined} el
 * @param {string} type
 * @param {(ev: Event) => void} handler
 */
export function on(el: Element | null | undefined, type: string, handler: (ev: Event) => void): void;
/**
 * Query a single element, returning a narrowed HTMLElement or null.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement|null}
 */
export function query(selector: string, root?: ParentNode): HTMLElement | null;
/**
 * Query all matching elements as an array of HTMLElements (filters out non-HTMLElements).
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement[]}
 */
export function queryAll(selector: string, root?: ParentNode): HTMLElement[];
/**
 * Remove a class from an element if present.
 * @param {Element|null|undefined} el
 * @param {string} className
 * @throws {Error} If className is empty
 */
export function removeClass(el: Element | null | undefined, className: string): void;
/**
 * Assert a required element exists and return it as HTMLElement.
 * Throws a descriptive error if not found.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement}
 */
export function requireElement(selector: string, root?: ParentNode): HTMLElement;
/**
 * Set checked state for checkbox/radio if supported.
 * @param {Element|null|undefined} el
 * @param {boolean} checked
 */
export function setChecked(el: Element | null | undefined, checked: boolean): void;
/**
 * Dataset convenience setter.
 * @param {Element|null|undefined} el
 * @param {string} key
 * @param {string} value
 */
export function setData(el: Element | null | undefined, key: string, value: string): void;
/**
 * Toggle disabled flag for form controls (HTMLElement subset supporting disabled).
 * Silent no-op if element does not support the property.
 * @param {Element|null|undefined} el
 * @param {boolean} disabled
 */
export function setDisabled(el: Element | null | undefined, disabled: boolean): void;
/**
 * Apply a style property if possible.
 * @param {Element|null|undefined} el
 * @param {string} prop
 * @param {string} value
 */
export function setStyle(el: Element | null | undefined, prop: string, value: string): void;
/**
 * Safely set textContent on an element if it exists.
 * @param {Element|null|undefined} el
 * @param {string|number|null|undefined} value
 */
export function setText(el: Element | null | undefined, value: string | number | null | undefined): void;
/**
 * Set value for input-like elements if possible.
 * @param {Element|null|undefined} el
 * @param {string|number|null|undefined} value
 */
export function setValue(el: Element | null | undefined, value: string | number | null | undefined): void;
declare namespace _default {
    export { addClass };
    export { clearElement };
    export { focus };
    export { getChecked };
    export { getData };
    export { getValue };
    export { isHTMLElement };
    export { on };
    export { query };
    export { queryAll };
    export { removeClass };
    export { requireElement };
    export { setChecked };
    export { setData };
    export { setDisabled };
    export { setStyle };
    export { setText };
    export { setValue };
}
export default _default;
export type AnyElement<T extends Element> = T & {
    [key: string]: any;
};
//# sourceMappingURL=domHelpers.d.ts.map