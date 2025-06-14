import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { applyTheme, loadTheme, listenForThemeChange } from "../utils/theme";

describe("applyTheme", () => {
    beforeEach(() => {
        document.body.className = "";
        localStorage.clear();
    });
    it("should apply the correct theme class and persist it", () => {
        applyTheme("dark");
        expect(document.body.classList.contains("theme-dark")).toBe(true);
        expect(localStorage.getItem("ffv-theme")).toBe("dark");
        applyTheme("light");
        expect(document.body.classList.contains("theme-light")).toBe(true);
        expect(localStorage.getItem("ffv-theme")).toBe("light");
    });
});

describe("loadTheme", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("should return the persisted theme", () => {
        localStorage.setItem("ffv-theme", "light");
        expect(loadTheme()).toBe("light");
    });
    it("should return dark if no theme is set", () => {
        expect(loadTheme()).toBe("dark");
    });
});

describe("listenForThemeChange", () => {
    it("should call onThemeChange and sendThemeChanged if electronAPI is available", () => {
        const onThemeChange = vi.fn();
        window.electronAPI = {
            onSetTheme: (cb) => cb("dark"),
            sendThemeChanged: vi.fn(),
        };
        listenForThemeChange(onThemeChange);
        expect(onThemeChange).toHaveBeenCalledWith("dark");
        expect(window.electronAPI.sendThemeChanged).toHaveBeenCalledWith("dark");
    });
    it("should warn if electronAPI is not available", () => {
        window.electronAPI = undefined;
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        listenForThemeChange(vi.fn());
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
