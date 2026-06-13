import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { isRendererDebugLoggingEnabled } from "../../debug/rendererDebugLoggingState.js";
import { getRendererDebugRuntime } from "../../debug/rendererDebugRuntime.js";

/**
 * Bounds for the rendered reset-zoom overlay button.
 */
export interface ZoomResetButtonBounds {
    h: number;
    w: number;
    x: number;
    y: number;
}

/**
 * Minimal chart shape required by the zoom reset plugin.
 */
export interface ZoomResetChart {
    _zoomResetBtnBounds?: null | ZoomResetButtonBounds;
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
    isZoomedOrPanned?: () => boolean;
    resetZoom?: () => void;
}

/**
 * Minimal chart event wrapper used by Chart.js plugin callbacks.
 */
export interface ZoomResetEventArgs {
    event?: {
        native?: {
            clientX?: number;
            clientY?: number;
            preventDefault?: () => void;
            stopPropagation?: () => void;
        };
        type?: string;
    };
}

/**
 * Chart.js-compatible zoom reset plugin surface.
 */
export interface ZoomResetPlugin {
    afterDraw: (chart: ZoomResetChart) => void;
    afterEvent: (chart: ZoomResetChart, args: ZoomResetEventArgs) => void;
    id: "chartZoomResetPlugin";
}

interface CornerRadii {
    bl: number;
    br: number;
    tl: number;
    tr: number;
}

type LegacyCornerRadius = Partial<CornerRadii>;

const BUTTON_HEIGHT = 30,
    BUTTON_RADIUS = 8,
    BUTTON_WIDTH = 100,
    BUTTON_X_OFFSET = 12,
    BUTTON_Y = 12,
    FALLBACK_ACCENT = "#667eea",
    FALLBACK_TEXT_PRIMARY = "#ffffff";
const rendererDebugRuntime = getRendererDebugRuntime();

function getThemeColor(colorKey: string, fallback: string): string {
    const value = getThemeConfig().colors[colorKey];

    return typeof value === "string" ? value : fallback;
}

function shouldLogDebugWarnings(): boolean {
    return rendererDebugRuntime.isRendererDebugLoggingAvailable(
        isRendererDebugLoggingEnabled()
    );
}

function normalizeRadius(radius: unknown): CornerRadii {
    if (typeof radius === "number" && Number.isFinite(radius)) {
        return {
            bl: radius,
            br: radius,
            tl: radius,
            tr: radius,
        };
    }

    if (isLegacyCornerRadius(radius)) {
        return {
            bl: toFiniteCornerRadius(radius.bl),
            br: toFiniteCornerRadius(radius.br),
            tl: toFiniteCornerRadius(radius.tl),
            tr: toFiniteCornerRadius(radius.tr),
        };
    }

    return {
        bl: 5,
        br: 5,
        tl: 5,
        tr: 5,
    };
}

function isLegacyCornerRadius(value: unknown): value is LegacyCornerRadius {
    return (
        isObjectRecord(value) &&
        ("bl" in value || "br" in value || "tl" in value || "tr" in value)
    );
}

function toFiniteCornerRadius(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isResetEventType(type: string | undefined): boolean {
    return type === "click" || type === "touchend";
}

function isInsideButton(
    bounds: ZoomResetButtonBounds,
    mouseX: number,
    mouseY: number
): boolean {
    return (
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.w &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.h
    );
}

/**
 * Install a `roundRect` canvas polyfill when the runtime does not provide one.
 */
export function installRoundRectPolyfill(): void {
    if (typeof CanvasRenderingContext2D === "undefined") {
        return;
    }

    const ctxProto = CanvasRenderingContext2D.prototype;

    if (typeof ctxProto.roundRect === "function") {
        return;
    }

    ctxProto.roundRect = function (
        this: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius?: unknown
    ): CanvasRenderingContext2D {
        const r = normalizeRadius(radius);

        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + width - r.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + r.tr);
        this.lineTo(x + width, y + height - r.br);
        this.quadraticCurveTo(
            x + width,
            y + height,
            x + width - r.br,
            y + height
        );
        this.lineTo(x + r.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();

        return this;
    };
}

/**
 * Zoom reset plugin with defensive guards and minimal chart coupling.
 */
export const chartZoomResetPlugin: ZoomResetPlugin = {
    afterDraw(chart) {
        try {
            if (!chart.isZoomedOrPanned?.()) {
                return;
            }

            const { canvas, ctx } = chart;

            if (!ctx || !canvas) {
                return;
            }

            const accent = getThemeColor("accent", FALLBACK_ACCENT),
                textPrimary = getThemeColor(
                    "textPrimary",
                    FALLBACK_TEXT_PRIMARY
                ),
                x = (canvas.width || 0) - BUTTON_WIDTH - BUTTON_X_OFFSET;

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = `${accent}CC`;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(
                    x,
                    BUTTON_Y,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    BUTTON_RADIUS
                );
            } else {
                ctx.rect(x, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT);
            }

            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.font = "bold 12px system-ui";
            ctx.fillStyle = textPrimary;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                "🔄 Reset Zoom",
                x + BUTTON_WIDTH / 2,
                BUTTON_Y + BUTTON_HEIGHT / 2
            );
            ctx.restore();

            chart._zoomResetBtnBounds = {
                h: BUTTON_HEIGHT,
                w: BUTTON_WIDTH,
                x,
                y: BUTTON_Y,
            };
        } catch (error) {
            if (shouldLogDebugWarnings()) {
                console.warn("[chartZoomResetPlugin] afterDraw error", error);
            }
        }
    },

    afterEvent(chart, args) {
        try {
            if (!chart.isZoomedOrPanned?.()) {
                return;
            }

            const eventWrapper = args.event,
                nativeEvent = eventWrapper?.native,
                canvas = chart.canvas,
                bounds = chart._zoomResetBtnBounds;

            if (!canvas || !bounds || !nativeEvent) {
                return;
            }

            const rect = canvas.getBoundingClientRect(),
                mouseX = (nativeEvent.clientX ?? 0) - rect.left,
                mouseY = (nativeEvent.clientY ?? 0) - rect.top;

            if (
                !isResetEventType(eventWrapper.type) ||
                !isInsideButton(bounds, mouseX, mouseY)
            ) {
                return;
            }

            nativeEvent.stopPropagation?.();
            nativeEvent.preventDefault?.();

            if (chart.resetZoom) {
                chart.resetZoom();
                void showNotification("Chart zoom reset", "success");
            }
        } catch (error) {
            if (shouldLogDebugWarnings()) {
                console.warn("[chartZoomResetPlugin] afterEvent error", error);
            }
        }
    },

    id: "chartZoomResetPlugin",
};

installRoundRectPolyfill();
