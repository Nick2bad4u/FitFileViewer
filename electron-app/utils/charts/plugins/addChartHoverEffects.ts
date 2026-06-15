import {
    getThemeConfig,
    type ThemeColorValue,
} from "../../theming/core/theme.js";
import type { AppIconName } from "../../ui/icons/iconFactory.js";
import {
    isChartDebugLoggingEnabled,
    isChartFullscreenTraceEnabled,
} from "../core/chartDebugState.js";
import { getRegisteredChartInstanceForCanvas } from "../core/chartInstanceRegistry.js";
import { resolveChartRuntime } from "../core/chartRuntime.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { resolveChartTitleIconName } from "./chartTitleOverlayUtils.js";
import { getChartHoverEffectsRuntime } from "./addChartHoverEffectsRuntime.js";
const FULLSCREEN_EVENTS = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
];
const DEFAULT_CHART_HEIGHT = "400px";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
let chartFullscreenTraceCounter = 0;

interface ChartHoverColors {
    [key: string]: ThemeColorValue | undefined;
    accent?: string;
    border?: string;
    primary?: string;
    primaryShadowHeavy?: string;
    primaryShadowLight?: string;
    shadow?: string;
    shadowLight?: string;
    surface?: string;
    surfaceSecondary?: string;
    textPrimary?: string;
}

interface ChartInstanceLike {
    resize?: () => void;
}

interface ChartGlobalLike {
    getChart?: (canvas: HTMLCanvasElement) => unknown;
}

interface FullscreenDocument extends Document {
    mozCancelFullScreen?: () => Promise<void> | void;
    mozFullScreenElement?: Element | null;
    msExitFullscreen?: () => Promise<void> | void;
    msFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
}

interface FullscreenHTMLElement extends HTMLElement {
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullscreen?: () => Promise<void> | void;
}

const chartHoverEffectsRuntime = getChartHoverEffectsRuntime();
const wrapperCleanupControllers = new WeakMap<HTMLElement, AbortController>();

/** Theme color values consumed by chart hover styling. */
export interface ChartHoverThemeConfig {
    colors: ChartHoverColors;
}

function isPromiseLike(value: unknown): value is PromiseLike<void> {
    return (
        isObjectRecord(value) &&
        "then" in value &&
        typeof value["then"] === "function"
    );
}

function createSvgPath(pathData: string): SVGPathElement {
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    return path;
}

function createFullscreenIcon(mode: "enter" | "exit"): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const pathData =
        mode === "enter"
            ? [
                  "M9 3H5a2 2 0 0 0-2 2v4",
                  "M15 3h4a2 2 0 0 1 2 2v4",
                  "M9 21H5a2 2 0 0 1-2-2v-4",
                  "M15 21h4a2 2 0 0 0 2-2v-4",
              ]
            : [
                  "M9 9H5a2 2 0 0 1-2-2V3",
                  "M15 9h4a2 2 0 0 0 2-2V3",
                  "M9 15H5a2 2 0 0 0-2 2v4",
                  "M15 15h4a2 2 0 0 1 2 2v4",
              ];

    for (const path of pathData) {
        svg.append(createSvgPath(path));
    }

    return svg;
}

function createTitleIcon(iconName: AppIconName): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("class", "chart-title-overlay__icon");
    svg.setAttribute("width", "12");
    svg.setAttribute("height", "12");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const iconPaths: Partial<Record<AppIconName, readonly string[]>> = {
        activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
        gauge: ["M12 14l4-4", "M4 18a8 8 0 1 1 16 0"],
        route: ["M6 19a3 3 0 1 1 0-6h12a3 3 0 1 0 0-6H7"],
        ruler: [
            "M4 17 17 4",
            "M14 7l3 3",
            "M10 11l2 2",
            "M6 15l3 3",
        ],
        table: [
            "M3 5h18v14H3z",
            "M3 10h18",
            "M8 5v14",
        ],
        timer: [
            "M10 2h4",
            "M12 14l3-3",
            "M12 22a8 8 0 1 0 0-16",
        ],
    };

    for (const path of iconPaths[iconName] ?? iconPaths.table ?? []) {
        svg.append(createSvgPath(path));
    }

    return svg;
}

