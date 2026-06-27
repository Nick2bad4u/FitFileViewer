import { sessionRef } from "../runtime/electronAccess.js";

type WebRequestCallback = (response: { cancel?: boolean }) => void;

type WebRequestDetails = {
    readonly url?: unknown;
};

type WebRequestLike = {
    readonly onBeforeRequest?: (
        listener: (
            details: WebRequestDetails,
            callback: WebRequestCallback
        ) => void
    ) => void;
};

type SessionLike = {
    readonly defaultSession?: {
        readonly webRequest?: WebRequestLike;
    };
};

const BLOCKED_HOSTNAMES = new Set(["ua.harryonline.net"]);

function isWebRequestLike(value: unknown): value is WebRequestLike {
    if (
        value === null ||
        (typeof value !== "object" && typeof value !== "function")
    ) {
        return false;
    }

    const candidate = value as { readonly onBeforeRequest?: unknown };
    return typeof candidate.onBeforeRequest === "function";
}

function shouldBlockRequest(details: WebRequestDetails): boolean {
    const url = typeof details.url === "string" ? details.url : "";
    if (!url) {
        return false;
    }

    try {
        return BLOCKED_HOSTNAMES.has(new URL(url).hostname);
    } catch {
        return false;
    }
}

/**
 * Block known-unwanted network requests.
 *
 * This is defensive and safe to call when Electron session is unavailable.
 */
export function setupBlockedRequests(): void {
    try {
        const webRequest = (sessionRef() as SessionLike | undefined)
            ?.defaultSession?.webRequest;
        if (!isWebRequestLike(webRequest)) {
            return;
        }

        webRequest.onBeforeRequest?.((details, callback) => {
            callback(shouldBlockRequest(details) ? { cancel: true } : {});
        });
    } catch {
        /* ignore */
    }
}
