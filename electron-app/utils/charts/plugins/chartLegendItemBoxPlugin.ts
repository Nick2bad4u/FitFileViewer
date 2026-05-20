import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";

/**
 * Legend item hit-box geometry from Chart.js.
 */
export interface LegendHitBox {
    height: number;
    left: number;
    top: number;
    width: number;
}

/**
 * Minimal legend item data used for item box styling.
 */
export interface LegendItem {
    fillStyle?: string;
    hidden?: boolean;
    strokeStyle?: string;
}

/**
 * Minimal Chart.js legend shape used by the plugin.
 */
export interface LegendLike {
    legendHitBoxes?: readonly LegendHitBox[];
    legendItems?: readonly LegendItem[];
    options?: {
        display?: boolean;
    };
}

/**
 * Minimal chart shape required by the legend item box plugin.
 */
export interface LegendItemBoxChart {
    ctx?: CanvasRenderingContext2D;
    legend?: LegendLike;
    options?: {
        plugins?: {
            legend?: {
                display?: boolean;
            };
        };
    };
}

/**
 * Chart.js-compatible legend item box plugin surface.
 */
export interface LegendItemBoxPlugin {
    beforeDraw: (chart: LegendItemBoxChart) => void;
    id: "chartLegendItemBoxPlugin";
}

const LEGEND_BOX_FILL_ALPHA = 0.14,
    LEGEND_BOX_HIDDEN_FILL_ALPHA = 0.06,
    LEGEND_BOX_HIDDEN_STROKE_ALPHA = 0.2,
    LEGEND_BOX_PADDING = 6,
    LEGEND_BOX_RADIUS = 10,
    LEGEND_BOX_STROKE_ALPHA = 0.4;

function resolveLegendColor(
    item: LegendItem | undefined,
    colors: ThemeColorMap
): string {
    if (typeof item?.fillStyle === "string") {
        return item.fillStyle;
    }

    if (typeof item?.strokeStyle === "string") {
        return item.strokeStyle;
    }

    const accent = colors["accent"];
    if (typeof accent === "string") {
        return accent;
    }

    const primary = colors["primary"];
    if (typeof primary === "string") {
        return primary;
    }

    return "#3b82f6";
}

/**
 * Draws rounded boxes behind legend items to make legend targets clearer.
 */
export const chartLegendItemBoxPlugin: LegendItemBoxPlugin = {
    beforeDraw(chart) {
        const { legend } = chart;
        if (!legend || legend.options?.display === false) {
            return;
        }

        const hitBoxes = legend.legendHitBoxes,
            items = legend.legendItems;
        if (!hitBoxes || !items || hitBoxes.length === 0) {
            return;
        }

        const { ctx } = chart;
        if (!ctx) {
            return;
        }

        const { colors } = getThemeConfig();

        ctx.save();
        for (let i = 0; i < hitBoxes.length; i += 1) {
            const box = hitBoxes[i];
            if (!box) {
                continue;
            }

            const item = items[i],
                color = resolveLegendColor(item, colors),
                fillAlpha = item?.hidden
                    ? LEGEND_BOX_HIDDEN_FILL_ALPHA
                    : LEGEND_BOX_FILL_ALPHA,
                height = box.height + LEGEND_BOX_PADDING * 2,
                strokeAlpha = item?.hidden
                    ? LEGEND_BOX_HIDDEN_STROKE_ALPHA
                    : LEGEND_BOX_STROKE_ALPHA,
                width = box.width + LEGEND_BOX_PADDING * 2,
                x = box.left - LEGEND_BOX_PADDING,
                y = box.top - LEGEND_BOX_PADDING;

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
    id: "chartLegendItemBoxPlugin",
};