function replaceElementChildren(
    element: Element,
    ...children: Array<Node | string>
): void {
    element.replaceChildren(...children);
}

function scheduleAnimationFrame(
    callback: () => void,
    signal?: AbortSignal
): void {
    const animationFrameId = chartHoverEffectsRuntime.requestAnimationFrame(() => {
        if (signal?.aborted === true) {
            return;
        }
        callback();
    });

    void animationFrameId;
}

function scheduleTimeout(
    callback: () => void,
    delay: number,
    signal?: AbortSignal
): void {
    const timeoutId = chartHoverEffectsRuntime.setTimeout(() => {
        if (signal?.aborted === true) {
            return;
        }
        callback();
    }, delay);

    void timeoutId;
}

function isChartInstanceLike(value: unknown): value is ChartInstanceLike {
    return isObjectRecord(value);
}

function isChartGlobalLike(value: unknown): value is ChartGlobalLike {
    return isObjectRecord(value);
}

function resolveChartHoverThemeConfig(value: unknown): ChartHoverThemeConfig {
    if (
        !isObjectRecord(value) ||
        !("colors" in value) ||
        !isObjectRecord(value["colors"])
    ) {
        return { colors: {} };
    }

    const colors: ChartHoverColors = {};
    for (const [key, color] of Object.entries(value["colors"])) {
        if (typeof color === "string") {
            colors[key] = color;
        }
    }
    return { colors };
}

function isFullscreenTraceEnabled(): boolean {
    return isChartFullscreenTraceEnabled();
}

function describeElement(element: Element | null): string {
    if (!element) {
        return "<none>";
    }
    const id = element.id ? `#${element.id}` : "";
    const className =
        typeof element.className === "string" && element.className.length > 0
            ? `.${element.className.trim().replaceAll(/\s+/gu, ".")}`
            : "";
    return `${element.tagName.toLowerCase()}${id}${className}`;
}

function traceChartFullscreen(
    traceId: string,
    event: string,
    payload: Record<string, unknown> = {}
): void {
    if (!isFullscreenTraceEnabled()) {
        return;
    }
    try {
        console.log(`[ChartFullscreen:${traceId}] ${event}`, payload);
    } catch {
        /* ignore */
    }
}

function getChartInstanceFromCanvas(
    canvas: HTMLCanvasElement
): ChartInstanceLike | null {
    const chartGlobal = resolveChartRuntime(isChartGlobalLike);
    if (chartGlobal && typeof chartGlobal.getChart === "function") {
        const chart = chartGlobal.getChart(canvas);
        return isChartInstanceLike(chart) ? chart : null;
    }

    const registeredChart = getRegisteredChartInstanceForCanvas(canvas);
    return isChartInstanceLike(registeredChart) ? registeredChart : null;
}

function requestChartResize(canvas: HTMLCanvasElement | null): void {
    if (!canvas) {
        return;
    }
    const chart = getChartInstanceFromCanvas(canvas);
    if (chart && typeof chart.resize === "function") {
        chart.resize();
    }
}

function applyCanvasSize(
    canvas: HTMLCanvasElement | null,
    isFullscreen: boolean
): void {
    if (!canvas || !canvas.style) {
        return;
    }
    if (isFullscreen) {
        canvas.style.height = "100%";
        canvas.style.maxHeight = "none";
    } else {
        canvas.style.height = DEFAULT_CHART_HEIGHT;
        canvas.style.maxHeight = DEFAULT_CHART_HEIGHT;
    }
}

function getFullscreenElement(): Element | null {
    const doc = document as FullscreenDocument;
    return (
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        null
    );
}

async function waitForAnimationFrame(): Promise<void> {
    await chartHoverEffectsRuntime.waitForAnimationFrame();
}

