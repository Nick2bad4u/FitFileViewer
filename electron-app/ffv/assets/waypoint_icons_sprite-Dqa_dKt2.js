(function () {
    try {
        var e = typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
            n = new Error().stack;
        n &&
            ((e._sentryDebugIds = e._sentryDebugIds || {}),
            (e._sentryDebugIds[n] = "7fb7c46d-b21f-49e0-878a-fcdb011811d2"),
            (e._sentryDebugIdIdentifier = "sentry-dbid-7fb7c46d-b21f-49e0-878a-fcdb011811d2"));
    } catch {
        /* Ignore errors */
    }
})();
const t = "" + new URL("waypoint_icons_sprite-YvDnYGeq.svg", import.meta.url).href;
export { t as default };
