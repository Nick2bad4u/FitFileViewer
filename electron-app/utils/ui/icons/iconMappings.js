import { fieldLabels } from "../../formatting/display/formatChartFields.js";

const DEFAULT_DATA_ICON = "mdi:table-large";
const DEFAULT_SUMMARY_ICON = "mdi:clipboard-text-outline";
const DEFAULT_CHART_ICON = "mdi:chart-line-variant";
const DEFAULT_ZONE_ICON = "mdi:chart-arc";

const dataTableIconMap = {
    activityMesgs: "mdi:calendar-check",
    courseMesgs: "mdi:map-outline",
    developerData: "mdi:code-tags",
    eventMesgs: "mdi:bell-ring",
    fileIdMesgs: "mdi:identifier",
    lapMesgs: "mdi:flag-checkered",
    recordMesgs: "mdi:run",
    segmentMesgs: "mdi:chart-timeline-variant",
    sessionMesgs: "mdi:chart-timeline-variant",
    workoutMesgs: "mdi:dumbbell",
};

const chartIconMap = {
    altitude: "mdi:mountain",
    "altitude-profile": "mdi:chart-areaspline",
    altitude_profile: "mdi:chart-areaspline",
    cadence: "mdi:repeat",
    distance: "mdi:map-marker-distance",
    enhancedAltitude: "mdi:mountain",
    enhancedSpeed: "mdi:speedometer",
    event_messages: "mdi:bell-ring",
    flow: "mdi:waves",
    grit: "mdi:mountain",
    "gps-track": "mdi:map",
    gps_track: "mdi:map",
    heartRate: "mdi:heart-pulse",
    "heart-rate-zones": "mdi:heart-settings",
    hr_lap_zone_individual: "mdi:heart",
    hr_lap_zone_stacked: "mdi:heart-multiple",
    hr_zone_doughnut: "mdi:heart-circle",
    positionLat: "mdi:latitude",
    positionLong: "mdi:longitude",
    power: "mdi:flash",
    "power-vs-hr": "mdi:chart-scatter-plot",
    power_lap_zone_individual: "mdi:flash",
    power_lap_zone_stacked: "mdi:flash-outline",
    power_zone_doughnut: "mdi:flash-circle",
    resistance: "mdi:arm-flex",
    speed: "mdi:speedometer",
    "speed-vs-distance": "mdi:chart-line",
    speed_vs_distance: "mdi:chart-line",
    temperature: "mdi:thermometer",
    time: "mdi:clock-outline",
};

const chartEmojiMap = {
    altitude: "⛰️",
    "altitude-profile": "⛰️",
    altitude_profile: "⛰️",
    cadence: "🔄",
    distance: "📏",
    enhancedAltitude: "⛰️",
    enhancedSpeed: "⚡",
    event_messages: "🔔",
    flow: "🌊",
    grit: "🪨",
    "gps-track": "🗺️",
    gps_track: "🗺️",
    heartRate: "❤️",
    "heart-rate-zones": "❤️",
    hr_lap_zone_individual: "❤️",
    hr_lap_zone_stacked: "❤️",
    hr_zone_doughnut: "❤️",
    positionLat: "📍",
    positionLong: "📍",
    power: "⚡",
    power_lap_zone_individual: "⚡",
    power_lap_zone_stacked: "⚡",
    power_zone_doughnut: "⚡",
    resistance: "🛡️",
    speed: "⚡",
    "speed-vs-distance": "📈",
    speed_vs_distance: "📈",
    temperature: "🌡️",
    time: "⏱️",
};

const summaryKeywordIcons = [
    { pattern: /time|duration|timestamp/i, icon: "mdi:clock-outline" },
    { pattern: /distance/i, icon: "mdi:map-marker-distance" },
    { pattern: /speed|pace/i, icon: "mdi:speedometer" },
    { pattern: /power|watt/i, icon: "mdi:flash" },
    { pattern: /heart|hr/i, icon: "mdi:heart-pulse" },
    { pattern: /altitude|ascent|descent|elevation/i, icon: "mdi:mountain" },
    { pattern: /temperature|temp/i, icon: "mdi:thermometer" },
    { pattern: /calorie|energy|kilojoule|kcal/i, icon: "mdi:fire" },
];