async function waitForFullscreenTarget(
    target: Element | null,
    maxFrames = 3
): Promise<boolean> {
    for (let frame = 0; frame < maxFrames; frame += 1) {
        if (getFullscreenElement() === target) {
            return true;
        }
        await waitForAnimationFrame();
    }
    return getFullscreenElement() === target;
}

function isWrapperFullscreenActive(wrapper: HTMLElement): boolean {
    const fsElement = getFullscreenElement();
    if (fsElement === wrapper) {
        return true;
    }
    return false;
}

function isWrapperOverlayFullscreenActive(wrapper: HTMLElement): boolean {
    return wrapper.classList.contains("chart-wrapper--overlay-fullscreen");
}

async function requestNativeFullscreen(element: HTMLElement): Promise<void> {
    const fullscreenElement = element as FullscreenHTMLElement;
    const request =
        fullscreenElement.requestFullscreen ||
        fullscreenElement.webkitRequestFullscreen ||
        fullscreenElement.mozRequestFullScreen ||
        fullscreenElement.msRequestFullscreen;
    if (request) {
        const result = request.call(element);
        if (isPromiseLike(result)) {
            await result;
        }
    }
}

async function requestElementFullscreen(element: HTMLElement): Promise<void> {
    await requestNativeFullscreen(element);
}

async function exitFullscreen(): Promise<void> {
    const doc = document as FullscreenDocument;
    const exit =
        document.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;
    if (exit) {
        const result = exit.call(document);
        if (isPromiseLike(result)) {
            await result;
        }
    }
}

/**
 * Add interactive hover, fullscreen, and ripple affordances to chart canvases.
 */
