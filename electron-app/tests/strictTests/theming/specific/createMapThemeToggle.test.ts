import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({ showNotification: vi.fn() }));
vi.mock("../../../../utils/charts/theming/getThemeColors.js", () => ({ getThemeColors: () => ({ surface: "#fff", primary: "#000" }) }));

const modPath = "../../../../utils/theming/specific/createMapThemeToggle.js";

describe("createMapThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "theme-light";
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("get/set preference defaults to dark and toggles", async () => {
    const { getMapThemeInverted, setMapThemeInverted } = await import(modPath);
    expect(getMapThemeInverted()).toBe(true);
    setMapThemeInverted(false);
    expect(getMapThemeInverted()).toBe(false);
  });

  it("creates button and toggles state with click", async () => {
    const { createMapThemeToggle, MAP_THEME_EVENTS } = await import(modPath);
    const btn = createMapThemeToggle();
    expect(btn.tagName).toBe("BUTTON");
    // Should initially render with dark map (active class present)
    expect(btn.classList.contains("active")).toBe(true);
    // Attach a spy for updateMapTheme
    (window as any).updateMapTheme = vi.fn();
    // Listen for event
    const eventSpy = vi.fn();
    document.addEventListener(MAP_THEME_EVENTS.CHANGED, eventSpy);
    // Click toggles to light
    btn.click();
    expect(localStorage.getItem("ffv-map-theme-inverted")).toBe("false");
    expect(eventSpy).toHaveBeenCalled();
    expect((window as any).updateMapTheme).toHaveBeenCalled();
  });
});
