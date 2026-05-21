type LooseRecord = any;

/** Options accepted by the legacy map lap renderer. */
export type MapDrawLapsOptions = {
    endIcon?: LooseRecord;
    getLapNumForIdx?: (...args: any[]) => number | null;
    markerClusterGroup?: LooseRecord | null;
    startIcon?: LooseRecord;
    [key: string]: any;
};

/** Options accepted by the legacy overlay renderer. */
export type DrawOverlayForFitFileOptions = {
    color?: string;
    endIcon?: LooseRecord;
    fileName?: string;
    fitData: LooseRecord;
    formatTooltipData?: (
        pointIndex: number,
        row: LooseRecord,
        lapNumber: number
    ) => string;
    getLapNumForIdx?: (...args: any[]) => number | null;
    map: LooseRecord;
    markerClusterGroup?: LooseRecord | null;
    overlayIdx?: number;
    startIcon?: LooseRecord;
};

export function drawOverlayForFitFile(
    options: DrawOverlayForFitFileOptions
): LooseRecord | null;

export function mapDrawLaps(
    lapIdx: "all" | number | string | string[],
    options: MapDrawLapsOptions
): void;
