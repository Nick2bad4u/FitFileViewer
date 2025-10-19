import { p as d } from "./isUnknown-BvXlyTdW.js";
import "./index-LvWRIhnC.js";
(function () {
    try {
        var e = typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
            r = new Error().stack;
        r &&
            ((e._sentryDebugIds = e._sentryDebugIds || {}),
            (e._sentryDebugIds[r] = "07184dbf-0ce7-4990-9337-a9b3d1f9a08e"),
            (e._sentryDebugIdIdentifier = "sentry-dbid-07184dbf-0ce7-4990-9337-a9b3d1f9a08e"));
    } catch {
        /* Ignore errors */
    }
})();
function i(e, r, t) {
    if (!(r in d.mesgNum)) throw new Error(`Invalid message name ${r}`);
    const n = d.mesgNum[r];
    return (!e[n] && t && (e[n] = []), e[n]);
}
export { i as g };
