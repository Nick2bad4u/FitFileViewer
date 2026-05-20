/**
 * Known icon names supported by the legacy icon factory.
 */
export type AppIconName =
    | "activity"
    | "arrowLeft"
    | "arrowRight"
    | "bike"
    | "calendar"
    | "calendarRange"
    | "calendarWeek"
    | "circleHelp"
    | "circleX"
    | "database"
    | "file"
    | "folder"
    | "folderOpen"
    | "gauge"
    | "hash"
    | "history"
    | "map"
    | "route"
    | "ruler"
    | "settings"
    | "table"
    | "target"
    | "timer";

/**
 * Options accepted by the legacy icon SVG factory.
 */
export interface AppIconSvgOptions {
    className?: string;
    size?: number;
    strokeWidth?: number;
    title?: string;
}

export function getAppIconSvg(
    name: AppIconName,
    options?: AppIconSvgOptions
): string;
