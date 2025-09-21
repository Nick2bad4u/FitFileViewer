import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme config provider
vi.mock("../../../../../utils/theming/core/theme.js", () => ({
  getThemeConfig: vi.fn(() => ({
    colors: {
      accentColor: "#123456",
      bgPrimary: "#ffffff",
      textPrimary: "#000000",
      customKey: "#abcabc",
    },
    name: "unit-test-theme",
  })),
}));

describe("getThemeColors and getThemeColor", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns full colors object and safe copy", async () => {
    const { getThemeColors } = await import("../../../../../utils/charts/theming/getThemeColors.js");
    const colors = getThemeColors();
    expect(colors).toBeDefined();
    expect(colors.accentColor).toBe("#123456");
    // Should be a copy, not the original object
    colors.accentColor = "#654321";
    const colors2 = getThemeColors();
    expect(colors2.accentColor).toBe("#123456");
  });

  it("getThemeColor returns key or fallback and validates inputs", async () => {
    const { getThemeColor } = await import("../../../../../utils/charts/theming/getThemeColors.js");
    expect(getThemeColor("accentColor", "#fallback")).toBe("#123456");
    expect(getThemeColor("doesNotExist", "#fallback")).toBe("#fallback");
    // Invalid key -> fallback
    expect(getThemeColor("" as any, "#f")).toBe("#f");
  });

  it("falls back when theme config throws", async () => {
    vi.doMock("../../../../../utils/theming/core/theme.js", () => ({
      getThemeConfig: () => { throw new Error("boom"); },
    }));
    const { getThemeColors, getThemeColor } = await import("../../../../../utils/charts/theming/getThemeColors.js");
    const colors = getThemeColors();
    expect(colors).toMatchObject({ accentColor: expect.any(String), bgPrimary: expect.any(String), textPrimary: expect.any(String) });
    expect(getThemeColor("customKey", "#fallback")).toBe("#fallback");
  });
});
