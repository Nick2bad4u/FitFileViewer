/**
 * Known chart/theme color values exposed by the legacy theme core.
 */
export type ThemeColorValue = readonly string[] | string;

/**
 * Theme color map exposed by `getThemeConfig`.
 */
export type ThemeColorMap = Record<string, ThemeColorValue>;

/**
 * Theme configuration exposed by the legacy JavaScript theme core.
 */
export interface ThemeConfig {
    colors: ThemeColorMap;
    isDark: boolean;
    isLight: boolean;
    theme: string;
}

/**
 * Resolved app theme after applying stored and system preferences.
 */
export type EffectiveTheme = "dark" | "light";

/**
 * Canonical persisted app theme preference.
 */
export type ThemePreference = "auto" | "dark" | "light";

export function applyTheme(
    theme: string,
    withTransition?: boolean
): void;

export function getEffectiveTheme(theme?: null | string): EffectiveTheme;

export function getThemeConfig(): ThemeConfig;

export function listenForThemeChange(
    onThemeChange: (theme: string) => void
): void;
