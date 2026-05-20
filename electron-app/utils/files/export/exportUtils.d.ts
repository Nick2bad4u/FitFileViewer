/**
 * Minimal chart shape required by chart export helpers.
 */
export type ExportableChart = {
    readonly data?: {
        readonly datasets?: readonly Array<{
            readonly label?: unknown;
        }>;
    };
};

/**
 * Legacy export utility surface used by migrated TypeScript modules.
 */
export const exportUtils: {
    downloadChartAsPNG(chart: ExportableChart, filename: string): unknown;
};
