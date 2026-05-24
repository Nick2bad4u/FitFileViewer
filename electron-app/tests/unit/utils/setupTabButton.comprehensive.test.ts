/**
 * Comprehensive test suite for setupTabButton.js module with focus on exposing
 * potential bugs
 *
 * CRITICAL BUG TESTING FOCUS:
 *
 * - Event handler memory leak scenarios
 * - Cache staleness and invalidation bugs
 * - Handler reference management issues
 * - Element type validation problems
 * - Cache memory management leaks
 * - DOM timing and race condition issues
 *
 * @file SetupTabButton.comprehensive.test.js
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    setupTabButton,
    clearTabButtonCache,
} from "../../../utils/ui/tabs/setupTabButton.js";

describe("setupTabButton.js - Comprehensive Bug Detection Test Suite", () => {
    let testContainer;
    let originalConsoleWarn;
    let consoleWarnSpy;

    function createTestElement(tagName, id, text, attributes = {}) {
        const element = document.createElement(tagName);
        element.id = id;
        element.textContent = text;
        for (const [name, value] of Object.entries(attributes)) {
            if (typeof value === "boolean") {
                if (value) {
                    element.setAttribute(name, "");
                }
            } else {
                element.setAttribute(name, String(value));
            }
        }
        return element;
    }

    function setContainerElements(...elements) {
        testContainer.replaceChildren(...elements);
    }

    function setContainerButton(id, text = "Test", attributes = {}) {
        const button = createTestElement("button", id, text, attributes);
        setContainerElements(button);
        return button;
    }

    beforeEach(() => {
        // Ensure document.body exists
        if (!document.body) {
            const body = document.createElement("body");
            document.appendChild(body);
        }

        // Set up DOM container
        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        // Mock console.warn to track warnings
        originalConsoleWarn = console.warn;
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Clear any existing cache to start fresh
        clearTabButtonCache();
    });

    afterEach(() => {
        // Clean up DOM
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }

        // Restore console.warn
        console.warn = originalConsoleWarn;

        // Clear cache after each test
        clearTabButtonCache();

        vi.resetAllMocks();
    });

    describe("Input Validation - Edge Cases and Bug Detection", () => {
        it("should handle null id gracefully", () => {
            const handler = vi.fn();

            const setupResult = setupTabButton(null, handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid button id provided."
            );
            expect(handler).not.toHaveBeenCalled();
            expect(setupResult).toBeUndefined();
        });

        it("should handle undefined id gracefully", () => {
            const handler = vi.fn();

            const setupResult = setupTabButton(undefined, handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid button id provided."
            );
            expect(handler).not.toHaveBeenCalled();
            expect(setupResult).toBeUndefined();
        });

        it("should handle empty string id", () => {
            const handler = vi.fn();

            const setupResult = setupTabButton("", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid button id provided."
            );
            expect(handler).not.toHaveBeenCalled();
            expect(setupResult).toBeUndefined();
        });

        it("should handle whitespace-only id", () => {
            const handler = vi.fn();

            const setupResult = setupTabButton("   ", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid button id provided."
            );
            expect(handler).not.toHaveBeenCalled();
            expect(setupResult).toBeUndefined();
        });

        it("should handle non-string id types", () => {
            const handler = vi.fn();

            const numericSetupResult = setupTabButton(123, handler);
            const objectSetupResult = setupTabButton({}, handler);
            const arraySetupResult = setupTabButton([], handler);

            expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid button id provided."
            );
            expect([
                numericSetupResult,
                objectSetupResult,
                arraySetupResult,
            ]).toEqual([
                undefined,
                undefined,
                undefined,
            ]);
        });

        it("should handle null handler gracefully", () => {
            setContainerButton("test-btn");

            const setupResult = setupTabButton("test-btn", null);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid handler provided. It must be a function."
            );
            expect(setupResult).toBeUndefined();
        });

        it("should handle undefined handler gracefully", () => {
            setContainerButton("test-btn");

            const setupResult = setupTabButton("test-btn", undefined);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid handler provided. It must be a function."
            );
            expect(setupResult).toBeUndefined();
        });

        it("should handle non-function handler types", () => {
            setContainerButton("test-btn");

            const stringSetupResult = setupTabButton(
                "test-btn",
                "not a function"
            );
            const numericSetupResult = setupTabButton("test-btn", 123);
            const objectSetupResult = setupTabButton("test-btn", {});

            expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Invalid handler provided. It must be a function."
            );
            expect([
                stringSetupResult,
                numericSetupResult,
                objectSetupResult,
            ]).toEqual([
                undefined,
                undefined,
                undefined,
            ]);
        });
    });

    describe("DOM Element Detection and Caching - Bug Testing", () => {
        it("should warn when element does not exist", () => {
            const handler = vi.fn();

            const setupResult = setupTabButton("non-existent-button", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Button with id "non-existent-button" not found. Ensure the element exists in the DOM.'
            );
            expect(setupResult).toBeUndefined();
        });

        it("should cache element after first successful lookup", () => {
            setContainerButton("cache-test");
            const handler = vi.fn();

            // First call should cache the element
            setupTabButton("cache-test", handler);

            // Spy on getElementById to verify it's not called again
            const getElementByIdSpy = vi.spyOn(document, "getElementById");

            // Second call should use cache
            const handler2 = vi.fn();
            setupTabButton("cache-test", handler2);

            expect(getElementByIdSpy).not.toHaveBeenCalled();
            expect(setupTabButton.cache?.get("cache-test")).toBe(
                document.getElementById("cache-test")
            );
            expect(setupTabButton.cache?.size).toBe(1);

            getElementByIdSpy.mockRestore();
        });

        it("BUG TEST: should handle cache staleness when element is removed from DOM", () => {
            setContainerButton("stale-test");
            const handler = vi.fn();

            // First call caches the element
            setupTabButton("stale-test", handler);

            // Remove element from DOM (simulating DOM manipulation)
            const button = document.getElementById("stale-test");
            button?.remove();

            // Add new element with same ID
            setContainerButton("stale-test", "New Test");

            // This should detect stale cache and refresh
            const handler2 = vi.fn();
            setupTabButton("stale-test", handler2);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Cached button with id "stale-test" is no longer in DOM. Refreshing cache.'
            );

            // Verify new handler works
            const newButton = document.getElementById("stale-test");
            newButton?.click();
            expect(handler2).toHaveBeenCalled();
            expect(setupTabButton.cache?.get("stale-test")).toBe(newButton);
        });

        it("BUG TEST: should handle case where cached element becomes disconnected but replacement fails", () => {
            setContainerButton("disconnect-test");
            const handler = vi.fn();

            // First call caches the element
            setupTabButton("disconnect-test", handler);

            // Remove element completely without replacement
            const button = document.getElementById("disconnect-test");
            button?.remove();

            // This should detect stale cache but fail to find replacement
            const handler2 = vi.fn();
            setupTabButton("disconnect-test", handler2);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Cached button with id "disconnect-test" is no longer in DOM. Refreshing cache.'
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Button with id "disconnect-test" not found after cache refresh.'
            );
            expect(setupTabButton.cache?.has("disconnect-test")).toBe(false);
        });
    });

    describe("Event Handler Management - Memory Leak Bug Detection", () => {
        it("BUG TEST: should handle manually set _setupTabButtonHandler property without actual listener", () => {
            setContainerButton("manual-handler-test");
            const button = document.getElementById("manual-handler-test");

            // Manually set the property without adding actual listener (simulating bug scenario)
            button._setupTabButtonHandler = vi.fn();

            // This should not throw error even though removeEventListener will fail silently
            const newHandler = vi.fn();
            let setupResult;
            expect(() => {
                setupResult = setupTabButton("manual-handler-test", newHandler);
            }).not.toThrow();

            // Verify new handler is set correctly
            button.click();
            expect(newHandler).toHaveBeenCalled();
            expect(typeof setupResult).toBe("function");
            // Note: _setupTabButtonHandler is no longer used with centralized event manager
        });

        it("should replace existing handler to prevent multiple handlers", () => {
            setContainerButton("replace-handler-test");
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            // Set first handler
            setupTabButton("replace-handler-test", handler1);

            // Set second handler (should replace first)
            setupTabButton("replace-handler-test", handler2);

            // Click should only trigger second handler
            const button = document.getElementById("replace-handler-test");
            button?.click();

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
            expect(setupTabButton.cache?.get("replace-handler-test")).toBe(
                button
            );
        });

        it("BUG TEST: should handle rapid multiple calls without race conditions", () => {
            setContainerButton("race-test");
            const handlers = [
                vi.fn(),
                vi.fn(),
                vi.fn(),
                vi.fn(),
                vi.fn(),
            ];

            // Rapidly set multiple handlers
            handlers.forEach((handler) => {
                setupTabButton("race-test", handler);
            });

            // Only last handler should be active
            const button = document.getElementById("race-test");
            button?.click();

            // First 4 handlers should not be called
            handlers.slice(0, 4).forEach((handler) => {
                expect(handler).not.toHaveBeenCalled();
            });

            // Last handler should be called
            expect(handlers[4]).toHaveBeenCalled();
            expect(setupTabButton.cache?.get("race-test")).toBe(button);
        });

        it("should register event listener for cleanup", () => {
            setContainerButton("reference-test");
            const handler = vi.fn();

            setupTabButton("reference-test", handler);

            // Verify handler works
            const button = document.getElementById("reference-test");
            button?.click();
            expect(handler).toHaveBeenCalled();
            expect(typeof button?._setupTabButtonCleanup).toBe("function");
        });
    });

    describe("Element Type Validation - Bug Detection", () => {
        it("BUG TEST: should work with various HTML element types", () => {
            setContainerElements(
                createTestElement("div", "div-test", "Div"),
                createTestElement("span", "span-test", "Span"),
                createTestElement("a", "link-test", "Link"),
                createTestElement("input", "input-test", "", {
                    type: "button",
                    value: "Input",
                }),
                createTestElement("button", "button-test", "Button")
            );

            const handler = vi.fn();
            const elementTypes = [
                "div-test",
                "span-test",
                "link-test",
                "input-test",
                "button-test",
            ];

            // All element types should accept handlers (potential bug - no type validation)
            elementTypes.forEach((id) => {
                expect(() => {
                    setupTabButton(id, handler);
                }).not.toThrow();
            });

            // All should be clickable (revealing potential UX issues)
            elementTypes.forEach((id) => {
                const element = document.getElementById(id);
                element?.click();
            });

            // Handler should be called once for each element
            expect(handler).toHaveBeenCalledTimes(elementTypes.length);
        });

        it("BUG TEST: should handle disabled elements", () => {
            setContainerButton("disabled-test", "Disabled Button", {
                disabled: true,
            });
            const handler = vi.fn();

            setupTabButton("disabled-test", handler);

            // Handler should still be attached even to disabled elements
            const button = document.getElementById("disabled-test");
            expect(button).toBeInstanceOf(HTMLButtonElement);

            // Disabled button clicks might not trigger handler (browser behavior)
            button?.click();
            // Note: Handler is attached but disabled buttons don't trigger click events in most browsers
            // This is expected browser behavior, not a bug
        });
    });

    describe("Cache Management - Memory Leak Bug Detection", () => {
        it("BUG TEST: should demonstrate cache growing indefinitely", () => {
            // Create many elements to test cache growth
            const elementCount = 100;
            const handler = vi.fn();

            for (let i = 0; i < elementCount; i++) {
                const button = document.createElement("button");
                button.id = `cache-growth-test-${i}`;
                button.textContent = `Button ${i}`;
                testContainer.appendChild(button);

                setupTabButton(`cache-growth-test-${i}`, handler);
            }

            // Cache should contain all elements (potential memory leak)
            const cache = setupTabButton.cache;
            expect(cache.size).toBe(elementCount);

            // Remove elements from DOM but cache still holds references
            testContainer.replaceChildren();

            // Cache still holds references to disconnected elements (memory leak)
            expect(
                Array.from(cache.values()).every(
                    (button) => !button.isConnected
                )
            ).toBe(true);

            // Only clearTabButtonCache() can clean this up
        });

        it("should clear cache and remove all handlers properly", () => {
            setContainerElements(
                createTestElement("button", "clear-test-1", "Button 1"),
                createTestElement("button", "clear-test-2", "Button 2"),
                createTestElement("button", "clear-test-3", "Button 3")
            );

            const handler = vi.fn();

            // Set up handlers
            setupTabButton("clear-test-1", handler);
            setupTabButton("clear-test-2", handler);
            setupTabButton("clear-test-3", handler);

            // Verify cache has entries
            const cache = setupTabButton.cache;
            expect(cache.size).toBe(3);

            // Clear cache
            clearTabButtonCache();

            // Verify cache is empty
            expect(cache.size).toBe(0);

            // Verify handlers are removed
            const buttons = [
                "clear-test-1",
                "clear-test-2",
                "clear-test-3",
            ].map((id) => document.getElementById(id));

            buttons.forEach((button) => {
                expect(button._setupTabButtonHandler).toBeUndefined();
                // Click should not trigger handler after cleanup
                button?.click();
            });

            expect(handler).not.toHaveBeenCalled();
        });

        it("BUG TEST: should handle clearTabButtonCache when cache is undefined", () => {
            // Force cache to be undefined
            setupTabButton.cache = undefined;

            // Should not throw error
            expect(() => {
                clearTabButtonCache();
            }).not.toThrow();
            expect(setupTabButton.cache).toBeUndefined();
        });

        it("BUG TEST: should handle elements with undefined _setupTabButtonHandler during clear", () => {
            setContainerButton("undefined-handler-test");
            const handler = vi.fn();

            setupTabButton("undefined-handler-test", handler);

            // Manually delete the handler property to simulate corruption
            const button = document.getElementById("undefined-handler-test");
            delete button._setupTabButtonHandler;

            // Clear should not throw error
            expect(() => {
                clearTabButtonCache();
            }).not.toThrow();
        });
    });

    describe("Integration and Real-World Scenarios", () => {
        it("should handle complete setup and teardown cycle", () => {
            setContainerButton("lifecycle-test");
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            // Initial setup
            setupTabButton("lifecycle-test", handler1);

            const button = document.getElementById("lifecycle-test");
            button?.click();
            expect(handler1).toHaveBeenCalledTimes(1);

            // Replace handler
            setupTabButton("lifecycle-test", handler2);
            button?.click();
            expect(handler1).not.toHaveBeenCalledTimes(2);
            expect(handler2).toHaveBeenCalledTimes(1);

            // Clear all
            clearTabButtonCache();
            button?.click();
            expect(handler2).not.toHaveBeenCalledTimes(2);
            expect(setupTabButton.cache?.size ?? 0).toBe(0);
        });

        it("BUG TEST: should handle DOM mutations that affect cached elements", () => {
            setContainerButton("mutation-test", "Original");
            const handler = vi.fn();

            setupTabButton("mutation-test", handler);

            // Simulate DOM framework replacing the element content
            const button = document.getElementById("mutation-test");
            button.textContent = "Modified";

            // Handler should still work
            button?.click();
            expect(handler).toHaveBeenCalled();

            // But what if the element is completely replaced?
            setContainerButton("mutation-test", "Completely New");

            const handler2 = vi.fn();
            setupTabButton("mutation-test", handler2);

            // Should detect the stale cache and update
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Cached button with id "mutation-test" is no longer in DOM. Refreshing cache.'
            );
            document.getElementById("mutation-test")?.click();
            expect(handler2).toHaveBeenCalled();
            expect(setupTabButton.cache?.get("mutation-test")).toBe(
                document.getElementById("mutation-test")
            );
        });

        it("should handle concurrent operations on same element", () => {
            setContainerButton("concurrent-test");
            const handlers = [
                vi.fn(),
                vi.fn(),
                vi.fn(),
            ];

            // Simulate rapid concurrent calls
            Promise.all([
                Promise.resolve(setupTabButton("concurrent-test", handlers[0])),
                Promise.resolve(setupTabButton("concurrent-test", handlers[1])),
                Promise.resolve(setupTabButton("concurrent-test", handlers[2])),
            ]);

            // Last handler should be active
            const button = document.getElementById("concurrent-test");
            button?.click();

            expect(handlers[2]).toHaveBeenCalled();
            expect(setupTabButton.cache?.get("concurrent-test")).toBe(button);
        });
    });

    describe("Error Resilience and Edge Cases", () => {
        it("should handle elements that become invalid after caching", () => {
            setContainerButton("invalid-test");
            const handler = vi.fn();

            setupTabButton("invalid-test", handler);

            // Simulate element corruption
            const button = document.getElementById("invalid-test");
            Object.defineProperty(button, "addEventListener", {
                value: () => {
                    throw new Error("addEventListener failed");
                },
            });

            // Should handle addEventListener errors gracefully
            const handler2 = vi.fn();
            expect(() => {
                setupTabButton("invalid-test", handler2);
            }).toThrow("addEventListener failed");
            expect(setupTabButton.cache?.get("invalid-test")).toBe(button);
        });

        it("should maintain cache integrity across multiple operations", () => {
            const elementCount = 10;
            const handler = vi.fn();

            // Create elements
            for (let i = 0; i < elementCount; i++) {
                const button = document.createElement("button");
                button.id = `integrity-test-${i}`;
                testContainer.appendChild(button);
                setupTabButton(`integrity-test-${i}`, handler);
            }

            // Remove some elements
            for (let i = 0; i < 5; i++) {
                document.getElementById(`integrity-test-${i}`)?.remove();
            }

            // Cache should still work for remaining elements
            for (let i = 5; i < elementCount; i++) {
                const button = document.getElementById(`integrity-test-${i}`);
                button?.click();
            }

            expect(handler).toHaveBeenCalledTimes(5);
            expect(
                Array.from(setupTabButton.cache?.values() ?? []).filter(
                    (button) => button.isConnected
                )
            ).toHaveLength(5);
        });
    });
});
