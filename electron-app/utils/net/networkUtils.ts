/**
 * Shared network utilities for renderer/main code.
 *
 * Centralizes timeout handling and safe error shaping so network flows behave
 * consistently across export providers such as Gyazo and Imgur.
 */

import { getNetworkUtilsRuntime } from "./networkUtilsRuntime.js";

const networkUtilsRuntime = getNetworkUtilsRuntime();

/**
 * Best-effort fetch with a timeout.
 *
 * @param url - URL to fetch.
 * @param timeoutMs - Timeout in milliseconds.
 * @param init - Optional fetch init.
 *
 * @returns The fetch response.
 */
export async function fetchWithTimeout(
    url: string,
    timeoutMs: number,
    init: RequestInit = {}
): Promise<Response> {
    const controller = networkUtilsRuntime.createAbortController();
    const timeoutId =
        controller === undefined
            ? undefined
            : networkUtilsRuntime.setTimeout(() => {
                  controller.abort();
              }, timeoutMs);

    try {
        const fetchInit: RequestInit = { ...init };
        if (controller !== undefined) {
            fetchInit.signal = controller.signal;
        } else if (init.signal !== undefined) {
            fetchInit.signal = init.signal;
        }

        return await networkUtilsRuntime.fetch(url, fetchInit);
    } finally {
        if (timeoutId !== undefined) {
            networkUtilsRuntime.clearTimeout(timeoutId);
        }
    }
}

/**
 * Check whether an unknown error value is a DOM abort error.
 *
 * @param error - Error-like value to inspect.
 *
 * @returns True when the value has `name: "AbortError"`.
 */
export function isAbortError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
    );
}

/**
 * Truncate response/error text for safe inclusion in thrown errors.
 *
 * @param value - Text to truncate.
 * @param maxLength - Maximum number of characters to retain.
 *
 * @returns Truncated text, or an empty string for non-string input.
 */
export function truncateErrorText(
    value: null | string | undefined,
    maxLength = 500
): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}
