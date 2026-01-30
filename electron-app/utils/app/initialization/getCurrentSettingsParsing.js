/**
 * Parse stored value based on chart option configuration.
 *
 * @param {string | number | boolean | null | undefined} stored - Stored setting
 *   value
 * @param {ChartOptionConfig | any} option - Chart option configuration
 *
 * @returns {any} Parsed value with correct type
 */
export function parseStoredValue(stored, option) {
    /** @type {ChartOptionConfig} */
    // @ts-ignore - runtime trusted from config import
    const opt = option;
    if (stored === null || stored === undefined) {
        return opt.default;
    }

    switch (opt.type) {
        case "range": {
            if (typeof stored === "number" && Number.isFinite(stored)) {
                return stored;
            }
            const parsed = Number.parseFloat(String(stored));
            return Number.isFinite(parsed) ? parsed : opt.default;
        }

        case "select": {
            if (opt.id === "maxpoints") {
                if (stored === "all") {
                    return "all";
                }
                if (typeof stored === "number" && Number.isFinite(stored)) {
                    return stored;
                }
                const parsed = Number.parseInt(String(stored), 10);
                return Number.isFinite(parsed) ? parsed : opt.default;
            }
            return String(stored);
        }

        case "toggle": {
            // Handle both boolean and string representations
            if (typeof stored === "boolean") {
                return stored;
            }
            if (typeof stored === "string") {
                return stored === "true" || stored === "on";
            }
            return Boolean(stored);
        }

        default: {
            return stored;
        }
    }
}
