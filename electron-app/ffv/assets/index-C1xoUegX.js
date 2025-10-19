var Dt = Object.defineProperty;
var ae = (e) => {
    throw TypeError(e);
};
var Bt = (e, t, i) => (t in e ? Dt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : (e[t] = i));
var q = (e, t, i) => Bt(e, typeof t != "symbol" ? t + "" : t, i),
    oe = (e, t, i) => t.has(e) || ae("Cannot " + i);
var I = (e, t, i) => (oe(e, t, "read from private field"), i ? i.call(e) : t.get(e)),
    U = (e, t, i) =>
        t.has(e)
            ? ae("Cannot add the same private member more than once")
            : t instanceof WeakSet
              ? t.add(e)
              : t.set(e, i),
    V = (e, t, i, n) => (oe(e, t, "write to private field"), n ? n.call(e, i) : t.set(e, i), i);
import {
    F as J,
    N as Rt,
    p as w,
    d as E,
    B as Be,
    i as Re,
    C as ie,
    e as Oe,
    c as Ot,
    I as L,
    g as P,
    a as le,
    j as Ue,
    S as k,
    R as Ut,
} from "./isUnknown-BvXlyTdW.js";
import { bf as Ct, ap as Ce, aV as ue } from "./index-LvWRIhnC.js";
import { g as _ } from "./getMessagesForName-CXPND5Gu.js";
import { e as Le, a as W, b as ce, d as de, c as ke } from "./binaryString-DLpsQS3c.js";
(function () {
    try {
        var e = typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
            t = new Error().stack;
        t &&
            ((e._sentryDebugIds = e._sentryDebugIds || {}),
            (e._sentryDebugIds[t] = "a0b9bbe9-9bc7-4833-9cb2-c3c56914b0b4"),
            (e._sentryDebugIdIdentifier = "sentry-dbid-a0b9bbe9-9bc7-4833-9cb2-c3c56914b0b4"));
    } catch {
        /* Ignore errors */
    }
})();
const h = {
        ENUM: 0,
        SINT8: 1,
        UINT8: 2,
        SINT16: 131,
        UINT16: 132,
        SINT32: 133,
        UINT32: 134,
        STRING: 7,
        FLOAT32: 136,
        FLOAT64: 137,
        UINT8Z: 10,
        UINT16Z: 139,
        UINT32Z: 140,
        BYTE: 13,
        SINT64: 142,
        UINT64: 143,
        UINT64Z: 144,
    },
    Lt = {
        0: { size: 1, type: h.ENUM, invalid: 255 },
        1: { size: 1, type: h.SINT8, invalid: 127 },
        2: { size: 1, type: h.UINT8, invalid: 255 },
        131: { size: 2, type: h.SINT16, invalid: 32767 },
        132: { size: 2, type: h.UINT16, invalid: 65535 },
        133: { size: 4, type: h.SINT32, invalid: 2147483647 },
        134: { size: 4, type: h.UINT32, invalid: 4294967295 },
        7: { size: 1, type: h.STRING, invalid: 0 },
        136: { size: 4, type: h.FLOAT32, invalid: 4294967295 },
        137: { size: 8, type: h.FLOAT64, invalid: 18446744073709552e3 },
        10: { size: 1, type: h.UINT8Z, invalid: 0 },
        139: { size: 2, type: h.UINT16Z, invalid: 0 },
        140: { size: 4, type: h.UINT32Z, invalid: 0 },
        13: { size: 1, type: h.BYTE, invalid: 255 },
        142: { size: 8, type: h.SINT64, invalid: 9223372036854776e3 },
        143: { size: 8, type: h.UINT64, invalid: 18446744073709552e3 },
        144: { size: 8, type: h.UINT64Z, invalid: 0 },
    },
    kt = [
        "sint8",
        "uint8",
        "sint16",
        "uint16",
        "sint32",
        "uint32",
        "float32",
        "float64",
        "uint8z",
        "uint16z",
        "uint32z",
        "byte",
        "sint64",
        "uint64",
        "uint64z",
    ],
    $t = {
        enum: h.UINT8,
        sint8: h.SINT8,
        uint8: h.UINT8,
        sint16: h.SINT16,
        uint16: h.UINT16,
        sint32: h.SINT32,
        uint32: h.UINT32,
        string: h.STRING,
        float32: h.FLOAT32,
        float64: h.FLOAT64,
        uint8z: h.UINT8Z,
        uint16z: h.UINT16Z,
        uint32z: h.UINT32Z,
        byte: h.BYTE,
        sint64: h.SINT64,
        uint64: h.UINT64,
        uint64z: h.UINT64Z,
    },
    zt = {
        [h.ENUM]: "enum",
        [h.SINT8]: "sint8",
        [h.UINT8]: "uint8",
        [h.SINT16]: "sint16",
        [h.UINT16]: "uint16",
        [h.SINT32]: "sint32",
        [h.UINT32]: "uint32",
        [h.STRING]: "string",
        [h.FLOAT32]: "float32",
        [h.FLOAT64]: "float64",
        [h.UINT8Z]: "uint8z",
        [h.UINT16Z]: "uint16z",
        [h.UINT32Z]: "uint32z",
        [h.BYTE]: "byte",
        [h.SINT64]: "sint64",
        [h.UINT64]: "uint64",
        [h.UINT64Z]: "uint64z",
    },
    $e = (e) => e == null,
    jt = (e) => typeof e == "object",
    ze = (e) => typeof e == "boolean",
    je = (e) => typeof e == "object" && e instanceof Date,
    Pe = (e) => typeof e == "string",
    Ze = (e) => !isNaN(parseFloat(e)) && isFinite(e),
    Pt = (e) => !Ge(e),
    Ge = (e) => !($e(e) || (!je(e) && !Pe(e) && !Ze(e) && !ze(e))),
    T = {
        BaseType: h,
        BaseTypeDefinitions: Lt,
        NumericFieldTypes: kt,
        FieldTypeToBaseType: $t,
        BaseTypeToFieldType: zt,
        isNullOrUndefined: $e,
        isObject: jt,
        isBoolean: ze,
        isDate: je,
        isString: Pe,
        isNumeric: Ze,
        isNumberStringDateOrBoolean: Ge,
        isNotNumberStringDateOrBoolean: Pt,
        MAX_FIELD_SIZE: 255,
        MESG_DEFINITION_MASK: 64,
        LOCAL_MESG_NUM_MASK: 15,
        ARCH_LITTLE_ENDIAN: 0,
        DEV_DATA_MASK: 32,
    },
    Zt = (e) => (He(e) ? null : e.length === 1 ? e[0] : e),
    He = (e) => e.reduce((t, i) => (i != null ? !1 : t), !0),
    Gt = (e, t) => (Array.isArray(e) ? e.reduce((i, n) => (n != t ? !1 : i), !0) : e === t),
    fe = { sanitizeValues: Zt, onlyNullValues: He, onlyInvalidValues: Gt };
