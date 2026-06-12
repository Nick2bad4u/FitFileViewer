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
import { setActiveFitRawData as setManagedActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";

function makeContainer(): HTMLDivElement {
    const c = document.createElement("div");
    document.body.replaceChildren();
    document.body.append(c);
    return c;
}

function setActiveFitRawData(activeFitRawData: unknown): void {
    setManagedActiveFitRawData(activeFitRawData, { source: "test" });
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

function normalizeText(value: null | string | undefined): string {
    return value?.replace(/\s+/gu, " ").trim() ?? "";
}

function getElementText(container: ParentNode, selector: string): string {
    const element = container.querySelector(selector);
    if (element === null) {
        throw new TypeError(`Expected ${selector} to render`);
    }

    return normalizeText(element.textContent);
}

function getInfoBoxState(container: HTMLElement) {
    const infoBox = getInfoBoxElement(container);

    return {
        childCount: container.children.length,
        classes: getClassList(infoBox),
        connectedSensorsHeading: getElementText(
            infoBox,
            ".connected-sensors-heading"
        ),
        deviceHeading: getElementText(infoBox, ".device-info-heading"),
        hasDeviceSection: Boolean(
            infoBox.querySelector(".device-info-section")
        ),
        hasPrimaryDeviceCard: Boolean(
            infoBox.querySelector(".primary-device-card")
        ),
        hasUserProfileCard: Boolean(
            infoBox.querySelector(".user-profile-card")
        ),
        hasUserSection: Boolean(infoBox.querySelector(".user-profile-section")),
        primaryDeviceHeading: getElementText(
            infoBox,
            ".primary-device-heading"
        ),
        userProfileHeading: getElementText(infoBox, ".user-profile-heading"),
    };
}

function getStrongLabels(container: ParentNode): string[] {
    return Array.from(container.querySelectorAll("strong"), (label) =>
        normalizeText(label.textContent)
    );
}

function getLabeledValue(container: ParentNode, label: string): string {
    const strong = Array.from(container.querySelectorAll("strong")).find(
        (candidate) => normalizeText(candidate.textContent) === label
    );

    return normalizeText(strong?.parentElement?.textContent)
        .replace(label, "")
        .trim();
}

describe(createUserDeviceInfoBox, () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        vi.clearAllMocks();
        document.body.replaceChildren();
    });

    it("creates info box with user profile and device sections when data present", () => {
        expect.assertions(1);

        const container = makeContainer();
        setActiveFitRawData({
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

        expect(getInfoBoxState(container)).toStrictEqual({
            childCount: 1,
            classes: ["user-device-info-box", "chart-info-section"],
            connectedSensorsHeading: "🔗 Connected Sensors",
            deviceHeading: "Device Information",
            hasDeviceSection: true,
            hasPrimaryDeviceCard: true,
            hasUserProfileCard: true,
            hasUserSection: true,
            primaryDeviceHeading: "⭐ Primary Device",
            userProfileHeading: "👤 User Profile",
        });
    });

    it("shows fallback message when no device info available", () => {
        expect.assertions(1);

        const container = makeContainer();
        setActiveFitRawData({ deviceInfoMesgs: [], userProfileMesgs: [{}] });
        createUserDeviceInfoBox(container);

        expect(getElementText(container, ".device-info-empty-state")).toBe(
            "🔍 No device information available"
        );
    });

    it("renders most user profile fields when provided", () => {
        expect.assertions(1);

        const container = makeContainer();
        setActiveFitRawData({
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
            expectedLabels.filter(
                (label) => !getStrongLabels(container).includes(label)
            )
        ).toStrictEqual([]);
    });

    it("selects first device as primary when no creator entry exists and renders serial suffix", () => {
        expect.assertions(3);

        const container = makeContainer();
        setActiveFitRawData({
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

        const primaryDeviceCard = getInfoBoxElement(container).querySelector(
            ".primary-device-card"
        );

        expect(getElementText(container, ".primary-device-heading")).toBe(
            "⭐ Primary Device"
        );
        // Serial should show only the last 6 characters; in markup it's within the same div after the strong label
        expect(getLabeledValue(primaryDeviceCard ?? container, "Serial:")).toBe(
            "123456"
        );
        // Connected Sensors section should be present and include a pill for the second sensor too
        expect(getElementText(container, ".connected-sensors-heading")).toBe(
            "🔗 Connected Sensors"
        );
    });

    it("renders sensor pills only when manufacturer or garminProduct is present", () => {
        expect.assertions(2);

        const container = makeContainer();
        setActiveFitRawData({
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

        // At least one sensor pill should be present; content may vary depending on formatter/mock caching
        expect(getElementText(container, ".connected-sensors-heading")).toBe(
            "🔗 Connected Sensors"
        );
        expect(
            Array.from(
                container.querySelectorAll(".connected-sensor-name"),
                (sensorName) => normalizeText(sensorName.textContent)
            )
        ).toStrictEqual(["Garmin Foo"]);
    });

    it("sanitizes FIT-derived strings (prevents HTML injection)", () => {
        expect.assertions(3);

        const container = makeContainer();

        setActiveFitRawData({
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
        setActiveFitRawData({
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
