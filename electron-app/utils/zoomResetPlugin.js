import { showNotification } from "./showNotification.js";
import { getThemeConfig } from "./theme.js";

// Enhanced zoom reset plugin

export const zoomResetPlugin = {
    id: "zoomResetPlugin",
    afterDraw(chart) {
        if (!chart.isZoomedOrPanned || !chart.isZoomedOrPanned()) return;
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        const btnW = 100,
            btnH = 30;
        const x = canvas.width - btnW - 12;
        const y = 12;

        const themeConfig = getThemeConfig();

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = themeConfig.colors.accent + "CC"; // Add alpha to accent color
        ctx.strokeStyle = themeConfig.colors.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, btnW, btnH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.font = "bold 12px system-ui";
        ctx.fillStyle = themeConfig.colors.textPrimary;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🔄 Reset Zoom", x + btnW / 2, y + btnH / 2);
        ctx.restore();

        // Store button bounds for click detection
        chart._zoomResetBtnBounds = { x, y, w: btnW, h: btnH };
    },

    afterEvent(chart, args) {
        if (!chart.isZoomedOrPanned || !chart.isZoomedOrPanned()) return;
        const e = args.event.native;
        if (!e) return;

        const canvas = chart.canvas;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const btn = chart._zoomResetBtnBounds;

        if (!btn) return;

        if (
            (args.event.type === "click" || args.event.type === "touchend") &&
            mouseX >= btn.x &&
            mouseX <= btn.x + btn.w &&
            mouseY >= btn.y &&
            mouseY <= btn.y + btn.h
        ) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();

            if (typeof chart.resetZoom === "function") {
                chart.resetZoom();
                showNotification("Chart zoom reset", "success");
            }
        }
    },
};

// Utility function to create rounded rectangle path
CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (typeof radius === "undefined") {
        radius = 5;
    } else if (Object.prototype.toString.call(radius) === "[object Number]") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const { tl = 0, tr = 0, br = 0, bl = 0 } = radius;
        radius = { tl, tr, br, bl };
    }

    this.beginPath();
    this.moveTo(x + radius.tl, y);
    this.lineTo(x + width - radius.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.lineTo(x + width, y + height - radius.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    this.lineTo(x + radius.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.lineTo(x, y + radius.tl);
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    this.closePath();
    return this;
};
