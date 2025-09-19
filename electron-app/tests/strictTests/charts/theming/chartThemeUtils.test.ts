import { describe, it, expect, beforeEach, vi } from "vitest";

const modPath = "../../../../utils/charts/theming/chartThemeUtils.js";
const themeModulePath = "../../../../utils/theming/core/theme.js";

function setMatchMedia(dark: boolean | null) {
    if (dark === null) {
        // Remove matchMedia entirely
        delete (window as any).matchMedia;
        return;
    }
    (window as any).matchMedia = (query: string) => ({
        matches: dark ?? false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

describe("detectCurrentTheme", () => {
    beforeEach(() => {
        document.body.className = "";
        document.body.innerHTML = "";
        localStorage.clear();
        setMatchMedia(null);
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("returns dark when body has theme-dark class", async () => {
        document.body.classList.add("theme-dark");
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("dark");
    });

    it("returns light when body has theme-light class", async () => {
        document.body.classList.add("theme-light");
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("light");
    });

    it("uses getEffectiveTheme when available", async () => {
        vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => "dark" }));
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("dark");
    });

    it("falls back to localStorage when getEffectiveTheme throws", async () => {
        vi.doMock(themeModulePath, () => ({
            getEffectiveTheme: () => {
                throw new Error("boom");
            },
        }));
        localStorage.setItem("ffv-theme", "light");
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("light");
    });

    it("resolves auto to system dark via matchMedia", async () => {
        vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => null }));
        localStorage.setItem("ffv-theme", "auto");
        setMatchMedia(true);
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("dark");
    });

    it("resolves auto to system light via matchMedia false", async () => {
        vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => null }));
        localStorage.setItem("ffv-theme", "auto");
        setMatchMedia(false);
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("light");
    });

    it("uses system preference fallback when no storage and no classes", async () => {
        vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => undefined }));
        setMatchMedia(true);
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("dark");
    });

    it("final fallback returns light when everything else unavailable", async () => {
        // Throw on localStorage access
        const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("ls-fail");
        });
        vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => undefined }));
        setMatchMedia(null);
        const { detectCurrentTheme } = await import(modPath);
        expect(detectCurrentTheme()).toBe("light");
        getItemSpy.mockRestore();
    });
});
