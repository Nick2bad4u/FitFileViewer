/**
 * @fileoverview Tests for Settings Modal
 * Comprehensive test coverage for settings modal functionality
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
const mockGetEffectiveAccentColor = vi.fn();
const mockIsValidHexColor = vi.fn();
const mockResetAccentColor = vi.fn();
const mockSetAccentColor = vi.fn();
const mockApplyTheme = vi.fn();
const mockGetEffectiveTheme = vi.fn();
const mockLoadTheme = vi.fn();
const mockAddEventListenerWithCleanup = vi.fn();
const mockInjectModalStyles = vi.fn();

vi.mock("../../../../utils/theming/core/accentColor.js", () => ({
    getEffectiveAccentColor: mockGetEffectiveAccentColor,
    isValidHexColor: mockIsValidHexColor,
    resetAccentColor: mockResetAccentColor,
    setAccentColor: mockSetAccentColor,
}));

vi.mock("../../../../utils/theming/core/theme.js", () => ({
    applyTheme: mockApplyTheme,
    getEffectiveTheme: mockGetEffectiveTheme,
    loadTheme: mockLoadTheme,
    THEME_MODES: {
        AUTO: "auto",
        DARK: "dark",
        LIGHT: "light",
    },
}));

vi.mock("../../../../utils/ui/events/eventListenerManager.js", () => ({
    addEventListenerWithCleanup: mockAddEventListenerWithCleanup,
}));

vi.mock("../../../../utils/ui/modals/injectModalStyles.js", () => ({
    injectModalStyles: mockInjectModalStyles,
}));

describe("settingsModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        document.body.innerHTML = "";
        document.head.innerHTML = "";

        // Execute RAF callbacks immediately
        (globalThis as any).requestAnimationFrame = (cb: (t: number) => void) => {
            cb(0);
            return 1 as any;
        };

        // Setup default mock implementations
        mockLoadTheme.mockReturnValue("auto");
        mockGetEffectiveTheme.mockReturnValue("dark");
        mockGetEffectiveAccentColor.mockReturnValue("#3b82f6");
        mockIsValidHexColor.mockReturnValue(true);
        mockResetAccentColor.mockReturnValue("#3b82f6");

        // Mock addEventListenerWithCleanup to actually add event listeners
        mockAddEventListenerWithCleanup.mockImplementation((element, event, handler) => {
            element.addEventListener(event, handler);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        vi.resetModules();
    });

    const loadModule = async () => {
        return await import("../../../../utils/ui/settingsModal.js");
    };

    describe("closeSettingsModal", () => {
        it("should close the modal if it exists", async () => {
            const module = await loadModule();

            const modal = document.createElement("div");
            modal.id = "settings-modal";
            modal.classList.add("show");
            modal.style.display = "flex";
            document.body.append(modal);

            module.closeSettingsModal();

            expect(modal.classList.contains("show")).toBe(false);

            // Advance timers to complete the animation
            vi.advanceTimersByTime(350);
            expect(modal.style.display).toBe("none");
        });

        it("should do nothing if modal doesn't exist", async () => {
            const module = await loadModule();

            expect(() => module.closeSettingsModal()).not.toThrow();
        });
    });

    describe("showSettingsModal", () => {
        it("should create modal if it doesn't exist", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            expect(modal).toBeTruthy();
            expect(modal?.classList.contains("modal")).toBe(true);
            expect(mockInjectModalStyles).toHaveBeenCalled();
        });

        it("should reuse existing modal", async () => {
            const module = await loadModule();

            // First call creates modal
            await module.showSettingsModal();
            const firstModal = document.getElementById("settings-modal");

            // Second call should reuse
            await module.showSettingsModal();
            const secondModal = document.getElementById("settings-modal");

            expect(firstModal).toBe(secondModal);
        });

        it("should load current theme and accent color", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            expect(mockLoadTheme).toHaveBeenCalled();
            expect(mockGetEffectiveTheme).toHaveBeenCalledWith("auto");
            expect(mockGetEffectiveAccentColor).toHaveBeenCalledWith("dark");
        });

        it("should set modal content with current settings", async () => {
            const module = await loadModule();

            mockLoadTheme.mockReturnValue("dark");
            mockGetEffectiveAccentColor.mockReturnValue("#ff5733");

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            expect(modal?.innerHTML).toContain("Settings");
            expect(modal?.innerHTML).toContain("#ff5733");
        });

        it("should show modal with animation", async () => {
            const module = await loadModule();

            const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb: any) => {
                cb();
                return 0;
            });

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            expect(modal?.style.display).toBe("flex");
            expect(modal?.classList.contains("show")).toBe(true);

            rafSpy.mockRestore();
        });

        it("should inject settings modal styles", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const styleElement = document.getElementById("settings-modal-styles");
            expect(styleElement).toBeTruthy();
            expect(styleElement?.tagName).toBe("STYLE");
        });

        it("should not inject styles multiple times", async () => {
            const module = await loadModule();

            await module.showSettingsModal();
            const firstStyleElement = document.getElementById("settings-modal-styles");

            await module.showSettingsModal();
            const secondStyleElement = document.getElementById("settings-modal-styles");

            expect(firstStyleElement).toBe(secondStyleElement);
            expect(document.querySelectorAll("#settings-modal-styles").length).toBe(1);
        });

        it("should setup close button handler", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            expect(mockAddEventListenerWithCleanup).toHaveBeenCalledWith(
                expect.any(HTMLElement),
                "click",
                expect.any(Function)
            );
        });

        it("should close modal when close button is clicked", async () => {
            const module = await loadModule();

            // Use actual event listeners
            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            const closeBtn = modal?.querySelector("#settings-modal-close");

            expect(closeBtn).toBeTruthy();

            (closeBtn as HTMLElement).click();

            expect(modal?.classList.contains("show")).toBe(false);
        });

        it("should close modal when footer close button is clicked", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            const closeBtn = modal?.querySelector("#settings-close-btn");

            (closeBtn as HTMLElement).click();

            expect(modal?.classList.contains("show")).toBe(false);
        });

        it("should close modal when clicking backdrop", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");

            const event = new MouseEvent("click", { bubbles: true });
            Object.defineProperty(event, "target", { value: modal, writable: false });

            modal?.dispatchEvent(event);

            expect(modal?.classList.contains("show")).toBe(false);
        });

        it("should close modal when pressing Escape key", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");

            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            const preventDefaultSpy = vi.spyOn(escapeEvent, "preventDefault");

            document.dispatchEvent(escapeEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(modal?.classList.contains("show")).toBe(false);
        });

        it("should handle theme selection change", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;
            expect(themeSelect).toBeTruthy();

            themeSelect.value = "light";
            themeSelect.dispatchEvent(new Event("change", { bubbles: true }));

            expect(mockApplyTheme).toHaveBeenCalledWith("light", true);
            expect(mockGetEffectiveTheme).toHaveBeenCalledWith("light");
        });

        it("should reapply accent color when theme changes", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            mockGetEffectiveTheme.mockReturnValueOnce("dark").mockReturnValueOnce("light");

            await module.showSettingsModal();

            const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;
            const colorPicker = document.getElementById("accent-color-picker") as HTMLInputElement;

            colorPicker.value = "#ff5733";
            themeSelect.value = "light";
            themeSelect.dispatchEvent(new Event("change", { bubbles: true }));

            expect(mockSetAccentColor).toHaveBeenCalledWith("#ff5733", "light");
        });

        it("should sync color picker with text input", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const colorPicker = document.getElementById("accent-color-picker") as HTMLInputElement;
            const colorText = document.getElementById("accent-color-text") as HTMLInputElement;

            expect(colorPicker).toBeTruthy();
            expect(colorText).toBeTruthy();

            colorPicker.value = "#ff5733";
            colorPicker.dispatchEvent(new Event("input", { bubbles: true }));

            expect(colorText.value).toBe("#ff5733");
            expect(mockSetAccentColor).toHaveBeenCalledWith("#ff5733", "dark");
        });

        it("should sync text input with color picker", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const colorPicker = document.getElementById("accent-color-picker") as HTMLInputElement;
            const colorText = document.getElementById("accent-color-text") as HTMLInputElement;

            colorText.value = "#ff5733";
            colorText.dispatchEvent(new Event("input", { bubbles: true }));

            expect(colorPicker.value).toBe("#ff5733");
            expect(mockSetAccentColor).toHaveBeenCalledWith("#ff5733", "dark");
        });

        it("should auto-add # to color text input if missing", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            await module.showSettingsModal();

            const colorText = document.getElementById("accent-color-text") as HTMLInputElement;

            colorText.value = "ff5733";
            colorText.dispatchEvent(new Event("input", { bubbles: true }));

            expect(colorText.value).toBe("#ff5733");
        });

        it("should not set invalid color", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            mockIsValidHexColor.mockReturnValue(false);

            await module.showSettingsModal();

            const colorText = document.getElementById("accent-color-text") as HTMLInputElement;

            mockSetAccentColor.mockClear();
            colorText.value = "invalid";
            colorText.dispatchEvent(new Event("input", { bubbles: true }));

            expect(mockSetAccentColor).not.toHaveBeenCalled();
        });

        it("should handle reset accent color button", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            mockResetAccentColor.mockReturnValue("#3b82f6");

            await module.showSettingsModal();

            const resetBtn = document.getElementById("reset-accent-color") as HTMLButtonElement;
            const colorPicker = document.getElementById("accent-color-picker") as HTMLInputElement;
            const colorText = document.getElementById("accent-color-text") as HTMLInputElement;

            // Change color first
            colorPicker.value = "#ff5733";
            colorText.value = "#ff5733";

            // Click reset
            resetBtn.click();

            expect(mockResetAccentColor).toHaveBeenCalledWith("dark");
            expect(colorPicker.value).toBe("#3b82f6");
            expect(colorText.value).toBe("#3b82f6");
        });

        it("should render correct theme options with current selection", async () => {
            const module = await loadModule();

            mockLoadTheme.mockReturnValue("light");

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");
            const themeSelect = modal?.querySelector("#theme-select") as HTMLSelectElement;

            expect(themeSelect).toBeTruthy();

            const options = Array.from(themeSelect.options);
            expect(options.length).toBe(3);
            expect(options.map((opt) => opt.value)).toEqual(["auto", "dark", "light"]);

            const selectedOption = options.find((opt) => opt.selected);
            expect(selectedOption?.value).toBe("light");
        });

        it("should expose functions globally", async () => {
            await loadModule();

            expect((globalThis as any).showSettingsModal).toBeDefined();
            expect((globalThis as any).closeSettingsModal).toBeDefined();
        });

        it("should not setup handlers for missing elements", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");

            // Remove elements
            modal?.querySelector("#settings-modal-close")?.remove();
            modal?.querySelector("#settings-close-btn")?.remove();
            modal?.querySelector("#theme-select")?.remove();
            modal?.querySelector("#accent-color-picker")?.remove();
            modal?.querySelector("#accent-color-text")?.remove();
            modal?.querySelector("#reset-accent-color")?.remove();

            // Re-show modal (which will try to setup handlers)
            await module.showSettingsModal();

            // Should not throw errors
            expect(modal).toBeTruthy();
        });

        it("should handle theme change without reapplying color if invalid", async () => {
            const module = await loadModule();

            mockAddEventListenerWithCleanup.mockImplementation((el, event, handler) => {
                el.addEventListener(event, handler);
            });

            mockIsValidHexColor.mockReturnValue(false);

            await module.showSettingsModal();

            const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;
            const colorPicker = document.getElementById("accent-color-picker") as HTMLInputElement;

            colorPicker.value = "invalid";
            mockSetAccentColor.mockClear();

            themeSelect.value = "light";
            themeSelect.dispatchEvent(new Event("change", { bubbles: true }));

            expect(mockApplyTheme).toHaveBeenCalledWith("light", true);
            expect(mockSetAccentColor).not.toHaveBeenCalledWith("invalid", expect.anything());
        });

        it("should create modal with proper structure", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");

            // Check structure
            expect(modal?.querySelector(".modal-backdrop")).toBeTruthy();
            expect(modal?.querySelector(".modal-content")).toBeTruthy();
            expect(modal?.querySelector(".modal-header")).toBeTruthy();
            expect(modal?.querySelector(".modal-body")).toBeTruthy();
            expect(modal?.querySelector(".modal-title")).toBeTruthy();
            expect(modal?.querySelector(".settings-section")).toBeTruthy();
            expect(modal?.querySelector(".settings-footer")).toBeTruthy();
        });

        it("should include preview elements", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const modal = document.getElementById("settings-modal");

            expect(modal?.querySelector(".accent-color-preview")).toBeTruthy();
            expect(modal?.querySelector(".preview-button")).toBeTruthy();
            expect(modal?.querySelector(".preview-chip")).toBeTruthy();
            expect(modal?.querySelector(".preview-badge")).toBeTruthy();
        });
    });

    describe("modal styling", () => {
        it("should inject comprehensive CSS styles", async () => {
            const module = await loadModule();

            await module.showSettingsModal();

            const styleElement = document.getElementById("settings-modal-styles") as HTMLStyleElement;
            expect(styleElement).toBeTruthy();

            const cssText = styleElement.textContent || "";

            // Check for key style selectors
            expect(cssText).toContain(".settings-section");
            expect(cssText).toContain(".setting-label");
            expect(cssText).toContain(".accent-color-controls");
            expect(cssText).toContain(".preview-samples");
            expect(cssText).toContain(".themed-btn");
        });
    });
});
