import { j as i, d as I, B as n } from "./isUnknown-BvXlyTdW.js";
import "./index-LvWRIhnC.js";
(function () {
    try {
        var e =
                typeof window < "u"
                    ? window
                    : typeof global < "u"
                      ? global
                      : typeof self < "u"
                        ? self
                        : {},
            r = new Error().stack;
        r &&
            ((e._sentryDebugIds = e._sentryDebugIds || {}),
            (e._sentryDebugIds[r] = "f60193f7-9083-4b1d-a552-34b882bd45c0"),
            (e._sentryDebugIdIdentifier =
                "sentry-dbid-f60193f7-9083-4b1d-a552-34b882bd45c0"));
    } catch {
        /* Ignore errors */
    }
})();
function x(e) {
    return e ? new Date((e + i) * 1e3) : null;
}
const f = [
    0,
    52225,
    55297,
    5120,
    61441,
    15360,
    10240,
    58369,
    40961,
    27648,
    30720,
    46081,
    20480,
    39937,
    34817,
    17408,
];
function a(e, r) {
    return ((e >> 4) & 4095) ^ f[e & 15] ^ f[r & 15];
}
function u(e, r) {
    const t = a(e, r);
    return a(t, r >> 4);
}
function y(e) {
    return new Uint8Array(e).reduce(u, 0);
}
function T(e, r, t = !0) {
    const { size: c, invalid: o } = I[r],
        s = new DataView(new ArrayBuffer(c));
    switch (r) {
        case n.SINT8:
            s.setInt8(0, e, t);
            break;
        case n.ENUM:
        case n.BYTE:
        case n.UINT8:
            s.setUint8(0, e, t);
            break;
        case n.SINT16:
            s.setInt16(0, e, t);
            break;
        case n.UINT16:
            s.setUint16(0, e, t);
            break;
        case n.SINT32:
            s.setInt32(0, e, t);
            break;
        case n.UINT32:
            s.setUint32(0, e, t);
            break;
        case n.FLOAT32:
            e === o ? s.setUint32(0, e, t) : s.setFloat32(0, e, t);
            break;
        case n.FLOAT64:
            e === o ? s.setUint64(0, e, t) : s.setFloat64(0, e, t);
            break;
        case n.UINT8Z:
            s.setUint8(0, e, t);
            break;
        case n.UINT16Z:
            s.setUint16(0, e, t);
            break;
        case n.UINT32Z:
            s.setUint32(0, e, t);
            break;
        case n.SINT64:
            s.setBigInt64(0, BigInt(e), t);
            break;
        case n.UINT64:
            s.setBigUint64(0, BigInt(e), t);
            break;
        case n.UINT64Z:
            s.setBigUint64(0, BigInt(e), t);
            break;
        default:
            throw new Error(`Invalid base type: ${typeof r} ${r}`);
    }
    return s.buffer;
}
function k(e) {
    const r = e.reduce((o, s) => o + s.byteLength, 0),
        t = new Uint8Array(r);
    let c = 0;
    return (
        e.forEach((o) => {
            (t.set(new Uint8Array(o), c), (c += o.byteLength));
        }),
        t.buffer
    );
}
function b(e) {
    const r = e.map((c) => c.toString(16).padStart(2, "0")).join(" "),
        t = e
            .map((c) => (c >= 32 && c < 127 ? String.fromCharCode(c) : "."))
            .join("");
    return `${r} ${t}`;
}
function w(e, r = 16) {
    const t = Array.from(new Uint8Array(e));
    if (t.length <= r) return b(t);
    const c = [];
    for (let o = 0; o < t.length; o += r) c.push(b(t.slice(o, o + r)));
    return c.join(`
`);
}
export { k as a, T as b, y as c, w as d, x as e };