const summaryKeywordEmoji = [
    { pattern: /time|duration|timestamp/i, emoji: "⏱️" },
    { pattern: /distance/i, emoji: "📏" },
    { pattern: /speed|pace/i, emoji: "⚡" },
    { pattern: /power|watt/i, emoji: "⚡" },
    { pattern: /heart|hr/i, emoji: "❤️" },
    { pattern: /altitude|ascent|descent|elevation/i, emoji: "⛰️" },
    { pattern: /temperature|temp/i, emoji: "🌡️" },
    { pattern: /calorie|energy|kilojoule|kcal/i, emoji: "🔥" },
];

const zoneKeywordIcons = [
    { pattern: /heart|hr/i, icon: chartIconMap["heart-rate-zones"] },
    { pattern: /power|watt/i, icon: chartIconMap.power },
];

const zoneKeywordEmoji = [
    { pattern: /heart|hr/i, emoji: chartEmojiMap["heart-rate-zones"] },
    { pattern: /power|watt/i, emoji: chartEmojiMap.power },
];

/**
 * Records common textual variations for later lookup.
 * @param {Record<string, string>} target
 * @param {string} key
 * @param {string} value
 * @returns {void}
 */
function addKeyVariants(target, key, value) {
    const lower = key.toLowerCase();
    const compact = lower.replaceAll(/[\s_-]+/g, "");
    const dashed = lower.replaceAll(/[\s_]+/g, "-");
    const spaced = lower.replaceAll(/[\s_]+/g, " ");
    const messageVariant = lower.replaceAll("mesgs", "messages").replaceAll("mesg", "message");
    const messageCompact = messageVariant.replaceAll(/[\s_-]+/g, "");
    const messageDashed = messageVariant.replaceAll(/[\s_]+/g, "-");
    const messageSpaced = messageVariant.replaceAll(/[\s_]+/g, " ");
    const variants = [
        key,
        lower,
        compact,
        dashed,
        spaced,
        messageVariant,
        messageCompact,
        messageDashed,
        messageSpaced,
    ];
    for (const variant of variants) {
        target[variant] = value;
    }
}

/**
 * @param {Record<string, string>} source
 * @returns {Record<string, string>}
 */
function createLookup(source) {
    /** @type {Record<string, string>} */
    const lookup = {};
    for (const [key, value] of Object.entries(source)) {
        addKeyVariants(lookup, key, value);
    }
    return lookup;
}

/**
 * @param {{ pattern: RegExp; icon?: string; emoji?: string }[]} keywords
 * @param {string | null | undefined} key
 * @returns {string | null}
 */
