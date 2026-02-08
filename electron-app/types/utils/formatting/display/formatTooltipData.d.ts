/**
 * Formats tooltip data for display on maps and charts Creates a comprehensive
 * data summary for a specific data point
 *
 * @example
 *     // Format tooltip for a data point
 *     const tooltipHtml = formatTooltipData(
 *         100,
 *         { timestamp: new Date(), altitude: 123.4, heartRate: 150 },
 *         1
 *     );
 *
 * @param {number} idx - Index of the data point
 * @param {RecordMessage} row - Data row containing measurement values
 * @param {number} lapNum - Lap number for this data point
 * @param {RecordMessage[]} [recordMesgsOverride] - Optional override for record
 *   messages array
 *
 * @returns {string} Formatted HTML string for tooltip display
 *
 * @public
 */
export function formatTooltipData(
    idx: number,
    row: RecordMessage,
    lapNum: number,
    recordMesgsOverride?: RecordMessage[]
): string;
export type RecordMessage = {
    /**
     * - Message timestamp
     */
    timestamp?: string | Date;
    /**
     * - Altitude in meters
     */
    altitude?: number;
    /**
     * - Heart rate in bpm
     */
    heartRate?: number;
    /**
     * - Auxiliary heart rate in bpm
     */
    auxHeartRate?: number;
    /**
     * - Speed in m/s
     */
    speed?: number;
    /**
     * - Power in watts
     */
    power?: number;
    /**
     * - Cadence in rpm
     */
    cadence?: number;
    /**
     * - Distance in meters
     */
    distance?: number;
    /**
     * - Latitude
     */
    positionLat?: number;
    /**
     * - Longitude
     */
    positionLong?: number;
};
