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
export function extractDeveloperFieldsList(recordMesgs) {
    if (!Array.isArray(recordMesgs)) {
        return [];
    }
    const fieldSet = new Set();

    for (const row of recordMesgs) {
        if (row.developerFields && typeof row.developerFields === "string") {
            try {
                const devFields = JSON.parse(row.developerFields);
                for (const fieldId of Object.keys(devFields)) {
                    const value = devFields[fieldId];

                    if (Array.isArray(value)) {
                        for (const [arrayIndex, _] of value.entries()) {
                            fieldSet.add(`dev_${fieldId}_${arrayIndex}`);
                        }
                    } else if (typeof value === "number" && !isNaN(value)) {
                        fieldSet.add(`dev_${fieldId}`);
                    }
                }
            } catch {
                // Skip malformed JSON
            }
        }
    }

    return /** @type {string[]} */ ([...fieldSet]);
}
