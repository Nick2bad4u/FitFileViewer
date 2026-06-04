/* eslint-disable import-x/max-dependencies -- Centralized vendor bundle for legacy renderer globals. */
import * as arquero from "arquero";
import Chart from "chart.js/auto";
/* eslint-disable import-x/no-unassigned-import -- Adapter and stylesheet imports are intentional side effects for bundled renderer vendors. */
import "chartjs-adapter-date-fns";
/* eslint-enable import-x/no-unassigned-import */
import zoomPlugin from "chartjs-plugin-zoom";
import DataTable from "datatables.net-dt";
/* eslint-disable import-x/no-unassigned-import -- Vendor stylesheets must be loaded through the bundle entry. */
import "datatables.net-dt/css/dataTables.dataTables.css";
/* eslint-enable import-x/no-unassigned-import */
import DOMPurify from "dompurify";
import Hammer from "hammerjs";
import $ from "jquery";
import JSZip from "jszip";
import * as Leaflet from "leaflet";
/* eslint-disable import-x/no-unassigned-import -- Leaflet stylesheets must be loaded through the bundle entry. */
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// CSS comes from the npm package, but the measurement control implementation is
// local because upstream leaflet-measure JS uses unsafe-eval and violates the app CSP.
import "leaflet-measure/dist/leaflet-measure.css";
import "leaflet-minimap/dist/Control.MiniMap.min.css";
/* eslint-enable import-x/no-unassigned-import */
import minimapToggleIconUrl from "leaflet-minimap/dist/images/toggle.svg";
import { FullScreen } from "leaflet.fullscreen";
/* eslint-disable import-x/no-unassigned-import -- Leaflet control stylesheets must be loaded through the bundle entry. */
import "leaflet.fullscreen/dist/Control.FullScreen.css";
/* eslint-enable import-x/no-unassigned-import */
import { LocateControl } from "leaflet.locatecontrol";
/* eslint-disable import-x/no-unassigned-import -- Leaflet control stylesheets must be loaded through the bundle entry. */
import "leaflet.locatecontrol/dist/L.Control.Locate.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
/* eslint-enable import-x/no-unassigned-import */
import maplibregl from "maplibre-gl";
/* eslint-disable import-x/no-unassigned-import -- MapLibre stylesheet must be loaded through the bundle entry. */
import "maplibre-gl/dist/maplibre-gl.css";
/* eslint-enable import-x/no-unassigned-import */
import screenfull from "screenfull";
/* eslint-enable import-x/max-dependencies */

type RendererVendorGlobal = typeof globalThis & {
    $?: typeof $;
    Chart?: typeof Chart;
    ChartZoom?: typeof zoomPlugin;
    DataTable?: typeof DataTable;
    DOMPurify?: typeof DOMPurify;
    Hammer?: typeof Hammer;
    JSZip?: typeof JSZip;
    L?: typeof Leaflet;
    Leaflet?: typeof Leaflet;
    aq?: typeof arquero;
    arquero?: typeof arquero;
    chartjsPluginZoom?: typeof zoomPlugin;
    jQuery?: typeof $;
    maplibregl?: typeof maplibregl;
    screenfull?: typeof screenfull;
    __FFV_RENDERER_VENDOR_BUNDLE__?: Readonly<{
        loaded: true;
        source: "npm-bundle";
    }>;
};

/**
 * Shared browser global used to expose bundled packages to legacy renderer
 * code.
 */
export const vendorGlobal = globalThis as RendererVendorGlobal;

const leafletGlobal = Leaflet as typeof Leaflet & {
    Control: typeof Leaflet.Control & {
        FullScreen?: typeof FullScreen;
        Locate?: typeof LocateControl;
    };
    control: typeof Leaflet.control & {
        fullscreen?: (
            options?: ConstructorParameters<typeof FullScreen>[0]
        ) => InstanceType<typeof FullScreen>;
        locate?: (
            options?: ConstructorParameters<typeof LocateControl>[0]
        ) => InstanceType<typeof LocateControl>;
    };
};

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

if (globalThis.document?.documentElement) {
    const minimapToggleIconUrlValue: unknown = minimapToggleIconUrl;
    const minimapToggleIconUrlString =
        typeof minimapToggleIconUrlValue === "string"
            ? minimapToggleIconUrlValue
            : "";
    const escapedMinimapToggleIconUrl = minimapToggleIconUrlString.replaceAll(
        /["\\]/gu,
        String.raw`\$&`
    );

    globalThis.document.documentElement.style.setProperty(
        "--ffv-minimap-toggle-icon",
        `url("${escapedMinimapToggleIconUrl}")`
    );
}

if (!isChartPluginRegistered(zoomPlugin.id)) {
    Chart.register(zoomPlugin);
}

leafletGlobal.Control.FullScreen = FullScreen;
leafletGlobal.Control.Locate = LocateControl;
leafletGlobal.control.fullscreen = (options) => new FullScreen(options);
leafletGlobal.control.locate = (options) => new LocateControl(options);

defineMissingGlobal("L", Leaflet);
defineMissingGlobal("Leaflet", Leaflet);
defineMissingGlobal("maplibregl", maplibregl);
defineMissingGlobal("DOMPurify", DOMPurify);
defineMissingGlobal("JSZip", JSZip);
defineMissingGlobal("aq", arquero);
defineMissingGlobal("arquero", arquero);
defineMissingGlobal("screenfull", screenfull);
defineMissingGlobal("Chart", Chart);
defineMissingGlobal("ChartZoom", zoomPlugin);
defineMissingGlobal("chartjsPluginZoom", zoomPlugin);
defineMissingGlobal("Hammer", Hammer);
defineMissingGlobal("$", $);
defineMissingGlobal("jQuery", $);
defineMissingGlobal("DataTable", DataTable);
