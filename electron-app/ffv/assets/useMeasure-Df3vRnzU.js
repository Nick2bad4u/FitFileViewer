import { bn as i, aP as n, br as m } from "./index-LvWRIhnC.js";
(function () {
    try {
        var t =
                typeof window < "u"
                    ? window
                    : typeof global < "u"
                      ? global
                      : typeof self < "u"
                        ? self
                        : {},
            r = new Error().stack;
        r &&
            ((t._sentryDebugIds = t._sentryDebugIds || {}),
            (t._sentryDebugIds[r] = "5de2fe6f-6c17-4bba-9a70-fb6c1cca56a3"),
            (t._sentryDebugIdIdentifier =
                "sentry-dbid-5de2fe6f-6c17-4bba-9a70-fb6c1cca56a3"));
    } catch {
        /* Ignore errors */
    }
})();
var I = i ? n.useLayoutEffect : n.useEffect,
    c = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    };
function x() {
    var t = n.useState(null),
        r = t[0],
        o = t[1],
        f = n.useState(c),
        a = f[0],
        d = f[1],
        s = n.useMemo(function () {
            return new window.ResizeObserver(function (u) {
                if (u[0]) {
                    var e = u[0].contentRect,
                        b = e.x,
                        y = e.y,
                        h = e.width,
                        w = e.height,
                        l = e.top,
                        g = e.left,
                        p = e.bottom,
                        v = e.right;
                    d({
                        x: b,
                        y,
                        width: h,
                        height: w,
                        top: l,
                        left: g,
                        bottom: p,
                        right: v,
                    });
                }
            });
        }, []);
    return (
        I(
            function () {
                if (r)
                    return (
                        s.observe(r),
                        function () {
                            s.disconnect();
                        }
                    );
            },
            [r]
        ),
        [o, a]
    );
}
const D =
    i && typeof window.ResizeObserver < "u"
        ? x
        : function () {
              return [m, c];
          };
export { D as u };
