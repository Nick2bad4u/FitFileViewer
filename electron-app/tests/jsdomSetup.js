// jsdomSetup.js
// Enhanced JSDOM environment setup for tests

/**
 * This module provides a reliable JSDOM setup for tests that require DOM
 * manipulation. It patches JSDOM's missing or incomplete functionality to
 * ensure DOM tests work correctly.
 */
import "./shims/nodeWebStorage";

import { vi } from "vitest";

/**
 * Initializes and configures the JSDOM environment for tests
 *
 * @returns {Object} The patched document and window objects
 */
export function setupJSDOMEnvironment() {
    // Ensure document.body exists
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }

    // Create a test container for elements
    const testContainer = document.createElement("div");
    testContainer.id = "test-container";
    document.body.appendChild(testContainer);

    // Add a test element with id 'existing-element' for requireElement tests
    const existingElement = document.createElement("div");
    existingElement.id = "existing-element";
    testContainer.appendChild(existingElement);

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

                // Define length property
                Object.defineProperty(this, "length", {
                    get: function () {
                        return this._classList.size;
                    },
                });

                // Make sure length is a number
                this.length = 0;

                // Initialize from className if it exists
                if (element.className) {
                    element.className
                        .split(" ")
                        .filter(Boolean)
                        .forEach((cls) => {
                            this._classList.add(cls);
                        });
                }
            }

            add(className) {
                if (!className) {
                    throw new Error(
                        "Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty."
                    );
                }
                this._classList.add(className);
                this._updateClassName();
                return this;
            }

            remove(className) {
                if (!className) {
                    throw new Error(
                        "Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty."
                    );
                }
                this._classList.delete(className);
                this._updateClassName();
                return this;
            }

            contains(className) {
                return this._classList.has(className);
            }

            toggle(className, force) {
                if (!className) {
                    throw new Error(
                        "Failed to execute 'toggle' on 'DOMTokenList': The token provided must not be empty."
                    );
                }

                if (force === true) {
                    this._classList.add(className);
                } else if (force === false) {
                    this._classList.delete(className);
                } else if (this._classList.has(className)) {
                    this._classList.delete(className);
                } else {
                    this._classList.add(className);
                }

                this._updateClassName();
                return this._classList.has(className);
            }

            _updateClassName() {
                this.element.className = Array.from(this._classList).join(" ");
                this.length = this._classList.size;
            }

            // Make it iterable
            [Symbol.iterator]() {
                return Array.from(this._classList).values();
            }
        }

        Object.defineProperty(HTMLElement.prototype, "classList", {
            get: function () {
                if (!this._classList) {
                    this._classList = new DOMTokenList(this);
                }
                return this._classList;
            },
            configurable: true,
        });
    }

    // Mock window methods that JSDOM doesn't implement
    if (typeof window !== "undefined") {
        // Custom MutationObserver implementation for testing
        const MockMutationObserver = class {
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

            // Non-standard method to simulate mutations for testing
            _simulateMutations(mutations) {
                this.callback(mutations, this);
            }

            // Required by MutationObserver interface but not used in tests
            takeRecords() {
                return [];
            }
        };

        // Only assign if it doesn't exist to avoid overriding the real implementation
        if (!window.MutationObserver) {
            window.MutationObserver = MockMutationObserver;
        }

        // Mock getComputedStyle if not available
        if (!window.getComputedStyle) {
            window.getComputedStyle = function (_element) {
                const style = {
                    getPropertyValue: (_prop) => "",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    opacity: "1",
                };
                // Add additional style properties to prevent type errors
                return style;
            };
        }

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
                if (
                    this.tagName &&
                    this.tagName.toLowerCase() === selector.toLowerCase()
                ) {
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
 *
 * @param {string} tagName - The HTML tag name (div, span, etc)
 * @param {object} props - Properties to set on the element
 *
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
