/**
 * Tests for enableTabButtons functionality
 * These tests verify the enable/disable behavior of tab buttons
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockTabButtons, cleanupDOM } from "../../fixtures/tabFixtures.js";

// Import the function to test
const { setTabButtonsEnabled } = await import("../../../utils/ui/controls/enableTabButtons.js");

describe("Enable Tab Buttons", () => {
    beforeEach(() => {
        createMockTabButtons();
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe("setTabButtonsEnabled function", () => {
        it("should disable all tab buttons when called with false", () => {
            setTabButtonsEnabled(false);

            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = /** @type {HTMLButtonElement} */ (button);
                expect(htmlButton.disabled).toBe(true);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(true);
                expect(htmlButton.getAttribute("aria-disabled")).toBe("true");
            });
        });

        it("should enable all tab buttons when called with true", () => {
            // First disable them
            setTabButtonsEnabled(false);

            // Then enable them
            setTabButtonsEnabled(true);

            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = /** @type {HTMLButtonElement} */ (button);
                expect(htmlButton.disabled).toBe(false);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(false);
                expect(htmlButton.getAttribute("aria-disabled")).toBe("false");
            });
        });

        it("should handle empty DOM gracefully", () => {
            cleanupDOM();

            // Should not throw error
            expect(() => {
                setTabButtonsEnabled(false);
                setTabButtonsEnabled(true);
            }).not.toThrow();
        });

        it("should work with mixed button states", () => {
            const tabButtons = document.querySelectorAll(".tab-button");

            // Manually set different states
            /** @type {HTMLButtonElement} */ (tabButtons[0]).disabled = true;
            /** @type {HTMLElement} */ (tabButtons[1]).classList.add("tab-disabled");
            /** @type {HTMLElement} */ (tabButtons[2]).setAttribute("aria-disabled", "true");

            // Enable all
            setTabButtonsEnabled(true);

            tabButtons.forEach((button) => {
                const htmlButton = /** @type {HTMLButtonElement} */ (button);
                expect(htmlButton.disabled).toBe(false);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(false);
                expect(htmlButton.getAttribute("aria-disabled")).toBe("false");
            });
        });

        it("should preserve other classes when enabling/disabling", () => {
            const firstButton = /** @type {HTMLElement} */ (document.querySelector(".tab-button"));
            firstButton.classList.add("custom-class", "another-class");

            setTabButtonsEnabled(false);
            expect(firstButton.classList.contains("custom-class")).toBe(true);
            expect(firstButton.classList.contains("another-class")).toBe(true);
            expect(firstButton.classList.contains("tab-disabled")).toBe(true);

            setTabButtonsEnabled(true);
            expect(firstButton.classList.contains("custom-class")).toBe(true);
            expect(firstButton.classList.contains("another-class")).toBe(true);
            expect(firstButton.classList.contains("tab-disabled")).toBe(false);
        });

        it("should log operations for debugging", () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            // Should have logged the operations - check for the actual log messages
            expect(consoleSpy).toHaveBeenCalledWith("[TabButtons] setTabButtonsEnabled(false) called");
            expect(consoleSpy).toHaveBeenCalledWith("[TabButtons] Buttons disabled");
            expect(consoleSpy).toHaveBeenCalledWith("[TabButtons] setTabButtonsEnabled(true) called");
            expect(consoleSpy).toHaveBeenCalledWith("[TabButtons] Buttons enabled");

            consoleSpy.mockRestore();
        });
    });

    describe("Tab button state consistency", () => {
        it("should maintain consistent disabled state across all methods", () => {
            const tabButtons = document.querySelectorAll(".tab-button");

            setTabButtonsEnabled(false);

            tabButtons.forEach((button) => {
                const htmlButton = /** @type {HTMLButtonElement} */ (button);

                // All three methods should be in sync
                expect(htmlButton.disabled).toBe(true);
                expect(htmlButton.hasAttribute("disabled")).toBe(true);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(true);
            });
        });

        it("should handle rapid enable/disable cycles", () => {
            for (let i = 0; i < 10; i++) {
                setTabButtonsEnabled(i % 2 === 0);
            }

            // Final state should be disabled (i=9, 9%2=1, so setTabButtonsEnabled(false) was last call)
            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = /** @type {HTMLButtonElement} */ (button);
                expect(htmlButton.disabled).toBe(true); // Changed to true since last call was false
            });
        });
    });
});
