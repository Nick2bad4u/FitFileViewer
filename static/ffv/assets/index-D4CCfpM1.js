import {
    aL as R,
    bi as v,
    bj as D,
    aS as r,
    aO as E,
    b7 as L,
    be as k,
} from "./index-LvWRIhnC.js";
(function () {
    try {
        var s =
                typeof window < "u"
                    ? window
                    : typeof global < "u"
                      ? global
                      : typeof self < "u"
                        ? self
                        : {},
            f = new Error().stack;
        f &&
            ((s._sentryDebugIds = s._sentryDebugIds || {}),
            (s._sentryDebugIds[f] = "a6de48fa-3e3d-4f59-a396-228a80aac06c"),
            (s._sentryDebugIdIdentifier =
                "sentry-dbid-a6de48fa-3e3d-4f59-a396-228a80aac06c"));
    } catch {
        /* Ignore errors */
    }
})();
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const F = R("Download", [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
    ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }],
]);
var j = { exports: {} };
(function (s, f) {
    (function (l, c) {
        c();
    })(v, function () {
        function l(e, t) {
            return (
                typeof t > "u"
                    ? (t = { autoBom: !1 })
                    : typeof t != "object" &&
                      (console.warn(
                          "Deprecated: Expected third argument to be a object"
                      ),
                      (t = { autoBom: !t })),
                t.autoBom &&
                /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
                    e.type
                )
                    ? new Blob(["\uFEFF", e], { type: e.type })
                    : e
            );
        }
        function c(e, t, o) {
            var n = new XMLHttpRequest();
            (n.open("GET", e),
                (n.responseType = "blob"),
                (n.onload = function () {
                    u(n.response, t, o);
                }),
                (n.onerror = function () {
                    console.error("could not download file");
                }),
                n.send());
        }
        function w(e) {
            var t = new XMLHttpRequest();
            t.open("HEAD", e, !1);
            try {
                t.send();
            } catch {
                /* Ignore errors */
            }
            return 200 <= t.status && 299 >= t.status;
        }
        function d(e) {
            try {
                e.dispatchEvent(new MouseEvent("click"));
            } catch {
                var t = document.createEvent("MouseEvents");
                (t.initMouseEvent(
                    "click",
                    !0,
                    !0,
                    window,
                    0,
                    0,
                    0,
                    80,
                    20,
                    !1,
                    !1,
                    !1,
                    !1,
                    0,
                    null
                ),
                    e.dispatchEvent(t));
            }
        }
        var i =
                typeof window == "object" && window.window === window
                    ? window
                    : typeof self == "object" && self.self === self
                      ? self
                      : typeof v == "object" && v.global === v
                        ? v
                        : void 0,
            y =
                i.navigator &&
                /Macintosh/.test(navigator.userAgent) &&
                /AppleWebKit/.test(navigator.userAgent) &&
                !/Safari/.test(navigator.userAgent),
            u =
                i.saveAs ||
                (typeof window != "object" || window !== i
                    ? function () {}
                    : "download" in HTMLAnchorElement.prototype && !y
                      ? function (e, t, o) {
                            var n = i.URL || i.webkitURL,
                                a = document.createElement("a");
                            ((t = t || e.name || "download"),
                                (a.download = t),
                                (a.rel = "noopener"),
                                typeof e == "string"
                                    ? ((a.href = e),
                                      a.origin === location.origin
                                          ? d(a)
                                          : w(a.href)
                                            ? c(e, t, o)
                                            : d(a, (a.target = "_blank")))
                                    : ((a.href = n.createObjectURL(e)),
                                      setTimeout(function () {
                                          n.revokeObjectURL(a.href);
                                      }, 4e4),
                                      setTimeout(function () {
                                          d(a);
                                      }, 0)));
                        }
                      : "msSaveOrOpenBlob" in navigator
                        ? function (e, t, o) {
                              if (
                                  ((t = t || e.name || "download"),
                                  typeof e != "string")
                              )
                                  navigator.msSaveOrOpenBlob(l(e, o), t);
                              else if (w(e)) c(e, t, o);
                              else {
                                  var n = document.createElement("a");
                                  ((n.href = e),
                                      (n.target = "_blank"),
                                      setTimeout(function () {
                                          d(n);
                                      }));
                              }
                          }
                        : function (e, t, o, n) {
                              if (
                                  ((n = n || open("", "_blank")),
                                  n &&
                                      (n.document.title =
                                          n.document.body.innerText =
                                              "downloading..."),
                                  typeof e == "string")
                              )
                                  return c(e, t, o);
                              var a = e.type === "application/octet-stream",
                                  x =
                                      /constructor/i.test(i.HTMLElement) ||
                                      i.safari,
                                  b = /CriOS\/[\d]+/.test(navigator.userAgent);
                              if (
                                  (b || (a && x) || y) &&
                                  typeof FileReader < "u"
                              ) {
                                  var m = new FileReader();
                                  ((m.onloadend = function () {
                                      var p = m.result;
                                      ((p = b
                                          ? p
                                          : p.replace(
                                                /^data:[^;]*;/,
                                                "data:attachment/file;"
                                            )),
                                          n
                                              ? (n.location.href = p)
                                              : (location = p),
                                          (n = null));
                                  }),
                                      m.readAsDataURL(e));
                              } else {
                                  var h = i.URL || i.webkitURL,
                                      g = h.createObjectURL(e);
                                  (n ? (n.location = g) : (location.href = g),
                                      (n = null),
                                      setTimeout(function () {
                                          h.revokeObjectURL(g);
                                      }, 4e4));
                              }
                          });
        ((i.saveAs = u.saveAs = u), (s.exports = u));
    });
})(j);
var A = j.exports;
const S = D(A);
function T(s) {
    const {
            getData: f,
            filename: l,
            className: c,
            children: w,
            title: d,
            label: i,
            variant: y = "ghost",
            size: u = "icon",
            category: e,
        } = s,
        t = async (o) => {
            (o.stopPropagation(),
                o.preventDefault(),
                k("Download", { category: e, message: i }));
            const n = await f();
            S.saveAs(n, l);
        };
    return E.jsx(L, {
        variant: y,
        size: u,
        asChild: !0,
        children: E.jsx("a", {
            href: l,
            onClick: t,
            download: !0,
            title: d,
            className: c,
            children: w,
        }),
    });
}
T.propTypes = {
    getData: r.func.isRequired,
    filename: r.string.isRequired,
    title: r.string,
    className: r.string,
    label: r.string,
    children: r.node.isRequired,
    variant: r.string,
    category: r.string.isRequired,
    size: r.string,
};
export { T as D, F as a };
