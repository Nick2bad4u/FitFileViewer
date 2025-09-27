import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Note: use relative path from this test folder to module under test
import * as theme from "../../../../../utils/theming/core/theme.js";

describe("utils/theming/core/theme.js - additional coverage", () => {
    const originalMatchMedia = globalThis.matchMedia as any;
    const originalElectronAPI = (globalThis as any).electronAPI;
    let originalGetComputedStyle: any;

    beforeEach(() => {
        document.body.className = "";
        document.head.innerHTML = "";
        // reset localStorage
        localStorage.clear();
        // restore matchMedia default
        (globalThis as any).matchMedia = originalMatchMedia;
        // restore electronAPI
        (globalThis as any).electronAPI = originalElectronAPI;
        // save getComputedStyle
        originalGetComputedStyle = (globalThis as any).getComputedStyle;
    });

    afterEach(() => {
        vi.useRealTimers();
        // restore getComputedStyle
        (globalThis as any).getComputedStyle = originalGetComputedStyle;
    });

    test("loadTheme returns saved value and falls back to dark on error", () => {
        localStorage.setItem("ffv-theme", "light");
        expect(theme.loadTheme()).toBe("light");

        // simulate localStorage throwing
        const badStorage = {
            getItem: vi.fn(() => {
                throw new Error("ls error");
            }),
        } as any;
        const original = (globalThis as any).localStorage;
        (globalThis as any).localStorage = badStorage;
        try {
            expect(theme.loadTheme()).toBe("dark");
        } finally {
            (globalThis as any).localStorage = original;
        }
    });

    test("applyTheme adds/removes classes, persists, dispatches event, updates meta", () => {
        const eventSpy = vi.fn();
        document.addEventListener("themechange", eventSpy);

        // withTransition=false avoids timer for first part
        theme.applyTheme("dark", false);
        expect(document.body.classList.contains("theme-dark")).toBe(true);
        expect(localStorage.getItem("ffv-theme")).toBe("dark");
    expect(eventSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

        // meta theme-color should exist and reflect dark
        const meta1 = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        expect(meta1).not.toBeNull();
        expect(meta1!.content).toBe("#181a20");

        // Now test transition path (adds transient class and removes it after timeout)
        vi.useFakeTimers();
        theme.applyTheme("light", true);
        expect(document.body.classList.contains("theme-transitioning")).toBe(true);
        // fast-forward timer
        vi.advanceTimersByTime(300);
        expect(document.body.classList.contains("theme-transitioning")).toBe(false);

        // meta updated for light
        const meta2 = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        expect(meta2).not.toBeNull();
        expect(meta2!.content).toBe("#f8fafc");
    });

    test("applyTheme auto uses getSystemTheme result", () => {
        // Configure environment so getSystemTheme() resolves to light
        (globalThis as any).matchMedia = () => ({ matches: false }) as any;
        theme.applyTheme(theme.THEME_MODES.AUTO, false);
        expect(document.body.classList.contains("theme-light")).toBe(true);
    });

    test("getEffectiveTheme respects auto and explicit values", () => {
        const spy = vi.spyOn(theme, "getSystemTheme").mockReturnValue("dark");
        expect(theme.getEffectiveTheme("auto")).toBe("dark");
        expect(theme.getEffectiveTheme("light")).toBe("light");
        // when theme not provided, uses loadTheme
        localStorage.setItem("ffv-theme", "light");
        expect(theme.getEffectiveTheme()).toBe("light");
        spy.mockRestore();
    });

    test("getSystemTheme uses matchMedia and falls back when unavailable", () => {
        // with matchMedia
        (globalThis as any).matchMedia = (query: string) => ({ matches: true }) as any;
        expect(theme.getSystemTheme()).toBe("dark");

        // without matchMedia
        (globalThis as any).matchMedia = undefined;
        expect(theme.getSystemTheme()).toBe("dark"); // fallback
    });

    test("getThemeConfig reads CSS variables and provides fallbacks", () => {
        // Provide getComputedStyle that returns values for our CSS vars
        const styles = new Map<string, string>([
            ["--color-bg", "#ffffff"],
            ["--color-fg", "#111111"],
            ["--color-accent", "#123456"],
            ["--color-border", "#eeeeee"],
        ]);
        (globalThis as any).getComputedStyle = () =>
            ({
                getPropertyValue: (k: string) => styles.get(k) || "",
            }) as any;

        const cfg: any = theme.getThemeConfig();
        expect(cfg).toBeDefined();
        expect(cfg.theme === "dark" || cfg.theme === "light").toBe(true);
        expect(cfg.colors.bg).toBe("#ffffff");
        expect(cfg.colors.fg).toBe("#111111");
        // ensure some computed fallback keys exist
        expect(typeof cfg.colors.chartBackground).toBe("string");
        expect(Array.isArray(cfg.colors.zoneColors)).toBe(true);
    });

    test("listenForSystemThemeChange returns undefined when matchMedia is unavailable", () => {
        (globalThis as any).matchMedia = undefined;
        const cleanup = theme.listenForSystemThemeChange();
        expect(cleanup).toBeUndefined();
    });

    test("listenForThemeChange hooks electronAPI and forwards theme", () => {
        const onSetTheme = vi.fn((cb: (t: string) => void) => cb("light"));
        const sendThemeChanged = vi.fn();
        (globalThis as any).electronAPI = { onSetTheme, sendThemeChanged };

        const onThemeChange = vi.fn();
        theme.listenForThemeChange(onThemeChange);
        expect(onSetTheme).toHaveBeenCalled();
        expect(onThemeChange).toHaveBeenCalledWith("light");
        expect(sendThemeChanged).toHaveBeenCalledWith("light");
    });

    test("toggleTheme flips between dark and light and updates DOM/storage", () => {
        localStorage.setItem("ffv-theme", "dark");
        theme.toggleTheme(false);
        // applyTheme should have persisted light and set class
        expect(localStorage.getItem("ffv-theme")).toBe("light");
        expect(document.body.classList.contains("theme-light")).toBe(true);
    });

    test("initializeTheme applies saved theme, sets up listener and injects CSS", () => {
        localStorage.setItem("ffv-theme", "dark");
        // Provide a minimal matchMedia impl so initializeTheme returns a cleanup function
        (globalThis as any).matchMedia = () =>
            ({
                addEventListener: () => {},
                removeEventListener: () => {},
                matches: true,
            }) as any;

        const cleanup = theme.initializeTheme();
        // body should reflect saved theme after initializeTheme
        expect(document.body.classList.contains("theme-dark")).toBe(true);
        // Style tag injected
        const styleEl = document.querySelector("#theme-transition-styles");
        expect(styleEl).not.toBeNull();
        // Cleanup is function
        expect(typeof cleanup).toBe("function");

        // Call cleanup to satisfy branch
        (cleanup as Function)();
    });
});
