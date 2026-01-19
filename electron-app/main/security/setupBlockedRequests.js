/**
 * Block known-unwanted network requests (telemetry / broken cert endpoints).
 *
 * Why:
 * - Some bundled views attempt to POST to ua.harryonline.net which currently fails with
 *   ERR_CERT_COMMON_NAME_INVALID and adds noisy console output.
 * - This app does not require that endpoint to function.
 *
 * This is a best-effort guard and is safe to call in tests (it no-ops when Electron session is
 * unavailable).
 */

const BLOCKED_HOSTNAMES = new Set(["ua.harryonline.net"]);

/**
 * @returns {void}
 */
function setupBlockedRequests() {
    try {
        // Prefer direct electron require so this module stays independent of runtime helpers.
        const electron = require("electron");
        const session = electron?.session?.defaultSession;
        if (!session || !session.webRequest || typeof session.webRequest.onBeforeRequest !== "function") {
            return;
        }

        session.webRequest.onBeforeRequest((details, callback) => {
            try {
                const url = typeof details?.url === "string" ? details.url : "";
                if (!url) {
                    callback({});
                    return;
                }

                const parsed = new URL(url);
                if (BLOCKED_HOSTNAMES.has(parsed.hostname)) {
                    callback({ cancel: true });
                    return;
                }

                callback({});
            } catch {
                callback({});
            }
        });
    } catch {
        /* ignore */
    }
}

module.exports = { setupBlockedRequests };
