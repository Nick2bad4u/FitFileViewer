/**
 * @vitest-environment jsdom
 * @file setupTabButton.comprehensive.test.js
 * @description Comprehensive test suite for setupTabButton.js module with focus on exposing potential bugs
 *
 * CRITICAL BUG TESTING FOCUS:
 * - Event handler memory leak scenarios
 * - Cache staleness and invalidation bugs
 * - Handler reference management issues
 * - Element type validation problems
 * - Cache memory management leaks
 * - DOM timing and race condition issues
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupTabButton, clearTabButtonCache } from "../../../utils/ui/tabs/setupTabButton.js";

describe("setupTabButton.js - Comprehensive Bug Detection Test Suite", () => {
    let testContainer;
    let originalConsoleWarn;
    let consoleWarnSpy;

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

            setupTabButton(null, handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid button id provided.");
            expect(handler).not.toHaveBeenCalled();
        });

        it("should handle undefined id gracefully", () => {
            const handler = vi.fn();

            setupTabButton(undefined, handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid button id provided.");
            expect(handler).not.toHaveBeenCalled();
        });

        it("should handle empty string id", () => {
            const handler = vi.fn();

            setupTabButton("", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid button id provided.");
            expect(handler).not.toHaveBeenCalled();
        });

        it("should handle whitespace-only id", () => {
            const handler = vi.fn();

            setupTabButton("   ", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid button id provided.");
            expect(handler).not.toHaveBeenCalled();
        });

        it("should handle non-string id types", () => {
            const handler = vi.fn();

            setupTabButton(123, handler);
            setupTabButton({}, handler);
            setupTabButton([], handler);

            expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid button id provided.");
        });

        it("should handle null handler gracefully", () => {
            testContainer.innerHTML = '<button id="test-btn">Test</button>';

            setupTabButton("test-btn", null);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid handler provided. It must be a function.");
        });

        it("should handle undefined handler gracefully", () => {
            testContainer.innerHTML = '<button id="test-btn">Test</button>';

            setupTabButton("test-btn", undefined);

            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid handler provided. It must be a function.");
        });

        it("should handle non-function handler types", () => {
            testContainer.innerHTML = '<button id="test-btn">Test</button>';

            setupTabButton("test-btn", "not a function");
            setupTabButton("test-btn", 123);
            setupTabButton("test-btn", {});

            expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
            expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid handler provided. It must be a function.");
        });
    });

    describe("DOM Element Detection and Caching - Bug Testing", () => {
        it("should warn when element does not exist", () => {
            const handler = vi.fn();

            setupTabButton("non-existent-button", handler);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Button with id "non-existent-button" not found. Ensure the element exists in the DOM.'
            );
        });

        it("should cache element after first successful lookup", () => {
            testContainer.innerHTML = '<button id="cache-test">Test</button>';
            const handler = vi.fn();

            // First call should cache the element
            setupTabButton("cache-test", handler);

            // Spy on getElementById to verify it's not called again
            const getElementByIdSpy = vi.spyOn(document, "getElementById");

            // Second call should use cache
            const handler2 = vi.fn();
            setupTabButton("cache-test", handler2);

            expect(getElementByIdSpy).not.toHaveBeenCalled();

            getElementByIdSpy.mockRestore();
        });

        it("BUG TEST: should handle cache staleness when element is removed from DOM", () => {
            testContainer.innerHTML = '<button id="stale-test">Test</button>';
            const handler = vi.fn();

            // First call caches the element
            setupTabButton("stale-test", handler);

            // Remove element from DOM (simulating DOM manipulation)
            const button = document.getElementById("stale-test");
            button?.remove();

            // Add new element with same ID
            testContainer.innerHTML = '<button id="stale-test">New Test</button>';

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
        });

        it("BUG TEST: should handle case where cached element becomes disconnected but replacement fails", () => {
            testContainer.innerHTML = '<button id="disconnect-test">Test</button>';
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
        });
    });

    describe("Event Handler Management - Memory Leak Bug Detection", () => {
        it("BUG TEST: should handle manually set _setupTabButtonHandler property without actual listener", () => {
            testContainer.innerHTML = '<button id="manual-handler-test">Test</button>';
            const button = document.getElementById("manual-handler-test");

            // Manually set the property without adding actual listener (simulating bug scenario)
            button._setupTabButtonHandler = vi.fn();

            // This should not throw error even though removeEventListener will fail silently
            const newHandler = vi.fn();
            expect(() => {
                setupTabButton("manual-handler-test", newHandler);
            }).not.toThrow();

            // Verify new handler is set correctly
            button.click();
            expect(newHandler).toHaveBeenCalled();
            expect(button._setupTabButtonHandler).toBe(newHandler);
        });

        it("should replace existing handler to prevent multiple handlers", () => {
            testContainer.innerHTML = '<button id="replace-handler-test">Test</button>';
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
        });

        it("BUG TEST: should handle rapid multiple calls without race conditions", () => {
            testContainer.innerHTML = '<button id="race-test">Test</button>';
            const handlers = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];

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
        });

        it("should store handler reference on element for cleanup", () => {
            testContainer.innerHTML = '<button id="reference-test">Test</button>';
            const handler = vi.fn();

            setupTabButton("reference-test", handler);

            const button = document.getElementById("reference-test");
            expect(button._setupTabButtonHandler).toBe(handler);
        });
    });

    describe("Element Type Validation - Bug Detection", () => {
        it("BUG TEST: should work with various HTML element types", () => {
            testContainer.innerHTML = `
                <div id="div-test">Div</div>
                <span id="span-test">Span</span>
                <a id="link-test">Link</a>
                <input id="input-test" type="button" value="Input">
                <button id="button-test">Button</button>
            `;

            const handler = vi.fn();
            const elementTypes = ["div-test", "span-test", "link-test", "input-test", "button-test"];

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
            testContainer.innerHTML = '<button id="disabled-test" disabled>Disabled Button</button>';
            const handler = vi.fn();

            setupTabButton("disabled-test", handler);

            // Handler should still be attached even to disabled elements
            const button = document.getElementById("disabled-test");
            expect(button._setupTabButtonHandler).toBe(handler);

            // Disabled button clicks might not trigger handler (browser behavior)
            button?.click();
            // Note: This reveals potential bug - should we handle disabled elements differently?
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
            testContainer.innerHTML = "";

            // Cache still holds references to disconnected elements (memory leak)
            expect(cache.size).toBe(elementCount);

            // Only clearTabButtonCache() can clean this up
        });

        it("should clear cache and remove all handlers properly", () => {
            testContainer.innerHTML = `
                <button id="clear-test-1">Button 1</button>
                <button id="clear-test-2">Button 2</button>
                <button id="clear-test-3">Button 3</button>
            `;

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
            const buttons = ["clear-test-1", "clear-test-2", "clear-test-3"].map((id) => document.getElementById(id));

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
        });

        it("BUG TEST: should handle elements with undefined _setupTabButtonHandler during clear", () => {
            testContainer.innerHTML = '<button id="undefined-handler-test">Test</button>';
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
            testContainer.innerHTML = '<button id="lifecycle-test">Test</button>';
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
            expect(handler1).toHaveBeenCalledTimes(1); // Should not increase
            expect(handler2).toHaveBeenCalledTimes(1);

            // Clear all
            clearTabButtonCache();
            button?.click();
            expect(handler2).toHaveBeenCalledTimes(1); // Should not increase
        });

        it("BUG TEST: should handle DOM mutations that affect cached elements", () => {
            testContainer.innerHTML = '<button id="mutation-test">Original</button>';
            const handler = vi.fn();

            setupTabButton("mutation-test", handler);

            // Simulate DOM framework replacing the element content
            const button = document.getElementById("mutation-test");
            button.textContent = "Modified";

            // Handler should still work
            button?.click();
            expect(handler).toHaveBeenCalled();

            // But what if the element is completely replaced?
            testContainer.innerHTML = '<button id="mutation-test">Completely New</button>';

            const handler2 = vi.fn();
            setupTabButton("mutation-test", handler2);

            // Should detect the stale cache and update
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Cached button with id "mutation-test" is no longer in DOM. Refreshing cache.'
            );
        });

        it("should handle concurrent operations on same element", () => {
            testContainer.innerHTML = '<button id="concurrent-test">Test</button>';
            const handlers = [vi.fn(), vi.fn(), vi.fn()];

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
        });
    });

    describe("Error Resilience and Edge Cases", () => {
        it("should handle elements that become invalid after caching", () => {
            testContainer.innerHTML = '<button id="invalid-test">Test</button>';
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
        });
    });
});
