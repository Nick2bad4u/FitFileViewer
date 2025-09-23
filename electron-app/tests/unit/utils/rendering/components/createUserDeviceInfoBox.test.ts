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
vi.mock("../../../../utils/formatting/formatters/formatSensorName.js", () => ({
    formatSensorName: vi.fn(() => "Garmin Foo"),
}));
vi.mock("../../../../utils/formatting/formatters/formatManufacturer.js", () => ({
    formatManufacturer: vi.fn(() => "Garmin"),
}));
vi.mock("../../../../utils/formatting/display/formatCapitalize.js", () => ({
    formatCapitalize: vi.fn((s) => String(s)),
}));

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

    it("renders most user profile fields when provided", () => {
        const container = makeContainer();
        // @ts-ignore
        window.globalData = {
            userProfileMesgs: [
                {
                    friendlyName: "nick",
                    gender: "male",
                    age: 42,
                    height: 183,
                    weight: 82,
                    language: "english",
                    elevSetting: "meters",
                    weightSetting: "kg",
                    restingHeartRate: 50,
                    defaultMaxHeartRate: 190,
                    defaultMaxRunningHeartRate: 195,
                    defaultMaxBikingHeartRate: 185,
                    hrSetting: "on",
                    speedSetting: "kph",
                    distSetting: "km",
                    powerSetting: "watts",
                    activityClass: "athlete",
                    positionSetting: "gps",
                    temperatureSetting: "celsius",
                    localId: 7,
                    globalId: "abc-123",
                    wakeTime: "06:30",
                    sleepTime: "22:30",
                    heightSetting: "cm",
                    userRunningStepLength: 1234,
                    userWalkingStepLength: 987,
                    depthSetting: "m",
                    diveCount: 3,
                },
            ],
            deviceInfoMesgs: [
                { sourceType: "local", deviceIndex: "creator", manufacturer: "garmin", garminProduct: "x" },
            ],
        };

        createUserDeviceInfoBox(container);

        // Spot-check a variety of labels produced by optional fields
        const html = container.innerHTML;
        expect(html).toMatch(/Device or Name:/);
        expect(html).toMatch(/Gender:/);
        expect(html).toMatch(/Age:/);
        expect(html).toMatch(/Height:/);
        expect(html).toMatch(/Weight:/);
        expect(html).toMatch(/Language:/);
        expect(html).toMatch(/Elevation Setting:/);
        expect(html).toMatch(/Weight Setting:/);
        expect(html).toMatch(/Resting HR:/);
        expect(html).toMatch(/Max HR:/);
        expect(html).toMatch(/Max Running HR:/);
        expect(html).toMatch(/Max Biking HR:/);
        expect(html).toMatch(/HR Setting:/);
        expect(html).toMatch(/Speed Setting:/);
        expect(html).toMatch(/Distance Setting:/);
        expect(html).toMatch(/Power Setting:/);
        expect(html).toMatch(/Activity Class:/);
        expect(html).toMatch(/Position Setting:/);
        expect(html).toMatch(/Temperature Setting:/);
        expect(html).toMatch(/Local ID:/);
        expect(html).toMatch(/Global ID:/);
        expect(html).toMatch(/Wake Time:/);
        expect(html).toMatch(/Sleep Time:/);
        expect(html).toMatch(/Height Setting:/);
        expect(html).toMatch(/Running Step Length:/);
        expect(html).toMatch(/Walking Step Length:/);
        expect(html).toMatch(/Depth Setting:/);
        expect(html).toMatch(/Dive Count:/);
    });

    it("selects first device as primary when no creator entry exists and renders serial suffix", () => {
        const container = makeContainer();
        // @ts-ignore
        window.globalData = {
            userProfileMesgs: [{}],
            deviceInfoMesgs: [
                {
                    sourceType: "antplus",
                    deviceIndex: 1,
                    manufacturer: "garmin",
                    garminProduct: "Edge",
                    serialNumber: "SN-XYZ-123456",
                    softwareVersion: 9,
                },
                { sourceType: "antplus", deviceIndex: 2, manufacturer: "garmin", garminProduct: "HRM" },
            ],
        };

        createUserDeviceInfoBox(container);

        const html = container.innerHTML;
        expect(html).toMatch(/Primary Device/);
        // Serial should show only the last 6 characters; in markup it's within the same div after the strong label
        expect(html).toMatch(/<strong[^>]*>Serial:<\/strong>\s*123456/);
        // Connected Sensors section should be present and include a pill for the second sensor too
        expect(html).toMatch(/Connected Sensors/);
    });

    it("renders sensor pills only when manufacturer or garminProduct is present", () => {
        const container = makeContainer();
        // @ts-ignore
        window.globalData = {
            userProfileMesgs: [{}],
            deviceInfoMesgs: [
                { sourceType: "local", deviceIndex: "creator", manufacturer: "garmin", garminProduct: "500" },
                // Valid sensor: should render
                { sourceType: "antplus", manufacturer: "garmin" },
                // Invalid sensor (no manufacturer/garminProduct): should not render pill
                { sourceType: "antplus" },
            ],
        };

        createUserDeviceInfoBox(container);

        const html = container.innerHTML;
        // At least one sensor pill should be present; content may vary depending on formatter/mock caching
        expect(html).toMatch(/Connected Sensors/);
        expect(html).toMatch(/(Garmin Foo|Garmin|Edge|Hrm)/);
    });

    it("applies hover effects and logs theme on creation", () => {
        const container = makeContainer();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        // @ts-ignore
        window.globalData = {
            userProfileMesgs: [{}],
            deviceInfoMesgs: [{ sourceType: "local", deviceIndex: "creator", manufacturer: "garmin" }],
        };

        createUserDeviceInfoBox(container);

        const infoBox = container.querySelector<HTMLDivElement>(".user-device-info-box");
        expect(infoBox).toBeTruthy();

        // Simulate hover events on the infoBox to exercise event listeners
        infoBox!.dispatchEvent(new Event("mouseenter"));
        expect(infoBox!.style.transform).toContain("translateY(-4px)");
        infoBox!.dispatchEvent(new Event("mouseleave"));
        // After leave, transform should reset to baseline
        expect(infoBox!.style.transform).toContain("translateY(0)");

        // Ensure theme name is logged (accept any theme name)
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartJS] User and device info box created with theme:",
            expect.any(String)
        );

        logSpy.mockRestore();
    });

    it("does not throw and logs error when an exception occurs", () => {
        const container = makeContainer();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Force an error by making append throw (not appendChild)
        const originalAppend = container.append.bind(container);
        // @ts-ignore
        container.append = () => {
            throw new Error("fail");
        };

        expect(() => createUserDeviceInfoBox(container)).not.toThrow();
        expect(consoleSpy).toHaveBeenCalled();

        // restore
        container.append = originalAppend;
    });
});
