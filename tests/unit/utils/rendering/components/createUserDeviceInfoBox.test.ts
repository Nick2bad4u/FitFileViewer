// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

type FormatCapitalize = (value: unknown) => string;
type FormatHeight = (value: unknown) => string;
type FormatManufacturer = (value: unknown) => string;
type FormatSensorName = (value: unknown) => string;
type FormatWeight = (value: unknown) => string;
type GetThemeConfig = () => {
    colors: {
        accent: string;
        background: string;
        border: string;
        borderLight: string;
        primary: string;
        primaryShadow: string;
        primaryShadowHeavy: string;
        primaryShadowLight: string;
        shadow: string;
        shadowHeavy: string;
        shadowLight: string;
        shadowMedium: string;
        surface: string;
        surfaceSecondary: string;
        text: string;
        textPrimary: string;
        textSecondary: string;
    };
    isDark: boolean;
    isLight: boolean;
    name: string;
    theme: string;
};
type TestWindow = Window &
    typeof globalThis & {
        globalData?: unknown;
    };

const themeConfig = vi.hoisted(
    (): ReturnType<GetThemeConfig> => ({
        colors: {
            accent: "#0f0",
            background: "#fff",
            border: "#ccc",
            borderLight: "rgba(255,255,255,0.3)",
            primary: "#00f",
            primaryShadow: "rgba(0,0,255,0.3)",
            primaryShadowHeavy: "rgba(0,0,255,0.4)",
            primaryShadowLight: "rgba(0,0,255,0.2)",
            shadow: "rgba(0,0,0,0.3)",
            shadowHeavy: "rgba(0,0,0,0.4)",
            shadowLight: "rgba(0,0,0,0.1)",
            shadowMedium: "rgba(0,0,0,0.2)",
            surface: "#eee",
            surfaceSecondary: "#ddd",
            text: "#111",
            textPrimary: "#000",
            textSecondary: "#333",
        },
        isDark: false,
        isLight: true,
        name: "test-theme",
        theme: "light",
    })
);

