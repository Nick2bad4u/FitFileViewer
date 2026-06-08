import Chart from "chart.js/auto";
import DataTable from "datatables.net-dt";
/* eslint-disable import-x/no-unassigned-import -- Adapter and stylesheet imports are intentional side effects for bundled renderer vendors. */
import "chartjs-adapter-date-fns";
/* eslint-enable import-x/no-unassigned-import */
import zoomPlugin from "chartjs-plugin-zoom";
/* eslint-disable import-x/no-unassigned-import -- Vendor stylesheets must be loaded through the bundle entry. */
import "datatables.net-dt/css/dataTables.dataTables.css";
/* eslint-enable import-x/no-unassigned-import */

import { markRendererVendorEntryLoaded } from "./vendorGlobalsShared.js";
import { setChartRuntime } from "../utils/charts/core/chartRuntime.js";
import { setDataTableRuntime } from "../utils/rendering/core/dataTableRuntime.js";

function isChartPluginRegistered(pluginId: string): boolean {
    try {
        return Boolean(Chart.registry.plugins.get(pluginId));
    } catch {
        return false;
    }
}

/** Registers charting and table runtimes used by charts and the Data tab. */
export function installRendererChartDataVendorGlobals(): void {
    if (!isChartPluginRegistered(zoomPlugin.id)) {
        Chart.register(zoomPlugin);
    }

    setChartRuntime(Chart, zoomPlugin);
    setDataTableRuntime(DataTable);
    markRendererVendorEntryLoaded("chart-data");
}

installRendererChartDataVendorGlobals();
