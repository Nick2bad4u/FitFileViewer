"use strict";
{
    const unknownMessageMappings = {
        104: {
            fields: [
                "timestamp",
                "battery_voltage",
                "battery_level",
                "temperature",
                "field_4",
            ],
            name: "Device Status",
        },
    };
    function getFitFieldValue(row, key) {
        return row[key];
    }
    function hasOwnKey(record, key) {
        return Object.prototype.hasOwnProperty.call(record, key);
    }
    function omitMessageKey(messages, omittedKey) {
        const nextMessages = {};
        for (const [key, rows] of Object.entries(messages)) {
            if (key !== omittedKey) {
                nextMessages[key] = rows;
            }
        }
        return nextMessages;
    }
    function applyUnknownMessageLabels(messages) {
        let updated = { ...(messages ?? {}) };
        for (const msgNum of Object.keys(unknownMessageMappings)) {
            const mapping = unknownMessageMappings[msgNum];
            if (!mapping) {
                continue;
            }
            const possibleKeys = [`unknown_${msgNum}`, msgNum];
            for (const key of possibleKeys) {
                if (!hasOwnKey(updated, key)) {
                    continue;
                }
                const rows = updated[key];
                if (!Array.isArray(rows)) {
                    continue;
                }
                updated[mapping.name] =
                    msgNum === "104"
                        ? rows.map((row) => ({
                              battery_level: getFitFieldValue(row, 2),
                              battery_voltage: getFitFieldValue(row, 0),
                              field_4: getFitFieldValue(row, 4),
                              temperature: getFitFieldValue(row, 3),
                              timestamp: getFitFieldValue(row, 253),
                          }))
                        : rows.map((row) => {
                              const labeled = {};
                              for (const [
                                  idx,
                                  field,
                              ] of mapping.fields.entries()) {
                                  labeled[field] = getFitFieldValue(row, idx);
                              }
                              return labeled;
                          });
                updated = omitMessageKey(updated, key);
            }
        }
        for (const msgNum of Object.keys(unknownMessageMappings)) {
            const mapping = unknownMessageMappings[msgNum];
            if (
                mapping &&
                hasOwnKey(updated, msgNum) &&
                hasOwnKey(updated, mapping.name)
            ) {
                updated = omitMessageKey(updated, msgNum);
            }
        }
        return updated;
    }
    module.exports = { applyUnknownMessageLabels };
}
