// jsdomSetup.js
// Enhanced JSDOM environment setup for tests

/**
 * This module provides a reliable JSDOM setup for tests that require DOM manipulation.
 * It patches JSDOM's missing or incomplete functionality to ensure DOM tests work correctly.
 */

import { vi } from "vitest";

/**
 * Initializes and configures the JSDOM environment for tests
 */
export function setupJSDOMEnvironment() {
    // Ensure document.body exists
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }

    // Create reliable implementations of missing methods/properties
    if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, "id")) {
        Object.defineProperty(HTMLElement.prototype, "id", {
            get: function () {
                return this._id || "";
            },
            set: function (value) {
                this._id = value;
            },
            configurable: true,
        });
    }

    if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, "className")) {
        Object.defineProperty(HTMLElement.prototype, "className", {
            get: function () {
                return this._className || "";
            },
            set: function (value) {
                this._className = value;
            },
            configurable: true,
        });
    }

    if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, "classList")) {
        // Basic classList implementation
        class DOMTokenList {
            constructor(element) {
                this.element = element;
                this._classList = new Set();
            }

            add(className) {
                this._classList.add(className);
                this._updateClassName();
            }

            remove(className) {
                this._classList.delete(className);
                this._updateClassName();
            }

            contains(className) {
                return this._classList.has(className);
            }

            toggle(className) {
                if (this._classList.has(className)) {
                    this._classList.delete(className);
                } else {
                    this._classList.add(className);
                }
                this._updateClassName();
            }

            _updateClassName() {
                this.element.className = Array.from(this._classList).join(" ");
            }
        }

        Object.defineProperty(HTMLElement.prototype, "classList", {
            get: function () {
                if (!this._classList) {
                    this._classList = new DOMTokenList(this);
                    // Initialize from className if it exists
                    if (this.className) {
                        this.className
                            .split(" ")
                            .filter(Boolean)
                            .forEach((cls) => {
                                this._classList._classList.add(cls);
                            });
                    }
                }
                return this._classList;
            },
            configurable: true,
        });
    }

    // Mock window methods that JSDOM doesn't implement
    if (typeof window !== "undefined") {
        // Custom MutationObserver implementation for testing
        window.MutationObserver =
            window.MutationObserver ||
            class {
                constructor(callback) {
                    this.callback = callback;
                    this.elements = new Set();
                }

                observe(element, _options) {
                    this.elements.add(element);
                }

                disconnect() {
                    this.elements.clear();
                }

                // Method to simulate mutations for testing
                _simulateMutations(mutations) {
                    this.callback(mutations, this);
                }

                // Required by MutationObserver interface but not used in tests
                takeRecords() {
                    return [];
                }
            };

        // Mock getComputedStyle if not available
        window.getComputedStyle =
            window.getComputedStyle ||
            function (_element) {
                const style = {
                    getPropertyValue: (_prop) => "",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    opacity: "1",
                };
                return style;
            };

        // Create mock implementations for methods used in tests
        if (!window.HTMLElement.prototype.focus) {
            window.HTMLElement.prototype.focus = function () {};
        }

        if (!window.HTMLElement.prototype.blur) {
            window.HTMLElement.prototype.blur = function () {};
        }

        if (!window.HTMLElement.prototype.scrollIntoView) {
            window.HTMLElement.prototype.scrollIntoView = function () {};
        }

        // Patch Element methods
        if (!window.Element.prototype.closest) {
            window.Element.prototype.closest = function (selector) {
                let el = this;
                while (el) {
                    if (el.matches && el.matches(selector)) {
                        return el;
                    }
                    el = el.parentElement;
                }
                return null;
            };
        }

        if (!window.Element.prototype.matches) {
            window.Element.prototype.matches = function (selector) {
                // Simplistic implementation - just check id and tag for basic tests
                const selectorType = selector.charAt(0);
                if (selectorType === "#" && this.id === selector.substring(1)) {
                    return true;
                }
                // Basic tag check
                if (this.tagName && this.tagName.toLowerCase() === selector.toLowerCase()) {
                    return true;
                }
                return false;
            };
        }

        // Mock alert, confirm and prompt
        window.alert = window.alert || vi.fn();
        window.confirm = window.confirm || vi.fn().mockReturnValue(true);
        window.prompt = window.prompt || vi.fn().mockReturnValue("");
    }

    // Return patched objects
    return { document, window };
}

/**
 * Creates a mock HTMLElement with configurable attributes and properties
 * @param {string} tagName - The HTML tag name (div, span, etc)
 * @param {object} props - Properties to set on the element
 * @returns {HTMLElement} The configured element
 */
export function createMockElement(tagName, props = {}) {
    const element = document.createElement(tagName);

    Object.entries(props).forEach(([key, value]) => {
        if (key === "id" || key === "className") {
            element[key] = value;
        } else if (key === "classList" && Array.isArray(value)) {
            value.forEach((cls) => element.classList.add(cls));
        } else if (key === "attributes") {
            Object.entries(value).forEach(([attrName, attrValue]) => {
                element.setAttribute(attrName, String(attrValue));
            });
        } else if (key === "style" && typeof value === "object") {
            Object.entries(value).forEach(([styleProp, styleValue]) => {
                element.style[styleProp] = styleValue;
            });
        } else if (key === "dataset" && typeof value === "object") {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = String(dataValue);
            });
        } else if (key === "children" && Array.isArray(value)) {
            value.forEach((child) => element.appendChild(child));
        } else {
            element[key] = value;
        }
    });

    return element;
}

// Set up the environment by default when the module is imported
setupJSDOMEnvironment();
