// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { openAccentColorPicker } from "../../../../electron-app/ui/modals/accentColorPicker.js";

const EXPECTED_PRESET_COLORS = [
    { hex: "#3b82f6", name: "Blue" },
    { hex: "#ef4444", name: "Red" },
    { hex: "#22c55e", name: "Green" },
    { hex: "#f59e0b", name: "Amber" },
    { hex: "#8b5cf6", name: "Purple" },
    { hex: "#ec4899", name: "Pink" },
    { hex: "#06b6d4", name: "Cyan" },
    { hex: "#f97316", name: "Orange" },
    { hex: "#14b8a6", name: "Teal" },
    { hex: "#6366f1", name: "Indigo" },
] as const;

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

function getPresetButtonStates(): {
    ariaPressed: string | null;
    className: string;
    hex: string | undefined;
    selected: boolean;
    title: string;
    type: string;
}[] {
    return [
        ...document.querySelectorAll<HTMLButtonElement>(".preset-color"),
    ].map((button) => ({
        ariaPressed: button.getAttribute("aria-pressed"),
        className: button.className,
        hex: button.dataset["hex"],
        selected: button.classList.contains("selected"),
        title: button.title,
        type: button.type,
    }));
}

function createExpectedPresetButtonStates(selectedHex: string) {
    return EXPECTED_PRESET_COLORS.map((preset) => ({
        ariaPressed: String(preset.hex === selectedHex),
        className:
            preset.hex === selectedHex
                ? "preset-color selected"
                : "preset-color",
        hex: preset.hex,
        selected: preset.hex === selectedHex,
        title: preset.name,
        type: "button",
    }));
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
        expect(getPresetButtonStates()).toStrictEqual(
            createExpectedPresetButtonStates("#3b82f6")
        );

        customText.value = "#ef4444";
        customText.dispatchEvent(new Event("input", { bubbles: true }));

        expect(localStorage.getItem("ffv-accent-color")).toBe("#ef4444");
        expect(customPicker.value).toBe("#ef4444");
        expect(hex.textContent).toBe("#EF4444");
        expect(resetButton).toHaveProperty("disabled", false);
        expect(getPresetButtonStates()).toStrictEqual(
            createExpectedPresetButtonStates("#ef4444")
        );

        resetButton.click();

        expect(Object.keys(localStorage)).toStrictEqual([]);
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
        expect({
            storedAccent: localStorage.getItem("ffv-accent-color"),
            storageKeys: Object.keys(localStorage),
        }).toStrictEqual({
            storedAccent: null,
            storageKeys: [],
        });
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

    it("uses dialog semantics, closes on Escape, and restores focus", () => {
        expect.assertions(9);

        setupFixture();
        const opener = document.createElement("button");
        opener.type = "button";
        opener.textContent = "Open accent colors";
        document.body.append(opener);
        opener.focus();

        openAccentColorPicker();

        const modal = requireElement<HTMLDivElement>("#accent-color-modal"),
            close = requireElement<HTMLButtonElement>("#accent-picker-close"),
            title = requireElement<HTMLHeadingElement>("#accent-picker-title");

        expect(modal.getAttribute("role")).toBe("dialog");
        expect(modal.getAttribute("aria-modal")).toBe("true");
        expect(modal.getAttribute("aria-labelledby")).toBe(
            "accent-picker-title"
        );
        expect(title.textContent).toBe("Customize Accent Color");
        expect(close.getAttribute("aria-label")).toBe(
            "Close accent color picker"
        );
        expect(document.activeElement).toBe(close);

        document.dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
        );

        expect(modal.style.display).toBe("none");
        expect(modal.getAttribute("aria-hidden")).toBe("true");
        expect(document.activeElement).toBe(opener);
    });
});
