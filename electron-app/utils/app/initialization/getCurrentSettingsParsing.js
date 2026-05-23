function getChartOptionProperty(option, key) {
    return key in option ? option[key] : undefined;
}
function normalizeChartOption(option) {
    if (typeof option !== "object" || option === null) {
        return { default: undefined, type: "" };
    }
    const optionType = getChartOptionProperty(option, "type");
    const normalized = {
        default: getChartOptionProperty(option, "default"),
        type: typeof optionType === "string" ? optionType : "",
    };
    const optionId = getChartOptionProperty(option, "id");
    if (typeof optionId === "string") {
        normalized.id = optionId;
    }
    return normalized;
}
/**
 * Parse stored chart setting values according to chart option semantics.
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
            if (opt.id !== "maxpoints") {
                return String(stored);
            }
            if (stored === "all") {
                return "all";
            }
            if (typeof stored === "number" && Number.isFinite(stored)) {
                return stored;
            }
            const parsed = Number.parseInt(String(stored), 10);
            return Number.isFinite(parsed) ? parsed : opt.default;
        }
        case "toggle": {
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
