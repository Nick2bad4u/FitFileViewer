import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupTheme } from "../utils/setupTheme";

describe("setupTheme", () => {
    let applyTheme, listenForThemeChange;
    beforeEach(() => {
        applyTheme = vi.fn();
        listenForThemeChange = vi.fn();
    });
    it("should use dark theme by default if electronAPI is not available", async () => {
        window.electronAPI = undefined;
        await setupTheme(applyTheme, listenForThemeChange);
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(listenForThemeChange).toHaveBeenCalledWith(applyTheme);
    });
    it("should use theme from electronAPI if available", async () => {
        window.electronAPI = { getTheme: vi.fn().mockResolvedValue("light") };
        await setupTheme(applyTheme, listenForThemeChange);
        expect(applyTheme).toHaveBeenCalledWith("light");
        expect(listenForThemeChange).toHaveBeenCalledWith(applyTheme);
    });
    it("should default to dark if electronAPI.getTheme throws", async () => {
        window.electronAPI = { getTheme: vi.fn().mockRejectedValue(new Error("fail")) };
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        await setupTheme(applyTheme, listenForThemeChange);
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(listenForThemeChange).toHaveBeenCalledWith(applyTheme);
        warn.mockRestore();
    });
});
