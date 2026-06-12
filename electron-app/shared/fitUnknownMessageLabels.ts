import type { FitFieldValue, FitMessages } from "./fit";
import type { UnknownMessageMappings } from "./fitParser";

const unknownMessageMappings: UnknownMessageMappings = {
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

function getFitFieldValue(
    row: Record<string, FitFieldValue>,
    key: number | string
): FitFieldValue {
    return row[String(key)] ?? null;
}

function hasOwnKey(record: Record<string, unknown>, key: string): boolean {
    return Object.hasOwn(record, key);
}

function omitMessageKey(
    messages: FitMessages,
    omittedKey: string
): FitMessages {
    const nextMessages: FitMessages = {};
    for (const [key, rows] of Object.entries(messages)) {
        if (key !== omittedKey) {
            nextMessages[key] = rows;
        }
    }
    return nextMessages;
}

export function applyUnknownMessageLabels(
    messages: FitMessages | null | undefined
): FitMessages {
    let updated: FitMessages = messages ? { ...messages } : {};

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
                          const labeled: Record<string, FitFieldValue> = {};
                          for (const [idx, field] of mapping.fields.entries()) {
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
