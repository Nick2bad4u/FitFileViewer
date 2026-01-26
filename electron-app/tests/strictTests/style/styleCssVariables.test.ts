/**
 * @fileoverview Guards for core theme CSS variables and base body styles.
 * Ensures theme variables exist so the UI does not render unstyled.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Load the main stylesheet used by the renderer.
 * @returns {string}
 */
const loadStyleSheet = () => {
    const stylePath = resolve(__dirname, "../../../style.css");
    return readFileSync(stylePath, "utf-8");
};

describe("style.css theme variables", () => {
    it("defines root theme variables before light overrides", () => {
        const styleText = loadStyleSheet();
        const rootIndex = styleText.indexOf(":root");
        const lightIndex = styleText.indexOf("body.theme-light");

        expect(rootIndex).toBeGreaterThan(-1);
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
        const styleText = loadStyleSheet();
        const lightIndex = styleText.indexOf("body.theme-light");

        expect(lightIndex).toBeGreaterThan(-1);
        expect(styleText).toContain("--color-bg:");
        expect(styleText).toContain("--color-fg:");
        expect(styleText).toContain("--color-accent-rgb:");
        expect(styleText).toContain("background-color: #f8fafc");
    });

    it("defines base body styles and font size helpers", () => {
        const styleText = loadStyleSheet();
        const bodyMatch = styleText.match(/(^|\n)body\s*\{/);
        const beforeIndex = styleText.indexOf("body::before");

        expect(bodyMatch).not.toBeNull();
        const bodyIndex = bodyMatch?.index ?? -1;
        expect(bodyIndex).toBeGreaterThan(-1);
        expect(beforeIndex).toBeGreaterThan(bodyIndex);

        const baseBodySegment = styleText.slice(bodyIndex, beforeIndex);
        expect(baseBodySegment).toContain("font-family: var(--font-sans)");
        expect(baseBodySegment).toContain("background: var(--color-bg)");

        expect(styleText).toContain(".font-small");
        expect(styleText).toContain(".font-xsmall");
        expect(styleText).toContain(".font-xlarge");
        expect(styleText).toContain(".high-contrast");
    });
});
