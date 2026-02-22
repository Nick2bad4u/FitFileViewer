import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * @typedef {Object} LegendHitBox
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} LegendItem
 * @property {boolean} [hidden]
 * @property {string} [fillStyle]
 * @property {string} [strokeStyle]
 */

/**
 * @typedef {Object} LegendLike
 * @property {LegendHitBox[]} [legendHitBoxes]
 * @property {LegendItem[]} [legendItems]
 * @property {{ display?: boolean }} [options]
 */

/**
 * @typedef {Object} MinimalChart
 * @property {CanvasRenderingContext2D} ctx
 * @property {LegendLike} [legend]
 * @property {{ plugins?: { legend?: { display?: boolean } } }} [options]
 */

const LEGEND_BOX_PADDING = 6;
const LEGEND_BOX_RADIUS = 10;
const LEGEND_BOX_FILL_ALPHA = 0.14;
const LEGEND_BOX_STROKE_ALPHA = 0.4;
const LEGEND_BOX_HIDDEN_FILL_ALPHA = 0.06;
const LEGEND_BOX_HIDDEN_STROKE_ALPHA = 0.2;

/**
 * Resolve a safe legend accent color.
 *
 * @param {LegendItem | undefined} item
 * @param {Record<string, string>} colors
 *
 * @returns {string}
 */
function resolveLegendColor(item, colors) {
    if (item && typeof item.fillStyle === "string") {
        return item.fillStyle;
    }
    if (item && typeof item.strokeStyle === "string") {
        return item.strokeStyle;
    }
    if (typeof colors.accent === "string") {
        return colors.accent;
    }
    if (typeof colors.primary === "string") {
        return colors.primary;
    }
    return "#3b82f6";
}

/**
 * Draws a rounded rectangle legend box behind each legend item to make
 * legend click targets larger and easier to see.
 *
 * @type {{ id: string; beforeDraw: (chart: MinimalChart) => void }}
 */
export const chartLegendItemBoxPlugin = {
    id: "chartLegendItemBoxPlugin",
    beforeDraw(chart) {
        const legend = chart.legend;
        if (!legend || legend.options?.display === false) {
            return;
        }

        const hitBoxes = legend.legendHitBoxes;
        const items = legend.legendItems;
        if (!hitBoxes || !items || hitBoxes.length === 0) {
            return;
        }

        const ctx = chart.ctx;
        if (!ctx) {
            return;
        }

        const themeConfig =
            /** @type {{ colors?: Record<string, string> } | null} */ (
                getThemeConfig()
            ) || {};
        const colors = themeConfig.colors || {};

        ctx.save();
        for (let i = 0; i < hitBoxes.length; i += 1) {
            const box = hitBoxes[i];
            const item = items[i];
            if (!box) {
                continue;
            }

            const color = resolveLegendColor(item, colors);
            const isHidden = Boolean(item && item.hidden);
            const fillAlpha = isHidden
                ? LEGEND_BOX_HIDDEN_FILL_ALPHA
                : LEGEND_BOX_FILL_ALPHA;
            const strokeAlpha = isHidden
                ? LEGEND_BOX_HIDDEN_STROKE_ALPHA
                : LEGEND_BOX_STROKE_ALPHA;

            const x = box.left - LEGEND_BOX_PADDING;
            const y = box.top - LEGEND_BOX_PADDING;
            const width = box.width + LEGEND_BOX_PADDING * 2;
            const height = box.height + LEGEND_BOX_PADDING * 2;

            ctx.save();
            ctx.globalAlpha = fillAlpha;
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            if (typeof ctx.roundRect === "function") {
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, LEGEND_BOX_RADIUS);
                ctx.fill();
                ctx.globalAlpha = strokeAlpha;
                ctx.stroke();
            } else {
                ctx.fillRect(x, y, width, height);
                ctx.globalAlpha = strokeAlpha;
                ctx.strokeRect(x, y, width, height);
            }
            ctx.restore();
        }
        ctx.restore();
    },
};
