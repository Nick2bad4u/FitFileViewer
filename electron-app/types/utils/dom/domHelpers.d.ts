/** DOM helper utilities used by renderer code. */
export function addClass(el: unknown, className: string): void;

/** Remove all children from an element when it is element-like. */
export function clearElement(el: unknown): void;

/** Focus an element when it supports focus. */
export function focus(el: unknown): void;

/** Read checked state from checkbox/radio-like elements. */
export function getChecked(el: unknown): boolean | undefined;

/** Read a dataset value from an element. */
export function getData(el: unknown, key: string): string | undefined;

/** Read value from input-like elements. */
export function getValue(el: unknown): string | undefined;

/** Type guard for element-like DOM nodes used by the legacy renderer. */
export function isHTMLElement(el: unknown): el is HTMLElement;

/** Attach an event listener and return a cleanup callback when possible. */
export function on(
    el: unknown,
    type: string,
    handler: (ev: Event) => void
): (() => void) | undefined;

/** Query one element and narrow it to `HTMLElement`. */
export function query(selector: string, root?: ParentNode): HTMLElement | null;

/** Query all matching elements and narrow them to `HTMLElement` values. */
export function queryAll(selector: string, root?: ParentNode): HTMLElement[];

/** Remove a class from an element when it is element-like. */
export function removeClass(el: unknown, className: string): void;

/** Query a required element or throw a descriptive error. */
export function requireElement(
    selector: string,
    root?: ParentNode
): HTMLElement;

/** Set checked state for checkbox/radio-like elements. */
export function setChecked(el: unknown, checked: unknown): void;

/** Set a dataset value on an element. */
export function setData(el: unknown, key: string, value: unknown): void;

/** Set disabled state for controls that expose a disabled property. */
export function setDisabled(el: unknown, disabled: unknown): void;

/** Set a CSS property on an element when possible. */
export function setStyle(el: unknown, prop: string, value: unknown): void;

/** Safely set text content on an element. */
export function setText(
    el: unknown,
    value: string | number | null | undefined
): void;

/** Set value for input-like elements when possible. */
export function setValue(
    el: unknown,
    value: string | number | null | undefined
): void;

/** Legacy element alias retained for declaration compatibility. */
export type AnyElement<T extends Element> = T & Record<string, unknown>;

/** Grouped DOM helper exports. */
declare const domHelpers: {
    addClass: typeof addClass;
    clearElement: typeof clearElement;
    focus: typeof focus;
    getChecked: typeof getChecked;
    getData: typeof getData;
    getValue: typeof getValue;
    isHTMLElement: typeof isHTMLElement;
    on: typeof on;
    query: typeof query;
    queryAll: typeof queryAll;
    removeClass: typeof removeClass;
    requireElement: typeof requireElement;
    setChecked: typeof setChecked;
    setData: typeof setData;
    setDisabled: typeof setDisabled;
    setStyle: typeof setStyle;
    setText: typeof setText;
    setValue: typeof setValue;
};

export default domHelpers;
