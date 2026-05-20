/**
 * @typedef {"range" | "select" | "toggle" | string} ChartOptionType
 * @typedef {string | number | boolean | null | undefined} StoredSettingValue
 * @typedef {object} ChartOptionConfig
 * @property {unknown} default
 * @property {string} [id]
 * @property {ChartOptionType} [type]
 */

/**
 * @param {unknown} option
 * @returns {ChartOptionConfig}
 */
function normalizeChartOption(option) {
    return typeof option === "object" && option !== null
        ? /** @type {ChartOptionConfig} */ (option)
        : { default: undefined, type: "" };
}

/**
 * Parse stored value based on chart option configuration.
 *
 * @param {StoredSettingValue} stored - Stored setting value
 * @param {unknown} option - Chart option configuration
 *
 * @returns {unknown} Parsed value with correct type
 */
export function parseStoredValue(stored, option) {
    const opt = normalizeChartOption(option);
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
