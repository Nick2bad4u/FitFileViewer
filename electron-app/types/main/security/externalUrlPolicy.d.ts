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
export function validateExternalUrl(url: unknown): string;
//# sourceMappingURL=externalUrlPolicy.d.ts.map
