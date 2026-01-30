/**
 * @file Shared network utilities for renderer/main code.
 *
 *   Centralizes timeout handling and safe error shaping so network flows behave
 *   consistently across export providers (Gyazo, Imgur, etc.).
 */

/**
 * Best-effort fetch with a timeout.
 *
 * - Uses AbortController when available.
 * - Preserves an existing init.signal if AbortController is unavailable.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @param {RequestInit} [init]
 *
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, timeoutMs, init) {
    const resolvedInit = init ?? {};
    const controller =
        typeof AbortController === "undefined" ? null : new AbortController();
    const timeoutId = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

    try {
        return await fetch(url, {
            ...resolvedInit,
            signal: controller ? controller.signal : resolvedInit.signal,
        });
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

/**
 * @param {object | string | number | boolean | null | undefined} error
 *
 * @returns {boolean}
 */
export function isAbortError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }

    const candidate = /** @type {{ name?: string }} */ (error);
    return candidate.name === "AbortError";
}

/**
 * Truncate a response body/error text for safe inclusion in thrown errors.
 *
 * @param {string | null | undefined} value
 * @param {number} [maxLength]
 *
 * @returns {string}
 */
export function truncateErrorText(value, maxLength = 500) {
    if (typeof value !== "string") return "";
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}
