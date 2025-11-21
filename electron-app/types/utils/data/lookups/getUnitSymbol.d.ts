/**
 * Gets the appropriate unit symbol for display based on field type and user preferences
 *
 * Determines the correct unit symbol to display for various data fields based on:
 * - Field type (distance, temperature, speed, time, fitness metrics)
 * - User unit preferences stored in localStorage
 * - Unit context (e.g., time axis vs. time field)
 *
 * @param {string} field - Field name (e.g., "distance", "temperature", "speed", "heartRate")
 * @param {string} [unitType] - Axis unit context (currently only supports "time" for time axis units)
 * @returns {string} Appropriate unit symbol for the field
 *
 * @example
 * getUnitSymbol("distance");           // "km" (if user prefers kilometers)
 * getUnitSymbol("temperature");        // "°C" (if user prefers celsius)
 * getUnitSymbol("speed");              // "km/h" or "mph" based on distance units
 * getUnitSymbol("time", "time");       // "s" (if user prefers seconds)
 * getUnitSymbol("heartRate");          // "bpm" (fixed for heart rate)
 */
export function getUnitSymbol(field: string, unitType?: string): string;
//# sourceMappingURL=getUnitSymbol.d.ts.map