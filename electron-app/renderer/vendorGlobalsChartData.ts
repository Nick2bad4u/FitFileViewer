import Chart from "chart.js/auto";
/* eslint-disable import-x/no-unassigned-import -- Adapter and stylesheet imports are intentional side effects for bundled renderer vendors. */
import "chartjs-adapter-date-fns";
/* eslint-enable import-x/no-unassigned-import */
import zoomPlugin from "chartjs-plugin-zoom";
import DataTable from "datatables.net-dt";
/* eslint-disable import-x/no-unassigned-import -- Vendor stylesheets must be loaded through the bundle entry. */
import "datatables.net-dt/css/dataTables.dataTables.css";
/* eslint-enable import-x/no-unassigned-import */
import Hammer from "hammerjs";
import $ from "jquery";

import {
    defineMissingGlobal,
    markRendererVendorEntryLoaded,
} from "./vendorGlobalsShared.js";

function isChartPluginRegistered(pluginId: string): boolean {
    try {
        return Boolean(Chart.registry.plugins.get(pluginId));
    } catch {
        return false;
    }
}

/** Installs charting and table globals used by charts and the Data tab. */
export function installRendererChartDataVendorGlobals(): void {
    if (!isChartPluginRegistered(zoomPlugin.id)) {
        Chart.register(zoomPlugin);
    }

    defineMissingGlobal("Chart", Chart);
    defineMissingGlobal("ChartZoom", zoomPlugin);
    defineMissingGlobal("chartjsPluginZoom", zoomPlugin);
    defineMissingGlobal("Hammer", Hammer);
    defineMissingGlobal("$", $);
    defineMissingGlobal("jQuery", $);
    defineMissingGlobal("DataTable", DataTable);
    markRendererVendorEntryLoaded("chart-data");
}

installRendererChartDataVendorGlobals();
