/**
 * Tab configuration definitions.
 */

/**
 * @typedef {{
 *     id: string;
 *     contentId: string;
 *     label: string;
 *     requiresData: boolean;
 *     handler: string | null;
 * }} TabDef
 */

/** @type {Record<string, TabDef>} */
const TAB_CONFIG = {
    altfit: {
        contentId: "content-altfit",
        handler: null,
        id: "tab-altfit",
        label: "Alternative View",
        requiresData: false,
    },
    browser: {
        contentId: "content-browser",
        handler: null,
        id: "tab-browser",
        label: "Browser",
        requiresData: false,
    },
    chart: {
        contentId: "content-chartjs",
        handler: "renderChartJS",
        id: "tab-chart",
        label: "Charts",
        requiresData: true,
    },
    chartjs: {
        contentId: "content-chartjs",
        handler: "renderChartJS",
        id: "tab-chartjs",
        label: "Charts",
        requiresData: true,
    },
    data: {
        contentId: "content-data",
        handler: "createTables",
        id: "tab-data",
        label: "Data Tables",
        requiresData: true,
    },
    map: {
        contentId: "content-map",
        handler: "renderMap",
        id: "tab-map",
        label: "Map",
        requiresData: true,
    },
    summary: {
        contentId: "content-summary",
        handler: "renderSummary",
        id: "tab-summary",
        label: "Summary",
        requiresData: true,
    },
    zwift: {
        contentId: "content-zwift",
        handler: null,
        id: "tab-zwift",
        label: "Zwift",
        requiresData: false,
    },
};

export { TAB_CONFIG };
