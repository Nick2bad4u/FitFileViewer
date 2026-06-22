import { describe, expect, it, vi } from "vitest";

type AccentColorModule =
    typeof import("../../../../../electron-app/utils/theming/core/accentColor.js");

describe("accentColor", () => {
    it("generates deterministic dark-theme color variations", async () => {
        expect.assertions(5);

        resetTestState();

        const { generateAccentColorVariations } = await importAccentColor();
        const variations = generateAccentColorVariations("#336699", "dark");

        expect(variations.accent).toBe("#336699");
        expect(variations.accentRgb).toBe("51, 102, 153");
        expect(variations.accentSecondary).toBe("#2e5c8a");
        expect(variations.btnBg).toContain("#336699");
        expect(variations.svgIconStroke).toBe("#7094b8");
    });

    it("saves, loads, and clears stored accent colors", async () => {
        expect.assertions(6);

        resetTestState();

        const {
            clearAccentColor,
            getEffectiveAccentColor,
            loadAccentColor,
            saveAccentColor,
        } = await importAccentColor();

        expect({ saved: saveAccentColor("#abcdef") }).toStrictEqual({
            saved: true,
        });
        expect(localStorage.getItem("ffv-accent-color")).toBe("#abcdef");
        expect(loadAccentColor()).toBe("#abcdef");
        expect(getEffectiveAccentColor("light")).toBe("#abcdef");
        expect({ cleared: clearAccentColor() }).toStrictEqual({
            cleared: true,
        });
        expect(loadAccentColor()).toBeNull();
    });

    it("applies accent variables to root and body", async () => {
        expect.assertions(5);

        resetTestState();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const { applyAccentColor } = await importAccentColor();
            applyAccentColor("#123456", "light");

            expect(
                document.documentElement.style.getPropertyValue(
                    "--color-accent"
                )
            ).toBe("#123456");
            expect(document.body.style.getPropertyValue("--color-accent")).toBe(
                "#123456"
            );
            expect(
                document.body.style.getPropertyValue("--color-accent-rgb")
            ).toBe("18, 52, 86");
            expect(
                document.body.style.getPropertyValue("--color-btn-bg-solid")
            ).toBe("#123456");
            expect(logSpy).toHaveBeenCalledWith(
                "[AccentColor] Applied accent color: #123456 for light theme"
            );
        } finally {
            logSpy.mockRestore();
        }
    });

    it("falls back to the theme default for invalid colors", async () => {
        expect.assertions(4);

        resetTestState();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {}),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const {
                applyAccentColor,
                getDefaultAccentColor,
                isValidHexColor,
                setAccentColor,
            } = await importAccentColor();

            expect({ valid: isValidHexColor("not-a-color") }).toStrictEqual({
                valid: false,
            });
            expect({
                applied: setAccentColor("not-a-color", "dark"),
            }).toStrictEqual({ applied: false });

            applyAccentColor("not-a-color", "dark");

            expect(document.body.style.getPropertyValue("--color-accent")).toBe(
                getDefaultAccentColor("dark")
            );
            expect(warnSpy).toHaveBeenCalledWith(
                "[AccentColor] Invalid color, using default"
            );
        } finally {
            warnSpy.mockRestore();
            logSpy.mockRestore();
        }
    });

    it("handles unavailable runtime storage and DOM targets without direct browser fallbacks", async () => {
        expect.assertions(5);

        resetTestState();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const {
                applyAccentColor,
                clearAccentColor,
                loadAccentColor,
                saveAccentColor,
            } = await importAccentColor();
            const runtimeWithoutBrowserState = {
                getAccentColorTargets: () => [],
                getStorage: () => undefined,
            };

            applyAccentColor("#123456", "light", runtimeWithoutBrowserState);

            expect(clearAccentColor(runtimeWithoutBrowserState)).toBe(false);
            expect(loadAccentColor(runtimeWithoutBrowserState)).toBeNull();
            expect(saveAccentColor("#abcdef", runtimeWithoutBrowserState)).toBe(
                false
            );
            expect(document.body.style.getPropertyValue("--color-accent")).toBe(
                ""
            );
            expect(logSpy).toHaveBeenCalledWith(
                "[AccentColor] Applied accent color: #123456 for light theme"
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});

async function importAccentColor(): Promise<AccentColorModule> {
    return import("../../../../../electron-app/utils/theming/core/accentColor.js");
}

function resetTestState(): void {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("style");
    document.body.removeAttribute("style");
    document.body.textContent = "";
}
