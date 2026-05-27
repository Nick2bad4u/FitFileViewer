/**
 * Tests for enableTabButtons functionality These tests verify the
 * enable/disable behavior of tab buttons
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createMockTabButtons,
    cleanupDOM,
} from "../../fixtures/tabFixtures.js";

// Import the function to test
const { setTabButtonsEnabled } =
    await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");
const { getState } =
    await import("../../../electron-app/utils/state/core/stateManager.js");

function getRequiredTabButton(): HTMLElement {
    const firstButton = document.querySelector<HTMLElement>(".tab-button");

    if (firstButton === null) {
        throw new Error("Expected a tab button in the test DOM.");
    }

    return firstButton;
}

describe("enable tab buttons", () => {
    beforeEach(() => {
        createMockTabButtons();
    });

    afterEach(() => {
        cleanupDOM();
        vi.restoreAllMocks();
    });

    describe("setTabButtonsEnabled function", () => {
        it("should disable all tab buttons when called with false", () => {
            expect.hasAssertions();

            setTabButtonsEnabled(false);

            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;
                expect(htmlButton.disabled).toBe(true);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(
                    true
                );
                expect(htmlButton.getAttribute("aria-disabled")).toBe("true");
            });
        });

        it("should enable all tab buttons when called with true", () => {
            expect.hasAssertions();

            // First disable them
            setTabButtonsEnabled(false);

            // Then enable them
            setTabButtonsEnabled(true);

            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;
                expect(htmlButton.disabled).toBe(false);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(
                    false
                );
                expect(htmlButton.getAttribute("aria-disabled")).toBe("false");
            });
        });

        it("should handle empty DOM gracefully", () => {
            expect.hasAssertions();

            cleanupDOM();

            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            expect(document.querySelector(".tab-button")).not.toBeInstanceOf(
                HTMLButtonElement
            );
            expect(document.body.childElementCount).toBe(0);
            expect(getState("ui.tabButtonsEnabled")).toBe(true);
        });

        it("should work with mixed button states", () => {
            expect.hasAssertions();

            const tabButtons = document.querySelectorAll(".tab-button");

            // Manually set different states
            (tabButtons[0] as HTMLButtonElement).disabled = true;
            tabButtons[1].classList.add("tab-disabled");
            tabButtons[2].setAttribute("aria-disabled", "true");

            // Enable all
            setTabButtonsEnabled(true);

            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;
                expect(htmlButton.disabled).toBe(false);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(
                    false
                );
                expect(htmlButton.getAttribute("aria-disabled")).toBe("false");
            });
        });

        it("should preserve other classes when enabling/disabling", () => {
            expect.hasAssertions();

            const firstButton = getRequiredTabButton();
            firstButton.classList.add("custom-class", "another-class");

            setTabButtonsEnabled(false);
            expect(firstButton.classList.contains("custom-class")).toBe(true);
            expect(firstButton.classList.contains("another-class")).toBe(true);
            expect(firstButton.classList.contains("tab-disabled")).toBe(true);

            setTabButtonsEnabled(true);
            expect([...firstButton.classList]).toStrictEqual([
                "tab-button",
                "active",
                "custom-class",
                "another-class",
            ]);
            expect(firstButton.classList.contains("tab-disabled")).toBe(false);
            expect(firstButton.getAttribute("aria-disabled")).toBe("false");
        });

        it("should log operations for debugging", () => {
            expect.hasAssertions();

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;
                expect(htmlButton.disabled).toBe(false);
                expect(htmlButton.getAttribute("aria-disabled")).toBe("false");
            });

            // Should have logged the operations - check for the actual log messages
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabButtons] setTabButtonsEnabled(false) called"
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabButtons] Buttons disabled"
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabButtons] setTabButtonsEnabled(true) called"
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabButtons] Buttons enabled"
            );

            consoleSpy.mockRestore();
        });
    });

    describe("tab button state consistency", () => {
        it("should maintain consistent disabled state across all methods", () => {
            expect.hasAssertions();

            const tabButtons = document.querySelectorAll(".tab-button");

            setTabButtonsEnabled(false);

            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;

                // All three methods should be in sync
                expect(htmlButton.disabled).toBe(true);
                expect(htmlButton.hasAttribute("disabled")).toBe(true);
                expect(htmlButton.classList.contains("tab-disabled")).toBe(
                    true
                );
            });
        });

        it("should handle rapid enable/disable cycles", () => {
            expect.hasAssertions();

            for (let i = 0; i < 10; i++) {
                setTabButtonsEnabled(i % 2 === 0);
            }

            // Final state should be disabled (i=9, 9%2=1, so setTabButtonsEnabled(false) was last call)
            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach((button) => {
                const htmlButton = button as HTMLButtonElement;
                expect(htmlButton.disabled).toBe(true); // Changed to true since last call was false
                expect(htmlButton.classList).not.toContain("active-disabled");
            });
        });
    });
});
