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

function getTabButtonSnapshots() {
    return Array.from(
        document.querySelectorAll<HTMLButtonElement>(".tab-button"),
        (button) => ({
            ariaDisabled: button.getAttribute("aria-disabled"),
            classes: [...button.classList],
            disabled: button.disabled,
            hasDisabledAttribute: button.hasAttribute("disabled"),
            id: button.id,
        })
    );
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
            expect.assertions(1);

            setTabButtonsEnabled(false);

            expect(getTabButtonSnapshots()).toMatchObject([
                {
                    ariaDisabled: "true",
                    classes: expect.arrayContaining([
                        "active",
                        "tab-button",
                        "tab-disabled",
                    ]),
                    disabled: true,
                    id: "tab-summary",
                },
                {
                    ariaDisabled: "true",
                    classes: expect.arrayContaining([
                        "tab-button",
                        "tab-disabled",
                    ]),
                    disabled: true,
                    id: "tab-chart",
                },
                {
                    ariaDisabled: "true",
                    classes: expect.arrayContaining([
                        "tab-button",
                        "tab-disabled",
                    ]),
                    disabled: true,
                    id: "tab-map",
                },
                {
                    ariaDisabled: "true",
                    classes: expect.arrayContaining([
                        "tab-button",
                        "tab-disabled",
                    ]),
                    disabled: true,
                    id: "tab-table",
                },
            ]);
        });

        it("should enable all tab buttons when called with true", () => {
            expect.assertions(1);

            // First disable them
            setTabButtonsEnabled(false);

            // Then enable them
            setTabButtonsEnabled(true);

            expect(getTabButtonSnapshots()).toMatchObject([
                {
                    ariaDisabled: "false",
                    classes: ["tab-button", "active"],
                    disabled: false,
                    id: "tab-summary",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-chart",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-map",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-table",
                },
            ]);
        });

        it("should handle empty DOM gracefully", () => {
            expect.assertions(2);

            cleanupDOM();

            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            expect(document.querySelector(".tab-button")).not.toBeInstanceOf(
                HTMLButtonElement
            );
            expect({
                bodyChildren: Array.from(document.body.children),
                tabButtonsEnabled: getState("ui.tabButtonsEnabled"),
            }).toStrictEqual({
                bodyChildren: [],
                tabButtonsEnabled: true,
            });
        });

        it("should work with mixed button states", () => {
            expect.assertions(1);

            const tabButtons = document.querySelectorAll(".tab-button");

            // Manually set different states
            (tabButtons[0] as HTMLButtonElement).disabled = true;
            tabButtons[1].classList.add("tab-disabled");
            tabButtons[2].setAttribute("aria-disabled", "true");

            // Enable all
            setTabButtonsEnabled(true);

            expect(getTabButtonSnapshots()).toMatchObject([
                {
                    ariaDisabled: "false",
                    classes: ["tab-button", "active"],
                    disabled: false,
                    id: "tab-summary",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-chart",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-map",
                },
                {
                    ariaDisabled: "false",
                    classes: ["tab-button"],
                    disabled: false,
                    id: "tab-table",
                },
            ]);
        });

        it("should preserve other classes when enabling/disabling", () => {
            expect.assertions(3);

            const firstButton = getRequiredTabButton();
            firstButton.classList.add("custom-class", "another-class");

            setTabButtonsEnabled(false);
            expect([...firstButton.classList]).toStrictEqual([
                "tab-button",
                "active",
                "custom-class",
                "another-class",
                "tab-disabled",
            ]);

            setTabButtonsEnabled(true);
            expect([...firstButton.classList]).toStrictEqual([
                "tab-button",
                "active",
                "custom-class",
                "another-class",
            ]);
            expect(firstButton.getAttribute("aria-disabled")).toBe("false");
        });

        it("should log operations for debugging", () => {
            expect.assertions(5);

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            expect(getTabButtonSnapshots()).toMatchObject([
                {
                    ariaDisabled: "false",
                    disabled: false,
                    id: "tab-summary",
                },
                {
                    ariaDisabled: "false",
                    disabled: false,
                    id: "tab-chart",
                },
                {
                    ariaDisabled: "false",
                    disabled: false,
                    id: "tab-map",
                },
                {
                    ariaDisabled: "false",
                    disabled: false,
                    id: "tab-table",
                },
            ]);

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
            expect.assertions(1);

            setTabButtonsEnabled(false);

            expect(getTabButtonSnapshots()).toMatchObject([
                {
                    classes: expect.arrayContaining(["tab-disabled"]),
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-summary",
                },
                {
                    classes: expect.arrayContaining(["tab-disabled"]),
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-chart",
                },
                {
                    classes: expect.arrayContaining(["tab-disabled"]),
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-map",
                },
                {
                    classes: expect.arrayContaining(["tab-disabled"]),
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-table",
                },
            ]);
        });

        it("should handle rapid enable/disable cycles", () => {
            expect.assertions(2);

            for (let i = 0; i < 10; i++) {
                setTabButtonsEnabled(i % 2 === 0);
            }

            // Final state should be disabled (i=9, 9%2=1, so setTabButtonsEnabled(false) was last call)
            expect(getTabButtonSnapshots()).toMatchObject([
                { disabled: true, id: "tab-summary" },
                { disabled: true, id: "tab-chart" },
                { disabled: true, id: "tab-map" },
                { disabled: true, id: "tab-table" },
            ]);
            expect(
                getTabButtonSnapshots().flatMap((snapshot) => snapshot.classes)
            ).not.toContain("active-disabled");
        });
    });
});
