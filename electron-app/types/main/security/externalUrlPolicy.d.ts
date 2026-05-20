/**
 * @file External URL validation policy.
 *
 *   Centralizes main-process validation for renderer-requested external
 *   navigation. Keeping this policy in one place prevents security drift
 *   between different IPC modules.
 */
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
 * @param {unknown} url
 *
 * @returns {string}
 */
export function validateExternalUrl(url: unknown): string;
