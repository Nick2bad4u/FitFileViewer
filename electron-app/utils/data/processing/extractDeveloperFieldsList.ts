/**
 * Extracts developer field identifiers from FIT record messages.
 */

interface RecordMessage {
    developerFields?: unknown;
}

type DeveloperFieldsPayload = Record<string, unknown>;

const FIELD_IDENTIFIER_COLLATOR = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
});

/**
 * Extract a stable sorted list of developer field identifiers present in record
 * messages. Each identifier is formatted as `dev_<fieldId>` for scalar numeric
 * values or `dev_<fieldId>_<index>` for array values.
 */
export function extractDeveloperFieldsList(recordMesgs: unknown): string[] {
    if (!Array.isArray(recordMesgs)) {
        return [];
    }

    const fieldSet = new Set<string>();

    for (const row of recordMesgs) {
        const developerFields = getDeveloperFieldsJson(row);
        if (!developerFields) {
            continue;
        }

        const payload = parseDeveloperFields(developerFields);
        if (!payload) {
            continue;
        }

        for (const [fieldId, value] of Object.entries(payload)) {
            if (Array.isArray(value)) {
                for (const arrayIndex of value.keys()) {
                    fieldSet.add(`dev_${fieldId}_${arrayIndex}`);
                }
                continue;
            }

            if (typeof value === "number" && !Number.isNaN(value)) {
                fieldSet.add(`dev_${fieldId}`);
            }
        }
    }

    return [...fieldSet].sort(compareFieldIdentifiers);
}

function compareFieldIdentifiers(left: string, right: string): number {
    return FIELD_IDENTIFIER_COLLATOR.compare(left, right);
}

function getDeveloperFieldsJson(row: unknown): string | undefined {
    if (!row || typeof row !== "object") {
        return;
    }

    const candidate = row as RecordMessage;
    return typeof candidate.developerFields === "string" &&
        candidate.developerFields.length > 0
        ? candidate.developerFields
        : undefined;
}

function parseDeveloperFields(
    developerFields: string
): DeveloperFieldsPayload | undefined {
    try {
        const parsed: unknown = JSON.parse(developerFields);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as DeveloperFieldsPayload)
            : undefined;
    } catch {
        return;
    }
}
