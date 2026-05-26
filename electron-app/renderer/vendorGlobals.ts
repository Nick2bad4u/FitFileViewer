import * as arquero from "arquero";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import DOMPurify from "dompurify";
import Hammer from "hammerjs";
import JSZip from "jszip";
import screenfull from "screenfull";

type RendererVendorGlobal = typeof globalThis & {
    Chart?: typeof Chart;
    ChartZoom?: typeof zoomPlugin;
    DOMPurify?: typeof DOMPurify;
    Hammer?: typeof Hammer;
    JSZip?: typeof JSZip;
    aq?: typeof arquero;
    arquero?: typeof arquero;
    chartjsPluginZoom?: typeof zoomPlugin;
    screenfull?: typeof screenfull;
    __FFV_RENDERER_VENDOR_BUNDLE__?: Readonly<{
        loaded: true;
        source: "npm-bundle";
    }>;
};

const vendorGlobal = globalThis as RendererVendorGlobal;

function defineMissingGlobal<Key extends keyof RendererVendorGlobal>(
    key: Key,
    value: NonNullable<RendererVendorGlobal[Key]>
): void {
    if (vendorGlobal[key] === undefined || vendorGlobal[key] === null) {
        Object.defineProperty(vendorGlobal, key, {
            configurable: true,
            value,
            writable: true,
        });
    }
}

function isChartPluginRegistered(pluginId: string): boolean {
    try {
        return Boolean(Chart.registry.plugins.get(pluginId));
    } catch {
        return false;
    }
}

if (!isChartPluginRegistered(zoomPlugin.id)) {
    Chart.register(zoomPlugin);
}

defineMissingGlobal("DOMPurify", DOMPurify);
defineMissingGlobal("JSZip", JSZip);
defineMissingGlobal("aq", arquero);
defineMissingGlobal("arquero", arquero);
defineMissingGlobal("screenfull", screenfull);
defineMissingGlobal("Chart", Chart);
defineMissingGlobal("ChartZoom", zoomPlugin);
defineMissingGlobal("chartjsPluginZoom", zoomPlugin);
defineMissingGlobal("Hammer", Hammer);

vendorGlobal.__FFV_RENDERER_VENDOR_BUNDLE__ = {
    loaded: true,
    source: "npm-bundle",
};
