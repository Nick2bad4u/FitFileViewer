/**
 * @file External URL validation policy.
 *
 *   Centralizes main-process validation for any renderer-requested external
 *   navigation. Keeping this policy in one place prevents security drift
 *   between different IPC modules.
 */

/**
 * Validate a URL intended for `shell.openExternal`.
 *
 * Security properties:
 *
 * - Only allow http/https protocols.
 * - Reject embedded credentials.
 * - Reject non-string, empty, or malformed inputs.
 *
 * Behavioral property:
 *
 * - Returns the caller-provided URL string trimmed, not canonicalized, to avoid
 *   surprise changes like appending a trailing slash.
 *
 * @param {unknown} url
 *
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

    // Basic length guard to avoid pathological inputs.
    // (Most browsers effectively cap URL length anyway; we enforce a conservative limit.)
    if (trimmed.length > 4096) {
        throw new TypeError("Invalid URL provided");
    }

    // Reject control characters outright.
    for (const char of trimmed) {
        const code = char.codePointAt(0);
        if (code !== undefined && (code < 0x20 || code === 0x7f)) {
            throw new TypeError("Invalid URL provided");
        }
    }

    // Require any whitespace to be percent-encoded.
    if (/\s/u.test(trimmed)) {
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
