/**
 * @typedef {Object} RecordMessage
 * @property {string} [developerFields] JSON string of developer fields mapping ids to values.
 */
/**
 * Extract a stable sorted list of developer field identifiers present in record messages.
 * Each identifier is formatted as dev_<fieldId> for scalar numeric values or dev_<fieldId>_<index>
 * for array values.
 *
 * @param {RecordMessage[]} recordMesgs
 * @returns {string[]} Array of developer field names (unique)
 */
export function extractDeveloperFieldsList(recordMesgs: RecordMessage[]): string[];
export type RecordMessage = {
    /**
     * JSON string of developer fields mapping ids to values.
     */
    developerFields?: string;
};
