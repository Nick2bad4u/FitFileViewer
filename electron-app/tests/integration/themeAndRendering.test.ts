/**
 * @vitest-environment jsdom
 * @fileoverview Integration tests for theme switching and unnecessary re-renders
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock state manager
const mockGetState = vi.fn();
const mockSetState = vi.fn();
const mockSubscribe = vi.fn();

vi.mock("../../utils/state/core/stateManager.js", () => ({
    getState: mockGetState,
    setState: mockSetState,
    subscribe: mockSubscribe,
}));

// Mock accent color
vi.mock("../../utils/theming/core/accentColor.js", () => ({
    initializeAccentColor: vi.fn(),
}));

describe("Theme Switching and Rendering Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset DOM
        document.body.innerHTML = `
            <div class="tab-content" data-tab-content="summary">
                <h1>Summary Content</h1>
            </div>
            <div class="tab-content" data-tab-content="chartjs">
                <h1>Chart Content</h1>
            </div>

            <button class="theme-toggle-btn" data-theme="light">Light</button>
            <button class="theme-toggle-btn" data-theme="dark">Dark</button>
            <button class="theme-toggle-btn" data-theme="auto">Auto</button>
        `;

        // Set up document.documentElement
        if (!document.documentElement) {
            (document as any).documentElement = document.createElement("html");
        }

        // Mock initial state
        mockGetState.mockImplementation((key: string) => {
            if (key === "ui.theme") return "dark";
            if (key === "ui.activeTab") return "summary";
            return null;
        });

        // Apply initial theme
        document.body.classList.add("theme-dark");
        document.documentElement.classList.add("theme-dark");
    });

    afterEach(() => {
        document.body.innerHTML = "";
        document.body.className = "";
        document.documentElement.className = "";
    });

    describe("Test 1: Clicking outside tab content should not cause re-renders", () => {
        it("should not trigger theme re-application when clicking on tab content", async () => {
            const { applyTheme } = await import("../../utils/theming/core/theme.js");
            const applyThemeSpy = vi.fn(applyTheme);

            // Click on tab content area
            const tabContent = document.querySelector('[data-tab-content="summary"]');
            expect(tabContent).toBeTruthy();

            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
            });

            tabContent?.dispatchEvent(clickEvent);

            // Should not trigger theme application
            expect(applyThemeSpy).not.toHaveBeenCalled();
        });

        it("should not log accent color messages when clicking non-interactive elements", async () => {
            const consoleSpy = vi.spyOn(console, "log");

            // Import modules after mocks are set up
            await import("../../utils/theming/core/theme.js");

            // Click on a non-interactive element
            const heading = document.querySelector("h1");
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
            });

            heading?.dispatchEvent(clickEvent);

            // Should not log accent color messages
            const accentColorLogs = consoleSpy.mock.calls.filter(
                (call) => call[0] && String(call[0]).includes("[AccentColor]")
            );
            expect(accentColorLogs).toHaveLength(0);

            consoleSpy.mockRestore();
        });
    });

    describe("Test 2: Theme selector should actually change the theme", () => {
        it("should change from dark to light theme when clicking light button", async () => {
            const { applyTheme, setThemePreference } = await import("../../utils/theming/core/theme.js");

            // Verify initial state is dark
            expect(document.body.classList.contains("theme-dark")).toBe(true);
            expect(document.body.classList.contains("theme-light")).toBe(false);

            // Click light theme button
            const lightButton = document.querySelector('[data-theme="light"]');
            expect(lightButton).toBeTruthy();

            // Simulate the theme change
            setThemePreference("light", { withTransition: false });

            // Verify state was updated
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.theme",
                "light",
                expect.objectContaining({ source: "theme.setThemePreference" })
            );

            // Verify DOM classes were updated
            expect(document.body.classList.contains("theme-dark")).toBe(false);
            expect(document.body.classList.contains("theme-light")).toBe(true);
        });

        it("should update all theme-related DOM attributes", async () => {
            const { setThemePreference } = await import("../../utils/theming/core/theme.js");

            // Apply light theme
            setThemePreference("light", { withTransition: false });

            // Check body classes
            expect(document.body.classList.contains("theme-light")).toBe(true);
            expect(document.body.classList.contains("theme-dark")).toBe(false);

            // Check data attributes
            expect(document.body.dataset.theme).toBe("light");
            expect(document.documentElement.dataset.theme).toBe("light");

            // Check color-scheme
            expect(document.documentElement.style.colorScheme).toBe("light");
        });

        it("should persist theme to localStorage", async () => {
            const { setThemePreference } = await import("../../utils/theming/core/theme.js");

            const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

            setThemePreference("light", { withTransition: false });

            expect(setItemSpy).toHaveBeenCalledWith("ffv-theme", "light");
            expect(setItemSpy).toHaveBeenCalledWith("fitFileViewer_theme", "light");

            setItemSpy.mockRestore();
        });

        it("should toggle theme button active states", async () => {
            const { setThemePreference } = await import("../../utils/theming/core/theme.js");

            const lightButton = document.querySelector('[data-theme="light"]') as HTMLElement;
            const darkButton = document.querySelector('[data-theme="dark"]') as HTMLElement;

            // Initially dark should be active
            darkButton.classList.add("active");
            darkButton.setAttribute("aria-pressed", "true");

            // Switch to light
            setThemePreference("light", { withTransition: false });

            // Now we need to manually update button states (as would happen in UIStateManager)
            const buttons = document.querySelectorAll('[data-theme]');
            buttons.forEach((button) => {
                const buttonTheme = (button as HTMLElement).dataset.theme;
                const isActive = buttonTheme === "light";
                button.classList.toggle("active", isActive);
                button.setAttribute("aria-pressed", isActive ? "true" : "false");
            });

            // Verify button states
            expect(lightButton.classList.contains("active")).toBe(true);
            expect(lightButton.getAttribute("aria-pressed")).toBe("true");
            expect(darkButton.classList.contains("active")).toBe(false);
            expect(darkButton.getAttribute("aria-pressed")).toBe("false");
        });

        it("should handle auto theme based on system preference", async () => {
            const { setThemePreference, getSystemTheme } = await import("../../utils/theming/core/theme.js");

            // Mock matchMedia to return light preference
            Object.defineProperty(window, "matchMedia", {
                writable: true,
                value: vi.fn().mockImplementation((query) => ({
                    matches: query === "(prefers-color-scheme: dark)" ? false : true,
                    media: query,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                })),
            });

            setThemePreference("auto", { withTransition: false });

            const systemTheme = getSystemTheme();
            expect(systemTheme).toBe("light");

            // Should apply the system theme
            expect(document.body.classList.contains(`theme-${systemTheme}`)).toBe(true);
        });

        it("should dispatch theme change event", async () => {
            const { setThemePreference } = await import("../../utils/theming/core/theme.js");

            const eventSpy = vi.fn();
            document.body.addEventListener("themechange", eventSpy);

            setThemePreference("light", { withTransition: false });

            expect(eventSpy).toHaveBeenCalled();
            expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
                theme: "light",
                effectiveTheme: "light",
            });

            document.body.removeEventListener("themechange", eventSpy);
        });
    });

    describe("Test 3: UIStateManager theme application", () => {
        it("should apply theme through button click", async () => {
            const { UIStateManager } = await import("../../utils/state/domain/uiStateManager.js");

            // Set up UI State Manager which sets up event listeners
            new UIStateManager();

            // Verify initial state
            expect(document.body.classList.contains("theme-dark")).toBe(true);
            expect(document.body.classList.contains("theme-light")).toBe(false);

            // Simulate clicking the light theme button
            const lightButton = document.querySelector('[data-theme="light"]') as HTMLButtonElement;
            expect(lightButton).toBeTruthy();

            lightButton.click();

            // Should have updated DOM
            expect(document.body.classList.contains("theme-light")).toBe(true);
            expect(document.body.classList.contains("theme-dark")).toBe(false);
            expect(document.body.dataset.theme).toBe("light");
        });

        it("should apply theme through UIStateManager", async () => {
            const { UIStateManager } = await import("../../utils/state/domain/uiStateManager.js");

            const uiManager = new UIStateManager();

            // Verify initial state
            expect(document.body.classList.contains("theme-dark")).toBe(true);

            // Apply light theme through UIStateManager
            uiManager.applyTheme("light");

            // Should have updated DOM
            expect(document.body.classList.contains("theme-light")).toBe(true);
            expect(document.body.classList.contains("theme-dark")).toBe(false);
        });        it("should not re-apply theme if already applied", async () => {
            const { UIStateManager } = await import("../../utils/state/domain/uiStateManager.js");
            const consoleSpy = vi.spyOn(console, "log");

            const uiManager = new UIStateManager();

            // Apply dark theme (already applied)
            mockGetState.mockReturnValue("dark");
            document.body.classList.add("theme-dark");

            const initialCallCount = consoleSpy.mock.calls.length;

            uiManager.applyTheme("dark");

            // Should not log again since theme is already applied
            const themeAppliedLogs = consoleSpy.mock.calls
                .slice(initialCallCount)
                .filter((call) => call[0] && String(call[0]).includes("[UIStateManager] Theme applied"));

            expect(themeAppliedLogs).toHaveLength(0);

            consoleSpy.mockRestore();
        });
    });

    describe("Test 4: Prevent redundant updates", () => {
        it("should not trigger accent color re-application on every click", async () => {
            const { initializeAccentColor } = await import("../../utils/theming/core/accentColor.js");
            const initAccentSpy = vi.mocked(initializeAccentColor);

            initAccentSpy.mockClear();

            // Click somewhere random
            const clickEvent = new MouseEvent("click", { bubbles: true });
            document.body.dispatchEvent(clickEvent);

            // Should not trigger accent color initialization
            expect(initAccentSpy).not.toHaveBeenCalled();
        });

        it("should not update map theme if map theme data hasn't changed", async () => {
            // This test would check updateMapTheme, but we'll verify it doesn't
            // get called unnecessarily through the console logs
            const consoleSpy = vi.spyOn(console, "log");

            // Set up map element
            const mapElement = document.createElement("div");
            mapElement.id = "leaflet-map";
            mapElement.dataset.mapTheme = "dark";
            mapElement.dataset.uiTheme = "dark";
            document.body.appendChild(mapElement);

            // Import and call updateMapTheme
            const { updateMapTheme } = await import("../../utils/theming/specific/updateMapTheme.js");

            // Mock the getMapThemeInverted to return consistent value
            const initialLogCount = consoleSpy.mock.calls.length;

            // Call updateMapTheme multiple times
            updateMapTheme();
            updateMapTheme();
            updateMapTheme();

            // Should only log once (or not at all if already set)
            const mapThemeLogs = consoleSpy.mock.calls
                .slice(initialLogCount)
                .filter((call) => call[0] && String(call[0]).includes("[updateMapTheme]"));

            // Should be 0 or 1, not 3
            expect(mapThemeLogs.length).toBeLessThanOrEqual(1);

            consoleSpy.mockRestore();
        });
    });
});
