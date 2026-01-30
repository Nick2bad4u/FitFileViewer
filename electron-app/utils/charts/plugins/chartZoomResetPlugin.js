import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

// Enhanced zoom reset plugin

/**
 * Minimal shape description to avoid importing chart.js types.
 *
 * @typedef {Object} MinimalChart
 *
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx
 * @property {Function} [isZoomedOrPanned]
 * @property {Function} [resetZoom]
 * @property {Object<string, any>} [_zoomResetBtnBounds]
 * @property {Object<string, any>} [options]
 */

/**
 * @typedef {Object} ChartEventArgs
 *
 * @property {{ type: string; native?: any }} event
 */

/**
 * Zoom reset plugin with defensive guards and minimal typing.
 *
 * @type {{
 *     id: string;
 *     afterDraw: (chart: MinimalChart) => void;
 *     afterEvent: (chart: MinimalChart, args: ChartEventArgs) => void;
 * }}
 */
export const chartZoomResetPlugin = {
    afterDraw(chart) {
        try {
            if (!chart?.isZoomedOrPanned || !chart.isZoomedOrPanned()) {
                return;
            }
            const canvas = chart?.canvas,
                ctx = chart?.ctx;
            if (!ctx || !canvas) {
                return;
            }
            const themeConfig = getThemeConfig() || /** @type {any} */ ({}),
                colors = /** @type {any} */ (
                    (themeConfig && /** @type {any} */ (themeConfig).colors) ||
                        {}
                ),
                accent =
                    typeof colors.accent === "string"
                        ? colors.accent
                        : "#667eea",
                btnH = 30,
                btnW = 100,
                textPrimary =
                    typeof colors.textPrimary === "string"
                        ? colors.textPrimary
                        : "#ffffff",
                x = (canvas.width || 0) - btnW - 12,
                y = 12;

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = `${accent}CC`; // Add alpha to accent color
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            if (typeof ctx.roundRect === "function") {
                ctx.beginPath();
                ctx.roundRect(x, y, btnW, btnH, 8);
                ctx.fill();
                ctx.stroke();
            } else {
                // Fallback rectangle if custom roundRect not present yet
                ctx.beginPath();
                ctx.rect(x, y, btnW, btnH);
                ctx.fill();
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            ctx.font = "bold 12px system-ui";
            ctx.fillStyle = textPrimary;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔄 Reset Zoom", x + btnW / 2, y + btnH / 2);
            ctx.restore();

            // Store button bounds for click detection
            chart._zoomResetBtnBounds = { h: btnH, w: btnW, x, y };
        } catch (error) {
            // Silent fail to avoid breaking charts
            if (
                globalThis.window !== undefined &&
                /** @type {any} */ (globalThis).__renderer_dev?.debug
            ) {
                console.warn("[chartZoomResetPlugin] afterDraw error", error);
            }
        }
    },
    afterEvent(chart, args) {
        try {
            if (!chart?.isZoomedOrPanned || !chart.isZoomedOrPanned()) {
                return;
            }
            const evtWrapper = args?.event,
                e = evtWrapper?.native;
            if (!e) {
                return;
            }

            const canvas = chart?.canvas;
            if (!canvas) {
                return;
            }
            const btn = chart._zoomResetBtnBounds,
                rect = canvas.getBoundingClientRect(),
                mouseX = (e.clientX || 0) - rect.left,
                mouseY = (e.clientY || 0) - rect.top;
            if (!btn) {
                return;
            }

            const { type } = evtWrapper;
            if (
                (type === "click" || type === "touchend") &&
                mouseX >= btn.x &&
                mouseX <= btn.x + btn.w &&
                mouseY >= btn.y &&
                mouseY <= btn.y + btn.h
            ) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                if (e.preventDefault) {
                    e.preventDefault();
                }

                if (typeof chart.resetZoom === "function") {
                    chart.resetZoom();
                    showNotification("Chart zoom reset", "success");
                }
            }
        } catch (error) {
            if (
                globalThis.window !== undefined &&
                /** @type {any} */ (globalThis).__renderer_dev?.debug
            ) {
                console.warn("[chartZoomResetPlugin] afterEvent error", error);
            }
        }
    },

    id: "chartZoomResetPlugin",
};

// Utility function to create rounded rectangle path
// Provide a minimal roundRect helper if not present (cast to any to avoid TS conflicts with lib dom definitions)
if (typeof CanvasRenderingContext2D !== "undefined") {
    const ctxProto = /** @type {any} */ (CanvasRenderingContext2D.prototype);
    if (typeof ctxProto.roundRect !== "function") {
        /**
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         * @param {number | Object} radius
         */
        ctxProto.roundRect = function (x, y, width, height, radius) {
            let r;
            if (typeof radius === "number") {
                r = { bl: radius, br: radius, tl: radius, tr: radius };
            } else if (radius && typeof radius === "object") {
                const o = /** @type {any} */ (radius);
                r = {
                    bl: o.bl || 0,
                    br: o.br || 0,
                    tl: o.tl || 0,
                    tr: o.tr || 0,
                };
            } else {
                r = { bl: 5, br: 5, tl: 5, tr: 5 };
            }
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
}
