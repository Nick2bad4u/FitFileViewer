// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { openAccentColorPicker } from "../../../../ui/modals/accentColorPicker.js";

function requireElement<TElement extends Element>(
    selector: string,
    root: ParentNode = document
): TElement {
    const element = root.querySelector<TElement>(selector);
    if (!element) {
        throw new Error(`Expected ${selector} to exist`);
    }

    return element;
}

function setupFixture(): void {
    document.head.replaceChildren();
    document.body.replaceChildren();
    localStorage.clear();
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-theme");
}

describe("accentColorPicker", () => {
    it("creates the modal and updates accent controls", () => {
        expect.assertions(15);

        setupFixture();
        openAccentColorPicker();

        const modal = requireElement<HTMLDivElement>("#accent-color-modal"),
            customPicker = requireElement<HTMLInputElement>(
                "#custom-color-picker"
            ),
            customText = requireElement<HTMLInputElement>("#custom-color-text"),
            hex = requireElement<HTMLDivElement>("#accent-color-hex"),
            resetButton = requireElement<HTMLButtonElement>(
                "#accent-color-reset"
            ),
            presetButtons = [
                ...document.querySelectorAll<HTMLButtonElement>(
                    ".preset-color"
                ),
            ];

        expect(modal.style.display).toBe("block");
        expect(document.querySelectorAll("#accent-picker-styles")).toHaveLength(
            1
        );
        expect(presetButtons).toHaveLength(10);
        expect(hex.textContent).toBe("#3B82F6");
        expect(customPicker.value).toBe("#3b82f6");
        expect(customText.value).toBe("#3b82f6");
        expect(resetButton).toHaveProperty("disabled", true);
        expect(presetButtons[0]?.className).toContain("selected");

        customText.value = "#ef4444";
        customText.dispatchEvent(new Event("input", { bubbles: true }));

        expect(localStorage.getItem("ffv-accent-color")).toBe("#ef4444");
        expect(customPicker.value).toBe("#ef4444");
        expect(hex.textContent).toBe("#EF4444");
        expect(resetButton).toHaveProperty("disabled", false);
        expect(presetButtons[1]?.className).toContain("selected");

        resetButton.click();

        expect(localStorage).toHaveLength(0);
        expect(
            document.documentElement.style.getPropertyValue("--color-accent")
        ).toBe("#3b82f6");
    });

    it("ignores invalid custom color input", () => {
        expect.assertions(3);

        setupFixture();
        openAccentColorPicker();

        const customText =
                requireElement<HTMLInputElement>("#custom-color-text"),
            hex = requireElement<HTMLDivElement>("#accent-color-hex");

        customText.value = "#12345";
        customText.dispatchEvent(new Event("input", { bubbles: true }));

        expect(localStorage.getItem("ffv-accent-color")).not.toBe("#12345");
        expect(localStorage).toHaveLength(0);
        expect(hex.textContent).toBe("#3B82F6");
    });

    it("reuses an existing modal instead of duplicating it", () => {
        expect.assertions(3);

        setupFixture();
        openAccentColorPicker();
        const modal = requireElement<HTMLDivElement>("#accent-color-modal");
        modal.style.display = "none";

        openAccentColorPicker();

        expect(modal.style.display).toBe("block");
        expect(document.querySelectorAll("#accent-color-modal")).toHaveLength(
            1
        );
        expect(document.querySelectorAll("#accent-picker-styles")).toHaveLength(
            1
        );
    });
});
