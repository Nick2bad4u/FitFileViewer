import { aP as w, aO as N, aQ as k, bf as O } from "./index-LvWRIhnC.js";
import { C as d, e as I, c as F } from "./isUnknown-BvXlyTdW.js";
(function () {
    try {
        var n = typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
            o = new Error().stack;
        o &&
            ((n._sentryDebugIds = n._sentryDebugIds || {}),
            (n._sentryDebugIds[o] = "f2b1a753-d171-4ddf-8936-82e4c2ccb533"),
            (n._sentryDebugIdIdentifier = "sentry-dbid-f2b1a753-d171-4ddf-8936-82e4c2ccb533"));
    } catch {
        /* Ignore errors */
    }
})();
const S = w.forwardRef(({ className: n, children: o, ...r }, i) =>
    N.jsx("select", {
        ref: i,
        className: k(
            "flex h-6 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-0 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300",
            n
        ),
        ...r,
        children: o,
    })
);
S.displayName = "Select";
const _ = w.forwardRef(({ className: n, children: o, ...r }, i) =>
    N.jsx("option", {
        ref: i,
        className: k(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50",
            n
        ),
        ...r,
        children: o,
    })
);
_.displayName = "Option";
function T(n, o, r, i) {
    const x = i ? "rawFieldValue" : "fieldValue",
        u = Object.keys(d).map(Number),
        { fieldDefinitions: f, fields: a } = o,
        h = f.reduce((e, s) => {
            const { fieldDefinitionNumber: t, baseType: c } = s;
            return ((e[t] = c), e);
        }, {});
    if (!f) {
        const e = Object.keys(a),
            s = Object.keys(d);
        return (e.sort((t, c) => s.includes(c) - s.includes(t)), e.map((t) => a[t]));
    }
    function m(e) {
        const s = [e],
            t = a == null ? void 0 : a[e];
        return (
            t &&
                (t.subfields ? [t, ...t.subfields] : [t]).forEach((g) => {
                    g.components && s.push(...g.components.flatMap((E) => m(E.fieldDefNumber)));
                }),
            s
        );
    }
    const D = f
        .flatMap((e) => m(e.fieldDefinitionNumber))
        .filter((e) => !u.includes(e))
        .sort((e, s) => e - s);
    function p(e) {
        return n.some((s) => s[e] && [x] in s[e]);
    }
    const b = new Set(),
        l = [];
    function y(e) {
        const { key: s } = e;
        b.has(s) || (!O && F(s)) || (b.add(s), l.push(e));
    }
    return (
        [...u, ...D].forEach((e) => {
            const s = (a == null ? void 0 : a[e]) || d[e] || {},
                t = (s == null ? void 0 : s.fieldName) || `field ${e}`;
            p(t) && y({ ...s, baseType: h[e], key: t });
        }),
        r.forEach((e) => {
            const { key: s } = e;
            p(s) && y({ ...e, key: s, ciq: !0 });
        }),
        I.includes(o.messageName)
            ? i
                ? l.filter((e) => e.fieldName !== "timestamp")
                : l.map((e) => (e.fieldName === "timestamp" ? { ...e, fromPrevious: !0 } : e))
            : l
    );
}
export { _ as O, S, T as f };
