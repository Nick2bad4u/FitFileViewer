/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dependent formatters and theme
vi.mock("../../../../utils/theming/core/theme.js", () => ({
  getThemeConfig: vi.fn(() => ({
    name: "test-theme",
    colors: {
      primary: "#00f",
      accent: "#0f0",
      background: "#fff",
      surface: "#eee",
      surfaceSecondary: "#ddd",
      text: "#111",
      textPrimary: "#000",
      textSecondary: "#333",
      border: "#ccc",
      shadow: "rgba(0,0,0,0.3)",
      shadowLight: "rgba(0,0,0,0.1)",
      shadowMedium: "rgba(0,0,0,0.2)",
      shadowHeavy: "rgba(0,0,0,0.4)",
      primaryShadowLight: "rgba(0,0,255,0.2)",
      primaryShadowHeavy: "rgba(0,0,255,0.4)",
      primaryShadow: "rgba(0,0,255,0.3)",
      borderLight: "rgba(255,255,255,0.3)",
    },
  })),
}));
vi.mock("../../../../utils/formatting/formatters/formatHeight.js", () => ({ formatHeight: vi.fn((v) => `${v}cm`) }));
vi.mock("../../../../utils/formatting/formatters/formatWeight.js", () => ({ formatWeight: vi.fn((v) => `${v}kg`) }));
vi.mock("../../../../utils/formatting/formatters/formatSensorName.js", () => ({ formatSensorName: vi.fn(() => "Garmin Foo") }));
vi.mock("../../../../utils/formatting/formatters/formatManufacturer.js", () => ({ formatManufacturer: vi.fn(() => "Garmin") }));
vi.mock("../../../../utils/formatting/display/formatCapitalize.js", () => ({ formatCapitalize: vi.fn((s) => String(s)) }));

import { createUserDeviceInfoBox } from "../../../../../utils/rendering/components/createUserDeviceInfoBox.js";

const makeContainer = () => {
  const c = document.createElement("div");
  document.body.innerHTML = "";
  document.body.appendChild(c);
  return c;
};

describe("createUserDeviceInfoBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset DOM and globals
    document.body.innerHTML = "";
    // @ts-ignore
    delete window.globalData;
  });

  it("creates info box with user profile and device sections when data present", () => {
    const container = makeContainer();
    // @ts-ignore
    window.globalData = {
      userProfileMesgs: [{ friendlyName: "nick", age: 30, height: 180, weight: 80 }],
      deviceInfoMesgs: [
        { sourceType: "local", deviceIndex: "creator", manufacturer: "garmin", garminProduct: "123" },
        { sourceType: "antplus", manufacturer: "garmin", garminProduct: "456" },
      ],
    };

    createUserDeviceInfoBox(container);

    // Should append exactly one child (info box)
    expect(container.children.length).toBe(1);
    const infoBox = container.firstElementChild;
    expect(infoBox?.classList.contains("user-device-info-box")).toBe(true);

    // Contains some expected text fragments
    expect(container.innerHTML).toMatch(/User Profile/);
    expect(container.innerHTML).toMatch(/Device Information/);
    expect(container.innerHTML).toMatch(/Connected Sensors/);
  });

  it("shows fallback message when no device info available", () => {
    const container = makeContainer();
    // @ts-ignore
    window.globalData = { userProfileMesgs: [{}], deviceInfoMesgs: [] };
    createUserDeviceInfoBox(container);

    expect(container.innerHTML).toMatch(/No device information available/);
  });

  it("does not throw and logs error when an exception occurs", () => {
    const container = makeContainer();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    // Force an error by making appendChild throw
    const originalAppend = container.appendChild.bind(container);
    // @ts-ignore
    container.appendChild = () => { throw new Error("fail"); };

    expect(() => createUserDeviceInfoBox(container)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    // restore
    container.appendChild = originalAppend;
  });
});
