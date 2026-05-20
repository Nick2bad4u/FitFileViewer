import { formatDistance } from "../formatting/formatters/formatDistance.js";
import { formatDuration } from "../formatting/formatters/formatDuration.js";
import { formatArray } from "../formatting/formatters/formatUtils.js";

/** Legacy formatting utilities exposed through the global utility bridge. */
export const formattingUtilityExports = Object.freeze({
    formatArray,
    formatDistance,
    formatDuration,
});
