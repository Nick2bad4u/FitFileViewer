/**
 * Extracts list of available developer fields from record messages
 * @param {Array} recordMesgs - Array of record messages
 * @returns {Array} Array of developer field names
 */

export function extractDeveloperFieldsList(recordMesgs) {
    const fieldSet = new Set();

    recordMesgs.forEach((row) => {
        if (row.developerFields && typeof row.developerFields === "string") {
            try {
                const devFields = JSON.parse(row.developerFields);
                Object.keys(devFields).forEach((fieldId) => {
                    const value = devFields[fieldId];

                    if (Array.isArray(value)) {
                        value.forEach((_, arrayIndex) => {
                            fieldSet.add(`dev_${fieldId}_${arrayIndex}`);
                        });
                    } else if (typeof value === "number" && !isNaN(value)) {
                        fieldSet.add(`dev_${fieldId}`);
                    }
                });
            } catch {
                // Skip malformed JSON
            }
        }
    });

    return Array.from(fieldSet);
}
