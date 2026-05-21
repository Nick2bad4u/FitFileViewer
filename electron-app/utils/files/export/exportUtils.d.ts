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
    copyTextToClipboard(text: string): Promise<boolean>;
    downloadChartAsPNG(chart: ExportableChart, filename: string): unknown;
};