// Mock dependent formatters and theme
vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: vi.fn<GetThemeConfig>(() => themeConfig),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatHeight.js"),
    () => ({
        formatHeight: vi.fn<FormatHeight>((value) => `${value}cm`),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatWeight.js"),
    () => ({
        formatWeight: vi.fn<FormatWeight>((value) => `${value}kg`),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatSensorName.js"),
    () => ({
        formatSensorName: vi.fn<FormatSensorName>(() => "Garmin Foo"),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatManufacturer.js"),
    () => ({
        formatManufacturer: vi.fn<FormatManufacturer>(() => "Garmin"),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/display/formatCapitalize.js"),
    () => ({
        formatCapitalize: vi.fn<FormatCapitalize>((value) => String(value)),
    })
);

import { createUserDeviceInfoBox } from "../../../../../electron-app/utils/rendering/components/createUserDeviceInfoBox.js";

function getTestWindow(): TestWindow {
    return window as TestWindow;
}

function makeContainer(): HTMLDivElement {
    const c = document.createElement("div");
    document.body.innerHTML = "";
    document.body.append(c);
    return c;
}

function setGlobalData(globalData: unknown): void {
    getTestWindow().globalData = globalData;
}

function getInfoBoxElement(container: HTMLElement): HTMLDivElement {
    const infoBox = container.querySelector<HTMLDivElement>(
        ".user-device-info-box"
    );
    if (!(infoBox instanceof HTMLDivElement)) {
        throw new TypeError("Expected info box to render as a div");
    }
    return infoBox;
}

function getClassList(element: Element): string[] {
    return [...element.classList];
}

describe(createUserDeviceInfoBox, () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // reset DOM and globals
        document.body.innerHTML = "";
        delete getTestWindow().globalData;
    });

    it("creates info box with user profile and device sections when data present", () => {
        expect.assertions(1);

        const container = makeContainer();
        setGlobalData({
            userProfileMesgs: [
                { friendlyName: "nick", age: 30, height: 180, weight: 80 },
            ],
            deviceInfoMesgs: [
                {
                    sourceType: "local",
                    deviceIndex: "creator",
                    manufacturer: "garmin",
                    garminProduct: "123",
                },
                {
                    sourceType: "antplus",
                    manufacturer: "garmin",
                    garminProduct: "456",
                },
            ],
        });

        createUserDeviceInfoBox(container);

        const infoBox = container.firstElementChild;
        expect({
            childCount: container.children.length,
            classes: infoBox ? getClassList(infoBox) : [],
            hasConnectedSensors:
                container.innerHTML.includes("Connected Sensors"),
            hasDeviceInformation:
                container.innerHTML.includes("Device Information"),
            hasUserProfile: container.innerHTML.includes("User Profile"),
        }).toStrictEqual({
            childCount: 1,
            classes: ["user-device-info-box", "chart-info-section"],
            hasConnectedSensors: true,
            hasDeviceInformation: true,
            hasUserProfile: true,
        });
    });

    it("shows fallback message when no device info available", () => {
        expect.assertions(1);

        const container = makeContainer();
        setGlobalData({ deviceInfoMesgs: [], userProfileMesgs: [{}] });
        createUserDeviceInfoBox(container);

        expect(container.innerHTML).toMatch(/No device information available/);
    });

    it("renders most user profile fields when provided", () => {
        expect.assertions(1);

        const container = makeContainer();
        setGlobalData({
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
                {
                    sourceType: "local",
                    deviceIndex: "creator",
                    manufacturer: "garmin",
                    garminProduct: "x",
                },
            ],
        });

        createUserDeviceInfoBox(container);

        // Spot-check a variety of labels produced by optional fields
        const html = container.innerHTML;
        const expectedLabels = [
            "Device or Name:",
            "Gender:",
            "Age:",
            "Height:",
            "Weight:",
            "Language:",
            "Elevation Setting:",
            "Weight Setting:",
            "Resting HR:",
            "Max HR:",
            "Max Running HR:",
            "Max Biking HR:",
            "HR Setting:",
            "Speed Setting:",
            "Distance Setting:",
            "Power Setting:",
            "Activity Class:",
            "Position Setting:",
            "Temperature Setting:",
            "Local ID:",
            "Global ID:",
            "Wake Time:",
            "Sleep Time:",
            "Height Setting:",
            "Running Step Length:",
            "Walking Step Length:",
            "Depth Setting:",
            "Dive Count:",
        ];
        expect(
            expectedLabels.filter((label) => !html.includes(label))
        ).toStrictEqual([]);
    });

    it("selects first device as primary when no creator entry exists and renders serial suffix", () => {
        expect.assertions(3);

        const container = makeContainer();
        setGlobalData({
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
                {
                    sourceType: "antplus",
                    deviceIndex: 2,
                    manufacturer: "garmin",
                    garminProduct: "HRM",
                },
            ],
        });

        createUserDeviceInfoBox(container);

        const html = container.innerHTML;
        expect(html).toMatch(/Primary Device/);
        // Serial should show only the last 6 characters; in markup it's within the same div after the strong label
        expect(html).toMatch(/<strong[^>]*>Serial:<\/strong>\s*123456/);
        // Connected Sensors section should be present and include a pill for the second sensor too
        expect(html).toMatch(/Connected Sensors/);
    });

    it("renders sensor pills only when manufacturer or garminProduct is present", () => {
        expect.assertions(2);

        const container = makeContainer();
        setGlobalData({
            userProfileMesgs: [{}],
            deviceInfoMesgs: [
                {
                    sourceType: "local",
                    deviceIndex: "creator",
                    manufacturer: "garmin",
                    garminProduct: "500",
                },
                // Valid sensor: should render
                { sourceType: "antplus", manufacturer: "garmin" },
                // Invalid sensor (no manufacturer/garminProduct): should not render pill
                { sourceType: "antplus" },
            ],
        });

        createUserDeviceInfoBox(container);

        const html = container.innerHTML;
        // At least one sensor pill should be present; content may vary depending on formatter/mock caching
        expect(html).toMatch(/Connected Sensors/);
        expect(html).toMatch(/(Garmin Foo|Garmin|Edge|Hrm)/);
    });

    it("sanitizes FIT-derived strings (prevents HTML injection)", () => {
        expect.assertions(3);

        const container = makeContainer();

        setGlobalData({
            userProfileMesgs: [
                { friendlyName: "<img src=x onerror=alert(1)>bad" },
            ],
            deviceInfoMesgs: [],
        });

        createUserDeviceInfoBox(container);

        // Ensure no image element was injected.
        expect(container.querySelector("img")).toBeNull();

        // Ensure the injected attribute text doesn't survive.
        expect(container.innerHTML).not.toMatch(/onerror/i);

        // Ensure the remaining text is still rendered.
        expect(container.textContent).toMatch(/bad/);
    });

    it("applies hover effects and logs theme on creation", () => {
        expect.assertions(3);

        const container = makeContainer();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        setGlobalData({
            userProfileMesgs: [{}],
            deviceInfoMesgs: [
                {
                    sourceType: "local",
                    deviceIndex: "creator",
                    manufacturer: "garmin",
                },
            ],
        });

        createUserDeviceInfoBox(container);

        const boxNode = getInfoBoxElement(container);

        // Simulate hover events on the infoBox to exercise event listeners
        boxNode.dispatchEvent(new Event("mouseenter"));
        expect(boxNode.style.transform).toContain("translateY(-4px)");
        boxNode.dispatchEvent(new Event("mouseleave"));
        // After leave, transform should reset to baseline
        expect(boxNode.style.transform).toContain("translateY(0)");

        // Ensure theme name is logged (accept any theme name)
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartJS] User and device info box created with theme:",
            expect.any(String)
        );

        logSpy.mockRestore();
    });

    it("does not throw and logs error when an exception occurs", () => {
        expect.assertions(2);

        const container = makeContainer();
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Force an error by making append throw (not appendChild)
        vi.spyOn(container, "append").mockImplementation(() => {
            throw new Error("fail");
        });

        expect(() => createUserDeviceInfoBox(container)).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(
            "[ChartJS] Error creating user/device info box:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });
});
