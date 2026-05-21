import { clearElement, sanitizeCssColorToken } from "../../dom/index.js";
import {
    getElementByIdFlexible,
    querySelectorByIdFlexible,
} from "../../ui/dom/elementIdUtils.js";
import { getRecordValue } from "./renderChartModuleHelpers.js";
import { isElement, safeAppend } from "./renderChartDomHelpers.js";

interface RenderPlaceholderDependencies {
    doc: Document;
    getThemeConfig(): Promise<unknown>;
}

const FALLBACK_BACKGROUND_ALT = "#ffffff";
const FALLBACK_BORDER = "#e5e7eb";
const FALLBACK_ERROR = "#ef4444";
const FALLBACK_TEXT = "#1e293b";
const FALLBACK_TEXT_PRIMARY = "#0f172a";

function getThemeColor(
    themeConfig: unknown,
    colorName: string,
    fallback: string
): string {
    return sanitizeCssColorToken(
        getRecordValue(getRecordValue(themeConfig, "colors"), colorName),
        fallback
    );
}

function resolveTargetContainer(
    doc: Document,
    targetContainer: unknown
): HTMLElement | null {
    if (typeof targetContainer === "string") {
        const normalizedId = targetContainer.startsWith("#")
            ? targetContainer.slice(1)
            : targetContainer;

        return (
            getElementByIdFlexible(doc, normalizedId) ||
            querySelectorByIdFlexible(doc, targetContainer)
        );
    }

    return isElement(targetContainer) ? targetContainer : null;
}

function resolveNoDataContainer(
    doc: Document,
    targetContainer: unknown
): HTMLElement | null {
    return (
        resolveTargetContainer(doc, targetContainer) ||
        querySelectorByIdFlexible(doc, "#content_chart")
    );
}

function resolveErrorContainer(
    doc: Document,
    targetContainer: unknown
): HTMLElement | null {
    return (
        querySelectorByIdFlexible(doc, "#content_chart") ||
        resolveTargetContainer(doc, targetContainer)
    );
}

/**
 * Renders the state-aware no-chart-data placeholder.
 */
export async function renderNoChartDataPlaceholder(
    dependencies: RenderPlaceholderDependencies,
    targetContainer: unknown
): Promise<void> {
    const container = resolveNoDataContainer(dependencies.doc, targetContainer);
    if (!container) {
        return;
    }

    const themeConfig = await dependencies.getThemeConfig();
    const safeText = getThemeColor(themeConfig, "text", FALLBACK_TEXT);
    const safeTextPrimary = getThemeColor(
        themeConfig,
        "textPrimary",
        FALLBACK_TEXT_PRIMARY
    );
    const safeBgAlt = getThemeColor(
        themeConfig,
        "backgroundAlt",
        FALLBACK_BACKGROUND_ALT
    );
    const safeBorder = getThemeColor(themeConfig, "border", FALLBACK_BORDER);

    container.replaceChildren();

    const wrapper = dependencies.doc.createElement("div");
    wrapper.className = "chart-placeholder";
    wrapper.style.textAlign = "center";
    wrapper.style.padding = "40px";
    wrapper.style.color = `var(--color-fg, ${safeText})`;
    wrapper.style.background = `var(--color-bg-alt-solid, ${safeBgAlt})`;
    wrapper.style.borderRadius = "12px";
    wrapper.style.margin = "20px 0";
    wrapper.style.border = `1px solid var(--color-border, ${safeBorder})`;

    const heading = dependencies.doc.createElement("h3");
    heading.textContent = "No Chart Data Available";
    heading.style.color = `var(--color-fg-alt, ${safeTextPrimary})`;
    heading.style.marginBottom = "16px";

    const explanation = dependencies.doc.createElement("p");
    explanation.textContent =
        "This FIT file does not contain time-series data that can be charted.";
    explanation.style.marginBottom = "8px";

    const suggestion = dependencies.doc.createElement("p");
    suggestion.textContent =
        "Try loading a FIT file from a fitness activity or workout.";
    suggestion.style.marginBottom = "0";

    wrapper.append(heading, explanation, suggestion);
    container.append(wrapper);
}

/**
 * Renders the state-aware chart rendering error placeholder.
 */
export async function renderChartErrorPlaceholder(
    dependencies: RenderPlaceholderDependencies,
    targetContainer: unknown,
    error: unknown
): Promise<void> {
    const container = resolveErrorContainer(dependencies.doc, targetContainer);
    if (!container) {
        return;
    }

    const themeConfig = await dependencies.getThemeConfig();
    const safeText = getThemeColor(themeConfig, "text", FALLBACK_TEXT);
    const safeBgAlt = getThemeColor(
        themeConfig,
        "backgroundAlt",
        FALLBACK_BACKGROUND_ALT
    );
    const safeBorder = getThemeColor(themeConfig, "border", FALLBACK_BORDER);
    const safeError = getThemeColor(themeConfig, "error", FALLBACK_ERROR);

    clearElement(container);

    const wrapper = dependencies.doc.createElement("div");
    wrapper.className = "chart-error";
    wrapper.style.textAlign = "center";
    wrapper.style.padding = "40px";
    wrapper.style.color = `var(--color-error, ${safeError})`;
    wrapper.style.background = `var(--color-glass, ${safeBgAlt})`;
    wrapper.style.border = `1px solid var(--color-border, ${safeBorder})`;
    wrapper.style.borderRadius = "var(--border-radius, 12px)";
    wrapper.style.margin = "20px 0";

    const heading = dependencies.doc.createElement("h3");
    heading.textContent = "Chart Rendering Error";
    heading.style.marginBottom = "16px";
    heading.style.color = `var(--color-error, ${safeError})`;

    const message = dependencies.doc.createElement("p");
    message.textContent = "An error occurred while rendering the charts.";
    message.style.marginBottom = "8px";
    message.style.color = `var(--color-fg, ${safeText})`;

    const details = dependencies.doc.createElement("details");
    details.style.textAlign = "left";
    details.style.marginTop = "16px";

    const summary = dependencies.doc.createElement("summary");
    summary.textContent = "Error Details";
    summary.style.cursor = "pointer";
    summary.style.fontWeight = "bold";
    summary.style.color = `var(--color-fg, ${safeText})`;

    const pre = dependencies.doc.createElement("pre");
    pre.style.background = `var(--color-glass, ${safeBgAlt})`;
    pre.style.color = `var(--color-fg, ${safeText})`;
    pre.style.padding = "8px";
    pre.style.borderRadius = "var(--border-radius-small, 4px)";
    pre.style.marginTop = "8px";
    pre.style.fontSize = "12px";
    pre.style.overflowX = "auto";
    pre.style.border = `1px solid var(--color-border, ${safeBorder})`;
    pre.textContent =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

    safeAppend(details, summary);
    safeAppend(details, pre);
    safeAppend(wrapper, heading);
    safeAppend(wrapper, message);
    safeAppend(wrapper, details);
    safeAppend(container, wrapper);
}