var v, S, H, R;
const B = class B {
    constructor(t) {
        U(this, v, 0);
        U(this, S, null);
        U(this, H, new TextDecoder("utf-8", { fatal: !1, ignoreBOM: !0 }));
        U(this, R, null);
        (V(this, v, 0), V(this, S, t));
    }
    static fromByteArray(t) {
        const i = new Uint8Array(t);
        return this.fromArrayBuffer(i.buffer);
    }
    static fromBuffer(t) {
        const i = t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength);
        return this.fromArrayBuffer(i);
    }
    static fromArrayBuffer(t) {
        return new B(t);
    }
    get length() {
        return I(this, S).byteLength;
    }
    get bytesRead() {
        return I(this, v);
    }
    get position() {
        return I(this, v);
    }
    get crcCalculator() {
        return I(this, R);
    }
    set crcCalculator(t) {
        V(this, R, t);
    }
    reset() {
        this.seek(0);
    }
    seek(t) {
        V(this, v, t);
    }
    slice(t, i) {
        return I(this, S).slice(t, i);
    }
    peekByte() {
        const t = I(this, S).slice(I(this, v), I(this, v) + 1);
        return new DataView(t).getUint8(0);
    }
    readByte() {
        return this.readUInt8();
    }
    readBytes(t) {
        var n;
        if (I(this, v) + t > I(this, S).byteLength)
            throw Error(`FIT Runtime Error end of stream at byte ${I(this, v)}`);
        const i = new Uint8Array(I(this, S), I(this, v), t);
        return (V(this, v, I(this, v) + t), (n = I(this, R)) == null || n.addBytes(i, 0, t), i);
    }
    readUInt8(t) {
        return this.readValue(T.BaseType.UINT8, 1, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readInt8(t) {
        return this.readValue(T.BaseType.SINT8, 1, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readUInt16(t) {
        return this.readValue(T.BaseType.UINT16, 2, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readInt16(t) {
        return this.readValue(T.BaseType.SINT16, 2, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readUInt32(t) {
        return this.readValue(T.BaseType.UINT32, 4, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readInt32(t) {
        return this.readValue(T.BaseType.SINT32, 4, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readUInt64(t) {
        return this.readValue(T.BaseType.UINT64, 8, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readInt64(t) {
        return this.readValue(T.BaseType.SINT64, 8, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readFloat32(t) {
        return this.readValue(T.BaseType.FLOAT32, 4, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readFloat64(t) {
        return this.readValue(T.BaseType.FLOAT64, 8, {
            convertInvalidToNull: !1,
            ...t,
        });
    }
    readString(t) {
        return this.readValue(T.BaseType.STRING, t);
    }
    readValue(t, i, { endianness: n = B.LITTLE_ENDIAN, convertInvalidToNull: r = !0 } = {}) {
        const s = T.BaseTypeDefinitions[t].size,
            o = T.BaseTypeDefinitions[t].invalid,
            l = this.readBytes(i);
        if (i % s !== 0) return r ? null : o;
        if (t === T.BaseType.STRING) {
            const d = I(this, H)
                .decode(l)
                .replace(/\uFFFD/g, "")
                .split("\0");
            for (; d[d.length - 1] === ""; ) d.pop();
            return d.length === 0 ? null : d.length === 1 ? d[0] : d;
        }
        const a = new DataView(l.buffer, l.byteOffset, l.byteLength);
        let u = [];
        const f = i / s;
        for (let c = 0; c < f; c++)
            switch (t) {
                case T.BaseType.BYTE:
                case T.BaseType.ENUM:
                case T.BaseType.UINT8:
                case T.BaseType.UINT8Z:
                    u.push(a.getUint8(c * s));
                    break;
                case T.BaseType.SINT8:
                    u.push(a.getInt8(c * s));
                    break;
                case T.BaseType.UINT16:
                case T.BaseType.UINT16Z:
                    u.push(a.getUint16(c * s, n));
                    break;
                case T.BaseType.SINT16:
                    u.push(a.getInt16(c * s, n));
                    break;
                case T.BaseType.UINT32:
                case T.BaseType.UINT32Z:
                    u.push(a.getUint32(c * s, n));
                    break;
                case T.BaseType.SINT32:
                    u.push(a.getInt32(c * s, n));
                    break;
                case T.BaseType.UINT64:
                case T.BaseType.UINT64Z:
                    u.push(a.getBigUint64(c * s, n));
                    break;
                case T.BaseType.SINT64:
                    u.push(a.getBigInt64(c * s, n));
                    break;
                case T.BaseType.FLOAT32:
                    u.push(a.getFloat32(c * s, n));
                    break;
                case T.BaseType.FLOAT64:
                    u.push(a.getFloat64(c * s, n));
                    break;
            }
        return t === T.BaseType.BYTE
            ? fe.onlyInvalidValues(u, o)
                ? null
                : u
            : (r && (u = u.map((c) => (c === o ? null : c))), fe.sanitizeValues(u));
    }
};
((v = new WeakMap()),
    (S = new WeakMap()),
    (H = new WeakMap()),
    (R = new WeakMap()),
    q(B, "LITTLE_ENDIAN", !0),
    q(B, "BIG_ENDIAN", !1));
let A = B;
new TextEncoder();
var Ht = typeof global == "object" && global && global.Object === Object && global,
    Wt = typeof self == "object" && self && self.Object === Object && self,
    Yt = Ht || Wt || Function("return this")(),
    O = Yt.Symbol,
    We = Object.prototype,
    Kt = We.hasOwnProperty,
    qt = We.toString,
    C = O ? O.toStringTag : void 0;
function Jt(e) {
    var t = Kt.call(e, C),
        i = e[C];
    try {
        e[C] = void 0;
        var n = !0;
    } catch {
        /* Ignore errors */
    }
    var r = qt.call(e);
    return (n && (t ? (e[C] = i) : delete e[C]), r);
}
var Xt = Object.prototype,
    Qt = Xt.toString;
function ei(e) {
    return Qt.call(e);
}
var ti = "[object Null]",
    ii = "[object Undefined]",
    me = O ? O.toStringTag : void 0;
function ni(e) {
    return e == null ? (e === void 0 ? ii : ti) : me && me in Object(e) ? Jt(e) : ei(e);
}
function ri(e) {
    return e != null && typeof e == "object";
}
var si = "[object Symbol]";
function ai(e) {
    return typeof e == "symbol" || (ri(e) && ni(e) == si);
}
function oi(e, t) {
    for (var i = -1, n = e == null ? 0 : e.length, r = Array(n); ++i < n; ) r[i] = t(e[i], i, e);
    return r;
}
var li = Array.isArray,
    ui = 1 / 0,
    pe = O ? O.prototype : void 0,
    he = pe ? pe.toString : void 0;
function Ye(e) {
    if (typeof e == "string") return e;
    if (li(e)) return oi(e, Ye) + "";
    if (ai(e)) return he ? he.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -ui ? "-0" : t;
}
function Y(e) {
    return e == null ? "" : Ye(e);
}
function ci(e, t, i) {
    var n = -1,
        r = e.length;
    (t < 0 && (t = -t > r ? 0 : r + t),
        (i = i > r ? r : i),
        i < 0 && (i += r),
        (r = t > i ? 0 : (i - t) >>> 0),
        (t >>>= 0));
    for (var s = Array(r); ++n < r; ) s[n] = e[n + t];
    return s;
}
function di(e, t, i) {
    var n = e.length;
    return ((i = i === void 0 ? n : i), !t && i >= n ? e : ci(e, t, i));
}
var fi = "\\ud800-\\udfff",
    mi = "\\u0300-\\u036f",
    pi = "\\ufe20-\\ufe2f",
    hi = "\\u20d0-\\u20ff",
    gi = mi + pi + hi,
    yi = "\\ufe0e\\ufe0f",
    bi = "\\u200d",
    Ti = RegExp("[" + bi + fi + gi + yi + "]");
function Ke(e) {
    return Ti.test(e);
}
function xi(e) {
    return e.split("");
}
var qe = "\\ud800-\\udfff",
    _i = "\\u0300-\\u036f",
    Fi = "\\ufe20-\\ufe2f",
    Ii = "\\u20d0-\\u20ff",
    wi = _i + Fi + Ii,
    Ni = "\\ufe0e\\ufe0f",
    vi = "[" + qe + "]",
    X = "[" + wi + "]",
    Q = "\\ud83c[\\udffb-\\udfff]",
    Si = "(?:" + X + "|" + Q + ")",
    Je = "[^" + qe + "]",
    Xe = "(?:\\ud83c[\\udde6-\\uddff]){2}",
    Qe = "[\\ud800-\\udbff][\\udc00-\\udfff]",
    Ei = "\\u200d",
    et = Si + "?",
    tt = "[" + Ni + "]?",
    Mi = "(?:" + Ei + "(?:" + [Je, Xe, Qe].join("|") + ")" + tt + et + ")*",
    Ai = tt + et + Mi,
    Vi = "(?:" + [Je + X + "?", X, Xe, Qe, vi].join("|") + ")",
    Di = RegExp(Q + "(?=" + Q + ")|" + Vi + Ai, "g");
function Bi(e) {
    return e.match(Di) || [];
}
function Ri(e) {
    return Ke(e) ? Bi(e) : xi(e);
}
function Oi(e) {
    return function (t) {
        t = Y(t);
        var i = Ke(t) ? Ri(t) : void 0,
            n = i ? i[0] : t.charAt(0),
            r = i ? di(i, 1).join("") : t.slice(1);
        return n[e]() + r;
    };
}
var Ui = Oi("toUpperCase");
function Ci(e) {
    return Ui(Y(e).toLowerCase());
}
function Li(e, t, i, n) {
    for (var r = -1, s = e == null ? 0 : e.length; ++r < s; ) i = t(i, e[r], r, e);
    return i;
}
function ki(e) {
    return function (t) {
        return e == null ? void 0 : e[t];
    };
}
var $i = {
        À: "A",
        Á: "A",
        Â: "A",
        Ã: "A",
        Ä: "A",
        Å: "A",
        à: "a",
        á: "a",
        â: "a",
        ã: "a",
        ä: "a",
        å: "a",
        Ç: "C",
        ç: "c",
        Ð: "D",
        ð: "d",
        È: "E",
        É: "E",
        Ê: "E",
        Ë: "E",
        è: "e",
        é: "e",
        ê: "e",
        ë: "e",
        Ì: "I",
        Í: "I",
        Î: "I",
        Ï: "I",
        ì: "i",
        í: "i",
        î: "i",
        ï: "i",
        Ñ: "N",
        ñ: "n",
        Ò: "O",
        Ó: "O",
        Ô: "O",
        Õ: "O",
        Ö: "O",
        Ø: "O",
        ò: "o",
        ó: "o",
        ô: "o",
        õ: "o",
        ö: "o",
        ø: "o",
        Ù: "U",
        Ú: "U",
        Û: "U",
        Ü: "U",
        ù: "u",
        ú: "u",
        û: "u",
        ü: "u",
        Ý: "Y",
        ý: "y",
        ÿ: "y",
        Æ: "Ae",
        æ: "ae",
        Þ: "Th",
        þ: "th",
        ß: "ss",
        Ā: "A",
        Ă: "A",
        Ą: "A",
        ā: "a",
        ă: "a",
        ą: "a",
        Ć: "C",
        Ĉ: "C",
        Ċ: "C",
        Č: "C",
        ć: "c",
        ĉ: "c",
        ċ: "c",
        č: "c",
        Ď: "D",
        Đ: "D",
        ď: "d",
        đ: "d",
        Ē: "E",
        Ĕ: "E",
        Ė: "E",
        Ę: "E",
        Ě: "E",
        ē: "e",
        ĕ: "e",
        ė: "e",
        ę: "e",
        ě: "e",
        Ĝ: "G",
        Ğ: "G",
        Ġ: "G",
        Ģ: "G",
        ĝ: "g",
        ğ: "g",
        ġ: "g",
        ģ: "g",
        Ĥ: "H",
        Ħ: "H",
        ĥ: "h",
        ħ: "h",
        Ĩ: "I",
        Ī: "I",
        Ĭ: "I",
        Į: "I",
        İ: "I",
        ĩ: "i",
        ī: "i",
        ĭ: "i",
        į: "i",
        ı: "i",
        Ĵ: "J",
        ĵ: "j",
        Ķ: "K",
        ķ: "k",
        ĸ: "k",
        Ĺ: "L",
        Ļ: "L",
        Ľ: "L",
        Ŀ: "L",
        Ł: "L",
        ĺ: "l",
        ļ: "l",
        ľ: "l",
        ŀ: "l",
        ł: "l",
        Ń: "N",
        Ņ: "N",
        Ň: "N",
        Ŋ: "N",
        ń: "n",
        ņ: "n",
        ň: "n",
        ŋ: "n",
        Ō: "O",
        Ŏ: "O",
        Ő: "O",
        ō: "o",
        ŏ: "o",
        ő: "o",
        Ŕ: "R",
        Ŗ: "R",
        Ř: "R",
        ŕ: "r",
        ŗ: "r",
        ř: "r",
        Ś: "S",
        Ŝ: "S",
        Ş: "S",
        Š: "S",
        ś: "s",
        ŝ: "s",
        ş: "s",
        š: "s",
        Ţ: "T",
        Ť: "T",
        Ŧ: "T",
        ţ: "t",
        ť: "t",
        ŧ: "t",
        Ũ: "U",
        Ū: "U",
        Ŭ: "U",
        Ů: "U",
        Ű: "U",
        Ų: "U",
        ũ: "u",
        ū: "u",
        ŭ: "u",
        ů: "u",
        ű: "u",
        ų: "u",
        Ŵ: "W",
        ŵ: "w",
        Ŷ: "Y",
        ŷ: "y",
        Ÿ: "Y",
        Ź: "Z",
        Ż: "Z",
        Ž: "Z",
        ź: "z",
        ż: "z",
        ž: "z",
        Ĳ: "IJ",
        ĳ: "ij",
        Œ: "Oe",
        œ: "oe",
        ŉ: "'n",
        ſ: "s",
    },
    zi = ki($i),
    ji = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
    Pi = "\\u0300-\\u036f",
    Zi = "\\ufe20-\\ufe2f",
    Gi = "\\u20d0-\\u20ff",
    Hi = Pi + Zi + Gi,
    Wi = "[" + Hi + "]",
    Yi = RegExp(Wi, "g");
function Ki(e) {
    return ((e = Y(e)), e && e.replace(ji, zi).replace(Yi, ""));
}
var qi = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
function Ji(e) {
    return e.match(qi) || [];
}
var Xi = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
function Qi(e) {
    return Xi.test(e);
}
var it = "\\ud800-\\udfff",
    en = "\\u0300-\\u036f",
    tn = "\\ufe20-\\ufe2f",
    nn = "\\u20d0-\\u20ff",
    rn = en + tn + nn,
    nt = "\\u2700-\\u27bf",
    rt = "a-z\\xdf-\\xf6\\xf8-\\xff",
    sn = "\\xac\\xb1\\xd7\\xf7",
    an = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf",
    on = "\\u2000-\\u206f",
    ln =
        " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",
    st = "A-Z\\xc0-\\xd6\\xd8-\\xde",
    un = "\\ufe0e\\ufe0f",
    at = sn + an + on + ln,
    ot = "['’]",
    ge = "[" + at + "]",
    cn = "[" + rn + "]",
    lt = "\\d+",
    dn = "[" + nt + "]",
    ut = "[" + rt + "]",
    ct = "[^" + it + at + lt + nt + rt + st + "]",
    fn = "\\ud83c[\\udffb-\\udfff]",
    mn = "(?:" + cn + "|" + fn + ")",
    pn = "[^" + it + "]",
    dt = "(?:\\ud83c[\\udde6-\\uddff]){2}",
    ft = "[\\ud800-\\udbff][\\udc00-\\udfff]",
    D = "[" + st + "]",
    hn = "\\u200d",
    ye = "(?:" + ut + "|" + ct + ")",
    gn = "(?:" + D + "|" + ct + ")",
    be = "(?:" + ot + "(?:d|ll|m|re|s|t|ve))?",
    Te = "(?:" + ot + "(?:D|LL|M|RE|S|T|VE))?",
    mt = mn + "?",
    pt = "[" + un + "]?",
    yn = "(?:" + hn + "(?:" + [pn, dt, ft].join("|") + ")" + pt + mt + ")*",
    bn = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])",
    Tn = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])",
    xn = pt + mt + yn,
    _n = "(?:" + [dn, dt, ft].join("|") + ")" + xn,
    Fn = RegExp(
        [
            D + "?" + ut + "+" + be + "(?=" + [ge, D, "$"].join("|") + ")",
            gn + "+" + Te + "(?=" + [ge, D + ye, "$"].join("|") + ")",
            D + "?" + ye + "+" + be,
            D + "+" + Te,
            Tn,
            bn,
            lt,
            _n,
        ].join("|"),
        "g"
    );
function In(e) {
    return e.match(Fn) || [];
}
function wn(e, t, i) {
    return ((e = Y(e)), (t = t), t === void 0 ? (Qi(e) ? In(e) : Ji(e)) : e.match(t) || []);
}
var Nn = "['’]",
    vn = RegExp(Nn, "g");
function Sn(e) {
    return function (t) {
        return Li(wn(Ki(t).replace(vn, "")), e, "");
    };
}
var En = Sn(function (e, t, i) {
    return ((t = t.toLowerCase()), e + (i ? Ci(t) : t));
});
const ht = {};
Object.entries(J).forEach(([e, t]) => {
    ht[t] = e;
});
function xe(e) {
    return e && !(e.developer_data_index.rawFieldValue === null || e.developer_data_index.rawFieldValue === 255);
}
function _e(e) {
    const t = {};
    return (
        Object.keys(e).forEach((i) => {
            t[En(i)] = e[i].rawFieldValue;
        }),
        t
    );
}
class Mn {
    constructor() {
        this.definitions = {};
    }
    addDeveloperDataId(t) {
        xe(t) &&
            (this.definitions[t.developer_data_index.rawFieldValue] = {
                ..._e(t),
                fields: [],
            });
    }
    addFieldDescription(t) {
        if (!xe(t)) return;
        const i = this.definitions[t.developer_data_index.rawFieldValue];
        if (!i) return;
        const n = _e(t);
        ((n.fieldType = ht[n.fitBaseTypeId]),
            (n.key = [n.fieldName, n.developerDataIndex, n.fieldDefinitionNumber].join("_")),
            i.fields.push(n));
    }
    lookupDeveloperDataField(t) {
        var r;
        const { developerDataIndex: i, fieldDefinitionNumber: n } = t;
        return (r = this.definitions[i]) == null ? void 0 : r.fields.find((s) => s.fieldDefinitionNumber === n);
    }
    getDefinitions() {
        return Object.values(this.definitions).flatMap((t) => t.fields);
    }
}
class An {
    constructor(t, i) {
        ((this.mesgNum = t), (this.destFieldNum = i), (this.lastValue = 0), (this.accumulatedValue = 0));
    }
    accumulate(t, i) {
        const n = (1 << i) - 1;
        return ((this.accumulatedValue += (t - this.lastValue) & n), (this.lastValue = t), this.accumulatedValue);
    }
    set(t) {
        return ((this.accumulatedValue = t), (this.lastValue = 0), this.accumulatedValue);
    }
}
class Vn {
    constructor() {
        this.accumulatedFields = [];
    }
    getAccumField(t, i) {
        let n = this.accumulatedFields.find((r) => r.mesgNum === t && r.destFieldNum === i);
        return (n || ((n = new An(t, i)), this.accumulatedFields.push(n)), n);
    }
    set(t, i, n) {
        this.getAccumField(t, i).set(n);
    }
    accumulate(t, i, n, r) {
        return this.getAccumField(t, i).accumulate(n, r);
    }
}
Array.prototype.findLastIndex ||
    Object.defineProperty(Array.prototype, "findLastIndex", {
        value(e) {
            if (this == null) throw new TypeError('"this" is null or not defined');
            const t = Object(this),
                i = t.length >>> 0;
            if (typeof e != "function") throw new TypeError("predicate must be a function");
            const n = arguments[1];
            let r = i - 1;
            for (; r >= 0; ) {
                if (e.call(n, t[r], r, t)) return r;
                r--;
            }
            return -1;
        },
    });
function M(e, t) {
    t.flatMap((n) => n.recordIndex.toString().split(",").map(Number)).forEach((n) => {
        e.streamIndex.invalidRecords.add(n);
    });
}
const Dn = 180 / 2 ** 31,
    Bn = new Date().getTimezoneOffset() * 60;
function Rn(e, t) {
    const { fieldType: i, scale: n = 1, offset: r = 0 } = t;
    if (typeof e == "bigint") return (e / BigInt(n) - BigInt(r)).toString();
    const s = e / n - r;
    switch (i) {
        case "float32":
            return s.toPrecision(7);
        case "float64":
            return s.toPrecision(15);
        default: {
            const o = Math.round(Math.log10(n));
            return s.toFixed(o);
        }
    }
}
function $(e, t) {
    const { fieldType: i, units: n, subfields: r, components: s } = t;
    if (Array.isArray(e)) return e.map((u) => $(u, t));
    if (e == null || i === "string" || r || s) return e;
    if (i.endsWith("date_time")) {
        const u = t.fieldType === "local_date_time" ? e + Bn : e;
        return Le(u);
    }
    if (n === "semicircles") return (e * Dn).toFixed(6);
    if (Rt.includes(i)) return Rn(e, t);
    const o = w.types[i];
    if (!o) return e;
    const { bitFlags: l, ...a } = o;
    if (l) {
        const u = [];
        return (
            Object.entries(a).forEach(([f, c]) => {
                const d = Number(f);
                !Number.isNaN(d) && e & d && u.push(c);
            }),
            u
        );
    }
    return o[e] ?? e;
}
function On(e, t, i, n) {
    const r = e.readValue(t, i, n);
    return t === 7 && Array.isArray(r) ? r[0] : r;
}
function Fe(e, t, i, n, r) {
    var y;
    const { fieldDefinitionNumber: s, baseType: o, size: l } = i,
        a = (n == null ? void 0 : n.fieldName) ?? `field ${s}`,
        { endianness: u, globalMessageNumber: f } = t,
        { previousTimestamps: c, timestampOffsets: d } = r,
        g = { fieldName: a, field: n, fieldDefinition: i },
        m = ((y = n == null ? void 0 : n.components) == null ? void 0 : y.length) > 1,
        p = On(e, o, l, { endianness: u, convertInvalidToNull: !m });
    if (Number.isNaN(p)) return { ...g, rawFieldValue: null };
    if (p === 0 && /int\d+z$/.test(n == null ? void 0 : n.fieldType)) return { ...g, rawFieldValue: null };
    if (p == null || !n || n.components || n.subfields) return { ...g, rawFieldValue: p };
    if ((n == null ? void 0 : n.fieldType) === "relative_date_time") {
        f in d || (d[f] = c.any - p);
        const x = p + d[f];
        return { ...g, rawFieldValue: p, absoluteValue: x, fieldValue: $(x, n) };
    }
    return { ...g, rawFieldValue: p, fieldValue: $(p, n) };
}
function Un(e, t) {
    return e === t
        ? !0
        : typeof e == "string" && typeof t == "string"
          ? e.toLowerCase().startsWith(t.toLowerCase())
          : !1;
}
function Cn(e, t, i) {
    const n = (o) => {
            var l;
            return Un((l = t[o.name]) == null ? void 0 : l.fieldValue, o.value);
        },
        r = e.find((o) => o.map.some(n));
    if (!r) return null;
    const s = w.types[r.fieldType];
    return {
        fieldName: r.fieldType,
        field: r,
        fieldValue: (s == null ? void 0 : s[i]) ?? $(i, r),
    };
}
class Ln {
    constructor(t, i = Be.UINT8) {
        this.array = Array.isArray(t) ? t : [t];
        const n = E[i].size;
        ((this.bitPerPosition = n * 8),
            (this.currentArrayPosition = 0),
            (this.bitsAvailable = this.bitPerPosition * this.array.length),
            this.nextByte());
    }
    readBit() {
        if (this.bitsAvailable <= 0) throw new Error("FIT Runtime Error no bits available.");
        this.currentBit >= this.bitPerPosition && this.nextByte();
        const t = this.currentByte & 1;
        return ((this.currentByte >>= 1), this.currentBit++, this.bitsAvailable--, t);
    }
    readBits(t) {
        let i = 0n;
        for (let n = 0n; n < t; n++) i |= BigInt(this.readBit()) << n;
        return Number(i);
    }
    nextByte() {
        if (this.currentArrayPosition >= this.array.length) throw new Error("FIT Runtime Error no bytes available.");
        ((this.currentByte = this.array[this.currentArrayPosition++]), (this.currentBit = 0));
    }
}
function kn(e, t, i, n) {
    const { fields: r, globalMessageNumber: s } = i,
        o = new Ln(e, J[t.fieldType]);
    return t.components
        .map((a) => {
            var j;
            if (o.bitsAvailable <= 0) return null;
            const { fieldDefNumber: u, scale: f, offset: c, units: d, bits: g, accumulate: m } = a,
                p = { ...r[u], scale: f, offset: c, units: d, accumulate: m };
            if (Re(e)) return { fieldName: p.fieldName, field: p, fieldValue: null };
            const y = J[p.fieldType],
                x = (j = E[y]) == null ? void 0 : j.invalid;
            let b = o.readBits(g);
            m && (b = n.accumulate(s, u, b, g));
            const N = x !== void 0 && b === x ? null : $(b, p);
            return { fieldName: p.fieldName, field: p, fieldValue: N };
        })
        .filter(Boolean);
}
const ne = 31,
    $n = 16,
    zn = 128,
    jn = 96,
    Pn = 31,
    Zn = 4294967264,
    Gn = 64,
    Hn = 32,
    gt = 15,
    { developer_data_id: Wn, field_description: Yn } = w.mesgNum,
    Kn = Object.values(ie).find((e) => e.fieldName === "timestamp");
function yt(e, { messageDefinition: t, timestamp: i }) {
    const { stream: n, accumulator: r, developerDataFields: s } = e,
        { messageName: o, fieldDefinitions: l, fields: a, globalMessageNumber: u, developerFieldDefinitions: f } = t,
        c = {};
    (i &&
        Oe.includes(o) &&
        !l.some((m) => m.fieldDefinitionNumber === 253) &&
        (c.timestamp = {
            fieldName: "timestamp",
            rawFieldValue: i,
            fieldValue: Le(i),
            field: Kn,
        }),
        l.forEach((m) => {
            const { fieldDefinitionNumber: p, size: y, baseTypeNumber: x } = m;
            if (y === 0 || x > $n) throw new Error("Invalid size or baseTypeNumber", y, x);
            const b = (a == null ? void 0 : a[p]) || ie[p],
                N = Fe(n, t, m, b, e);
            ((c[N.fieldName] = N),
                N.rawFieldValue !== null && b != null && b.accumulatorField && r.set(u, p, N.rawFieldValue));
        }),
        Object.values(c)
            .filter((m) => {
                var p;
                return m.rawFieldValue !== null && ((p = m.field) == null ? void 0 : p.subfields);
            })
            .forEach((m) => {
                const { fieldName: p, field: y, rawFieldValue: x } = m,
                    b = Cn(y.subfields, c, x);
                b
                    ? ((c[p].fieldValue = b.fieldValue),
                      (c[p].subfield = b.field),
                      b.field.components &&
                          (c[b.fieldName] = {
                              fieldName: b.fieldName,
                              field: b.field,
                              fieldValue: b.fieldValue,
                          }))
                    : (m.fieldValue = x);
            }));
    const d = Object.values(c).filter((m) => {
        var p;
        return (p = m.field) == null ? void 0 : p.components;
    });
    function g(m, p) {
        var b;
        if ((b = m.field) != null && b.components) {
            d.unshift(m);
            return;
        }
        const { fieldName: y } = m,
            x = c[y];
        x ? (p ? (c[y].fieldValue = [c[y].fieldValue, m.fieldValue].flat()) : Object.assign(x, m)) : (c[y] = m);
    }
    for (; d.length > 0; ) {
        const { field: m, rawFieldValue: p, fieldValue: y } = d.shift();
        kn(p ?? y, m, t, r).forEach((b) => g(b, m.array));
    }
    switch (
        (Object.keys(c).forEach((m) => {
            c[m].rawFieldValue === null && delete c[m];
        }),
        f == null ||
            f.forEach((m) => {
                const p = s.lookupDeveloperDataField(m);
                if (p == null) {
                    n.readBytes(m.size);
                    return;
                }
                const y = p.fitBaseTypeId,
                    x = { ...E[y], baseType: y, size: m.size },
                    b = Fe(n, t, x, p, e);
                c[p.key] = b;
            }),
        u)
    ) {
        case Wn:
            s.addDeveloperDataId(c);
            break;
        case Yn:
            s.addFieldDescription(c);
            break;
    }
    return c;
}
function bt(e, t) {
    const i = e == null ? void 0 : e.filter((n) => t in n).map((n) => n[t].rawFieldValue);
    return i != null && i.length ? Math.max(...i) : -1;
}
function qn(e, t) {
    const n = new TextEncoder().encode(e);
    if (n.byteLength > t) throw new Error(`String is too long: ${e}`);
    return W([n, new Uint8Array(t - n.byteLength)]);
}
function Ie(e, t, { baseType: i, size: n, endianness: r }) {
    const s = E[i],
        { invalid: o, size: l } = s,
        a = t[e] ?? o;
    if (i === Be.STRING) return qn(a, n);
    if (n === l) return ce(a, i, r);
    const u = n / l,
        f = [],
        c = a === o;
    for (let g = 0; g < u; g += 1) {
        const m = c ? o : a >> (g * 8);
        f.push(ce(m, i, r));
    }
    return W(f);
}
function Jn(e, t, i, n) {
    const { endianness: r, localMessageType: s, fieldDefinitions: o, developerFieldDefinitions: l } = t,
        a = w.mesgNum[e],
        u = 0 | (s & 15),
        f = [new Uint8Array([u])];
    return (
        o.forEach((c) => {
            const { fieldDefinitionNumber: d, size: g, baseType: m } = c,
                { fieldName: p } = w.messages[a].fields[d] || ie[d] || {},
                y = Ie(p, i, { baseType: m, size: g, endianness: r });
            f.push(y);
        }),
        l == null ||
            l.forEach((c) => {
                const { size: d } = c,
                    g = n.lookupDeveloperDataField(c);
                if (!g) return;
                const { fieldName: m, fitBaseTypeId: p } = g,
                    y = Ie(m, i, { baseType: p, size: d, endianness: r });
                f.push(y);
            }),
        W(f)
    );
}
const Tt = {};
Object.keys(E).forEach((e) => {
    Tt[e & ne] = e;
});
function Xn(e, t) {
    if (E[e]) return e;
    const i = Tt[e & ne];
    if (i) return i;
    throw new Error(`Unknown base type ${e} in field ${t}`);
}
function Qn(e) {
    const t = w.messages[e];
    return t && Ot(t.messageName) && !Ct ? void 0 : t;
}
function xt(e, t) {
    const i = e & gt,
        n = t.readByte();
    if (n !== 0) throw new Error(`Invalid reserved ${n}`);
    const r = t.readByte();
    if (r > 1) throw new Error(`Invalid architecture ${r}`);
    const s = r === 0 ? A.LITTLE_ENDIAN : A.BIG_ENDIAN,
        o = t.readUInt16({ endianness: s }),
        l = Qn(o),
        a = l == null ? void 0 : l.fields,
        u = t.readByte();
    if (u === 0) throw new Error("No fields");
    const f = new Set(),
        c = {},
        d = Array(u)
            .fill()
            .map(() => {
                var b;
                const m = t.readByte();
                if (f.has(m)) {
                    const N = ((b = a == null ? void 0 : a[m]) == null ? void 0 : b.fieldName) || `field ${m}`;
                    c[m] = `Duplicate field definition: ${N}`;
                }
                f.add(m);
                const p = t.readByte();
                if (!p) throw new Error(`Invalid size for field ${m}`);
                const y = Xn(t.readByte(), m),
                    x = y & ne;
                return {
                    fieldDefinitionNumber: m,
                    size: p,
                    baseType: y,
                    baseTypeNumber: x,
                };
            }),
        g = {
            localMessageType: i,
            reserved: n,
            architecture: r,
            endianness: s,
            globalMessageNumber: o,
            numberOfFields: u,
            fieldDefinitions: d,
            warnings: c,
        };
    if (e & Hn) {
        const m = t.readByte();
        g.developerFieldDefinitions = Array(m)
            .fill()
            .map(() => {
                const p = t.readByte(),
                    y = t.readByte(),
                    x = t.readByte();
                return { fieldDefinitionNumber: p, size: y, developerDataIndex: x };
            });
    }
    return (
        a &&
            Object.values(a).forEach((m) => {
                var p;
                (p = m.components) == null ||
                    p
                        .filter((y) => y.accumulate)
                        .forEach((y) => {
                            a[y.fieldDefNumber].accumulatorField = !0;
                        });
            }),
        Object.assign(g, l || { messageName: `mesg ${o}` }),
        g
    );
}
function _t(e, t) {
    if (!e) return t;
    const i = new Set(e.fieldDefinitions.map((s) => s.fieldDefinitionNumber)),
        n = [...e.fieldDefinitions, ...t.fieldDefinitions.filter((s) => !i.has(s.fieldDefinitionNumber))];
    return {
        ...e,
        recordIndex: `${e.recordIndex},${t.recordIndex}`,
        fieldDefinitions: n,
    };
}
const er = {
        type: 0,
        manufacturer: 132,
        time_created: 134,
        timestamp: 134,
        message_index: 132,
        num_sessions: 132,
        local_timestamp: 134,
        start_time: 134,
        total_elapsed_time: 134,
        total_timer_time: 134,
        total_distance: 134,
        start_position_lat: 133,
        start_position_long: 133,
        end_position_lat: 133,
        end_position_long: 133,
        sport: 0,
        sub_sport: 0,
    },
    Ft = {
        file_id: [0, 1, 4],
        activity: [253, 0, 1, 5],
        session: [253, 254, 2, 3, 4, 5, 6, 7, 8, 9],
        lap: [253, 254, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    we = ["start_time", "total_timer_time", "total_elapsed_time", "timestamp"],
    re = {
        lap: we,
        session: we,
        activity: ["timestamp", "num_sessions"],
        split_summary: [],
    };
function tr(e) {
    var i;
    const t = re[e];
    return (i = Ft[e]) == null
        ? void 0
        : i.filter((n) => {
              const { fieldName: r } = w.messages[w.mesgNum[e]].fields[n];
              return t.includes(r);
          });
}
function ir(e, t) {
    if (!(e in t)) return !1;
    const i = tr(e) || [],
        {
            messageDefinition: { fieldDefinitions: n },
        } = t[e],
        r = n.map((s) => s.fieldDefinitionNumber);
    return i.every((s) => r.includes(s));
}
function nr(e, { messageNumbers: t, definitions: i, repairDefinitions: n }) {
    var g;
    const r = w.mesgNum[e];
    if (ir(e, n)) return n[e];
    const s = Ft[e],
        o =
            (g = n[e]) == null
                ? void 0
                : g.messageDefinition.fieldDefinitions.filter(({ fieldDefinitionNumber: m }) => !s.includes(m)),
        a =
            64 |
            ((Object.values(i)
                .map((m) => m.localMessageType)
                .pop() +
                1) &
                15 &
                15),
        u = [new Uint8Array([a, 0, 0])];
    (u.push(new Uint16Array([r])),
        u.push(new Uint8Array([s.length + ((o == null ? void 0 : o.length) || 0)])),
        s.forEach((m) => {
            const { fieldName: p } = w.messages[r].fields[m],
                y = er[p],
                { size: x } = E[y];
            u.push(new Uint8Array([m, x, y]));
        }),
        o == null ||
            o.forEach(({ fieldDefinitionNumber: m, size: p, baseType: y }) => {
                u.push(new Uint8Array([m, p, y]));
            }));
    const f = W(u),
        c = A.fromByteArray(f),
        d = xt(c.readByte(), c);
    return (
        t.includes(r) ? (i[r] = _t(i[r], d)) : ((i[r] = d), r === 0 ? t.unshift(r) : t.push(r)),
        { messageDefinition: d, definitionRecord: f }
    );
}
function z(e, t, i) {
    const { messages: n, developerDataFields: r, streamIndex: s } = i,
        o = e === "file_id" ? s.fileIdRecords : s.newRecords,
        { messageDefinition: l, definitionRecord: a } = nr(e, i);
    (o.push(a),
        t.forEach((u) => {
            const f = Jn(e, l, u, r);
            o.push(f);
            const c = A.fromByteArray(f);
            c.readByte();
            const d = yt({ ...i, stream: c }, { messageDefinition: l, developerDataFields: r });
            _(n, e).push(d);
        }));
}
const rr = [
        "num_splits",
        "total_timer_time",
        "total_distance",
        "avg_speed",
        "max_speed",
        "total_ascent",
        "total_descent",
        "avg_heart_rate",
        "max_heart_rate",
        "avg_vert_speed",
        "total_calories",
        "total_moving_time",
    ],
    It = (e, t) =>
        e.map((i) => {
            var n;
            return (n = i[t]) == null ? void 0 : n.rawFieldValue;
        }),
    wt = (e) => e !== void 0;
function sr(e) {
    const t = It(e, "total_timer_time").filter(wt),
        i = e.length;
    if (t.length < i) return Array(i).fill(1 / i);
    const n = t.reduce((r, s) => r + s, 0);
    return t.map((r) => r / n);
}
function ar(e, t, i, { weights: n, prefix: r }) {
    if (t === void 0) return e;
    switch (r) {
        case "avg":
            return e + t * n[i];
        case "max":
            return Math.max(e, t);
        default:
            return e + t;
    }
}
function or(e, t, i) {
    const n = t.split("_")[0],
        r = It(e, t);
    if (r.filter(wt).length !== 0) return Math.round(r.reduce((s, o, l) => ar(s, o, l, { weights: i, prefix: n }), 0));
}
function lr(e) {
    const { messages: t, issues: i } = e,
        n = _(t, "split_summary");
    if (!(n != null && n.length)) return;
    const r = {};
    n.forEach((a) => {
        const u = a.split_type.rawFieldValue;
        (r[u] || (r[u] = []), r[u].push(a));
    });
    const s = Object.keys(r)
        .filter((a) => r[a].length > 1)
        .map(Number);
    if (s.length === 0) return;
    let o = n
        .filter((a) => !s.includes(a.split_type.rawFieldValue))
        .reduce((a, u) => Math.max(a, u.message_index.rawFieldValue) + 1, 0);
    const l = s.map((a) => {
        const u = {
                timestamp: r[a][0].timestamp.rawFieldValue,
                message_index: o++,
                split_type: a,
            },
            f = r[a];
        M(e, f);
        const c = sr(f);
        return (
            rr.forEach((d) => {
                const g = or(f, d, c);
                g !== void 0 && (u[d] = g);
            }),
            u
        );
    });
    (i.push({
        type: "repair",
        message: "There are duplicate split summary messages",
        description:
            "Duplicate messages are marked in red, new messages are added and displayed in blue in the tables below.",
    }),
        z("split_summary", l, e));
}
function ur(e, { startTime: t }) {
    const i = "file_id",
        n = w.types.file,
        r = Number(Object.keys(n).find((u) => n[u] === "activity")),
        { messages: s, messageNumbers: o } = e,
        l = { type: r, manufacturer: E[132].invalid, time_created: t },
        a = w.mesgNum[i];
    return (a in s || ((s[a] = []), o.unshift(a)), z(i, [l], e));
}
function cr(e, t) {
    const { messages: i, fileType: n, issues: r } = e;
    if (n) return;
    const s = _(i, "file_id", !0);
    (s.length && M(e, s),
        !n &&
            (n ||
                (ur(e, t),
                r.push({
                    type: "repair",
                    message: "The file_id message is missing",
                    description:
                        "This is required to determine the type of the file. It has been added, assuming this is an activity file.",
                }))));
}
function dr(e) {
    const t = e
        .map((i) => {
            var n;
            return (n = i.distance) == null ? void 0 : n.rawFieldValue;
        })
        .filter(Boolean);
    return t.length < 2 ? null : t[t.length - 1] - t[0];
}
function fr(e) {
    const t = e.find((i) => i.position_lat && i.position_long);
    return t
        ? {
              start_position_lat: t.position_lat.rawFieldValue,
              start_position_long: t.position_long.rawFieldValue,
          }
        : {};
}
function mr(e) {
    const t = e
        .slice()
        .reverse()
        .find((i) => i.position_lat && i.position_long);
    return t
        ? {
              end_position_lat: t.position_lat.rawFieldValue,
              end_position_long: t.position_long.rawFieldValue,
          }
        : {};
}
function pr(e, t) {
    const i = e.filter((s) => {
            var o;
            return ((o = s.timestamp) == null ? void 0 : o.rawFieldValue) >= t;
        }),
        n = fr(i),
        r = mr(i);
    return { total_distance: dr(i), ...n, ...r };
}
function hr(e, t, i) {
    const n = _(e, "event"),
        r =
            n == null
                ? void 0
                : n.filter((l) => {
                      var a;
                      return l.timestamp && ((a = l.event) == null ? void 0 : a.fieldValue) === "timer";
                  });
    if (!(r != null && r.length)) return (i - t) * 1e3;
    let s = 0,
        o = 0;
    return (
        r.forEach((l) => {
            var u, f;
            const a = l.timestamp.rawFieldValue;
            if (a >= i) {
                s && ((o += i - s), (s = 0));
                return;
            }
            (l.event_type.fieldValue === "start" && (s = Math.max(a, t)),
                (f = (u = l.event_type.fieldValue).startsWith) != null &&
                    f.call(u, "stop") &&
                    s &&
                    a >= t &&
                    ((o += Math.min(a, i) - s), (s = 0)));
        }),
        s && s >= t && s < i && (o += i - s),
        o * 1e3
    );
}
function se(e, t, i) {
    const n = _(t, e),
        r = n[n.length - 1];
    if (!r || !i.has(r.recordIndex)) return {};
    const s = {};
    return (
        Object.entries(r).forEach(([o, l]) => {
            o !== "recordIndex" && (s[o] = l.rawFieldValue);
        }),
        s
    );
}
function gr(e, { startTime: t, endTime: i }) {
    var f;
    const n = "lap",
        {
            messages: r,
            mergedRecords: s,
            streamIndex: { invalidRecords: o },
        } = e,
        l = se(n, r, o),
        a = {
            timestamp: i,
            ...l,
            ...pr(s, t),
            start_time: t,
            total_elapsed_time: (i - t) * 1e3,
            total_timer_time: hr(r, t, i),
        },
        u = (f = _(r, n)) == null ? void 0 : f.filter((c) => !o.has(c.recordIndex));
    return (u != null && u.length && (a.message_index = bt(u, "message_index") + 1), z(n, [a], e));
}
function Z(e) {
    const {
        streamIndex: { invalidRecords: t, newRecords: i },
    } = e;
    return t.size + i.length;
}
function G(e) {
    if (!(!(e != null && e.start_time) || Re(e.total_elapsed_time)))
        return e.start_time.rawFieldValue + e.total_elapsed_time.rawFieldValue / 1e3;
}
function yr(e, t) {
    return re[t].every((n) => {
        var r;
        return (r = e[n]) == null ? void 0 : r.rawFieldValue;
    });
}
function br(e, t) {
    const i = e.findIndex((n) => G(n) >= t);
    return i < 0 ? e.length : i;
}
function Nt(e, t, { startTime: i, endTime: n }) {
    const { messages: r } = t,
        s = _(r, e, !0),
        o = br(s, i);
    o > 0 && M(t, s.slice(0, o));
    let l, a;
    const u = s.slice(o),
        f = u.map((d) => {
            var g;
            return (g = d.start_time) == null ? void 0 : g.rawFieldValue;
        }),
        c = u.findIndex((d, g) => {
            if (!yr(d, e) || d.start_time.rawFieldValue < i - 10) return !0;
            if (l) {
                const p = f.findIndex((y) => y === d.start_time.rawFieldValue);
                p < g && M(t, u.slice(p, g));
            }
            const m = G(d);
            return ((a = n - m), a < -300 ? !0 : ((l = d), !1));
        });
    return (c >= 0 && M(t, u.slice(c)), { currentMessages: s, lastEndTime: G(l), lastMessage: l });
}
function Tr(e, { startTime: t, endTime: i }) {
    const { issues: n } = e,
        r = Z(e),
        { lastEndTime: s } = Nt("lap", e, { startTime: t, endTime: i });
    ((!s || s < i - 10) && gr(e, { startTime: s ?? t, endTime: i }),
        Z(e) > r &&
            n.push({
                type: "repair",
                message: "Some lap messages are missing or invalid",
                description:
                    "Invalid messages are marked in red, missing messages are added and displayed in blue in the tables below.",
            }));
}
const Ne = (e, t) =>
        e.reduce((i, n) => {
            var r;
            return i + (((r = n[t]) == null ? void 0 : r.rawFieldValue) ?? 0);
        }, 0),
    ve = (e, t) => {
        var i;
        return (i = e.find((n) => {
            var r;
            return (r = n[t]) == null ? void 0 : r.rawFieldValue;
        })) == null
            ? void 0
            : i[t].rawFieldValue;
    },
    Se = (e, t) => {
        var i;
        return (i = e
            .slice(0)
            .reverse()
            .find((n) => {
                var r;
                return (r = n[t]) == null ? void 0 : r.rawFieldValue;
            })) == null
            ? void 0
            : i[t].rawFieldValue;
    };
function xr(e, t, i) {
    var o, l, a;
    if (e.sport)
        return {
            sport: e.sport.rawFieldValue,
            sub_sport: (o = e.sub_sport) == null ? void 0 : o.rawFieldValue,
        };
    const n = _(t, "sport"),
        r = _(t, "session").filter((u) => !i.has(u.recordIndex)).length,
        s = n && (n[r] ?? n.at(-1));
    return s
        ? {
              sport: (l = s.sport) == null ? void 0 : l.rawFieldValue,
              sub_sport: (a = s.sub_sport) == null ? void 0 : a.rawFieldValue,
          }
        : {};
}
function Ee(e, t) {
    const i = "session",
        {
            messages: n,
            streamIndex: { invalidRecords: r },
        } = e,
        { laps: s, startTime: o, endTime: l } = t,
        a = s.at(-1),
        u = {
            timestamp: l,
            ...xr(a, n, r),
            total_distance: Ne(s, "total_distance"),
            ...se(i, n, r),
            start_position_lat: ve(s, "start_position_lat"),
            start_position_long: ve(s, "start_position_long"),
            end_position_lat: Se(s, "end_position_lat"),
            end_position_long: Se(s, "end_position_long"),
            start_time: o,
            total_elapsed_time: (l - o) * 1e3,
            total_timer_time: Ne(s, "total_timer_time"),
        },
        f = _(n, i).filter((c) => !r.has(c.recordIndex)) || [];
    return (f.length && (u.message_index = bt(f, "message_index") + 1), z(i, [u], e));
}
function Me(e, t, i) {
    if (!(!t[e] || !i[e])) return t[e].rawFieldValue === i[e].rawFieldValue;
}
function Ae(e, t) {
    return Me("sport", e, t) && Me("sub_sport", e, t);
}
function _r(e, t, i) {
    var c;
    const { startTime: n, endTime: r, lastMessage: s, lastEndTime: o } = i;
    let l = o ?? n,
        a = t.findIndex((d) => {
            var g;
            return ((g = d.start_time) == null ? void 0 : g.rawFieldValue) >= l - 1;
        });
    (a < 0 && (a = t.length - 1),
        s &&
            Ae(s, t[a]) !== !1 &&
            (M(e, [s]),
            (l = s.start_time.rawFieldValue),
            (a = t.findIndex((d) => d.start_time.rawFieldValue >= l - 1))));
    const u = [];
    let f = t[a];
    for (; a < t.length; ) {
        const d = t[a++];
        (Ae(f, d) === !1 &&
            (u.length && Ee(e, { startTime: l, endTime: G(d), laps: u }),
            (l = (c = t[a]) == null ? void 0 : c.start_time.rawFieldValue),
            (u.laps = []),
            (f = d)),
            u.push(d));
    }
    Ee(e, { startTime: l, endTime: r, laps: u });
}
function Fr(e, { startTime: t, endTime: i }) {
    const {
            issues: n,
            messages: r,
            streamIndex: { invalidRecords: s },
        } = e,
        o = Z(e),
        { lastMessage: l, lastEndTime: a } = Nt("session", e, {
            startTime: t,
            endTime: i,
        }),
        u = _(r, "lap").filter((f) => !s.has(f.recordIndex));
    ((!a || a < i - 10) && _r(e, u, { startTime: t, endTime: i, lastMessage: l, lastEndTime: a }),
        Z(e) > o &&
            n.push({
                type: "repair",
                message: "Some session messages are missing or invalid",
                description:
                    "Invalid messages are marked in red, missing messages are added and displayed in blue in the tables below.",
            }));
}
function Ir(e, t) {
    var n;
    if (t.timestamp && t.local_timestamp) return t.local_timestamp - t.timestamp;
    const i = (n = _(e, "device_settings")) == null ? void 0 : n[0];
    return i != null && i.time_offset ? i.time_offset.rawFieldValue : new Date().getTimezoneOffset() * 60;
}
function wr(e, { endTime: t }) {
    const i = "activity",
        {
            messages: n,
            streamIndex: { invalidRecords: r },
        } = e,
        s = _(n, "session").filter((u) => u.total_timer_time && !r.has(u.recordIndex)),
        o = se(i, n, r),
        l = Ir(n, o),
        a = {
            timestamp: t,
            local_timestamp: t + l,
            ...o,
            num_sessions: s.length,
            total_timer_time: s.reduce((u, f) => u + f.total_timer_time.rawFieldValue, 0),
        };
    return z(i, [a], e);
}
const Nr = re.activity;
function vr(e, t, i) {
    if (
        Nr.some((o) => {
            var l;
            return !((l = e[o]) != null && l.rawFieldValue);
        })
    )
        return !1;
    const n = _(t, "session").filter((o) => !i.has(o.recordIndex));
    if (n.length !== e.num_sessions.rawFieldValue) return !1;
    if (!e.total_timer_time) return !0;
    const s = n.reduce((o, l) => o + l.total_timer_time.rawFieldValue, 0) - e.total_timer_time.rawFieldValue;
    return Math.abs(s) < 1e4;
}
function Sr(e, t) {
    const i = "activity",
        {
            messages: n,
            issues: r,
            streamIndex: { invalidRecords: s },
        } = e,
        o = _(n, i, !0);
    let l = !1;
    o.length > 1 && ((l = !0), M(e, o.slice(0, -1)));
    const a = o[o.length - 1],
        u = a && !vr(a, n, s);
    (u && s.add(a.recordIndex),
        (!a || u) && ((l = !0), wr(e, t)),
        l &&
            r.push({
                type: "repair",
                message: "The activity message is invalid or a valid activity messages is missing",
                description:
                    "Invalid messages are marked in red, missing messages are added and displayed in blue in the tables below.",
            }));
}
const Er = !1;
function Mr(e) {
    var i, n;
    const { fileType: t } = e;
    if (!(t && t !== "activity"))
        try {
            const r = e.mergedRecords;
            if (!(r != null && r.length)) return;
            const s = (i = r.at(0)) == null ? void 0 : i.timestamp.rawFieldValue,
                o = (n = r.at(-1)) == null ? void 0 : n.timestamp.rawFieldValue,
                l = { startTime: s, endTime: o };
            (cr(e, l), lr(e), Tr(e, l), Fr(e, l), Sr(e, l));
        } catch (r) {
            if (L) throw r;
            (console.error("Error repairing messages:", r), Ce(r));
        }
}
const Ve = 0.25,
    Ar = 5,
    ee = w.messages[w.mesgNum.record].fields,
    te = Number(Object.keys(ee).find((e) => ee[e].fieldName === "heart_rate")),
    Vr = ee[te];
function Dr(e) {
    let t, i;
    return e
        .flatMap((r) => {
            try {
                const {
                        timestamp: s,
                        fractional_timestamp: { fieldValue: o } = {},
                        filtered_bpm: { rawFieldValue: l } = {},
                        event_timestamp: { fieldValue: a } = {},
                    } = r,
                    u = Array.isArray(l);
                if (s) {
                    if (u) throw new Error("HR mesg with multiple filtered bpm");
                    return (
                        (t = s.rawFieldValue - Number(a)),
                        { timestamp: s.rawFieldValue + Number(o), heartRate: l }
                    );
                }
                if (!u) throw new Error("HR mesg with single filtered bpm");
                const f = a.map(Number);
                if (f.length !== l.length) throw new Error("HR mesg with mismatching event timestamp and filtered bpm");
                return l.flatMap((c, d) => ({ timestamp: t + f[d], heartRate: c }));
            } catch {
                return [];
            }
        })
        .flatMap((r, s) => {
            if (s === 0) return ((i = r), r);
            const o = [],
                l = i.timestamp + Ve,
                a = Math.min(i.timestamp + Ar, r.timestamp);
            for (let u = l; u < a; u += Ve) {
                const f = { timestamp: u, heartRate: i.heartRate };
                o.push(f);
            }
            return ((i = r), o.push(r), o);
        });
}
function Br(e, t) {
    var l;
    let i = !1;
    const n = _(e, "hr"),
        r = (l = _(e, "record")) == null ? void 0 : l.filter((a) => a.timestamp);
    if (!n || !r) return !1;
    const s = Dr(n);
    let o = s.findIndex((a) => a.timestamp > r[0].timestamp.rawFieldValue - 1);
    if (
        (r.forEach((a) => {
            var c;
            let u = 0,
                f = 0;
            for (; ((c = s[o]) == null ? void 0 : c.timestamp) < a.timestamp.rawFieldValue; )
                ((u += s[o].heartRate), f++, o++);
            if (f) {
                i = !0;
                const d = (u / f).toFixed(0);
                a.heart_rate ? (a.heart_rate.fieldValue = d) : (a.heart_rate = { field: Vr, fieldValue: d });
            }
        }),
        i)
    ) {
        const a = t[w.mesgNum.record],
            { fieldDefinitions: u } = a;
        if (u.every((f) => f.fieldDefinitionNumber !== te)) {
            const f = {
                fieldDefinitionNumber: te,
                size: 1,
                baseType: 2,
                baseTypeNumber: 2,
            };
            u.push(f);
        }
    }
    return i;
}
function vt(e) {
    return e
        .map((t) => {
            const { position_lat: i, position_long: n } = t;
            return !i || !n ? null : { coordinates: [i.fieldValue, n.fieldValue].map(Number), msg: t };
        })
        .filter(Boolean);
}
function Rr(e) {
    const t = _(e, "location") ?? [],
        i = _(e, "course_point") ?? [],
        n = _(e, "hole") ?? [],
        r = vt([...t, ...i, ...n]).map((s, o) => ({ ...s, key: `wp_${o}` }));
    return (r == null ? void 0 : r.length) > 0 ? r : null;
}
function Or(e, t) {
    const i = t && vt(t);
    return (i == null ? void 0 : i.length) > 0 ? i : null;
}
function Ur(e) {
    var i;
    const t =
        (i = _(e, "shot")) == null
            ? void 0
            : i.map((n) => ({
                  coordinates: [
                      [n.start_position_long.fieldValue, n.start_position_lat.fieldValue].map(Number),
                      [n.end_position_long.fieldValue, n.end_position_lat.fieldValue].map(Number),
                  ],
                  msg: n,
              }));
    return (t == null ? void 0 : t.length) > 0 ? t : null;
}
function Cr(e, t) {
    var n;
    const i =
        (n = _(e, "lap")) == null
            ? void 0
            : n
                  .filter((r) => !t.has(r.recordIndex))
                  .slice(1)
                  .filter((r) => {
                      var s;
                      return (
                          ((s = r.lapTrigger) == null ? void 0 : s.fieldValue) !== "aaamanual" &&
                          r.start_position_lat &&
                          r.start_position_long
                      );
                  })
                  .map((r, s) => ({
                      coordinates: [r.start_position_lat.fieldValue, r.start_position_long.fieldValue].map(Number),
                      msg: r,
                      key: `lap_${s}`,
                  }));
    return (i == null ? void 0 : i.length) > 0 ? i : null;
}
function Lr(e, t) {
    var o;
    const i = (o = _(e, "session")) == null ? void 0 : o.filter((l) => l.start_time && l.total_elapsed_time);
    if (!(i != null && i.length)) return null;
    let n = 0,
        r = i[0].start_time.rawFieldValue + i[0].total_elapsed_time.rawFieldValue;
    const s = i.slice(1).map((l) => {
        var f;
        const a = ((f = l.start_time) == null ? void 0 : f.rawFieldValue) ?? r,
            u = t.slice(n).findIndex((c) => c.msg.timestamp.rawFieldValue >= a);
        return ((n += u), (r += l.total_elapsed_time.rawFieldValue), n);
    });
    return (s.push(t.length), s.map((l, a) => ({ positionRange: [a === 0 ? 0 : s[a - 1], l], msg: i[a] })));
}
function kr(e) {
    const {
        messages: t,
        mergedRecords: i,
        streamIndex: { invalidRecords: n },
    } = e;
    try {
        const r = Rr(t),
            s = Cr(t, n),
            o = Or(t, i),
            l = Ur(t),
            a = o ? Lr(t, o) : null;
        return r || o || l || s ? { waypoints: r, positions: o, sessions: a, lines: l, laps: s } : null;
    } catch (r) {
        if ((Ce(r), L)) throw r;
        return (console.error(r), null);
    }
}
const $r = new TextDecoder("utf-8");
function zr(e) {
    const t = {};
    return (
        Object.entries(e).forEach(([i, n]) => {
            typeof n == "object" && (t[i] = n.rawFieldValue);
        }),
        t
    );
}
const jr = (e) => {
    const t = Object.keys(e)
            .map(Number)
            .sort((n, r) => n - r),
        i = new Uint8Array(t.flatMap((n) => e[n]));
    return $r.decode(i);
};
function Pr(e) {
    const t = _(e, "memo_glob");
    if (!t) return;
    const i = t.map(zr),
        n = {};
    (i.forEach((r) => {
        const { data: s, field_num: o, mesg_num: l, parent_index: a, part_index: u } = r,
            f = [l, a, o].join("-");
        (n[f] || (n[f] = { mesg_num: l, parent_index: a, field_num: o, data: {} }), (n[f].data[u] = s));
    }),
        Object.values(n).forEach(({ mesg_num: r, parent_index: s, field_num: o, data: l }) => {
            var c;
            const a = jr(l),
                u = (c = e[r]) == null ? void 0 : c[s];
            if (!u) return;
            const f = Object.values(u).find((d) => {
                var g;
                return ((g = d.fieldDefinition) == null ? void 0 : g.fieldDefinitionNumber) === o;
            });
            ((f.memo = a),
                t.forEach((d) => {
                    d.parent_index.rawFieldValue === s && d.field_num.rawFieldValue === o && (d.data.memo = a);
                }));
        }));
}
function Zr({ type: e, messageDefinition: t, message: i }) {
    return !1;
}
class Gr {
    constructor(t) {
        ((this.state = t),
            (this.stream = t.stream),
            (this.debugStack = []),
            (this.debugSize = 10),
            (this.debugShowCount = 0));
    }
    show() {
        if (
            L ||
            this.debugShowCount > 3 ||
            ((this.debugShowCount += 1),
            this.debugStack.forEach((r) => {
                const s = de(r.bytes.slice(0, 8));
                console.log(r.recordIndex, s, r.type, r.messageName);
            }),
            this.debugStack.splice(0, this.debugStack.length),
            this.debugShowCount > 1 && this.debugStack.length < this.debugSize)
        )
            return;
        const t = this.stream.position,
            i = this.stream.length - t,
            n = Math.min(i, 512);
        (console.log("Remaining", i.toLocaleString()), console.log(de(this.stream.readBytes(n))), this.stream.seek(t));
    }
    log(t) {
        if (!ue) return;
        const i = this.stream.position;
        this.stream.seek(this.state.recoverPosition - 1);
        const n = this.stream.readBytes(i - this.stream.position);
        (this.debugStack.push({
            bytes: n,
            recordIndex: this.state.indices.record,
            ...t,
        }),
            this.debugStack.length > this.debugSize && this.debugStack.shift());
    }
    report(t) {
        const { type: i, ...n } = t;
        if (!ue || L) return;
        n.recordHeader = n.recordHeader.toString(2).padStart(8, "0");
        const { messageName: r } = t.messageDefinition ?? t.message;
        (this.log({ type: i, messageName: r }),
            Zr(t) && console.log(this.state.indices.record, i, this.stream.position, r, n));
    }
}
async function Hr(e, t, i, n, r = 50) {
    function s() {
        const o = Date.now() + r;
        return new Promise((l, a) => {
            setTimeout(() => {
                for (; t() && Date.now() < o; )
                    try {
                        e();
                    } catch (u) {
                        n ? n(u) : a(u);
                    }
                (i && i(), l());
            }, 0);
        });
    }
    for (; t(); ) await s();
}
function Wr(e, t, i) {
    const n = i.headerSize + i.dataSize,
        r = e.length - t;
    if (r > n + P && i.dataSize === 0) {
        const l = new Error("The file is invalid");
        throw (
            (l.description =
                "This may happen when the file was written before the activity was completed, e.g. because the battery died or the app crashed."),
            l
        );
    }
    if (r < n + P) {
        const l = new Error("The file is too short"),
            a = (n + P).toLocaleString(),
            u = r.toLocaleString();
        throw (
            (l.description = `Expected ${a} bytes, got ${u} bytes. The file was probably truncated while downloading or copying.`),
            l
        );
    }
    const [s] = new Uint16Array(e.slice(t + n, t + n + 2)),
        o = ke(e.slice(t, t + n));
    if (s !== o) {
        const l = new Error("Invalid file CRC");
        throw (
            (l.description = `Expected ${le(o)}, got ${le(
                s
            )}. This may happen when something went wrong while downloading or copying the file.`),
            l
        );
    }
}
function Yr(e) {
    const t = e.position,
        i = e.peekByte();
    if (![14, 12].includes(i)) throw new Error(`Invalid file header size ${i}`);
    if (e.length - t < i + P) throw new Error("Invalid file size");
    const n = {
        headerSize: e.readByte(),
        protocolVersion: e.readByte(),
        profileVersion: e.readUInt16(),
        dataSize: e.readUInt32(),
        dataType: e.readString(4),
        headerCRC: 0,
    };
    if (n.dataType !== ".FIT") throw new Error("Invalid file type");
    if (
        n.headerSize === 14 &&
        ((n.headerCRC = e.readUInt16()), n.headerCRC !== 0 && n.headerCRC !== ke(e.slice(t, t + 12)))
    )
        throw new Error("Invalid header CRC");
    return n;
}
function Kr(e) {
    const { stream: t, streamIndex: i } = e,
        n = t.position;
    let r = t.length - n,
        s = !1,
        o = null;
    try {
        o = Yr(t);
        const { headerSize: l, dataSize: a } = o;
        ((o.index = ++e.indices.file),
            (i.files[e.indices.file] = { start: n, end: t.position, records: {} }),
            e.fileHeaders.push(o),
            a && l + a <= r && ((s = !0), (r = l + a)),
            Wr(t, n, o));
    } catch (l) {
        if (!o) {
            if (n === 0) throw l;
            ((e.recovering = !0), (e.hadErrors = !0), (e.timeMargins = 2), (e.recoveryPosition = n));
        }
        (L || console.error("Error fileHeader/checkFile", l), e.issues.push(l));
    }
    return { withCRC: s, maxPos: n + r };
}
const qr = 50;
async function Jr(e, { stopRef: t, handleRecord: i, handleError: n, handleProgress: r }) {
    const { stream: s } = e,
        { withCRC: o, maxPos: l } = Kr(e);
    function a() {
        return s.position < l && !(t != null && t.current);
    }
    for (; a(); ) await Hr(i, a, r, n, qr);
    (o && s.readUInt16(), r());
}
function Xr(e, t) {
    const { insertedTimeStamps: i, previousTimestamps: n } = e;
    if (!Oe.includes(t)) return;
    const r = i[t] >= n.any ? i[t] + 1 : n.any;
    return ((i[t] = r), r);
}
function St(e, t) {
    const { streamIndex: i, stream: n, indices: r, recordStart: s } = e;
    ((t.recordIndex = ++r.record),
        (t.fileIndex = r.file),
        (i.files[r.file].records[e.indices.record] = { start: s, end: n.position }));
}
const Qr = 10 * 365 * k,
    es = Math.floor(Date.now() / 1e3 - Ue) + 5 * 365 * k;
function ts(e, t) {
    var n;
    return ((((n = e[t]) == null ? void 0 : n.length) || 0) + 10) * 10;
}
function De(e, t) {
    return e ? (t ? e >= t && e <= t + k : e > Qr && e < es) : !1;
}
function is(e, { message: t, messageDefinition: i }) {
    const { timestamp: n, message_index: r } = t,
        { rawFieldValue: s, fieldValue: o } = n || {},
        { messages: l, previousTimestamps: a, timestampOffsets: u, fileType: f = "activity", recovering: c } = e,
        { messageName: d, globalMessageNumber: g } = i;
    if (
        (d === "file_id" &&
            ((e.fileType = t.type.fieldValue),
            e.fileType === "activity" && (e.time_created = t.time_created.rawFieldValue)),
        f === "activity")
    ) {
        switch (d) {
            case "lap":
            case "session":
                if (!n) throw new Error(`Missing timestamp for ${d}`);
                if (e.time_created && Math.abs(s - e.time_created) > 10 * k)
                    throw new Error(`Invalid ${d} timestamp: ${o == null ? void 0 : o.toLocaleString()}`);
                break;
            case "event":
            case "record":
                if (c && !n) throw new Error(`Missing timestamp for ${d}`);
                if (n) {
                    if (!De(s, a[d]))
                        throw new Error(`Invalid ${d} timestamp: ${o == null ? void 0 : o.toLocaleString()}`);
                    ((a[d] = s), (a.any = s));
                }
                t.unixTimestamp = a[d] + Ue;
                break;
        }
        if (n) {
            const {
                field: { fieldType: m },
            } = n;
            if (m === "relative_date_time") {
                const p = u[g];
                if (s - p > 0.1 * k) throw new Error(`Invalid relative ${d} timestamp: ${s}`);
            } else if (!De(s)) throw new Error(`Invalid ${d} timestamp: ${o.toLocaleString()}`);
        }
        if ((r == null ? void 0 : r.rawFieldValue) > ts(l, g)) throw new Error("Invalid message index");
    }
}
const ns = ["file_id", "file_creator", "activity"],
    rs = ["record", "event", "session"];
function Et(e, { localMessageType: t, timestamp: i, recordHeader: n }) {
    const {
            messages: r,
            hadErrors: s,
            index: o,
            devErrors: l,
            localMessageTypes: a,
            fileType: u,
            recovering: f,
            recoverPosition: c,
        } = e,
        d = a[t];
    if (!d) throw new Error(`Unknown message type ${t}`);
    const { globalMessageNumber: g, messageName: m } = d,
        p = u === "activity" ? rs.includes(m) : "fields" in d;
    if (f && !p) throw new Error(`Cannot recover with message type ${m}`);
    const y = r[g];
    if (y.length > 0 && ns.includes(m)) {
        const N = new Error(`Unexpected message type ${m}`);
        if (s || g === 0) throw new Error(`Cannot add multiple messages of type ${m}`);
        ((N.record = o + 1), (N.position = c), l.push(N));
    }
    const x = i || Xr(e, m),
        b = yt(e, { messageDefinition: d, timestamp: x });
    return (
        is(e, { message: b, messageDefinition: d }),
        St(e, b),
        (e.recovering = !1),
        y.push(b),
        {
            type: "Data",
            localMessageType: t,
            messageDefinition: d,
            message: b,
            recordHeader: n,
        }
    );
}
function ss(e, t) {
    const { previousTimestamps: i } = e,
        n = (t & jn) >> 5,
        r = t & Pn;
    let s = i.any & (Zn + r);
    return (s < i.any && (s += 32), Et(e, { localMessageType: n, timestamp: s, recordHeader: t }));
}
function as(e, t) {
    const i = t & gt;
    return Et(e, { localMessageType: i, recordHeader: t });
}
function os(e, t) {
    const {
            stream: i,
            repairDefinitions: n,
            recordStart: r,
            localMessageTypes: s,
            messages: o,
            definitions: l,
            messageNumbers: a,
        } = e,
        u = xt(t, i),
        { localMessageType: f, globalMessageNumber: c, messageName: d } = u;
    return (
        (Ut.includes(d) || d === "split_summary") &&
            (n[d] = {
                messageDefinition: u,
                definitionRecord: i.slice(r, i.position),
            }),
        St(e, u),
        u.fields && (e.recovering = !1),
        (s[f] = u),
        c in o ? (l[c] = _t(l[c], u)) : ((l[c] = u), (o[c] = []), a.push(c)),
        { message: u, recordHeader: t }
    );
}
function ls(e) {
    const { stream: t } = e;
    e.recordStart = t.position;
    const i = t.readByte() ?? 255;
    return ((e.recoverPosition = t.position), i & zn ? ss(e, i) : i & Gn ? os(e, i) : as(e, i));
}
function us(e) {
    const { messages: t } = e,
        i = _(t, "record");
    if (!(i != null && i.length)) return;
    if (i.every((r) => r.timestamp)) {
        e.mergedRecords = i;
        return;
    }
    const n = {};
    ((e.mergedRecords = []),
        i.forEach((r) => {
            (Object.assign(n, r), r.timestamp && e.mergedRecords.push({ ...n }));
        }));
}
async function hs(e, t, i) {
    let n = 0;
    const r = {
            indices: { record: 0, file: 0 },
            recovering: !1,
            hadErrors: !1,
            recoverPosition: 0,
            time_created: void 0,
            fileType: void 0,
            messages: {},
            errors: [],
            devErrors: [],
            definitions: {},
            messageNumbers: [],
            localMessageTypes: {},
            previousTimestamps: { any: 0 },
            developerDataFields: new Mn(),
            accumulator: new Vn(),
            stream: A.fromByteArray(e),
            fileHeaders: [],
            fileIndex: 0,
            issues: [],
            insertedTimeStamps: {},
            streamIndex: {
                files: {},
                invalidRecords: new Set(),
                newRecords: [],
                fileIdRecords: [],
            },
            repairDefinitions: {},
            recordStart: void 0,
            timestampOffsets: {},
        },
        {
            stream: s,
            streamIndex: o,
            issues: l,
            errors: a,
            messages: u,
            definitions: f,
            messageNumbers: c,
            developerDataFields: d,
            devErrors: g,
            fileHeaders: m,
        } = r,
        p = new Gr(r);
    function y() {
        const { indices: F } = r;
        return {
            discardedBytes: n,
            totalBytes: s.length,
            position: s.position,
            records: F.record,
        };
    }
    t && t(y());
    function x() {
        t && t(y());
    }
    function b(F) {
        const { indices: K, recoverPosition: Vt } = r;
        (r.recovering || p.show(),
            n++,
            s.seek(Vt),
            r.recovering ||
                ((F.record = K.record), (F.position = s.position), g.push(F), (r.recovering = !0), (r.hadErrors = !0)));
    }
    function N() {
        const F = ls(r);
        p.report({ type: "Definition", ...F });
    }
    try {
        for (; s.position < s.length && !(i != null && i.current); )
            await Jr(r, {
                stopRef: i,
                handleRecord: N,
                handleError: b,
                handleProgress: x,
            });
    } catch (F) {
        if ((console.error("Error parsing file", F), s.position === 0)) {
            const K = s.readString(9);
            if (/^\w+\s*=$/.test(K))
                F.message = "This looks like a NASA FITS image file, see https://fits.gsfc.nasa.gov/";
            else {
                for (s.seek(0); s.readByte() === 0 && s.position < s.length; );
                s.position === s.length && (F.message = "This file is empty (has only NULL-bytes)");
            }
            s.seek(0);
        }
        s.position > 0 && l.length === 0
            ? ((F.type = "truncated"),
              (F.data = { pos: s.position }),
              (F.description = "A subfile is corrupted"),
              l.push(F))
            : ((F.message = `Fatal error: ${F.message}`), a.push(F));
    }
    const j = d.getDefinitions(),
        Mt = Br(u, f);
    (us(r), Mr(r));
    const At = kr(r);
    return (
        Pr(u),
        {
            errors: a,
            devErrors: g,
            messages: u,
            definitions: c.map((F) => f[F]).filter((F) => u[F.globalMessageNumber].length > 0),
            developerFields: j,
            developerDataFields: d,
            fileHeaders: m,
            issues: l,
            fileType: r.fileType,
            hrMerged: Mt,
            geoData: At,
            streamIndex: o,
            mergedRecords: r.mergedRecords,
        }
    );
}
export { hs as default };
