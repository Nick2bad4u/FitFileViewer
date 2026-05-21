export function hexToRgba(hex: string, alpha: number): string;
export function invalidateChartRenderCache(reason?: string): void;
export function renderChartJS(container?: HTMLElement | null): Promise<boolean>;

export const chartSettingsManager: {
    getFieldVisibility(field: string): string | null;
};
