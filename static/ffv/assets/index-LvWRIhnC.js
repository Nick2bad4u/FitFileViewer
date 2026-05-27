const __vite__mapDeps = (
    i,
    m = __vite__mapDeps,
    d = m.f ||
        (m.f = [
            "./index-C1xoUegX.js",
            "./isUnknown-BvXlyTdW.js",
            "./getMessagesForName-CXPND5Gu.js",
            "./binaryString-DLpsQS3c.js",
            "./index-CQWboq_8.js",
            "./index-D4CCfpM1.js",
            "./Sprite-BZ4Kwmf3.js",
            "./useMeasure-Df3vRnzU.js",
            "./index-Dgihpmma.css",
            "./index-B6xcXKpx.js",
            "./findFields-C7eiFatx.js",
            "./Results-H2VOSWW7.js",
        ])
) => i.map((i) => d[i]);
var jp = Object.defineProperty;
var Mp = (e, t, n) =>
    t in e
        ? jp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
        : (e[t] = n);
var ki = (e, t, n) => Mp(e, typeof t != "symbol" ? t + "" : t, n);
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
            t = new Error().stack;
        t &&
            ((e._sentryDebugIds = e._sentryDebugIds || {}),
            (e._sentryDebugIds[t] = "58f77c91-af6d-41b0-98d1-91b2663d0abe"),
            (e._sentryDebugIdIdentifier =
                "sentry-dbid-58f77c91-af6d-41b0-98d1-91b2663d0abe"));
    } catch {
        /* Ignore errors */
    }
})();
function Dp(e, t) {
    for (var n = 0; n < t.length; n++) {
        const r = t[n];
        if (typeof r != "string" && !Array.isArray(r)) {
            for (const o in r)
                if (o !== "default" && !(o in e)) {
                    const i = Object.getOwnPropertyDescriptor(r, o);
                    i &&
                        Object.defineProperty(
                            e,
                            o,
                            i.get ? i : { enumerable: !0, get: () => r[o] }
                        );
                }
        }
    }
    return Object.freeze(
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" })
    );
}
var bp =
    typeof window < "u"
        ? window
        : typeof global < "u"
          ? global
          : typeof self < "u"
            ? self
            : {};
bp.SENTRY_RELEASE = { id: "d264f77391b21098678f0f623c7aacaaa9ab8300" };
(function () {
    const t = document.createElement("link").relList;
    if (t && t.supports && t.supports("modulepreload")) return;
    for (const o of document.querySelectorAll('link[rel="modulepreload"]'))
        r(o);
    new MutationObserver((o) => {
        for (const i of o)
            if (i.type === "childList")
                for (const s of i.addedNodes)
                    s.tagName === "LINK" && s.rel === "modulepreload" && r(s);
    }).observe(document, { childList: !0, subtree: !0 });
    function n(o) {
        const i = {};
        return (
            o.integrity && (i.integrity = o.integrity),
            o.referrerPolicy && (i.referrerPolicy = o.referrerPolicy),
            o.crossOrigin === "use-credentials"
                ? (i.credentials = "include")
                : o.crossOrigin === "anonymous"
                  ? (i.credentials = "omit")
                  : (i.credentials = "same-origin"),
            i
        );
    }
    function r(o) {
        if (o.ep) return;
        o.ep = !0;
        const i = n(o);
        fetch(o.href, i);
    }
})();
var d1 =
    typeof globalThis < "u"
        ? globalThis
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : typeof self < "u"
              ? self
              : {};
function cl(e) {
    return e &&
        e.__esModule &&
        Object.prototype.hasOwnProperty.call(e, "default")
        ? e.default
        : e;
}
var tc = { exports: {} },
    Jo = {},
    nc = { exports: {} },
    j = {};
/**
 * @license React react.production.min.js
 *
 *   Copyright (c) Facebook, Inc. and its affiliates.
 *
 *   This source code is licensed under the MIT license found in the LICENSE file
 *   in the root directory of this source tree.
 */ var br = Symbol.for("react.element"),
    zp = Symbol.for("react.portal"),
    Fp = Symbol.for("react.fragment"),
    Up = Symbol.for("react.strict_mode"),
    Bp = Symbol.for("react.profiler"),
    $p = Symbol.for("react.provider"),
    Vp = Symbol.for("react.context"),
    Wp = Symbol.for("react.forward_ref"),
    Gp = Symbol.for("react.suspense"),
    Hp = Symbol.for("react.memo"),
    Qp = Symbol.for("react.lazy"),
    ku = Symbol.iterator;
function Kp(e) {
    return e === null || typeof e != "object"
        ? null
        : ((e = (ku && e[ku]) || e["@@iterator"]),
          typeof e == "function" ? e : null);
}
var rc = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    oc = Object.assign,
    ic = {};
function Un(e, t, n) {
    ((this.props = e),
        (this.context = t),
        (this.refs = ic),
        (this.updater = n || rc));
}
Un.prototype.isReactComponent = {};
Un.prototype.setState = function (e, t) {
    if (typeof e != "object" && typeof e != "function" && e != null)
        throw Error(
            "setState(...): takes an object of state variables to update or a function which returns an object of state variables."
        );
    this.updater.enqueueSetState(this, e, t, "setState");
};
Un.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function sc() {}
sc.prototype = Un.prototype;
function dl(e, t, n) {
    ((this.props = e),
        (this.context = t),
        (this.refs = ic),
        (this.updater = n || rc));
}
var fl = (dl.prototype = new sc());
fl.constructor = dl;
oc(fl, Un.prototype);
fl.isPureReactComponent = !0;
var Cu = Array.isArray,
    lc = Object.prototype.hasOwnProperty,
    pl = { current: null },
    uc = { key: !0, ref: !0, __self: !0, __source: !0 };
function ac(e, t, n) {
    var r,
        o = {},
        i = null,
        s = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (s = t.ref),
        t.key !== void 0 && (i = "" + t.key),
        t))
            lc.call(t, r) && !uc.hasOwnProperty(r) && (o[r] = t[r]);
    var l = arguments.length - 2;
    if (l === 1) o.children = n;
    else if (1 < l) {
        for (var u = Array(l), a = 0; a < l; a++) u[a] = arguments[a + 2];
        o.children = u;
    }
    if (e && e.defaultProps)
        for (r in ((l = e.defaultProps), l)) o[r] === void 0 && (o[r] = l[r]);
    return {
        $$typeof: br,
        type: e,
        key: i,
        ref: s,
        props: o,
        _owner: pl.current,
    };
}
function Yp(e, t) {
    return {
        $$typeof: br,
        type: e.type,
        key: t,
        ref: e.ref,
        props: e.props,
        _owner: e._owner,
    };
}
function ml(e) {
    return typeof e == "object" && e !== null && e.$$typeof === br;
}
function Xp(e) {
    var t = { "=": "=0", ":": "=2" };
    return (
        "$" +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var Nu = /\/+/g;
function Ci(e, t) {
    return typeof e == "object" && e !== null && e.key != null
        ? Xp("" + e.key)
        : t.toString(36);
}
function fo(e, t, n, r, o) {
    var i = typeof e;
    (i === "undefined" || i === "boolean") && (e = null);
    var s = !1;
    if (e === null) s = !0;
    else
        switch (i) {
            case "string":
            case "number":
                s = !0;
                break;
            case "object":
                switch (e.$$typeof) {
                    case br:
                    case zp:
                        s = !0;
                }
        }
    if (s)
        return (
            (s = e),
            (o = o(s)),
            (e = r === "" ? "." + Ci(s, 0) : r),
            Cu(o)
                ? ((n = ""),
                  e != null && (n = e.replace(Nu, "$&/") + "/"),
                  fo(o, t, n, "", function (a) {
                      return a;
                  }))
                : o != null &&
                  (ml(o) &&
                      (o = Yp(
                          o,
                          n +
                              (!o.key || (s && s.key === o.key)
                                  ? ""
                                  : ("" + o.key).replace(Nu, "$&/") + "/") +
                              e
                      )),
                  t.push(o)),
            1
        );
    if (((s = 0), (r = r === "" ? "." : r + ":"), Cu(e)))
        for (var l = 0; l < e.length; l++) {
            i = e[l];
            var u = r + Ci(i, l);
            s += fo(i, t, n, u, o);
        }
    else if (((u = Kp(e)), typeof u == "function"))
        for (e = u.call(e), l = 0; !(i = e.next()).done; )
            ((i = i.value), (u = r + Ci(i, l++)), (s += fo(i, t, n, u, o)));
    else if (i === "object")
        throw (
            (t = String(e)),
            Error(
                "Objects are not valid as a React child (found: " +
                    (t === "[object Object]"
                        ? "object with keys {" + Object.keys(e).join(", ") + "}"
                        : t) +
                    "). If you meant to render a collection of children, use an array instead."
            )
        );
    return s;
}
function Hr(e, t, n) {
    if (e == null) return e;
    var r = [],
        o = 0;
    return (
        fo(e, r, "", "", function (i) {
            return t.call(n, i, o++);
        }),
        r
    );
}
function Jp(e) {
    if (e._status === -1) {
        var t = e._result;
        ((t = t()),
            t.then(
                function (n) {
                    (e._status === 0 || e._status === -1) &&
                        ((e._status = 1), (e._result = n));
                },
                function (n) {
                    (e._status === 0 || e._status === -1) &&
                        ((e._status = 2), (e._result = n));
                }
            ),
            e._status === -1 && ((e._status = 0), (e._result = t)));
    }
    if (e._status === 1) return e._result.default;
    throw e._result;
}
var he = { current: null },
    po = { transition: null },
    Zp = {
        ReactCurrentDispatcher: he,
        ReactCurrentBatchConfig: po,
        ReactCurrentOwner: pl,
    };
function cc() {
    throw Error("act(...) is not supported in production builds of React.");
}
j.Children = {
    map: Hr,
    forEach: function (e, t, n) {
        Hr(
            e,
            function () {
                t.apply(this, arguments);
            },
            n
        );
    },
    count: function (e) {
        var t = 0;
        return (
            Hr(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            Hr(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!ml(e))
            throw Error(
                "React.Children.only expected to receive a single React element child."
            );
        return e;
    },
};
j.Component = Un;
j.Fragment = Fp;
j.Profiler = Bp;
j.PureComponent = dl;
j.StrictMode = Up;
j.Suspense = Gp;
j.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Zp;
j.act = cc;
j.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            "React.cloneElement(...): The argument must be a React element, but you passed " +
                e +
                "."
        );
    var r = oc({}, e.props),
        o = e.key,
        i = e.ref,
        s = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((i = t.ref), (s = pl.current)),
            t.key !== void 0 && (o = "" + t.key),
            e.type && e.type.defaultProps)
        )
            var l = e.type.defaultProps;
        for (u in t)
            lc.call(t, u) &&
                !uc.hasOwnProperty(u) &&
                (r[u] = t[u] === void 0 && l !== void 0 ? l[u] : t[u]);
    }
    var u = arguments.length - 2;
    if (u === 1) r.children = n;
    else if (1 < u) {
        l = Array(u);
        for (var a = 0; a < u; a++) l[a] = arguments[a + 2];
        r.children = l;
    }
    return { $$typeof: br, type: e.type, key: o, ref: i, props: r, _owner: s };
};
j.createContext = function (e) {
    return (
        (e = {
            $$typeof: Vp,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: $p, _context: e }),
        (e.Consumer = e)
    );
};
j.createElement = ac;
j.createFactory = function (e) {
    var t = ac.bind(null, e);
    return ((t.type = e), t);
};
j.createRef = function () {
    return { current: null };
};
j.forwardRef = function (e) {
    return { $$typeof: Wp, render: e };
};
j.isValidElement = ml;
j.lazy = function (e) {
    return { $$typeof: Qp, _payload: { _status: -1, _result: e }, _init: Jp };
};
j.memo = function (e, t) {
    return { $$typeof: Hp, type: e, compare: t === void 0 ? null : t };
};
j.startTransition = function (e) {
    var t = po.transition;
    po.transition = {};
    try {
        e();
    } finally {
        po.transition = t;
    }
};
j.unstable_act = cc;
j.useCallback = function (e, t) {
    return he.current.useCallback(e, t);
};
j.useContext = function (e) {
    return he.current.useContext(e);
};
j.useDebugValue = function () {};
j.useDeferredValue = function (e) {
    return he.current.useDeferredValue(e);
};
j.useEffect = function (e, t) {
    return he.current.useEffect(e, t);
};
j.useId = function () {
    return he.current.useId();
};
j.useImperativeHandle = function (e, t, n) {
    return he.current.useImperativeHandle(e, t, n);
};
j.useInsertionEffect = function (e, t) {
    return he.current.useInsertionEffect(e, t);
};
j.useLayoutEffect = function (e, t) {
    return he.current.useLayoutEffect(e, t);
};
j.useMemo = function (e, t) {
    return he.current.useMemo(e, t);
};
j.useReducer = function (e, t, n) {
    return he.current.useReducer(e, t, n);
};
j.useRef = function (e) {
    return he.current.useRef(e);
};
j.useState = function (e) {
    return he.current.useState(e);
};
j.useSyncExternalStore = function (e, t, n) {
    return he.current.useSyncExternalStore(e, t, n);
};
j.useTransition = function () {
    return he.current.useTransition();
};
j.version = "18.3.1";
nc.exports = j;
var w = nc.exports;
const gt = cl(w),
    qp = Dp({ __proto__: null, default: gt }, [w]);
/**
 * @license React react-jsx-runtime.production.min.js
 *
 *   Copyright (c) Facebook, Inc. and its affiliates.
 *
 *   This source code is licensed under the MIT license found in the LICENSE file
 *   in the root directory of this source tree.
 */ var em = w,
    tm = Symbol.for("react.element"),
    nm = Symbol.for("react.fragment"),
    rm = Object.prototype.hasOwnProperty,
    om =
        em.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    im = { key: !0, ref: !0, __self: !0, __source: !0 };
function dc(e, t, n) {
    var r,
        o = {},
        i = null,
        s = null;
    (n !== void 0 && (i = "" + n),
        t.key !== void 0 && (i = "" + t.key),
        t.ref !== void 0 && (s = t.ref));
    for (r in t) rm.call(t, r) && !im.hasOwnProperty(r) && (o[r] = t[r]);
    if (e && e.defaultProps)
        for (r in ((t = e.defaultProps), t)) o[r] === void 0 && (o[r] = t[r]);
    return {
        $$typeof: tm,
        type: e,
        key: i,
        ref: s,
        props: o,
        _owner: om.current,
    };
}
Jo.Fragment = nm;
Jo.jsx = dc;
Jo.jsxs = dc;
tc.exports = Jo;
var v = tc.exports,
    os = {},
    fc = { exports: {} },
    Te = {},
    pc = { exports: {} },
    mc = {};
/**
 * @license React scheduler.production.min.js
 *
 *   Copyright (c) Facebook, Inc. and its affiliates.
 *
 *   This source code is licensed under the MIT license found in the LICENSE file
 *   in the root directory of this source tree.
 */ (function (e) {
    function t(N, I) {
        var O = N.length;
        N.push(I);
        e: for (; 0 < O; ) {
            var b = (O - 1) >>> 1,
                te = N[b];
            if (0 < o(te, I)) ((N[b] = I), (N[O] = te), (O = b));
            else break e;
        }
    }
    function n(N) {
        return N.length === 0 ? null : N[0];
    }
    function r(N) {
        if (N.length === 0) return null;
        var I = N[0],
            O = N.pop();
        if (O !== I) {
            N[0] = O;
            e: for (var b = 0, te = N.length, Wr = te >>> 1; b < Wr; ) {
                var bt = 2 * (b + 1) - 1,
                    Ei = N[bt],
                    zt = bt + 1,
                    Gr = N[zt];
                if (0 > o(Ei, O))
                    zt < te && 0 > o(Gr, Ei)
                        ? ((N[b] = Gr), (N[zt] = O), (b = zt))
                        : ((N[b] = Ei), (N[bt] = O), (b = bt));
                else if (zt < te && 0 > o(Gr, O))
                    ((N[b] = Gr), (N[zt] = O), (b = zt));
                else break e;
            }
        }
        return I;
    }
    function o(N, I) {
        var O = N.sortIndex - I.sortIndex;
        return O !== 0 ? O : N.id - I.id;
    }
    if (
        typeof performance == "object" &&
        typeof performance.now == "function"
    ) {
        var i = performance;
        e.unstable_now = function () {
            return i.now();
        };
    } else {
        var s = Date,
            l = s.now();
        e.unstable_now = function () {
            return s.now() - l;
        };
    }
    var u = [],
        a = [],
        m = 1,
        f = null,
        h = 3,
        g = !1,
        y = !1,
        S = !1,
        x = typeof setTimeout == "function" ? setTimeout : null,
        d = typeof clearTimeout == "function" ? clearTimeout : null,
        c = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" &&
        navigator.scheduling !== void 0 &&
        navigator.scheduling.isInputPending !== void 0 &&
        navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function p(N) {
        for (var I = n(a); I !== null; ) {
            if (I.callback === null) r(a);
            else if (I.startTime <= N)
                (r(a), (I.sortIndex = I.expirationTime), t(u, I));
            else break;
            I = n(a);
        }
    }
    function _(N) {
        if (((S = !1), p(N), !y))
            if (n(u) !== null) ((y = !0), le(k));
            else {
                var I = n(a);
                I !== null && ln(_, I.startTime - N);
            }
    }
    function k(N, I) {
        ((y = !1), S && ((S = !1), d(C), (C = -1)), (g = !0));
        var O = h;
        try {
            for (
                p(I), f = n(u);
                f !== null && (!(f.expirationTime > I) || (N && !Z()));
            ) {
                var b = f.callback;
                if (typeof b == "function") {
                    ((f.callback = null), (h = f.priorityLevel));
                    var te = b(f.expirationTime <= I);
                    ((I = e.unstable_now()),
                        typeof te == "function"
                            ? (f.callback = te)
                            : f === n(u) && r(u),
                        p(I));
                } else r(u);
                f = n(u);
            }
            if (f !== null) var Wr = !0;
            else {
                var bt = n(a);
                (bt !== null && ln(_, bt.startTime - I), (Wr = !1));
            }
            return Wr;
        } finally {
            ((f = null), (h = O), (g = !1));
        }
    }
    var T = !1,
        P = null,
        C = -1,
        F = 5,
        A = -1;
    function Z() {
        return !(e.unstable_now() - A < F);
    }
    function D() {
        if (P !== null) {
            var N = e.unstable_now();
            A = N;
            var I = !0;
            try {
                I = P(!0, N);
            } finally {
                I ? We() : ((T = !1), (P = null));
            }
        } else T = !1;
    }
    var We;
    if (typeof c == "function")
        We = function () {
            c(D);
        };
    else if (typeof MessageChannel < "u") {
        var ft = new MessageChannel(),
            sn = ft.port2;
        ((ft.port1.onmessage = D),
            (We = function () {
                sn.postMessage(null);
            }));
    } else
        We = function () {
            x(D, 0);
        };
    function le(N) {
        ((P = N), T || ((T = !0), We()));
    }
    function ln(N, I) {
        C = x(function () {
            N(e.unstable_now());
        }, I);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (N) {
            N.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            y || g || ((y = !0), le(k));
        }),
        (e.unstable_forceFrameRate = function (N) {
            0 > N || 125 < N
                ? console.error(
                      "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
                  )
                : (F = 0 < N ? Math.floor(1e3 / N) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return h;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(u);
        }),
        (e.unstable_next = function (N) {
            switch (h) {
                case 1:
                case 2:
                case 3:
                    var I = 3;
                    break;
                default:
                    I = h;
            }
            var O = h;
            h = I;
            try {
                return N();
            } finally {
                h = O;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (N, I) {
            switch (N) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    N = 3;
            }
            var O = h;
            h = N;
            try {
                return I();
            } finally {
                h = O;
            }
        }),
        (e.unstable_scheduleCallback = function (N, I, O) {
            var b = e.unstable_now();
            switch (
                (typeof O == "object" && O !== null
                    ? ((O = O.delay),
                      (O = typeof O == "number" && 0 < O ? b + O : b))
                    : (O = b),
                N)
            ) {
                case 1:
                    var te = -1;
                    break;
                case 2:
                    te = 250;
                    break;
                case 5:
                    te = 1073741823;
                    break;
                case 4:
                    te = 1e4;
                    break;
                default:
                    te = 5e3;
            }
            return (
                (te = O + te),
                (N = {
                    id: m++,
                    callback: I,
                    priorityLevel: N,
                    startTime: O,
                    expirationTime: te,
                    sortIndex: -1,
                }),
                O > b
                    ? ((N.sortIndex = O),
                      t(a, N),
                      n(u) === null &&
                          N === n(a) &&
                          (S ? (d(C), (C = -1)) : (S = !0), ln(_, O - b)))
                    : ((N.sortIndex = te),
                      t(u, N),
                      y || g || ((y = !0), le(k))),
                N
            );
        }),
        (e.unstable_shouldYield = Z),
        (e.unstable_wrapCallback = function (N) {
            var I = h;
            return function () {
                var O = h;
                h = I;
                try {
                    return N.apply(this, arguments);
                } finally {
                    h = O;
                }
            };
        }));
})(mc);
pc.exports = mc;
var sm = pc.exports;
/**
 * @license React react-dom.production.min.js
 *
 *   Copyright (c) Facebook, Inc. and its affiliates.
 *
 *   This source code is licensed under the MIT license found in the LICENSE file
 *   in the root directory of this source tree.
 */ var lm = w,
    Ne = sm;
function E(e) {
    for (
        var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e,
            n = 1;
        n < arguments.length;
        n++
    )
        t += "&args[]=" + encodeURIComponent(arguments[n]);
    return (
        "Minified React error #" +
        e +
        "; visit " +
        t +
        " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
}
var hc = new Set(),
    vr = {};
function nn(e, t) {
    (An(e, t), An(e + "Capture", t));
}
function An(e, t) {
    for (vr[e] = t, e = 0; e < t.length; e++) hc.add(t[e]);
}
var st = !(
        typeof window > "u" ||
        typeof window.document > "u" ||
        typeof window.document.createElement > "u"
    ),
    is = Object.prototype.hasOwnProperty,
    um =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    Tu = {},
    Ru = {};
function am(e) {
    return is.call(Ru, e)
        ? !0
        : is.call(Tu, e)
          ? !1
          : um.test(e)
            ? (Ru[e] = !0)
            : ((Tu[e] = !0), !1);
}
function cm(e, t, n, r) {
    if (n !== null && n.type === 0) return !1;
    switch (typeof t) {
        case "function":
        case "symbol":
            return !0;
        case "boolean":
            return r
                ? !1
                : n !== null
                  ? !n.acceptsBooleans
                  : ((e = e.toLowerCase().slice(0, 5)),
                    e !== "data-" && e !== "aria-");
        default:
            return !1;
    }
}
function dm(e, t, n, r) {
    if (t === null || typeof t > "u" || cm(e, t, n, r)) return !0;
    if (r) return !1;
    if (n !== null)
        switch (n.type) {
            case 3:
                return !t;
            case 4:
                return t === !1;
            case 5:
                return isNaN(t);
            case 6:
                return isNaN(t) || 1 > t;
        }
    return !1;
}
function ge(e, t, n, r, o, i, s) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = o),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = i),
        (this.removeEmptyString = s));
}
var se = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
    .split(" ")
    .forEach(function (e) {
        se[e] = new ge(e, 0, !1, e, null, !1, !1);
    });
[
    ["acceptCharset", "accept-charset"],
    ["className", "class"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
].forEach(function (e) {
    var t = e[0];
    se[t] = new ge(t, 1, !1, e[1], null, !1, !1);
});
[
    "contentEditable",
    "draggable",
    "spellCheck",
    "value",
].forEach(function (e) {
    se[e] = new ge(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
[
    "autoReverse",
    "externalResourcesRequired",
    "focusable",
    "preserveAlpha",
].forEach(function (e) {
    se[e] = new ge(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
    .split(" ")
    .forEach(function (e) {
        se[e] = new ge(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
[
    "checked",
    "multiple",
    "muted",
    "selected",
].forEach(function (e) {
    se[e] = new ge(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function (e) {
    se[e] = new ge(e, 4, !1, e, null, !1, !1);
});
[
    "cols",
    "rows",
    "size",
    "span",
].forEach(function (e) {
    se[e] = new ge(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function (e) {
    se[e] = new ge(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var hl = /[\-:]([a-z])/g;
function gl(e) {
    return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
    .split(" ")
    .forEach(function (e) {
        var t = e.replace(hl, gl);
        se[t] = new ge(t, 1, !1, e, null, !1, !1);
    });
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type"
    .split(" ")
    .forEach(function (e) {
        var t = e.replace(hl, gl);
        se[t] = new ge(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
    });
[
    "xml:base",
    "xml:lang",
    "xml:space",
].forEach(function (e) {
    var t = e.replace(hl, gl);
    se[t] = new ge(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function (e) {
    se[e] = new ge(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
se.xlinkHref = new ge(
    "xlinkHref",
    1,
    !1,
    "xlink:href",
    "http://www.w3.org/1999/xlink",
    !0,
    !1
);
[
    "src",
    "href",
    "action",
    "formAction",
].forEach(function (e) {
    se[e] = new ge(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function yl(e, t, n, r) {
    var o = se.hasOwnProperty(t) ? se[t] : null;
    (o !== null
        ? o.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== "o" && t[0] !== "O") ||
          (t[1] !== "n" && t[1] !== "N")) &&
        (dm(t, n, o, r) && (n = null),
        r || o === null
            ? am(t) &&
              (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n))
            : o.mustUseProperty
              ? (e[o.propertyName] = n === null ? (o.type === 3 ? !1 : "") : n)
              : ((t = o.attributeName),
                (r = o.attributeNamespace),
                n === null
                    ? e.removeAttribute(t)
                    : ((o = o.type),
                      (n = o === 3 || (o === 4 && n === !0) ? "" : "" + n),
                      r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var dt = lm.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    Qr = Symbol.for("react.element"),
    an = Symbol.for("react.portal"),
    cn = Symbol.for("react.fragment"),
    vl = Symbol.for("react.strict_mode"),
    ss = Symbol.for("react.profiler"),
    gc = Symbol.for("react.provider"),
    yc = Symbol.for("react.context"),
    Sl = Symbol.for("react.forward_ref"),
    ls = Symbol.for("react.suspense"),
    us = Symbol.for("react.suspense_list"),
    wl = Symbol.for("react.memo"),
    yt = Symbol.for("react.lazy"),
    vc = Symbol.for("react.offscreen"),
    Pu = Symbol.iterator;
function Hn(e) {
    return e === null || typeof e != "object"
        ? null
        : ((e = (Pu && e[Pu]) || e["@@iterator"]),
          typeof e == "function" ? e : null);
}
var K = Object.assign,
    Ni;
function rr(e) {
    if (Ni === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            Ni = (t && t[1]) || "";
        }
    return (
        `
` +
        Ni +
        e
    );
}
var Ti = !1;
function Ri(e, t) {
    if (!e || Ti) return "";
    Ti = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
        if (t)
            if (
                ((t = function () {
                    throw Error();
                }),
                Object.defineProperty(t.prototype, "props", {
                    set: function () {
                        throw Error();
                    },
                }),
                typeof Reflect == "object" && Reflect.construct)
            ) {
                try {
                    Reflect.construct(t, []);
                } catch (a) {
                    var r = a;
                }
                Reflect.construct(e, [], t);
            } else {
                try {
                    t.call();
                } catch (a) {
                    r = a;
                }
                e.call(t.prototype);
            }
        else {
            try {
                throw Error();
            } catch (a) {
                r = a;
            }
            e();
        }
    } catch (a) {
        if (a && r && typeof a.stack == "string") {
            for (
                var o = a.stack.split(`
`),
                    i = r.stack.split(`
`),
                    s = o.length - 1,
                    l = i.length - 1;
                1 <= s && 0 <= l && o[s] !== i[l];
            )
                l--;
            for (; 1 <= s && 0 <= l; s--, l--)
                if (o[s] !== i[l]) {
                    if (s !== 1 || l !== 1)
                        do
                            if ((s--, l--, 0 > l || o[s] !== i[l])) {
                                var u =
                                    `
` + o[s].replace(" at new ", " at ");
                                return (
                                    e.displayName &&
                                        u.includes("<anonymous>") &&
                                        (u = u.replace(
                                            "<anonymous>",
                                            e.displayName
                                        )),
                                    u
                                );
                            }
                        while (1 <= s && 0 <= l);
                    break;
                }
        }
    } finally {
        ((Ti = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : "") ? rr(e) : "";
}
function fm(e) {
    switch (e.tag) {
        case 5:
            return rr(e.type);
        case 16:
            return rr("Lazy");
        case 13:
            return rr("Suspense");
        case 19:
            return rr("SuspenseList");
        case 0:
        case 2:
        case 15:
            return ((e = Ri(e.type, !1)), e);
        case 11:
            return ((e = Ri(e.type.render, !1)), e);
        case 1:
            return ((e = Ri(e.type, !0)), e);
        default:
            return "";
    }
}
function as(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
        case cn:
            return "Fragment";
        case an:
            return "Portal";
        case ss:
            return "Profiler";
        case vl:
            return "StrictMode";
        case ls:
            return "Suspense";
        case us:
            return "SuspenseList";
    }
    if (typeof e == "object")
        switch (e.$$typeof) {
            case yc:
                return (e.displayName || "Context") + ".Consumer";
            case gc:
                return (e._context.displayName || "Context") + ".Provider";
            case Sl:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ""),
                        (e =
                            e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")),
                    e
                );
            case wl:
                return (
                    (t = e.displayName || null),
                    t !== null ? t : as(e.type) || "Memo"
                );
            case yt:
                ((t = e._payload), (e = e._init));
                try {
                    return as(e(t));
                } catch {
                    /* Ignore errors */
                }
        }
    return null;
}
function pm(e) {
    var t = e.type;
    switch (e.tag) {
        case 24:
            return "Cache";
        case 9:
            return (t.displayName || "Context") + ".Consumer";
        case 10:
            return (t._context.displayName || "Context") + ".Provider";
        case 18:
            return "DehydratedFragment";
        case 11:
            return (
                (e = t.render),
                (e = e.displayName || e.name || ""),
                t.displayName ||
                    (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")
            );
        case 7:
            return "Fragment";
        case 5:
            return t;
        case 4:
            return "Portal";
        case 3:
            return "Root";
        case 6:
            return "Text";
        case 16:
            return as(t);
        case 8:
            return t === vl ? "StrictMode" : "Mode";
        case 22:
            return "Offscreen";
        case 12:
            return "Profiler";
        case 21:
            return "Scope";
        case 13:
            return "Suspense";
        case 19:
            return "SuspenseList";
        case 25:
            return "TracingMarker";
        case 1:
        case 0:
        case 17:
        case 2:
        case 14:
        case 15:
            if (typeof t == "function") return t.displayName || t.name || null;
            if (typeof t == "string") return t;
    }
    return null;
}
function At(e) {
    switch (typeof e) {
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return e;
        case "object":
            return e;
        default:
            return "";
    }
}
function Sc(e) {
    var t = e.type;
    return (
        (e = e.nodeName) &&
        e.toLowerCase() === "input" &&
        (t === "checkbox" || t === "radio")
    );
}
function mm(e) {
    var t = Sc(e) ? "checked" : "value",
        n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
        r = "" + e[t];
    if (
        !e.hasOwnProperty(t) &&
        typeof n < "u" &&
        typeof n.get == "function" &&
        typeof n.set == "function"
    ) {
        var o = n.get,
            i = n.set;
        return (
            Object.defineProperty(e, t, {
                configurable: !0,
                get: function () {
                    return o.call(this);
                },
                set: function (s) {
                    ((r = "" + s), i.call(this, s));
                },
            }),
            Object.defineProperty(e, t, { enumerable: n.enumerable }),
            {
                getValue: function () {
                    return r;
                },
                setValue: function (s) {
                    r = "" + s;
                },
                stopTracking: function () {
                    ((e._valueTracker = null), delete e[t]);
                },
            }
        );
    }
}
function Kr(e) {
    e._valueTracker || (e._valueTracker = mm(e));
}
function wc(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = "";
    return (
        e && (r = Sc(e) ? (e.checked ? "true" : "false") : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function Co(e) {
    if (
        ((e = e || (typeof document < "u" ? document : void 0)), typeof e > "u")
    )
        return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function cs(e, t) {
    var n = t.checked;
    return K({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function Iu(e, t) {
    var n = t.defaultValue == null ? "" : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = At(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === "checkbox" || t.type === "radio"
                    ? t.checked != null
                    : t.value != null,
        }));
}
function _c(e, t) {
    ((t = t.checked), t != null && yl(e, "checked", t, !1));
}
function ds(e, t) {
    _c(e, t);
    var n = At(t.value),
        r = t.type;
    if (n != null)
        r === "number"
            ? ((n === 0 && e.value === "") || e.value != n) &&
              (e.value = "" + n)
            : e.value !== "" + n && (e.value = "" + n);
    else if (r === "submit" || r === "reset") {
        e.removeAttribute("value");
        return;
    }
    (t.hasOwnProperty("value")
        ? fs(e, t.type, n)
        : t.hasOwnProperty("defaultValue") && fs(e, t.type, At(t.defaultValue)),
        t.checked == null &&
            t.defaultChecked != null &&
            (e.defaultChecked = !!t.defaultChecked));
}
function Au(e, t, n) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var r = t.type;
        if (
            !(
                (r !== "submit" && r !== "reset") ||
                (t.value !== void 0 && t.value !== null)
            )
        )
            return;
        ((t = "" + e._wrapperState.initialValue),
            n || t === e.value || (e.value = t),
            (e.defaultValue = t));
    }
    ((n = e.name),
        n !== "" && (e.name = ""),
        (e.defaultChecked = !!e._wrapperState.initialChecked),
        n !== "" && (e.name = n));
}
function fs(e, t, n) {
    (t !== "number" || Co(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = "" + e._wrapperState.initialValue)
            : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var or = Array.isArray;
function xn(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var o = 0; o < n.length; o++) t["$" + n[o]] = !0;
        for (n = 0; n < e.length; n++)
            ((o = t.hasOwnProperty("$" + e[n].value)),
                e[n].selected !== o && (e[n].selected = o),
                o && r && (e[n].defaultSelected = !0));
    } else {
        for (n = "" + At(n), t = null, o = 0; o < e.length; o++) {
            if (e[o].value === n) {
                ((e[o].selected = !0), r && (e[o].defaultSelected = !0));
                return;
            }
            t !== null || e[o].disabled || (t = e[o]);
        }
        t !== null && (t.selected = !0);
    }
}
function ps(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(E(91));
    return K({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: "" + e._wrapperState.initialValue,
    });
}
function Ou(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(E(92));
            if (or(n)) {
                if (1 < n.length) throw Error(E(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ""), (n = t));
    }
    e._wrapperState = { initialValue: At(n) };
}
function xc(e, t) {
    var n = At(t.value),
        r = At(t.defaultValue);
    (n != null &&
        ((n = "" + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = "" + r));
}
function Lu(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue &&
        t !== "" &&
        t !== null &&
        (e.value = t);
}
function Ec(e) {
    switch (e) {
        case "svg":
            return "http://www.w3.org/2000/svg";
        case "math":
            return "http://www.w3.org/1998/Math/MathML";
        default:
            return "http://www.w3.org/1999/xhtml";
    }
}
function ms(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml"
        ? Ec(t)
        : e === "http://www.w3.org/2000/svg" && t === "foreignObject"
          ? "http://www.w3.org/1999/xhtml"
          : e;
}
var Yr,
    kc = (function (e) {
        return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction
            ? function (t, n, r, o) {
                  MSApp.execUnsafeLocalFunction(function () {
                      return e(t, n, r, o);
                  });
              }
            : e;
    })(function (e, t) {
        if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e)
            e.innerHTML = t;
        else {
            for (
                Yr = Yr || document.createElement("div"),
                    Yr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>",
                    t = Yr.firstChild;
                e.firstChild;
            )
                e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
        }
    });
function Sr(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var lr = {
        animationIterationCount: !0,
        aspectRatio: !0,
        borderImageOutset: !0,
        borderImageSlice: !0,
        borderImageWidth: !0,
        boxFlex: !0,
        boxFlexGroup: !0,
        boxOrdinalGroup: !0,
        columnCount: !0,
        columns: !0,
        flex: !0,
        flexGrow: !0,
        flexPositive: !0,
        flexShrink: !0,
        flexNegative: !0,
        flexOrder: !0,
        gridArea: !0,
        gridRow: !0,
        gridRowEnd: !0,
        gridRowSpan: !0,
        gridRowStart: !0,
        gridColumn: !0,
        gridColumnEnd: !0,
        gridColumnSpan: !0,
        gridColumnStart: !0,
        fontWeight: !0,
        lineClamp: !0,
        lineHeight: !0,
        opacity: !0,
        order: !0,
        orphans: !0,
        tabSize: !0,
        widows: !0,
        zIndex: !0,
        zoom: !0,
        fillOpacity: !0,
        floodOpacity: !0,
        stopOpacity: !0,
        strokeDasharray: !0,
        strokeDashoffset: !0,
        strokeMiterlimit: !0,
        strokeOpacity: !0,
        strokeWidth: !0,
    },
    hm = [
        "Webkit",
        "ms",
        "Moz",
        "O",
    ];
Object.keys(lr).forEach(function (e) {
    hm.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (lr[t] = lr[e]));
    });
});
function Cc(e, t, n) {
    return t == null || typeof t == "boolean" || t === ""
        ? ""
        : n ||
            typeof t != "number" ||
            t === 0 ||
            (lr.hasOwnProperty(e) && lr[e])
          ? ("" + t).trim()
          : t + "px";
}
function Nc(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf("--") === 0,
                o = Cc(n, t[n], r);
            (n === "float" && (n = "cssFloat"),
                r ? e.setProperty(n, o) : (e[n] = o));
        }
}
var gm = K(
    { menuitem: !0 },
    {
        area: !0,
        base: !0,
        br: !0,
        col: !0,
        embed: !0,
        hr: !0,
        img: !0,
        input: !0,
        keygen: !0,
        link: !0,
        meta: !0,
        param: !0,
        source: !0,
        track: !0,
        wbr: !0,
    }
);
function hs(e, t) {
    if (t) {
        if (gm[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
            throw Error(E(137, e));
        if (t.dangerouslySetInnerHTML != null) {
            if (t.children != null) throw Error(E(60));
            if (
                typeof t.dangerouslySetInnerHTML != "object" ||
                !("__html" in t.dangerouslySetInnerHTML)
            )
                throw Error(E(61));
        }
        if (t.style != null && typeof t.style != "object") throw Error(E(62));
    }
}
function gs(e, t) {
    if (e.indexOf("-") === -1) return typeof t.is == "string";
    switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0;
    }
}
var ys = null;
function _l(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var vs = null,
    En = null,
    kn = null;
function ju(e) {
    if ((e = Ur(e))) {
        if (typeof vs != "function") throw Error(E(280));
        var t = e.stateNode;
        t && ((t = ni(t)), vs(e.stateNode, e.type, t));
    }
}
function Tc(e) {
    En ? (kn ? kn.push(e) : (kn = [e])) : (En = e);
}
function Rc() {
    if (En) {
        var e = En,
            t = kn;
        if (((kn = En = null), ju(e), t))
            for (e = 0; e < t.length; e++) ju(t[e]);
    }
}
function Pc(e, t) {
    return e(t);
}
function Ic() {}
var Pi = !1;
function Ac(e, t, n) {
    if (Pi) return e(t, n);
    Pi = !0;
    try {
        return Pc(e, t, n);
    } finally {
        ((Pi = !1), (En !== null || kn !== null) && (Ic(), Rc()));
    }
}
function wr(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = ni(n);
    if (r === null) return null;
    n = r[t];
    e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            ((r = !r.disabled) ||
                ((e = e.type),
                (r = !(
                    e === "button" ||
                    e === "input" ||
                    e === "select" ||
                    e === "textarea"
                ))),
                (e = !r));
            break e;
        default:
            e = !1;
    }
    if (e) return null;
    if (n && typeof n != "function") throw Error(E(231, t, typeof n));
    return n;
}
var Ss = !1;
if (st)
    try {
        var Qn = {};
        (Object.defineProperty(Qn, "passive", {
            get: function () {
                Ss = !0;
            },
        }),
            window.addEventListener("test", Qn, Qn),
            window.removeEventListener("test", Qn, Qn));
    } catch {
        Ss = !1;
    }
function ym(e, t, n, r, o, i, s, l, u) {
    var a = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, a);
    } catch (m) {
        this.onError(m);
    }
}
var ur = !1,
    No = null,
    To = !1,
    ws = null,
    vm = {
        onError: function (e) {
            ((ur = !0), (No = e));
        },
    };
function Sm(e, t, n, r, o, i, s, l, u) {
    ((ur = !1), (No = null), ym.apply(vm, arguments));
}
function wm(e, t, n, r, o, i, s, l, u) {
    if ((Sm.apply(this, arguments), ur)) {
        if (ur) {
            var a = No;
            ((ur = !1), (No = null));
        } else throw Error(E(198));
        To || ((To = !0), (ws = a));
    }
}
function rn(e) {
    var t = e,
        n = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
    }
    return t.tag === 3 ? n : null;
}
function Oc(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if (
            (t === null &&
                ((e = e.alternate), e !== null && (t = e.memoizedState)),
            t !== null)
        )
            return t.dehydrated;
    }
    return null;
}
function Mu(e) {
    if (rn(e) !== e) throw Error(E(188));
}
function _m(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = rn(e)), t === null)) throw Error(E(188));
        return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
        var o = n.return;
        if (o === null) break;
        var i = o.alternate;
        if (i === null) {
            if (((r = o.return), r !== null)) {
                n = r;
                continue;
            }
            break;
        }
        if (o.child === i.child) {
            for (i = o.child; i; ) {
                if (i === n) return (Mu(o), e);
                if (i === r) return (Mu(o), t);
                i = i.sibling;
            }
            throw Error(E(188));
        }
        if (n.return !== r.return) ((n = o), (r = i));
        else {
            for (var s = !1, l = o.child; l; ) {
                if (l === n) {
                    ((s = !0), (n = o), (r = i));
                    break;
                }
                if (l === r) {
                    ((s = !0), (r = o), (n = i));
                    break;
                }
                l = l.sibling;
            }
            if (!s) {
                for (l = i.child; l; ) {
                    if (l === n) {
                        ((s = !0), (n = i), (r = o));
                        break;
                    }
                    if (l === r) {
                        ((s = !0), (r = i), (n = o));
                        break;
                    }
                    l = l.sibling;
                }
                if (!s) throw Error(E(189));
            }
        }
        if (n.alternate !== r) throw Error(E(190));
    }
    if (n.tag !== 3) throw Error(E(188));
    return n.stateNode.current === n ? e : t;
}
function Lc(e) {
    return ((e = _m(e)), e !== null ? jc(e) : null);
}
function jc(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = jc(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var Mc = Ne.unstable_scheduleCallback,
    Du = Ne.unstable_cancelCallback,
    xm = Ne.unstable_shouldYield,
    Em = Ne.unstable_requestPaint,
    X = Ne.unstable_now,
    km = Ne.unstable_getCurrentPriorityLevel,
    xl = Ne.unstable_ImmediatePriority,
    Dc = Ne.unstable_UserBlockingPriority,
    Ro = Ne.unstable_NormalPriority,
    Cm = Ne.unstable_LowPriority,
    bc = Ne.unstable_IdlePriority,
    Zo = null,
    Xe = null;
function Nm(e) {
    if (Xe && typeof Xe.onCommitFiberRoot == "function")
        try {
            Xe.onCommitFiberRoot(
                Zo,
                e,
                void 0,
                (e.current.flags & 128) === 128
            );
        } catch {
            /* Ignore errors */
        }
}
var Be = Math.clz32 ? Math.clz32 : Pm,
    Tm = Math.log,
    Rm = Math.LN2;
function Pm(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Tm(e) / Rm) | 0)) | 0);
}
var Xr = 64,
    Jr = 4194304;
function ir(e) {
    switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 4194240;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return e & 130023424;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 1073741824;
        default:
            return e;
    }
}
function Po(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        o = e.suspendedLanes,
        i = e.pingedLanes,
        s = n & 268435455;
    if (s !== 0) {
        var l = s & ~o;
        l !== 0 ? (r = ir(l)) : ((i &= s), i !== 0 && (r = ir(i)));
    } else ((s = n & ~o), s !== 0 ? (r = ir(s)) : i !== 0 && (r = ir(i)));
    if (r === 0) return 0;
    if (
        t !== 0 &&
        t !== r &&
        !(t & o) &&
        ((o = r & -r),
        (i = t & -t),
        o >= i || (o === 16 && (i & 4194240) !== 0))
    )
        return t;
    if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
        for (e = e.entanglements, t &= r; 0 < t; )
            ((n = 31 - Be(t)), (o = 1 << n), (r |= e[n]), (t &= ~o));
    return r;
}
function Im(e, t) {
    switch (e) {
        case 1:
        case 2:
        case 4:
            return t + 250;
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return -1;
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1;
    }
}
function Am(e, t) {
    for (
        var n = e.suspendedLanes,
            r = e.pingedLanes,
            o = e.expirationTimes,
            i = e.pendingLanes;
        0 < i;
    ) {
        var s = 31 - Be(i),
            l = 1 << s,
            u = o[s];
        (u === -1
            ? (!(l & n) || l & r) && (o[s] = Im(l, t))
            : u <= t && (e.expiredLanes |= l),
            (i &= ~l));
    }
}
function _s(e) {
    return (
        (e = e.pendingLanes & -1073741825),
        e !== 0 ? e : e & 1073741824 ? 1073741824 : 0
    );
}
function zc() {
    var e = Xr;
    return ((Xr <<= 1), !(Xr & 4194240) && (Xr = 64), e);
}
function Ii(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function zr(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - Be(t)),
        (e[t] = n));
}
function Om(e, t) {
    var n = e.pendingLanes & ~t;
    ((e.pendingLanes = t),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.expiredLanes &= t),
        (e.mutableReadLanes &= t),
        (e.entangledLanes &= t),
        (t = e.entanglements));
    var r = e.eventTimes;
    for (e = e.expirationTimes; 0 < n; ) {
        var o = 31 - Be(n),
            i = 1 << o;
        ((t[o] = 0), (r[o] = -1), (e[o] = -1), (n &= ~i));
    }
}
function El(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - Be(n),
            o = 1 << r;
        ((o & t) | (e[r] & t) && (e[r] |= t), (n &= ~o));
    }
}
var z = 0;
function Fc(e) {
    return (
        (e &= -e),
        1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1
    );
}
var Uc,
    kl,
    Bc,
    $c,
    Vc,
    xs = !1,
    Zr = [],
    Et = null,
    kt = null,
    Ct = null,
    _r = new Map(),
    xr = new Map(),
    St = [],
    Lm =
        "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(
            " "
        );
function bu(e, t) {
    switch (e) {
        case "focusin":
        case "focusout":
            Et = null;
            break;
        case "dragenter":
        case "dragleave":
            kt = null;
            break;
        case "mouseover":
        case "mouseout":
            Ct = null;
            break;
        case "pointerover":
        case "pointerout":
            _r.delete(t.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            xr.delete(t.pointerId);
    }
}
function Kn(e, t, n, r, o, i) {
    return e === null || e.nativeEvent !== i
        ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: i,
              targetContainers: [o],
          }),
          t !== null && ((t = Ur(t)), t !== null && kl(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          o !== null && t.indexOf(o) === -1 && t.push(o),
          e);
}
function jm(e, t, n, r, o) {
    switch (t) {
        case "focusin":
            return ((Et = Kn(Et, e, t, n, r, o)), !0);
        case "dragenter":
            return ((kt = Kn(kt, e, t, n, r, o)), !0);
        case "mouseover":
            return ((Ct = Kn(Ct, e, t, n, r, o)), !0);
        case "pointerover":
            var i = o.pointerId;
            return (_r.set(i, Kn(_r.get(i) || null, e, t, n, r, o)), !0);
        case "gotpointercapture":
            return (
                (i = o.pointerId),
                xr.set(i, Kn(xr.get(i) || null, e, t, n, r, o)),
                !0
            );
    }
    return !1;
}
function Wc(e) {
    var t = $t(e.target);
    if (t !== null) {
        var n = rn(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = Oc(n)), t !== null)) {
                    ((e.blockedOn = t),
                        Vc(e.priority, function () {
                            Bc(n);
                        }));
                    return;
                }
            } else if (
                t === 3 &&
                n.stateNode.current.memoizedState.isDehydrated
            ) {
                e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                return;
            }
        }
    }
    e.blockedOn = null;
}
function mo(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = Es(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((ys = r), n.target.dispatchEvent(r), (ys = null));
        } else return ((t = Ur(n)), t !== null && kl(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function zu(e, t, n) {
    mo(e) && n.delete(t);
}
function Mm() {
    ((xs = !1),
        Et !== null && mo(Et) && (Et = null),
        kt !== null && mo(kt) && (kt = null),
        Ct !== null && mo(Ct) && (Ct = null),
        _r.forEach(zu),
        xr.forEach(zu));
}
function Yn(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        xs ||
            ((xs = !0),
            Ne.unstable_scheduleCallback(Ne.unstable_NormalPriority, Mm)));
}
function Er(e) {
    function t(o) {
        return Yn(o, e);
    }
    if (0 < Zr.length) {
        Yn(Zr[0], e);
        for (var n = 1; n < Zr.length; n++) {
            var r = Zr[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        Et !== null && Yn(Et, e),
            kt !== null && Yn(kt, e),
            Ct !== null && Yn(Ct, e),
            _r.forEach(t),
            xr.forEach(t),
            n = 0;
        n < St.length;
        n++
    )
        ((r = St[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < St.length && ((n = St[0]), n.blockedOn === null); )
        (Wc(n), n.blockedOn === null && St.shift());
}
var Cn = dt.ReactCurrentBatchConfig,
    Io = !0;
function Dm(e, t, n, r) {
    var o = z,
        i = Cn.transition;
    Cn.transition = null;
    try {
        ((z = 1), Cl(e, t, n, r));
    } finally {
        ((z = o), (Cn.transition = i));
    }
}
function bm(e, t, n, r) {
    var o = z,
        i = Cn.transition;
    Cn.transition = null;
    try {
        ((z = 4), Cl(e, t, n, r));
    } finally {
        ((z = o), (Cn.transition = i));
    }
}
function Cl(e, t, n, r) {
    if (Io) {
        var o = Es(e, t, n, r);
        if (o === null) (Ui(e, t, r, Ao, n), bu(e, r));
        else if (jm(o, e, t, n, r)) r.stopPropagation();
        else if ((bu(e, r), t & 4 && -1 < Lm.indexOf(e))) {
            for (; o !== null; ) {
                var i = Ur(o);
                if (
                    (i !== null && Uc(i),
                    (i = Es(e, t, n, r)),
                    i === null && Ui(e, t, r, Ao, n),
                    i === o)
                )
                    break;
                o = i;
            }
            o !== null && r.stopPropagation();
        } else Ui(e, t, r, null, n);
    }
}
var Ao = null;
function Es(e, t, n, r) {
    if (((Ao = null), (e = _l(r)), (e = $t(e)), e !== null))
        if (((t = rn(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = Oc(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((Ao = e), null);
}
function Gc(e) {
    switch (e) {
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 1;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "toggle":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 4;
        case "message":
            switch (km()) {
                case xl:
                    return 1;
                case Dc:
                    return 4;
                case Ro:
                case Cm:
                    return 16;
                case bc:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var _t = null,
    Nl = null,
    ho = null;
function Hc() {
    if (ho) return ho;
    var e,
        t = Nl,
        n = t.length,
        r,
        o = "value" in _t ? _t.value : _t.textContent,
        i = o.length;
    for (e = 0; e < n && t[e] === o[e]; e++);
    var s = n - e;
    for (r = 1; r <= s && t[n - r] === o[i - r]; r++);
    return (ho = o.slice(e, 1 < r ? 1 - r : void 0));
}
function go(e) {
    var t = e.keyCode;
    return (
        "charCode" in e
            ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
            : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    );
}
function qr() {
    return !0;
}
function Fu() {
    return !1;
}
function Re(e) {
    function t(n, r, o, i, s) {
        ((this._reactName = n),
            (this._targetInst = o),
            (this.type = r),
            (this.nativeEvent = i),
            (this.target = s),
            (this.currentTarget = null));
        for (var l in e)
            e.hasOwnProperty(l) && ((n = e[l]), (this[l] = n ? n(i) : i[l]));
        return (
            (this.isDefaultPrevented = (
                i.defaultPrevented != null
                    ? i.defaultPrevented
                    : i.returnValue === !1
            )
                ? qr
                : Fu),
            (this.isPropagationStopped = Fu),
            this
        );
    }
    return (
        K(t.prototype, {
            preventDefault: function () {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n &&
                    (n.preventDefault
                        ? n.preventDefault()
                        : typeof n.returnValue != "unknown" &&
                          (n.returnValue = !1),
                    (this.isDefaultPrevented = qr));
            },
            stopPropagation: function () {
                var n = this.nativeEvent;
                n &&
                    (n.stopPropagation
                        ? n.stopPropagation()
                        : typeof n.cancelBubble != "unknown" &&
                          (n.cancelBubble = !0),
                    (this.isPropagationStopped = qr));
            },
            persist: function () {},
            isPersistent: qr,
        }),
        t
    );
}
var Bn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    Tl = Re(Bn),
    Fr = K({}, Bn, { view: 0, detail: 0 }),
    zm = Re(Fr),
    Ai,
    Oi,
    Xn,
    qo = K({}, Fr, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Rl,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
            return e.relatedTarget === void 0
                ? e.fromElement === e.srcElement
                    ? e.toElement
                    : e.fromElement
                : e.relatedTarget;
        },
        movementX: function (e) {
            return "movementX" in e
                ? e.movementX
                : (e !== Xn &&
                      (Xn && e.type === "mousemove"
                          ? ((Ai = e.screenX - Xn.screenX),
                            (Oi = e.screenY - Xn.screenY))
                          : (Oi = Ai = 0),
                      (Xn = e)),
                  Ai);
        },
        movementY: function (e) {
            return "movementY" in e ? e.movementY : Oi;
        },
    }),
    Uu = Re(qo),
    Fm = K({}, qo, { dataTransfer: 0 }),
    Um = Re(Fm),
    Bm = K({}, Fr, { relatedTarget: 0 }),
    Li = Re(Bm),
    $m = K({}, Bn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Vm = Re($m),
    Wm = K({}, Bn, {
        clipboardData: function (e) {
            return "clipboardData" in e
                ? e.clipboardData
                : window.clipboardData;
        },
    }),
    Gm = Re(Wm),
    Hm = K({}, Bn, { data: 0 }),
    Bu = Re(Hm),
    Qm = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified",
    },
    Km = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta",
    },
    Ym = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey",
    };
function Xm(e) {
    var t = this.nativeEvent;
    return t.getModifierState
        ? t.getModifierState(e)
        : (e = Ym[e])
          ? !!t[e]
          : !1;
}
function Rl() {
    return Xm;
}
var Jm = K({}, Fr, {
        key: function (e) {
            if (e.key) {
                var t = Qm[e.key] || e.key;
                if (t !== "Unidentified") return t;
            }
            return e.type === "keypress"
                ? ((e = go(e)), e === 13 ? "Enter" : String.fromCharCode(e))
                : e.type === "keydown" || e.type === "keyup"
                  ? Km[e.keyCode] || "Unidentified"
                  : "";
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: Rl,
        charCode: function (e) {
            return e.type === "keypress" ? go(e) : 0;
        },
        keyCode: function (e) {
            return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === "keypress"
                ? go(e)
                : e.type === "keydown" || e.type === "keyup"
                  ? e.keyCode
                  : 0;
        },
    }),
    Zm = Re(Jm),
    qm = K({}, qo, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0,
    }),
    $u = Re(qm),
    eh = K({}, Fr, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: Rl,
    }),
    th = Re(eh),
    nh = K({}, Bn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    rh = Re(nh),
    oh = K({}, qo, {
        deltaX: function (e) {
            return "deltaX" in e
                ? e.deltaX
                : "wheelDeltaX" in e
                  ? -e.wheelDeltaX
                  : 0;
        },
        deltaY: function (e) {
            return "deltaY" in e
                ? e.deltaY
                : "wheelDeltaY" in e
                  ? -e.wheelDeltaY
                  : "wheelDelta" in e
                    ? -e.wheelDelta
                    : 0;
        },
        deltaZ: 0,
        deltaMode: 0,
    }),
    ih = Re(oh),
    sh = [
        9,
        13,
        27,
        32,
    ],
    Pl = st && "CompositionEvent" in window,
    ar = null;
st && "documentMode" in document && (ar = document.documentMode);
var lh = st && "TextEvent" in window && !ar,
    Qc = st && (!Pl || (ar && 8 < ar && 11 >= ar)),
    Vu = " ",
    Wu = !1;
function Kc(e, t) {
    switch (e) {
        case "keyup":
            return sh.indexOf(t.keyCode) !== -1;
        case "keydown":
            return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1;
    }
}
function Yc(e) {
    return (
        (e = e.detail),
        typeof e == "object" && "data" in e ? e.data : null
    );
}
var dn = !1;
function uh(e, t) {
    switch (e) {
        case "compositionend":
            return Yc(t);
        case "keypress":
            return t.which !== 32 ? null : ((Wu = !0), Vu);
        case "textInput":
            return ((e = t.data), e === Vu && Wu ? null : e);
        default:
            return null;
    }
}
function ah(e, t) {
    if (dn)
        return e === "compositionend" || (!Pl && Kc(e, t))
            ? ((e = Hc()), (ho = Nl = _t = null), (dn = !1), e)
            : null;
    switch (e) {
        case "paste":
            return null;
        case "keypress":
            if (
                !(t.ctrlKey || t.altKey || t.metaKey) ||
                (t.ctrlKey && t.altKey)
            ) {
                if (t.char && 1 < t.char.length) return t.char;
                if (t.which) return String.fromCharCode(t.which);
            }
            return null;
        case "compositionend":
            return Qc && t.locale !== "ko" ? null : t.data;
        default:
            return null;
    }
}
var ch = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
};
function Gu(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!ch[e.type] : t === "textarea";
}
function Xc(e, t, n, r) {
    (Tc(r),
        (t = Oo(t, "onChange")),
        0 < t.length &&
            ((n = new Tl("onChange", "change", null, n, r)),
            e.push({ event: n, listeners: t })));
}
var cr = null,
    kr = null;
function dh(e) {
    ld(e, 0);
}
function ei(e) {
    var t = mn(e);
    if (wc(t)) return e;
}
function fh(e, t) {
    if (e === "change") return t;
}
var Jc = !1;
if (st) {
    var ji;
    if (st) {
        var Mi = "oninput" in document;
        if (!Mi) {
            var Hu = document.createElement("div");
            (Hu.setAttribute("oninput", "return;"),
                (Mi = typeof Hu.oninput == "function"));
        }
        ji = Mi;
    } else ji = !1;
    Jc = ji && (!document.documentMode || 9 < document.documentMode);
}
function Qu() {
    cr && (cr.detachEvent("onpropertychange", Zc), (kr = cr = null));
}
function Zc(e) {
    if (e.propertyName === "value" && ei(kr)) {
        var t = [];
        (Xc(t, kr, e, _l(e)), Ac(dh, t));
    }
}
function ph(e, t, n) {
    e === "focusin"
        ? (Qu(), (cr = t), (kr = n), cr.attachEvent("onpropertychange", Zc))
        : e === "focusout" && Qu();
}
function mh(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown")
        return ei(kr);
}
function hh(e, t) {
    if (e === "click") return ei(t);
}
function gh(e, t) {
    if (e === "input" || e === "change") return ei(t);
}
function yh(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Ve = typeof Object.is == "function" ? Object.is : yh;
function Cr(e, t) {
    if (Ve(e, t)) return !0;
    if (
        typeof e != "object" ||
        e === null ||
        typeof t != "object" ||
        t === null
    )
        return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var o = n[r];
        if (!is.call(t, o) || !Ve(e[o], t[o])) return !1;
    }
    return !0;
}
function Ku(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function Yu(e, t) {
    var n = Ku(e);
    e = 0;
    for (var r; n; ) {
        if (n.nodeType === 3) {
            if (((r = e + n.textContent.length), e <= t && r >= t))
                return { node: n, offset: t - e };
            e = r;
        }
        e: {
            for (; n; ) {
                if (n.nextSibling) {
                    n = n.nextSibling;
                    break e;
                }
                n = n.parentNode;
            }
            n = void 0;
        }
        n = Ku(n);
    }
}
function qc(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? qc(e, t.parentNode)
                : "contains" in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function ed() {
    for (var e = window, t = Co(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == "string";
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Co(e.document);
    }
    return t;
}
function Il(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return (
        t &&
        ((t === "input" &&
            (e.type === "text" ||
                e.type === "search" ||
                e.type === "tel" ||
                e.type === "url" ||
                e.type === "password")) ||
            t === "textarea" ||
            e.contentEditable === "true")
    );
}
function vh(e) {
    var t = ed(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (
        t !== n &&
        n &&
        n.ownerDocument &&
        qc(n.ownerDocument.documentElement, n)
    ) {
        if (r !== null && Il(n)) {
            if (
                ((t = r.start),
                (e = r.end),
                e === void 0 && (e = t),
                "selectionStart" in n)
            )
                ((n.selectionStart = t),
                    (n.selectionEnd = Math.min(e, n.value.length)));
            else if (
                ((e =
                    ((t = n.ownerDocument || document) && t.defaultView) ||
                    window),
                e.getSelection)
            ) {
                e = e.getSelection();
                var o = n.textContent.length,
                    i = Math.min(r.start, o);
                ((r = r.end === void 0 ? i : Math.min(r.end, o)),
                    !e.extend && i > r && ((o = r), (r = i), (i = o)),
                    (o = Yu(n, i)));
                var s = Yu(n, r);
                o &&
                    s &&
                    (e.rangeCount !== 1 ||
                        e.anchorNode !== o.node ||
                        e.anchorOffset !== o.offset ||
                        e.focusNode !== s.node ||
                        e.focusOffset !== s.offset) &&
                    ((t = t.createRange()),
                    t.setStart(o.node, o.offset),
                    e.removeAllRanges(),
                    i > r
                        ? (e.addRange(t), e.extend(s.node, s.offset))
                        : (t.setEnd(s.node, s.offset), e.addRange(t)));
            }
        }
        for (t = [], e = n; (e = e.parentNode); )
            e.nodeType === 1 &&
                t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
        for (
            typeof n.focus == "function" && n.focus(), n = 0;
            n < t.length;
            n++
        )
            ((e = t[n]),
                (e.element.scrollLeft = e.left),
                (e.element.scrollTop = e.top));
    }
}
var Sh = st && "documentMode" in document && 11 >= document.documentMode,
    fn = null,
    ks = null,
    dr = null,
    Cs = !1;
function Xu(e, t, n) {
    var r =
        n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    Cs ||
        fn == null ||
        fn !== Co(r) ||
        ((r = fn),
        "selectionStart" in r && Il(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = (
                  (r.ownerDocument && r.ownerDocument.defaultView) ||
                  window
              ).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (dr && Cr(dr, r)) ||
            ((dr = r),
            (r = Oo(ks, "onSelect")),
            0 < r.length &&
                ((t = new Tl("onSelect", "select", null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = fn))));
}
function eo(e, t) {
    var n = {};
    return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n["Webkit" + e] = "webkit" + t),
        (n["Moz" + e] = "moz" + t),
        n
    );
}
var pn = {
        animationend: eo("Animation", "AnimationEnd"),
        animationiteration: eo("Animation", "AnimationIteration"),
        animationstart: eo("Animation", "AnimationStart"),
        transitionend: eo("Transition", "TransitionEnd"),
    },
    Di = {},
    td = {};
st &&
    ((td = document.createElement("div").style),
    "AnimationEvent" in window ||
        (delete pn.animationend.animation,
        delete pn.animationiteration.animation,
        delete pn.animationstart.animation),
    "TransitionEvent" in window || delete pn.transitionend.transition);
function ti(e) {
    if (Di[e]) return Di[e];
    if (!pn[e]) return e;
    var t = pn[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in td) return (Di[e] = t[n]);
    return e;
}
var nd = ti("animationend"),
    rd = ti("animationiteration"),
    od = ti("animationstart"),
    id = ti("transitionend"),
    sd = new Map(),
    Ju =
        "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
            " "
        );
function jt(e, t) {
    (sd.set(e, t), nn(t, [e]));
}
for (var bi = 0; bi < Ju.length; bi++) {
    var zi = Ju[bi],
        wh = zi.toLowerCase(),
        _h = zi[0].toUpperCase() + zi.slice(1);
    jt(wh, "on" + _h);
}
jt(nd, "onAnimationEnd");
jt(rd, "onAnimationIteration");
jt(od, "onAnimationStart");
jt("dblclick", "onDoubleClick");
jt("focusin", "onFocus");
jt("focusout", "onBlur");
jt(id, "onTransitionEnd");
An("onMouseEnter", ["mouseout", "mouseover"]);
An("onMouseLeave", ["mouseout", "mouseover"]);
An("onPointerEnter", ["pointerout", "pointerover"]);
An("onPointerLeave", ["pointerout", "pointerover"]);
nn(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(
        " "
    )
);
nn(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
        " "
    )
);
nn("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste",
]);
nn(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
);
nn(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
);
nn(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
);
var sr =
        "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
            " "
        ),
    xh = new Set(
        "cancel close invalid load scroll toggle".split(" ").concat(sr)
    );
function Zu(e, t, n) {
    var r = e.type || "unknown-event";
    ((e.currentTarget = n), wm(r, t, void 0, e), (e.currentTarget = null));
}
function ld(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
        var r = e[n],
            o = r.event;
        r = r.listeners;
        e: {
            var i = void 0;
            if (t)
                for (var s = r.length - 1; 0 <= s; s--) {
                    var l = r[s],
                        u = l.instance,
                        a = l.currentTarget;
                    if (((l = l.listener), u !== i && o.isPropagationStopped()))
                        break e;
                    (Zu(o, l, a), (i = u));
                }
            else
                for (s = 0; s < r.length; s++) {
                    if (
                        ((l = r[s]),
                        (u = l.instance),
                        (a = l.currentTarget),
                        (l = l.listener),
                        u !== i && o.isPropagationStopped())
                    )
                        break e;
                    (Zu(o, l, a), (i = u));
                }
        }
    }
    if (To) throw ((e = ws), (To = !1), (ws = null), e);
}
function V(e, t) {
    var n = t[Is];
    n === void 0 && (n = t[Is] = new Set());
    var r = e + "__bubble";
    n.has(r) || (ud(t, e, 2, !1), n.add(r));
}
function Fi(e, t, n) {
    var r = 0;
    (t && (r |= 4), ud(n, e, r, t));
}
var to = "_reactListening" + Math.random().toString(36).slice(2);
function Nr(e) {
    if (!e[to]) {
        ((e[to] = !0),
            hc.forEach(function (n) {
                n !== "selectionchange" &&
                    (xh.has(n) || Fi(n, !1, e), Fi(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[to] || ((t[to] = !0), Fi("selectionchange", !1, t));
    }
}
function ud(e, t, n, r) {
    switch (Gc(t)) {
        case 1:
            var o = Dm;
            break;
        case 4:
            o = bm;
            break;
        default:
            o = Cl;
    }
    ((n = o.bind(null, t, n, e)),
        (o = void 0),
        !Ss ||
            (t !== "touchstart" && t !== "touchmove" && t !== "wheel") ||
            (o = !0),
        r
            ? o !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: o })
                : e.addEventListener(t, n, !0)
            : o !== void 0
              ? e.addEventListener(t, n, { passive: o })
              : e.addEventListener(t, n, !1));
}
function Ui(e, t, n, r, o) {
    var i = r;
    if (!(t & 1) && !(t & 2) && r !== null)
        e: for (;;) {
            if (r === null) return;
            var s = r.tag;
            if (s === 3 || s === 4) {
                var l = r.stateNode.containerInfo;
                if (l === o || (l.nodeType === 8 && l.parentNode === o)) break;
                if (s === 4)
                    for (s = r.return; s !== null; ) {
                        var u = s.tag;
                        if (
                            (u === 3 || u === 4) &&
                            ((u = s.stateNode.containerInfo),
                            u === o || (u.nodeType === 8 && u.parentNode === o))
                        )
                            return;
                        s = s.return;
                    }
                for (; l !== null; ) {
                    if (((s = $t(l)), s === null)) return;
                    if (((u = s.tag), u === 5 || u === 6)) {
                        r = i = s;
                        continue e;
                    }
                    l = l.parentNode;
                }
            }
            r = r.return;
        }
    Ac(function () {
        var a = i,
            m = _l(n),
            f = [];
        e: {
            var h = sd.get(e);
            if (h !== void 0) {
                var g = Tl,
                    y = e;
                switch (e) {
                    case "keypress":
                        if (go(n) === 0) break e;
                    case "keydown":
                    case "keyup":
                        g = Zm;
                        break;
                    case "focusin":
                        ((y = "focus"), (g = Li));
                        break;
                    case "focusout":
                        ((y = "blur"), (g = Li));
                        break;
                    case "beforeblur":
                    case "afterblur":
                        g = Li;
                        break;
                    case "click":
                        if (n.button === 2) break e;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        g = Uu;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        g = Um;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        g = th;
                        break;
                    case nd:
                    case rd:
                    case od:
                        g = Vm;
                        break;
                    case id:
                        g = rh;
                        break;
                    case "scroll":
                        g = zm;
                        break;
                    case "wheel":
                        g = ih;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        g = Gm;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        g = $u;
                }
                var S = (t & 4) !== 0,
                    x = !S && e === "scroll",
                    d = S ? (h !== null ? h + "Capture" : null) : h;
                S = [];
                for (var c = a, p; c !== null; ) {
                    p = c;
                    var _ = p.stateNode;
                    if (
                        (p.tag === 5 &&
                            _ !== null &&
                            ((p = _),
                            d !== null &&
                                ((_ = wr(c, d)),
                                _ != null && S.push(Tr(c, _, p)))),
                        x)
                    )
                        break;
                    c = c.return;
                }
                0 < S.length &&
                    ((h = new g(h, y, null, n, m)),
                    f.push({ event: h, listeners: S }));
            }
        }
        if (!(t & 7)) {
            e: {
                if (
                    ((h = e === "mouseover" || e === "pointerover"),
                    (g = e === "mouseout" || e === "pointerout"),
                    h &&
                        n !== ys &&
                        (y = n.relatedTarget || n.fromElement) &&
                        ($t(y) || y[lt]))
                )
                    break e;
                if (
                    (g || h) &&
                    ((h =
                        m.window === m
                            ? m
                            : (h = m.ownerDocument)
                              ? h.defaultView || h.parentWindow
                              : window),
                    g
                        ? ((y = n.relatedTarget || n.toElement),
                          (g = a),
                          (y = y ? $t(y) : null),
                          y !== null &&
                              ((x = rn(y)),
                              y !== x || (y.tag !== 5 && y.tag !== 6)) &&
                              (y = null))
                        : ((g = null), (y = a)),
                    g !== y)
                ) {
                    if (
                        ((S = Uu),
                        (_ = "onMouseLeave"),
                        (d = "onMouseEnter"),
                        (c = "mouse"),
                        (e === "pointerout" || e === "pointerover") &&
                            ((S = $u),
                            (_ = "onPointerLeave"),
                            (d = "onPointerEnter"),
                            (c = "pointer")),
                        (x = g == null ? h : mn(g)),
                        (p = y == null ? h : mn(y)),
                        (h = new S(_, c + "leave", g, n, m)),
                        (h.target = x),
                        (h.relatedTarget = p),
                        (_ = null),
                        $t(m) === a &&
                            ((S = new S(d, c + "enter", y, n, m)),
                            (S.target = p),
                            (S.relatedTarget = x),
                            (_ = S)),
                        (x = _),
                        g && y)
                    )
                        t: {
                            for (S = g, d = y, c = 0, p = S; p; p = un(p)) c++;
                            for (p = 0, _ = d; _; _ = un(_)) p++;
                            for (; 0 < c - p; ) ((S = un(S)), c--);
                            for (; 0 < p - c; ) ((d = un(d)), p--);
                            for (; c--; ) {
                                if (
                                    S === d ||
                                    (d !== null && S === d.alternate)
                                )
                                    break t;
                                ((S = un(S)), (d = un(d)));
                            }
                            S = null;
                        }
                    else S = null;
                    (g !== null && qu(f, h, g, S, !1),
                        y !== null && x !== null && qu(f, x, y, S, !0));
                }
            }
            e: {
                if (
                    ((h = a ? mn(a) : window),
                    (g = h.nodeName && h.nodeName.toLowerCase()),
                    g === "select" || (g === "input" && h.type === "file"))
                )
                    var k = fh;
                else if (Gu(h))
                    if (Jc) k = gh;
                    else {
                        k = mh;
                        var T = ph;
                    }
                else
                    (g = h.nodeName) &&
                        g.toLowerCase() === "input" &&
                        (h.type === "checkbox" || h.type === "radio") &&
                        (k = hh);
                if (k && (k = k(e, a))) {
                    Xc(f, k, n, m);
                    break e;
                }
                (T && T(e, h, a),
                    e === "focusout" &&
                        (T = h._wrapperState) &&
                        T.controlled &&
                        h.type === "number" &&
                        fs(h, "number", h.value));
            }
            switch (((T = a ? mn(a) : window), e)) {
                case "focusin":
                    (Gu(T) || T.contentEditable === "true") &&
                        ((fn = T), (ks = a), (dr = null));
                    break;
                case "focusout":
                    dr = ks = fn = null;
                    break;
                case "mousedown":
                    Cs = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    ((Cs = !1), Xu(f, n, m));
                    break;
                case "selectionchange":
                    if (Sh) break;
                case "keydown":
                case "keyup":
                    Xu(f, n, m);
            }
            var P;
            if (Pl)
                e: {
                    switch (e) {
                        case "compositionstart":
                            var C = "onCompositionStart";
                            break e;
                        case "compositionend":
                            C = "onCompositionEnd";
                            break e;
                        case "compositionupdate":
                            C = "onCompositionUpdate";
                            break e;
                    }
                    C = void 0;
                }
            else
                dn
                    ? Kc(e, n) && (C = "onCompositionEnd")
                    : e === "keydown" &&
                      n.keyCode === 229 &&
                      (C = "onCompositionStart");
            (C &&
                (Qc &&
                    n.locale !== "ko" &&
                    (dn || C !== "onCompositionStart"
                        ? C === "onCompositionEnd" && dn && (P = Hc())
                        : ((_t = m),
                          (Nl = "value" in _t ? _t.value : _t.textContent),
                          (dn = !0))),
                (T = Oo(a, C)),
                0 < T.length &&
                    ((C = new Bu(C, e, null, n, m)),
                    f.push({ event: C, listeners: T }),
                    P
                        ? (C.data = P)
                        : ((P = Yc(n)), P !== null && (C.data = P)))),
                (P = lh ? uh(e, n) : ah(e, n)) &&
                    ((a = Oo(a, "onBeforeInput")),
                    0 < a.length &&
                        ((m = new Bu(
                            "onBeforeInput",
                            "beforeinput",
                            null,
                            n,
                            m
                        )),
                        f.push({ event: m, listeners: a }),
                        (m.data = P))));
        }
        ld(f, t);
    });
}
function Tr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function Oo(e, t) {
    for (var n = t + "Capture", r = []; e !== null; ) {
        var o = e,
            i = o.stateNode;
        (o.tag === 5 &&
            i !== null &&
            ((o = i),
            (i = wr(e, n)),
            i != null && r.unshift(Tr(e, i, o)),
            (i = wr(e, t)),
            i != null && r.push(Tr(e, i, o))),
            (e = e.return));
    }
    return r;
}
function un(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function qu(e, t, n, r, o) {
    for (var i = t._reactName, s = []; n !== null && n !== r; ) {
        var l = n,
            u = l.alternate,
            a = l.stateNode;
        if (u !== null && u === r) break;
        (l.tag === 5 &&
            a !== null &&
            ((l = a),
            o
                ? ((u = wr(n, i)), u != null && s.unshift(Tr(n, u, l)))
                : o || ((u = wr(n, i)), u != null && s.push(Tr(n, u, l)))),
            (n = n.return));
    }
    s.length !== 0 && e.push({ event: t, listeners: s });
}
var Eh = /\r\n?/g,
    kh = /\u0000|\uFFFD/g;
function ea(e) {
    return (typeof e == "string" ? e : "" + e)
        .replace(
            Eh,
            `
`
        )
        .replace(kh, "");
}
function no(e, t, n) {
    if (((t = ea(t)), ea(e) !== t && n)) throw Error(E(425));
}
function Lo() {}
var Ns = null,
    Ts = null;
function Rs(e, t) {
    return (
        e === "textarea" ||
        e === "noscript" ||
        typeof t.children == "string" ||
        typeof t.children == "number" ||
        (typeof t.dangerouslySetInnerHTML == "object" &&
            t.dangerouslySetInnerHTML !== null &&
            t.dangerouslySetInnerHTML.__html != null)
    );
}
var Ps = typeof setTimeout == "function" ? setTimeout : void 0,
    Ch = typeof clearTimeout == "function" ? clearTimeout : void 0,
    ta = typeof Promise == "function" ? Promise : void 0,
    Nh =
        typeof queueMicrotask == "function"
            ? queueMicrotask
            : typeof ta < "u"
              ? function (e) {
                    return ta.resolve(null).then(e).catch(Th);
                }
              : Ps;
function Th(e) {
    setTimeout(function () {
        throw e;
    });
}
function Bi(e, t) {
    var n = t,
        r = 0;
    do {
        var o = n.nextSibling;
        if ((e.removeChild(n), o && o.nodeType === 8))
            if (((n = o.data), n === "/$")) {
                if (r === 0) {
                    (e.removeChild(o), Er(t));
                    return;
                }
                r--;
            } else (n !== "$" && n !== "$?" && n !== "$!") || r++;
        n = o;
    } while (n);
    Er(t);
}
function Nt(e) {
    for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
            if (((t = e.data), t === "$" || t === "$!" || t === "$?")) break;
            if (t === "/$") return null;
        }
    }
    return e;
}
function na(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
        if (e.nodeType === 8) {
            var n = e.data;
            if (n === "$" || n === "$!" || n === "$?") {
                if (t === 0) return e;
                t--;
            } else n === "/$" && t++;
        }
        e = e.previousSibling;
    }
    return null;
}
var $n = Math.random().toString(36).slice(2),
    Ke = "__reactFiber$" + $n,
    Rr = "__reactProps$" + $n,
    lt = "__reactContainer$" + $n,
    Is = "__reactEvents$" + $n,
    Rh = "__reactListeners$" + $n,
    Ph = "__reactHandles$" + $n;
function $t(e) {
    var t = e[Ke];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[lt] || n[Ke])) {
            if (
                ((n = t.alternate),
                t.child !== null || (n !== null && n.child !== null))
            )
                for (e = na(e); e !== null; ) {
                    if ((n = e[Ke])) return n;
                    e = na(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function Ur(e) {
    return (
        (e = e[Ke] || e[lt]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3)
            ? null
            : e
    );
}
function mn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(E(33));
}
function ni(e) {
    return e[Rr] || null;
}
var As = [],
    hn = -1;
function Mt(e) {
    return { current: e };
}
function W(e) {
    0 > hn || ((e.current = As[hn]), (As[hn] = null), hn--);
}
function U(e, t) {
    (hn++, (As[hn] = e.current), (e.current = t));
}
var Ot = {},
    de = Mt(Ot),
    Se = Mt(!1),
    Yt = Ot;
function On(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Ot;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
        return r.__reactInternalMemoizedMaskedChildContext;
    var o = {},
        i;
    for (i in n) o[i] = t[i];
    return (
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = t),
            (e.__reactInternalMemoizedMaskedChildContext = o)),
        o
    );
}
function we(e) {
    return ((e = e.childContextTypes), e != null);
}
function jo() {
    (W(Se), W(de));
}
function ra(e, t, n) {
    if (de.current !== Ot) throw Error(E(168));
    (U(de, t), U(Se, n));
}
function ad(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != "function"))
        return n;
    r = r.getChildContext();
    for (var o in r) if (!(o in t)) throw Error(E(108, pm(e) || "Unknown", o));
    return K({}, n, r);
}
function Mo(e) {
    return (
        (e =
            ((e = e.stateNode) &&
                e.__reactInternalMemoizedMergedChildContext) ||
            Ot),
        (Yt = de.current),
        U(de, e),
        U(Se, Se.current),
        !0
    );
}
function oa(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(E(169));
    (n
        ? ((e = ad(e, t, Yt)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          W(Se),
          W(de),
          U(de, e))
        : W(Se),
        U(Se, n));
}
var nt = null,
    ri = !1,
    $i = !1;
function cd(e) {
    nt === null ? (nt = [e]) : nt.push(e);
}
function Ih(e) {
    ((ri = !0), cd(e));
}
function Dt() {
    if (!$i && nt !== null) {
        $i = !0;
        var e = 0,
            t = z;
        try {
            var n = nt;
            for (z = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((nt = null), (ri = !1));
        } catch (o) {
            throw (nt !== null && (nt = nt.slice(e + 1)), Mc(xl, Dt), o);
        } finally {
            ((z = t), ($i = !1));
        }
    }
    return null;
}
var gn = [],
    yn = 0,
    Do = null,
    bo = 0,
    Pe = [],
    Ie = 0,
    Xt = null,
    rt = 1,
    ot = "";
function Ft(e, t) {
    ((gn[yn++] = bo), (gn[yn++] = Do), (Do = e), (bo = t));
}
function dd(e, t, n) {
    ((Pe[Ie++] = rt), (Pe[Ie++] = ot), (Pe[Ie++] = Xt), (Xt = e));
    var r = rt;
    e = ot;
    var o = 32 - Be(r) - 1;
    ((r &= ~(1 << o)), (n += 1));
    var i = 32 - Be(t) + o;
    if (30 < i) {
        var s = o - (o % 5);
        ((i = (r & ((1 << s) - 1)).toString(32)),
            (r >>= s),
            (o -= s),
            (rt = (1 << (32 - Be(t) + o)) | (n << o) | r),
            (ot = i + e));
    } else ((rt = (1 << i) | (n << o) | r), (ot = e));
}
function Al(e) {
    e.return !== null && (Ft(e, 1), dd(e, 1, 0));
}
function Ol(e) {
    for (; e === Do; )
        ((Do = gn[--yn]), (gn[yn] = null), (bo = gn[--yn]), (gn[yn] = null));
    for (; e === Xt; )
        ((Xt = Pe[--Ie]),
            (Pe[Ie] = null),
            (ot = Pe[--Ie]),
            (Pe[Ie] = null),
            (rt = Pe[--Ie]),
            (Pe[Ie] = null));
}
var Ce = null,
    ke = null,
    G = !1,
    Ue = null;
function fd(e, t) {
    var n = Ae(5, null, null, 0);
    ((n.elementType = "DELETED"),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function ia(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t =
                    t.nodeType !== 1 ||
                    n.toLowerCase() !== t.nodeName.toLowerCase()
                        ? null
                        : t),
                t !== null
                    ? ((e.stateNode = t), (Ce = e), (ke = Nt(t.firstChild)), !0)
                    : !1
            );
        case 6:
            return (
                (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (Ce = e), (ke = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = Xt !== null ? { id: rt, overflow: ot } : null),
                      (e.memoizedState = {
                          dehydrated: t,
                          treeContext: n,
                          retryLane: 1073741824,
                      }),
                      (n = Ae(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (Ce = e),
                      (ke = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function Os(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Ls(e) {
    if (G) {
        var t = ke;
        if (t) {
            var n = t;
            if (!ia(e, t)) {
                if (Os(e)) throw Error(E(418));
                t = Nt(n.nextSibling);
                var r = Ce;
                t && ia(e, t)
                    ? fd(r, n)
                    : ((e.flags = (e.flags & -4097) | 2), (G = !1), (Ce = e));
            }
        } else {
            if (Os(e)) throw Error(E(418));
            ((e.flags = (e.flags & -4097) | 2), (G = !1), (Ce = e));
        }
    }
}
function sa(e) {
    for (
        e = e.return;
        e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;
    )
        e = e.return;
    Ce = e;
}
function ro(e) {
    if (e !== Ce) return !1;
    if (!G) return (sa(e), (G = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type),
            (t = t !== "head" && t !== "body" && !Rs(e.type, e.memoizedProps))),
        t && (t = ke))
    ) {
        if (Os(e)) throw (pd(), Error(E(418)));
        for (; t; ) (fd(e, t), (t = Nt(t.nextSibling)));
    }
    if ((sa(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(E(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === "/$") {
                        if (t === 0) {
                            ke = Nt(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== "$" && n !== "$!" && n !== "$?") || t++;
                }
                e = e.nextSibling;
            }
            ke = null;
        }
    } else ke = Ce ? Nt(e.stateNode.nextSibling) : null;
    return !0;
}
function pd() {
    for (var e = ke; e; ) e = Nt(e.nextSibling);
}
function Ln() {
    ((ke = Ce = null), (G = !1));
}
function Ll(e) {
    Ue === null ? (Ue = [e]) : Ue.push(e);
}
var Ah = dt.ReactCurrentBatchConfig;
function Jn(e, t, n) {
    if (
        ((e = n.ref),
        e !== null && typeof e != "function" && typeof e != "object")
    ) {
        if (n._owner) {
            if (((n = n._owner), n)) {
                if (n.tag !== 1) throw Error(E(309));
                var r = n.stateNode;
            }
            if (!r) throw Error(E(147, e));
            var o = r,
                i = "" + e;
            return t !== null &&
                t.ref !== null &&
                typeof t.ref == "function" &&
                t.ref._stringRef === i
                ? t.ref
                : ((t = function (s) {
                      var l = o.refs;
                      s === null ? delete l[i] : (l[i] = s);
                  }),
                  (t._stringRef = i),
                  t);
        }
        if (typeof e != "string") throw Error(E(284));
        if (!n._owner) throw Error(E(290, e));
    }
    return e;
}
function oo(e, t) {
    throw (
        (e = Object.prototype.toString.call(t)),
        Error(
            E(
                31,
                e === "[object Object]"
                    ? "object with keys {" + Object.keys(t).join(", ") + "}"
                    : e
            )
        )
    );
}
function la(e) {
    var t = e._init;
    return t(e._payload);
}
function md(e) {
    function t(d, c) {
        if (e) {
            var p = d.deletions;
            p === null ? ((d.deletions = [c]), (d.flags |= 16)) : p.push(c);
        }
    }
    function n(d, c) {
        if (!e) return null;
        for (; c !== null; ) (t(d, c), (c = c.sibling));
        return null;
    }
    function r(d, c) {
        for (d = new Map(); c !== null; )
            (c.key !== null ? d.set(c.key, c) : d.set(c.index, c),
                (c = c.sibling));
        return d;
    }
    function o(d, c) {
        return ((d = It(d, c)), (d.index = 0), (d.sibling = null), d);
    }
    function i(d, c, p) {
        return (
            (d.index = p),
            e
                ? ((p = d.alternate),
                  p !== null
                      ? ((p = p.index), p < c ? ((d.flags |= 2), c) : p)
                      : ((d.flags |= 2), c))
                : ((d.flags |= 1048576), c)
        );
    }
    function s(d) {
        return (e && d.alternate === null && (d.flags |= 2), d);
    }
    function l(d, c, p, _) {
        return c === null || c.tag !== 6
            ? ((c = Yi(p, d.mode, _)), (c.return = d), c)
            : ((c = o(c, p)), (c.return = d), c);
    }
    function u(d, c, p, _) {
        var k = p.type;
        return k === cn
            ? m(d, c, p.props.children, _, p.key)
            : c !== null &&
                (c.elementType === k ||
                    (typeof k == "object" &&
                        k !== null &&
                        k.$$typeof === yt &&
                        la(k) === c.type))
              ? ((_ = o(c, p.props)), (_.ref = Jn(d, c, p)), (_.return = d), _)
              : ((_ = Eo(p.type, p.key, p.props, null, d.mode, _)),
                (_.ref = Jn(d, c, p)),
                (_.return = d),
                _);
    }
    function a(d, c, p, _) {
        return c === null ||
            c.tag !== 4 ||
            c.stateNode.containerInfo !== p.containerInfo ||
            c.stateNode.implementation !== p.implementation
            ? ((c = Xi(p, d.mode, _)), (c.return = d), c)
            : ((c = o(c, p.children || [])), (c.return = d), c);
    }
    function m(d, c, p, _, k) {
        return c === null || c.tag !== 7
            ? ((c = Ht(p, d.mode, _, k)), (c.return = d), c)
            : ((c = o(c, p)), (c.return = d), c);
    }
    function f(d, c, p) {
        if ((typeof c == "string" && c !== "") || typeof c == "number")
            return ((c = Yi("" + c, d.mode, p)), (c.return = d), c);
        if (typeof c == "object" && c !== null) {
            switch (c.$$typeof) {
                case Qr:
                    return (
                        (p = Eo(c.type, c.key, c.props, null, d.mode, p)),
                        (p.ref = Jn(d, null, c)),
                        (p.return = d),
                        p
                    );
                case an:
                    return ((c = Xi(c, d.mode, p)), (c.return = d), c);
                case yt:
                    var _ = c._init;
                    return f(d, _(c._payload), p);
            }
            if (or(c) || Hn(c))
                return ((c = Ht(c, d.mode, p, null)), (c.return = d), c);
            oo(d, c);
        }
        return null;
    }
    function h(d, c, p, _) {
        var k = c !== null ? c.key : null;
        if ((typeof p == "string" && p !== "") || typeof p == "number")
            return k !== null ? null : l(d, c, "" + p, _);
        if (typeof p == "object" && p !== null) {
            switch (p.$$typeof) {
                case Qr:
                    return p.key === k ? u(d, c, p, _) : null;
                case an:
                    return p.key === k ? a(d, c, p, _) : null;
                case yt:
                    return ((k = p._init), h(d, c, k(p._payload), _));
            }
            if (or(p) || Hn(p)) return k !== null ? null : m(d, c, p, _, null);
            oo(d, p);
        }
        return null;
    }
    function g(d, c, p, _, k) {
        if ((typeof _ == "string" && _ !== "") || typeof _ == "number")
            return ((d = d.get(p) || null), l(c, d, "" + _, k));
        if (typeof _ == "object" && _ !== null) {
            switch (_.$$typeof) {
                case Qr:
                    return (
                        (d = d.get(_.key === null ? p : _.key) || null),
                        u(c, d, _, k)
                    );
                case an:
                    return (
                        (d = d.get(_.key === null ? p : _.key) || null),
                        a(c, d, _, k)
                    );
                case yt:
                    var T = _._init;
                    return g(d, c, p, T(_._payload), k);
            }
            if (or(_) || Hn(_))
                return ((d = d.get(p) || null), m(c, d, _, k, null));
            oo(c, _);
        }
        return null;
    }
    function y(d, c, p, _) {
        for (
            var k = null, T = null, P = c, C = (c = 0), F = null;
            P !== null && C < p.length;
            C++
        ) {
            P.index > C ? ((F = P), (P = null)) : (F = P.sibling);
            var A = h(d, P, p[C], _);
            if (A === null) {
                P === null && (P = F);
                break;
            }
            (e && P && A.alternate === null && t(d, P),
                (c = i(A, c, C)),
                T === null ? (k = A) : (T.sibling = A),
                (T = A),
                (P = F));
        }
        if (C === p.length) return (n(d, P), G && Ft(d, C), k);
        if (P === null) {
            for (; C < p.length; C++)
                ((P = f(d, p[C], _)),
                    P !== null &&
                        ((c = i(P, c, C)),
                        T === null ? (k = P) : (T.sibling = P),
                        (T = P)));
            return (G && Ft(d, C), k);
        }
        for (P = r(d, P); C < p.length; C++)
            ((F = g(P, d, C, p[C], _)),
                F !== null &&
                    (e &&
                        F.alternate !== null &&
                        P.delete(F.key === null ? C : F.key),
                    (c = i(F, c, C)),
                    T === null ? (k = F) : (T.sibling = F),
                    (T = F)));
        return (
            e &&
                P.forEach(function (Z) {
                    return t(d, Z);
                }),
            G && Ft(d, C),
            k
        );
    }
    function S(d, c, p, _) {
        var k = Hn(p);
        if (typeof k != "function") throw Error(E(150));
        if (((p = k.call(p)), p == null)) throw Error(E(151));
        for (
            var T = (k = null), P = c, C = (c = 0), F = null, A = p.next();
            P !== null && !A.done;
            C++, A = p.next()
        ) {
            P.index > C ? ((F = P), (P = null)) : (F = P.sibling);
            var Z = h(d, P, A.value, _);
            if (Z === null) {
                P === null && (P = F);
                break;
            }
            (e && P && Z.alternate === null && t(d, P),
                (c = i(Z, c, C)),
                T === null ? (k = Z) : (T.sibling = Z),
                (T = Z),
                (P = F));
        }
        if (A.done) return (n(d, P), G && Ft(d, C), k);
        if (P === null) {
            for (; !A.done; C++, A = p.next())
                ((A = f(d, A.value, _)),
                    A !== null &&
                        ((c = i(A, c, C)),
                        T === null ? (k = A) : (T.sibling = A),
                        (T = A)));
            return (G && Ft(d, C), k);
        }
        for (P = r(d, P); !A.done; C++, A = p.next())
            ((A = g(P, d, C, A.value, _)),
                A !== null &&
                    (e &&
                        A.alternate !== null &&
                        P.delete(A.key === null ? C : A.key),
                    (c = i(A, c, C)),
                    T === null ? (k = A) : (T.sibling = A),
                    (T = A)));
        return (
            e &&
                P.forEach(function (D) {
                    return t(d, D);
                }),
            G && Ft(d, C),
            k
        );
    }
    function x(d, c, p, _) {
        if (
            (typeof p == "object" &&
                p !== null &&
                p.type === cn &&
                p.key === null &&
                (p = p.props.children),
            typeof p == "object" && p !== null)
        ) {
            switch (p.$$typeof) {
                case Qr:
                    e: {
                        for (var k = p.key, T = c; T !== null; ) {
                            if (T.key === k) {
                                if (((k = p.type), k === cn)) {
                                    if (T.tag === 7) {
                                        (n(d, T.sibling),
                                            (c = o(T, p.props.children)),
                                            (c.return = d),
                                            (d = c));
                                        break e;
                                    }
                                } else if (
                                    T.elementType === k ||
                                    (typeof k == "object" &&
                                        k !== null &&
                                        k.$$typeof === yt &&
                                        la(k) === T.type)
                                ) {
                                    (n(d, T.sibling),
                                        (c = o(T, p.props)),
                                        (c.ref = Jn(d, T, p)),
                                        (c.return = d),
                                        (d = c));
                                    break e;
                                }
                                n(d, T);
                                break;
                            } else t(d, T);
                            T = T.sibling;
                        }
                        p.type === cn
                            ? ((c = Ht(p.props.children, d.mode, _, p.key)),
                              (c.return = d),
                              (d = c))
                            : ((_ = Eo(
                                  p.type,
                                  p.key,
                                  p.props,
                                  null,
                                  d.mode,
                                  _
                              )),
                              (_.ref = Jn(d, c, p)),
                              (_.return = d),
                              (d = _));
                    }
                    return s(d);
                case an:
                    e: {
                        for (T = p.key; c !== null; ) {
                            if (c.key === T)
                                if (
                                    c.tag === 4 &&
                                    c.stateNode.containerInfo ===
                                        p.containerInfo &&
                                    c.stateNode.implementation ===
                                        p.implementation
                                ) {
                                    (n(d, c.sibling),
                                        (c = o(c, p.children || [])),
                                        (c.return = d),
                                        (d = c));
                                    break e;
                                } else {
                                    n(d, c);
                                    break;
                                }
                            else t(d, c);
                            c = c.sibling;
                        }
                        ((c = Xi(p, d.mode, _)), (c.return = d), (d = c));
                    }
                    return s(d);
                case yt:
                    return ((T = p._init), x(d, c, T(p._payload), _));
            }
            if (or(p)) return y(d, c, p, _);
            if (Hn(p)) return S(d, c, p, _);
            oo(d, p);
        }
        return (typeof p == "string" && p !== "") || typeof p == "number"
            ? ((p = "" + p),
              c !== null && c.tag === 6
                  ? (n(d, c.sibling), (c = o(c, p)), (c.return = d), (d = c))
                  : (n(d, c), (c = Yi(p, d.mode, _)), (c.return = d), (d = c)),
              s(d))
            : n(d, c);
    }
    return x;
}
var jn = md(!0),
    hd = md(!1),
    zo = Mt(null),
    Fo = null,
    vn = null,
    jl = null;
function Ml() {
    jl = vn = Fo = null;
}
function Dl(e) {
    var t = zo.current;
    (W(zo), (e._currentValue = t));
}
function js(e, t, n) {
    for (; e !== null; ) {
        var r = e.alternate;
        if (
            ((e.childLanes & t) !== t
                ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
                : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
            e === n)
        )
            break;
        e = e.return;
    }
}
function Nn(e, t) {
    ((Fo = e),
        (jl = vn = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (ve = !0), (e.firstContext = null)));
}
function je(e) {
    var t = e._currentValue;
    if (jl !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), vn === null)) {
            if (Fo === null) throw Error(E(308));
            ((vn = e), (Fo.dependencies = { lanes: 0, firstContext: e }));
        } else vn = vn.next = e;
    return t;
}
var Vt = null;
function bl(e) {
    Vt === null ? (Vt = [e]) : Vt.push(e);
}
function gd(e, t, n, r) {
    var o = t.interleaved;
    return (
        o === null ? ((n.next = n), bl(t)) : ((n.next = o.next), (o.next = n)),
        (t.interleaved = n),
        ut(e, r)
    );
}
function ut(e, t) {
    e.lanes |= t;
    var n = e.alternate;
    for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
        ((e.childLanes |= t),
            (n = e.alternate),
            n !== null && (n.childLanes |= t),
            (n = e),
            (e = e.return));
    return n.tag === 3 ? n.stateNode : null;
}
var vt = !1;
function zl(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function yd(e, t) {
    ((e = e.updateQueue),
        t.updateQueue === e &&
            (t.updateQueue = {
                baseState: e.baseState,
                firstBaseUpdate: e.firstBaseUpdate,
                lastBaseUpdate: e.lastBaseUpdate,
                shared: e.shared,
                effects: e.effects,
            }));
}
function it(e, t) {
    return {
        eventTime: e,
        lane: t,
        tag: 0,
        payload: null,
        callback: null,
        next: null,
    };
}
function Tt(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), M & 2)) {
        var o = r.pending;
        return (
            o === null ? (t.next = t) : ((t.next = o.next), (o.next = t)),
            (r.pending = t),
            ut(e, n)
        );
    }
    return (
        (o = r.interleaved),
        o === null ? ((t.next = t), bl(r)) : ((t.next = o.next), (o.next = t)),
        (r.interleaved = t),
        ut(e, n)
    );
}
function yo(e, t, n) {
    if (
        ((t = t.updateQueue),
        t !== null && ((t = t.shared), (n & 4194240) !== 0))
    ) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), El(e, n));
    }
}
function ua(e, t) {
    var n = e.updateQueue,
        r = e.alternate;
    if (r !== null && ((r = r.updateQueue), n === r)) {
        var o = null,
            i = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
            do {
                var s = {
                    eventTime: n.eventTime,
                    lane: n.lane,
                    tag: n.tag,
                    payload: n.payload,
                    callback: n.callback,
                    next: null,
                };
                (i === null ? (o = i = s) : (i = i.next = s), (n = n.next));
            } while (n !== null);
            i === null ? (o = i = t) : (i = i.next = t);
        } else o = i = t;
        ((n = {
            baseState: r.baseState,
            firstBaseUpdate: o,
            lastBaseUpdate: i,
            shared: r.shared,
            effects: r.effects,
        }),
            (e.updateQueue = n));
        return;
    }
    ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
}
function Uo(e, t, n, r) {
    var o = e.updateQueue;
    vt = !1;
    var i = o.firstBaseUpdate,
        s = o.lastBaseUpdate,
        l = o.shared.pending;
    if (l !== null) {
        o.shared.pending = null;
        var u = l,
            a = u.next;
        ((u.next = null), s === null ? (i = a) : (s.next = a), (s = u));
        var m = e.alternate;
        m !== null &&
            ((m = m.updateQueue),
            (l = m.lastBaseUpdate),
            l !== s &&
                (l === null ? (m.firstBaseUpdate = a) : (l.next = a),
                (m.lastBaseUpdate = u)));
    }
    if (i !== null) {
        var f = o.baseState;
        ((s = 0), (m = a = u = null), (l = i));
        do {
            var h = l.lane,
                g = l.eventTime;
            if ((r & h) === h) {
                m !== null &&
                    (m = m.next =
                        {
                            eventTime: g,
                            lane: 0,
                            tag: l.tag,
                            payload: l.payload,
                            callback: l.callback,
                            next: null,
                        });
                e: {
                    var y = e,
                        S = l;
                    switch (((h = t), (g = n), S.tag)) {
                        case 1:
                            if (((y = S.payload), typeof y == "function")) {
                                f = y.call(g, f, h);
                                break e;
                            }
                            f = y;
                            break e;
                        case 3:
                            y.flags = (y.flags & -65537) | 128;
                        case 0:
                            if (
                                ((y = S.payload),
                                (h =
                                    typeof y == "function"
                                        ? y.call(g, f, h)
                                        : y),
                                h == null)
                            )
                                break e;
                            f = K({}, f, h);
                            break e;
                        case 2:
                            vt = !0;
                    }
                }
                l.callback !== null &&
                    l.lane !== 0 &&
                    ((e.flags |= 64),
                    (h = o.effects),
                    h === null ? (o.effects = [l]) : h.push(l));
            } else
                ((g = {
                    eventTime: g,
                    lane: h,
                    tag: l.tag,
                    payload: l.payload,
                    callback: l.callback,
                    next: null,
                }),
                    m === null ? ((a = m = g), (u = f)) : (m = m.next = g),
                    (s |= h));
            if (((l = l.next), l === null)) {
                if (((l = o.shared.pending), l === null)) break;
                ((h = l),
                    (l = h.next),
                    (h.next = null),
                    (o.lastBaseUpdate = h),
                    (o.shared.pending = null));
            }
        } while (!0);
        if (
            (m === null && (u = f),
            (o.baseState = u),
            (o.firstBaseUpdate = a),
            (o.lastBaseUpdate = m),
            (t = o.shared.interleaved),
            t !== null)
        ) {
            o = t;
            do ((s |= o.lane), (o = o.next));
            while (o !== t);
        } else i === null && (o.shared.lanes = 0);
        ((Zt |= s), (e.lanes = s), (e.memoizedState = f));
    }
}
function aa(e, t, n) {
    if (((e = t.effects), (t.effects = null), e !== null))
        for (t = 0; t < e.length; t++) {
            var r = e[t],
                o = r.callback;
            if (o !== null) {
                if (((r.callback = null), (r = n), typeof o != "function"))
                    throw Error(E(191, o));
                o.call(r);
            }
        }
}
var Br = {},
    Je = Mt(Br),
    Pr = Mt(Br),
    Ir = Mt(Br);
function Wt(e) {
    if (e === Br) throw Error(E(174));
    return e;
}
function Fl(e, t) {
    switch ((U(Ir, t), U(Pr, e), U(Je, Br), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : ms(null, "");
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = ms(t, e)));
    }
    (W(Je), U(Je, t));
}
function Mn() {
    (W(Je), W(Pr), W(Ir));
}
function vd(e) {
    Wt(Ir.current);
    var t = Wt(Je.current),
        n = ms(t, e.type);
    t !== n && (U(Pr, e), U(Je, n));
}
function Ul(e) {
    Pr.current === e && (W(Je), W(Pr));
}
var H = Mt(0);
function Bo(e) {
    for (var t = e; t !== null; ) {
        if (t.tag === 13) {
            var n = t.memoizedState;
            if (
                n !== null &&
                ((n = n.dehydrated),
                n === null || n.data === "$?" || n.data === "$!")
            )
                return t;
        } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
            if (t.flags & 128) return t;
        } else if (t.child !== null) {
            ((t.child.return = t), (t = t.child));
            continue;
        }
        if (t === e) break;
        for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return null;
            t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
    }
    return null;
}
var Vi = [];
function Bl() {
    for (var e = 0; e < Vi.length; e++)
        Vi[e]._workInProgressVersionPrimary = null;
    Vi.length = 0;
}
var vo = dt.ReactCurrentDispatcher,
    Wi = dt.ReactCurrentBatchConfig,
    Jt = 0,
    Q = null,
    q = null,
    ne = null,
    $o = !1,
    fr = !1,
    Ar = 0,
    Oh = 0;
function ue() {
    throw Error(E(321));
}
function $l(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++)
        if (!Ve(e[n], t[n])) return !1;
    return !0;
}
function Vl(e, t, n, r, o, i) {
    if (
        ((Jt = i),
        (Q = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (vo.current = e === null || e.memoizedState === null ? Dh : bh),
        (e = n(r, o)),
        fr)
    ) {
        i = 0;
        do {
            if (((fr = !1), (Ar = 0), 25 <= i)) throw Error(E(301));
            ((i += 1),
                (ne = q = null),
                (t.updateQueue = null),
                (vo.current = zh),
                (e = n(r, o)));
        } while (fr);
    }
    if (
        ((vo.current = Vo),
        (t = q !== null && q.next !== null),
        (Jt = 0),
        (ne = q = Q = null),
        ($o = !1),
        t)
    )
        throw Error(E(300));
    return e;
}
function Wl() {
    var e = Ar !== 0;
    return ((Ar = 0), e);
}
function He() {
    var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null,
    };
    return (ne === null ? (Q.memoizedState = ne = e) : (ne = ne.next = e), ne);
}
function Me() {
    if (q === null) {
        var e = Q.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = q.next;
    var t = ne === null ? Q.memoizedState : ne.next;
    if (t !== null) ((ne = t), (q = e));
    else {
        if (e === null) throw Error(E(310));
        ((q = e),
            (e = {
                memoizedState: q.memoizedState,
                baseState: q.baseState,
                baseQueue: q.baseQueue,
                queue: q.queue,
                next: null,
            }),
            ne === null ? (Q.memoizedState = ne = e) : (ne = ne.next = e));
    }
    return ne;
}
function Or(e, t) {
    return typeof t == "function" ? t(e) : t;
}
function Gi(e) {
    var t = Me(),
        n = t.queue;
    if (n === null) throw Error(E(311));
    n.lastRenderedReducer = e;
    var r = q,
        o = r.baseQueue,
        i = n.pending;
    if (i !== null) {
        if (o !== null) {
            var s = o.next;
            ((o.next = i.next), (i.next = s));
        }
        ((r.baseQueue = o = i), (n.pending = null));
    }
    if (o !== null) {
        ((i = o.next), (r = r.baseState));
        var l = (s = null),
            u = null,
            a = i;
        do {
            var m = a.lane;
            if ((Jt & m) === m)
                (u !== null &&
                    (u = u.next =
                        {
                            lane: 0,
                            action: a.action,
                            hasEagerState: a.hasEagerState,
                            eagerState: a.eagerState,
                            next: null,
                        }),
                    (r = a.hasEagerState ? a.eagerState : e(r, a.action)));
            else {
                var f = {
                    lane: m,
                    action: a.action,
                    hasEagerState: a.hasEagerState,
                    eagerState: a.eagerState,
                    next: null,
                };
                (u === null ? ((l = u = f), (s = r)) : (u = u.next = f),
                    (Q.lanes |= m),
                    (Zt |= m));
            }
            a = a.next;
        } while (a !== null && a !== i);
        (u === null ? (s = r) : (u.next = l),
            Ve(r, t.memoizedState) || (ve = !0),
            (t.memoizedState = r),
            (t.baseState = s),
            (t.baseQueue = u),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        o = e;
        do ((i = o.lane), (Q.lanes |= i), (Zt |= i), (o = o.next));
        while (o !== e);
    } else o === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function Hi(e) {
    var t = Me(),
        n = t.queue;
    if (n === null) throw Error(E(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch,
        o = n.pending,
        i = t.memoizedState;
    if (o !== null) {
        n.pending = null;
        var s = (o = o.next);
        do ((i = e(i, s.action)), (s = s.next));
        while (s !== o);
        (Ve(i, t.memoizedState) || (ve = !0),
            (t.memoizedState = i),
            t.baseQueue === null && (t.baseState = i),
            (n.lastRenderedState = i));
    }
    return [i, r];
}
function Sd() {}
function wd(e, t) {
    var n = Q,
        r = Me(),
        o = t(),
        i = !Ve(r.memoizedState, o);
    if (
        (i && ((r.memoizedState = o), (ve = !0)),
        (r = r.queue),
        Gl(Ed.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || i || (ne !== null && ne.memoizedState.tag & 1))
    ) {
        if (
            ((n.flags |= 2048),
            Lr(9, xd.bind(null, n, r, o, t), void 0, null),
            re === null)
        )
            throw Error(E(349));
        Jt & 30 || _d(n, t, o);
    }
    return o;
}
function _d(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = Q.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (Q.updateQueue = t),
              (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function xd(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), kd(t) && Cd(e));
}
function Ed(e, t, n) {
    return n(function () {
        kd(t) && Cd(e);
    });
}
function kd(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !Ve(e, n);
    } catch {
        return !0;
    }
}
function Cd(e) {
    var t = ut(e, 1);
    t !== null && $e(t, e, 1, -1);
}
function ca(e) {
    var t = He();
    return (
        typeof e == "function" && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Or,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = Mh.bind(null, Q, e)),
        [t.memoizedState, e]
    );
}
function Lr(e, t, n, r) {
    return (
        (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
        (t = Q.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (Q.updateQueue = t),
              (t.lastEffect = e.next = e))
            : ((n = t.lastEffect),
              n === null
                  ? (t.lastEffect = e.next = e)
                  : ((r = n.next),
                    (n.next = e),
                    (e.next = r),
                    (t.lastEffect = e))),
        e
    );
}
function Nd() {
    return Me().memoizedState;
}
function So(e, t, n, r) {
    var o = He();
    ((Q.flags |= e),
        (o.memoizedState = Lr(1 | t, n, void 0, r === void 0 ? null : r)));
}
function oi(e, t, n, r) {
    var o = Me();
    r = r === void 0 ? null : r;
    var i = void 0;
    if (q !== null) {
        var s = q.memoizedState;
        if (((i = s.destroy), r !== null && $l(r, s.deps))) {
            o.memoizedState = Lr(t, n, i, r);
            return;
        }
    }
    ((Q.flags |= e), (o.memoizedState = Lr(1 | t, n, i, r)));
}
function da(e, t) {
    return So(8390656, 8, e, t);
}
function Gl(e, t) {
    return oi(2048, 8, e, t);
}
function Td(e, t) {
    return oi(4, 2, e, t);
}
function Rd(e, t) {
    return oi(4, 4, e, t);
}
function Pd(e, t) {
    if (typeof t == "function")
        return (
            (e = e()),
            t(e),
            function () {
                t(null);
            }
        );
    if (t != null)
        return (
            (e = e()),
            (t.current = e),
            function () {
                t.current = null;
            }
        );
}
function Id(e, t, n) {
    return (
        (n = n != null ? n.concat([e]) : null),
        oi(4, 4, Pd.bind(null, t, e), n)
    );
}
function Hl() {}
function Ad(e, t) {
    var n = Me();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && $l(t, r[1])
        ? r[0]
        : ((n.memoizedState = [e, t]), e);
}
function Od(e, t) {
    var n = Me();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && $l(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Ld(e, t, n) {
    return Jt & 21
        ? (Ve(n, t) ||
              ((n = zc()), (Q.lanes |= n), (Zt |= n), (e.baseState = !0)),
          t)
        : (e.baseState && ((e.baseState = !1), (ve = !0)),
          (e.memoizedState = n));
}
function Lh(e, t) {
    var n = z;
    ((z = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = Wi.transition;
    Wi.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((z = n), (Wi.transition = r));
    }
}
function jd() {
    return Me().memoizedState;
}
function jh(e, t, n) {
    var r = Pt(e);
    if (
        ((n = {
            lane: r,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null,
        }),
        Md(e))
    )
        Dd(t, n);
    else if (((n = gd(e, t, n, r)), n !== null)) {
        var o = me();
        ($e(n, e, r, o), bd(n, t, r));
    }
}
function Mh(e, t, n) {
    var r = Pt(e),
        o = {
            lane: r,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null,
        };
    if (Md(e)) Dd(t, o);
    else {
        var i = e.alternate;
        if (
            e.lanes === 0 &&
            (i === null || i.lanes === 0) &&
            ((i = t.lastRenderedReducer), i !== null)
        )
            try {
                var s = t.lastRenderedState,
                    l = i(s, n);
                if (((o.hasEagerState = !0), (o.eagerState = l), Ve(l, s))) {
                    var u = t.interleaved;
                    (u === null
                        ? ((o.next = o), bl(t))
                        : ((o.next = u.next), (u.next = o)),
                        (t.interleaved = o));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = gd(e, t, o, r)),
            n !== null && ((o = me()), $e(n, e, r, o), bd(n, t, r)));
    }
}
function Md(e) {
    var t = e.alternate;
    return e === Q || (t !== null && t === Q);
}
function Dd(e, t) {
    fr = $o = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
        (e.pending = t));
}
function bd(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), El(e, n));
    }
}
var Vo = {
        readContext: je,
        useCallback: ue,
        useContext: ue,
        useEffect: ue,
        useImperativeHandle: ue,
        useInsertionEffect: ue,
        useLayoutEffect: ue,
        useMemo: ue,
        useReducer: ue,
        useRef: ue,
        useState: ue,
        useDebugValue: ue,
        useDeferredValue: ue,
        useTransition: ue,
        useMutableSource: ue,
        useSyncExternalStore: ue,
        useId: ue,
        unstable_isNewReconciler: !1,
    },
    Dh = {
        readContext: je,
        useCallback: function (e, t) {
            return ((He().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: je,
        useEffect: da,
        useImperativeHandle: function (e, t, n) {
            return (
                (n = n != null ? n.concat([e]) : null),
                So(4194308, 4, Pd.bind(null, t, e), n)
            );
        },
        useLayoutEffect: function (e, t) {
            return So(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return So(4, 2, e, t);
        },
        useMemo: function (e, t) {
            var n = He();
            return (
                (t = t === void 0 ? null : t),
                (e = e()),
                (n.memoizedState = [e, t]),
                e
            );
        },
        useReducer: function (e, t, n) {
            var r = He();
            return (
                (t = n !== void 0 ? n(t) : t),
                (r.memoizedState = r.baseState = t),
                (e = {
                    pending: null,
                    interleaved: null,
                    lanes: 0,
                    dispatch: null,
                    lastRenderedReducer: e,
                    lastRenderedState: t,
                }),
                (r.queue = e),
                (e = e.dispatch = jh.bind(null, Q, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = He();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: ca,
        useDebugValue: Hl,
        useDeferredValue: function (e) {
            return (He().memoizedState = e);
        },
        useTransition: function () {
            var e = ca(!1),
                t = e[0];
            return (
                (e = Lh.bind(null, e[1])),
                (He().memoizedState = e),
                [t, e]
            );
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = Q,
                o = He();
            if (G) {
                if (n === void 0) throw Error(E(407));
                n = n();
            } else {
                if (((n = t()), re === null)) throw Error(E(349));
                Jt & 30 || _d(r, t, n);
            }
            o.memoizedState = n;
            var i = { value: n, getSnapshot: t };
            return (
                (o.queue = i),
                da(Ed.bind(null, r, i, e), [e]),
                (r.flags |= 2048),
                Lr(9, xd.bind(null, r, i, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = He(),
                t = re.identifierPrefix;
            if (G) {
                var n = ot,
                    r = rt;
                ((n = (r & ~(1 << (32 - Be(r) - 1))).toString(32) + n),
                    (t = ":" + t + "R" + n),
                    (n = Ar++),
                    0 < n && (t += "H" + n.toString(32)),
                    (t += ":"));
            } else ((n = Oh++), (t = ":" + t + "r" + n.toString(32) + ":"));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    bh = {
        readContext: je,
        useCallback: Ad,
        useContext: je,
        useEffect: Gl,
        useImperativeHandle: Id,
        useInsertionEffect: Td,
        useLayoutEffect: Rd,
        useMemo: Od,
        useReducer: Gi,
        useRef: Nd,
        useState: function () {
            return Gi(Or);
        },
        useDebugValue: Hl,
        useDeferredValue: function (e) {
            var t = Me();
            return Ld(t, q.memoizedState, e);
        },
        useTransition: function () {
            var e = Gi(Or)[0],
                t = Me().memoizedState;
            return [e, t];
        },
        useMutableSource: Sd,
        useSyncExternalStore: wd,
        useId: jd,
        unstable_isNewReconciler: !1,
    },
    zh = {
        readContext: je,
        useCallback: Ad,
        useContext: je,
        useEffect: Gl,
        useImperativeHandle: Id,
        useInsertionEffect: Td,
        useLayoutEffect: Rd,
        useMemo: Od,
        useReducer: Hi,
        useRef: Nd,
        useState: function () {
            return Hi(Or);
        },
        useDebugValue: Hl,
        useDeferredValue: function (e) {
            var t = Me();
            return q === null
                ? (t.memoizedState = e)
                : Ld(t, q.memoizedState, e);
        },
        useTransition: function () {
            var e = Hi(Or)[0],
                t = Me().memoizedState;
            return [e, t];
        },
        useMutableSource: Sd,
        useSyncExternalStore: wd,
        useId: jd,
        unstable_isNewReconciler: !1,
    };
function ze(e, t) {
    if (e && e.defaultProps) {
        ((t = K({}, t)), (e = e.defaultProps));
        for (var n in e) t[n] === void 0 && (t[n] = e[n]);
        return t;
    }
    return t;
}
function Ms(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : K({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var ii = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? rn(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = me(),
            o = Pt(e),
            i = it(r, o);
        ((i.payload = t),
            n != null && (i.callback = n),
            (t = Tt(e, i, o)),
            t !== null && ($e(t, e, o, r), yo(t, e, o)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = me(),
            o = Pt(e),
            i = it(r, o);
        ((i.tag = 1),
            (i.payload = t),
            n != null && (i.callback = n),
            (t = Tt(e, i, o)),
            t !== null && ($e(t, e, o, r), yo(t, e, o)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = me(),
            r = Pt(e),
            o = it(n, r);
        ((o.tag = 2),
            t != null && (o.callback = t),
            (t = Tt(e, o, r)),
            t !== null && ($e(t, e, r, n), yo(t, e, r)));
    },
};
function fa(e, t, n, r, o, i, s) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == "function"
            ? e.shouldComponentUpdate(r, i, s)
            : t.prototype && t.prototype.isPureReactComponent
              ? !Cr(n, r) || !Cr(o, i)
              : !0
    );
}
function zd(e, t, n) {
    var r = !1,
        o = Ot,
        i = t.contextType;
    return (
        typeof i == "object" && i !== null
            ? (i = je(i))
            : ((o = we(t) ? Yt : de.current),
              (r = t.contextTypes),
              (i = (r = r != null) ? On(e, o) : Ot)),
        (t = new t(n, i)),
        (e.memoizedState =
            t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = ii),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = o),
            (e.__reactInternalMemoizedMaskedChildContext = i)),
        t
    );
}
function pa(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == "function" &&
            t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == "function" &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && ii.enqueueReplaceState(t, t.state, null));
}
function Ds(e, t, n, r) {
    var o = e.stateNode;
    ((o.props = n), (o.state = e.memoizedState), (o.refs = {}), zl(e));
    var i = t.contextType;
    (typeof i == "object" && i !== null
        ? (o.context = je(i))
        : ((i = we(t) ? Yt : de.current), (o.context = On(e, i))),
        (o.state = e.memoizedState),
        (i = t.getDerivedStateFromProps),
        typeof i == "function" && (Ms(e, t, i, n), (o.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == "function" ||
            typeof o.getSnapshotBeforeUpdate == "function" ||
            (typeof o.UNSAFE_componentWillMount != "function" &&
                typeof o.componentWillMount != "function") ||
            ((t = o.state),
            typeof o.componentWillMount == "function" && o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == "function" &&
                o.UNSAFE_componentWillMount(),
            t !== o.state && ii.enqueueReplaceState(o, o.state, null),
            Uo(e, n, o, r),
            (o.state = e.memoizedState)),
        typeof o.componentDidMount == "function" && (e.flags |= 4194308));
}
function Dn(e, t) {
    try {
        var n = "",
            r = t;
        do ((n += fm(r)), (r = r.return));
        while (r);
        var o = n;
    } catch (i) {
        o =
            `
Error generating stack: ` +
            i.message +
            `
` +
            i.stack;
    }
    return { value: e, source: t, stack: o, digest: null };
}
function Qi(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function bs(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var Fh = typeof WeakMap == "function" ? WeakMap : Map;
function Fd(e, t, n) {
    ((n = it(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (Go || ((Go = !0), (Qs = r)), bs(e, t));
        }),
        n
    );
}
function Ud(e, t, n) {
    ((n = it(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == "function") {
        var o = t.value;
        ((n.payload = function () {
            return r(o);
        }),
            (n.callback = function () {
                bs(e, t);
            }));
    }
    var i = e.stateNode;
    return (
        i !== null &&
            typeof i.componentDidCatch == "function" &&
            (n.callback = function () {
                (bs(e, t),
                    typeof r != "function" &&
                        (Rt === null ? (Rt = new Set([this])) : Rt.add(this)));
                var s = t.stack;
                this.componentDidCatch(t.value, {
                    componentStack: s !== null ? s : "",
                });
            }),
        n
    );
}
function ma(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new Fh();
        var o = new Set();
        r.set(t, o);
    } else ((o = r.get(t)), o === void 0 && ((o = new Set()), r.set(t, o)));
    o.has(n) || (o.add(n), (e = qh.bind(null, e, t, n)), t.then(e, e));
}
function ha(e) {
    do {
        var t;
        if (
            ((t = e.tag === 13) &&
                ((t = e.memoizedState),
                (t = t !== null ? t.dehydrated !== null : !0)),
            t)
        )
            return e;
        e = e.return;
    } while (e !== null);
    return null;
}
function ga(e, t, n, r, o) {
    return e.mode & 1
        ? ((e.flags |= 65536), (e.lanes = o), e)
        : (e === t
              ? (e.flags |= 65536)
              : ((e.flags |= 128),
                (n.flags |= 131072),
                (n.flags &= -52805),
                n.tag === 1 &&
                    (n.alternate === null
                        ? (n.tag = 17)
                        : ((t = it(-1, 1)), (t.tag = 2), Tt(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var Uh = dt.ReactCurrentOwner,
    ve = !1;
function fe(e, t, n, r) {
    t.child = e === null ? hd(t, null, n, r) : jn(t, e.child, n, r);
}
function ya(e, t, n, r, o) {
    n = n.render;
    var i = t.ref;
    return (
        Nn(t, o),
        (r = Vl(e, t, n, r, i, o)),
        (n = Wl()),
        e !== null && !ve
            ? ((t.updateQueue = e.updateQueue),
              (t.flags &= -2053),
              (e.lanes &= ~o),
              at(e, t, o))
            : (G && n && Al(t), (t.flags |= 1), fe(e, t, r, o), t.child)
    );
}
function va(e, t, n, r, o) {
    if (e === null) {
        var i = n.type;
        return typeof i == "function" &&
            !eu(i) &&
            i.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = i), Bd(e, t, i, r, o))
            : ((e = Eo(n.type, null, r, t, t.mode, o)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((i = e.child), !(e.lanes & o))) {
        var s = i.memoizedProps;
        if (
            ((n = n.compare),
            (n = n !== null ? n : Cr),
            n(s, r) && e.ref === t.ref)
        )
            return at(e, t, o);
    }
    return (
        (t.flags |= 1),
        (e = It(i, r)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e)
    );
}
function Bd(e, t, n, r, o) {
    if (e !== null) {
        var i = e.memoizedProps;
        if (Cr(i, r) && e.ref === t.ref)
            if (((ve = !1), (t.pendingProps = r = i), (e.lanes & o) !== 0))
                e.flags & 131072 && (ve = !0);
            else return ((t.lanes = e.lanes), at(e, t, o));
    }
    return zs(e, t, n, r, o);
}
function $d(e, t, n) {
    var r = t.pendingProps,
        o = r.children,
        i = e !== null ? e.memoizedState : null;
    if (r.mode === "hidden")
        if (!(t.mode & 1))
            ((t.memoizedState = {
                baseLanes: 0,
                cachePool: null,
                transitions: null,
            }),
                U(wn, Ee),
                (Ee |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = i !== null ? i.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = {
                        baseLanes: e,
                        cachePool: null,
                        transitions: null,
                    }),
                    (t.updateQueue = null),
                    U(wn, Ee),
                    (Ee |= e),
                    null
                );
            ((t.memoizedState = {
                baseLanes: 0,
                cachePool: null,
                transitions: null,
            }),
                (r = i !== null ? i.baseLanes : n),
                U(wn, Ee),
                (Ee |= r));
        }
    else
        (i !== null
            ? ((r = i.baseLanes | n), (t.memoizedState = null))
            : (r = n),
            U(wn, Ee),
            (Ee |= r));
    return (fe(e, t, o, n), t.child);
}
function Vd(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function zs(e, t, n, r, o) {
    var i = we(n) ? Yt : de.current;
    return (
        (i = On(t, i)),
        Nn(t, o),
        (n = Vl(e, t, n, r, i, o)),
        (r = Wl()),
        e !== null && !ve
            ? ((t.updateQueue = e.updateQueue),
              (t.flags &= -2053),
              (e.lanes &= ~o),
              at(e, t, o))
            : (G && r && Al(t), (t.flags |= 1), fe(e, t, n, o), t.child)
    );
}
function Sa(e, t, n, r, o) {
    if (we(n)) {
        var i = !0;
        Mo(t);
    } else i = !1;
    if ((Nn(t, o), t.stateNode === null))
        (wo(e, t), zd(t, n, r), Ds(t, n, r, o), (r = !0));
    else if (e === null) {
        var s = t.stateNode,
            l = t.memoizedProps;
        s.props = l;
        var u = s.context,
            a = n.contextType;
        typeof a == "object" && a !== null
            ? (a = je(a))
            : ((a = we(n) ? Yt : de.current), (a = On(t, a)));
        var m = n.getDerivedStateFromProps,
            f =
                typeof m == "function" ||
                typeof s.getSnapshotBeforeUpdate == "function";
        (f ||
            (typeof s.UNSAFE_componentWillReceiveProps != "function" &&
                typeof s.componentWillReceiveProps != "function") ||
            ((l !== r || u !== a) && pa(t, s, r, a)),
            (vt = !1));
        var h = t.memoizedState;
        ((s.state = h),
            Uo(t, r, s, o),
            (u = t.memoizedState),
            l !== r || h !== u || Se.current || vt
                ? (typeof m == "function" &&
                      (Ms(t, n, m, r), (u = t.memoizedState)),
                  (l = vt || fa(t, n, l, r, h, u, a))
                      ? (f ||
                            (typeof s.UNSAFE_componentWillMount != "function" &&
                                typeof s.componentWillMount != "function") ||
                            (typeof s.componentWillMount == "function" &&
                                s.componentWillMount(),
                            typeof s.UNSAFE_componentWillMount == "function" &&
                                s.UNSAFE_componentWillMount()),
                        typeof s.componentDidMount == "function" &&
                            (t.flags |= 4194308))
                      : (typeof s.componentDidMount == "function" &&
                            (t.flags |= 4194308),
                        (t.memoizedProps = r),
                        (t.memoizedState = u)),
                  (s.props = r),
                  (s.state = u),
                  (s.context = a),
                  (r = l))
                : (typeof s.componentDidMount == "function" &&
                      (t.flags |= 4194308),
                  (r = !1)));
    } else {
        ((s = t.stateNode),
            yd(e, t),
            (l = t.memoizedProps),
            (a = t.type === t.elementType ? l : ze(t.type, l)),
            (s.props = a),
            (f = t.pendingProps),
            (h = s.context),
            (u = n.contextType),
            typeof u == "object" && u !== null
                ? (u = je(u))
                : ((u = we(n) ? Yt : de.current), (u = On(t, u))));
        var g = n.getDerivedStateFromProps;
        ((m =
            typeof g == "function" ||
            typeof s.getSnapshotBeforeUpdate == "function") ||
            (typeof s.UNSAFE_componentWillReceiveProps != "function" &&
                typeof s.componentWillReceiveProps != "function") ||
            ((l !== f || h !== u) && pa(t, s, r, u)),
            (vt = !1),
            (h = t.memoizedState),
            (s.state = h),
            Uo(t, r, s, o));
        var y = t.memoizedState;
        l !== f || h !== y || Se.current || vt
            ? (typeof g == "function" &&
                  (Ms(t, n, g, r), (y = t.memoizedState)),
              (a = vt || fa(t, n, a, r, h, y, u) || !1)
                  ? (m ||
                        (typeof s.UNSAFE_componentWillUpdate != "function" &&
                            typeof s.componentWillUpdate != "function") ||
                        (typeof s.componentWillUpdate == "function" &&
                            s.componentWillUpdate(r, y, u),
                        typeof s.UNSAFE_componentWillUpdate == "function" &&
                            s.UNSAFE_componentWillUpdate(r, y, u)),
                    typeof s.componentDidUpdate == "function" && (t.flags |= 4),
                    typeof s.getSnapshotBeforeUpdate == "function" &&
                        (t.flags |= 1024))
                  : (typeof s.componentDidUpdate != "function" ||
                        (l === e.memoizedProps && h === e.memoizedState) ||
                        (t.flags |= 4),
                    typeof s.getSnapshotBeforeUpdate != "function" ||
                        (l === e.memoizedProps && h === e.memoizedState) ||
                        (t.flags |= 1024),
                    (t.memoizedProps = r),
                    (t.memoizedState = y)),
              (s.props = r),
              (s.state = y),
              (s.context = u),
              (r = a))
            : (typeof s.componentDidUpdate != "function" ||
                  (l === e.memoizedProps && h === e.memoizedState) ||
                  (t.flags |= 4),
              typeof s.getSnapshotBeforeUpdate != "function" ||
                  (l === e.memoizedProps && h === e.memoizedState) ||
                  (t.flags |= 1024),
              (r = !1));
    }
    return Fs(e, t, n, r, i, o);
}
function Fs(e, t, n, r, o, i) {
    Vd(e, t);
    var s = (t.flags & 128) !== 0;
    if (!r && !s) return (o && oa(t, n, !1), at(e, t, i));
    ((r = t.stateNode), (Uh.current = t));
    var l =
        s && typeof n.getDerivedStateFromError != "function"
            ? null
            : r.render();
    return (
        (t.flags |= 1),
        e !== null && s
            ? ((t.child = jn(t, e.child, null, i)),
              (t.child = jn(t, null, l, i)))
            : fe(e, t, l, i),
        (t.memoizedState = r.state),
        o && oa(t, n, !0),
        t.child
    );
}
function Wd(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? ra(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && ra(e, t.context, !1),
        Fl(e, t.containerInfo));
}
function wa(e, t, n, r, o) {
    return (Ln(), Ll(o), (t.flags |= 256), fe(e, t, n, r), t.child);
}
var Us = { dehydrated: null, treeContext: null, retryLane: 0 };
function Bs(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function Gd(e, t, n) {
    var r = t.pendingProps,
        o = H.current,
        i = !1,
        s = (t.flags & 128) !== 0,
        l;
    if (
        ((l = s) ||
            (l = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0),
        l
            ? ((i = !0), (t.flags &= -129))
            : (e === null || e.memoizedState !== null) && (o |= 1),
        U(H, o & 1),
        e === null)
    )
        return (
            Ls(t),
            (e = t.memoizedState),
            e !== null && ((e = e.dehydrated), e !== null)
                ? (t.mode & 1
                      ? e.data === "$!"
                          ? (t.lanes = 8)
                          : (t.lanes = 1073741824)
                      : (t.lanes = 1),
                  null)
                : ((s = r.children),
                  (e = r.fallback),
                  i
                      ? ((r = t.mode),
                        (i = t.child),
                        (s = { mode: "hidden", children: s }),
                        !(r & 1) && i !== null
                            ? ((i.childLanes = 0), (i.pendingProps = s))
                            : (i = ui(s, r, 0, null)),
                        (e = Ht(e, r, n, null)),
                        (i.return = t),
                        (e.return = t),
                        (i.sibling = e),
                        (t.child = i),
                        (t.child.memoizedState = Bs(n)),
                        (t.memoizedState = Us),
                        e)
                      : Ql(t, s))
        );
    if (((o = e.memoizedState), o !== null && ((l = o.dehydrated), l !== null)))
        return Bh(e, t, s, r, l, o, n);
    if (i) {
        ((i = r.fallback), (s = t.mode), (o = e.child), (l = o.sibling));
        var u = { mode: "hidden", children: r.children };
        return (
            !(s & 1) && t.child !== o
                ? ((r = t.child),
                  (r.childLanes = 0),
                  (r.pendingProps = u),
                  (t.deletions = null))
                : ((r = It(o, u)),
                  (r.subtreeFlags = o.subtreeFlags & 14680064)),
            l !== null
                ? (i = It(l, i))
                : ((i = Ht(i, s, n, null)), (i.flags |= 2)),
            (i.return = t),
            (r.return = t),
            (r.sibling = i),
            (t.child = r),
            (r = i),
            (i = t.child),
            (s = e.child.memoizedState),
            (s =
                s === null
                    ? Bs(n)
                    : {
                          baseLanes: s.baseLanes | n,
                          cachePool: null,
                          transitions: s.transitions,
                      }),
            (i.memoizedState = s),
            (i.childLanes = e.childLanes & ~n),
            (t.memoizedState = Us),
            r
        );
    }
    return (
        (i = e.child),
        (e = i.sibling),
        (r = It(i, { mode: "visible", children: r.children })),
        !(t.mode & 1) && (r.lanes = n),
        (r.return = t),
        (r.sibling = null),
        e !== null &&
            ((n = t.deletions),
            n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
        (t.child = r),
        (t.memoizedState = null),
        r
    );
}
function Ql(e, t) {
    return (
        (t = ui({ mode: "visible", children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function io(e, t, n, r) {
    return (
        r !== null && Ll(r),
        jn(t, e.child, null, n),
        (e = Ql(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function Bh(e, t, n, r, o, i, s) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = Qi(Error(E(422)))), io(e, t, s, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((i = r.fallback),
                (o = t.mode),
                (r = ui({ mode: "visible", children: r.children }, o, 0, null)),
                (i = Ht(i, o, s, null)),
                (i.flags |= 2),
                (r.return = t),
                (i.return = t),
                (r.sibling = i),
                (t.child = r),
                t.mode & 1 && jn(t, e.child, null, s),
                (t.child.memoizedState = Bs(s)),
                (t.memoizedState = Us),
                i);
    if (!(t.mode & 1)) return io(e, t, s, null);
    if (o.data === "$!") {
        if (((r = o.nextSibling && o.nextSibling.dataset), r)) var l = r.dgst;
        return (
            (r = l),
            (i = Error(E(419))),
            (r = Qi(i, r, void 0)),
            io(e, t, s, r)
        );
    }
    if (((l = (s & e.childLanes) !== 0), ve || l)) {
        if (((r = re), r !== null)) {
            switch (s & -s) {
                case 4:
                    o = 2;
                    break;
                case 16:
                    o = 8;
                    break;
                case 64:
                case 128:
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                case 67108864:
                    o = 32;
                    break;
                case 536870912:
                    o = 268435456;
                    break;
                default:
                    o = 0;
            }
            ((o = o & (r.suspendedLanes | s) ? 0 : o),
                o !== 0 &&
                    o !== i.retryLane &&
                    ((i.retryLane = o), ut(e, o), $e(r, e, o, -1)));
        }
        return (ql(), (r = Qi(Error(E(421)))), io(e, t, s, r));
    }
    return o.data === "$?"
        ? ((t.flags |= 128),
          (t.child = e.child),
          (t = eg.bind(null, e)),
          (o._reactRetry = t),
          null)
        : ((e = i.treeContext),
          (ke = Nt(o.nextSibling)),
          (Ce = t),
          (G = !0),
          (Ue = null),
          e !== null &&
              ((Pe[Ie++] = rt),
              (Pe[Ie++] = ot),
              (Pe[Ie++] = Xt),
              (rt = e.id),
              (ot = e.overflow),
              (Xt = t)),
          (t = Ql(t, r.children)),
          (t.flags |= 4096),
          t);
}
function _a(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), js(e.return, t, n));
}
function Ki(e, t, n, r, o) {
    var i = e.memoizedState;
    i === null
        ? (e.memoizedState = {
              isBackwards: t,
              rendering: null,
              renderingStartTime: 0,
              last: r,
              tail: n,
              tailMode: o,
          })
        : ((i.isBackwards = t),
          (i.rendering = null),
          (i.renderingStartTime = 0),
          (i.last = r),
          (i.tail = n),
          (i.tailMode = o));
}
function Hd(e, t, n) {
    var r = t.pendingProps,
        o = r.revealOrder,
        i = r.tail;
    if ((fe(e, t, r.children, n), (r = H.current), r & 2))
        ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && _a(e, n, t);
                else if (e.tag === 19) _a(e, n, t);
                else if (e.child !== null) {
                    ((e.child.return = e), (e = e.child));
                    continue;
                }
                if (e === t) break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t) break e;
                    e = e.return;
                }
                ((e.sibling.return = e.return), (e = e.sibling));
            }
        r &= 1;
    }
    if ((U(H, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (o) {
            case "forwards":
                for (n = t.child, o = null; n !== null; )
                    ((e = n.alternate),
                        e !== null && Bo(e) === null && (o = n),
                        (n = n.sibling));
                ((n = o),
                    n === null
                        ? ((o = t.child), (t.child = null))
                        : ((o = n.sibling), (n.sibling = null)),
                    Ki(t, !1, o, n, i));
                break;
            case "backwards":
                for (n = null, o = t.child, t.child = null; o !== null; ) {
                    if (((e = o.alternate), e !== null && Bo(e) === null)) {
                        t.child = o;
                        break;
                    }
                    ((e = o.sibling), (o.sibling = n), (n = o), (o = e));
                }
                Ki(t, !0, n, null, i);
                break;
            case "together":
                Ki(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function wo(e, t) {
    !(t.mode & 1) &&
        e !== null &&
        ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function at(e, t, n) {
    if (
        (e !== null && (t.dependencies = e.dependencies),
        (Zt |= t.lanes),
        !(n & t.childLanes))
    )
        return null;
    if (e !== null && t.child !== e.child) throw Error(E(153));
    if (t.child !== null) {
        for (
            e = t.child, n = It(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling),
                (n = n.sibling = It(e, e.pendingProps)),
                (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function $h(e, t, n) {
    switch (t.tag) {
        case 3:
            (Wd(t), Ln());
            break;
        case 5:
            vd(t);
            break;
        case 1:
            we(t.type) && Mo(t);
            break;
        case 4:
            Fl(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                o = t.memoizedProps.value;
            (U(zo, r._currentValue), (r._currentValue = o));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (U(H, H.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? Gd(e, t, n)
                      : (U(H, H.current & 1),
                        (e = at(e, t, n)),
                        e !== null ? e.sibling : null);
            U(H, H.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return Hd(e, t, n);
                t.flags |= 128;
            }
            if (
                ((o = t.memoizedState),
                o !== null &&
                    ((o.rendering = null),
                    (o.tail = null),
                    (o.lastEffect = null)),
                U(H, H.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), $d(e, t, n));
    }
    return at(e, t, n);
}
var Qd, $s, Kd, Yd;
Qd = function (e, t) {
    for (var n = t.child; n !== null; ) {
        if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
        else if (n.tag !== 4 && n.child !== null) {
            ((n.child.return = n), (n = n.child));
            continue;
        }
        if (n === t) break;
        for (; n.sibling === null; ) {
            if (n.return === null || n.return === t) return;
            n = n.return;
        }
        ((n.sibling.return = n.return), (n = n.sibling));
    }
};
$s = function () {};
Kd = function (e, t, n, r) {
    var o = e.memoizedProps;
    if (o !== r) {
        ((e = t.stateNode), Wt(Je.current));
        var i = null;
        switch (n) {
            case "input":
                ((o = cs(e, o)), (r = cs(e, r)), (i = []));
                break;
            case "select":
                ((o = K({}, o, { value: void 0 })),
                    (r = K({}, r, { value: void 0 })),
                    (i = []));
                break;
            case "textarea":
                ((o = ps(e, o)), (r = ps(e, r)), (i = []));
                break;
            default:
                typeof o.onClick != "function" &&
                    typeof r.onClick == "function" &&
                    (e.onclick = Lo);
        }
        hs(n, r);
        var s;
        n = null;
        for (a in o)
            if (!r.hasOwnProperty(a) && o.hasOwnProperty(a) && o[a] != null)
                if (a === "style") {
                    var l = o[a];
                    for (s in l)
                        l.hasOwnProperty(s) && (n || (n = {}), (n[s] = ""));
                } else
                    a !== "dangerouslySetInnerHTML" &&
                        a !== "children" &&
                        a !== "suppressContentEditableWarning" &&
                        a !== "suppressHydrationWarning" &&
                        a !== "autoFocus" &&
                        (vr.hasOwnProperty(a)
                            ? i || (i = [])
                            : (i = i || []).push(a, null));
        for (a in r) {
            var u = r[a];
            if (
                ((l = o != null ? o[a] : void 0),
                r.hasOwnProperty(a) && u !== l && (u != null || l != null))
            )
                if (a === "style")
                    if (l) {
                        for (s in l)
                            !l.hasOwnProperty(s) ||
                                (u && u.hasOwnProperty(s)) ||
                                (n || (n = {}), (n[s] = ""));
                        for (s in u)
                            u.hasOwnProperty(s) &&
                                l[s] !== u[s] &&
                                (n || (n = {}), (n[s] = u[s]));
                    } else (n || (i || (i = []), i.push(a, n)), (n = u));
                else
                    a === "dangerouslySetInnerHTML"
                        ? ((u = u ? u.__html : void 0),
                          (l = l ? l.__html : void 0),
                          u != null && l !== u && (i = i || []).push(a, u))
                        : a === "children"
                          ? (typeof u != "string" && typeof u != "number") ||
                            (i = i || []).push(a, "" + u)
                          : a !== "suppressContentEditableWarning" &&
                            a !== "suppressHydrationWarning" &&
                            (vr.hasOwnProperty(a)
                                ? (u != null &&
                                      a === "onScroll" &&
                                      V("scroll", e),
                                  i || l === u || (i = []))
                                : (i = i || []).push(a, u));
        }
        n && (i = i || []).push("style", n);
        var a = i;
        (t.updateQueue = a) && (t.flags |= 4);
    }
};
Yd = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function Zn(e, t) {
    if (!G)
        switch (e.tailMode) {
            case "hidden":
                t = e.tail;
                for (var n = null; t !== null; )
                    (t.alternate !== null && (n = t), (t = t.sibling));
                n === null ? (e.tail = null) : (n.sibling = null);
                break;
            case "collapsed":
                n = e.tail;
                for (var r = null; n !== null; )
                    (n.alternate !== null && (r = n), (n = n.sibling));
                r === null
                    ? t || e.tail === null
                        ? (e.tail = null)
                        : (e.tail.sibling = null)
                    : (r.sibling = null);
        }
}
function ae(e) {
    var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
    if (t)
        for (var o = e.child; o !== null; )
            ((n |= o.lanes | o.childLanes),
                (r |= o.subtreeFlags & 14680064),
                (r |= o.flags & 14680064),
                (o.return = e),
                (o = o.sibling));
    else
        for (o = e.child; o !== null; )
            ((n |= o.lanes | o.childLanes),
                (r |= o.subtreeFlags),
                (r |= o.flags),
                (o.return = e),
                (o = o.sibling));
    return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function Vh(e, t, n) {
    var r = t.pendingProps;
    switch ((Ol(t), t.tag)) {
        case 2:
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return (ae(t), null);
        case 1:
            return (we(t.type) && jo(), ae(t), null);
        case 3:
            return (
                (r = t.stateNode),
                Mn(),
                W(Se),
                W(de),
                Bl(),
                r.pendingContext &&
                    ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (ro(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024),
                          Ue !== null && (Xs(Ue), (Ue = null)))),
                $s(e, t),
                ae(t),
                null
            );
        case 5:
            Ul(t);
            var o = Wt(Ir.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (Kd(e, t, n, r, o),
                    e.ref !== t.ref &&
                        ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(E(166));
                    return (ae(t), null);
                }
                if (((e = Wt(Je.current)), ro(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var i = t.memoizedProps;
                    switch (
                        ((r[Ke] = t), (r[Rr] = i), (e = (t.mode & 1) !== 0), n)
                    ) {
                        case "dialog":
                            (V("cancel", r), V("close", r));
                            break;
                        case "iframe":
                        case "object":
                        case "embed":
                            V("load", r);
                            break;
                        case "video":
                        case "audio":
                            for (o = 0; o < sr.length; o++) V(sr[o], r);
                            break;
                        case "source":
                            V("error", r);
                            break;
                        case "img":
                        case "image":
                        case "link":
                            (V("error", r), V("load", r));
                            break;
                        case "details":
                            V("toggle", r);
                            break;
                        case "input":
                            (Iu(r, i), V("invalid", r));
                            break;
                        case "select":
                            ((r._wrapperState = { wasMultiple: !!i.multiple }),
                                V("invalid", r));
                            break;
                        case "textarea":
                            (Ou(r, i), V("invalid", r));
                    }
                    (hs(n, i), (o = null));
                    for (var s in i)
                        if (i.hasOwnProperty(s)) {
                            var l = i[s];
                            s === "children"
                                ? typeof l == "string"
                                    ? r.textContent !== l &&
                                      (i.suppressHydrationWarning !== !0 &&
                                          no(r.textContent, l, e),
                                      (o = ["children", l]))
                                    : typeof l == "number" &&
                                      r.textContent !== "" + l &&
                                      (i.suppressHydrationWarning !== !0 &&
                                          no(r.textContent, l, e),
                                      (o = ["children", "" + l]))
                                : vr.hasOwnProperty(s) &&
                                  l != null &&
                                  s === "onScroll" &&
                                  V("scroll", r);
                        }
                    switch (n) {
                        case "input":
                            (Kr(r), Au(r, i, !0));
                            break;
                        case "textarea":
                            (Kr(r), Lu(r));
                            break;
                        case "select":
                        case "option":
                            break;
                        default:
                            typeof i.onClick == "function" && (r.onclick = Lo);
                    }
                    ((r = o),
                        (t.updateQueue = r),
                        r !== null && (t.flags |= 4));
                } else {
                    ((s = o.nodeType === 9 ? o : o.ownerDocument),
                        e === "http://www.w3.org/1999/xhtml" && (e = Ec(n)),
                        e === "http://www.w3.org/1999/xhtml"
                            ? n === "script"
                                ? ((e = s.createElement("div")),
                                  (e.innerHTML = "<script></script>"),
                                  (e = e.removeChild(e.firstChild)))
                                : typeof r.is == "string"
                                  ? (e = s.createElement(n, { is: r.is }))
                                  : ((e = s.createElement(n)),
                                    n === "select" &&
                                        ((s = e),
                                        r.multiple
                                            ? (s.multiple = !0)
                                            : r.size && (s.size = r.size)))
                            : (e = s.createElementNS(e, n)),
                        (e[Ke] = t),
                        (e[Rr] = r),
                        Qd(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((s = gs(n, r)), n)) {
                            case "dialog":
                                (V("cancel", e), V("close", e), (o = r));
                                break;
                            case "iframe":
                            case "object":
                            case "embed":
                                (V("load", e), (o = r));
                                break;
                            case "video":
                            case "audio":
                                for (o = 0; o < sr.length; o++) V(sr[o], e);
                                o = r;
                                break;
                            case "source":
                                (V("error", e), (o = r));
                                break;
                            case "img":
                            case "image":
                            case "link":
                                (V("error", e), V("load", e), (o = r));
                                break;
                            case "details":
                                (V("toggle", e), (o = r));
                                break;
                            case "input":
                                (Iu(e, r), (o = cs(e, r)), V("invalid", e));
                                break;
                            case "option":
                                o = r;
                                break;
                            case "select":
                                ((e._wrapperState = {
                                    wasMultiple: !!r.multiple,
                                }),
                                    (o = K({}, r, { value: void 0 })),
                                    V("invalid", e));
                                break;
                            case "textarea":
                                (Ou(e, r), (o = ps(e, r)), V("invalid", e));
                                break;
                            default:
                                o = r;
                        }
                        (hs(n, o), (l = o));
                        for (i in l)
                            if (l.hasOwnProperty(i)) {
                                var u = l[i];
                                i === "style"
                                    ? Nc(e, u)
                                    : i === "dangerouslySetInnerHTML"
                                      ? ((u = u ? u.__html : void 0),
                                        u != null && kc(e, u))
                                      : i === "children"
                                        ? typeof u == "string"
                                            ? (n !== "textarea" || u !== "") &&
                                              Sr(e, u)
                                            : typeof u == "number" &&
                                              Sr(e, "" + u)
                                        : i !==
                                              "suppressContentEditableWarning" &&
                                          i !== "suppressHydrationWarning" &&
                                          i !== "autoFocus" &&
                                          (vr.hasOwnProperty(i)
                                              ? u != null &&
                                                i === "onScroll" &&
                                                V("scroll", e)
                                              : u != null && yl(e, i, u, s));
                            }
                        switch (n) {
                            case "input":
                                (Kr(e), Au(e, r, !1));
                                break;
                            case "textarea":
                                (Kr(e), Lu(e));
                                break;
                            case "option":
                                r.value != null &&
                                    e.setAttribute("value", "" + At(r.value));
                                break;
                            case "select":
                                ((e.multiple = !!r.multiple),
                                    (i = r.value),
                                    i != null
                                        ? xn(e, !!r.multiple, i, !1)
                                        : r.defaultValue != null &&
                                          xn(
                                              e,
                                              !!r.multiple,
                                              r.defaultValue,
                                              !0
                                          ));
                                break;
                            default:
                                typeof o.onClick == "function" &&
                                    (e.onclick = Lo);
                        }
                        switch (n) {
                            case "button":
                            case "input":
                            case "select":
                            case "textarea":
                                r = !!r.autoFocus;
                                break e;
                            case "img":
                                r = !0;
                                break e;
                            default:
                                r = !1;
                        }
                    }
                    r && (t.flags |= 4);
                }
                t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
            }
            return (ae(t), null);
        case 6:
            if (e && t.stateNode != null) Yd(e, t, e.memoizedProps, r);
            else {
                if (typeof r != "string" && t.stateNode === null)
                    throw Error(E(166));
                if (((n = Wt(Ir.current)), Wt(Je.current), ro(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[Ke] = t),
                        (i = r.nodeValue !== n) && ((e = Ce), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                no(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !==
                                    !0 &&
                                    no(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    i && (t.flags |= 4);
                } else
                    ((r = (
                        n.nodeType === 9 ? n : n.ownerDocument
                    ).createTextNode(r)),
                        (r[Ke] = t),
                        (t.stateNode = r));
            }
            return (ae(t), null);
        case 13:
            if (
                (W(H),
                (r = t.memoizedState),
                e === null ||
                    (e.memoizedState !== null &&
                        e.memoizedState.dehydrated !== null))
            ) {
                if (G && ke !== null && t.mode & 1 && !(t.flags & 128))
                    (pd(), Ln(), (t.flags |= 98560), (i = !1));
                else if (((i = ro(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!i) throw Error(E(318));
                        if (
                            ((i = t.memoizedState),
                            (i = i !== null ? i.dehydrated : null),
                            !i)
                        )
                            throw Error(E(317));
                        i[Ke] = t;
                    } else
                        (Ln(),
                            !(t.flags & 128) && (t.memoizedState = null),
                            (t.flags |= 4));
                    (ae(t), (i = !1));
                } else (Ue !== null && (Xs(Ue), (Ue = null)), (i = !0));
                if (!i) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 &&
                          (e === null || H.current & 1
                              ? ee === 0 && (ee = 3)
                              : ql())),
                  t.updateQueue !== null && (t.flags |= 4),
                  ae(t),
                  null);
        case 4:
            return (
                Mn(),
                $s(e, t),
                e === null && Nr(t.stateNode.containerInfo),
                ae(t),
                null
            );
        case 10:
            return (Dl(t.type._context), ae(t), null);
        case 17:
            return (we(t.type) && jo(), ae(t), null);
        case 19:
            if ((W(H), (i = t.memoizedState), i === null)) return (ae(t), null);
            if (((r = (t.flags & 128) !== 0), (s = i.rendering), s === null))
                if (r) Zn(i, !1);
                else {
                    if (ee !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((s = Bo(e)), s !== null)) {
                                for (
                                    t.flags |= 128,
                                        Zn(i, !1),
                                        r = s.updateQueue,
                                        r !== null &&
                                            ((t.updateQueue = r),
                                            (t.flags |= 4)),
                                        t.subtreeFlags = 0,
                                        r = n,
                                        n = t.child;
                                    n !== null;
                                )
                                    ((i = n),
                                        (e = r),
                                        (i.flags &= 14680066),
                                        (s = i.alternate),
                                        s === null
                                            ? ((i.childLanes = 0),
                                              (i.lanes = e),
                                              (i.child = null),
                                              (i.subtreeFlags = 0),
                                              (i.memoizedProps = null),
                                              (i.memoizedState = null),
                                              (i.updateQueue = null),
                                              (i.dependencies = null),
                                              (i.stateNode = null))
                                            : ((i.childLanes = s.childLanes),
                                              (i.lanes = s.lanes),
                                              (i.child = s.child),
                                              (i.subtreeFlags = 0),
                                              (i.deletions = null),
                                              (i.memoizedProps =
                                                  s.memoizedProps),
                                              (i.memoizedState =
                                                  s.memoizedState),
                                              (i.updateQueue = s.updateQueue),
                                              (i.type = s.type),
                                              (e = s.dependencies),
                                              (i.dependencies =
                                                  e === null
                                                      ? null
                                                      : {
                                                            lanes: e.lanes,
                                                            firstContext:
                                                                e.firstContext,
                                                        })),
                                        (n = n.sibling));
                                return (U(H, (H.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    i.tail !== null &&
                        X() > bn &&
                        ((t.flags |= 128),
                        (r = !0),
                        Zn(i, !1),
                        (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = Bo(s)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            Zn(i, !0),
                            i.tail === null &&
                                i.tailMode === "hidden" &&
                                !s.alternate &&
                                !G)
                        )
                            return (ae(t), null);
                    } else
                        2 * X() - i.renderingStartTime > bn &&
                            n !== 1073741824 &&
                            ((t.flags |= 128),
                            (r = !0),
                            Zn(i, !1),
                            (t.lanes = 4194304));
                i.isBackwards
                    ? ((s.sibling = t.child), (t.child = s))
                    : ((n = i.last),
                      n !== null ? (n.sibling = s) : (t.child = s),
                      (i.last = s));
            }
            return i.tail !== null
                ? ((t = i.tail),
                  (i.rendering = t),
                  (i.tail = t.sibling),
                  (i.renderingStartTime = X()),
                  (t.sibling = null),
                  (n = H.current),
                  U(H, r ? (n & 1) | 2 : n & 1),
                  t)
                : (ae(t), null);
        case 22:
        case 23:
            return (
                Zl(),
                (r = t.memoizedState !== null),
                e !== null &&
                    (e.memoizedState !== null) !== r &&
                    (t.flags |= 8192),
                r && t.mode & 1
                    ? Ee & 1073741824 &&
                      (ae(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : ae(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(E(156, t.tag));
}
function Wh(e, t) {
    switch ((Ol(t), t.tag)) {
        case 1:
            return (
                we(t.type) && jo(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                Mn(),
                W(Se),
                W(de),
                Bl(),
                (e = t.flags),
                e & 65536 && !(e & 128)
                    ? ((t.flags = (e & -65537) | 128), t)
                    : null
            );
        case 5:
            return (Ul(t), null);
        case 13:
            if (
                (W(H),
                (e = t.memoizedState),
                e !== null && e.dehydrated !== null)
            ) {
                if (t.alternate === null) throw Error(E(340));
                Ln();
            }
            return (
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 19:
            return (W(H), null);
        case 4:
            return (Mn(), null);
        case 10:
            return (Dl(t.type._context), null);
        case 22:
        case 23:
            return (Zl(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var so = !1,
    ce = !1,
    Gh = typeof WeakSet == "function" ? WeakSet : Set,
    R = null;
function Sn(e, t) {
    var n = e.ref;
    if (n !== null)
        if (typeof n == "function")
            try {
                n(null);
            } catch (r) {
                Y(e, t, r);
            }
        else n.current = null;
}
function Vs(e, t, n) {
    try {
        n();
    } catch (r) {
        Y(e, t, r);
    }
}
var xa = !1;
function Hh(e, t) {
    if (((Ns = Io), (e = ed()), Il(e))) {
        if ("selectionStart" in e)
            var n = { start: e.selectionStart, end: e.selectionEnd };
        else
            e: {
                n = ((n = e.ownerDocument) && n.defaultView) || window;
                var r = n.getSelection && n.getSelection();
                if (r && r.rangeCount !== 0) {
                    n = r.anchorNode;
                    var o = r.anchorOffset,
                        i = r.focusNode;
                    r = r.focusOffset;
                    try {
                        (n.nodeType, i.nodeType);
                    } catch {
                        n = null;
                        break e;
                    }
                    var s = 0,
                        l = -1,
                        u = -1,
                        a = 0,
                        m = 0,
                        f = e,
                        h = null;
                    t: for (;;) {
                        for (
                            var g;
                            f !== n ||
                                (o !== 0 && f.nodeType !== 3) ||
                                (l = s + o),
                                f !== i ||
                                    (r !== 0 && f.nodeType !== 3) ||
                                    (u = s + r),
                                f.nodeType === 3 && (s += f.nodeValue.length),
                                (g = f.firstChild) !== null;
                        )
                            ((h = f), (f = g));
                        for (;;) {
                            if (f === e) break t;
                            if (
                                (h === n && ++a === o && (l = s),
                                h === i && ++m === r && (u = s),
                                (g = f.nextSibling) !== null)
                            )
                                break;
                            ((f = h), (h = f.parentNode));
                        }
                        f = g;
                    }
                    n = l === -1 || u === -1 ? null : { start: l, end: u };
                } else n = null;
            }
        n = n || { start: 0, end: 0 };
    } else n = null;
    for (
        Ts = { focusedElem: e, selectionRange: n }, Io = !1, R = t;
        R !== null;
    )
        if (
            ((t = R),
            (e = t.child),
            (t.subtreeFlags & 1028) !== 0 && e !== null)
        )
            ((e.return = t), (R = e));
        else
            for (; R !== null; ) {
                t = R;
                try {
                    var y = t.alternate;
                    if (t.flags & 1024)
                        switch (t.tag) {
                            case 0:
                            case 11:
                            case 15:
                                break;
                            case 1:
                                if (y !== null) {
                                    var S = y.memoizedProps,
                                        x = y.memoizedState,
                                        d = t.stateNode,
                                        c = d.getSnapshotBeforeUpdate(
                                            t.elementType === t.type
                                                ? S
                                                : ze(t.type, S),
                                            x
                                        );
                                    d.__reactInternalSnapshotBeforeUpdate = c;
                                }
                                break;
                            case 3:
                                var p = t.stateNode.containerInfo;
                                p.nodeType === 1
                                    ? (p.textContent = "")
                                    : p.nodeType === 9 &&
                                      p.documentElement &&
                                      p.removeChild(p.documentElement);
                                break;
                            case 5:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                throw Error(E(163));
                        }
                } catch (_) {
                    Y(t, t.return, _);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (R = e));
                    break;
                }
                R = t.return;
            }
    return ((y = xa), (xa = !1), y);
}
function pr(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var o = (r = r.next);
        do {
            if ((o.tag & e) === e) {
                var i = o.destroy;
                ((o.destroy = void 0), i !== void 0 && Vs(t, n, i));
            }
            o = o.next;
        } while (o !== r);
    }
}
function si(e, t) {
    if (
        ((t = t.updateQueue),
        (t = t !== null ? t.lastEffect : null),
        t !== null)
    ) {
        var n = (t = t.next);
        do {
            if ((n.tag & e) === e) {
                var r = n.create;
                n.destroy = r();
            }
            n = n.next;
        } while (n !== t);
    }
}
function Ws(e) {
    var t = e.ref;
    if (t !== null) {
        var n = e.stateNode;
        switch (e.tag) {
            case 5:
                e = n;
                break;
            default:
                e = n;
        }
        typeof t == "function" ? t(e) : (t.current = e);
    }
}
function Xd(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), Xd(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null &&
                (delete t[Ke],
                delete t[Rr],
                delete t[Is],
                delete t[Rh],
                delete t[Ph])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function Jd(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Ea(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || Jd(e.return)) return null;
            e = e.return;
        }
        for (
            e.sibling.return = e.return, e = e.sibling;
            e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
            if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
            ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
    }
}
function Gs(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6)
        ((e = e.stateNode),
            t
                ? n.nodeType === 8
                    ? n.parentNode.insertBefore(e, t)
                    : n.insertBefore(e, t)
                : (n.nodeType === 8
                      ? ((t = n.parentNode), t.insertBefore(e, n))
                      : ((t = n), t.appendChild(e)),
                  (n = n._reactRootContainer),
                  n != null || t.onclick !== null || (t.onclick = Lo)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Gs(e, t, n), e = e.sibling; e !== null; )
            (Gs(e, t, n), (e = e.sibling));
}
function Hs(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6)
        ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Hs(e, t, n), e = e.sibling; e !== null; )
            (Hs(e, t, n), (e = e.sibling));
}
var oe = null,
    Fe = !1;
function pt(e, t, n) {
    for (n = n.child; n !== null; ) (Zd(e, t, n), (n = n.sibling));
}
function Zd(e, t, n) {
    if (Xe && typeof Xe.onCommitFiberUnmount == "function")
        try {
            Xe.onCommitFiberUnmount(Zo, n);
        } catch {
            /* Ignore errors */
        }
    switch (n.tag) {
        case 5:
            ce || Sn(n, t);
        case 6:
            var r = oe,
                o = Fe;
            ((oe = null),
                pt(e, t, n),
                (oe = r),
                (Fe = o),
                oe !== null &&
                    (Fe
                        ? ((e = oe),
                          (n = n.stateNode),
                          e.nodeType === 8
                              ? e.parentNode.removeChild(n)
                              : e.removeChild(n))
                        : oe.removeChild(n.stateNode)));
            break;
        case 18:
            oe !== null &&
                (Fe
                    ? ((e = oe),
                      (n = n.stateNode),
                      e.nodeType === 8
                          ? Bi(e.parentNode, n)
                          : e.nodeType === 1 && Bi(e, n),
                      Er(e))
                    : Bi(oe, n.stateNode));
            break;
        case 4:
            ((r = oe),
                (o = Fe),
                (oe = n.stateNode.containerInfo),
                (Fe = !0),
                pt(e, t, n),
                (oe = r),
                (Fe = o));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (
                !ce &&
                ((r = n.updateQueue),
                r !== null && ((r = r.lastEffect), r !== null))
            ) {
                o = r = r.next;
                do {
                    var i = o,
                        s = i.destroy;
                    ((i = i.tag),
                        s !== void 0 && (i & 2 || i & 4) && Vs(n, t, s),
                        (o = o.next));
                } while (o !== r);
            }
            pt(e, t, n);
            break;
        case 1:
            if (
                !ce &&
                (Sn(n, t),
                (r = n.stateNode),
                typeof r.componentWillUnmount == "function")
            )
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (l) {
                    Y(n, t, l);
                }
            pt(e, t, n);
            break;
        case 21:
            pt(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((ce = (r = ce) || n.memoizedState !== null),
                  pt(e, t, n),
                  (ce = r))
                : pt(e, t, n);
            break;
        default:
            pt(e, t, n);
    }
}
function ka(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new Gh()),
            t.forEach(function (r) {
                var o = tg.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(o, o));
            }));
    }
}
function be(e, t) {
    var n = t.deletions;
    if (n !== null)
        for (var r = 0; r < n.length; r++) {
            var o = n[r];
            try {
                var i = e,
                    s = t,
                    l = s;
                e: for (; l !== null; ) {
                    switch (l.tag) {
                        case 5:
                            ((oe = l.stateNode), (Fe = !1));
                            break e;
                        case 3:
                            ((oe = l.stateNode.containerInfo), (Fe = !0));
                            break e;
                        case 4:
                            ((oe = l.stateNode.containerInfo), (Fe = !0));
                            break e;
                    }
                    l = l.return;
                }
                if (oe === null) throw Error(E(160));
                (Zd(i, s, o), (oe = null), (Fe = !1));
                var u = o.alternate;
                (u !== null && (u.return = null), (o.return = null));
            } catch (a) {
                Y(o, t, a);
            }
        }
    if (t.subtreeFlags & 12854)
        for (t = t.child; t !== null; ) (qd(t, e), (t = t.sibling));
}
function qd(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((be(t, e), Ge(e), r & 4)) {
                try {
                    (pr(3, e, e.return), si(3, e));
                } catch (S) {
                    Y(e, e.return, S);
                }
                try {
                    pr(5, e, e.return);
                } catch (S) {
                    Y(e, e.return, S);
                }
            }
            break;
        case 1:
            (be(t, e), Ge(e), r & 512 && n !== null && Sn(n, n.return));
            break;
        case 5:
            if (
                (be(t, e),
                Ge(e),
                r & 512 && n !== null && Sn(n, n.return),
                e.flags & 32)
            ) {
                var o = e.stateNode;
                try {
                    Sr(o, "");
                } catch (S) {
                    Y(e, e.return, S);
                }
            }
            if (r & 4 && ((o = e.stateNode), o != null)) {
                var i = e.memoizedProps,
                    s = n !== null ? n.memoizedProps : i,
                    l = e.type,
                    u = e.updateQueue;
                if (((e.updateQueue = null), u !== null))
                    try {
                        (l === "input" &&
                            i.type === "radio" &&
                            i.name != null &&
                            _c(o, i),
                            gs(l, s));
                        var a = gs(l, i);
                        for (s = 0; s < u.length; s += 2) {
                            var m = u[s],
                                f = u[s + 1];
                            m === "style"
                                ? Nc(o, f)
                                : m === "dangerouslySetInnerHTML"
                                  ? kc(o, f)
                                  : m === "children"
                                    ? Sr(o, f)
                                    : yl(o, m, f, a);
                        }
                        switch (l) {
                            case "input":
                                ds(o, i);
                                break;
                            case "textarea":
                                xc(o, i);
                                break;
                            case "select":
                                var h = o._wrapperState.wasMultiple;
                                o._wrapperState.wasMultiple = !!i.multiple;
                                var g = i.value;
                                g != null
                                    ? xn(o, !!i.multiple, g, !1)
                                    : h !== !!i.multiple &&
                                      (i.defaultValue != null
                                          ? xn(
                                                o,
                                                !!i.multiple,
                                                i.defaultValue,
                                                !0
                                            )
                                          : xn(
                                                o,
                                                !!i.multiple,
                                                i.multiple ? [] : "",
                                                !1
                                            ));
                        }
                        o[Rr] = i;
                    } catch (S) {
                        Y(e, e.return, S);
                    }
            }
            break;
        case 6:
            if ((be(t, e), Ge(e), r & 4)) {
                if (e.stateNode === null) throw Error(E(162));
                ((o = e.stateNode), (i = e.memoizedProps));
                try {
                    o.nodeValue = i;
                } catch (S) {
                    Y(e, e.return, S);
                }
            }
            break;
        case 3:
            if (
                (be(t, e),
                Ge(e),
                r & 4 && n !== null && n.memoizedState.isDehydrated)
            )
                try {
                    Er(t.containerInfo);
                } catch (S) {
                    Y(e, e.return, S);
                }
            break;
        case 4:
            (be(t, e), Ge(e));
            break;
        case 13:
            (be(t, e),
                Ge(e),
                (o = e.child),
                o.flags & 8192 &&
                    ((i = o.memoizedState !== null),
                    (o.stateNode.isHidden = i),
                    !i ||
                        (o.alternate !== null &&
                            o.alternate.memoizedState !== null) ||
                        (Xl = X())),
                r & 4 && ka(e));
            break;
        case 22:
            if (
                ((m = n !== null && n.memoizedState !== null),
                e.mode & 1
                    ? ((ce = (a = ce) || m), be(t, e), (ce = a))
                    : be(t, e),
                Ge(e),
                r & 8192)
            ) {
                if (
                    ((a = e.memoizedState !== null),
                    (e.stateNode.isHidden = a) && !m && e.mode & 1)
                )
                    for (R = e, m = e.child; m !== null; ) {
                        for (f = R = m; R !== null; ) {
                            switch (((h = R), (g = h.child), h.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    pr(4, h, h.return);
                                    break;
                                case 1:
                                    Sn(h, h.return);
                                    var y = h.stateNode;
                                    if (
                                        typeof y.componentWillUnmount ==
                                        "function"
                                    ) {
                                        ((r = h), (n = h.return));
                                        try {
                                            ((t = r),
                                                (y.props = t.memoizedProps),
                                                (y.state = t.memoizedState),
                                                y.componentWillUnmount());
                                        } catch (S) {
                                            Y(r, n, S);
                                        }
                                    }
                                    break;
                                case 5:
                                    Sn(h, h.return);
                                    break;
                                case 22:
                                    if (h.memoizedState !== null) {
                                        Na(f);
                                        continue;
                                    }
                            }
                            g !== null ? ((g.return = h), (R = g)) : Na(f);
                        }
                        m = m.sibling;
                    }
                e: for (m = null, f = e; ; ) {
                    if (f.tag === 5) {
                        if (m === null) {
                            m = f;
                            try {
                                ((o = f.stateNode),
                                    a
                                        ? ((i = o.style),
                                          typeof i.setProperty == "function"
                                              ? i.setProperty(
                                                    "display",
                                                    "none",
                                                    "important"
                                                )
                                              : (i.display = "none"))
                                        : ((l = f.stateNode),
                                          (u = f.memoizedProps.style),
                                          (s =
                                              u != null &&
                                              u.hasOwnProperty("display")
                                                  ? u.display
                                                  : null),
                                          (l.style.display = Cc(
                                              "display",
                                              s
                                          ))));
                            } catch (S) {
                                Y(e, e.return, S);
                            }
                        }
                    } else if (f.tag === 6) {
                        if (m === null)
                            try {
                                f.stateNode.nodeValue = a
                                    ? ""
                                    : f.memoizedProps;
                            } catch (S) {
                                Y(e, e.return, S);
                            }
                    } else if (
                        ((f.tag !== 22 && f.tag !== 23) ||
                            f.memoizedState === null ||
                            f === e) &&
                        f.child !== null
                    ) {
                        ((f.child.return = f), (f = f.child));
                        continue;
                    }
                    if (f === e) break e;
                    for (; f.sibling === null; ) {
                        if (f.return === null || f.return === e) break e;
                        (m === f && (m = null), (f = f.return));
                    }
                    (m === f && (m = null),
                        (f.sibling.return = f.return),
                        (f = f.sibling));
                }
            }
            break;
        case 19:
            (be(t, e), Ge(e), r & 4 && ka(e));
            break;
        case 21:
            break;
        default:
            (be(t, e), Ge(e));
    }
}
function Ge(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (Jd(n)) {
                        var r = n;
                        break e;
                    }
                    n = n.return;
                }
                throw Error(E(160));
            }
            switch (r.tag) {
                case 5:
                    var o = r.stateNode;
                    r.flags & 32 && (Sr(o, ""), (r.flags &= -33));
                    var i = Ea(e);
                    Hs(e, i, o);
                    break;
                case 3:
                case 4:
                    var s = r.stateNode.containerInfo,
                        l = Ea(e);
                    Gs(e, l, s);
                    break;
                default:
                    throw Error(E(161));
            }
        } catch (u) {
            Y(e, e.return, u);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function Qh(e, t, n) {
    ((R = e), ef(e));
}
function ef(e, t, n) {
    for (var r = (e.mode & 1) !== 0; R !== null; ) {
        var o = R,
            i = o.child;
        if (o.tag === 22 && r) {
            var s = o.memoizedState !== null || so;
            if (!s) {
                var l = o.alternate,
                    u = (l !== null && l.memoizedState !== null) || ce;
                l = so;
                var a = ce;
                if (((so = s), (ce = u) && !a))
                    for (R = o; R !== null; )
                        ((s = R),
                            (u = s.child),
                            s.tag === 22 && s.memoizedState !== null
                                ? Ta(o)
                                : u !== null
                                  ? ((u.return = s), (R = u))
                                  : Ta(o));
                for (; i !== null; ) ((R = i), ef(i), (i = i.sibling));
                ((R = o), (so = l), (ce = a));
            }
            Ca(e);
        } else
            o.subtreeFlags & 8772 && i !== null
                ? ((i.return = o), (R = i))
                : Ca(e);
    }
}
function Ca(e) {
    for (; R !== null; ) {
        var t = R;
        if (t.flags & 8772) {
            var n = t.alternate;
            try {
                if (t.flags & 8772)
                    switch (t.tag) {
                        case 0:
                        case 11:
                        case 15:
                            ce || si(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !ce)
                                if (n === null) r.componentDidMount();
                                else {
                                    var o =
                                        t.elementType === t.type
                                            ? n.memoizedProps
                                            : ze(t.type, n.memoizedProps);
                                    r.componentDidUpdate(
                                        o,
                                        n.memoizedState,
                                        r.__reactInternalSnapshotBeforeUpdate
                                    );
                                }
                            var i = t.updateQueue;
                            i !== null && aa(t, i, r);
                            break;
                        case 3:
                            var s = t.updateQueue;
                            if (s !== null) {
                                if (((n = null), t.child !== null))
                                    switch (t.child.tag) {
                                        case 5:
                                            n = t.child.stateNode;
                                            break;
                                        case 1:
                                            n = t.child.stateNode;
                                    }
                                aa(t, s, n);
                            }
                            break;
                        case 5:
                            var l = t.stateNode;
                            if (n === null && t.flags & 4) {
                                n = l;
                                var u = t.memoizedProps;
                                switch (t.type) {
                                    case "button":
                                    case "input":
                                    case "select":
                                    case "textarea":
                                        u.autoFocus && n.focus();
                                        break;
                                    case "img":
                                        u.src && (n.src = u.src);
                                }
                            }
                            break;
                        case 6:
                            break;
                        case 4:
                            break;
                        case 12:
                            break;
                        case 13:
                            if (t.memoizedState === null) {
                                var a = t.alternate;
                                if (a !== null) {
                                    var m = a.memoizedState;
                                    if (m !== null) {
                                        var f = m.dehydrated;
                                        f !== null && Er(f);
                                    }
                                }
                            }
                            break;
                        case 19:
                        case 17:
                        case 21:
                        case 22:
                        case 23:
                        case 25:
                            break;
                        default:
                            throw Error(E(163));
                    }
                ce || (t.flags & 512 && Ws(t));
            } catch (h) {
                Y(t, t.return, h);
            }
        }
        if (t === e) {
            R = null;
            break;
        }
        if (((n = t.sibling), n !== null)) {
            ((n.return = t.return), (R = n));
            break;
        }
        R = t.return;
    }
}
function Na(e) {
    for (; R !== null; ) {
        var t = R;
        if (t === e) {
            R = null;
            break;
        }
        var n = t.sibling;
        if (n !== null) {
            ((n.return = t.return), (R = n));
            break;
        }
        R = t.return;
    }
}
function Ta(e) {
    for (; R !== null; ) {
        var t = R;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        si(4, t);
                    } catch (u) {
                        Y(t, n, u);
                    }
                    break;
                case 1:
                    var r = t.stateNode;
                    if (typeof r.componentDidMount == "function") {
                        var o = t.return;
                        try {
                            r.componentDidMount();
                        } catch (u) {
                            Y(t, o, u);
                        }
                    }
                    var i = t.return;
                    try {
                        Ws(t);
                    } catch (u) {
                        Y(t, i, u);
                    }
                    break;
                case 5:
                    var s = t.return;
                    try {
                        Ws(t);
                    } catch (u) {
                        Y(t, s, u);
                    }
            }
        } catch (u) {
            Y(t, t.return, u);
        }
        if (t === e) {
            R = null;
            break;
        }
        var l = t.sibling;
        if (l !== null) {
            ((l.return = t.return), (R = l));
            break;
        }
        R = t.return;
    }
}
var Kh = Math.ceil,
    Wo = dt.ReactCurrentDispatcher,
    Kl = dt.ReactCurrentOwner,
    Oe = dt.ReactCurrentBatchConfig,
    M = 0,
    re = null,
    J = null,
    ie = 0,
    Ee = 0,
    wn = Mt(0),
    ee = 0,
    jr = null,
    Zt = 0,
    li = 0,
    Yl = 0,
    mr = null,
    ye = null,
    Xl = 0,
    bn = 1 / 0,
    et = null,
    Go = !1,
    Qs = null,
    Rt = null,
    lo = !1,
    xt = null,
    Ho = 0,
    hr = 0,
    Ks = null,
    _o = -1,
    xo = 0;
function me() {
    return M & 6 ? X() : _o !== -1 ? _o : (_o = X());
}
function Pt(e) {
    return e.mode & 1
        ? M & 2 && ie !== 0
            ? ie & -ie
            : Ah.transition !== null
              ? (xo === 0 && (xo = zc()), xo)
              : ((e = z),
                e !== 0 ||
                    ((e = window.event), (e = e === void 0 ? 16 : Gc(e.type))),
                e)
        : 1;
}
function $e(e, t, n, r) {
    if (50 < hr) throw ((hr = 0), (Ks = null), Error(E(185)));
    (zr(e, n, r),
        (!(M & 2) || e !== re) &&
            (e === re && (!(M & 2) && (li |= n), ee === 4 && wt(e, ie)),
            _e(e, r),
            n === 1 &&
                M === 0 &&
                !(t.mode & 1) &&
                ((bn = X() + 500), ri && Dt())));
}
function _e(e, t) {
    var n = e.callbackNode;
    Am(e, t);
    var r = Po(e, e === re ? ie : 0);
    if (r === 0)
        (n !== null && Du(n),
            (e.callbackNode = null),
            (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && Du(n), t === 1))
            (e.tag === 0 ? Ih(Ra.bind(null, e)) : cd(Ra.bind(null, e)),
                Nh(function () {
                    !(M & 6) && Dt();
                }),
                (n = null));
        else {
            switch (Fc(r)) {
                case 1:
                    n = xl;
                    break;
                case 4:
                    n = Dc;
                    break;
                case 16:
                    n = Ro;
                    break;
                case 536870912:
                    n = bc;
                    break;
                default:
                    n = Ro;
            }
            n = af(n, tf.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function tf(e, t) {
    if (((_o = -1), (xo = 0), M & 6)) throw Error(E(327));
    var n = e.callbackNode;
    if (Tn() && e.callbackNode !== n) return null;
    var r = Po(e, e === re ? ie : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = Qo(e, r);
    else {
        t = r;
        var o = M;
        M |= 2;
        var i = rf();
        (re !== e || ie !== t) && ((et = null), (bn = X() + 500), Gt(e, t));
        do
            try {
                Jh();
                break;
            } catch (l) {
                nf(e, l);
            }
        while (!0);
        (Ml(),
            (Wo.current = i),
            (M = o),
            J !== null ? (t = 0) : ((re = null), (ie = 0), (t = ee)));
    }
    if (t !== 0) {
        if (
            (t === 2 && ((o = _s(e)), o !== 0 && ((r = o), (t = Ys(e, o)))),
            t === 1)
        )
            throw ((n = jr), Gt(e, 0), wt(e, r), _e(e, X()), n);
        if (t === 6) wt(e, r);
        else {
            if (
                ((o = e.current.alternate),
                !(r & 30) &&
                    !Yh(o) &&
                    ((t = Qo(e, r)),
                    t === 2 &&
                        ((i = _s(e)), i !== 0 && ((r = i), (t = Ys(e, i)))),
                    t === 1))
            )
                throw ((n = jr), Gt(e, 0), wt(e, r), _e(e, X()), n);
            switch (((e.finishedWork = o), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(E(345));
                case 2:
                    Ut(e, ye, et);
                    break;
                case 3:
                    if (
                        (wt(e, r),
                        (r & 130023424) === r && ((t = Xl + 500 - X()), 10 < t))
                    ) {
                        if (Po(e, 0) !== 0) break;
                        if (((o = e.suspendedLanes), (o & r) !== r)) {
                            (me(), (e.pingedLanes |= e.suspendedLanes & o));
                            break;
                        }
                        e.timeoutHandle = Ps(Ut.bind(null, e, ye, et), t);
                        break;
                    }
                    Ut(e, ye, et);
                    break;
                case 4:
                    if ((wt(e, r), (r & 4194240) === r)) break;
                    for (t = e.eventTimes, o = -1; 0 < r; ) {
                        var s = 31 - Be(r);
                        ((i = 1 << s), (s = t[s]), s > o && (o = s), (r &= ~i));
                    }
                    if (
                        ((r = o),
                        (r = X() - r),
                        (r =
                            (120 > r
                                ? 120
                                : 480 > r
                                  ? 480
                                  : 1080 > r
                                    ? 1080
                                    : 1920 > r
                                      ? 1920
                                      : 3e3 > r
                                        ? 3e3
                                        : 4320 > r
                                          ? 4320
                                          : 1960 * Kh(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = Ps(Ut.bind(null, e, ye, et), r);
                        break;
                    }
                    Ut(e, ye, et);
                    break;
                case 5:
                    Ut(e, ye, et);
                    break;
                default:
                    throw Error(E(329));
            }
        }
    }
    return (_e(e, X()), e.callbackNode === n ? tf.bind(null, e) : null);
}
function Ys(e, t) {
    var n = mr;
    return (
        e.current.memoizedState.isDehydrated && (Gt(e, t).flags |= 256),
        (e = Qo(e, t)),
        e !== 2 && ((t = ye), (ye = n), t !== null && Xs(t)),
        e
    );
}
function Xs(e) {
    ye === null ? (ye = e) : ye.push.apply(ye, e);
}
function Yh(e) {
    for (var t = e; ; ) {
        if (t.flags & 16384) {
            var n = t.updateQueue;
            if (n !== null && ((n = n.stores), n !== null))
                for (var r = 0; r < n.length; r++) {
                    var o = n[r],
                        i = o.getSnapshot;
                    o = o.value;
                    try {
                        if (!Ve(i(), o)) return !1;
                    } catch {
                        return !1;
                    }
                }
        }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
            ((n.return = t), (t = n));
        else {
            if (t === e) break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e) return !0;
                t = t.return;
            }
            ((t.sibling.return = t.return), (t = t.sibling));
        }
    }
    return !0;
}
function wt(e, t) {
    for (
        t &= ~Yl,
            t &= ~li,
            e.suspendedLanes |= t,
            e.pingedLanes &= ~t,
            e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - Be(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function Ra(e) {
    if (M & 6) throw Error(E(327));
    Tn();
    var t = Po(e, 0);
    if (!(t & 1)) return (_e(e, X()), null);
    var n = Qo(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = _s(e);
        r !== 0 && ((t = r), (n = Ys(e, r)));
    }
    if (n === 1) throw ((n = jr), Gt(e, 0), wt(e, t), _e(e, X()), n);
    if (n === 6) throw Error(E(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        Ut(e, ye, et),
        _e(e, X()),
        null
    );
}
function Jl(e, t) {
    var n = M;
    M |= 1;
    try {
        return e(t);
    } finally {
        ((M = n), M === 0 && ((bn = X() + 500), ri && Dt()));
    }
}
function qt(e) {
    xt !== null && xt.tag === 0 && !(M & 6) && Tn();
    var t = M;
    M |= 1;
    var n = Oe.transition,
        r = z;
    try {
        if (((Oe.transition = null), (z = 1), e)) return e();
    } finally {
        ((z = r), (Oe.transition = n), (M = t), !(M & 6) && Dt());
    }
}
function Zl() {
    ((Ee = wn.current), W(wn));
}
function Gt(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), Ch(n)), J !== null))
        for (n = J.return; n !== null; ) {
            var r = n;
            switch ((Ol(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && jo());
                    break;
                case 3:
                    (Mn(), W(Se), W(de), Bl());
                    break;
                case 5:
                    Ul(r);
                    break;
                case 4:
                    Mn();
                    break;
                case 13:
                    W(H);
                    break;
                case 19:
                    W(H);
                    break;
                case 10:
                    Dl(r.type._context);
                    break;
                case 22:
                case 23:
                    Zl();
            }
            n = n.return;
        }
    if (
        ((re = e),
        (J = e = It(e.current, null)),
        (ie = Ee = t),
        (ee = 0),
        (jr = null),
        (Yl = li = Zt = 0),
        (ye = mr = null),
        Vt !== null)
    ) {
        for (t = 0; t < Vt.length; t++)
            if (((n = Vt[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var o = r.next,
                    i = n.pending;
                if (i !== null) {
                    var s = i.next;
                    ((i.next = o), (r.next = s));
                }
                n.pending = r;
            }
        Vt = null;
    }
    return e;
}
function nf(e, t) {
    do {
        var n = J;
        try {
            if ((Ml(), (vo.current = Vo), $o)) {
                for (var r = Q.memoizedState; r !== null; ) {
                    var o = r.queue;
                    (o !== null && (o.pending = null), (r = r.next));
                }
                $o = !1;
            }
            if (
                ((Jt = 0),
                (ne = q = Q = null),
                (fr = !1),
                (Ar = 0),
                (Kl.current = null),
                n === null || n.return === null)
            ) {
                ((ee = 1), (jr = t), (J = null));
                break;
            }
            e: {
                var i = e,
                    s = n.return,
                    l = n,
                    u = t;
                if (
                    ((t = ie),
                    (l.flags |= 32768),
                    u !== null &&
                        typeof u == "object" &&
                        typeof u.then == "function")
                ) {
                    var a = u,
                        m = l,
                        f = m.tag;
                    if (!(m.mode & 1) && (f === 0 || f === 11 || f === 15)) {
                        var h = m.alternate;
                        h
                            ? ((m.updateQueue = h.updateQueue),
                              (m.memoizedState = h.memoizedState),
                              (m.lanes = h.lanes))
                            : ((m.updateQueue = null),
                              (m.memoizedState = null));
                    }
                    var g = ha(s);
                    if (g !== null) {
                        ((g.flags &= -257),
                            ga(g, s, l, i, t),
                            g.mode & 1 && ma(i, a, t),
                            (t = g),
                            (u = a));
                        var y = t.updateQueue;
                        if (y === null) {
                            var S = new Set();
                            (S.add(u), (t.updateQueue = S));
                        } else y.add(u);
                        break e;
                    } else {
                        if (!(t & 1)) {
                            (ma(i, a, t), ql());
                            break e;
                        }
                        u = Error(E(426));
                    }
                } else if (G && l.mode & 1) {
                    var x = ha(s);
                    if (x !== null) {
                        (!(x.flags & 65536) && (x.flags |= 256),
                            ga(x, s, l, i, t),
                            Ll(Dn(u, l)));
                        break e;
                    }
                }
                ((i = u = Dn(u, l)),
                    ee !== 4 && (ee = 2),
                    mr === null ? (mr = [i]) : mr.push(i),
                    (i = s));
                do {
                    switch (i.tag) {
                        case 3:
                            ((i.flags |= 65536), (t &= -t), (i.lanes |= t));
                            var d = Fd(i, u, t);
                            ua(i, d);
                            break e;
                        case 1:
                            l = u;
                            var c = i.type,
                                p = i.stateNode;
                            if (
                                !(i.flags & 128) &&
                                (typeof c.getDerivedStateFromError ==
                                    "function" ||
                                    (p !== null &&
                                        typeof p.componentDidCatch ==
                                            "function" &&
                                        (Rt === null || !Rt.has(p))))
                            ) {
                                ((i.flags |= 65536), (t &= -t), (i.lanes |= t));
                                var _ = Ud(i, l, t);
                                ua(i, _);
                                break e;
                            }
                    }
                    i = i.return;
                } while (i !== null);
            }
            sf(n);
        } catch (k) {
            ((t = k), J === n && n !== null && (J = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function rf() {
    var e = Wo.current;
    return ((Wo.current = Vo), e === null ? Vo : e);
}
function ql() {
    ((ee === 0 || ee === 3 || ee === 2) && (ee = 4),
        re === null || (!(Zt & 268435455) && !(li & 268435455)) || wt(re, ie));
}
function Qo(e, t) {
    var n = M;
    M |= 2;
    var r = rf();
    (re !== e || ie !== t) && ((et = null), Gt(e, t));
    do
        try {
            Xh();
            break;
        } catch (o) {
            nf(e, o);
        }
    while (!0);
    if ((Ml(), (M = n), (Wo.current = r), J !== null)) throw Error(E(261));
    return ((re = null), (ie = 0), ee);
}
function Xh() {
    for (; J !== null; ) of(J);
}
function Jh() {
    for (; J !== null && !xm(); ) of(J);
}
function of(e) {
    var t = uf(e.alternate, e, Ee);
    ((e.memoizedProps = e.pendingProps),
        t === null ? sf(e) : (J = t),
        (Kl.current = null));
}
function sf(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = Wh(n, t)), n !== null)) {
                ((n.flags &= 32767), (J = n));
                return;
            }
            if (e !== null)
                ((e.flags |= 32768),
                    (e.subtreeFlags = 0),
                    (e.deletions = null));
            else {
                ((ee = 6), (J = null));
                return;
            }
        } else if (((n = Vh(n, t, Ee)), n !== null)) {
            J = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            J = t;
            return;
        }
        J = t = e;
    } while (t !== null);
    ee === 0 && (ee = 5);
}
function Ut(e, t, n) {
    var r = z,
        o = Oe.transition;
    try {
        ((Oe.transition = null), (z = 1), Zh(e, t, n, r));
    } finally {
        ((Oe.transition = o), (z = r));
    }
    return null;
}
function Zh(e, t, n, r) {
    do Tn();
    while (xt !== null);
    if (M & 6) throw Error(E(327));
    n = e.finishedWork;
    var o = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current))
        throw Error(E(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var i = n.lanes | n.childLanes;
    if (
        (Om(e, i),
        e === re && ((J = re = null), (ie = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            lo ||
            ((lo = !0),
            af(Ro, function () {
                return (Tn(), null);
            })),
        (i = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || i)
    ) {
        ((i = Oe.transition), (Oe.transition = null));
        var s = z;
        z = 1;
        var l = M;
        ((M |= 4),
            (Kl.current = null),
            Hh(e, n),
            qd(n, e),
            vh(Ts),
            (Io = !!Ns),
            (Ts = Ns = null),
            (e.current = n),
            Qh(n),
            Em(),
            (M = l),
            (z = s),
            (Oe.transition = i));
    } else e.current = n;
    if (
        (lo && ((lo = !1), (xt = e), (Ho = o)),
        (i = e.pendingLanes),
        i === 0 && (Rt = null),
        Nm(n.stateNode),
        _e(e, X()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((o = t[n]),
                r(o.value, { componentStack: o.stack, digest: o.digest }));
    if (Go) throw ((Go = !1), (e = Qs), (Qs = null), e);
    return (
        Ho & 1 && e.tag !== 0 && Tn(),
        (i = e.pendingLanes),
        i & 1 ? (e === Ks ? hr++ : ((hr = 0), (Ks = e))) : (hr = 0),
        Dt(),
        null
    );
}
function Tn() {
    if (xt !== null) {
        var e = Fc(Ho),
            t = Oe.transition,
            n = z;
        try {
            if (((Oe.transition = null), (z = 16 > e ? 16 : e), xt === null))
                var r = !1;
            else {
                if (((e = xt), (xt = null), (Ho = 0), M & 6))
                    throw Error(E(331));
                var o = M;
                for (M |= 4, R = e.current; R !== null; ) {
                    var i = R,
                        s = i.child;
                    if (R.flags & 16) {
                        var l = i.deletions;
                        if (l !== null) {
                            for (var u = 0; u < l.length; u++) {
                                var a = l[u];
                                for (R = a; R !== null; ) {
                                    var m = R;
                                    switch (m.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            pr(8, m, i);
                                    }
                                    var f = m.child;
                                    if (f !== null) ((f.return = m), (R = f));
                                    else
                                        for (; R !== null; ) {
                                            m = R;
                                            var h = m.sibling,
                                                g = m.return;
                                            if ((Xd(m), m === a)) {
                                                R = null;
                                                break;
                                            }
                                            if (h !== null) {
                                                ((h.return = g), (R = h));
                                                break;
                                            }
                                            R = g;
                                        }
                                }
                            }
                            var y = i.alternate;
                            if (y !== null) {
                                var S = y.child;
                                if (S !== null) {
                                    y.child = null;
                                    do {
                                        var x = S.sibling;
                                        ((S.sibling = null), (S = x));
                                    } while (S !== null);
                                }
                            }
                            R = i;
                        }
                    }
                    if (i.subtreeFlags & 2064 && s !== null)
                        ((s.return = i), (R = s));
                    else
                        e: for (; R !== null; ) {
                            if (((i = R), i.flags & 2048))
                                switch (i.tag) {
                                    case 0:
                                    case 11:
                                    case 15:
                                        pr(9, i, i.return);
                                }
                            var d = i.sibling;
                            if (d !== null) {
                                ((d.return = i.return), (R = d));
                                break e;
                            }
                            R = i.return;
                        }
                }
                var c = e.current;
                for (R = c; R !== null; ) {
                    s = R;
                    var p = s.child;
                    if (s.subtreeFlags & 2064 && p !== null)
                        ((p.return = s), (R = p));
                    else
                        e: for (s = c; R !== null; ) {
                            if (((l = R), l.flags & 2048))
                                try {
                                    switch (l.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            si(9, l);
                                    }
                                } catch (k) {
                                    Y(l, l.return, k);
                                }
                            if (l === s) {
                                R = null;
                                break e;
                            }
                            var _ = l.sibling;
                            if (_ !== null) {
                                ((_.return = l.return), (R = _));
                                break e;
                            }
                            R = l.return;
                        }
                }
                if (
                    ((M = o),
                    Dt(),
                    Xe && typeof Xe.onPostCommitFiberRoot == "function")
                )
                    try {
                        Xe.onPostCommitFiberRoot(Zo, e);
                    } catch {
                        /* Ignore errors */
                    }
                r = !0;
            }
            return r;
        } finally {
            ((z = n), (Oe.transition = t));
        }
    }
    return !1;
}
function Pa(e, t, n) {
    ((t = Dn(n, t)),
        (t = Fd(e, t, 1)),
        (e = Tt(e, t, 1)),
        (t = me()),
        e !== null && (zr(e, 1, t), _e(e, t)));
}
function Y(e, t, n) {
    if (e.tag === 3) Pa(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                Pa(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == "function" ||
                    (typeof r.componentDidCatch == "function" &&
                        (Rt === null || !Rt.has(r)))
                ) {
                    ((e = Dn(n, e)),
                        (e = Ud(t, e, 1)),
                        (t = Tt(t, e, 1)),
                        (e = me()),
                        t !== null && (zr(t, 1, e), _e(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function qh(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = me()),
        (e.pingedLanes |= e.suspendedLanes & n),
        re === e &&
            (ie & n) === n &&
            (ee === 4 || (ee === 3 && (ie & 130023424) === ie && 500 > X() - Xl)
                ? Gt(e, 0)
                : (Yl |= n)),
        _e(e, t));
}
function lf(e, t) {
    t === 0 &&
        (e.mode & 1
            ? ((t = Jr), (Jr <<= 1), !(Jr & 130023424) && (Jr = 4194304))
            : (t = 1));
    var n = me();
    ((e = ut(e, t)), e !== null && (zr(e, t, n), _e(e, n)));
}
function eg(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), lf(e, n));
}
function tg(e, t) {
    var n = 0;
    switch (e.tag) {
        case 13:
            var r = e.stateNode,
                o = e.memoizedState;
            o !== null && (n = o.retryLane);
            break;
        case 19:
            r = e.stateNode;
            break;
        default:
            throw Error(E(314));
    }
    (r !== null && r.delete(t), lf(e, n));
}
var uf;
uf = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Se.current) ve = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128))
                return ((ve = !1), $h(e, t, n));
            ve = !!(e.flags & 131072);
        }
    else ((ve = !1), G && t.flags & 1048576 && dd(t, bo, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            (wo(e, t), (e = t.pendingProps));
            var o = On(t, de.current);
            (Nn(t, n), (o = Vl(null, t, r, e, o, n)));
            var i = Wl();
            return (
                (t.flags |= 1),
                typeof o == "object" &&
                o !== null &&
                typeof o.render == "function" &&
                o.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      we(r) ? ((i = !0), Mo(t)) : (i = !1),
                      (t.memoizedState =
                          o.state !== null && o.state !== void 0
                              ? o.state
                              : null),
                      zl(t),
                      (o.updater = ii),
                      (t.stateNode = o),
                      (o._reactInternals = t),
                      Ds(t, r, e, n),
                      (t = Fs(null, t, r, !0, i, n)))
                    : ((t.tag = 0),
                      G && i && Al(t),
                      fe(null, t, o, n),
                      (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    (wo(e, t),
                    (e = t.pendingProps),
                    (o = r._init),
                    (r = o(r._payload)),
                    (t.type = r),
                    (o = t.tag = rg(r)),
                    (e = ze(r, e)),
                    o)
                ) {
                    case 0:
                        t = zs(null, t, r, e, n);
                        break e;
                    case 1:
                        t = Sa(null, t, r, e, n);
                        break e;
                    case 11:
                        t = ya(null, t, r, e, n);
                        break e;
                    case 14:
                        t = va(null, t, r, ze(r.type, e), n);
                        break e;
                }
                throw Error(E(306, r, ""));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (o = t.pendingProps),
                (o = t.elementType === r ? o : ze(r, o)),
                zs(e, t, r, o, n)
            );
        case 1:
            return (
                (r = t.type),
                (o = t.pendingProps),
                (o = t.elementType === r ? o : ze(r, o)),
                Sa(e, t, r, o, n)
            );
        case 3:
            e: {
                if ((Wd(t), e === null)) throw Error(E(387));
                ((r = t.pendingProps),
                    (i = t.memoizedState),
                    (o = i.element),
                    yd(e, t),
                    Uo(t, r, null, n));
                var s = t.memoizedState;
                if (((r = s.element), i.isDehydrated))
                    if (
                        ((i = {
                            element: r,
                            isDehydrated: !1,
                            cache: s.cache,
                            pendingSuspenseBoundaries:
                                s.pendingSuspenseBoundaries,
                            transitions: s.transitions,
                        }),
                        (t.updateQueue.baseState = i),
                        (t.memoizedState = i),
                        t.flags & 256)
                    ) {
                        ((o = Dn(Error(E(423)), t)), (t = wa(e, t, r, n, o)));
                        break e;
                    } else if (r !== o) {
                        ((o = Dn(Error(E(424)), t)), (t = wa(e, t, r, n, o)));
                        break e;
                    } else
                        for (
                            ke = Nt(t.stateNode.containerInfo.firstChild),
                                Ce = t,
                                G = !0,
                                Ue = null,
                                n = hd(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096),
                                (n = n.sibling));
                else {
                    if ((Ln(), r === o)) {
                        t = at(e, t, n);
                        break e;
                    }
                    fe(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                vd(t),
                e === null && Ls(t),
                (r = t.type),
                (o = t.pendingProps),
                (i = e !== null ? e.memoizedProps : null),
                (s = o.children),
                Rs(r, o)
                    ? (s = null)
                    : i !== null && Rs(r, i) && (t.flags |= 32),
                Vd(e, t),
                fe(e, t, s, n),
                t.child
            );
        case 6:
            return (e === null && Ls(t), null);
        case 13:
            return Gd(e, t, n);
        case 4:
            return (
                Fl(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = jn(t, null, r, n)) : fe(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (o = t.pendingProps),
                (o = t.elementType === r ? o : ze(r, o)),
                ya(e, t, r, o, n)
            );
        case 7:
            return (fe(e, t, t.pendingProps, n), t.child);
        case 8:
            return (fe(e, t, t.pendingProps.children, n), t.child);
        case 12:
            return (fe(e, t, t.pendingProps.children, n), t.child);
        case 10:
            e: {
                if (
                    ((r = t.type._context),
                    (o = t.pendingProps),
                    (i = t.memoizedProps),
                    (s = o.value),
                    U(zo, r._currentValue),
                    (r._currentValue = s),
                    i !== null)
                )
                    if (Ve(i.value, s)) {
                        if (i.children === o.children && !Se.current) {
                            t = at(e, t, n);
                            break e;
                        }
                    } else
                        for (
                            i = t.child, i !== null && (i.return = t);
                            i !== null;
                        ) {
                            var l = i.dependencies;
                            if (l !== null) {
                                s = i.child;
                                for (var u = l.firstContext; u !== null; ) {
                                    if (u.context === r) {
                                        if (i.tag === 1) {
                                            ((u = it(-1, n & -n)), (u.tag = 2));
                                            var a = i.updateQueue;
                                            if (a !== null) {
                                                a = a.shared;
                                                var m = a.pending;
                                                (m === null
                                                    ? (u.next = u)
                                                    : ((u.next = m.next),
                                                      (m.next = u)),
                                                    (a.pending = u));
                                            }
                                        }
                                        ((i.lanes |= n),
                                            (u = i.alternate),
                                            u !== null && (u.lanes |= n),
                                            js(i.return, n, t),
                                            (l.lanes |= n));
                                        break;
                                    }
                                    u = u.next;
                                }
                            } else if (i.tag === 10)
                                s = i.type === t.type ? null : i.child;
                            else if (i.tag === 18) {
                                if (((s = i.return), s === null))
                                    throw Error(E(341));
                                ((s.lanes |= n),
                                    (l = s.alternate),
                                    l !== null && (l.lanes |= n),
                                    js(s, n, t),
                                    (s = i.sibling));
                            } else s = i.child;
                            if (s !== null) s.return = i;
                            else
                                for (s = i; s !== null; ) {
                                    if (s === t) {
                                        s = null;
                                        break;
                                    }
                                    if (((i = s.sibling), i !== null)) {
                                        ((i.return = s.return), (s = i));
                                        break;
                                    }
                                    s = s.return;
                                }
                            i = s;
                        }
                (fe(e, t, o.children, n), (t = t.child));
            }
            return t;
        case 9:
            return (
                (o = t.type),
                (r = t.pendingProps.children),
                Nn(t, n),
                (o = je(o)),
                (r = r(o)),
                (t.flags |= 1),
                fe(e, t, r, n),
                t.child
            );
        case 14:
            return (
                (r = t.type),
                (o = ze(r, t.pendingProps)),
                (o = ze(r.type, o)),
                va(e, t, r, o, n)
            );
        case 15:
            return Bd(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (o = t.pendingProps),
                (o = t.elementType === r ? o : ze(r, o)),
                wo(e, t),
                (t.tag = 1),
                we(r) ? ((e = !0), Mo(t)) : (e = !1),
                Nn(t, n),
                zd(t, r, o),
                Ds(t, r, o, n),
                Fs(null, t, r, !0, e, n)
            );
        case 19:
            return Hd(e, t, n);
        case 22:
            return $d(e, t, n);
    }
    throw Error(E(156, t.tag));
};
function af(e, t) {
    return Mc(e, t);
}
function ng(e, t, n, r) {
    ((this.tag = e),
        (this.key = n),
        (this.sibling =
            this.child =
            this.return =
            this.stateNode =
            this.type =
            this.elementType =
                null),
        (this.index = 0),
        (this.ref = null),
        (this.pendingProps = t),
        (this.dependencies =
            this.memoizedState =
            this.updateQueue =
            this.memoizedProps =
                null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
}
function Ae(e, t, n, r) {
    return new ng(e, t, n, r);
}
function eu(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function rg(e) {
    if (typeof e == "function") return eu(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === Sl)) return 11;
        if (e === wl) return 14;
    }
    return 2;
}
function It(e, t) {
    var n = e.alternate;
    return (
        n === null
            ? ((n = Ae(e.tag, t, e.key, e.mode)),
              (n.elementType = e.elementType),
              (n.type = e.type),
              (n.stateNode = e.stateNode),
              (n.alternate = e),
              (e.alternate = n))
            : ((n.pendingProps = t),
              (n.type = e.type),
              (n.flags = 0),
              (n.subtreeFlags = 0),
              (n.deletions = null)),
        (n.flags = e.flags & 14680064),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies =
            t === null
                ? null
                : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        n
    );
}
function Eo(e, t, n, r, o, i) {
    var s = 2;
    if (((r = e), typeof e == "function")) eu(e) && (s = 1);
    else if (typeof e == "string") s = 5;
    else
        e: switch (e) {
            case cn:
                return Ht(n.children, o, i, t);
            case vl:
                ((s = 8), (o |= 8));
                break;
            case ss:
                return (
                    (e = Ae(12, n, t, o | 2)),
                    (e.elementType = ss),
                    (e.lanes = i),
                    e
                );
            case ls:
                return (
                    (e = Ae(13, n, t, o)),
                    (e.elementType = ls),
                    (e.lanes = i),
                    e
                );
            case us:
                return (
                    (e = Ae(19, n, t, o)),
                    (e.elementType = us),
                    (e.lanes = i),
                    e
                );
            case vc:
                return ui(n, o, i, t);
            default:
                if (typeof e == "object" && e !== null)
                    switch (e.$$typeof) {
                        case gc:
                            s = 10;
                            break e;
                        case yc:
                            s = 9;
                            break e;
                        case Sl:
                            s = 11;
                            break e;
                        case wl:
                            s = 14;
                            break e;
                        case yt:
                            ((s = 16), (r = null));
                            break e;
                    }
                throw Error(E(130, e == null ? e : typeof e, ""));
        }
    return (
        (t = Ae(s, n, t, o)),
        (t.elementType = e),
        (t.type = r),
        (t.lanes = i),
        t
    );
}
function Ht(e, t, n, r) {
    return ((e = Ae(7, e, r, t)), (e.lanes = n), e);
}
function ui(e, t, n, r) {
    return (
        (e = Ae(22, e, r, t)),
        (e.elementType = vc),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function Yi(e, t, n) {
    return ((e = Ae(6, e, null, t)), (e.lanes = n), e);
}
function Xi(e, t, n) {
    return (
        (t = Ae(4, e.children !== null ? e.children : [], e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation,
        }),
        t
    );
}
function og(e, t, n, r, o) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork =
            this.pingCache =
            this.current =
            this.pendingChildren =
                null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = Ii(0)),
        (this.expirationTimes = Ii(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = Ii(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = o),
        (this.mutableSourceEagerHydrationData = null));
}
function tu(e, t, n, r, o, i, s, l, u) {
    return (
        (e = new og(e, t, n, l, u)),
        t === 1 ? ((t = 1), i === !0 && (t |= 8)) : (t = 0),
        (i = Ae(3, null, null, t)),
        (e.current = i),
        (i.stateNode = e),
        (i.memoizedState = {
            element: r,
            isDehydrated: n,
            cache: null,
            transitions: null,
            pendingSuspenseBoundaries: null,
        }),
        zl(i),
        e
    );
}
function ig(e, t, n) {
    var r =
        3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: an,
        key: r == null ? null : "" + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function cf(e) {
    if (!e) return Ot;
    e = e._reactInternals;
    e: {
        if (rn(e) !== e || e.tag !== 1) throw Error(E(170));
        var t = e;
        do {
            switch (t.tag) {
                case 3:
                    t = t.stateNode.context;
                    break e;
                case 1:
                    if (we(t.type)) {
                        t =
                            t.stateNode
                                .__reactInternalMemoizedMergedChildContext;
                        break e;
                    }
            }
            t = t.return;
        } while (t !== null);
        throw Error(E(171));
    }
    if (e.tag === 1) {
        var n = e.type;
        if (we(n)) return ad(e, n, t);
    }
    return t;
}
function df(e, t, n, r, o, i, s, l, u) {
    return (
        (e = tu(n, r, !0, e, o, i, s, l, u)),
        (e.context = cf(null)),
        (n = e.current),
        (r = me()),
        (o = Pt(n)),
        (i = it(r, o)),
        (i.callback = t ?? null),
        Tt(n, i, o),
        (e.current.lanes = o),
        zr(e, o, r),
        _e(e, r),
        e
    );
}
function ai(e, t, n, r) {
    var o = t.current,
        i = me(),
        s = Pt(o);
    return (
        (n = cf(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = it(i, s)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = Tt(o, t, s)),
        e !== null && ($e(e, o, s, i), yo(e, o, s)),
        s
    );
}
function Ko(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function Ia(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function nu(e, t) {
    (Ia(e, t), (e = e.alternate) && Ia(e, t));
}
function sg() {
    return null;
}
var ff =
    typeof reportError == "function"
        ? reportError
        : function (e) {
              console.error(e);
          };
function ru(e) {
    this._internalRoot = e;
}
ci.prototype.render = ru.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(E(409));
    ai(e, t, null, null);
};
ci.prototype.unmount = ru.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (qt(function () {
            ai(null, e, null, null);
        }),
            (t[lt] = null));
    }
};
function ci(e) {
    this._internalRoot = e;
}
ci.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = $c();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < St.length && t !== 0 && t < St[n].priority; n++);
        (St.splice(n, 0, e), n === 0 && Wc(e));
    }
};
function ou(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function di(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 ||
                e.nodeValue !== " react-mount-point-unstable "))
    );
}
function Aa() {}
function lg(e, t, n, r, o) {
    if (o) {
        if (typeof r == "function") {
            var i = r;
            r = function () {
                var a = Ko(s);
                i.call(a);
            };
        }
        var s = df(t, r, e, 0, null, !1, !1, "", Aa);
        return (
            (e._reactRootContainer = s),
            (e[lt] = s.current),
            Nr(e.nodeType === 8 ? e.parentNode : e),
            qt(),
            s
        );
    }
    for (; (o = e.lastChild); ) e.removeChild(o);
    if (typeof r == "function") {
        var l = r;
        r = function () {
            var a = Ko(u);
            l.call(a);
        };
    }
    var u = tu(e, 0, !1, null, null, !1, !1, "", Aa);
    return (
        (e._reactRootContainer = u),
        (e[lt] = u.current),
        Nr(e.nodeType === 8 ? e.parentNode : e),
        qt(function () {
            ai(t, u, n, r);
        }),
        u
    );
}
function fi(e, t, n, r, o) {
    var i = n._reactRootContainer;
    if (i) {
        var s = i;
        if (typeof o == "function") {
            var l = o;
            o = function () {
                var u = Ko(s);
                l.call(u);
            };
        }
        ai(t, s, e, o);
    } else s = lg(n, t, e, o, r);
    return Ko(s);
}
Uc = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = ir(t.pendingLanes);
                n !== 0 &&
                    (El(t, n | 1),
                    _e(t, X()),
                    !(M & 6) && ((bn = X() + 500), Dt()));
            }
            break;
        case 13:
            (qt(function () {
                var r = ut(e, 1);
                if (r !== null) {
                    var o = me();
                    $e(r, e, 1, o);
                }
            }),
                nu(e, 1));
    }
};
kl = function (e) {
    if (e.tag === 13) {
        var t = ut(e, 134217728);
        if (t !== null) {
            var n = me();
            $e(t, e, 134217728, n);
        }
        nu(e, 134217728);
    }
};
Bc = function (e) {
    if (e.tag === 13) {
        var t = Pt(e),
            n = ut(e, t);
        if (n !== null) {
            var r = me();
            $e(n, e, t, r);
        }
        nu(e, t);
    }
};
$c = function () {
    return z;
};
Vc = function (e, t) {
    var n = z;
    try {
        return ((z = e), t());
    } finally {
        z = n;
    }
};
vs = function (e, t, n) {
    switch (t) {
        case "input":
            if ((ds(e, n), (t = n.name), n.type === "radio" && t != null)) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (
                    n = n.querySelectorAll(
                        "input[name=" +
                            JSON.stringify("" + t) +
                            '][type="radio"]'
                    ),
                        t = 0;
                    t < n.length;
                    t++
                ) {
                    var r = n[t];
                    if (r !== e && r.form === e.form) {
                        var o = ni(r);
                        if (!o) throw Error(E(90));
                        (wc(r), ds(r, o));
                    }
                }
            }
            break;
        case "textarea":
            xc(e, n);
            break;
        case "select":
            ((t = n.value), t != null && xn(e, !!n.multiple, t, !1));
    }
};
Pc = Jl;
Ic = qt;
var ug = {
        usingClientEntryPoint: !1,
        Events: [
            Ur,
            mn,
            ni,
            Tc,
            Rc,
            Jl,
        ],
    },
    qn = {
        findFiberByHostInstance: $t,
        bundleType: 0,
        version: "18.3.1",
        rendererPackageName: "react-dom",
    },
    ag = {
        bundleType: qn.bundleType,
        version: qn.version,
        rendererPackageName: qn.rendererPackageName,
        rendererConfig: qn.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: dt.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = Lc(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: qn.findFiberByHostInstance || sg,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: "18.3.1-next-f1338f8080-20240426",
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var uo = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!uo.isDisabled && uo.supportsFiber)
        try {
            ((Zo = uo.inject(ag)), (Xe = uo));
        } catch {
            /* Ignore errors */
        }
}
Te.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ug;
Te.createPortal = function (e, t) {
    var n =
        2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ou(t)) throw Error(E(200));
    return ig(e, t, null, n);
};
Te.createRoot = function (e, t) {
    if (!ou(e)) throw Error(E(299));
    var n = !1,
        r = "",
        o = ff;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
        (t = tu(e, 1, !1, null, null, n, !1, r, o)),
        (e[lt] = t.current),
        Nr(e.nodeType === 8 ? e.parentNode : e),
        new ru(t)
    );
};
Te.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == "function"
            ? Error(E(188))
            : ((e = Object.keys(e).join(",")), Error(E(268, e)));
    return ((e = Lc(t)), (e = e === null ? null : e.stateNode), e);
};
Te.flushSync = function (e) {
    return qt(e);
};
Te.hydrate = function (e, t, n) {
    if (!di(t)) throw Error(E(200));
    return fi(null, e, t, !0, n);
};
Te.hydrateRoot = function (e, t, n) {
    if (!ou(e)) throw Error(E(405));
    var r = (n != null && n.hydratedSources) || null,
        o = !1,
        i = "",
        s = ff;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (o = !0),
            n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (s = n.onRecoverableError)),
        (t = df(t, null, e, 1, n ?? null, o, !1, i, s)),
        (e[lt] = t.current),
        Nr(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (o = n._getVersion),
                (o = o(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, o])
                    : t.mutableSourceEagerHydrationData.push(n, o));
    return new ci(t);
};
Te.render = function (e, t, n) {
    if (!di(t)) throw Error(E(200));
    return fi(null, e, t, !1, n);
};
Te.unmountComponentAtNode = function (e) {
    if (!di(e)) throw Error(E(40));
    return e._reactRootContainer
        ? (qt(function () {
              fi(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[lt] = null));
              });
          }),
          !0)
        : !1;
};
Te.unstable_batchedUpdates = Jl;
Te.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!di(n)) throw Error(E(200));
    if (e == null || e._reactInternals === void 0) throw Error(E(38));
    return fi(e, t, n, !1, r);
};
Te.version = "18.3.1-next-f1338f8080-20240426";
function pf() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(pf);
        } catch (e) {
            console.error(e);
        }
}
(pf(), (fc.exports = Te));
var pi = fc.exports;
const f1 = cl(pi);
var Oa = pi;
((os.createRoot = Oa.createRoot), (os.hydrateRoot = Oa.hydrateRoot));
const cg = "modulepreload",
    dg = function (e, t) {
        return new URL(e, t).href;
    },
    La = {},
    en = function (t, n, r) {
        let o = Promise.resolve();
        if (n && n.length > 0) {
            const s = document.getElementsByTagName("link"),
                l = document.querySelector("meta[property=csp-nonce]"),
                u =
                    (l == null ? void 0 : l.nonce) ||
                    (l == null ? void 0 : l.getAttribute("nonce"));
            o = Promise.allSettled(
                n.map((a) => {
                    if (((a = dg(a, r)), a in La)) return;
                    La[a] = !0;
                    const m = a.endsWith(".css"),
                        f = m ? '[rel="stylesheet"]' : "";
                    if (!!r)
                        for (let y = s.length - 1; y >= 0; y--) {
                            const S = s[y];
                            if (S.href === a && (!m || S.rel === "stylesheet"))
                                return;
                        }
                    else if (document.querySelector(`link[href="${a}"]${f}`))
                        return;
                    const g = document.createElement("link");
                    if (
                        ((g.rel = m ? "stylesheet" : cg),
                        m || (g.as = "script"),
                        (g.crossOrigin = ""),
                        (g.href = a),
                        u && g.setAttribute("nonce", u),
                        document.head.appendChild(g),
                        m)
                    )
                        return new Promise((y, S) => {
                            (g.addEventListener("load", y),
                                g.addEventListener("error", () =>
                                    S(
                                        new Error(
                                            `Unable to preload CSS for ${a}`
                                        )
                                    )
                                ));
                        });
                })
            );
        }
        function i(s) {
            const l = new Event("vite:preloadError", { cancelable: !0 });
            if (((l.payload = s), window.dispatchEvent(l), !l.defaultPrevented))
                throw s;
        }
        return o.then((s) => {
            for (const l of s || []) l.status === "rejected" && i(l.reason);
            return t().catch(i);
        });
    },
    fg = "" + new URL("fit2-B8wY8ZMb.png", import.meta.url).href,
    mf = Object.prototype.toString;
function pg(e) {
    switch (mf.call(e)) {
        case "[object Error]":
        case "[object Exception]":
        case "[object DOMException]":
        case "[object WebAssembly.Exception]":
            return !0;
        default:
            return mi(e, Error);
    }
}
function Vn(e, t) {
    return mf.call(e) === `[object ${t}]`;
}
function p1(e) {
    return Vn(e, "ErrorEvent");
}
function m1(e) {
    return Vn(e, "DOMError");
}
function h1(e) {
    return Vn(e, "DOMException");
}
function Yo(e) {
    return Vn(e, "String");
}
function mg(e) {
    return (
        typeof e == "object" &&
        e !== null &&
        "__sentry_template_string__" in e &&
        "__sentry_template_values__" in e
    );
}
function g1(e) {
    return (
        e === null || mg(e) || (typeof e != "object" && typeof e != "function")
    );
}
function iu(e) {
    return Vn(e, "Object");
}
function hg(e) {
    return typeof Event < "u" && mi(e, Event);
}
function gg(e) {
    return typeof Element < "u" && mi(e, Element);
}
function yg(e) {
    return Vn(e, "RegExp");
}
function su(e) {
    return !!(e && e.then && typeof e.then == "function");
}
function vg(e) {
    return (
        iu(e) &&
        "nativeEvent" in e &&
        "preventDefault" in e &&
        "stopPropagation" in e
    );
}
function mi(e, t) {
    try {
        return e instanceof t;
    } catch {
        return !1;
    }
}
function hf(e) {
    return !!(typeof e == "object" && e !== null && (e.__isVue || e._isVue));
}
function gr(e, t = 0) {
    return typeof e != "string" || t === 0 || e.length <= t
        ? e
        : `${e.slice(0, t)}...`;
}
function y1(e, t) {
    if (!Array.isArray(e)) return "";
    const n = [];
    for (let r = 0; r < e.length; r++) {
        const o = e[r];
        try {
            hf(o) ? n.push("[VueViewModel]") : n.push(String(o));
        } catch {
            n.push("[value cannot be serialized]");
        }
    }
    return n.join(t);
}
function Sg(e, t, n = !1) {
    return Yo(e)
        ? yg(t)
            ? t.test(e)
            : Yo(t)
              ? n
                  ? e === t
                  : e.includes(t)
              : !1
        : !1;
}
function v1(e, t = [], n = !1) {
    return t.some((r) => Sg(e, r, n));
}
const yr = "8.39.0",
    De = globalThis;
function hi(e, t, n) {
    const r = n || De,
        o = (r.__SENTRY__ = r.__SENTRY__ || {}),
        i = (o[yr] = o[yr] || {});
    return i[e] || (i[e] = t());
}
const Rn = De,
    wg = 80;
function _g(e, t = {}) {
    if (!e) return "<unknown>";
    try {
        let n = e;
        const r = 5,
            o = [];
        let i = 0,
            s = 0;
        const l = " > ",
            u = l.length;
        let a;
        const m = Array.isArray(t) ? t : t.keyAttrs,
            f = (!Array.isArray(t) && t.maxStringLength) || wg;
        for (
            ;
            n &&
            i++ < r &&
            ((a = xg(n, m)),
            !(a === "html" || (i > 1 && s + o.length * u + a.length >= f)));
        )
            (o.push(a), (s += a.length), (n = n.parentNode));
        return o.reverse().join(l);
    } catch {
        return "<unknown>";
    }
}
function xg(e, t) {
    const n = e,
        r = [];
    if (!n || !n.tagName) return "";
    if (Rn.HTMLElement && n instanceof HTMLElement && n.dataset) {
        if (n.dataset.sentryComponent) return n.dataset.sentryComponent;
        if (n.dataset.sentryElement) return n.dataset.sentryElement;
    }
    r.push(n.tagName.toLowerCase());
    const o =
        t && t.length
            ? t
                  .filter((s) => n.getAttribute(s))
                  .map((s) => [s, n.getAttribute(s)])
            : null;
    if (o && o.length)
        o.forEach((s) => {
            r.push(`[${s[0]}="${s[1]}"]`);
        });
    else {
        n.id && r.push(`#${n.id}`);
        const s = n.className;
        if (s && Yo(s)) {
            const l = s.split(/\s+/);
            for (const u of l) r.push(`.${u}`);
        }
    }
    const i = [
        "aria-label",
        "type",
        "name",
        "title",
        "alt",
    ];
    for (const s of i) {
        const l = n.getAttribute(s);
        l && r.push(`[${s}="${l}"]`);
    }
    return r.join("");
}
function S1() {
    try {
        return Rn.document.location.href;
    } catch {
        return "";
    }
}
function w1(e) {
    return Rn.document && Rn.document.querySelector
        ? Rn.document.querySelector(e)
        : null;
}
function _1(e) {
    if (!Rn.HTMLElement) return null;
    let t = e;
    const n = 5;
    for (let r = 0; r < n; r++) {
        if (!t) return null;
        if (t instanceof HTMLElement) {
            if (t.dataset.sentryComponent) return t.dataset.sentryComponent;
            if (t.dataset.sentryElement) return t.dataset.sentryElement;
        }
        t = t.parentNode;
    }
    return null;
}
const lu = typeof __SENTRY_DEBUG__ > "u" || __SENTRY_DEBUG__,
    Eg = "Sentry Logger ",
    ja = [
        "debug",
        "info",
        "warn",
        "error",
        "log",
        "assert",
        "trace",
    ],
    Ma = {};
function kg(e) {
    if (!("console" in De)) return e();
    const t = De.console,
        n = {},
        r = Object.keys(Ma);
    r.forEach((o) => {
        const i = Ma[o];
        ((n[o] = t[o]), (t[o] = i));
    });
    try {
        return e();
    } finally {
        r.forEach((o) => {
            t[o] = n[o];
        });
    }
}
function Cg() {
    let e = !1;
    const t = {
        enable: () => {
            e = !0;
        },
        disable: () => {
            e = !1;
        },
        isEnabled: () => e,
    };
    return (
        lu
            ? ja.forEach((n) => {
                  t[n] = (...r) => {
                      e &&
                          kg(() => {
                              De.console[n](`${Eg}[${n}]:`, ...r);
                          });
                  };
              })
            : ja.forEach((n) => {
                  t[n] = () => {};
              }),
        t
    );
}
const Pn = hi("logger", Cg);
function x1(e, t, n) {
    if (!(t in e)) return;
    const r = e[t],
        o = n(r);
    (typeof o == "function" && Ng(o, r), (e[t] = o));
}
function zn(e, t, n) {
    try {
        Object.defineProperty(e, t, {
            value: n,
            writable: !0,
            configurable: !0,
        });
    } catch {
        lu &&
            Pn.log(`Failed to add non-enumerable property "${t}" to object`, e);
    }
}
function Ng(e, t) {
    try {
        const n = t.prototype || {};
        ((e.prototype = t.prototype = n), zn(e, "__sentry_original__", t));
    } catch {
        /* Ignore errors */
    }
}
function E1(e) {
    return e.__sentry_original__;
}
function k1(e) {
    return Object.keys(e)
        .map((t) => `${encodeURIComponent(t)}=${encodeURIComponent(e[t])}`)
        .join("&");
}
function gf(e) {
    if (pg(e))
        return { message: e.message, name: e.name, stack: e.stack, ...ba(e) };
    if (hg(e)) {
        const t = {
            type: e.type,
            target: Da(e.target),
            currentTarget: Da(e.currentTarget),
            ...ba(e),
        };
        return (
            typeof CustomEvent < "u" &&
                mi(e, CustomEvent) &&
                (t.detail = e.detail),
            t
        );
    } else return e;
}
function Da(e) {
    try {
        return gg(e) ? _g(e) : Object.prototype.toString.call(e);
    } catch {
        return "<unknown>";
    }
}
function ba(e) {
    if (typeof e == "object" && e !== null) {
        const t = {};
        for (const n in e)
            Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
        return t;
    } else return {};
}
function C1(e, t = 40) {
    const n = Object.keys(gf(e));
    n.sort();
    const r = n[0];
    if (!r) return "[object has no keys]";
    if (r.length >= t) return gr(r, t);
    for (let o = n.length; o > 0; o--) {
        const i = n.slice(0, o).join(", ");
        if (!(i.length > t)) return o === n.length ? i : gr(i, t);
    }
    return "";
}
function Ye(e) {
    return Js(e, new Map());
}
function Js(e, t) {
    if (Tg(e)) {
        const n = t.get(e);
        if (n !== void 0) return n;
        const r = {};
        t.set(e, r);
        for (const o of Object.getOwnPropertyNames(e))
            typeof e[o] < "u" && (r[o] = Js(e[o], t));
        return r;
    }
    if (Array.isArray(e)) {
        const n = t.get(e);
        if (n !== void 0) return n;
        const r = [];
        return (
            t.set(e, r),
            e.forEach((o) => {
                r.push(Js(o, t));
            }),
            r
        );
    }
    return e;
}
function Tg(e) {
    if (!iu(e)) return !1;
    try {
        const t = Object.getPrototypeOf(e).constructor.name;
        return !t || t === "Object";
    } catch {
        return !0;
    }
}
const yf = 50,
    Rg = "?",
    za = /\(error: (.*)\)/,
    Fa = /captureMessage|captureException/;
function Pg(...e) {
    const t = e.sort((n, r) => n[0] - r[0]).map((n) => n[1]);
    return (n, r = 0, o = 0) => {
        const i = [],
            s = n.split(`
`);
        for (let l = r; l < s.length; l++) {
            const u = s[l];
            if (u.length > 1024) continue;
            const a = za.test(u) ? u.replace(za, "$1") : u;
            if (!a.match(/\S*Error: /)) {
                for (const m of t) {
                    const f = m(a);
                    if (f) {
                        i.push(f);
                        break;
                    }
                }
                if (i.length >= yf + o) break;
            }
        }
        return Ig(i.slice(o));
    };
}
function N1(e) {
    return Array.isArray(e) ? Pg(...e) : e;
}
function Ig(e) {
    if (!e.length) return [];
    const t = Array.from(e);
    return (
        /sentryWrapped/.test(ao(t).function || "") && t.pop(),
        t.reverse(),
        Fa.test(ao(t).function || "") &&
            (t.pop(), Fa.test(ao(t).function || "") && t.pop()),
        t.slice(0, yf).map((n) => ({
            ...n,
            filename: n.filename || ao(t).filename,
            function: n.function || Rg,
        }))
    );
}
function ao(e) {
    return e[e.length - 1] || {};
}
const Ji = "<anonymous>";
function Ag(e) {
    try {
        return !e || typeof e != "function" ? Ji : e.name || Ji;
    } catch {
        return Ji;
    }
}
function T1(e) {
    const t = e.exception;
    if (t) {
        const n = [];
        try {
            return (
                t.values.forEach((r) => {
                    r.stacktrace.frames && n.push(...r.stacktrace.frames);
                }),
                n
            );
        } catch {
            return;
        }
    }
}
const vf = 1e3;
function uu() {
    return Date.now() / vf;
}
function Og() {
    const { performance: e } = De;
    if (!e || !e.now) return uu;
    const t = Date.now() - e.now(),
        n = e.timeOrigin == null ? t : e.timeOrigin;
    return () => (n + e.now()) / vf;
}
const au = Og(),
    R1 = (() => {
        const { performance: e } = De;
        if (!e || !e.now) return;
        const t = 3600 * 1e3,
            n = e.now(),
            r = Date.now(),
            o = e.timeOrigin ? Math.abs(e.timeOrigin + n - r) : t,
            i = o < t,
            s = e.timing && e.timing.navigationStart,
            u = typeof s == "number" ? Math.abs(s + n - r) : t,
            a = u < t;
        return i || a ? (o <= u ? e.timeOrigin : s) : r;
    })();
function Lg() {
    const e = typeof WeakSet == "function",
        t = e ? new WeakSet() : [];
    function n(o) {
        if (e) return t.has(o) ? !0 : (t.add(o), !1);
        for (let i = 0; i < t.length; i++) if (t[i] === o) return !0;
        return (t.push(o), !1);
    }
    function r(o) {
        if (e) t.delete(o);
        else
            for (let i = 0; i < t.length; i++)
                if (t[i] === o) {
                    t.splice(i, 1);
                    break;
                }
    }
    return [n, r];
}
function pe() {
    const e = De,
        t = e.crypto || e.msCrypto;
    let n = () => Math.random() * 16;
    try {
        if (t && t.randomUUID) return t.randomUUID().replace(/-/g, "");
        t &&
            t.getRandomValues &&
            (n = () => {
                const r = new Uint8Array(1);
                return (t.getRandomValues(r), r[0]);
            });
    } catch {
        /* Ignore errors */
    }
    return ("10000000100040008000" + 1e11).replace(/[018]/g, (r) =>
        (r ^ ((n() & 15) >> (r / 4))).toString(16)
    );
}
function Sf(e) {
    return e.exception && e.exception.values ? e.exception.values[0] : void 0;
}
function P1(e) {
    const { message: t, event_id: n } = e;
    if (t) return t;
    const r = Sf(e);
    return r
        ? r.type && r.value
            ? `${r.type}: ${r.value}`
            : r.type || r.value || n || "<unknown>"
        : n || "<unknown>";
}
function I1(e, t, n) {
    const r = (e.exception = e.exception || {}),
        o = (r.values = r.values || []),
        i = (o[0] = o[0] || {});
    (i.value || (i.value = t || ""), i.type || (i.type = "Error"));
}
function jg(e, t) {
    const n = Sf(e);
    if (!n) return;
    const r = { type: "generic", handled: !0 },
        o = n.mechanism;
    if (((n.mechanism = { ...r, ...o, ...t }), t && "data" in t)) {
        const i = { ...(o && o.data), ...t.data };
        n.mechanism.data = i;
    }
}
function A1(e) {
    if (e && e.__sentry_captured__) return !0;
    try {
        zn(e, "__sentry_captured__", !0);
    } catch {
        /* Ignore errors */
    }
    return !1;
}
function Mg(e) {
    return Array.isArray(e) ? e : [e];
}
function Bt(e, t = 100, n = 1 / 0) {
    try {
        return Zs("", e, t, n);
    } catch (r) {
        return { ERROR: `**non-serializable** (${r})` };
    }
}
function Dg(e, t = 3, n = 100 * 1024) {
    const r = Bt(e, t);
    return Ug(r) > n ? Dg(e, t - 1, n) : r;
}
function Zs(e, t, n = 1 / 0, r = 1 / 0, o = Lg()) {
    const [i, s] = o;
    if (
        t == null ||
        ["boolean", "string"].includes(typeof t) ||
        (typeof t == "number" && Number.isFinite(t))
    )
        return t;
    const l = bg(e, t);
    if (!l.startsWith("[object ")) return l;
    if (t.__sentry_skip_normalization__) return t;
    const u =
        typeof t.__sentry_override_normalization_depth__ == "number"
            ? t.__sentry_override_normalization_depth__
            : n;
    if (u === 0) return l.replace("object ", "");
    if (i(t)) return "[Circular ~]";
    const a = t;
    if (a && typeof a.toJSON == "function")
        try {
            const g = a.toJSON();
            return Zs("", g, u - 1, r, o);
        } catch {
            /* Ignore errors */
        }
    const m = Array.isArray(t) ? [] : {};
    let f = 0;
    const h = gf(t);
    for (const g in h) {
        if (!Object.prototype.hasOwnProperty.call(h, g)) continue;
        if (f >= r) {
            m[g] = "[MaxProperties ~]";
            break;
        }
        const y = h[g];
        ((m[g] = Zs(g, y, u - 1, r, o)), f++);
    }
    return (s(t), m);
}
function bg(e, t) {
    try {
        if (e === "domain" && t && typeof t == "object" && t._events)
            return "[Domain]";
        if (e === "domainEmitter") return "[DomainEmitter]";
        if (typeof global < "u" && t === global) return "[Global]";
        if (typeof window < "u" && t === window) return "[Window]";
        if (typeof document < "u" && t === document) return "[Document]";
        if (hf(t)) return "[VueViewModel]";
        if (vg(t)) return "[SyntheticEvent]";
        if (typeof t == "number" && !Number.isFinite(t)) return `[${t}]`;
        if (typeof t == "function") return `[Function: ${Ag(t)}]`;
        if (typeof t == "symbol") return `[${String(t)}]`;
        if (typeof t == "bigint") return `[BigInt: ${String(t)}]`;
        const n = zg(t);
        return /^HTML(\w*)Element$/.test(n)
            ? `[HTMLElement: ${n}]`
            : `[object ${n}]`;
    } catch (n) {
        return `**non-serializable** (${n})`;
    }
}
function zg(e) {
    const t = Object.getPrototypeOf(e);
    return t ? t.constructor.name : "null prototype";
}
function Fg(e) {
    return ~-encodeURI(e).split(/%..|./).length;
}
function Ug(e) {
    return Fg(JSON.stringify(e));
}
var tt;
(function (e) {
    e[(e.PENDING = 0)] = "PENDING";
    const n = 1;
    e[(e.RESOLVED = n)] = "RESOLVED";
    const r = 2;
    e[(e.REJECTED = r)] = "REJECTED";
})(tt || (tt = {}));
function O1(e) {
    return new Qe((t) => {
        t(e);
    });
}
function L1(e) {
    return new Qe((t, n) => {
        n(e);
    });
}
class Qe {
    constructor(t) {
        (Qe.prototype.__init.call(this),
            Qe.prototype.__init2.call(this),
            Qe.prototype.__init3.call(this),
            Qe.prototype.__init4.call(this),
            (this._state = tt.PENDING),
            (this._handlers = []));
        try {
            t(this._resolve, this._reject);
        } catch (n) {
            this._reject(n);
        }
    }
    then(t, n) {
        return new Qe((r, o) => {
            (this._handlers.push([
                !1,
                (i) => {
                    if (!t) r(i);
                    else
                        try {
                            r(t(i));
                        } catch (s) {
                            o(s);
                        }
                },
                (i) => {
                    if (!n) o(i);
                    else
                        try {
                            r(n(i));
                        } catch (s) {
                            o(s);
                        }
                },
            ]),
                this._executeHandlers());
        });
    }
    catch(t) {
        return this.then((n) => n, t);
    }
    finally(t) {
        return new Qe((n, r) => {
            let o, i;
            return this.then(
                (s) => {
                    ((i = !1), (o = s), t && t());
                },
                (s) => {
                    ((i = !0), (o = s), t && t());
                }
            ).then(() => {
                if (i) {
                    r(o);
                    return;
                }
                n(o);
            });
        });
    }
    __init() {
        this._resolve = (t) => {
            this._setResult(tt.RESOLVED, t);
        };
    }
    __init2() {
        this._reject = (t) => {
            this._setResult(tt.REJECTED, t);
        };
    }
    __init3() {
        this._setResult = (t, n) => {
            if (this._state === tt.PENDING) {
                if (su(n)) {
                    n.then(this._resolve, this._reject);
                    return;
                }
                ((this._state = t), (this._value = n), this._executeHandlers());
            }
        };
    }
    __init4() {
        this._executeHandlers = () => {
            if (this._state === tt.PENDING) return;
            const t = this._handlers.slice();
            ((this._handlers = []),
                t.forEach((n) => {
                    n[0] ||
                        (this._state === tt.RESOLVED && n[1](this._value),
                        this._state === tt.REJECTED && n[2](this._value),
                        (n[0] = !0));
                }));
        };
    }
}
const j1 = "baggage",
    wf = "sentry-",
    Bg = /^sentry-/,
    $g = 8192;
function _f(e) {
    const t = Vg(e);
    if (!t) return;
    const n = Object.entries(t).reduce((r, [o, i]) => {
        if (o.match(Bg)) {
            const s = o.slice(wf.length);
            r[s] = i;
        }
        return r;
    }, {});
    if (Object.keys(n).length > 0) return n;
}
function M1(e) {
    if (!e) return;
    const t = Object.entries(e).reduce(
        (n, [r, o]) => (o && (n[`${wf}${r}`] = o), n),
        {}
    );
    return Wg(t);
}
function Vg(e) {
    if (!(!e || (!Yo(e) && !Array.isArray(e))))
        return Array.isArray(e)
            ? e.reduce((t, n) => {
                  const r = Ua(n);
                  return (
                      Object.entries(r).forEach(([o, i]) => {
                          t[o] = i;
                      }),
                      t
                  );
              }, {})
            : Ua(e);
}
function Ua(e) {
    return e
        .split(",")
        .map((t) => t.split("=").map((n) => decodeURIComponent(n.trim())))
        .reduce((t, [n, r]) => (n && r && (t[n] = r), t), {});
}
function Wg(e) {
    if (Object.keys(e).length !== 0)
        return Object.entries(e).reduce((t, [n, r], o) => {
            const i = `${encodeURIComponent(n)}=${encodeURIComponent(r)}`,
                s = o === 0 ? i : `${t},${i}`;
            return s.length > $g
                ? (lu &&
                      Pn.warn(
                          `Not adding key: ${n} with val: ${r} to baggage header due to exceeding baggage size limits.`
                      ),
                  t)
                : s;
        }, "");
}
const Gg = new RegExp(
    "^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$"
);
function Hg(e) {
    if (!e) return;
    const t = e.match(Gg);
    if (!t) return;
    let n;
    return (
        t[3] === "1" ? (n = !0) : t[3] === "0" && (n = !1),
        { traceId: t[1], parentSampled: n, parentSpanId: t[2] }
    );
}
function D1(e, t) {
    const n = Hg(e),
        r = _f(t),
        { traceId: o, parentSpanId: i, parentSampled: s } = n || {};
    return n
        ? {
              traceId: o || pe(),
              parentSpanId: i || pe().substring(16),
              spanId: pe().substring(16),
              sampled: s,
              dsc: r || {},
          }
        : { traceId: o || pe(), spanId: pe().substring(16) };
}
function Qg(e = pe(), t = pe().substring(16), n) {
    let r = "";
    return (n !== void 0 && (r = n ? "-1" : "-0"), `${e}-${t}${r}`);
}
function Ba() {
    return { traceId: pe(), spanId: pe().substring(16) };
}
const $a = new WeakMap();
function Kg(e) {
    const t = De._sentryDebugIds;
    if (!t) return {};
    let n;
    const r = $a.get(e);
    return (
        r ? (n = r) : ((n = new Map()), $a.set(e, n)),
        Object.keys(t).reduce((o, i) => {
            let s;
            const l = n.get(i);
            l ? (s = l) : ((s = e(i)), n.set(i, s));
            for (let u = s.length - 1; u >= 0; u--) {
                const a = s[u],
                    m = a && a.filename;
                if (a && m) {
                    o[m] = t[i];
                    break;
                }
            }
            return o;
        }, {})
    );
}
const Yg = typeof __SENTRY_DEBUG__ > "u" || __SENTRY_DEBUG__;
function $r() {
    return (cu(De), De);
}
function cu(e) {
    const t = (e.__SENTRY__ = e.__SENTRY__ || {});
    return ((t.version = t.version || yr), (t[yr] = t[yr] || {}));
}
function Xg(e) {
    const t = au(),
        n = {
            sid: pe(),
            init: !0,
            timestamp: t,
            started: t,
            duration: 0,
            status: "ok",
            errors: 0,
            ignoreDuration: !1,
            toJSON: () => Zg(n),
        };
    return (e && gi(n, e), n);
}
function gi(e, t = {}) {
    if (
        (t.user &&
            (!e.ipAddress &&
                t.user.ip_address &&
                (e.ipAddress = t.user.ip_address),
            !e.did &&
                !t.did &&
                (e.did = t.user.id || t.user.email || t.user.username)),
        (e.timestamp = t.timestamp || au()),
        t.abnormal_mechanism && (e.abnormal_mechanism = t.abnormal_mechanism),
        t.ignoreDuration && (e.ignoreDuration = t.ignoreDuration),
        t.sid && (e.sid = t.sid.length === 32 ? t.sid : pe()),
        t.init !== void 0 && (e.init = t.init),
        !e.did && t.did && (e.did = `${t.did}`),
        typeof t.started == "number" && (e.started = t.started),
        e.ignoreDuration)
    )
        e.duration = void 0;
    else if (typeof t.duration == "number") e.duration = t.duration;
    else {
        const n = e.timestamp - e.started;
        e.duration = n >= 0 ? n : 0;
    }
    (t.release && (e.release = t.release),
        t.environment && (e.environment = t.environment),
        !e.ipAddress && t.ipAddress && (e.ipAddress = t.ipAddress),
        !e.userAgent && t.userAgent && (e.userAgent = t.userAgent),
        typeof t.errors == "number" && (e.errors = t.errors),
        t.status && (e.status = t.status));
}
function Jg(e, t) {
    let n = {};
    (e.status === "ok" && (n = { status: "exited" }), gi(e, n));
}
function Zg(e) {
    return Ye({
        sid: `${e.sid}`,
        init: e.init,
        started: new Date(e.started * 1e3).toISOString(),
        timestamp: new Date(e.timestamp * 1e3).toISOString(),
        status: e.status,
        errors: e.errors,
        did:
            typeof e.did == "number" || typeof e.did == "string"
                ? `${e.did}`
                : void 0,
        duration: e.duration,
        abnormal_mechanism: e.abnormal_mechanism,
        attrs: {
            release: e.release,
            environment: e.environment,
            ip_address: e.ipAddress,
            user_agent: e.userAgent,
        },
    });
}
const qs = "_sentrySpan";
function Va(e, t) {
    t ? zn(e, qs, t) : delete e[qs];
}
function el(e) {
    return e[qs];
}
const qg = 100;
class du {
    constructor() {
        ((this._notifyingListeners = !1),
            (this._scopeListeners = []),
            (this._eventProcessors = []),
            (this._breadcrumbs = []),
            (this._attachments = []),
            (this._user = {}),
            (this._tags = {}),
            (this._extra = {}),
            (this._contexts = {}),
            (this._sdkProcessingMetadata = {}),
            (this._propagationContext = Ba()));
    }
    clone() {
        const t = new du();
        return (
            (t._breadcrumbs = [...this._breadcrumbs]),
            (t._tags = { ...this._tags }),
            (t._extra = { ...this._extra }),
            (t._contexts = { ...this._contexts }),
            (t._user = this._user),
            (t._level = this._level),
            (t._session = this._session),
            (t._transactionName = this._transactionName),
            (t._fingerprint = this._fingerprint),
            (t._eventProcessors = [...this._eventProcessors]),
            (t._requestSession = this._requestSession),
            (t._attachments = [...this._attachments]),
            (t._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }),
            (t._propagationContext = { ...this._propagationContext }),
            (t._client = this._client),
            (t._lastEventId = this._lastEventId),
            Va(t, el(this)),
            t
        );
    }
    setClient(t) {
        this._client = t;
    }
    setLastEventId(t) {
        this._lastEventId = t;
    }
    getClient() {
        return this._client;
    }
    lastEventId() {
        return this._lastEventId;
    }
    addScopeListener(t) {
        this._scopeListeners.push(t);
    }
    addEventProcessor(t) {
        return (this._eventProcessors.push(t), this);
    }
    setUser(t) {
        return (
            (this._user = t || {
                email: void 0,
                id: void 0,
                ip_address: void 0,
                username: void 0,
            }),
            this._session && gi(this._session, { user: t }),
            this._notifyScopeListeners(),
            this
        );
    }
    getUser() {
        return this._user;
    }
    getRequestSession() {
        return this._requestSession;
    }
    setRequestSession(t) {
        return ((this._requestSession = t), this);
    }
    setTags(t) {
        return (
            (this._tags = { ...this._tags, ...t }),
            this._notifyScopeListeners(),
            this
        );
    }
    setTag(t, n) {
        return (
            (this._tags = { ...this._tags, [t]: n }),
            this._notifyScopeListeners(),
            this
        );
    }
    setExtras(t) {
        return (
            (this._extra = { ...this._extra, ...t }),
            this._notifyScopeListeners(),
            this
        );
    }
    setExtra(t, n) {
        return (
            (this._extra = { ...this._extra, [t]: n }),
            this._notifyScopeListeners(),
            this
        );
    }
    setFingerprint(t) {
        return ((this._fingerprint = t), this._notifyScopeListeners(), this);
    }
    setLevel(t) {
        return ((this._level = t), this._notifyScopeListeners(), this);
    }
    setTransactionName(t) {
        return (
            (this._transactionName = t),
            this._notifyScopeListeners(),
            this
        );
    }
    setContext(t, n) {
        return (
            n === null ? delete this._contexts[t] : (this._contexts[t] = n),
            this._notifyScopeListeners(),
            this
        );
    }
    setSession(t) {
        return (
            t ? (this._session = t) : delete this._session,
            this._notifyScopeListeners(),
            this
        );
    }
    getSession() {
        return this._session;
    }
    update(t) {
        if (!t) return this;
        const n = typeof t == "function" ? t(this) : t,
            [r, o] =
                n instanceof tn
                    ? [n.getScopeData(), n.getRequestSession()]
                    : iu(n)
                      ? [t, t.requestSession]
                      : [],
            {
                tags: i,
                extra: s,
                user: l,
                contexts: u,
                level: a,
                fingerprint: m = [],
                propagationContext: f,
            } = r || {};
        return (
            (this._tags = { ...this._tags, ...i }),
            (this._extra = { ...this._extra, ...s }),
            (this._contexts = { ...this._contexts, ...u }),
            l && Object.keys(l).length && (this._user = l),
            a && (this._level = a),
            m.length && (this._fingerprint = m),
            f && (this._propagationContext = f),
            o && (this._requestSession = o),
            this
        );
    }
    clear() {
        return (
            (this._breadcrumbs = []),
            (this._tags = {}),
            (this._extra = {}),
            (this._user = {}),
            (this._contexts = {}),
            (this._level = void 0),
            (this._transactionName = void 0),
            (this._fingerprint = void 0),
            (this._requestSession = void 0),
            (this._session = void 0),
            Va(this, void 0),
            (this._attachments = []),
            (this._propagationContext = Ba()),
            this._notifyScopeListeners(),
            this
        );
    }
    addBreadcrumb(t, n) {
        const r = typeof n == "number" ? n : qg;
        if (r <= 0) return this;
        const o = { timestamp: uu(), ...t },
            i = this._breadcrumbs;
        return (
            i.push(o),
            (this._breadcrumbs = i.length > r ? i.slice(-r) : i),
            this._notifyScopeListeners(),
            this
        );
    }
    getLastBreadcrumb() {
        return this._breadcrumbs[this._breadcrumbs.length - 1];
    }
    clearBreadcrumbs() {
        return ((this._breadcrumbs = []), this._notifyScopeListeners(), this);
    }
    addAttachment(t) {
        return (this._attachments.push(t), this);
    }
    clearAttachments() {
        return ((this._attachments = []), this);
    }
    getScopeData() {
        return {
            breadcrumbs: this._breadcrumbs,
            attachments: this._attachments,
            contexts: this._contexts,
            tags: this._tags,
            extra: this._extra,
            user: this._user,
            level: this._level,
            fingerprint: this._fingerprint || [],
            eventProcessors: this._eventProcessors,
            propagationContext: this._propagationContext,
            sdkProcessingMetadata: this._sdkProcessingMetadata,
            transactionName: this._transactionName,
            span: el(this),
        };
    }
    setSDKProcessingMetadata(t) {
        return (
            (this._sdkProcessingMetadata = {
                ...this._sdkProcessingMetadata,
                ...t,
            }),
            this
        );
    }
    setPropagationContext(t) {
        return ((this._propagationContext = t), this);
    }
    getPropagationContext() {
        return this._propagationContext;
    }
    captureException(t, n) {
        const r = n && n.event_id ? n.event_id : pe();
        if (!this._client)
            return (
                Pn.warn(
                    "No client configured on scope - will not capture exception!"
                ),
                r
            );
        const o = new Error("Sentry syntheticException");
        return (
            this._client.captureException(
                t,
                {
                    originalException: t,
                    syntheticException: o,
                    ...n,
                    event_id: r,
                },
                this
            ),
            r
        );
    }
    captureMessage(t, n, r) {
        const o = r && r.event_id ? r.event_id : pe();
        if (!this._client)
            return (
                Pn.warn(
                    "No client configured on scope - will not capture message!"
                ),
                o
            );
        const i = new Error(t);
        return (
            this._client.captureMessage(
                t,
                n,
                {
                    originalException: t,
                    syntheticException: i,
                    ...r,
                    event_id: o,
                },
                this
            ),
            o
        );
    }
    captureEvent(t, n) {
        const r = n && n.event_id ? n.event_id : pe();
        return this._client
            ? (this._client.captureEvent(t, { ...n, event_id: r }, this), r)
            : (Pn.warn(
                  "No client configured on scope - will not capture event!"
              ),
              r);
    }
    _notifyScopeListeners() {
        this._notifyingListeners ||
            ((this._notifyingListeners = !0),
            this._scopeListeners.forEach((t) => {
                t(this);
            }),
            (this._notifyingListeners = !1));
    }
}
const tn = du;
function ey() {
    return hi("defaultCurrentScope", () => new tn());
}
function ty() {
    return hi("defaultIsolationScope", () => new tn());
}
class ny {
    constructor(t, n) {
        let r;
        t ? (r = t) : (r = new tn());
        let o;
        (n ? (o = n) : (o = new tn()),
            (this._stack = [{ scope: r }]),
            (this._isolationScope = o));
    }
    withScope(t) {
        const n = this._pushScope();
        let r;
        try {
            r = t(n);
        } catch (o) {
            throw (this._popScope(), o);
        }
        return su(r)
            ? r.then(
                  (o) => (this._popScope(), o),
                  (o) => {
                      throw (this._popScope(), o);
                  }
              )
            : (this._popScope(), r);
    }
    getClient() {
        return this.getStackTop().client;
    }
    getScope() {
        return this.getStackTop().scope;
    }
    getIsolationScope() {
        return this._isolationScope;
    }
    getStackTop() {
        return this._stack[this._stack.length - 1];
    }
    _pushScope() {
        const t = this.getScope().clone();
        return (this._stack.push({ client: this.getClient(), scope: t }), t);
    }
    _popScope() {
        return this._stack.length <= 1 ? !1 : !!this._stack.pop();
    }
}
function Fn() {
    const e = $r(),
        t = cu(e);
    return (t.stack = t.stack || new ny(ey(), ty()));
}
function ry(e) {
    return Fn().withScope(e);
}
function oy(e, t) {
    const n = Fn();
    return n.withScope(() => ((n.getStackTop().scope = e), t(e)));
}
function Wa(e) {
    return Fn().withScope(() => e(Fn().getIsolationScope()));
}
function iy() {
    return {
        withIsolationScope: Wa,
        withScope: ry,
        withSetScope: oy,
        withSetIsolationScope: (e, t) => Wa(t),
        getCurrentScope: () => Fn().getScope(),
        getIsolationScope: () => Fn().getIsolationScope(),
    };
}
function yi(e) {
    const t = cu(e);
    return t.acs ? t.acs : iy();
}
function on() {
    const e = $r();
    return yi(e).getCurrentScope();
}
function fu() {
    const e = $r();
    return yi(e).getIsolationScope();
}
function sy() {
    return hi("globalScope", () => new tn());
}
function b1(...e) {
    const t = $r(),
        n = yi(t);
    if (e.length === 2) {
        const [r, o] = e;
        return r ? n.withSetScope(r, o) : n.withScope(o);
    }
    return n.withScope(e[0]);
}
function vi() {
    return on().getClient();
}
const ly = "_sentryMetrics";
function uy(e) {
    const t = e[ly];
    if (!t) return;
    const n = {};
    for (const [, [r, o]] of t) (n[r] || (n[r] = [])).push(Ye(o));
    return n;
}
const ay = "sentry.source",
    cy = "sentry.sample_rate",
    dy = "sentry.op",
    fy = "sentry.origin",
    z1 = "sentry.idle_span_finish_reason",
    F1 = "sentry.measurement_unit",
    U1 = "sentry.measurement_value",
    B1 = "sentry.profile_id",
    $1 = "sentry.exclusive_time",
    py = 0,
    xf = 1,
    xe = 2;
function my(e) {
    if (e < 400 && e >= 100) return { code: xf };
    if (e >= 400 && e < 500)
        switch (e) {
            case 401:
                return { code: xe, message: "unauthenticated" };
            case 403:
                return { code: xe, message: "permission_denied" };
            case 404:
                return { code: xe, message: "not_found" };
            case 409:
                return { code: xe, message: "already_exists" };
            case 413:
                return { code: xe, message: "failed_precondition" };
            case 429:
                return { code: xe, message: "resource_exhausted" };
            case 499:
                return { code: xe, message: "cancelled" };
            default:
                return { code: xe, message: "invalid_argument" };
        }
    if (e >= 500 && e < 600)
        switch (e) {
            case 501:
                return { code: xe, message: "unimplemented" };
            case 503:
                return { code: xe, message: "unavailable" };
            case 504:
                return { code: xe, message: "deadline_exceeded" };
            default:
                return { code: xe, message: "internal_error" };
        }
    return { code: xe, message: "unknown_error" };
}
function V1(e, t) {
    e.setAttribute("http.response.status_code", t);
    const n = my(t);
    n.message !== "unknown_error" && e.setStatus(n);
}
const W1 = 0,
    hy = 1;
function G1(e) {
    const { spanId: t, traceId: n } = e.spanContext(),
        { data: r, op: o, parent_span_id: i, status: s, origin: l } = Mr(e);
    return Ye({
        parent_span_id: i,
        span_id: t,
        trace_id: n,
        data: r,
        op: o,
        status: s,
        origin: l,
    });
}
function gy(e) {
    const { spanId: t, traceId: n } = e.spanContext(),
        { parent_span_id: r } = Mr(e);
    return Ye({ parent_span_id: r, span_id: t, trace_id: n });
}
function H1(e) {
    const { traceId: t, spanId: n } = e.spanContext(),
        r = pu(e);
    return Qg(t, n, r);
}
function Ga(e) {
    return typeof e == "number"
        ? Ha(e)
        : Array.isArray(e)
          ? e[0] + e[1] / 1e9
          : e instanceof Date
            ? Ha(e.getTime())
            : au();
}
function Ha(e) {
    return e > 9999999999 ? e / 1e3 : e;
}
function Mr(e) {
    if (vy(e)) return e.getSpanJSON();
    try {
        const { spanId: t, traceId: n } = e.spanContext();
        if (yy(e)) {
            const {
                attributes: r,
                startTime: o,
                name: i,
                endTime: s,
                parentSpanId: l,
                status: u,
            } = e;
            return Ye({
                span_id: t,
                trace_id: n,
                data: r,
                description: i,
                parent_span_id: l,
                start_timestamp: Ga(o),
                timestamp: Ga(s) || void 0,
                status: Sy(u),
                op: r[dy],
                origin: r[fy],
                _metrics_summary: uy(e),
            });
        }
        return { span_id: t, trace_id: n };
    } catch {
        return {};
    }
}
function yy(e) {
    const t = e;
    return (
        !!t.attributes && !!t.startTime && !!t.name && !!t.endTime && !!t.status
    );
}
function vy(e) {
    return typeof e.getSpanJSON == "function";
}
function pu(e) {
    const { traceFlags: t } = e.spanContext();
    return t === hy;
}
function Sy(e) {
    if (!(!e || e.code === py))
        return e.code === xf ? "ok" : e.message || "unknown_error";
}
const Qt = "_sentryChildSpans",
    tl = "_sentryRootSpan";
function Q1(e, t) {
    const n = e[tl] || e;
    (zn(t, tl, n), e[Qt] ? e[Qt].add(t) : zn(e, Qt, new Set([t])));
}
function K1(e, t) {
    e[Qt] && e[Qt].delete(t);
}
function Y1(e) {
    const t = new Set();
    function n(r) {
        if (!t.has(r) && pu(r)) {
            t.add(r);
            const o = r[Qt] ? Array.from(r[Qt]) : [];
            for (const i of o) n(i);
        }
    }
    return (n(e), Array.from(t));
}
function Ef(e) {
    return e[tl] || e;
}
function X1() {
    const e = $r(),
        t = yi(e);
    return t.getActiveSpan ? t.getActiveSpan() : el(on());
}
function wy(e) {
    if (typeof __SENTRY_TRACING__ == "boolean" && !__SENTRY_TRACING__)
        return !1;
    const t = vi(),
        n = e || (t && t.getOptions());
    return (
        !!n &&
        (n.enableTracing || "tracesSampleRate" in n || "tracesSampler" in n)
    );
}
const mu = "production",
    kf = "_frozenDsc";
function J1(e, t) {
    zn(e, kf, t);
}
function _y(e, t) {
    const n = t.getOptions(),
        { publicKey: r } = t.getDsn() || {},
        o = Ye({
            environment: n.environment || mu,
            release: n.release,
            public_key: r,
            trace_id: e,
        });
    return (t.emit("createDsc", o), o);
}
function xy(e) {
    const t = vi();
    if (!t) return {};
    const n = _y(Mr(e).trace_id || "", t),
        r = Ef(e),
        o = r[kf];
    if (o) return o;
    const i = r.spanContext().traceState,
        s = i && i.get("sentry.dsc"),
        l = s && _f(s);
    if (l) return l;
    const u = Mr(r),
        a = u.data || {},
        m = a[cy];
    m != null && (n.sample_rate = `${m}`);
    const f = a[ay],
        h = u.description;
    return (
        f !== "url" && h && (n.transaction = h),
        wy() && (n.sampled = String(pu(r))),
        t.emit("createDsc", n, r),
        n
    );
}
function nl(e, t, n, r = 0) {
    return new Qe((o, i) => {
        const s = e[r];
        if (t === null || typeof s != "function") o(t);
        else {
            const l = s({ ...t }, n);
            (Yg &&
                s.id &&
                l === null &&
                Pn.log(`Event processor "${s.id}" dropped event`),
                su(l)
                    ? l.then((u) => nl(e, u, n, r + 1).then(o)).then(null, i)
                    : nl(e, l, n, r + 1)
                          .then(o)
                          .then(null, i));
        }
    });
}
function Ey(e, t) {
    const {
        fingerprint: n,
        span: r,
        breadcrumbs: o,
        sdkProcessingMetadata: i,
    } = t;
    (ky(e, t), r && Ty(e, r), Ry(e, n), Cy(e, o), Ny(e, i));
}
function Qa(e, t) {
    const {
        extra: n,
        tags: r,
        user: o,
        contexts: i,
        level: s,
        sdkProcessingMetadata: l,
        breadcrumbs: u,
        fingerprint: a,
        eventProcessors: m,
        attachments: f,
        propagationContext: h,
        transactionName: g,
        span: y,
    } = t;
    (er(e, "extra", n),
        er(e, "tags", r),
        er(e, "user", o),
        er(e, "contexts", i),
        er(e, "sdkProcessingMetadata", l),
        s && (e.level = s),
        g && (e.transactionName = g),
        y && (e.span = y),
        u.length && (e.breadcrumbs = [...e.breadcrumbs, ...u]),
        a.length && (e.fingerprint = [...e.fingerprint, ...a]),
        m.length && (e.eventProcessors = [...e.eventProcessors, ...m]),
        f.length && (e.attachments = [...e.attachments, ...f]),
        (e.propagationContext = { ...e.propagationContext, ...h }));
}
function er(e, t, n) {
    if (n && Object.keys(n).length) {
        e[t] = { ...e[t] };
        for (const r in n)
            Object.prototype.hasOwnProperty.call(n, r) && (e[t][r] = n[r]);
    }
}
function ky(e, t) {
    const {
            extra: n,
            tags: r,
            user: o,
            contexts: i,
            level: s,
            transactionName: l,
        } = t,
        u = Ye(n);
    u && Object.keys(u).length && (e.extra = { ...u, ...e.extra });
    const a = Ye(r);
    a && Object.keys(a).length && (e.tags = { ...a, ...e.tags });
    const m = Ye(o);
    m && Object.keys(m).length && (e.user = { ...m, ...e.user });
    const f = Ye(i);
    (f && Object.keys(f).length && (e.contexts = { ...f, ...e.contexts }),
        s && (e.level = s),
        l && e.type !== "transaction" && (e.transaction = l));
}
function Cy(e, t) {
    const n = [...(e.breadcrumbs || []), ...t];
    e.breadcrumbs = n.length ? n : void 0;
}
function Ny(e, t) {
    e.sdkProcessingMetadata = { ...e.sdkProcessingMetadata, ...t };
}
function Ty(e, t) {
    ((e.contexts = { trace: gy(t), ...e.contexts }),
        (e.sdkProcessingMetadata = {
            dynamicSamplingContext: xy(t),
            ...e.sdkProcessingMetadata,
        }));
    const n = Ef(t),
        r = Mr(n).description;
    r && !e.transaction && e.type === "transaction" && (e.transaction = r);
}
function Ry(e, t) {
    ((e.fingerprint = e.fingerprint ? Mg(e.fingerprint) : []),
        t && (e.fingerprint = e.fingerprint.concat(t)),
        e.fingerprint && !e.fingerprint.length && delete e.fingerprint);
}
function Z1(e, t, n, r, o, i) {
    const { normalizeDepth: s = 3, normalizeMaxBreadth: l = 1e3 } = e,
        u = {
            ...t,
            event_id: t.event_id || n.event_id || pe(),
            timestamp: t.timestamp || uu(),
        },
        a = n.integrations || e.integrations.map((x) => x.name);
    (Py(u, e),
        Oy(u, a),
        o && o.emit("applyFrameMetadata", t),
        t.type === void 0 && Iy(u, e.stackParser));
    const m = jy(r, n.captureContext);
    n.mechanism && jg(u, n.mechanism);
    const f = o ? o.getEventProcessors() : [],
        h = sy().getScopeData();
    if (i) {
        const x = i.getScopeData();
        Qa(h, x);
    }
    if (m) {
        const x = m.getScopeData();
        Qa(h, x);
    }
    const g = [...(n.attachments || []), ...h.attachments];
    (g.length && (n.attachments = g), Ey(u, h));
    const y = [...f, ...h.eventProcessors];
    return nl(y, u, n).then(
        (x) => (x && Ay(x), typeof s == "number" && s > 0 ? Ly(x, s, l) : x)
    );
}
function Py(e, t) {
    const { environment: n, release: r, dist: o, maxValueLength: i = 250 } = t;
    ("environment" in e || (e.environment = "environment" in t ? n : mu),
        e.release === void 0 && r !== void 0 && (e.release = r),
        e.dist === void 0 && o !== void 0 && (e.dist = o),
        e.message && (e.message = gr(e.message, i)));
    const s = e.exception && e.exception.values && e.exception.values[0];
    s && s.value && (s.value = gr(s.value, i));
    const l = e.request;
    l && l.url && (l.url = gr(l.url, i));
}
function Iy(e, t) {
    const n = Kg(t);
    try {
        e.exception.values.forEach((r) => {
            r.stacktrace.frames.forEach((o) => {
                o.filename && (o.debug_id = n[o.filename]);
            });
        });
    } catch {
        /* Ignore errors */
    }
}
function Ay(e) {
    const t = {};
    try {
        e.exception.values.forEach((r) => {
            r.stacktrace.frames.forEach((o) => {
                o.debug_id &&
                    (o.abs_path
                        ? (t[o.abs_path] = o.debug_id)
                        : o.filename && (t[o.filename] = o.debug_id),
                    delete o.debug_id);
            });
        });
    } catch {
        /* Ignore errors */
    }
    if (Object.keys(t).length === 0) return;
    ((e.debug_meta = e.debug_meta || {}),
        (e.debug_meta.images = e.debug_meta.images || []));
    const n = e.debug_meta.images;
    Object.entries(t).forEach(([r, o]) => {
        n.push({ type: "sourcemap", code_file: r, debug_id: o });
    });
}
function Oy(e, t) {
    t.length > 0 &&
        ((e.sdk = e.sdk || {}),
        (e.sdk.integrations = [...(e.sdk.integrations || []), ...t]));
}
function Ly(e, t, n) {
    if (!e) return null;
    const r = {
        ...e,
        ...(e.breadcrumbs && {
            breadcrumbs: e.breadcrumbs.map((o) => ({
                ...o,
                ...(o.data && { data: Bt(o.data, t, n) }),
            })),
        }),
        ...(e.user && { user: Bt(e.user, t, n) }),
        ...(e.contexts && { contexts: Bt(e.contexts, t, n) }),
        ...(e.extra && { extra: Bt(e.extra, t, n) }),
    };
    return (
        e.contexts &&
            e.contexts.trace &&
            r.contexts &&
            ((r.contexts.trace = e.contexts.trace),
            e.contexts.trace.data &&
                (r.contexts.trace.data = Bt(e.contexts.trace.data, t, n))),
        e.spans &&
            (r.spans = e.spans.map((o) => ({
                ...o,
                ...(o.data && { data: Bt(o.data, t, n) }),
            }))),
        r
    );
}
function jy(e, t) {
    if (!t) return e;
    const n = e ? e.clone() : new tn();
    return (n.update(t), n);
}
function My(e, t) {
    return on().captureException(e, void 0);
}
function q1(e, t) {
    return on().captureEvent(e, t);
}
function eS(e) {
    const t = vi(),
        n = fu(),
        r = on(),
        { release: o, environment: i = mu } = (t && t.getOptions()) || {},
        { userAgent: s } = De.navigator || {},
        l = Xg({
            release: o,
            environment: i,
            user: r.getUser() || n.getUser(),
            ...(s && { userAgent: s }),
            ...e,
        }),
        u = n.getSession();
    return (
        u && u.status === "ok" && gi(u, { status: "exited" }),
        Cf(),
        n.setSession(l),
        r.setSession(l),
        l
    );
}
function Cf() {
    const e = fu(),
        t = on(),
        n = t.getSession() || e.getSession();
    (n && Jg(n), Nf(), e.setSession(), t.setSession());
}
function Nf() {
    const e = fu(),
        t = on(),
        n = vi(),
        r = t.getSession() || e.getSession();
    r && n && n.captureSession(r);
}
function tS(e = !1) {
    if (e) {
        Cf();
        return;
    }
    Nf();
}
const Tf = w.createContext();
async function Dy(e, t) {
    const r = await (
            await en(
                () => import("./jszip.min-Cw1MSAQl.js").then((l) => l.j),
                [],
                import.meta.url
            )
        ).loadAsync(e),
        o = Object.keys(r.files)
            .filter((l) => /\.fit$/i.test(l))
            .filter((l) => !/__MACOSX/.test(l))
            .sort((l, u) => l.localeCompare(u));
    if (o.length === 0) throw new Error("No FIT files found in zip");
    if (o.length > 1 && !t) return { zip: r, fitFiles: o };
    const i = t || o[0],
        s = i.split("/").pop();
    return {
        zip: r,
        fitFiles: o,
        selectedFile: i,
        filename: s,
        content: await r.files[i].async("arraybuffer"),
    };
}
async function by(e) {
    return new Promise((t, n) => {
        const r = new FileReader();
        ((r.onload = (o) => {
            t({ filename: e.name, content: o.target.result });
        }),
            (r.onerror = (o) => {
                n(o);
            }),
            r.readAsArrayBuffer(e));
    });
}
async function zy(e, t) {
    return /\.zip$/i.test(e.name) ? Dy(e, t) : by(e);
}
class Fy {
    constructor(t, n = 1e4) {
        ki(this, "flush", () => {
            if (!this.queue.length) return;
            const t = this.queue.length;
            this.batchSend(this.queue)
                .then(() => {
                    (this.queue.splice(0, t),
                        this.handle &&
                            (clearTimeout(this.handle), (this.handle = null)));
                })
                .catch((n) => {
                    console.error("Failed to send analytics data", n);
                });
        });
        ki(this, "send", (t) => {
            (this.queue.push(t),
                this.handle ||
                    (this.handle = setTimeout(this.flush, this.delay)));
        });
        ((this.batchSend = t),
            (this.queue = []),
            (this.handle = null),
            (this.delay = n),
            window.addEventListener("beforeunload", this.flush));
    }
}
const Uy = "https://ua.harryonline.net/api/batch",
    Rf =
        window.location.hostname === "localhost"
            ? "fe61cf61-0e04-43aa-9e4b-a195b7b0d3b4"
            : "c9f72f2f-5797-4993-ba48-3ea8fbcd1616",
    {
        screen: { width: By, height: $y },
        navigator: { language: Vy },
        location: Wy,
        document: Gy,
    } = window,
    { hostname: Hy, origin: Qy } = Wy,
    { referrer: Ka } = Gy,
    Ky = `${By}x${$y}`,
    rl = { title: "", url: "/" };
let Zi;
const qi = () => ({
        website: Rf,
        screen: Ky,
        language: Vy,
        hostname: Hy,
        ...rl,
        referrer: Ka.startsWith(Qy) ? "" : Ka,
        timestamp: Math.floor(Date.now() / 1e3),
    }),
    Yy = async (e) => {
        const t = { "Content-Type": "application/json" };
        typeof Zi < "u" && (t["x-umami-cache"] = Zi);
        try {
            const r = await (
                await fetch(Uy, {
                    method: "POST",
                    body: JSON.stringify(e),
                    headers: t,
                    credentials: "omit",
                })
            ).json();
            r && (Zi = r.cache);
        } catch {
            /* Ignore errors */
        }
    },
    Ya = new Fy(Yy),
    es = (e, t = "event") => {
        (Ya.send({ payload: e, type: t }), e.name || Ya.flush());
    },
    _n = (e, t) => {
        switch (typeof e) {
            case "string":
                return es({ ...qi(), name: e, data: t, website: Rf });
            case "function": {
                const n = e(qi());
                return (
                    Object.keys(rl).forEach((r) => {
                        rl[r] = n[r];
                    }),
                    es(n)
                );
            }
            default:
                return es(qi());
        }
    };
_n();
function Xy() {
    if (typeof window > "u") return !0;
    const { hostname: e, search: t, pathname: n } = window.location,
        r = new URLSearchParams(t);
    return e === "localhost" || r.has("debug") || n.includes("debug");
}
function Jy() {
    if (typeof window > "u") return !0;
    const { pathname: e } = window.location;
    return e.includes("develop");
}
const Zy = Xy(),
    nS = Jy();
function qy(e) {
    const [t, n] = w.useState({}),
        [r, o] = w.useState(!1),
        [i, s] = w.useState(0),
        l = w.useRef(!1),
        { zip: u, content: a } = t;
    (w.useEffect(() => {
        en(
            () => import("./index-C1xoUegX.js"),
            __vite__mapDeps([
                0,
                1,
                2,
                3,
            ]),
            import.meta.url
        );
    }, []),
        w.useEffect(() => {
            t.fit && _n("Display Mode", { mode: r ? "Developer" : "User" });
        }, [r, t.fit]));
    function m() {
        o((d) => !d);
    }
    function f(d) {
        s(d);
    }
    async function h(d) {
        n({ error: d });
    }
    async function g(d) {
        try {
            (n({ file: d }), s(null));
            const c = performance.now(),
                p = await zy(d),
                _ = performance.now();
            (_n("Read File", {
                type: d.name.split(".").pop().toLowerCase(),
                time: Math.ceil(_ - c),
                size: d.size,
            }),
                (document.title =
                    (p.filename ?? d.name) + " - FIT File Viewer"),
                n((k) => ({ ...k, ...p })));
        } catch (c) {
            n((p) => ({ ...p, error: c }));
        }
    }
    async function y() {
        const { default: d } = await en(
            async () => {
                const { default: c } = await import("./index-C1xoUegX.js");
                return { default: c };
            },
            __vite__mapDeps([
                0,
                1,
                2,
                3,
            ]),
            import.meta.url
        );
        try {
            ((l.current = !1), s(null));
            const c = performance.now(),
                p = await d(a, f, l),
                _ = performance.now(),
                k = p == null ? void 0 : p.fileType;
            (k &&
                (_n((T) => ({ ...T, title: k, url: `/${k}` })),
                _n("Parse File", {
                    type: p == null ? void 0 : p.fileType,
                    time: Math.ceil(_ - c),
                    size: a.byteLength,
                })),
                Zy && console.log("parsed FIT", p),
                n((T) => ({ ...T, fit: p })));
        } catch (c) {
            (console.error(c), My(c), n((p) => ({ ...p, error: c })));
        }
    }
    async function S(d) {
        const c = await u.files[d].async("arraybuffer"),
            p = d.split("/").pop();
        ((document.title = p + " - FIT File Viewer"),
            n((_) => ({
                ..._,
                selectedFile: d,
                filename: p,
                content: c,
                fit: null,
            })));
    }
    w.useEffect(() => {
        a && y();
    }, [a]);
    const x = w.useMemo(
        () => ({
            ...t,
            handleFileChange: g,
            handleFileError: h,
            devMode: r,
            toggleDevMode: m,
            statistics: i,
            stopRef: l,
            setSelected: S,
        }),
        [
            t,
            r,
            i,
        ]
    );
    return v.jsx(Tf.Provider, { value: x, ...e });
}
function Si() {
    return w.useContext(Tf);
}
var Pf = { exports: {} },
    ev = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED",
    tv = ev,
    nv = tv;
function If() {}
function Af() {}
Af.resetWarningCache = If;
var rv = function () {
    function e(r, o, i, s, l, u) {
        if (u !== nv) {
            var a = new Error(
                "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw ((a.name = "Invariant Violation"), a);
        }
    }
    e.isRequired = e;
    function t() {
        return e;
    }
    var n = {
        array: e,
        bigint: e,
        bool: e,
        func: e,
        number: e,
        object: e,
        string: e,
        symbol: e,
        any: e,
        arrayOf: t,
        element: e,
        elementType: e,
        instanceOf: t,
        node: e,
        objectOf: t,
        oneOf: t,
        oneOfType: t,
        shape: t,
        exact: t,
        checkPropTypes: Af,
        resetWarningCache: If,
    };
    return ((n.PropTypes = n), n);
};
Pf.exports = rv();
var ov = Pf.exports;
const B = cl(ov);
function iv(e, t) {
    typeof e == "function" ? e(t) : e != null && (e.current = t);
}
function Of(...e) {
    return (t) => e.forEach((n) => iv(n, t));
}
function Lt(...e) {
    return w.useCallback(Of(...e), e);
}
var Dr = w.forwardRef((e, t) => {
    const { children: n, ...r } = e,
        o = w.Children.toArray(n),
        i = o.find(lv);
    if (i) {
        const s = i.props.children,
            l = o.map((u) =>
                u === i
                    ? w.Children.count(s) > 1
                        ? w.Children.only(null)
                        : w.isValidElement(s)
                          ? s.props.children
                          : null
                    : u
            );
        return v.jsx(ol, {
            ...r,
            ref: t,
            children: w.isValidElement(s) ? w.cloneElement(s, void 0, l) : null,
        });
    }
    return v.jsx(ol, { ...r, ref: t, children: n });
});
Dr.displayName = "Slot";
var ol = w.forwardRef((e, t) => {
    const { children: n, ...r } = e;
    if (w.isValidElement(n)) {
        const o = av(n);
        return w.cloneElement(n, { ...uv(r, n.props), ref: t ? Of(t, o) : o });
    }
    return w.Children.count(n) > 1 ? w.Children.only(null) : null;
});
ol.displayName = "SlotClone";
var sv = ({ children: e }) => v.jsx(v.Fragment, { children: e });
function lv(e) {
    return w.isValidElement(e) && e.type === sv;
}
function uv(e, t) {
    const n = { ...t };
    for (const r in t) {
        const o = e[r],
            i = t[r];
        /^on[A-Z]/.test(r)
            ? o && i
                ? (n[r] = (...l) => {
                      (i(...l), o(...l));
                  })
                : o && (n[r] = o)
            : r === "style"
              ? (n[r] = { ...o, ...i })
              : r === "className" && (n[r] = [o, i].filter(Boolean).join(" "));
    }
    return { ...e, ...n };
}
function av(e) {
    var r, o;
    let t =
            (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null
                ? void 0
                : r.get,
        n = t && "isReactWarning" in t && t.isReactWarning;
    return n
        ? e.ref
        : ((t =
              (o = Object.getOwnPropertyDescriptor(e, "ref")) == null
                  ? void 0
                  : o.get),
          (n = t && "isReactWarning" in t && t.isReactWarning),
          n ? e.props.ref : e.props.ref || e.ref);
}
function Lf(e) {
    var t,
        n,
        r = "";
    if (typeof e == "string" || typeof e == "number") r += e;
    else if (typeof e == "object")
        if (Array.isArray(e))
            for (t = 0; t < e.length; t++)
                e[t] && (n = Lf(e[t])) && (r && (r += " "), (r += n));
        else for (t in e) e[t] && (r && (r += " "), (r += t));
    return r;
}
function cv() {
    for (var e, t, n = 0, r = ""; n < arguments.length; )
        (e = arguments[n++]) && (t = Lf(e)) && (r && (r += " "), (r += t));
    return r;
}
const Xa = (e) => (typeof e == "boolean" ? "".concat(e) : e === 0 ? "0" : e),
    Ja = cv,
    jf = (e, t) => (n) => {
        var r;
        if ((t == null ? void 0 : t.variants) == null)
            return Ja(
                e,
                n == null ? void 0 : n.class,
                n == null ? void 0 : n.className
            );
        const { variants: o, defaultVariants: i } = t,
            s = Object.keys(o).map((a) => {
                const m = n == null ? void 0 : n[a],
                    f = i == null ? void 0 : i[a];
                if (m === null) return null;
                const h = Xa(m) || Xa(f);
                return o[a][h];
            }),
            l =
                n &&
                Object.entries(n).reduce((a, m) => {
                    let [f, h] = m;
                    return (h === void 0 || (a[f] = h), a);
                }, {}),
            u =
                t == null || (r = t.compoundVariants) === null || r === void 0
                    ? void 0
                    : r.reduce((a, m) => {
                          let { class: f, className: h, ...g } = m;
                          return Object.entries(g).every((y) => {
                              let [S, x] = y;
                              return Array.isArray(x)
                                  ? x.includes({ ...i, ...l }[S])
                                  : { ...i, ...l }[S] === x;
                          })
                              ? [
                                    ...a,
                                    f,
                                    h,
                                ]
                              : a;
                      }, []);
        return Ja(
            e,
            s,
            u,
            n == null ? void 0 : n.class,
            n == null ? void 0 : n.className
        );
    };
function Mf(e) {
    var t,
        n,
        r = "";
    if (typeof e == "string" || typeof e == "number") r += e;
    else if (typeof e == "object")
        if (Array.isArray(e)) {
            var o = e.length;
            for (t = 0; t < o; t++)
                e[t] && (n = Mf(e[t])) && (r && (r += " "), (r += n));
        } else for (n in e) e[n] && (r && (r += " "), (r += n));
    return r;
}
function dv() {
    for (var e, t, n = 0, r = "", o = arguments.length; n < o; n++)
        (e = arguments[n]) && (t = Mf(e)) && (r && (r += " "), (r += t));
    return r;
}
const hu = "-",
    fv = (e) => {
        const t = mv(e),
            { conflictingClassGroups: n, conflictingClassGroupModifiers: r } =
                e;
        return {
            getClassGroupId: (s) => {
                const l = s.split(hu);
                return (
                    l[0] === "" && l.length !== 1 && l.shift(),
                    Df(l, t) || pv(s)
                );
            },
            getConflictingClassGroupIds: (s, l) => {
                const u = n[s] || [];
                return l && r[s] ? [...u, ...r[s]] : u;
            },
        };
    },
    Df = (e, t) => {
        var s;
        if (e.length === 0) return t.classGroupId;
        const n = e[0],
            r = t.nextPart.get(n),
            o = r ? Df(e.slice(1), r) : void 0;
        if (o) return o;
        if (t.validators.length === 0) return;
        const i = e.join(hu);
        return (s = t.validators.find(({ validator: l }) => l(i))) == null
            ? void 0
            : s.classGroupId;
    },
    Za = /^\[(.+)\]$/,
    pv = (e) => {
        if (Za.test(e)) {
            const t = Za.exec(e)[1],
                n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
            if (n) return "arbitrary.." + n;
        }
    },
    mv = (e) => {
        const { theme: t, prefix: n } = e,
            r = { nextPart: new Map(), validators: [] };
        return (
            gv(Object.entries(e.classGroups), n).forEach(([i, s]) => {
                il(s, r, i, t);
            }),
            r
        );
    },
    il = (e, t, n, r) => {
        e.forEach((o) => {
            if (typeof o == "string") {
                const i = o === "" ? t : qa(t, o);
                i.classGroupId = n;
                return;
            }
            if (typeof o == "function") {
                if (hv(o)) {
                    il(o(r), t, n, r);
                    return;
                }
                t.validators.push({ validator: o, classGroupId: n });
                return;
            }
            Object.entries(o).forEach(([i, s]) => {
                il(s, qa(t, i), n, r);
            });
        });
    },
    qa = (e, t) => {
        let n = e;
        return (
            t.split(hu).forEach((r) => {
                (n.nextPart.has(r) ||
                    n.nextPart.set(r, { nextPart: new Map(), validators: [] }),
                    (n = n.nextPart.get(r)));
            }),
            n
        );
    },
    hv = (e) => e.isThemeGetter,
    gv = (e, t) =>
        t
            ? e.map(([n, r]) => {
                  const o = r.map((i) =>
                      typeof i == "string"
                          ? t + i
                          : typeof i == "object"
                            ? Object.fromEntries(
                                  Object.entries(i).map(([s, l]) => [t + s, l])
                              )
                            : i
                  );
                  return [n, o];
              })
            : e,
    yv = (e) => {
        if (e < 1) return { get: () => {}, set: () => {} };
        let t = 0,
            n = new Map(),
            r = new Map();
        const o = (i, s) => {
            (n.set(i, s), t++, t > e && ((t = 0), (r = n), (n = new Map())));
        };
        return {
            get(i) {
                let s = n.get(i);
                if (s !== void 0) return s;
                if ((s = r.get(i)) !== void 0) return (o(i, s), s);
            },
            set(i, s) {
                n.has(i) ? n.set(i, s) : o(i, s);
            },
        };
    },
    bf = "!",
    vv = (e) => {
        const { separator: t, experimentalParseClassName: n } = e,
            r = t.length === 1,
            o = t[0],
            i = t.length,
            s = (l) => {
                const u = [];
                let a = 0,
                    m = 0,
                    f;
                for (let x = 0; x < l.length; x++) {
                    let d = l[x];
                    if (a === 0) {
                        if (d === o && (r || l.slice(x, x + i) === t)) {
                            (u.push(l.slice(m, x)), (m = x + i));
                            continue;
                        }
                        if (d === "/") {
                            f = x;
                            continue;
                        }
                    }
                    d === "[" ? a++ : d === "]" && a--;
                }
                const h = u.length === 0 ? l : l.substring(m),
                    g = h.startsWith(bf),
                    y = g ? h.substring(1) : h,
                    S = f && f > m ? f - m : void 0;
                return {
                    modifiers: u,
                    hasImportantModifier: g,
                    baseClassName: y,
                    maybePostfixModifierPosition: S,
                };
            };
        return n ? (l) => n({ className: l, parseClassName: s }) : s;
    },
    Sv = (e) => {
        if (e.length <= 1) return e;
        const t = [];
        let n = [];
        return (
            e.forEach((r) => {
                r[0] === "[" ? (t.push(...n.sort(), r), (n = [])) : n.push(r);
            }),
            t.push(...n.sort()),
            t
        );
    },
    wv = (e) => ({ cache: yv(e.cacheSize), parseClassName: vv(e), ...fv(e) }),
    _v = /\s+/,
    xv = (e, t) => {
        const {
                parseClassName: n,
                getClassGroupId: r,
                getConflictingClassGroupIds: o,
            } = t,
            i = [],
            s = e.trim().split(_v);
        let l = "";
        for (let u = s.length - 1; u >= 0; u -= 1) {
            const a = s[u],
                {
                    modifiers: m,
                    hasImportantModifier: f,
                    baseClassName: h,
                    maybePostfixModifierPosition: g,
                } = n(a);
            let y = !!g,
                S = r(y ? h.substring(0, g) : h);
            if (!S) {
                if (!y) {
                    l = a + (l.length > 0 ? " " + l : l);
                    continue;
                }
                if (((S = r(h)), !S)) {
                    l = a + (l.length > 0 ? " " + l : l);
                    continue;
                }
                y = !1;
            }
            const x = Sv(m).join(":"),
                d = f ? x + bf : x,
                c = d + S;
            if (i.includes(c)) continue;
            i.push(c);
            const p = o(S, y);
            for (let _ = 0; _ < p.length; ++_) {
                const k = p[_];
                i.push(d + k);
            }
            l = a + (l.length > 0 ? " " + l : l);
        }
        return l;
    };
function Ev() {
    let e = 0,
        t,
        n,
        r = "";
    for (; e < arguments.length; )
        (t = arguments[e++]) && (n = zf(t)) && (r && (r += " "), (r += n));
    return r;
}
const zf = (e) => {
    if (typeof e == "string") return e;
    let t,
        n = "";
    for (let r = 0; r < e.length; r++)
        e[r] && (t = zf(e[r])) && (n && (n += " "), (n += t));
    return n;
};
function kv(e, ...t) {
    let n,
        r,
        o,
        i = s;
    function s(u) {
        const a = t.reduce((m, f) => f(m), e());
        return (
            (n = wv(a)),
            (r = n.cache.get),
            (o = n.cache.set),
            (i = l),
            l(u)
        );
    }
    function l(u) {
        const a = r(u);
        if (a) return a;
        const m = xv(u, n);
        return (o(u, m), m);
    }
    return function () {
        return i(Ev.apply(null, arguments));
    };
}
const $ = (e) => {
        const t = (n) => n[e] || [];
        return ((t.isThemeGetter = !0), t);
    },
    Ff = /^\[(?:([a-z-]+):)?(.+)\]$/i,
    Cv = /^\d+\/\d+$/,
    Nv = new Set([
        "px",
        "full",
        "screen",
    ]),
    Tv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
    Rv =
        /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
    Pv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
    Iv = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
    Av =
        /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
    qe = (e) => In(e) || Nv.has(e) || Cv.test(e),
    mt = (e) => Wn(e, "length", Fv),
    In = (e) => !!e && !Number.isNaN(Number(e)),
    ts = (e) => Wn(e, "number", In),
    tr = (e) => !!e && Number.isInteger(Number(e)),
    Ov = (e) => e.endsWith("%") && In(e.slice(0, -1)),
    L = (e) => Ff.test(e),
    ht = (e) => Tv.test(e),
    Lv = new Set([
        "length",
        "size",
        "percentage",
    ]),
    jv = (e) => Wn(e, Lv, Uf),
    Mv = (e) => Wn(e, "position", Uf),
    Dv = new Set(["image", "url"]),
    bv = (e) => Wn(e, Dv, Bv),
    zv = (e) => Wn(e, "", Uv),
    nr = () => !0,
    Wn = (e, t, n) => {
        const r = Ff.exec(e);
        return r
            ? r[1]
                ? typeof t == "string"
                    ? r[1] === t
                    : t.has(r[1])
                : n(r[2])
            : !1;
    },
    Fv = (e) => Rv.test(e) && !Pv.test(e),
    Uf = () => !1,
    Uv = (e) => Iv.test(e),
    Bv = (e) => Av.test(e),
    $v = () => {
        const e = $("colors"),
            t = $("spacing"),
            n = $("blur"),
            r = $("brightness"),
            o = $("borderColor"),
            i = $("borderRadius"),
            s = $("borderSpacing"),
            l = $("borderWidth"),
            u = $("contrast"),
            a = $("grayscale"),
            m = $("hueRotate"),
            f = $("invert"),
            h = $("gap"),
            g = $("gradientColorStops"),
            y = $("gradientColorStopPositions"),
            S = $("inset"),
            x = $("margin"),
            d = $("opacity"),
            c = $("padding"),
            p = $("saturate"),
            _ = $("scale"),
            k = $("sepia"),
            T = $("skew"),
            P = $("space"),
            C = $("translate"),
            F = () => [
                "auto",
                "contain",
                "none",
            ],
            A = () => [
                "auto",
                "hidden",
                "clip",
                "visible",
                "scroll",
            ],
            Z = () => [
                "auto",
                L,
                t,
            ],
            D = () => [L, t],
            We = () => [
                "",
                qe,
                mt,
            ],
            ft = () => [
                "auto",
                In,
                L,
            ],
            sn = () => [
                "bottom",
                "center",
                "left",
                "left-bottom",
                "left-top",
                "right",
                "right-bottom",
                "right-top",
                "top",
            ],
            le = () => [
                "solid",
                "dashed",
                "dotted",
                "double",
                "none",
            ],
            ln = () => [
                "normal",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "color-dodge",
                "color-burn",
                "hard-light",
                "soft-light",
                "difference",
                "exclusion",
                "hue",
                "saturation",
                "color",
                "luminosity",
            ],
            N = () => [
                "start",
                "end",
                "center",
                "between",
                "around",
                "evenly",
                "stretch",
            ],
            I = () => [
                "",
                "0",
                L,
            ],
            O = () => [
                "auto",
                "avoid",
                "all",
                "avoid-page",
                "page",
                "left",
                "right",
                "column",
            ],
            b = () => [In, L];
        return {
            cacheSize: 500,
            separator: ":",
            theme: {
                colors: [nr],
                spacing: [qe, mt],
                blur: [
                    "none",
                    "",
                    ht,
                    L,
                ],
                brightness: b(),
                borderColor: [e],
                borderRadius: [
                    "none",
                    "",
                    "full",
                    ht,
                    L,
                ],
                borderSpacing: D(),
                borderWidth: We(),
                contrast: b(),
                grayscale: I(),
                hueRotate: b(),
                invert: I(),
                gap: D(),
                gradientColorStops: [e],
                gradientColorStopPositions: [Ov, mt],
                inset: Z(),
                margin: Z(),
                opacity: b(),
                padding: D(),
                saturate: b(),
                scale: b(),
                sepia: I(),
                skew: b(),
                space: D(),
                translate: D(),
            },
            classGroups: {
                aspect: [
                    {
                        aspect: [
                            "auto",
                            "square",
                            "video",
                            L,
                        ],
                    },
                ],
                container: ["container"],
                columns: [{ columns: [ht] }],
                "break-after": [{ "break-after": O() }],
                "break-before": [{ "break-before": O() }],
                "break-inside": [
                    {
                        "break-inside": [
                            "auto",
                            "avoid",
                            "avoid-page",
                            "avoid-column",
                        ],
                    },
                ],
                "box-decoration": [{ "box-decoration": ["slice", "clone"] }],
                box: [{ box: ["border", "content"] }],
                display: [
                    "block",
                    "inline-block",
                    "inline",
                    "flex",
                    "inline-flex",
                    "table",
                    "inline-table",
                    "table-caption",
                    "table-cell",
                    "table-column",
                    "table-column-group",
                    "table-footer-group",
                    "table-header-group",
                    "table-row-group",
                    "table-row",
                    "flow-root",
                    "grid",
                    "inline-grid",
                    "contents",
                    "list-item",
                    "hidden",
                ],
                float: [
                    {
                        float: [
                            "right",
                            "left",
                            "none",
                            "start",
                            "end",
                        ],
                    },
                ],
                clear: [
                    {
                        clear: [
                            "left",
                            "right",
                            "both",
                            "none",
                            "start",
                            "end",
                        ],
                    },
                ],
                isolation: ["isolate", "isolation-auto"],
                "object-fit": [
                    {
                        object: [
                            "contain",
                            "cover",
                            "fill",
                            "none",
                            "scale-down",
                        ],
                    },
                ],
                "object-position": [{ object: [...sn(), L] }],
                overflow: [{ overflow: A() }],
                "overflow-x": [{ "overflow-x": A() }],
                "overflow-y": [{ "overflow-y": A() }],
                overscroll: [{ overscroll: F() }],
                "overscroll-x": [{ "overscroll-x": F() }],
                "overscroll-y": [{ "overscroll-y": F() }],
                position: [
                    "static",
                    "fixed",
                    "absolute",
                    "relative",
                    "sticky",
                ],
                inset: [{ inset: [S] }],
                "inset-x": [{ "inset-x": [S] }],
                "inset-y": [{ "inset-y": [S] }],
                start: [{ start: [S] }],
                end: [{ end: [S] }],
                top: [{ top: [S] }],
                right: [{ right: [S] }],
                bottom: [{ bottom: [S] }],
                left: [{ left: [S] }],
                visibility: [
                    "visible",
                    "invisible",
                    "collapse",
                ],
                z: [
                    {
                        z: [
                            "auto",
                            tr,
                            L,
                        ],
                    },
                ],
                basis: [{ basis: Z() }],
                "flex-direction": [
                    {
                        flex: [
                            "row",
                            "row-reverse",
                            "col",
                            "col-reverse",
                        ],
                    },
                ],
                "flex-wrap": [
                    {
                        flex: [
                            "wrap",
                            "wrap-reverse",
                            "nowrap",
                        ],
                    },
                ],
                flex: [
                    {
                        flex: [
                            "1",
                            "auto",
                            "initial",
                            "none",
                            L,
                        ],
                    },
                ],
                grow: [{ grow: I() }],
                shrink: [{ shrink: I() }],
                order: [
                    {
                        order: [
                            "first",
                            "last",
                            "none",
                            tr,
                            L,
                        ],
                    },
                ],
                "grid-cols": [{ "grid-cols": [nr] }],
                "col-start-end": [
                    {
                        col: [
                            "auto",
                            {
                                span: [
                                    "full",
                                    tr,
                                    L,
                                ],
                            },
                            L,
                        ],
                    },
                ],
                "col-start": [{ "col-start": ft() }],
                "col-end": [{ "col-end": ft() }],
                "grid-rows": [{ "grid-rows": [nr] }],
                "row-start-end": [
                    {
                        row: [
                            "auto",
                            { span: [tr, L] },
                            L,
                        ],
                    },
                ],
                "row-start": [{ "row-start": ft() }],
                "row-end": [{ "row-end": ft() }],
                "grid-flow": [
                    {
                        "grid-flow": [
                            "row",
                            "col",
                            "dense",
                            "row-dense",
                            "col-dense",
                        ],
                    },
                ],
                "auto-cols": [
                    {
                        "auto-cols": [
                            "auto",
                            "min",
                            "max",
                            "fr",
                            L,
                        ],
                    },
                ],
                "auto-rows": [
                    {
                        "auto-rows": [
                            "auto",
                            "min",
                            "max",
                            "fr",
                            L,
                        ],
                    },
                ],
                gap: [{ gap: [h] }],
                "gap-x": [{ "gap-x": [h] }],
                "gap-y": [{ "gap-y": [h] }],
                "justify-content": [{ justify: ["normal", ...N()] }],
                "justify-items": [
                    {
                        "justify-items": [
                            "start",
                            "end",
                            "center",
                            "stretch",
                        ],
                    },
                ],
                "justify-self": [
                    {
                        "justify-self": [
                            "auto",
                            "start",
                            "end",
                            "center",
                            "stretch",
                        ],
                    },
                ],
                "align-content": [
                    {
                        content: [
                            "normal",
                            ...N(),
                            "baseline",
                        ],
                    },
                ],
                "align-items": [
                    {
                        items: [
                            "start",
                            "end",
                            "center",
                            "baseline",
                            "stretch",
                        ],
                    },
                ],
                "align-self": [
                    {
                        self: [
                            "auto",
                            "start",
                            "end",
                            "center",
                            "stretch",
                            "baseline",
                        ],
                    },
                ],
                "place-content": [{ "place-content": [...N(), "baseline"] }],
                "place-items": [
                    {
                        "place-items": [
                            "start",
                            "end",
                            "center",
                            "baseline",
                            "stretch",
                        ],
                    },
                ],
                "place-self": [
                    {
                        "place-self": [
                            "auto",
                            "start",
                            "end",
                            "center",
                            "stretch",
                        ],
                    },
                ],
                p: [{ p: [c] }],
                px: [{ px: [c] }],
                py: [{ py: [c] }],
                ps: [{ ps: [c] }],
                pe: [{ pe: [c] }],
                pt: [{ pt: [c] }],
                pr: [{ pr: [c] }],
                pb: [{ pb: [c] }],
                pl: [{ pl: [c] }],
                m: [{ m: [x] }],
                mx: [{ mx: [x] }],
                my: [{ my: [x] }],
                ms: [{ ms: [x] }],
                me: [{ me: [x] }],
                mt: [{ mt: [x] }],
                mr: [{ mr: [x] }],
                mb: [{ mb: [x] }],
                ml: [{ ml: [x] }],
                "space-x": [{ "space-x": [P] }],
                "space-x-reverse": ["space-x-reverse"],
                "space-y": [{ "space-y": [P] }],
                "space-y-reverse": ["space-y-reverse"],
                w: [
                    {
                        w: [
                            "auto",
                            "min",
                            "max",
                            "fit",
                            "svw",
                            "lvw",
                            "dvw",
                            L,
                            t,
                        ],
                    },
                ],
                "min-w": [
                    {
                        "min-w": [
                            L,
                            t,
                            "min",
                            "max",
                            "fit",
                        ],
                    },
                ],
                "max-w": [
                    {
                        "max-w": [
                            L,
                            t,
                            "none",
                            "full",
                            "min",
                            "max",
                            "fit",
                            "prose",
                            { screen: [ht] },
                            ht,
                        ],
                    },
                ],
                h: [
                    {
                        h: [
                            L,
                            t,
                            "auto",
                            "min",
                            "max",
                            "fit",
                            "svh",
                            "lvh",
                            "dvh",
                        ],
                    },
                ],
                "min-h": [
                    {
                        "min-h": [
                            L,
                            t,
                            "min",
                            "max",
                            "fit",
                            "svh",
                            "lvh",
                            "dvh",
                        ],
                    },
                ],
                "max-h": [
                    {
                        "max-h": [
                            L,
                            t,
                            "min",
                            "max",
                            "fit",
                            "svh",
                            "lvh",
                            "dvh",
                        ],
                    },
                ],
                size: [
                    {
                        size: [
                            L,
                            t,
                            "auto",
                            "min",
                            "max",
                            "fit",
                        ],
                    },
                ],
                "font-size": [
                    {
                        text: [
                            "base",
                            ht,
                            mt,
                        ],
                    },
                ],
                "font-smoothing": ["antialiased", "subpixel-antialiased"],
                "font-style": ["italic", "not-italic"],
                "font-weight": [
                    {
                        font: [
                            "thin",
                            "extralight",
                            "light",
                            "normal",
                            "medium",
                            "semibold",
                            "bold",
                            "extrabold",
                            "black",
                            ts,
                        ],
                    },
                ],
                "font-family": [{ font: [nr] }],
                "fvn-normal": ["normal-nums"],
                "fvn-ordinal": ["ordinal"],
                "fvn-slashed-zero": ["slashed-zero"],
                "fvn-figure": ["lining-nums", "oldstyle-nums"],
                "fvn-spacing": ["proportional-nums", "tabular-nums"],
                "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
                tracking: [
                    {
                        tracking: [
                            "tighter",
                            "tight",
                            "normal",
                            "wide",
                            "wider",
                            "widest",
                            L,
                        ],
                    },
                ],
                "line-clamp": [
                    {
                        "line-clamp": [
                            "none",
                            In,
                            ts,
                        ],
                    },
                ],
                leading: [
                    {
                        leading: [
                            "none",
                            "tight",
                            "snug",
                            "normal",
                            "relaxed",
                            "loose",
                            qe,
                            L,
                        ],
                    },
                ],
                "list-image": [{ "list-image": ["none", L] }],
                "list-style-type": [
                    {
                        list: [
                            "none",
                            "disc",
                            "decimal",
                            L,
                        ],
                    },
                ],
                "list-style-position": [{ list: ["inside", "outside"] }],
                "placeholder-color": [{ placeholder: [e] }],
                "placeholder-opacity": [{ "placeholder-opacity": [d] }],
                "text-alignment": [
                    {
                        text: [
                            "left",
                            "center",
                            "right",
                            "justify",
                            "start",
                            "end",
                        ],
                    },
                ],
                "text-color": [{ text: [e] }],
                "text-opacity": [{ "text-opacity": [d] }],
                "text-decoration": [
                    "underline",
                    "overline",
                    "line-through",
                    "no-underline",
                ],
                "text-decoration-style": [{ decoration: [...le(), "wavy"] }],
                "text-decoration-thickness": [
                    {
                        decoration: [
                            "auto",
                            "from-font",
                            qe,
                            mt,
                        ],
                    },
                ],
                "underline-offset": [
                    {
                        "underline-offset": [
                            "auto",
                            qe,
                            L,
                        ],
                    },
                ],
                "text-decoration-color": [{ decoration: [e] }],
                "text-transform": [
                    "uppercase",
                    "lowercase",
                    "capitalize",
                    "normal-case",
                ],
                "text-overflow": [
                    "truncate",
                    "text-ellipsis",
                    "text-clip",
                ],
                "text-wrap": [
                    {
                        text: [
                            "wrap",
                            "nowrap",
                            "balance",
                            "pretty",
                        ],
                    },
                ],
                indent: [{ indent: D() }],
                "vertical-align": [
                    {
                        align: [
                            "baseline",
                            "top",
                            "middle",
                            "bottom",
                            "text-top",
                            "text-bottom",
                            "sub",
                            "super",
                            L,
                        ],
                    },
                ],
                whitespace: [
                    {
                        whitespace: [
                            "normal",
                            "nowrap",
                            "pre",
                            "pre-line",
                            "pre-wrap",
                            "break-spaces",
                        ],
                    },
                ],
                break: [
                    {
                        break: [
                            "normal",
                            "words",
                            "all",
                            "keep",
                        ],
                    },
                ],
                hyphens: [
                    {
                        hyphens: [
                            "none",
                            "manual",
                            "auto",
                        ],
                    },
                ],
                content: [{ content: ["none", L] }],
                "bg-attachment": [
                    {
                        bg: [
                            "fixed",
                            "local",
                            "scroll",
                        ],
                    },
                ],
                "bg-clip": [
                    {
                        "bg-clip": [
                            "border",
                            "padding",
                            "content",
                            "text",
                        ],
                    },
                ],
                "bg-opacity": [{ "bg-opacity": [d] }],
                "bg-origin": [
                    {
                        "bg-origin": [
                            "border",
                            "padding",
                            "content",
                        ],
                    },
                ],
                "bg-position": [{ bg: [...sn(), Mv] }],
                "bg-repeat": [
                    {
                        bg: [
                            "no-repeat",
                            {
                                repeat: [
                                    "",
                                    "x",
                                    "y",
                                    "round",
                                    "space",
                                ],
                            },
                        ],
                    },
                ],
                "bg-size": [
                    {
                        bg: [
                            "auto",
                            "cover",
                            "contain",
                            jv,
                        ],
                    },
                ],
                "bg-image": [
                    {
                        bg: [
                            "none",
                            {
                                "gradient-to": [
                                    "t",
                                    "tr",
                                    "r",
                                    "br",
                                    "b",
                                    "bl",
                                    "l",
                                    "tl",
                                ],
                            },
                            bv,
                        ],
                    },
                ],
                "bg-color": [{ bg: [e] }],
                "gradient-from-pos": [{ from: [y] }],
                "gradient-via-pos": [{ via: [y] }],
                "gradient-to-pos": [{ to: [y] }],
                "gradient-from": [{ from: [g] }],
                "gradient-via": [{ via: [g] }],
                "gradient-to": [{ to: [g] }],
                rounded: [{ rounded: [i] }],
                "rounded-s": [{ "rounded-s": [i] }],
                "rounded-e": [{ "rounded-e": [i] }],
                "rounded-t": [{ "rounded-t": [i] }],
                "rounded-r": [{ "rounded-r": [i] }],
                "rounded-b": [{ "rounded-b": [i] }],
                "rounded-l": [{ "rounded-l": [i] }],
                "rounded-ss": [{ "rounded-ss": [i] }],
                "rounded-se": [{ "rounded-se": [i] }],
                "rounded-ee": [{ "rounded-ee": [i] }],
                "rounded-es": [{ "rounded-es": [i] }],
                "rounded-tl": [{ "rounded-tl": [i] }],
                "rounded-tr": [{ "rounded-tr": [i] }],
                "rounded-br": [{ "rounded-br": [i] }],
                "rounded-bl": [{ "rounded-bl": [i] }],
                "border-w": [{ border: [l] }],
                "border-w-x": [{ "border-x": [l] }],
                "border-w-y": [{ "border-y": [l] }],
                "border-w-s": [{ "border-s": [l] }],
                "border-w-e": [{ "border-e": [l] }],
                "border-w-t": [{ "border-t": [l] }],
                "border-w-r": [{ "border-r": [l] }],
                "border-w-b": [{ "border-b": [l] }],
                "border-w-l": [{ "border-l": [l] }],
                "border-opacity": [{ "border-opacity": [d] }],
                "border-style": [{ border: [...le(), "hidden"] }],
                "divide-x": [{ "divide-x": [l] }],
                "divide-x-reverse": ["divide-x-reverse"],
                "divide-y": [{ "divide-y": [l] }],
                "divide-y-reverse": ["divide-y-reverse"],
                "divide-opacity": [{ "divide-opacity": [d] }],
                "divide-style": [{ divide: le() }],
                "border-color": [{ border: [o] }],
                "border-color-x": [{ "border-x": [o] }],
                "border-color-y": [{ "border-y": [o] }],
                "border-color-s": [{ "border-s": [o] }],
                "border-color-e": [{ "border-e": [o] }],
                "border-color-t": [{ "border-t": [o] }],
                "border-color-r": [{ "border-r": [o] }],
                "border-color-b": [{ "border-b": [o] }],
                "border-color-l": [{ "border-l": [o] }],
                "divide-color": [{ divide: [o] }],
                "outline-style": [{ outline: ["", ...le()] }],
                "outline-offset": [{ "outline-offset": [qe, L] }],
                "outline-w": [{ outline: [qe, mt] }],
                "outline-color": [{ outline: [e] }],
                "ring-w": [{ ring: We() }],
                "ring-w-inset": ["ring-inset"],
                "ring-color": [{ ring: [e] }],
                "ring-opacity": [{ "ring-opacity": [d] }],
                "ring-offset-w": [{ "ring-offset": [qe, mt] }],
                "ring-offset-color": [{ "ring-offset": [e] }],
                shadow: [
                    {
                        shadow: [
                            "",
                            "inner",
                            "none",
                            ht,
                            zv,
                        ],
                    },
                ],
                "shadow-color": [{ shadow: [nr] }],
                opacity: [{ opacity: [d] }],
                "mix-blend": [
                    {
                        "mix-blend": [
                            ...ln(),
                            "plus-lighter",
                            "plus-darker",
                        ],
                    },
                ],
                "bg-blend": [{ "bg-blend": ln() }],
                filter: [{ filter: ["", "none"] }],
                blur: [{ blur: [n] }],
                brightness: [{ brightness: [r] }],
                contrast: [{ contrast: [u] }],
                "drop-shadow": [
                    {
                        "drop-shadow": [
                            "",
                            "none",
                            ht,
                            L,
                        ],
                    },
                ],
                grayscale: [{ grayscale: [a] }],
                "hue-rotate": [{ "hue-rotate": [m] }],
                invert: [{ invert: [f] }],
                saturate: [{ saturate: [p] }],
                sepia: [{ sepia: [k] }],
                "backdrop-filter": [{ "backdrop-filter": ["", "none"] }],
                "backdrop-blur": [{ "backdrop-blur": [n] }],
                "backdrop-brightness": [{ "backdrop-brightness": [r] }],
                "backdrop-contrast": [{ "backdrop-contrast": [u] }],
                "backdrop-grayscale": [{ "backdrop-grayscale": [a] }],
                "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [m] }],
                "backdrop-invert": [{ "backdrop-invert": [f] }],
                "backdrop-opacity": [{ "backdrop-opacity": [d] }],
                "backdrop-saturate": [{ "backdrop-saturate": [p] }],
                "backdrop-sepia": [{ "backdrop-sepia": [k] }],
                "border-collapse": [{ border: ["collapse", "separate"] }],
                "border-spacing": [{ "border-spacing": [s] }],
                "border-spacing-x": [{ "border-spacing-x": [s] }],
                "border-spacing-y": [{ "border-spacing-y": [s] }],
                "table-layout": [{ table: ["auto", "fixed"] }],
                caption: [{ caption: ["top", "bottom"] }],
                transition: [
                    {
                        transition: [
                            "none",
                            "all",
                            "",
                            "colors",
                            "opacity",
                            "shadow",
                            "transform",
                            L,
                        ],
                    },
                ],
                duration: [{ duration: b() }],
                ease: [
                    {
                        ease: [
                            "linear",
                            "in",
                            "out",
                            "in-out",
                            L,
                        ],
                    },
                ],
                delay: [{ delay: b() }],
                animate: [
                    {
                        animate: [
                            "none",
                            "spin",
                            "ping",
                            "pulse",
                            "bounce",
                            L,
                        ],
                    },
                ],
                transform: [
                    {
                        transform: [
                            "",
                            "gpu",
                            "none",
                        ],
                    },
                ],
                scale: [{ scale: [_] }],
                "scale-x": [{ "scale-x": [_] }],
                "scale-y": [{ "scale-y": [_] }],
                rotate: [{ rotate: [tr, L] }],
                "translate-x": [{ "translate-x": [C] }],
                "translate-y": [{ "translate-y": [C] }],
                "skew-x": [{ "skew-x": [T] }],
                "skew-y": [{ "skew-y": [T] }],
                "transform-origin": [
                    {
                        origin: [
                            "center",
                            "top",
                            "top-right",
                            "right",
                            "bottom-right",
                            "bottom",
                            "bottom-left",
                            "left",
                            "top-left",
                            L,
                        ],
                    },
                ],
                accent: [{ accent: ["auto", e] }],
                appearance: [{ appearance: ["none", "auto"] }],
                cursor: [
                    {
                        cursor: [
                            "auto",
                            "default",
                            "pointer",
                            "wait",
                            "text",
                            "move",
                            "help",
                            "not-allowed",
                            "none",
                            "context-menu",
                            "progress",
                            "cell",
                            "crosshair",
                            "vertical-text",
                            "alias",
                            "copy",
                            "no-drop",
                            "grab",
                            "grabbing",
                            "all-scroll",
                            "col-resize",
                            "row-resize",
                            "n-resize",
                            "e-resize",
                            "s-resize",
                            "w-resize",
                            "ne-resize",
                            "nw-resize",
                            "se-resize",
                            "sw-resize",
                            "ew-resize",
                            "ns-resize",
                            "nesw-resize",
                            "nwse-resize",
                            "zoom-in",
                            "zoom-out",
                            L,
                        ],
                    },
                ],
                "caret-color": [{ caret: [e] }],
                "pointer-events": [{ "pointer-events": ["none", "auto"] }],
                resize: [
                    {
                        resize: [
                            "none",
                            "y",
                            "x",
                            "",
                        ],
                    },
                ],
                "scroll-behavior": [{ scroll: ["auto", "smooth"] }],
                "scroll-m": [{ "scroll-m": D() }],
                "scroll-mx": [{ "scroll-mx": D() }],
                "scroll-my": [{ "scroll-my": D() }],
                "scroll-ms": [{ "scroll-ms": D() }],
                "scroll-me": [{ "scroll-me": D() }],
                "scroll-mt": [{ "scroll-mt": D() }],
                "scroll-mr": [{ "scroll-mr": D() }],
                "scroll-mb": [{ "scroll-mb": D() }],
                "scroll-ml": [{ "scroll-ml": D() }],
                "scroll-p": [{ "scroll-p": D() }],
                "scroll-px": [{ "scroll-px": D() }],
                "scroll-py": [{ "scroll-py": D() }],
                "scroll-ps": [{ "scroll-ps": D() }],
                "scroll-pe": [{ "scroll-pe": D() }],
                "scroll-pt": [{ "scroll-pt": D() }],
                "scroll-pr": [{ "scroll-pr": D() }],
                "scroll-pb": [{ "scroll-pb": D() }],
                "scroll-pl": [{ "scroll-pl": D() }],
                "snap-align": [
                    {
                        snap: [
                            "start",
                            "end",
                            "center",
                            "align-none",
                        ],
                    },
                ],
                "snap-stop": [{ snap: ["normal", "always"] }],
                "snap-type": [
                    {
                        snap: [
                            "none",
                            "x",
                            "y",
                            "both",
                        ],
                    },
                ],
                "snap-strictness": [{ snap: ["mandatory", "proximity"] }],
                touch: [
                    {
                        touch: [
                            "auto",
                            "none",
                            "manipulation",
                        ],
                    },
                ],
                "touch-x": [
                    {
                        "touch-pan": [
                            "x",
                            "left",
                            "right",
                        ],
                    },
                ],
                "touch-y": [
                    {
                        "touch-pan": [
                            "y",
                            "up",
                            "down",
                        ],
                    },
                ],
                "touch-pz": ["touch-pinch-zoom"],
                select: [
                    {
                        select: [
                            "none",
                            "text",
                            "all",
                            "auto",
                        ],
                    },
                ],
                "will-change": [
                    {
                        "will-change": [
                            "auto",
                            "scroll",
                            "contents",
                            "transform",
                            L,
                        ],
                    },
                ],
                fill: [{ fill: [e, "none"] }],
                "stroke-w": [
                    {
                        stroke: [
                            qe,
                            mt,
                            ts,
                        ],
                    },
                ],
                stroke: [{ stroke: [e, "none"] }],
                sr: ["sr-only", "not-sr-only"],
                "forced-color-adjust": [
                    { "forced-color-adjust": ["auto", "none"] },
                ],
            },
            conflictingClassGroups: {
                overflow: ["overflow-x", "overflow-y"],
                overscroll: ["overscroll-x", "overscroll-y"],
                inset: [
                    "inset-x",
                    "inset-y",
                    "start",
                    "end",
                    "top",
                    "right",
                    "bottom",
                    "left",
                ],
                "inset-x": ["right", "left"],
                "inset-y": ["top", "bottom"],
                flex: [
                    "basis",
                    "grow",
                    "shrink",
                ],
                gap: ["gap-x", "gap-y"],
                p: [
                    "px",
                    "py",
                    "ps",
                    "pe",
                    "pt",
                    "pr",
                    "pb",
                    "pl",
                ],
                px: ["pr", "pl"],
                py: ["pt", "pb"],
                m: [
                    "mx",
                    "my",
                    "ms",
                    "me",
                    "mt",
                    "mr",
                    "mb",
                    "ml",
                ],
                mx: ["mr", "ml"],
                my: ["mt", "mb"],
                size: ["w", "h"],
                "font-size": ["leading"],
                "fvn-normal": [
                    "fvn-ordinal",
                    "fvn-slashed-zero",
                    "fvn-figure",
                    "fvn-spacing",
                    "fvn-fraction",
                ],
                "fvn-ordinal": ["fvn-normal"],
                "fvn-slashed-zero": ["fvn-normal"],
                "fvn-figure": ["fvn-normal"],
                "fvn-spacing": ["fvn-normal"],
                "fvn-fraction": ["fvn-normal"],
                "line-clamp": ["display", "overflow"],
                rounded: [
                    "rounded-s",
                    "rounded-e",
                    "rounded-t",
                    "rounded-r",
                    "rounded-b",
                    "rounded-l",
                    "rounded-ss",
                    "rounded-se",
                    "rounded-ee",
                    "rounded-es",
                    "rounded-tl",
                    "rounded-tr",
                    "rounded-br",
                    "rounded-bl",
                ],
                "rounded-s": ["rounded-ss", "rounded-es"],
                "rounded-e": ["rounded-se", "rounded-ee"],
                "rounded-t": ["rounded-tl", "rounded-tr"],
                "rounded-r": ["rounded-tr", "rounded-br"],
                "rounded-b": ["rounded-br", "rounded-bl"],
                "rounded-l": ["rounded-tl", "rounded-bl"],
                "border-spacing": ["border-spacing-x", "border-spacing-y"],
                "border-w": [
                    "border-w-s",
                    "border-w-e",
                    "border-w-t",
                    "border-w-r",
                    "border-w-b",
                    "border-w-l",
                ],
                "border-w-x": ["border-w-r", "border-w-l"],
                "border-w-y": ["border-w-t", "border-w-b"],
                "border-color": [
                    "border-color-s",
                    "border-color-e",
                    "border-color-t",
                    "border-color-r",
                    "border-color-b",
                    "border-color-l",
                ],
                "border-color-x": ["border-color-r", "border-color-l"],
                "border-color-y": ["border-color-t", "border-color-b"],
                "scroll-m": [
                    "scroll-mx",
                    "scroll-my",
                    "scroll-ms",
                    "scroll-me",
                    "scroll-mt",
                    "scroll-mr",
                    "scroll-mb",
                    "scroll-ml",
                ],
                "scroll-mx": ["scroll-mr", "scroll-ml"],
                "scroll-my": ["scroll-mt", "scroll-mb"],
                "scroll-p": [
                    "scroll-px",
                    "scroll-py",
                    "scroll-ps",
                    "scroll-pe",
                    "scroll-pt",
                    "scroll-pr",
                    "scroll-pb",
                    "scroll-pl",
                ],
                "scroll-px": ["scroll-pr", "scroll-pl"],
                "scroll-py": ["scroll-pt", "scroll-pb"],
                touch: [
                    "touch-x",
                    "touch-y",
                    "touch-pz",
                ],
                "touch-x": ["touch"],
                "touch-y": ["touch"],
                "touch-pz": ["touch"],
            },
            conflictingClassGroupModifiers: { "font-size": ["leading"] },
        };
    },
    Vv = kv($v);
function ct(...e) {
    return Vv(dv(e));
}
const Wv = jf(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 print:hidden",
        {
            variants: {
                variant: {
                    default: "bg-blue-600 text-white hover:bg-blue-600/80",
                    coffee: "bg-amber-700 text-white hover:bg-amber-700/80",
                    destructive:
                        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    outline:
                        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    secondary:
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    ghost: "hover:bg-accent hover:text-accent-foreground",
                    link: "text-blue-600 underline-offset-4 hover:underline",
                },
                size: {
                    default: "h-10 px-4 py-2",
                    sm: "h-7 rounded-md px-3 py-1",
                    xs: "h-5 rounded-md px-2",
                    lg: "h-11 rounded-md px-8",
                    icon: "h-10 w-10",
                    "icon-sm": "h-7 w-7",
                },
            },
            defaultVariants: { variant: "default", size: "default" },
        }
    ),
    Vr = w.forwardRef(
        ({ className: e, variant: t, size: n, asChild: r = !1, ...o }, i) => {
            const s = r ? Dr : "button";
            return v.jsx(s, {
                className: ct(Wv({ variant: t, size: n, className: e })),
                ref: i,
                ...o,
            });
        }
    );
Vr.displayName = "Button";
function Bf(e) {
    const { accept: t = "", onChange: n, onError: r, onClick: o } = e;
    async function i(u) {
        try {
            const [a] = u.target.files;
            if (!a) return;
            n(a);
        } catch (a) {
            r(a);
        }
    }
    function s(u) {
        (o(), (u.target.value = ""));
    }
    return v.jsx("form", {
        className: "flex items-center space-x-6",
        children: v.jsx(Vr, {
            variant: "default",
            className:
                "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            asChild: !0,
            children: v.jsxs("label", {
                className: "relative",
                children: [
                    v.jsx("span", {
                        className: "flex items-center rounded-md",
                        children: "Open FIT file",
                    }),
                    v.jsx("input", {
                        type: "file",
                        accept: t,
                        className:
                            "absolute h-full w-full opacity-0 top-0 left-0",
                        onChange: i,
                        onClick: s,
                        autoFocus: !0,
                    }),
                ],
            }),
        }),
    });
}
Bf.propTypes = {
    onChange: B.func.isRequired,
    onClick: B.func.isRequired,
    onError: B.func.isRequired,
    accept: B.string,
};
function Gv() {
    const {
        selectedFile: e = "Select a file",
        filename: t,
        fitFiles: n,
        setSelected: r,
    } = Si();
    if (!n || n.length === 0) return null;
    if (n.length === 1)
        return v.jsx("span", {
            className: "ms-3 selected-file text-lg",
            children: t,
        });
    function o(i) {
        r(i.target.value);
    }
    return v.jsxs("select", {
        className: "ms-3 select select-sm w-full max-w-xs",
        autoFocus: !0,
        value: e,
        onChange: o,
        children: [
            v.jsx("option", { disabled: !0, children: "Select a file" }),
            n.map((i) => v.jsx("option", { children: i }, i)),
        ],
    });
}
const Hv = w.lazy(() =>
        en(
            () => import("./index-CQWboq_8.js"),
            __vite__mapDeps([
                4,
                5,
                6,
                7,
                8,
            ]),
            import.meta.url
        )
    ),
    Qv = w.lazy(() =>
        en(
            () => import("./index-B6xcXKpx.js"),
            __vite__mapDeps([
                9,
                2,
                1,
                7,
                10,
                5,
            ]),
            import.meta.url
        )
    );
function Kv() {
    const {
        file: e,
        handleFileChange: t,
        handleFileError: n,
        stopRef: r,
    } = Si();
    return v.jsxs("div", {
        className: "flex flex-wrap items-baseline",
        children: [
            (e == null ? void 0 : e.name) &&
                v.jsxs(v.Fragment, {
                    children: [
                        v.jsx("h2", {
                            className: "text-2xl font-medium",
                            children: e.name,
                        }),
                        v.jsx(Gv, {}),
                        v.jsx("div", {
                            className: "h-8 flex-grow",
                            children: v.jsxs(w.Suspense, {
                                children: [
                                    v.jsx(Hv, { className: "ms-2" }),
                                    v.jsx(Qv, { className: "ms-2" }),
                                ],
                            }),
                        }),
                    ],
                }),
            v.jsx(Bf, {
                onChange: t,
                onError: n,
                onClick: () => {
                    r.current = !0;
                },
                accept: ".fit,.zip",
            }),
        ],
    });
}
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const Yv = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
    $f = (...e) => e.filter((t, n, r) => !!t && r.indexOf(t) === n).join(" ");
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ var Xv = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const Jv = w.forwardRef(
    (
        {
            color: e = "currentColor",
            size: t = 24,
            strokeWidth: n = 2,
            absoluteStrokeWidth: r,
            className: o = "",
            children: i,
            iconNode: s,
            ...l
        },
        u
    ) =>
        w.createElement(
            "svg",
            {
                ref: u,
                ...Xv,
                width: t,
                height: t,
                stroke: e,
                strokeWidth: r ? (Number(n) * 24) / Number(t) : n,
                className: $f("lucide", o),
                ...l,
            },
            [
                ...s.map(([a, m]) => w.createElement(a, m)),
                ...(Array.isArray(i) ? i : [i]),
            ]
        )
);
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const wi = (e, t) => {
    const n = w.forwardRef(({ className: r, ...o }, i) =>
        w.createElement(Jv, {
            ref: i,
            iconNode: t,
            className: $f(`lucide-${Yv(e)}`, r),
            ...o,
        })
    );
    return ((n.displayName = `${e}`), n);
};
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const Zv = wi("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const qv = wi("Circle", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
]);
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const e0 = wi("Coffee", [
    ["path", { d: "M10 2v2", key: "7u0qdc" }],
    ["path", { d: "M14 2v2", key: "6buw04" }],
    [
        "path",
        {
            d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
            key: "pwadti",
        },
    ],
    ["path", { d: "M6 2v2", key: "colzsn" }],
]);
/**
 * @license Lucide-react v0.396.0 - ISC
 *
 *   This source code is licensed under the ISC license. See the LICENSE file in
 *   the root directory of this source tree.
 */ const t0 = wi("X", [
        ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
        ["path", { d: "m6 6 12 12", key: "d8bk6v" }],
    ]),
    n0 = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g;
function sl(e) {
    const { href: t } = e;
    if (!t) return v.jsx("a", { ...e });
    const n = () => {
        const r = t.replace(n0, "{uuid}");
        _n("External Link", { href: r });
    };
    return v.jsx("a", { ...e, onClick: n });
}
sl.propTypes = { href: B.string };
const r0 = "https://www.paypal.com/donate/?hosted_button_id=LMTBYXX2UYFRQ",
    o0 = "https://buymeacoffee.com/fitfileviewer";
function Vf(e) {
    const { className: t } = e,
        n = r0;
    return v.jsxs("div", {
        className: t,
        children: [
            v.jsxs("div", {
                children: [
                    v.jsx("span", {
                        className: "me-2",
                        children: "Is this helpful?",
                    }),
                    v.jsx(Vr, {
                        variant: "coffee",
                        size: "sm",
                        asChild: !0,
                        children: v.jsxs(sl, {
                            href: n,
                            children: [
                                v.jsx("span", { children: "Buy Me a coffee" }),
                                v.jsx(e0, {
                                    className: "w-6 h-6 text-white ms-2",
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            v.jsxs("div", {
                className: "opacity-75 text-xs mt-1",
                children: [
                    "or ",
                    v.jsx(sl, { href: o0, children: "without PayPal" }),
                ],
            }),
        ],
    });
}
Vf.propTypes = { className: B.string };
const i0 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAYCAYAAADpnJ2CAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gMKECIvrwBSlAAABghJREFUSMeNVm2MVNUZft5zzr1zZ4fZD1jZWnapXcWICoupEklTrE0twfEbjVkhQNCKJVTTX7VNA7ShoYZNm2JLSsVWYKkSS9IaFloMfi8RN7pEpKJCYQV1tgu7s7O7c+fee855+2N2Zu9MatKT3B/343mf53k/zrmE2Jp4YOnXEIbroHUbiAyYHXjJ1yDEH1MvHrTLe1Zhb2ZX6eOtwCPzf9CSRf6exSdG77rxbHFBJNEkNfuNAc4OzPQOb7//iueOfOP3H5fjr315HQgACo8/jLptz2J86eJvw0Q90LoORAAzUFe3CVJtXvtoqymTrTr0cFNBF9aEJtw4oWx6zeujuKN/HI7hkvCEwPbvNuHoNSldj8Qv6910187v7RgHAAEAdduendTA08FcIgMAIpBy36V0gy2TLe9Z1Z4P88/42u8ybNJGEFpHNAiAEQQjCJEiXJiuAGOUr/2NI8XclrWH16UrhABQ3LrZgZTtMGYqx0IArvPh4J79DAArDq6+3Nf+tshGywCACfAiixljBsJOwQJF+LxJQTLAzIhstP5Scfj+n/ZuEBVCc6w3RUbPqbgDACEv8mhutJ0Iu092i4IubAxtmCm/tkSYncOFdNEW470QuSo34clh4snYbKBZP3565PRXK4Qc+ClmnhMHQtBJOK4GgINn/3FnZKO18des5CuZU/ZPTQUe4ymdtiFSR9h1usoPCARjzQICzRfBcztKT7VOoZaQ6KQEhQBQNMWtzBzTIs6PTE9tyryX+49g9mIomw74rWxzcp8kebEiDgxjzWKRWD0pWsoUmFurHcqT3oFXC509K+/TVs+JK5YkXzq2aNebAdlrGEjFCUUyeUIT54noeDycYXOdAAD/6S4BqaobhgiQ8gQBKHLwmCWgcgk6H3rqAABYa64As4hn2r1q7vtX5ZWVJC/FHSZU4moBAPaNIw7paG6NOy2Ums2rOxe2fVFY3D6kUb6u/0LntrxCpFcsuw2g2VU4pfL01K+HWsYhiKhSA2aGK9yrFQCwX3Rh7LVVQKOVzY10T+RG8KvnAXC8tphnCQerWrO8pPwAAIq6oIzVqerG0Z+pUtatC+B6fMmyBIDw/y0h+gHAgl0GNU9ViDChC2fUZMu50Hbu/8RbgKrsleaPv0yAco4DgLEmCdiqJiTQBeV3bYY91tvCRV/VKD2umC58NMtZOOZiZiWeRdCaMx9Mn+BBC9sBa2dVwdL175U8UIO23FaVbSE/VLbvbYEw7EBsxiAEqL7hx97+fx5ecrjzryYK7sOkURJ0cWJWy4+Odmx/c3zpt/YiDB6K4Wxy9/5TK554UobZ89dZDuLuICDeFfALBK07qgdeZNkv5AEg6euCF1r2QgsvsvBCS42Do4pvvOVyGD2rJp2fEJEJPh9IGmvurXJH8iKDTws2WjDbGkKcI8cZAQBHqM9qqpQg0GWQugWMr9TsTP0A4KnklZGN7ojPoBDi7570hgTn84DlakLQACWSk4TOO1VDwWg0NupAiBmgakKSsh8ACrrwlGVLMXeGQH/bc/ufc0LMW9AIHc2oUXpOdK4cBoDb25ceEiTCmFpprbml7+Zpy6SxDXFYXZDsfeDA8t8GJlhSk84XmhKNR0vn4dDgvNqGAfi8d++DGgBWzO0sutLtniIEEoFedLpef9+Jpg5BRzPWPJJ62o8m1leVVah/e8p7ZueSHcMlwiBYUFOjPITIAkDU3wcAaJvW9hNBYmyyvkgFVjSNa1VOmmBgqF5hWIY3xA91IhqVQm55PrPn9YofjqL5NenMQsosADg33ITHXl6P39y69VLaST9IoJABTCtaNI/ZyvALy/i02QHHtiMCDXrC3bD/zn07AWBD7yZM/mLYhTUOh5DwsuWbP9z2OzzUsxJ7M7sOpdzUMhLyTL3PYXNel+pjGY5hDDQrgAAiGhFCvF2n6la+eNe+bSWyn+MX3ywRKjBOAThXLgWA10RDYzau4C+Z3QCAFzLdBzJ9P+xr+3jgCUnyO2dava+PJ8XMVGALn85MnnOk8y8pVc+uW7t3J1PS3rR3Ee6+8m787OYnK7H+C5ajtj+Tl9PtAAAAAElFTkSuQmCC";
function Wf(e) {
    const { className: t = "" } = e;
    return v.jsxs("div", {
        children: [
            v.jsx(Vf, { className: "text-center mb-4 print:hidden" }),
            v.jsx("footer", {
                className: `text-xs text-center text-slate-500 border-t-2 border-gray-300 pt-2 ${t}`,
                children: v.jsxs("span", {
                    children: [
                        v.jsx("span", {
                            children: "Developed by Harry Oosterveen,",
                        }),
                        v.jsxs("a", {
                            href: "https://www.harryonline.net/",
                            className: "italic ms-2 ",
                            children: [
                                v.jsx("span", { children: "HarryOnline" }),
                                v.jsx("img", {
                                    alt: "HarryOnline logo",
                                    src: i0,
                                    className: "ms-2 h-3 inline-block",
                                    width: "14",
                                    height: "12",
                                }),
                            ],
                        }),
                    ],
                }),
            }),
        ],
    });
}
Wf.propTypes = { className: B.string };
function Le(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
    return function (o) {
        if ((e == null || e(o), n === !1 || !o.defaultPrevented))
            return t == null ? void 0 : t(o);
    };
}
function Gn(e, t = []) {
    let n = [];
    function r(i, s) {
        const l = w.createContext(s),
            u = n.length;
        n = [...n, s];
        function a(f) {
            const { scope: h, children: g, ...y } = f,
                S = (h == null ? void 0 : h[e][u]) || l,
                x = w.useMemo(() => y, Object.values(y));
            return v.jsx(S.Provider, { value: x, children: g });
        }
        function m(f, h) {
            const g = (h == null ? void 0 : h[e][u]) || l,
                y = w.useContext(g);
            if (y) return y;
            if (s !== void 0) return s;
            throw new Error(`\`${f}\` must be used within \`${i}\``);
        }
        return ((a.displayName = i + "Provider"), [a, m]);
    }
    const o = () => {
        const i = n.map((s) => w.createContext(s));
        return function (l) {
            const u = (l == null ? void 0 : l[e]) || i;
            return w.useMemo(
                () => ({ [`__scope${e}`]: { ...l, [e]: u } }),
                [l, u]
            );
        };
    };
    return ((o.scopeName = e), [r, s0(o, ...t)]);
}
function s0(...e) {
    const t = e[0];
    if (e.length === 1) return t;
    const n = () => {
        const r = e.map((o) => ({ useScope: o(), scopeName: o.scopeName }));
        return function (i) {
            const s = r.reduce((l, { useScope: u, scopeName: a }) => {
                const f = u(i)[`__scope${a}`];
                return { ...l, ...f };
            }, {});
            return w.useMemo(() => ({ [`__scope${t.scopeName}`]: s }), [s]);
        };
    };
    return ((n.scopeName = t.scopeName), n);
}
function gu(e) {
    const t = w.useRef(e);
    return (
        w.useEffect(() => {
            t.current = e;
        }),
        w.useMemo(
            () =>
                (...n) => {
                    var r;
                    return (r = t.current) == null ? void 0 : r.call(t, ...n);
                },
            []
        )
    );
}
function _i({ prop: e, defaultProp: t, onChange: n = () => {} }) {
    const [r, o] = l0({ defaultProp: t, onChange: n }),
        i = e !== void 0,
        s = i ? e : r,
        l = gu(n),
        u = w.useCallback(
            (a) => {
                if (i) {
                    const f = typeof a == "function" ? a(e) : a;
                    f !== e && l(f);
                } else o(a);
            },
            [
                i,
                e,
                o,
                l,
            ]
        );
    return [s, u];
}
function l0({ defaultProp: e, onChange: t }) {
    const n = w.useState(e),
        [r] = n,
        o = w.useRef(r),
        i = gu(t);
    return (
        w.useEffect(() => {
            o.current !== r && (i(r), (o.current = r));
        }, [
            r,
            o,
            i,
        ]),
        n
    );
}
function yu(e) {
    const t = w.useRef({ value: e, previous: e });
    return w.useMemo(
        () => (
            t.current.value !== e &&
                ((t.current.previous = t.current.value), (t.current.value = e)),
            t.current.previous
        ),
        [e]
    );
}
var Xo =
    globalThis != null && globalThis.document ? w.useLayoutEffect : () => {};
function vu(e) {
    const [t, n] = w.useState(void 0);
    return (
        Xo(() => {
            if (e) {
                n({ width: e.offsetWidth, height: e.offsetHeight });
                const r = new ResizeObserver((o) => {
                    if (!Array.isArray(o) || !o.length) return;
                    const i = o[0];
                    let s, l;
                    if ("borderBoxSize" in i) {
                        const u = i.borderBoxSize,
                            a = Array.isArray(u) ? u[0] : u;
                        ((s = a.inlineSize), (l = a.blockSize));
                    } else ((s = e.offsetWidth), (l = e.offsetHeight));
                    n({ width: s, height: l });
                });
                return (
                    r.observe(e, { box: "border-box" }),
                    () => r.unobserve(e)
                );
            } else n(void 0);
        }, [e]),
        t
    );
}
var u0 = [
        "a",
        "button",
        "div",
        "form",
        "h2",
        "h3",
        "img",
        "input",
        "label",
        "li",
        "nav",
        "ol",
        "p",
        "span",
        "svg",
        "ul",
    ],
    Ze = u0.reduce((e, t) => {
        const n = w.forwardRef((r, o) => {
            const { asChild: i, ...s } = r,
                l = i ? Dr : t;
            return (
                typeof window < "u" && (window[Symbol.for("radix-ui")] = !0),
                v.jsx(l, { ...s, ref: o })
            );
        });
        return ((n.displayName = `Primitive.${t}`), { ...e, [t]: n });
    }, {});
function rS(e, t) {
    e && pi.flushSync(() => e.dispatchEvent(t));
}
var Su = "Switch",
    [a0, oS] = Gn(Su),
    [c0, d0] = a0(Su),
    Gf = w.forwardRef((e, t) => {
        const {
                __scopeSwitch: n,
                name: r,
                checked: o,
                defaultChecked: i,
                required: s,
                disabled: l,
                value: u = "on",
                onCheckedChange: a,
                ...m
            } = e,
            [f, h] = w.useState(null),
            g = Lt(t, (c) => h(c)),
            y = w.useRef(!1),
            S = f ? !!f.closest("form") : !0,
            [x = !1, d] = _i({ prop: o, defaultProp: i, onChange: a });
        return v.jsxs(c0, {
            scope: n,
            checked: x,
            disabled: l,
            children: [
                v.jsx(Ze.button, {
                    type: "button",
                    role: "switch",
                    "aria-checked": x,
                    "aria-required": s,
                    "data-state": Kf(x),
                    "data-disabled": l ? "" : void 0,
                    disabled: l,
                    value: u,
                    ...m,
                    ref: g,
                    onClick: Le(e.onClick, (c) => {
                        (d((p) => !p),
                            S &&
                                ((y.current = c.isPropagationStopped()),
                                y.current || c.stopPropagation()));
                    }),
                }),
                S &&
                    v.jsx(f0, {
                        control: f,
                        bubbles: !y.current,
                        name: r,
                        value: u,
                        checked: x,
                        required: s,
                        disabled: l,
                        style: { transform: "translateX(-100%)" },
                    }),
            ],
        });
    });
Gf.displayName = Su;
var Hf = "SwitchThumb",
    Qf = w.forwardRef((e, t) => {
        const { __scopeSwitch: n, ...r } = e,
            o = d0(Hf, n);
        return v.jsx(Ze.span, {
            "data-state": Kf(o.checked),
            "data-disabled": o.disabled ? "" : void 0,
            ...r,
            ref: t,
        });
    });
Qf.displayName = Hf;
var f0 = (e) => {
    const { control: t, checked: n, bubbles: r = !0, ...o } = e,
        i = w.useRef(null),
        s = yu(n),
        l = vu(t);
    return (
        w.useEffect(() => {
            const u = i.current,
                a = window.HTMLInputElement.prototype,
                f = Object.getOwnPropertyDescriptor(a, "checked").set;
            if (s !== n && f) {
                const h = new Event("click", { bubbles: r });
                (f.call(u, n), u.dispatchEvent(h));
            }
        }, [
            s,
            n,
            r,
        ]),
        v.jsx("input", {
            type: "checkbox",
            "aria-hidden": !0,
            defaultChecked: n,
            ...o,
            tabIndex: -1,
            ref: i,
            style: {
                ...e.style,
                ...l,
                position: "absolute",
                pointerEvents: "none",
                opacity: 0,
                margin: 0,
            },
        })
    );
};
function Kf(e) {
    return e ? "checked" : "unchecked";
}
var Yf = Gf,
    p0 = Qf;
const Xf = w.forwardRef(({ className: e, ...t }, n) =>
    v.jsx(Yf, {
        className: ct(
            "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950 dark:data-[state=checked]:bg-slate-50 dark:data-[state=unchecked]:bg-slate-800",
            e
        ),
        ...t,
        ref: n,
        children: v.jsx(p0, {
            className: ct(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-slate-950"
            ),
        }),
    })
);
Xf.displayName = Yf.displayName;
function Jf(e) {
    const { className: t } = e,
        { devMode: n, toggleDevMode: r } = Si();
    return v.jsxs("div", {
        className: t,
        children: [
            v.jsxs("label", {
                htmlFor: "dev-mode",
                className: "inline-flex items-center mb-2 print:hidden",
                children: [
                    "User Mode",
                    v.jsx(Xf, {
                        className: "mx-2",
                        "aria-label": "Developer Mode",
                        checked: n,
                        onCheckedChange: r,
                    }),
                    "Developer Mode",
                ],
            }),
            v.jsx("div", {
                className: "text-sm print:hidden",
                children: n
                    ? "Show raw values from all messages and fields"
                    : "Show converted values from named messages and fields only",
            }),
            v.jsx("div", {
                className: "screen:hidden",
                children: n ? "Developer Mode" : "User Mode",
            }),
        ],
    });
}
Jf.propTypes = { className: B.string };
function m0(...e) {
    return e.filter(Boolean).join(" ");
}
function ll(e) {
    const { value: t, max: n, className: r, ...o } = e;
    if (t === 0) return null;
    const i = { width: `${(t / n) * 100}%` };
    return v.jsx("div", {
        ...o,
        className: m0(
            "h-full inline-block text-white text-end text-sm pe-2 overflow-hidden",
            r
        ),
        style: i,
        children: t.toLocaleString(),
    });
}
ll.propTypes = { value: B.number, max: B.number, className: B.string };
function Zf(e) {
    const { statistics: t } = e;
    if (!t) return null;
    const { discardedBytes: n, totalBytes: r, position: o, records: i } = t,
        s = [`Read ${i.toLocaleString()} records`];
    return (
        o === r
            ? s.push(`${o.toLocaleString()} bytes`)
            : s.push(`${o.toLocaleString()} of ${r.toLocaleString()} bytes`),
        n > 0 && s.push(`discarded ${n.toLocaleString()} bytes`),
        v.jsx("div", {
            className: "bg-gray-200 px-4 rounded-md py-1 border-1",
            children: s.join(", "),
        })
    );
}
Zf.propTypes = {
    statistics: B.shape({
        discardedBytes: B.number,
        totalBytes: B.number,
        position: B.number,
        records: B.number,
    }),
};
function h0() {
    const { statistics: e, file: t, fit: n } = Si(),
        [r, o] = w.useState(!1);
    if (
        (w.useEffect(() => {
            e &&
                (n || o(!0),
                n &&
                    setTimeout(() => {
                        o(!1);
                    }, 1e3));
        }, [
            e,
            n,
            t,
        ]),
        !e)
    )
        return null;
    const { discardedBytes: i, totalBytes: s, position: l, records: u } = e,
        a = l - i;
    return r
        ? v.jsxs("div", {
              className: "flex items-baseline space-x-2 h-8",
              children: [
                  v.jsx("div", {
                      className: "whitespace-nowrap",
                      children: `Processing FIT file, ${u.toLocaleString()} records`,
                  }),
                  v.jsxs("div", {
                      role: "progressbar",
                      "aria-valuemax": s,
                      "aria-valuenow": l,
                      className:
                          "h-5 w-full rounded-xl overflow-hidden  bg-gray-300 flex",
                      children: [
                          v.jsx(ll, {
                              id: "discarded",
                              title: "Discarded",
                              className:
                                  "bg-red-700 from-red-300 bg-gradient-to-r",
                              value: i,
                              max: s,
                          }),
                          v.jsx(ll, {
                              id: "accepted",
                              title: "Accepted",
                              className:
                                  "bg-green-700 from-green-300 bg-gradient-to-r",
                              value: a,
                              max: s,
                          }),
                      ],
                  }),
              ],
          })
        : v.jsx(Zf, { statistics: e });
}
var ec = function () {},
    g0 = typeof window < "u",
    y0 = function (e, t) {
        return typeof t == "boolean" ? t : !e;
    },
    v0 = function (e) {
        return w.useReducer(y0, e);
    },
    S0 = function (e, t, n) {
        if (!g0)
            return [
                t,
                ec,
                ec,
            ];
        if (!e) throw new Error("useLocalStorage key may not be falsy");
        var r = JSON.parse,
            o = w.useRef(function (m) {
                try {
                    var f = n
                            ? n.raw
                                ? String
                                : n.serializer
                            : JSON.stringify,
                        h = localStorage.getItem(m);
                    return h !== null
                        ? r(h)
                        : (t && localStorage.setItem(m, f(t)), t);
                } catch {
                    return t;
                }
            }),
            i = w.useState(function () {
                return o.current(e);
            }),
            s = i[0],
            l = i[1];
        w.useLayoutEffect(
            function () {
                return l(o.current(e));
            },
            [e]
        );
        var u = w.useCallback(
                function (m) {
                    try {
                        var f = typeof m == "function" ? m(s) : m;
                        if (typeof f > "u") return;
                        var h = void 0;
                        (n || (h = JSON.stringify(f)),
                            localStorage.setItem(e, h),
                            l(r(h)));
                    } catch {
                        /* Ignore errors */
                    }
                },
                [e, l]
            ),
            a = w.useCallback(
                function () {
                    try {
                        (localStorage.removeItem(e), l(void 0));
                    } catch {
                        /* Ignore errors */
                    }
                },
                [e, l]
            );
        return [
            s,
            u,
            a,
        ];
    };
const qf = w.createContext(),
    iS = () => {
        const e = w.useContext(qf);
        if (!e)
            throw new Error(
                "useCsvTimeFormat must be used within a CsvTimeFormatProvider"
            );
        return e;
    };
function w0() {
    try {
        return [navigator.language, "en-US"];
    } catch {
        return ["nl"];
    }
}
const ns = w0(),
    ep = { hour: "2-digit", minute: "2-digit", second: "2-digit" },
    tp = { year: "numeric", month: "2-digit", day: "2-digit" },
    _0 = { ...ep, ...tp },
    x0 = {
        time: Intl.DateTimeFormat(ns, ep),
        date: Intl.DateTimeFormat(ns, tp),
        datetime: Intl.DateTimeFormat(ns, _0),
    };
function E0(e, t = "datetime") {
    if (!(e instanceof Date)) return e;
    const n = x0[t];
    if (!n) throw new Error(`Unknown datetime key: ${t}`);
    return n.format(e);
}
function np({
    className: e = "-mt-4 -me-4",
    ariaLabel: t = "Close",
    size: n = "md",
    ...r
}) {
    const o = n === "sm" ? "w-4 h-4" : "w-6 h-6",
        i = n === "sm" ? "icon-sm" : "icon";
    return v.jsx(Vr, {
        type: "button",
        variant: "ghost",
        size: i,
        className: e,
        "aria-label": t,
        ...r,
        children: v.jsx(t0, { className: `text-slate-500 ${o}` }),
    });
}
np.propTypes = {
    onClick: B.func.isRequired,
    className: B.string,
    ariaLabel: B.string,
    size: B.oneOf(["sm", "md"]),
};
function rp(e) {
    const {
            title: t,
            show: n,
            onHide: r,
            children: o,
            className: i = "w-11/12 h-5/6",
        } = e,
        s = w.useRef();
    return (
        w.useEffect(() => {
            var l, u;
            if (!s.current) {
                console.error("No ref");
                return;
            }
            n
                ? (document.body.classList.add("overflow-hidden"),
                  s.current.showModal())
                : (document.body.classList.remove("overflow-hidden"),
                  (u = (l = s.current).close) == null || u.call(l));
        }, [n]),
        v.jsx("dialog", {
            ref: s,
            className: ct(
                "bg-white border border-slate-700 rounded-md backdrop:bg-black/50",
                i
            ),
            children: v.jsxs("div", {
                className: "flex flex-col h-full",
                children: [
                    v.jsxs("div", {
                        className: "flex items-start",
                        children: [
                            v.jsx("div", { className: "grow", children: t }),
                            r &&
                                v.jsx(np, {
                                    onClick: r,
                                    className: "float-right z-20",
                                }),
                        ],
                    }),
                    v.jsx("div", { className: "grow", children: o }),
                ],
            }),
        })
    );
}
rp.propTypes = {
    title: B.node,
    children: B.node,
    show: B.bool,
    onHide: B.func,
    className: B.string,
};
function k0(e) {
    const t = e + "CollectionProvider",
        [n, r] = Gn(t),
        [o, i] = n(t, { collectionRef: { current: null }, itemMap: new Map() }),
        s = (g) => {
            const { scope: y, children: S } = g,
                x = gt.useRef(null),
                d = gt.useRef(new Map()).current;
            return v.jsx(o, {
                scope: y,
                itemMap: d,
                collectionRef: x,
                children: S,
            });
        };
    s.displayName = t;
    const l = e + "CollectionSlot",
        u = gt.forwardRef((g, y) => {
            const { scope: S, children: x } = g,
                d = i(l, S),
                c = Lt(y, d.collectionRef);
            return v.jsx(Dr, { ref: c, children: x });
        });
    u.displayName = l;
    const a = e + "CollectionItemSlot",
        m = "data-radix-collection-item",
        f = gt.forwardRef((g, y) => {
            const { scope: S, children: x, ...d } = g,
                c = gt.useRef(null),
                p = Lt(y, c),
                _ = i(a, S);
            return (
                gt.useEffect(
                    () => (
                        _.itemMap.set(c, { ref: c, ...d }),
                        () => void _.itemMap.delete(c)
                    )
                ),
                v.jsx(Dr, { [m]: "", ref: p, children: x })
            );
        });
    f.displayName = a;
    function h(g) {
        const y = i(e + "CollectionConsumer", g);
        return gt.useCallback(() => {
            const x = y.collectionRef.current;
            if (!x) return [];
            const d = Array.from(x.querySelectorAll(`[${m}]`));
            return Array.from(y.itemMap.values()).sort(
                (_, k) => d.indexOf(_.ref.current) - d.indexOf(k.ref.current)
            );
        }, [y.collectionRef, y.itemMap]);
    }
    return [
        { Provider: s, Slot: u, ItemSlot: f },
        h,
        r,
    ];
}
var C0 = qp.useId || (() => {}),
    N0 = 0;
function T0(e) {
    const [t, n] = w.useState(C0());
    return (
        Xo(() => {
            n((r) => r ?? String(N0++));
        }, [e]),
        t ? `radix-${t}` : ""
    );
}
var R0 = w.createContext(void 0);
function op(e) {
    const t = w.useContext(R0);
    return e || t || "ltr";
}
var rs = "rovingFocusGroup.onEntryFocus",
    P0 = { bubbles: !1, cancelable: !0 },
    xi = "RovingFocusGroup",
    [
        ul,
        ip,
        I0,
    ] = k0(xi),
    [A0, sp] = Gn(xi, [I0]),
    [O0, L0] = A0(xi),
    lp = w.forwardRef((e, t) =>
        v.jsx(ul.Provider, {
            scope: e.__scopeRovingFocusGroup,
            children: v.jsx(ul.Slot, {
                scope: e.__scopeRovingFocusGroup,
                children: v.jsx(j0, { ...e, ref: t }),
            }),
        })
    );
lp.displayName = xi;
var j0 = w.forwardRef((e, t) => {
        const {
                __scopeRovingFocusGroup: n,
                orientation: r,
                loop: o = !1,
                dir: i,
                currentTabStopId: s,
                defaultCurrentTabStopId: l,
                onCurrentTabStopIdChange: u,
                onEntryFocus: a,
                preventScrollOnEntryFocus: m = !1,
                ...f
            } = e,
            h = w.useRef(null),
            g = Lt(t, h),
            y = op(i),
            [S = null, x] = _i({ prop: s, defaultProp: l, onChange: u }),
            [d, c] = w.useState(!1),
            p = gu(a),
            _ = ip(n),
            k = w.useRef(!1),
            [T, P] = w.useState(0);
        return (
            w.useEffect(() => {
                const C = h.current;
                if (C)
                    return (
                        C.addEventListener(rs, p),
                        () => C.removeEventListener(rs, p)
                    );
            }, [p]),
            v.jsx(O0, {
                scope: n,
                orientation: r,
                dir: y,
                loop: o,
                currentTabStopId: S,
                onItemFocus: w.useCallback((C) => x(C), [x]),
                onItemShiftTab: w.useCallback(() => c(!0), []),
                onFocusableItemAdd: w.useCallback(() => P((C) => C + 1), []),
                onFocusableItemRemove: w.useCallback(() => P((C) => C - 1), []),
                children: v.jsx(Ze.div, {
                    tabIndex: d || T === 0 ? -1 : 0,
                    "data-orientation": r,
                    ...f,
                    ref: g,
                    style: { outline: "none", ...e.style },
                    onMouseDown: Le(e.onMouseDown, () => {
                        k.current = !0;
                    }),
                    onFocus: Le(e.onFocus, (C) => {
                        const F = !k.current;
                        if (C.target === C.currentTarget && F && !d) {
                            const A = new CustomEvent(rs, P0);
                            if (
                                (C.currentTarget.dispatchEvent(A),
                                !A.defaultPrevented)
                            ) {
                                const Z = _().filter((le) => le.focusable),
                                    D = Z.find((le) => le.active),
                                    We = Z.find((le) => le.id === S),
                                    sn = [
                                        D,
                                        We,
                                        ...Z,
                                    ]
                                        .filter(Boolean)
                                        .map((le) => le.ref.current);
                                cp(sn, m);
                            }
                        }
                        k.current = !1;
                    }),
                    onBlur: Le(e.onBlur, () => c(!1)),
                }),
            })
        );
    }),
    up = "RovingFocusGroupItem",
    ap = w.forwardRef((e, t) => {
        const {
                __scopeRovingFocusGroup: n,
                focusable: r = !0,
                active: o = !1,
                tabStopId: i,
                ...s
            } = e,
            l = T0(),
            u = i || l,
            a = L0(up, n),
            m = a.currentTabStopId === u,
            f = ip(n),
            { onFocusableItemAdd: h, onFocusableItemRemove: g } = a;
        return (
            w.useEffect(() => {
                if (r) return (h(), () => g());
            }, [
                r,
                h,
                g,
            ]),
            v.jsx(ul.ItemSlot, {
                scope: n,
                id: u,
                focusable: r,
                active: o,
                children: v.jsx(Ze.span, {
                    tabIndex: m ? 0 : -1,
                    "data-orientation": a.orientation,
                    ...s,
                    ref: t,
                    onMouseDown: Le(e.onMouseDown, (y) => {
                        r ? a.onItemFocus(u) : y.preventDefault();
                    }),
                    onFocus: Le(e.onFocus, () => a.onItemFocus(u)),
                    onKeyDown: Le(e.onKeyDown, (y) => {
                        if (y.key === "Tab" && y.shiftKey) {
                            a.onItemShiftTab();
                            return;
                        }
                        if (y.target !== y.currentTarget) return;
                        const S = b0(y, a.orientation, a.dir);
                        if (S !== void 0) {
                            if (
                                y.metaKey ||
                                y.ctrlKey ||
                                y.altKey ||
                                y.shiftKey
                            )
                                return;
                            y.preventDefault();
                            let d = f()
                                .filter((c) => c.focusable)
                                .map((c) => c.ref.current);
                            if (S === "last") d.reverse();
                            else if (S === "prev" || S === "next") {
                                S === "prev" && d.reverse();
                                const c = d.indexOf(y.currentTarget);
                                d = a.loop ? z0(d, c + 1) : d.slice(c + 1);
                            }
                            setTimeout(() => cp(d));
                        }
                    }),
                }),
            })
        );
    });
ap.displayName = up;
var M0 = {
    ArrowLeft: "prev",
    ArrowUp: "prev",
    ArrowRight: "next",
    ArrowDown: "next",
    PageUp: "first",
    Home: "first",
    PageDown: "last",
    End: "last",
};
function D0(e, t) {
    return t !== "rtl"
        ? e
        : e === "ArrowLeft"
          ? "ArrowRight"
          : e === "ArrowRight"
            ? "ArrowLeft"
            : e;
}
function b0(e, t, n) {
    const r = D0(e.key, n);
    if (
        !(t === "vertical" && ["ArrowLeft", "ArrowRight"].includes(r)) &&
        !(t === "horizontal" && ["ArrowUp", "ArrowDown"].includes(r))
    )
        return M0[r];
}
function cp(e, t = !1) {
    const n = document.activeElement;
    for (const r of e)
        if (
            r === n ||
            (r.focus({ preventScroll: t }), document.activeElement !== n)
        )
            return;
}
function z0(e, t) {
    return e.map((n, r) => e[(t + r) % e.length]);
}
var F0 = lp,
    U0 = ap;
function B0(e, t) {
    return w.useReducer((n, r) => t[n][r] ?? n, e);
}
var wu = (e) => {
    const { present: t, children: n } = e,
        r = $0(t),
        o =
            typeof n == "function"
                ? n({ present: r.isPresent })
                : w.Children.only(n),
        i = Lt(r.ref, V0(o));
    return typeof n == "function" || r.isPresent
        ? w.cloneElement(o, { ref: i })
        : null;
};
wu.displayName = "Presence";
function $0(e) {
    const [t, n] = w.useState(),
        r = w.useRef({}),
        o = w.useRef(e),
        i = w.useRef("none"),
        s = e ? "mounted" : "unmounted",
        [l, u] = B0(s, {
            mounted: {
                UNMOUNT: "unmounted",
                ANIMATION_OUT: "unmountSuspended",
            },
            unmountSuspended: { MOUNT: "mounted", ANIMATION_END: "unmounted" },
            unmounted: { MOUNT: "mounted" },
        });
    return (
        w.useEffect(() => {
            const a = co(r.current);
            i.current = l === "mounted" ? a : "none";
        }, [l]),
        Xo(() => {
            const a = r.current,
                m = o.current;
            if (m !== e) {
                const h = i.current,
                    g = co(a);
                (e
                    ? u("MOUNT")
                    : g === "none" ||
                        (a == null ? void 0 : a.display) === "none"
                      ? u("UNMOUNT")
                      : u(m && h !== g ? "ANIMATION_OUT" : "UNMOUNT"),
                    (o.current = e));
            }
        }, [e, u]),
        Xo(() => {
            if (t) {
                const a = (f) => {
                        const g = co(r.current).includes(f.animationName);
                        f.target === t &&
                            g &&
                            pi.flushSync(() => u("ANIMATION_END"));
                    },
                    m = (f) => {
                        f.target === t && (i.current = co(r.current));
                    };
                return (
                    t.addEventListener("animationstart", m),
                    t.addEventListener("animationcancel", a),
                    t.addEventListener("animationend", a),
                    () => {
                        (t.removeEventListener("animationstart", m),
                            t.removeEventListener("animationcancel", a),
                            t.removeEventListener("animationend", a));
                    }
                );
            } else u("ANIMATION_END");
        }, [t, u]),
        {
            isPresent: ["mounted", "unmountSuspended"].includes(l),
            ref: w.useCallback((a) => {
                (a && (r.current = getComputedStyle(a)), n(a));
            }, []),
        }
    );
}
function co(e) {
    return (e == null ? void 0 : e.animationName) || "none";
}
function V0(e) {
    var r, o;
    let t =
            (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null
                ? void 0
                : r.get,
        n = t && "isReactWarning" in t && t.isReactWarning;
    return n
        ? e.ref
        : ((t =
              (o = Object.getOwnPropertyDescriptor(e, "ref")) == null
                  ? void 0
                  : o.get),
          (n = t && "isReactWarning" in t && t.isReactWarning),
          n ? e.props.ref : e.props.ref || e.ref);
}
var _u = "Radio",
    [W0, dp] = Gn(_u),
    [G0, H0] = W0(_u),
    fp = w.forwardRef((e, t) => {
        const {
                __scopeRadio: n,
                name: r,
                checked: o = !1,
                required: i,
                disabled: s,
                value: l = "on",
                onCheck: u,
                ...a
            } = e,
            [m, f] = w.useState(null),
            h = Lt(t, (S) => f(S)),
            g = w.useRef(!1),
            y = m ? !!m.closest("form") : !0;
        return v.jsxs(G0, {
            scope: n,
            checked: o,
            disabled: s,
            children: [
                v.jsx(Ze.button, {
                    type: "button",
                    role: "radio",
                    "aria-checked": o,
                    "data-state": hp(o),
                    "data-disabled": s ? "" : void 0,
                    disabled: s,
                    value: l,
                    ...a,
                    ref: h,
                    onClick: Le(e.onClick, (S) => {
                        (o || u == null || u(),
                            y &&
                                ((g.current = S.isPropagationStopped()),
                                g.current || S.stopPropagation()));
                    }),
                }),
                y &&
                    v.jsx(Q0, {
                        control: m,
                        bubbles: !g.current,
                        name: r,
                        value: l,
                        checked: o,
                        required: i,
                        disabled: s,
                        style: { transform: "translateX(-100%)" },
                    }),
            ],
        });
    });
fp.displayName = _u;
var pp = "RadioIndicator",
    mp = w.forwardRef((e, t) => {
        const { __scopeRadio: n, forceMount: r, ...o } = e,
            i = H0(pp, n);
        return v.jsx(wu, {
            present: r || i.checked,
            children: v.jsx(Ze.span, {
                "data-state": hp(i.checked),
                "data-disabled": i.disabled ? "" : void 0,
                ...o,
                ref: t,
            }),
        });
    });
mp.displayName = pp;
var Q0 = (e) => {
    const { control: t, checked: n, bubbles: r = !0, ...o } = e,
        i = w.useRef(null),
        s = yu(n),
        l = vu(t);
    return (
        w.useEffect(() => {
            const u = i.current,
                a = window.HTMLInputElement.prototype,
                f = Object.getOwnPropertyDescriptor(a, "checked").set;
            if (s !== n && f) {
                const h = new Event("click", { bubbles: r });
                (f.call(u, n), u.dispatchEvent(h));
            }
        }, [
            s,
            n,
            r,
        ]),
        v.jsx("input", {
            type: "radio",
            "aria-hidden": !0,
            defaultChecked: n,
            ...o,
            tabIndex: -1,
            ref: i,
            style: {
                ...e.style,
                ...l,
                position: "absolute",
                pointerEvents: "none",
                opacity: 0,
                margin: 0,
            },
        })
    );
};
function hp(e) {
    return e ? "checked" : "unchecked";
}
var K0 = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
    ],
    xu = "RadioGroup",
    [Y0, sS] = Gn(xu, [sp, dp]),
    gp = sp(),
    yp = dp(),
    [X0, J0] = Y0(xu),
    vp = w.forwardRef((e, t) => {
        const {
                __scopeRadioGroup: n,
                name: r,
                defaultValue: o,
                value: i,
                required: s = !1,
                disabled: l = !1,
                orientation: u,
                dir: a,
                loop: m = !0,
                onValueChange: f,
                ...h
            } = e,
            g = gp(n),
            y = op(a),
            [S, x] = _i({ prop: i, defaultProp: o, onChange: f });
        return v.jsx(X0, {
            scope: n,
            name: r,
            required: s,
            disabled: l,
            value: S,
            onValueChange: x,
            children: v.jsx(F0, {
                asChild: !0,
                ...g,
                orientation: u,
                dir: y,
                loop: m,
                children: v.jsx(Ze.div, {
                    role: "radiogroup",
                    "aria-required": s,
                    "aria-orientation": u,
                    "data-disabled": l ? "" : void 0,
                    dir: y,
                    ...h,
                    ref: t,
                }),
            }),
        });
    });
vp.displayName = xu;
var Sp = "RadioGroupItem",
    wp = w.forwardRef((e, t) => {
        const { __scopeRadioGroup: n, disabled: r, ...o } = e,
            i = J0(Sp, n),
            s = i.disabled || r,
            l = gp(n),
            u = yp(n),
            a = w.useRef(null),
            m = Lt(t, a),
            f = i.value === o.value,
            h = w.useRef(!1);
        return (
            w.useEffect(() => {
                const g = (S) => {
                        K0.includes(S.key) && (h.current = !0);
                    },
                    y = () => (h.current = !1);
                return (
                    document.addEventListener("keydown", g),
                    document.addEventListener("keyup", y),
                    () => {
                        (document.removeEventListener("keydown", g),
                            document.removeEventListener("keyup", y));
                    }
                );
            }, []),
            v.jsx(U0, {
                asChild: !0,
                ...l,
                focusable: !s,
                active: f,
                children: v.jsx(fp, {
                    disabled: s,
                    required: i.required,
                    checked: f,
                    ...u,
                    ...o,
                    name: i.name,
                    ref: m,
                    onCheck: () => i.onValueChange(o.value),
                    onKeyDown: Le((g) => {
                        g.key === "Enter" && g.preventDefault();
                    }),
                    onFocus: Le(o.onFocus, () => {
                        var g;
                        h.current && ((g = a.current) == null || g.click());
                    }),
                }),
            })
        );
    });
wp.displayName = Sp;
var Z0 = "RadioGroupIndicator",
    _p = w.forwardRef((e, t) => {
        const { __scopeRadioGroup: n, ...r } = e,
            o = yp(n);
        return v.jsx(mp, { ...o, ...r, ref: t });
    });
_p.displayName = Z0;
var xp = vp,
    Ep = wp,
    q0 = _p;
const kp = w.forwardRef(({ className: e, ...t }, n) =>
    v.jsx(xp, { className: ct("grid gap-2", e), ...t, ref: n })
);
kp.displayName = xp.displayName;
const al = w.forwardRef(({ className: e, ...t }, n) =>
    v.jsx(Ep, {
        ref: n,
        className: ct(
            "aspect-square h-4 w-4 rounded-full border border-slate-200 border-slate-900 text-slate-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:border-slate-50 dark:text-slate-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
            e
        ),
        ...t,
        children: v.jsx(q0, {
            className: "flex items-center justify-center",
            children: v.jsx(qv, {
                className: "h-2.5 w-2.5 fill-current text-current",
            }),
        }),
    })
);
al.displayName = Ep.displayName;
var e1 = "Label",
    Cp = w.forwardRef((e, t) =>
        v.jsx(Ze.label, {
            ...e,
            ref: t,
            onMouseDown: (n) => {
                var o;
                n.target.closest("button, input, select, textarea") ||
                    ((o = e.onMouseDown) == null || o.call(e, n),
                    !n.defaultPrevented && n.detail > 1 && n.preventDefault());
            },
        })
    );
Cp.displayName = e1;
var Np = Cp;
const t1 = jf(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    ),
    ko = w.forwardRef(({ className: e, ...t }, n) =>
        v.jsx(Np, { ref: n, className: ct(t1(), e), ...t })
    );
ko.displayName = Np.displayName;
var Eu = "Checkbox",
    [n1, lS] = Gn(Eu),
    [r1, o1] = n1(Eu),
    Tp = w.forwardRef((e, t) => {
        const {
                __scopeCheckbox: n,
                name: r,
                checked: o,
                defaultChecked: i,
                required: s,
                disabled: l,
                value: u = "on",
                onCheckedChange: a,
                ...m
            } = e,
            [f, h] = w.useState(null),
            g = Lt(t, (p) => h(p)),
            y = w.useRef(!1),
            S = f ? !!f.closest("form") : !0,
            [x = !1, d] = _i({ prop: o, defaultProp: i, onChange: a }),
            c = w.useRef(x);
        return (
            w.useEffect(() => {
                const p = f == null ? void 0 : f.form;
                if (p) {
                    const _ = () => d(c.current);
                    return (
                        p.addEventListener("reset", _),
                        () => p.removeEventListener("reset", _)
                    );
                }
            }, [f, d]),
            v.jsxs(r1, {
                scope: n,
                state: x,
                disabled: l,
                children: [
                    v.jsx(Ze.button, {
                        type: "button",
                        role: "checkbox",
                        "aria-checked": Kt(x) ? "mixed" : x,
                        "aria-required": s,
                        "data-state": Ip(x),
                        "data-disabled": l ? "" : void 0,
                        disabled: l,
                        value: u,
                        ...m,
                        ref: g,
                        onKeyDown: Le(e.onKeyDown, (p) => {
                            p.key === "Enter" && p.preventDefault();
                        }),
                        onClick: Le(e.onClick, (p) => {
                            (d((_) => (Kt(_) ? !0 : !_)),
                                S &&
                                    ((y.current = p.isPropagationStopped()),
                                    y.current || p.stopPropagation()));
                        }),
                    }),
                    S &&
                        v.jsx(i1, {
                            control: f,
                            bubbles: !y.current,
                            name: r,
                            value: u,
                            checked: x,
                            required: s,
                            disabled: l,
                            style: { transform: "translateX(-100%)" },
                        }),
                ],
            })
        );
    });
Tp.displayName = Eu;
var Rp = "CheckboxIndicator",
    Pp = w.forwardRef((e, t) => {
        const { __scopeCheckbox: n, forceMount: r, ...o } = e,
            i = o1(Rp, n);
        return v.jsx(wu, {
            present: r || Kt(i.state) || i.state === !0,
            children: v.jsx(Ze.span, {
                "data-state": Ip(i.state),
                "data-disabled": i.disabled ? "" : void 0,
                ...o,
                ref: t,
                style: { pointerEvents: "none", ...e.style },
            }),
        });
    });
Pp.displayName = Rp;
var i1 = (e) => {
    const { control: t, checked: n, bubbles: r = !0, ...o } = e,
        i = w.useRef(null),
        s = yu(n),
        l = vu(t);
    return (
        w.useEffect(() => {
            const u = i.current,
                a = window.HTMLInputElement.prototype,
                f = Object.getOwnPropertyDescriptor(a, "checked").set;
            if (s !== n && f) {
                const h = new Event("click", { bubbles: r });
                ((u.indeterminate = Kt(n)),
                    f.call(u, Kt(n) ? !1 : n),
                    u.dispatchEvent(h));
            }
        }, [
            s,
            n,
            r,
        ]),
        v.jsx("input", {
            type: "checkbox",
            "aria-hidden": !0,
            defaultChecked: Kt(n) ? !1 : n,
            ...o,
            tabIndex: -1,
            ref: i,
            style: {
                ...e.style,
                ...l,
                position: "absolute",
                pointerEvents: "none",
                opacity: 0,
                margin: 0,
            },
        })
    );
};
function Kt(e) {
    return e === "indeterminate";
}
function Ip(e) {
    return Kt(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
var Ap = Tp,
    s1 = Pp;
const Op = w.forwardRef(({ className: e, ...t }, n) =>
    v.jsx(Ap, {
        ref: n,
        className: ct(
            "peer h-4 w-4 shrink-0 rounded-sm border border-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900",
            e
        ),
        ...t,
        children: v.jsx(s1, {
            className: ct("flex items-center justify-center text-current"),
            children: v.jsx(Zv, { className: "h-4 w-4" }),
        }),
    })
);
Op.displayName = Ap.displayName;
function Lp(e) {
    const { children: t } = e,
        [n, r] = S0("csvTimeFormat"),
        [o, i] = w.useState(!1),
        [s, l] = v0(!1),
        u = w.useRef(),
        a = new Date(),
        m = a.toISOString(),
        f = E0(a);
    function h() {
        return new Promise((d) => {
            ((u.current = (c, p) => {
                (p && r(c), i(!1), d(c));
            }),
                i(!0));
        });
    }
    function g(d) {
        (d.preventDefault(),
            u.current(d.target.elements.timeFormat.value, s),
            i(!1));
    }
    async function y() {
        return n && ["iso", "local"].includes(n) ? n : h();
    }
    const S = w.useMemo(() => ({ getTimeFormat: y }), [n, s]),
        x = v.jsx("h2", {
            className: "text-lg font-medium text-slate-700 mb-4",
            children: "Format for timestamps in CSV",
        });
    return v.jsxs(qf.Provider, {
        value: S,
        children: [
            t,
            o &&
                v.jsx(rp, {
                    show: o,
                    title: x,
                    className: "w-96 h-72 p-4",
                    children: v.jsxs("div", {
                        className: "flex flex-col h-full",
                        children: [
                            v.jsx("p", {
                                className: "mb-4 text-slate-700",
                                children:
                                    "Select a format for timestamps in the CSV file:",
                            }),
                            v.jsxs("form", {
                                onSubmit: g,
                                className: "flex flex-col items-start grow",
                                children: [
                                    v.jsxs(kp, {
                                        name: "timeFormat",
                                        required: !0,
                                        children: [
                                            v.jsxs("div", {
                                                className:
                                                    "flex items-start space-x-2 mb-2",
                                                children: [
                                                    v.jsx(al, {
                                                        value: "iso",
                                                        id: "r1",
                                                    }),
                                                    v.jsxs(ko, {
                                                        htmlFor: "r1",
                                                        children: [
                                                            v.jsx("div", {
                                                                children: `ISO format: ${m}`,
                                                            }),
                                                            v.jsx("div", {
                                                                className:
                                                                    "text-sm text-slate-500 mb-2",
                                                                children:
                                                                    "Avoid confusion with time zones",
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                            v.jsxs("div", {
                                                className:
                                                    "flex items-start space-x-2 mb-4",
                                                children: [
                                                    v.jsx(al, {
                                                        value: "local",
                                                        id: "r2",
                                                    }),
                                                    v.jsxs(ko, {
                                                        htmlFor: "r2",
                                                        children: [
                                                            v.jsx("div", {
                                                                children: `Localized format:  ${f}`,
                                                            }),
                                                            v.jsx("div", {
                                                                className:
                                                                    "text-sm text-slate-500",
                                                                children:
                                                                    "Works best when using spreadsheets",
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    v.jsxs("div", {
                                        className:
                                            "grow w-full flex flex-row content-end items-end justify-between",
                                        children: [
                                            v.jsxs("div", {
                                                className:
                                                    "flex items-center space-x-2",
                                                children: [
                                                    v.jsx(Op, {
                                                        id: "remember",
                                                        checked: s,
                                                        onCheckedChange: l,
                                                    }),
                                                    v.jsx(ko, {
                                                        htmlFor: "remember",
                                                        className:
                                                            "text-sm text-slate-500",
                                                        children:
                                                            "Remember my choice",
                                                    }),
                                                ],
                                            }),
                                            v.jsx(Vr, {
                                                type: "submit",
                                                children: "Submit",
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
        ],
    });
}
Lp.propTypes = { children: B.node };
// en(() => import('./sentry-CLraKjXM.js'), [], import.meta.url);
// Removed Sentry integration
const l1 = w.lazy(() =>
    en(
        () => import("./Results-H2VOSWW7.js"),
        __vite__mapDeps([
            11,
            1,
            10,
            5,
            3,
            6,
        ]),
        import.meta.url
    )
);
function u1() {
    return v.jsx(qy, {
        children: v.jsx(Lp, {
            children: v.jsxs("div", {
                className:
                    "p-3 text-slate-700 flex w-full flex-col min-h-screen gap-4",
                children: [
                    v.jsxs("header", {
                        className: "flex flex-row items-start",
                        children: [
                            v.jsx("img", {
                                alt: "logo",
                                src: fg,
                                className: "me-3",
                                width: "32",
                                height: "40",
                            }),
                            v.jsx("h1", {
                                className: "text-4xl grow",
                                children: "FIT File Viewer",
                            }),
                            v.jsx(Jf, { className: "text-end" }),
                        ],
                    }),
                    v.jsxs("main", {
                        className: "grow flex flex-col gap-4",
                        children: [
                            v.jsx("div", {
                                className: "flex items-start w-full",
                            }),
                            v.jsx(Kv, {}),
                            v.jsx(h0, {}),
                            v.jsx(w.Suspense, { children: v.jsx(l1, {}) }),
                        ],
                    }),
                    v.jsx(Wf, { className: "-mx-3" }),
                ],
            }),
        }),
    });
}
os.createRoot(document.getElementById("root")).render(v.jsx(u1, {}));

// Expose a global loader for Alt FIT Reader automation
if (typeof window !== "undefined") {
    window.loadFitFileFromArrayBuffer = function (arrayBuffer) {
        // Create a File object and call the main file loader
        const file = new File([arrayBuffer], "electron-fit-file.fit", {
            type: "application/octet-stream",
        });
        // The main file loader is 'g' in this bundle, which expects a File
        // Try to find the main React context or loader
        try {
            // Try to find the root React context provider
            // The loader is likely attached to a context or global
            if (
                window.ffvApp &&
                typeof window.ffvApp.loadFitFileFromArrayBuffer === "function"
            ) {
                window.ffvApp.loadFitFileFromArrayBuffer(arrayBuffer);
                return;
            }
            // Fallback: try to find a file input and trigger it
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
        } catch (err) {
            // Show a message if all else fails
            const root = document.getElementById("root");
            if (root) {
                root.innerHTML =
                    '<div style="color:red">Failed to auto-load FIT file: ' +
                    err +
                    "</div>";
            }
        }
    };
}
function a1() {
    "serviceWorker" in navigator &&
        navigator.serviceWorker.ready.then((e) => {
            e.unregister();
        });
}
a1();
export {
    z1 as $,
    fy as A,
    dy as B,
    ja as C,
    lu as D,
    hy as E,
    Ga as F,
    De as G,
    ay as H,
    Sy as I,
    uy as J,
    B1 as K,
    $1 as L,
    vi as M,
    on as N,
    Y1 as O,
    G1 as P,
    b1 as Q,
    fu as R,
    Qe as S,
    W1 as T,
    Q1 as U,
    J1 as V,
    $r as W,
    yi as X,
    cy as Y,
    Va as Z,
    el as _,
    au as a,
    pi as a$,
    K1 as a0,
    k1 as a1,
    Mg as a2,
    A1 as a3,
    g1 as a4,
    gi as a5,
    Z1 as a6,
    _y as a7,
    su as a8,
    iu as a9,
    Pg as aA,
    Rg as aB,
    y1 as aC,
    q1 as aD,
    S1 as aE,
    N1 as aF,
    eS as aG,
    tS as aH,
    D1 as aI,
    w1 as aJ,
    Ba as aK,
    wi as aL,
    Si as aM,
    m0 as aN,
    v as aO,
    w as aP,
    ct as aQ,
    jf as aR,
    B as aS,
    S0 as aT,
    ko as aU,
    Zy as aV,
    gu as aW,
    Lt as aX,
    Ze as aY,
    Le as aZ,
    rS as a_,
    mg as aa,
    yr as ab,
    E1 as ac,
    P1 as ad,
    v1 as ae,
    T1 as af,
    H1 as ag,
    Qg as ah,
    M1 as ai,
    j1 as aj,
    V1 as ak,
    wf as al,
    Ng as am,
    I1 as an,
    jg as ao,
    My as ap,
    p1 as aq,
    m1 as ar,
    h1 as as,
    hg as at,
    Dg as au,
    C1 as av,
    R1 as aw,
    _g as ax,
    _1 as ay,
    Yo as az,
    pg as b,
    Gn as b0,
    vu as b1,
    Xo as b2,
    wu as b3,
    sv as b4,
    T0 as b5,
    _i as b6,
    Vr as b7,
    np as b8,
    E0 as b9,
    sl as ba,
    f1 as bb,
    ns as bc,
    iS as bd,
    _n as be,
    nS as bf,
    Op as bg,
    gt as bh,
    d1 as bi,
    cl as bj,
    rp as bk,
    Xf as bl,
    en as bm,
    g0 as bn,
    dv as bo,
    kp as bp,
    al as bq,
    ec as br,
    kg as c,
    zn as d,
    O1 as e,
    x1 as f,
    Ag as g,
    Ye as h,
    mi as i,
    uu as j,
    X1 as k,
    Pn as l,
    Ef as m,
    Bt as n,
    Ma as o,
    Yg as p,
    xe as q,
    L1 as r,
    Mr as s,
    gr as t,
    pe as u,
    pu as v,
    wy as w,
    xy as x,
    U1 as y,
    F1 as z,
};