export function addChartHoverEffects(
    chartContainer: HTMLElement | null | undefined,
    themeConfig: ChartHoverThemeConfig | null | undefined
): void {
    if (!chartContainer || !themeConfig) {
        console.warn("[ChartHoverEffects] Missing required parameters");
        return;
    }

    // Find all chart canvases in the container
    const chartCanvases =
        chartContainer.querySelectorAll<HTMLElement>(".chart-canvas");

    const isDebugLoggingEnabled = isChartDebugLoggingEnabled();

    let appliedCount = 0;
    for (const canvas of chartCanvases) {
        if (!(canvas instanceof HTMLElement)) {
            continue;
        }
        // Skip if hover effects already added
        if (canvas.dataset && canvas.dataset["hoverEffectsAdded"]) {
            continue;
        }

        // Mark as having hover effects
        if (canvas.dataset) {
            canvas.dataset["hoverEffectsAdded"] = "true";
        }
        appliedCount += 1;

        // Create a wrapper div for the chart to handle hover effects properly
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        const colors = themeConfig.colors;
        wrapper.style.cssText = `
            position: relative;
            margin-bottom: 24px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            border: 2px solid ${colors.border || "#444"};
            background: ${colors.surface || "#222"};
            padding: 16px;
            box-shadow: 0 4px 20px ${colors.shadowLight || "#00000055"},
                        0 2px 8px ${colors.primaryShadowLight || "#00000033"};
            box-sizing: border-box;
        `;

        // Insert wrapper before canvas and move canvas into wrapper
        if (canvas.parentNode instanceof HTMLElement) {
            canvas.parentNode.insertBefore(wrapper, canvas);
        }
        wrapper.append(canvas); // Update canvas styles to work with wrapper - ensure it stays inside
        if (canvas.style) {
            canvas.style.border = "none";
            canvas.style.boxShadow = "none";
            canvas.style.margin = "0";
            canvas.style.marginBottom = "0";
            canvas.style.borderRadius = "8px";
            canvas.style.display = "block";
            canvas.style.width = "100%";
            canvas.style.maxWidth = "100%";
            canvas.style.height = DEFAULT_CHART_HEIGHT;
            canvas.style.maxHeight = DEFAULT_CHART_HEIGHT;
            canvas.style.position = "relative";
            canvas.style.boxSizing = "border-box";
        }

        // Add animated border glow overlay
        const glowOverlay = document.createElement("div");
        glowOverlay.className = "chart-glow-overlay";
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, ${colors.primary || "#888"}, ${colors.accent || "#555"}, ${colors.primary || "#888"});
            border-radius: 14px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
            pointer-events: none;
            box-shadow: 0 2px 8px ${colors.shadowLight || "#00000033"};
        `;
        glowOverlay.style.opacity = "0";
        wrapper.append(glowOverlay);

        const chartTitle = canvas.getAttribute("aria-label") || "Chart",
            titleOverlay = document.createElement("div");
        const overlayTitle = chartTitle.replace("Chart for ", "").trim();
        const overlayTitleText = overlayTitle.toUpperCase() || "CHART";
        titleOverlay.className = "chart-title-overlay";
        titleOverlay.style.cssText = `
            position: absolute;
            top: 8px;
            left: 16px;
            background: ${colors.primary || "#555"};
            color: ${colors.textPrimary || "#fff"};
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            opacity: 0;
            transform: translateY(-8px);
            transition: all 0.3s ease;
            z-index: 10;
            pointer-events: none;
            box-shadow: 0 2px 8px ${colors.shadowLight || "#00000033"};
        `;
        const titleIcon = createTitleIcon(
            resolveChartTitleIconName(overlayTitle)
        );
        const titleText = document.createElement("span");
        titleText.className = "chart-title-overlay__text";
        titleText.textContent = overlayTitleText;
        replaceElementChildren(titleOverlay, titleIcon, titleText);
        titleOverlay.style.display = "inline-flex";
        titleOverlay.style.alignItems = "center";
        titleOverlay.style.gap = "6px";
        titleOverlay.style.opacity = "0";
        titleOverlay.style.transform = "translateY(-8px)";
        wrapper.append(titleOverlay);

        // Add zoom hint overlay (bottom-right) to guide chart interactions
        const zoomHint = document.createElement("div");
        zoomHint.className = "chart-zoom-hint";
        zoomHint.style.cssText = `
            position: absolute;
            right: 12px;
            bottom: 10px;
            background: ${colors.surfaceSecondary || colors.surface || "#222"};
            color: ${colors.textPrimary || "#fff"};
            padding: 4px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.01em;
            opacity: 0;
            transform: translateY(6px);
            transition: all 0.3s ease;
            pointer-events: none;
            box-shadow: 0 2px 8px ${colors.shadowLight || "#00000033"};
            backdrop-filter: var(--backdrop-blur);
            text-transform: none;
            white-space: nowrap;
            z-index: 10;
        `;
        zoomHint.textContent = "Zoom: Ctrl + scroll or pinch • Pan: drag";
        zoomHint.style.opacity = "0";
        zoomHint.style.transform = "translateY(6px)";
        wrapper.append(zoomHint);

        const chartCanvas = canvas instanceof HTMLCanvasElement ? canvas : null;

        // Add fullscreen action button (shown on hover)
        const fullscreenButton = document.createElement("button");
        fullscreenButton.className = "chart-fullscreen-btn";
        fullscreenButton.type = "button";
        fullscreenButton.title = "View chart fullscreen";
        fullscreenButton.setAttribute(
            "aria-label",
            `View ${overlayTitleText} in fullscreen`
        );

        replaceElementChildren(fullscreenButton, createFullscreenIcon("enter"));
        chartFullscreenTraceCounter += 1;
        const traceId = `${chartFullscreenTraceCounter}`;
        let overlayPlaceholder: HTMLDivElement | null = null;
        let overlayParent: HTMLElement | null = null;
        let overlayEscHandler: (event: KeyboardEvent) => void = () => {};
        const cleanupController =
            chartHoverEffectsRuntime.createAbortController();
        const { signal } = cleanupController;
        wrapperCleanupControllers.set(wrapper, cleanupController);

        const enterOverlayFullscreen = () => {
            if (overlayPlaceholder) {
                return;
            }
            const parent = wrapper.parentNode;
            if (!(parent instanceof HTMLElement)) {
                return;
            }

            overlayParent = parent;
            overlayPlaceholder = document.createElement("div");
            overlayPlaceholder.className =
                "chart-overlay-fullscreen-placeholder";
            overlayPlaceholder.style.height = `${wrapper.getBoundingClientRect().height}px`;
            wrapper.before(overlayPlaceholder);

            document.body.append(wrapper);
            wrapper.classList.add("chart-wrapper--overlay-fullscreen");
            document.body.classList.add("chart-overlay-fullscreen-active");

            applyCanvasSize(chartCanvas, true);
            requestChartResize(chartCanvas);
            document.addEventListener("keydown", overlayEscHandler, {
                signal,
            });

            traceChartFullscreen(traceId, "overlay-enter", {
                wrapper: describeElement(wrapper),
            });
        };

        const exitOverlayFullscreen = () => {
            if (!overlayPlaceholder || !overlayParent) {
                return;
            }

            overlayPlaceholder.before(wrapper);
            overlayPlaceholder.remove();
            overlayPlaceholder = null;
            overlayParent = null;

            wrapper.classList.remove("chart-wrapper--overlay-fullscreen");
            document.body.classList.remove("chart-overlay-fullscreen-active");
            applyCanvasSize(chartCanvas, false);
            requestChartResize(chartCanvas);
            document.removeEventListener("keydown", overlayEscHandler);

            traceChartFullscreen(traceId, "overlay-exit", {
                wrapper: describeElement(wrapper),
            });
        };

        const updateFullscreenState = () => {
            const fsElement = getFullscreenElement();
            const isActive =
                isWrapperFullscreenActive(wrapper) ||
                isWrapperOverlayFullscreenActive(wrapper);
            wrapper.classList.toggle("chart-wrapper--fullscreen", isActive);
            applyCanvasSize(chartCanvas, isActive);
            traceChartFullscreen(traceId, "state-update", {
                fullscreenElement: describeElement(fsElement),
                isActive,
                wrapper: describeElement(wrapper),
            });
            replaceElementChildren(
                fullscreenButton,
                createFullscreenIcon(isActive ? "exit" : "enter")
            );
            fullscreenButton.title = isActive
                ? "Exit fullscreen"
                : "View chart fullscreen";
            fullscreenButton.setAttribute(
                "aria-label",
                isActive
                    ? `Exit ${overlayTitleText} fullscreen`
                    : `View ${overlayTitleText} in fullscreen`
            );

            scheduleAnimationFrame(() => {
                requestChartResize(chartCanvas);
            }, signal);
        };

        overlayEscHandler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                exitOverlayFullscreen();
                updateFullscreenState();
            }
        };

        const handleFullscreenChange = () => {
            traceChartFullscreen(traceId, "fullscreenchange-event", {
                fullscreenElement: describeElement(getFullscreenElement()),
            });
            updateFullscreenState();
        };

        for (const evt of FULLSCREEN_EVENTS) {
            document.addEventListener(evt, handleFullscreenChange, { signal });
        }

        fullscreenButton.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const fsElement = getFullscreenElement();
                const isActive = isWrapperFullscreenActive(wrapper);
                const isOverlayActive =
                    isWrapperOverlayFullscreenActive(wrapper);
                traceChartFullscreen(traceId, "button-click", {
                    isActive,
                    isOverlayActive,
                    fullscreenElement: describeElement(fsElement),
                    wrapper: describeElement(wrapper),
                });
                try {
                    if (isOverlayActive) {
                        exitOverlayFullscreen();
                        return;
                    }
                    if (isActive) {
                        traceChartFullscreen(traceId, "exit-request", {
                            via: "button",
                        });
                        await exitFullscreen();
                        return;
                    }
                    if (fsElement && fsElement !== wrapper) {
                        traceChartFullscreen(
                            traceId,
                            "exit-existing-fullscreen",
                            {
                                fullscreenElement: describeElement(fsElement),
                            }
                        );
                        await exitFullscreen();
                        await waitForFullscreenTarget(null, 3);

                        if (getFullscreenElement() !== null) {
                            traceChartFullscreen(
                                traceId,
                                "blocked-existing-fullscreen",
                                {
                                    fullscreenElement: describeElement(
                                        getFullscreenElement()
                                    ),
                                }
                            );
                            return;
                        }
                    }
                    traceChartFullscreen(traceId, "enter-request", {
                        target: describeElement(wrapper),
                    });
                    await requestElementFullscreen(wrapper);

                    const didEnterNativeFullscreen =
                        await waitForFullscreenTarget(wrapper, 3);
                    if (!didEnterNativeFullscreen) {
                        enterOverlayFullscreen();
                    }
                } catch {
                    if (!isWrapperOverlayFullscreenActive(wrapper)) {
                        enterOverlayFullscreen();
                    }
                } finally {
                    updateFullscreenState();
                }
            },
            { signal }
        );

        wrapper.append(fullscreenButton);
        applyCanvasSize(chartCanvas, false);

        // Add hover event listeners to wrapper
        wrapper.addEventListener(
            "mouseenter",
            () => {
                const isFullscreen =
                    wrapper.classList.contains("chart-wrapper--fullscreen") ||
                    wrapper.classList.contains(
                        "chart-wrapper--overlay-fullscreen"
                    );
                if (!isFullscreen) {
                    wrapper.style.transform = "translateY(-6px) scale(1.02)";
                    wrapper.style.boxShadow = `0 12px 40px ${colors.shadow || "#00000088"},
                                       0 8px 20px ${colors.primaryShadowHeavy || "#00000055"}`;
                    wrapper.style.borderColor = colors.primary || "";
                }

                glowOverlay.style.opacity = "0.3";

                titleOverlay.style.opacity = "1";
                titleOverlay.style.transform = "translateY(0)";

                zoomHint.style.opacity = "1";
                zoomHint.style.transform = "translateY(0)";

                if (!isFullscreen) {
                    wrapper.style.background = `linear-gradient(135deg, ${colors.surface || "#222"} 0%, ${colors.surfaceSecondary || colors.surface || "#222"} 100%)`;
                }
            },
            { signal }
        );

        wrapper.addEventListener(
            "mouseleave",
            () => {
                const isFullscreen =
                    wrapper.classList.contains("chart-wrapper--fullscreen") ||
                    wrapper.classList.contains(
                        "chart-wrapper--overlay-fullscreen"
                    );
                if (!isFullscreen) {
                    wrapper.style.transform = "translateY(0) scale(1)";
                    wrapper.style.boxShadow = `0 4px 20px ${colors.shadowLight || "#00000055"},
                                       0 2px 8px ${colors.primaryShadowLight || "#00000033"}`;
                    wrapper.style.borderColor = colors.border || "";
                }

                glowOverlay.style.opacity = "0";

                titleOverlay.style.opacity = "0";
                titleOverlay.style.transform = "translateY(-8px)";

                zoomHint.style.opacity = "0";
                zoomHint.style.transform = "translateY(6px)";

                if (!isFullscreen) {
                    wrapper.style.background = colors.surface || "#222";
                }
            },
            { signal }
        );

        wrapper.addEventListener(
            "click",
            (event) => {
                if (
                    event.target instanceof HTMLElement &&
                    event.target.closest(".chart-fullscreen-btn")
                ) {
                    return;
                }
                if (getFullscreenElement() === wrapper) {
                    return;
                }
                if (
                    wrapper.classList.contains(
                        "chart-wrapper--overlay-fullscreen"
                    )
                ) {
                    return;
                }
                const rect = wrapper.getBoundingClientRect(),
                    ripple = document.createElement("div"),
                    size = Math.max(rect.width, rect.height),
                    x = event.clientX - rect.left - size / 2,
                    y = event.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, ${themeConfig.colors.primary}40, transparent);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
                z-index: 5;
            `;

                wrapper.append(ripple);

                scheduleTimeout(
                    () => {
                        if (ripple.parentNode) {
                            ripple.remove();
                        }
                    },
                    600,
                    signal
                );
            },
            { signal }
        );

        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartHoverEffects] Added hover effects to chart: ${chartTitle}`
            );
        }
    }

    // Inject CSS keyframes for ripple effect if not already added
    if (!document.querySelector("#chart-hover-effects-styles")) {
        const style = document.createElement("style");
        style.id = "chart-hover-effects-styles";
        style.textContent = `
            @keyframes ripple-effect {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }

            .chart-wrapper {
                cursor: pointer;
                box-sizing: border-box;
                width: 100%;
            }

            .chart-wrapper:hover .chart-canvas {
                filter: brightness(1.05) contrast(1.02);
            }

            .chart-wrapper:active {
                transform: translateY(-4px) scale(1.01) !important;
                transition: all 0.1s ease;
            }

            .chart-wrapper .chart-canvas {
                box-sizing: border-box;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                display: block;
            }
        `;
        document.head.append(style);
    }

    if (isDebugLoggingEnabled) {
        console.log(
            `[ChartHoverEffects] Added hover effects to ${appliedCount} chart(s)`
        );
    }
}

/**
 * Apply hover effects to the active chart container using the current app
 * theme.
 */
export function addHoverEffectsToExistingCharts(): void {
    const chartContainer =
        document.querySelector("#chartjs_chart_container") ||
        document.querySelector("#chartjs-chart-container");
    if (!chartContainer) {
        console.warn("[DevHelper] Chart container not found");
        return;
    }

    const themeConfig = resolveChartHoverThemeConfig(getThemeConfig());

    if (chartContainer instanceof HTMLElement) {
        addChartHoverEffects(chartContainer, themeConfig);
    }
    console.log("[DevHelper] Hover effects added to existing charts");
} /**
 * Development helper function to manually add hover effects to existing charts
 * This can be called from the browser console for testing
 */

/**
 * Remove hover-effect wrappers from a chart container and restore canvas
 * styles.
 */
export function removeChartHoverEffects(
    chartContainer: HTMLElement | null | undefined
): void {
    if (!chartContainer) {
        return;
    }

    const chartWrappers = chartContainer.querySelectorAll(".chart-wrapper"),
        { colors } = resolveChartHoverThemeConfig(getThemeConfig());
    for (const wrapper of chartWrappers) {
        const canvas = wrapper.querySelector(".chart-canvas");
        if (
            canvas instanceof HTMLElement &&
            wrapper.parentNode instanceof HTMLElement
        ) {
            if (wrapper instanceof HTMLElement) {
                wrapperCleanupControllers.get(wrapper)?.abort();
                wrapperCleanupControllers.delete(wrapper);
            }
            // Move canvas back to original parent and remove wrapper
            wrapper.parentNode.insertBefore(canvas, wrapper);
            wrapper.remove();
            // Reset canvas styles to original createChartCanvas values
            if (canvas.style) {
                canvas.style.border = "";
                canvas.style.boxShadow = `0 2px 8px ${colors["shadowLight"] || "#00000055"}`;
                canvas.style.margin = "";
                canvas.style.marginBottom = "20px";
                canvas.style.borderRadius = "8px";
                canvas.style.display = "";
                canvas.style.width = "100%";
                canvas.style.maxWidth = "";
                canvas.style.height = "100%";
                canvas.style.maxHeight = "none";
                canvas.style.position = "";
                canvas.style.boxSizing = "";
            }
            if (canvas.dataset) {
                delete canvas.dataset["hoverEffectsAdded"];
            }
        }
    }

    console.log(
        `[ChartHoverEffects] Removed hover effects from ${chartWrappers.length} chart(s)`
    );
}
