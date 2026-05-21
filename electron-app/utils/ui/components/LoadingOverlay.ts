import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import type { ThemeColorMap } from "../../theming/core/theme.js";

const SVG_NS = "http://www.w3.org/2000/svg";

interface LoadingOverlayThemeColors {
    background: string;
    border: string;
    primary: string;
    textPrimary: string;
    textSecondary: string;
}

const DEFAULT_THEME_COLORS = {
    background: "#ffffff",
    border: "#d1d5db",
    primary: "#3b82f6",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
} as const satisfies LoadingOverlayThemeColors;

function createOverlayContent(
    themeColors: LoadingOverlayThemeColors
): HTMLDivElement {
    const container = document.createElement("div");
    Object.assign(container.style, {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
    });

    const spinner = document.createElement("div");
    spinner.className = "modern-spinner";
    Object.assign(spinner.style, {
        height: "54px",
        marginBottom: "22px",
        width: "54px",
    });

    const style = document.createElement("style");
    style.textContent = `
        @keyframes fitfile-spin { 100% { transform: rotate(360deg); } }
        .modern-spinner {
            display: inline-block;
            position: relative;
        }
        .modern-spinner svg {
            animation: fitfile-spin 1.1s linear infinite;
            display: block;
        }
    `;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 50 50");
    svg.setAttribute("width", "54");
    svg.setAttribute("height", "54");

    const track = document.createElementNS(SVG_NS, "circle");
    track.setAttribute("cx", "25");
    track.setAttribute("cy", "25");
    track.setAttribute("r", "20");
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", themeColors.border);
    track.setAttribute("stroke-width", "5");
    track.setAttribute("opacity", "0.18");

    const progress = document.createElementNS(SVG_NS, "circle");
    progress.setAttribute("cx", "25");
    progress.setAttribute("cy", "25");
    progress.setAttribute("r", "20");
    progress.setAttribute("fill", "none");
    progress.setAttribute("stroke", themeColors.primary);
    progress.setAttribute("stroke-width", "5");
    progress.setAttribute("stroke-linecap", "round");
    progress.setAttribute("stroke-dasharray", "31.4 94.2");

    svg.append(track, progress);
    spinner.append(style, svg);

    const text = document.createElement("div");
    text.id = "fitfile-loading-text";
    text.textContent = "Loading...";
    Object.assign(text.style, {
        fontSize: "1.15em",
        fontWeight: "500",
        marginBottom: "6px",
    });

    const filename = document.createElement("div");
    filename.id = "fitfile-loading-filename";
    Object.assign(filename.style, {
        color: themeColors.textSecondary,
        fontSize: "0.98em",
        maxWidth: "340px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    });

    container.append(spinner, text, filename);

    return container;
}

function getLoadingOverlayThemeColors(): LoadingOverlayThemeColors {
    const themeColors = getThemeColors();

    return {
        background: resolveThemeColor(themeColors, "background"),
        border: resolveThemeColor(themeColors, "border"),
        primary: resolveThemeColor(themeColors, "primary"),
        textPrimary: resolveThemeColor(themeColors, "textPrimary"),
        textSecondary: resolveThemeColor(themeColors, "textSecondary"),
    };
}

function resolveThemeColor(
    themeColors: ThemeColorMap,
    key: keyof LoadingOverlayThemeColors
): string {
    const value = themeColors[key];

    return typeof value === "string" && value
        ? value
        : DEFAULT_THEME_COLORS[key];
}

/**
 * Loading overlay management functions
 */
export const LoadingOverlay = {
    /**
     * Hides the loading overlay
     */
    hide(): void {
        const overlay = document.querySelector("#fitfile-loading-overlay");
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Shows a loading overlay with progress text
     */
    show(progressText: string, fileName = ""): void {
        let overlay = document.querySelector<HTMLDivElement>(
            "#fitfile-loading-overlay"
        );
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "fitfile-loading-overlay";

            const themeColors = getLoadingOverlayThemeColors();
            Object.assign(overlay.style, {
                alignItems: "center",
                background: `${themeColors.background}d9`, // Add transparency
                color: themeColors.textPrimary,
                display: "flex",
                flexDirection: "column",
                fontSize: "1.3em",
                height: "100vh",
                justifyContent: "center",
                left: "0",
                position: "fixed",
                top: "0",
                width: "100vw",
                zIndex: "99999",
            });

            overlay.append(createOverlayContent(themeColors));
            document.body.append(overlay);
        }

        const textDiv = document.querySelector<HTMLElement>(
            "#fitfile-loading-text"
        );
        if (textDiv) {
            textDiv.textContent = progressText || "Loading...";
        }

        const fileDiv = document.querySelector<HTMLElement>(
            "#fitfile-loading-filename"
        );
        if (fileDiv) {
            fileDiv.textContent = fileName ? `File: ${fileName}` : "";
        }
    },
} as const;
