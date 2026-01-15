/**
 * @fileoverview External URL validation policy.
 *
 * Centralizes main-process validation for any renderer-requested external navigation.
 * Keeping this policy in one place prevents security drift between different IPC modules.
 */

/**
 * Validate a URL intended for `shell.openExternal`.
 *
 * Security properties:
 * - Only allow http/https protocols.
 * - Reject embedded credentials.
 * - Reject non-string, empty, or malformed inputs.
 *
 * Behavioral property:
 * - Returns the caller-provided URL string trimmed, not canonicalized, to avoid surprise changes
 *   like appending a trailing slash.
 *
 * @param {unknown} url
 * @returns {string}
 */
function validateExternalUrl(url) {
    if (typeof url !== "string") {
        throw new TypeError("Invalid URL provided");
    }

    const trimmed = url.trim();
    if (!trimmed) {
        throw new TypeError("Invalid URL provided");
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new TypeError("Invalid URL provided");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    if (parsed.username || parsed.password) {
        throw new Error("Credentials in URLs are not allowed");
    }

    return trimmed;
}

module.exports = {
    validateExternalUrl,
};
