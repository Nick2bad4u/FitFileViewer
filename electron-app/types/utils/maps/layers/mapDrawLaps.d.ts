/**
 * @typedef {Object} RecordMesg
 * @property {number} [positionLat] - Position latitude
 * @property {number} [positionLong] - Position longitude
 * @property {number} [timestamp] - Timestamp
 * @property {number} [altitude] - Altitude
 * @property {number} [heartRate] - Heart rate
 * @property {number} [speed] - Speed
 */
/**
 * @typedef {Object} LapMesg
 * @property {number} [start_index] - Start index in records
 * @property {number} [end_index] - End index in records
 * @property {number} [startPositionLat] - Start position latitude
 * @property {number} [startPositionLong] - Start position longitude
 * @property {number} [endPositionLat] - End position latitude
 * @property {number} [endPositionLong] - End position longitude
 */
/**
 * @typedef {Object} FitFile
 * @property {Object} data - FIT file data
 * @property {string} [filePath] - File path
 */
export function drawOverlayForFitFile({ addLayer, endIcon, fileName, fitData, formatTooltipData, getLapNumForIdx, map, markerClusterGroup, markerSummary, overlayIdx, startIcon, }: {
    addLayer?: (layer: any) => void;
    endIcon: any;
    fileName: any;
    fitData: any;
    formatTooltipData: any;
    getLapNumForIdx: any;
    map: any;
    markerClusterGroup: any;
    markerSummary: any;
    overlayIdx: any;
    startIcon: any;
}): any;
/**
 * Draws the map for a given lap or laps
 * Dependencies must be passed as arguments: map, baseLayers, markerClusterGroup, startIcon, endIcon, mapContainer, getLapColor, formatTooltipData, getLapNumForIdx
 * @param {string|number|Array<string|number>} lapIdx - Lap index or array of indices or "all"
 * @param {Object} options - Map drawing options
 */
export function mapDrawLaps(lapIdx: string | number | Array<string | number>, { baseLayers, dynamicLayerGroup, endIcon, formatTooltipData, getLapColor, getLapNumForIdx, map, mapContainer, markerClusterGroup, startIcon, }: {
    baseLayers: Record<string, any>;
    dynamicLayerGroup?: any;
    endIcon: any;
    formatTooltipData: any;
    getLapColor: any;
    getLapNumForIdx: any;
    map: any;
    mapContainer: any;
    markerClusterGroup: any;
    startIcon: any;
}): void;
export type RecordMesg = {
    /**
     * - Position latitude
     */
    positionLat?: number;
    /**
     * - Position longitude
     */
    positionLong?: number;
    /**
     * - Timestamp
     */
    timestamp?: number;
    /**
     * - Altitude
     */
    altitude?: number;
    /**
     * - Heart rate
     */
    heartRate?: number;
    /**
     * - Speed
     */
    speed?: number;
};
export type LapMesg = {
    /**
     * - Start index in records
     */
    start_index?: number;
    /**
     * - End index in records
     */
    end_index?: number;
    /**
     * - Start position latitude
     */
    startPositionLat?: number;
    /**
     * - Start position longitude
     */
    startPositionLong?: number;
    /**
     * - End position latitude
     */
    endPositionLat?: number;
    /**
     * - End position longitude
     */
    endPositionLong?: number;
};
export type FitFile = {
    /**
     * - FIT file data
     */
    data: Object;
    /**
     * - File path
     */
    filePath?: string;
};
//# sourceMappingURL=mapDrawLaps.d.ts.map
