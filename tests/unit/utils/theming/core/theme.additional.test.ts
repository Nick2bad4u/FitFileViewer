import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Note: use relative path from this test folder to module under test
import * as theme from "../../../../../electron-app/utils/theming/core/theme.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function getBodyClasses(): string[] {
    return [...document.body.classList];
}

type TestGlobalProperty = "getComputedStyle" | "localStorage" | "matchMedia";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function getRestoreDescriptor(name: TestGlobalProperty): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, name) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        originalGlobalDescriptors.set(name, getRestoreDescriptor(name));
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

describe("utils/theming/core/theme.js - additional coverage", () => {
    const originalMatchMedia = Reflect.get(globalThis, "matchMedia") as
        | typeof globalThis.matchMedia
        | undefined;

    beforeEach(() => {
        document.body.className = "";
        document.head.innerHTML = "";
        // reset localStorage
        localStorage.clear();
        // restore matchMedia default
        setTestGlobal("matchMedia", originalMatchMedia);
    });

    afterEach(() => {
        vi.useRealTimers();
        restoreTestGlobals();
    });

    it("loadTheme returns saved value and falls back to dark on error", () => {
        expect.assertions(2);

        localStorage.setItem("ffv-theme", "light");
        expect(theme.loadTheme()).toBe("light");

        // simulate localStorage throwing
        const badStorage = {
            getItem: vi.fn<() => string | null>(() => {
                throw new Error("ls error");
            }),
        } as Storage;
        setTestGlobal("localStorage", badStorage);
        expect(theme.loadTheme()).toBe("dark");
    });

    it("applyTheme adds/removes classes, persists, dispatches event, updates meta", () => {
        expect.assertions(9);

        const listenerController = new AbortController();
        const eventSpy = vi.fn<(event: Event) => void>();
        document.addEventListener("themechange", eventSpy, {
            signal: listenerController.signal,
        });

        // withTransition=false avoids timer for first part
        theme.applyTheme("dark", false);
        listenerController.abort();
        expect(getBodyClasses()).toContain("theme-dark");
        expect(localStorage.getItem("ffv-theme")).toBe("dark");
        expect(eventSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

        // meta theme-color should exist and reflect dark
        const meta1 = document.querySelector(
            'meta[name="theme-color"]'
        ) as HTMLMetaElement | null;
        expect(meta1).toBeInstanceOf(HTMLMetaElement);
        expect(meta1?.content).toBe("#181a20");

        // Now test transition path (adds transient class and removes it after timeout)
        vi.useFakeTimers();
        theme.applyTheme("light", true);
        expect(getBodyClasses()).toContain("theme-transitioning");
        // fast-forward timer
        vi.advanceTimersByTime(300);
        expect(getBodyClasses()).not.toContain("theme-transitioning");

        // meta updated for light
        const meta2 = document.querySelector(
            'meta[name="theme-color"]'
        ) as HTMLMetaElement | null;
        expect(meta2).toBeInstanceOf(HTMLMetaElement);
        expect(meta2?.content).toBe("#f8fafc");
    });

    it("applyTheme auto uses getSystemTheme result", () => {
        expect.assertions(1);

        // Configure environment so getSystemTheme() resolves to light
        setTestGlobal("matchMedia", () => ({ matches: false }));
        theme.applyTheme(theme.THEME_MODES.AUTO, false);
        expect(getBodyClasses()).toContain("theme-light");
    });

    it("getEffectiveTheme respects auto and explicit values", () => {
        expect.assertions(3);

        const spy = vi.spyOn(theme, "getSystemTheme").mockReturnValue("dark");
        expect(theme.getEffectiveTheme("auto")).toBe("dark");
        expect(theme.getEffectiveTheme("light")).toBe("light");
        // when theme not provided, uses loadTheme
        localStorage.setItem("ffv-theme", "light");
        expect(theme.getEffectiveTheme()).toBe("light");
        spy.mockRestore();
    });

    it("getSystemTheme uses matchMedia and falls back when unavailable", () => {
        expect.assertions(2);

        // with matchMedia
        setTestGlobal("matchMedia", (_query: string) => ({
            matches: false,
        }));
        expect(theme.getSystemTheme()).toBe("light");

        // without matchMedia
        setTestGlobal("matchMedia", undefined);
        expect(theme.getSystemTheme()).toBe("dark"); // fallback
    });

    it("getThemeConfig reads CSS variables and provides fallbacks", () => {
        expect.assertions(5);

        // Provide getComputedStyle that returns values for our CSS vars
        const styles = new Map<string, string>([
            ["--color-bg", "#ffffff"],
            ["--color-fg", "#111111"],
            ["--color-accent", "#123456"],
            ["--color-border", "#eeeeee"],
        ]);
        setTestGlobal("getComputedStyle", () => ({
            getPropertyValue: (k: string) => styles.get(k) || "",
        }));

        const cfg: any = theme.getThemeConfig();
        expect(cfg).toMatchObject({
            colors: {
                accent: "#123456",
                bg: "#ffffff",
                border: "#eeeeee",
                fg: "#111111",
            },
            isDark: true,
            isLight: false,
            theme: "dark",
        });
        expect(cfg.colors.bg).toBe("#ffffff");
        expect(cfg.colors.fg).toBe("#111111");
        // ensure some computed fallback keys exist
        expect(cfg.colors.chartBackground).toBeTypeOf("string");
        expect(cfg.colors.zoneColors).toBeInstanceOf(Array);
    });

    it("listenForSystemThemeChange returns undefined when matchMedia is unavailable", () => {
        expect.assertions(1);

        setTestGlobal("matchMedia", undefined);
        const cleanup = theme.listenForSystemThemeChange();
        expect(cleanup).toBeUndefined();
    });

    it("listenForThemeChange hooks electronAPI and forwards theme", () => {
        expect.assertions(4);

        const onSetTheme = vi.fn<(callback: (theme: string) => void) => void>(
            (callback) => {
                callback("light");
            }
        );
        const sendThemeChanged = vi.fn<(theme: string) => void>();
        const electronApiScope = createElectronApiScope({
            onSetTheme,
            sendThemeChanged,
        });

        const observedThemes: string[] = [];
        const onThemeChange = (nextTheme: string) => {
            observedThemes.push(nextTheme);
            document.body.dataset["receivedTheme"] = nextTheme;
        };
        theme.listenForThemeChange(onThemeChange, { electronApiScope });
        expect(onSetTheme).toHaveBeenCalledWith(expect.any(Function));
        expect(observedThemes).toEqual(["light"]);
        expect(document.body.dataset["receivedTheme"]).toBe("light");
        expect(sendThemeChanged).toHaveBeenCalledWith("light");
    });

    it("toggleTheme flips between dark and light and updates DOM/storage", () => {
        expect.assertions(2);

        localStorage.setItem("ffv-theme", "dark");
        theme.toggleTheme(false);
        // applyTheme should have persisted light and set class
        expect(localStorage.getItem("ffv-theme")).toBe("light");
        expect(getBodyClasses()).toContain("theme-light");
    });

    it("initializeTheme applies saved theme, sets up listener and injects CSS", () => {
        expect.assertions(4);

        localStorage.setItem("ffv-theme", "dark");
        // Provide a minimal matchMedia impl so initializeTheme returns a cleanup function
        setTestGlobal("matchMedia", () => ({
            addEventListener: () => {},
            matches: true,
            removeEventListener: () => {},
        }));

        const cleanup = theme.initializeTheme();
        // body should reflect saved theme after initializeTheme
        expect(getBodyClasses()).toContain("theme-dark");
        // Style tag injected
        const styleEl = document.querySelector("#theme-transition-styles");
        expect(styleEl).toBeInstanceOf(HTMLStyleElement);
        expect(styleEl?.textContent).toContain(".theme-transitioning");
        // Cleanup is function
        expect(cleanup).toBeTypeOf("function");

        // Call cleanup to satisfy branch
        (cleanup as VoidFunction)();
    });
});
