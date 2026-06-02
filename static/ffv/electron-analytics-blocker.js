(function disableFfvAnalytics() {
    "use strict";

    const BLOCKED_HOSTNAMES = new Set(["ua.harryonline.net"]);

    function isBlockedUrl(url) {
        try {
            const parsed = new URL(url, window.location.href);
            return BLOCKED_HOSTNAMES.has(parsed.hostname);
        } catch {
            return false;
        }
    }

    try {
        const originalFetch =
            typeof window.fetch === "function"
                ? window.fetch.bind(window)
                : null;
        if (originalFetch && typeof Response === "function") {
            window.fetch = async (input, init) => {
                const url =
                    typeof input === "string"
                        ? input
                        : input && typeof input === "object" && "url" in input
                          ? String(input.url)
                          : "";
                if (url && isBlockedUrl(url)) {
                    return new Response("", { status: 204 });
                }
                return originalFetch(input, init);
            };
        }
    } catch {
        /* Ignore analytics patch failures. */
    }

    try {
        const originalBeacon =
            typeof navigator !== "undefined" &&
            typeof navigator.sendBeacon === "function"
                ? navigator.sendBeacon.bind(navigator)
                : null;
        if (originalBeacon) {
            navigator.sendBeacon = (url, data) => {
                const urlString = typeof url === "string" ? url : String(url);
                if (urlString && isBlockedUrl(urlString)) {
                    return true;
                }
                return originalBeacon(url, data);
            };
        }
    } catch {
        /* Ignore analytics patch failures. */
    }

    try {
        if (
            typeof XMLHttpRequest !== "undefined" &&
            XMLHttpRequest &&
            XMLHttpRequest.prototype
        ) {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            if (
                typeof originalOpen === "function" &&
                typeof originalSend === "function"
            ) {
                XMLHttpRequest.prototype.open = function open(
                    method,
                    url,
                    ...rest
                ) {
                    try {
                        const urlString =
                            typeof url === "string" ? url : String(url);
                        this.__ffvBlocked = Boolean(
                            urlString && isBlockedUrl(urlString)
                        );
                    } catch {
                        this.__ffvBlocked = false;
                    }
                    return originalOpen.call(this, method, url, ...rest);
                };
                XMLHttpRequest.prototype.send = function send(body) {
                    if (this.__ffvBlocked) {
                        try {
                            this.abort();
                        } catch {
                            /* Ignore abort failures. */
                        }
                        return;
                    }
                    return originalSend.call(this, body);
                };
            }
        }
    } catch {
        /* Ignore analytics patch failures. */
    }
})();
