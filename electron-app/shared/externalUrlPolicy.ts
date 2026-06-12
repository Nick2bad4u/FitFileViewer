/**
 * Validate a URL intended for `shell.openExternal`.
 *
 * Security properties:
 *
 * - Only allow https and mailto protocols.
 * - Reject embedded credentials.
 * - Reject non-string, empty, or malformed inputs.
 *
 * Behavioral property:
 *
 * - Returns the caller-provided URL string trimmed, not canonicalized, to avoid
 *   surprise changes like appending a trailing slash.
 *
 * @throws TypeError when the input is not a valid URL string.
 * @throws Error when the URL protocol or credential policy rejects the URL.
 */
export function validateExternalUrl(url: unknown): string {
    if (typeof url !== "string") {
        throw new TypeError("Invalid URL provided");
    }

    const trimmed = url.trim();
    if (!trimmed) {
        throw new TypeError("Invalid URL provided");
    }

    // Basic length guard to avoid pathological inputs.
    // Most browsers cap URL length anyway; keep this deliberately conservative.
    if (trimmed.length > 4096) {
        throw new TypeError("Invalid URL provided");
    }

    for (const char of trimmed) {
        const code = char.codePointAt(0);
        if (code !== undefined && (code < 0x20 || code === 0x7f)) {
            throw new TypeError("Invalid URL provided");
        }
    }

    if (/\s/u.test(trimmed)) {
        throw new TypeError("Invalid URL provided");
    }

    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new TypeError("Invalid URL provided");
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "mailto:") {
        throw new Error("Only HTTPS and mailto URLs are allowed");
    }

    if (parsed.username || parsed.password) {
        throw new Error("Credentials in URLs are not allowed");
    }

    return trimmed;
}
