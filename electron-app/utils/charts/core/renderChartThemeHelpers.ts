import type { ThemeColorMap, ThemeConfig } from "../../theming/core/theme.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

type ThemeConfigProvider = () => unknown;

interface NormalizedThemeColors extends ThemeColorMap {
    accent: string;
    accentHover: string;
    background: string;
    backgroundAlt: string;
    border: string;
    borderLight: string;
    chartBackground: string;
    chartBorder: string;
    chartGrid: string;
    chartSurface: string;
    error: string;
    heartRateZoneColors: readonly string[];
    info: string;
    powerZoneColors: readonly string[];
    primary: string;
    primaryAlpha: string;
    primaryShadow: string;
    primaryShadowHeavy: string;
    primaryShadowLight: string;
    shadow: string;
    shadowHeavy: string;
    shadowLight: string;
    shadowMedium: string;
    success: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textPrimary: string;
    textSecondary: string;
    warning: string;
    zoneColors: readonly string[];
}

interface NormalizedThemeConfig extends ThemeConfig {
    colors: NormalizedThemeColors;
}

const FALLBACK_ZONE_COLORS = [
    "#808080",
    "#3b82f665",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#FF6600",
    "#FF00FF",
    "#00FFFF",
    "#FF1493",
    "#FF4500",
    "#FFD700",
    "#32CD32",
    "#8A2BE2",
    "#000000",
] as const;

const FALLBACK_HEART_RATE_ZONE_COLORS = [...FALLBACK_ZONE_COLORS];
const FALLBACK_POWER_ZONE_COLORS = [...FALLBACK_ZONE_COLORS];

const FALLBACK_THEME_COLORS: NormalizedThemeColors = {
    accent: "#3b82f665",
    accentHover: "#3b82f633",
    background: "#f8fafc",
    backgroundAlt: "#ffffff",
    border: "#e5e7eb",
    borderLight: "rgba(0, 0, 0, 0.05)",
    chartBackground: "#ffffff",
    chartBorder: "#dddddd",
    chartGrid: "rgba(0,0,0,0.1)",
    chartSurface: "#ffffff",
    error: "#ef4444",
    heartRateZoneColors: FALLBACK_HEART_RATE_ZONE_COLORS,
    info: "#3b82f665",
    powerZoneColors: FALLBACK_POWER_ZONE_COLORS,
    primary: "#3b82f6",
    primaryAlpha: "rgba(59, 130, 246, 0.2)",
    primaryShadow: "rgba(59, 130, 246, 0.30)",
    primaryShadowHeavy: "rgba(59, 130, 246, 0.50)",
    primaryShadowLight: "rgba(59, 130, 246, 0.10)",
    shadow: "rgba(0, 0, 0, 0.15)",
    shadowHeavy: "rgba(0, 0, 0, 0.25)",
    shadowLight: "rgba(0, 0, 0, 0.05)",
    shadowMedium: "rgba(0, 0, 0, 0.15)",
    success: "#10b981",
    surface: "#f8f9fa",
    surfaceSecondary: "#e9ecef",
    text: "#1e293b",
    textPrimary: "#0f172a",
    textSecondary: "#6b7280",
    warning: "#f59e0b",
    zoneColors: FALLBACK_ZONE_COLORS,
};

function isThemeConfigProvider(value: unknown): value is ThemeConfigProvider {
    return typeof value === "function";
}

function resolveThemeConfigProvider(
    value: unknown
): ThemeConfigProvider | null {
    if (isThemeConfigProvider(value)) {
        return value;
    }

    if (!isObjectRecord(value)) {
        return null;
    }

    if (isThemeConfigProvider(value["getThemeConfig"])) {
        return value["getThemeConfig"];
    }

    const defaultExport = value["default"];
    if (isThemeConfigProvider(defaultExport)) {
        return defaultExport;
    }

    if (
        isObjectRecord(defaultExport) &&
        isThemeConfigProvider(defaultExport["getThemeConfig"])
    ) {
        return defaultExport["getThemeConfig"];
    }

    return null;
}

/**
 * Normalizes a theme config object to ensure required color keys exist.
 */
export function normalizeThemeConfig(
    rawConfig: unknown
): NormalizedThemeConfig {
    const normalized: Partial<NormalizedThemeConfig> & Record<string, unknown> =
        isObjectRecord(rawConfig) ? { ...rawConfig } : {};
    const providedColors =
        isObjectRecord(rawConfig) && isObjectRecord(rawConfig["colors"])
            ? rawConfig["colors"]
            : {};
    const mergedColors = {
        ...FALLBACK_THEME_COLORS,
        ...providedColors,
    } as NormalizedThemeColors;

    if (
        !Array.isArray(mergedColors.zoneColors) ||
        mergedColors.zoneColors.length === 0
    ) {
        mergedColors.zoneColors = [...FALLBACK_ZONE_COLORS];
    }
    if (
        !Array.isArray(mergedColors.heartRateZoneColors) ||
        mergedColors.heartRateZoneColors.length === 0
    ) {
        mergedColors.heartRateZoneColors = [...FALLBACK_HEART_RATE_ZONE_COLORS];
    }
    if (
        !Array.isArray(mergedColors.powerZoneColors) ||
        mergedColors.powerZoneColors.length === 0
    ) {
        mergedColors.powerZoneColors = [...FALLBACK_POWER_ZONE_COLORS];
    }

    normalized.colors = mergedColors;

    if (typeof normalized.isDark !== "boolean") {
        normalized.isDark = false;
    }
    if (typeof normalized.isLight !== "boolean") {
        normalized.isLight = !normalized.isDark;
    }
    if (typeof normalized.theme !== "string") {
        normalized.theme = normalized.isDark ? "dark" : "light";
    }

    return normalized as NormalizedThemeConfig;
}

/**
 * Safely loads and normalizes the current theme configuration without requiring
 * the legacy theme module during renderer module initialization.
 */
export async function getThemeConfigSafe(): Promise<NormalizedThemeConfig> {
    let themeConfig: unknown;
    try {
        const mod = await import("../../theming/core/theme.js");
        const importedProvider = resolveThemeConfigProvider(mod);
        if (importedProvider) {
            themeConfig = importedProvider();
        }
    } catch (error) {
        console.warn("[ChartJS] getThemeConfigSafe() fallback:", error);
    }

    return normalizeThemeConfig(themeConfig);
}
