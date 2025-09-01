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
 * Type guard to assert a value is an HTMLElement (vs generic Element or null).
 * @param {any} el
 * @returns {el is HTMLElement}
 */
export function isHTMLElement(el) {
    return Boolean(el) && typeof el === "object" && el.nodeType === 1;
}

/**
 * Query a single element, returning a narrowed HTMLElement or null.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement|null}
 */
export function query(selector, root = document) {
    const el = root.querySelector(selector);
    return isHTMLElement(el) ? el : null;
}

/**
 * Query all matching elements as an array of HTMLElements (filters out non-HTMLElements).
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement[]}
 */
export function queryAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector)).filter(isHTMLElement);
}

/**
 * Assert a required element exists and return it as HTMLElement.
 * Throws a descriptive error if not found.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement}
 */
export function requireElement(selector, root = document) {
    const el = query(selector, root);
    if (!el) {
        throw new Error(`Required element not found: ${selector}`);
    }
    return el;
}

/**
 * Safely set textContent on an element if it exists.
 * @param {Element|null|undefined} el
 * @param {string|number|null|undefined} value
 */
export function setText(el, value) {
    if (isHTMLElement(el) && value != null) {
        el.textContent = String(value);
    }
}

/**
 * Add a class to an element if present.
 * @param {Element|null|undefined} el
 * @param {string} className
 */
export function addClass(el, className) {
    if (isHTMLElement(el)) {
        el.classList.add(className);
    }
}

/**
 * Remove a class from an element if present.
 * @param {Element|null|undefined} el
 * @param {string} className
 */
export function removeClass(el, className) {
    if (isHTMLElement(el)) {
        el.classList.remove(className);
    }
}

/**
 * Toggle disabled flag for form controls (HTMLElement subset supporting disabled).
 * Silent no-op if element does not support the property.
 * @param {Element|null|undefined} el
 * @param {boolean} disabled
 */
export function setDisabled(el, disabled) {
    if (isHTMLElement(el) && "disabled" in el) {
        // @ts-ignore - guarded by 'disabled' in el
        el.disabled = Boolean(disabled);
    }
}

/**
 * Get value for input-like elements (returns undefined if unavailable).
 * @param {Element|null|undefined} el
 * @returns {string|undefined}
 */
export function getValue(el) {
    if (isHTMLElement(el) && "value" in el) {
        // @ts-ignore - runtime guarded
        return el.value;
    }
    return undefined;
}

/**
 * Set value for input-like elements if possible.
 * @param {Element|null|undefined} el
 * @param {string|number|null|undefined} value
 */
export function setValue(el, value) {
    if (isHTMLElement(el) && "value" in el && value != null) {
        // @ts-ignore - runtime guarded
        el.value = String(value);
    }
}

/**
 * Set checked state for checkbox/radio if supported.
 * @param {Element|null|undefined} el
 * @param {boolean} checked
 */
export function setChecked(el, checked) {
    if (isHTMLElement(el) && "checked" in el) {
        // @ts-ignore - runtime guarded
        el.checked = Boolean(checked);
    }
}

/**
 * Get checked state for checkbox/radio if supported.
 * @param {Element|null|undefined} el
 * @returns {boolean|undefined}
 */
export function getChecked(el) {
    if (isHTMLElement(el) && "checked" in el) {
        // @ts-ignore - runtime guarded
        return Boolean(el.checked);
    }
    return undefined;
}

/**
 * Apply a style property if possible.
 * @param {Element|null|undefined} el
 * @param {string} prop
 * @param {string} value
 */
export function setStyle(el, prop, value) {
    if (isHTMLElement(el) && el.style && typeof el.style.setProperty === "function") {
        el.style.setProperty(prop, value);
    }
}

/**
 * Remove all children from an element (no-op if invalid).
 * @param {Element|null|undefined} el
 */
export function clearElement(el) {
    if (isHTMLElement(el)) {
        while (el.firstChild) {el.removeChild(el.firstChild);}
    }
}

/**
 * Attach an event listener with automatic type narrowing and safe guard.
 * @param {Element|null|undefined} el
 * @param {string} type
 * @param {(ev: Event) => void} handler
 */
export function on(el, type, handler) {
    if (isHTMLElement(el)) {
        el.addEventListener(type, handler);
    }
}

/**
 * Dataset convenience getter.
 * @param {Element|null|undefined} el
 * @param {string} key
 * @returns {string|undefined}
 */
export function getData(el, key) {
    if (isHTMLElement(el) && el.dataset) {
        return el.dataset[key];
    }
    return undefined;
}

/**
 * Dataset convenience setter.
 * @param {Element|null|undefined} el
 * @param {string} key
 * @param {string} value
 */
export function setData(el, key, value) {
    if (isHTMLElement(el) && el.dataset) {
        el.dataset[key] = value;
    }
}

/**
 * Focus an element if possible.
 * @param {Element|null|undefined} el
 */
export function focus(el) {
    if (isHTMLElement(el) && typeof el.focus === "function") {
        el.focus();
    }
}

export default {
    isHTMLElement,
    query,
    queryAll,
    requireElement,
    setText,
    addClass,
    removeClass,
    setDisabled,
    getValue,
    setValue,
    setChecked,
    getChecked,
    setStyle,
    clearElement,
    on,
    getData,
    setData,
    focus,
};
