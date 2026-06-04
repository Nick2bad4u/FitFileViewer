// Guards core theme CSS variables and base body styles so the UI does not
// render unstyled.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

// Load the main stylesheet used by the renderer.
const loadStyleSheet = () => {
    const stylePath = resolve(process.cwd(), "static/app/style.css");
    return readFileSync(stylePath, "utf-8");
};

const getRuleBlock = (styleText: string, selector: string): string => {
    const selectorIndex = styleText.indexOf(selector);
    if (selectorIndex === -1) {
        return "";
    }

    const openIndex = styleText.indexOf("{", selectorIndex);
    const closeIndex = styleText.indexOf("}", openIndex);

    return openIndex === -1 || closeIndex === -1
        ? ""
        : styleText.slice(openIndex, closeIndex + 1);
};

describe("style.css theme variables", () => {
    it("defines root theme variables before light overrides", () => {
        expect.assertions(8);

        const styleText = loadStyleSheet();
        const rootIndex = styleText.indexOf(":root");
        const lightIndex = styleText.indexOf("body.theme-light");

        expect(rootIndex).not.toBe(-1);
        expect(lightIndex).toBeGreaterThan(rootIndex);

        const colorBgIndex = styleText.indexOf("--color-bg:", rootIndex);
        const fontIndex = styleText.indexOf("--font-sans:", rootIndex);
        const accentIndex = styleText.indexOf("--color-accent:", rootIndex);

        expect(colorBgIndex).toBeGreaterThan(rootIndex);
        expect(colorBgIndex).toBeLessThan(lightIndex);
        expect(fontIndex).toBeGreaterThan(rootIndex);
        expect(fontIndex).toBeLessThan(lightIndex);
        expect(accentIndex).toBeGreaterThan(rootIndex);
        expect(accentIndex).toBeLessThan(lightIndex);
    });

    it("includes light theme overrides and background styling", () => {
        expect.assertions(5);

        const styleText = loadStyleSheet();
        const lightIndex = styleText.indexOf("body.theme-light");

        expect(lightIndex).not.toBe(-1);
        expect(styleText).toContain("--color-bg:");
        expect(styleText).toContain("--color-fg:");
        expect(styleText).toContain("--color-accent-rgb:");
        expect(styleText).toContain("background-color: #f8fafc");
    });

    it("uses modern RGB tuple syntax for accent alpha styles", () => {
        expect.assertions(4);

        const styleText = loadStyleSheet();
        const rgbVariableLines = styleText
            .split("\n")
            .filter((line) => line.includes("-rgb:"));

        expect(styleText).toContain("--color-accent-rgb: 59 130 246;");
        expect(styleText).toContain("--color-accent-rgb: 37 99 235;");
        expect(rgbVariableLines.some((line) => line.includes(","))).toBe(false);
        expect(styleText).not.toContain("rgb(var(--color-accent-rgb),");
    });

    it("keeps visible focus indicators on key action buttons", () => {
        expect.assertions(3);

        const styleText = loadStyleSheet();
        const themedButtonFocusRule = getRuleBlock(
            styleText,
            ".themed-btn:hover,\n.themed-btn:focus"
        );
        const summaryGearFocusRule = getRuleBlock(
            styleText,
            ".summary-gear-btn:hover,\n.summary-gear-btn:focus"
        );

        expect(themedButtonFocusRule).not.toContain("outline: none");
        expect(summaryGearFocusRule).not.toContain("outline: none");
        expect(styleText).toContain("button:focus-visible,\ninput:focus-visible");
    });

    it("defines base body styles and font size helpers", () => {
        expect.assertions(9);

        const styleText = loadStyleSheet();
        const bodyIndex = styleText.search(/(^|\n)body\s*\{/);
        const beforeIndex = styleText.indexOf("body::before");

        expect(bodyIndex).not.toBe(-1);
        expect(beforeIndex).toBeGreaterThan(bodyIndex);

        const baseBodySegment = styleText.slice(bodyIndex, beforeIndex);
        expect(baseBodySegment).toContain("font-family: var(--font-sans)");
        expect(baseBodySegment).toContain("background: var(--color-bg)");
        expect(baseBodySegment).not.toContain("body::before");

        expect(styleText).toContain(".font-small");
        expect(styleText).toContain(".font-xsmall");
        expect(styleText).toContain(".font-xlarge");
        expect(styleText).toContain(".high-contrast");
    });
});