function findByKeyword(keywords, key) {
    if (!key) {
        return null;
    }
    for (const entry of keywords) {
        if (entry.pattern.test(key)) {
            if (entry.icon) {
                return entry.icon;
            }
            if (entry.emoji) {
                return entry.emoji;
            }
        }
    }
    return null;
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function humanize(value) {
    if (!value) {
        return "";
    }
    if (value in fieldLabels) {
        return /** @type {string} */ (fieldLabels[/** @type {keyof typeof fieldLabels} */ (value)]);
    }
    const normalized = String(value)
        .replaceAll(/mesgs$/gi, " messages")
        .replaceAll("_", " ")
        .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll(/\s+/g, " ")
        .trim();
    if (!normalized) {
        return "";
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * @param {Record<string, string>} lookup
 * @param {string | null | undefined} key
 * @param {string} fallback
 * @returns {string}
 */
function resolveFromLookup(lookup, key, fallback) {
    if (!key) {
        return fallback;
    }
    const trimmed = String(key).trim();
    const lower = trimmed.toLowerCase();
    const baseCandidates = [
        trimmed,
        lower,
        lower.replaceAll(/[\s_-]+/g, ""),
        lower.replaceAll(/[\s_]+/g, "-"),
        lower.replaceAll(/[\s_]+/g, " "),
    ];
    for (const candidate of baseCandidates) {
        const match = lookup[candidate];
        if (match) {
            return match;
        }
    }
    const messageLower = lower.replaceAll("mesgs", "messages").replaceAll("mesg", "message");
    const messageCandidates = [
        messageLower,
        messageLower.replaceAll(/[\s_-]+/g, ""),
        messageLower.replaceAll(/[\s_]+/g, "-"),
        messageLower.replaceAll(/[\s_]+/g, " "),
    ];
    for (const candidate of messageCandidates) {
        const match = lookup[candidate];
        if (match) {
            return match;
        }
    }
    return fallback;
}

const dataTableIconLookup = createLookup(dataTableIconMap);
const chartIconLookup = createLookup(chartIconMap);
const chartEmojiLookup = createLookup(chartEmojiMap);

/**
 * Creates an Iconify web component element sized for inline use.
 * @param {string | null | undefined} iconName
 * @param {number} [size=18]
 * @returns {HTMLElement}
 */
export function createIconElement(iconName, size = 18) {
    const icon = document.createElement("iconify-icon");
    icon.setAttribute("icon", iconName || DEFAULT_CHART_ICON);
    icon.setAttribute("width", String(size));
    icon.setAttribute("height", String(size));
    icon.setAttribute("aria-hidden", "true");
    icon.classList.add("iconify-inline");
    return icon;
}

/**
 * Builds an axis label prefixed with a related emoji when available.
 * @param {string | null | undefined} keyword
 * @param {string} label
 * @returns {string}
 */
export function getAxisLabelWithEmoji(keyword, label) {
    const emoji = getChartEmoji(keyword) || getSummaryEmoji(keyword);
    if (!emoji) {
        return label;
    }
    return `${emoji} ${label}`;
}

/**
 * Resolves an emoji for a chart or metric key.
 * @param {string | null | undefined} identifier
 * @returns {string}
 */
export function getChartEmoji(identifier) {
    return resolveFromLookup(chartEmojiLookup, identifier, "");
}

/**
 * Resolves an icon identifier for a chart or metric key.
 * @param {string | null | undefined} identifier
 * @returns {string}
 */
export function getChartIcon(identifier) {
    return resolveFromLookup(chartIconLookup, identifier, DEFAULT_CHART_ICON);
}

/**
 * Builds a chart title prefixed with an emoji when available.
 * @param {string | null | undefined} fieldKey
 * @param {string | null | undefined} fallbackLabel
 * @returns {string}
 */
export function getChartTitleWithEmoji(fieldKey, fallbackLabel) {
    const emoji = getChartEmoji(fieldKey);
    const label = fallbackLabel && fallbackLabel.trim() ? fallbackLabel : humanize(fieldKey);
    if (!emoji) {
        return label;
    }
    return `${emoji} ${label}`.trim();
}

/**
 * Returns the icon identifier for a FIT message table section.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getDataTableIcon(key) {
    const icon = resolveFromLookup(dataTableIconLookup, key, "");
    if (icon) {
        return icon;
    }
    const keywordMatch = findByKeyword(summaryKeywordIcons, key);
    return keywordMatch ?? DEFAULT_DATA_ICON;
}

/**
 * Returns a human readable label for a field key using shared formatting.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function getHumanizedLabel(value) {
    return humanize(value);
}

/**
 * Resolves the emoji best matching a summary metric.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getSummaryEmoji(key) {
    return findByKeyword(summaryKeywordEmoji, key) ?? "";
}

/**
 * Resolves the primary summary icon for a labeled metric.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getSummaryIcon(key) {
    return findByKeyword(summaryKeywordIcons, key) ?? DEFAULT_SUMMARY_ICON;
}

/**
 * Resolves the emoji used for heart-rate and power zone charts.
 * @param {string | null | undefined} chartId
 * @returns {string}
 */
export function getZoneChartEmoji(chartId) {
    const emoji = resolveFromLookup(chartEmojiLookup, chartId, "");
    if (emoji) {
        return emoji;
    }
    return findByKeyword(zoneKeywordEmoji, chartId) ?? "";
}

/**
 * Resolves the icon used for heart-rate and power zone charts.
 * @param {string | null | undefined} chartId
 * @returns {string}
 */
export function getZoneChartIcon(chartId) {
    const icon = resolveFromLookup(chartIconLookup, chartId, "");
    if (icon) {
        return icon;
    }
    return findByKeyword(zoneKeywordIcons, chartId) ?? DEFAULT_ZONE_ICON;
}
