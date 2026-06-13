import Chart from "chart.js/auto";
import DataTable from "datatables.net-dt";
/* eslint-disable import-x/no-unassigned-import -- Adapter and stylesheet imports are intentional side effects for bundled renderer vendors. */
import "chartjs-adapter-date-fns";
/* eslint-enable import-x/no-unassigned-import */
import zoomPlugin from "chartjs-plugin-zoom";
/* eslint-disable import-x/no-unassigned-import -- Vendor stylesheets must be loaded through the bundle entry. */
import "datatables.net-dt/css/dataTables.dataTables.css";
/* eslint-enable import-x/no-unassigned-import */

import { markRendererVendorEntryLoaded } from "./rendererVendorShared.js";

function isChartPluginRegistered(pluginId: string): boolean {
    try {
        return Boolean(Chart.registry.plugins.get(pluginId));
    } catch {
        return false;
    }
}

/** Registers charting and table runtimes used by charts and the Data tab. */
export function installRendererChartDataVendorEntry(): void {
    if (!isChartPluginRegistered(zoomPlugin.id)) {
        Chart.register(zoomPlugin);
    }

    markRendererVendorEntryLoaded("chart-data", {
        chartData: {
            chartRuntime: Chart,
            chartZoomPlugin: zoomPlugin,
            dataTableRuntime: DataTable,
        },
    });
}

installRendererChartDataVendorEntry();
