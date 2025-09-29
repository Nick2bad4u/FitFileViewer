import {
	aL as tm,
	bn as rm,
	aP as L,
	bi as ci,
	bj as fe,
	bo as ne,
	bh as $,
	aS as z,
	aO as U,
	b9 as nm,
	aV as Oi,
	aU as vh,
	bl as yh,
	bp as im,
	bq as am,
	aM as mh,
	be as om,
	b7 as um,
	bk as cm,
} from './index-LvWRIhnC.js';
import { g as Zr } from './getMessagesForName-CXPND5Gu.js';
import {
	i as sm,
	n as gh,
	T as lm,
	p as fm,
	N as pm,
} from './isUnknown-BvXlyTdW.js';
import { u as hm } from './useMeasure-Df3vRnzU.js';
import { S as bh, O as xh, f as dm } from './findFields-C7eiFatx.js';
import { D as vm, a as ym } from './index-D4CCfpM1.js';
(function () {
	try {
		var e =
				typeof window < 'u'
					? window
					: typeof global < 'u'
					? global
					: typeof self < 'u'
					? self
					: {},
			t = new Error().stack;
		t &&
			((e._sentryDebugIds = e._sentryDebugIds || {}),
			(e._sentryDebugIds[t] = 'eaffc6f3-a3f3-4480-b417-afd8a5dcb81e'),
			(e._sentryDebugIdIdentifier =
				'sentry-dbid-eaffc6f3-a3f3-4480-b417-afd8a5dcb81e'));
	} catch { /* Ignore errors */ }
})();
/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const mm = tm('LineChart', [
	['path', { d: 'M3 3v18h18', key: '1s2lah' }],
	['path', { d: 'm19 9-5 5-4-4-3 3', key: '2osh9i' }],
]);
var Ss = function (e, t, r) {
	if (!rm) return [t, function () {}];
	var n = L.useState(function () {
			try {
				var o = sessionStorage.getItem(e);
				return typeof o != 'string'
					? (sessionStorage.setItem(e, r ? String(t) : JSON.stringify(t)), t)
					: r
					? o
					: JSON.parse(o || 'null');
			} catch {
				return t;
			}
		}),
		i = n[0],
		a = n[1];
	return (
		L.useEffect(function () {
			try {
				var o = r ? String(i) : JSON.stringify(i);
				sessionStorage.setItem(e, o);
			} catch { /* Ignore errors */ }
		}),
		[i, a]
	);
};
function zo(e, t) {
	return t ? e.rawFieldValue : Number(e.fieldValue);
}
function gm(e, t, r, n) {
	const { timestamp: i } = e,
		a = { timestamp: i, time: i.rawFieldValue - n, record: e };
	return (
		t.forEach((o) => {
			const { key: u } = o;
			if (!e[u]) return;
			const c = zo(e[u], r);
			!Number.isNaN(c) && !sm(c) && (a[u] = c);
		}),
		a
	);
}
var bm = Array.isArray,
	De = bm,
	xm = typeof ci == 'object' && ci && ci.Object === Object && ci,
	wh = xm,
	wm = wh,
	Om = typeof self == 'object' && self && self.Object === Object && self,
	Sm = wm || Om || Function('return this')(),
	lt = Sm,
	_m = lt,
	Am = _m.Symbol,
	Xn = Am,
	_s = Xn,
	Oh = Object.prototype,
	Pm = Oh.hasOwnProperty,
	$m = Oh.toString,
	Jr = _s ? _s.toStringTag : void 0;
function Tm(e) {
	var t = Pm.call(e, Jr),
		r = e[Jr];
	try {
		e[Jr] = void 0;
		var n = !0;
	} catch { /* Ignore errors */ }
	var i = $m.call(e);
	return n && (t ? (e[Jr] = r) : delete e[Jr]), i;
}
var Em = Tm,
	jm = Object.prototype,
	Mm = jm.toString;
function Cm(e) {
	return Mm.call(e);
}
var Im = Cm,
	As = Xn,
	Nm = Em,
	km = Im,
	Dm = '[object Null]',
	Lm = '[object Undefined]',
	Ps = As ? As.toStringTag : void 0;
function Bm(e) {
	return e == null
		? e === void 0
			? Lm
			: Dm
		: Ps && Ps in Object(e)
		? Nm(e)
		: km(e);
}
var wt = Bm;
function Rm(e) {
	return e != null && typeof e == 'object';
}
var Ot = Rm,
	Fm = wt,
	zm = Ot,
	Um = '[object Symbol]';
function Wm(e) {
	return typeof e == 'symbol' || (zm(e) && Fm(e) == Um);
}
var Br = Wm,
	qm = De,
	Gm = Br,
	Hm = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	Km = /^\w*$/;
function Vm(e, t) {
	if (qm(e)) return !1;
	var r = typeof e;
	return r == 'number' || r == 'symbol' || r == 'boolean' || e == null || Gm(e)
		? !0
		: Km.test(e) || !Hm.test(e) || (t != null && e in Object(t));
}
var dc = Vm;
function Xm(e) {
	var t = typeof e;
	return e != null && (t == 'object' || t == 'function');
}
var Ct = Xm;
const Rr = fe(Ct);
var Ym = wt,
	Zm = Ct,
	Jm = '[object AsyncFunction]',
	Qm = '[object Function]',
	eg = '[object GeneratorFunction]',
	tg = '[object Proxy]';
function rg(e) {
	if (!Zm(e)) return !1;
	var t = Ym(e);
	return t == Qm || t == eg || t == Jm || t == tg;
}
var vc = rg;
const J = fe(vc);
var ng = lt,
	ig = ng['__core-js_shared__'],
	ag = ig,
	po = ag,
	$s = (function () {
		var e = /[^.]+$/.exec((po && po.keys && po.keys.IE_PROTO) || '');
		return e ? 'Symbol(src)_1.' + e : '';
	})();
function og(e) {
	return !!$s && $s in e;
}
var ug = og,
	cg = Function.prototype,
	sg = cg.toString;
function lg(e) {
	if (e != null) {
		try {
			return sg.call(e);
		} catch { /* Ignore errors */ }
		try {
			return e + '';
		} catch { /* Ignore errors */ }
	}
	return '';
}
var Sh = lg,
	fg = vc,
	pg = ug,
	hg = Ct,
	dg = Sh,
	vg = /[\\^$.*+?()[\]{}|]/g,
	yg = /^\[object .+?Constructor\]$/,
	mg = Function.prototype,
	gg = Object.prototype,
	bg = mg.toString,
	xg = gg.hasOwnProperty,
	wg = RegExp(
		'^' +
			bg
				.call(xg)
				.replace(vg, '\\$&')
				.replace(
					/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
					'$1.*?',
				) +
			'$',
	);
function Og(e) {
	if (!hg(e) || pg(e)) return !1;
	var t = fg(e) ? wg : yg;
	return t.test(dg(e));
}
var Sg = Og;
function _g(e, t) {
	return e == null ? void 0 : e[t];
}
var Ag = _g,
	Pg = Sg,
	$g = Ag;
function Tg(e, t) {
	var r = $g(e, t);
	return Pg(r) ? r : void 0;
}
var er = Tg,
	Eg = er,
	jg = Eg(Object, 'create'),
	Oa = jg,
	Ts = Oa;
function Mg() {
	(this.__data__ = Ts ? Ts(null) : {}), (this.size = 0);
}
var Cg = Mg;
function Ig(e) {
	var t = this.has(e) && delete this.__data__[e];
	return (this.size -= t ? 1 : 0), t;
}
var Ng = Ig,
	kg = Oa,
	Dg = '__lodash_hash_undefined__',
	Lg = Object.prototype,
	Bg = Lg.hasOwnProperty;
function Rg(e) {
	var t = this.__data__;
	if (kg) {
		var r = t[e];
		return r === Dg ? void 0 : r;
	}
	return Bg.call(t, e) ? t[e] : void 0;
}
var Fg = Rg,
	zg = Oa,
	Ug = Object.prototype,
	Wg = Ug.hasOwnProperty;
function qg(e) {
	var t = this.__data__;
	return zg ? t[e] !== void 0 : Wg.call(t, e);
}
var Gg = qg,
	Hg = Oa,
	Kg = '__lodash_hash_undefined__';
function Vg(e, t) {
	var r = this.__data__;
	return (
		(this.size += this.has(e) ? 0 : 1),
		(r[e] = Hg && t === void 0 ? Kg : t),
		this
	);
}
var Xg = Vg,
	Yg = Cg,
	Zg = Ng,
	Jg = Fg,
	Qg = Gg,
	eb = Xg;
function Fr(e) {
	var t = -1,
		r = e == null ? 0 : e.length;
	for (this.clear(); ++t < r; ) {
		var n = e[t];
		this.set(n[0], n[1]);
	}
}
Fr.prototype.clear = Yg;
Fr.prototype.delete = Zg;
Fr.prototype.get = Jg;
Fr.prototype.has = Qg;
Fr.prototype.set = eb;
var tb = Fr;
function rb() {
	(this.__data__ = []), (this.size = 0);
}
var nb = rb;
function ib(e, t) {
	return e === t || (e !== e && t !== t);
}
var yc = ib,
	ab = yc;
function ob(e, t) {
	for (var r = e.length; r--; ) if (ab(e[r][0], t)) return r;
	return -1;
}
var Sa = ob,
	ub = Sa,
	cb = Array.prototype,
	sb = cb.splice;
function lb(e) {
	var t = this.__data__,
		r = ub(t, e);
	if (r < 0) return !1;
	var n = t.length - 1;
	return r == n ? t.pop() : sb.call(t, r, 1), --this.size, !0;
}
var fb = lb,
	pb = Sa;
function hb(e) {
	var t = this.__data__,
		r = pb(t, e);
	return r < 0 ? void 0 : t[r][1];
}
var db = hb,
	vb = Sa;
function yb(e) {
	return vb(this.__data__, e) > -1;
}
var mb = yb,
	gb = Sa;
function bb(e, t) {
	var r = this.__data__,
		n = gb(r, e);
	return n < 0 ? (++this.size, r.push([e, t])) : (r[n][1] = t), this;
}
var xb = bb,
	wb = nb,
	Ob = fb,
	Sb = db,
	_b = mb,
	Ab = xb;
function zr(e) {
	var t = -1,
		r = e == null ? 0 : e.length;
	for (this.clear(); ++t < r; ) {
		var n = e[t];
		this.set(n[0], n[1]);
	}
}
zr.prototype.clear = wb;
zr.prototype.delete = Ob;
zr.prototype.get = Sb;
zr.prototype.has = _b;
zr.prototype.set = Ab;
var _a = zr,
	Pb = er,
	$b = lt,
	Tb = Pb($b, 'Map'),
	mc = Tb,
	Es = tb,
	Eb = _a,
	jb = mc;
function Mb() {
	(this.size = 0),
		(this.__data__ = {
			hash: new Es(),
			map: new (jb || Eb)(),
			string: new Es(),
		});
}
var Cb = Mb;
function Ib(e) {
	var t = typeof e;
	return t == 'string' || t == 'number' || t == 'symbol' || t == 'boolean'
		? e !== '__proto__'
		: e === null;
}
var Nb = Ib,
	kb = Nb;
function Db(e, t) {
	var r = e.__data__;
	return kb(t) ? r[typeof t == 'string' ? 'string' : 'hash'] : r.map;
}
var Aa = Db,
	Lb = Aa;
function Bb(e) {
	var t = Lb(this, e).delete(e);
	return (this.size -= t ? 1 : 0), t;
}
var Rb = Bb,
	Fb = Aa;
function zb(e) {
	return Fb(this, e).get(e);
}
var Ub = zb,
	Wb = Aa;
function qb(e) {
	return Wb(this, e).has(e);
}
var Gb = qb,
	Hb = Aa;
function Kb(e, t) {
	var r = Hb(this, e),
		n = r.size;
	return r.set(e, t), (this.size += r.size == n ? 0 : 1), this;
}
var Vb = Kb,
	Xb = Cb,
	Yb = Rb,
	Zb = Ub,
	Jb = Gb,
	Qb = Vb;
function Ur(e) {
	var t = -1,
		r = e == null ? 0 : e.length;
	for (this.clear(); ++t < r; ) {
		var n = e[t];
		this.set(n[0], n[1]);
	}
}
Ur.prototype.clear = Xb;
Ur.prototype.delete = Yb;
Ur.prototype.get = Zb;
Ur.prototype.has = Jb;
Ur.prototype.set = Qb;
var gc = Ur,
	_h = gc,
	e0 = 'Expected a function';
function bc(e, t) {
	if (typeof e != 'function' || (t != null && typeof t != 'function'))
		throw new TypeError(e0);
	var r = function () {
		var n = arguments,
			i = t ? t.apply(this, n) : n[0],
			a = r.cache;
		if (a.has(i)) return a.get(i);
		var o = e.apply(this, n);
		return (r.cache = a.set(i, o) || a), o;
	};
	return (r.cache = new (bc.Cache || _h)()), r;
}
bc.Cache = _h;
var Ah = bc;
const t0 = fe(Ah);
var r0 = Ah,
	n0 = 500;
function i0(e) {
	var t = r0(e, function (n) {
			return r.size === n0 && r.clear(), n;
		}),
		r = t.cache;
	return t;
}
var a0 = i0,
	o0 = a0,
	u0 =
		/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
	c0 = /\\(\\)?/g,
	s0 = o0(function (e) {
		var t = [];
		return (
			e.charCodeAt(0) === 46 && t.push(''),
			e.replace(u0, function (r, n, i, a) {
				t.push(i ? a.replace(c0, '$1') : n || r);
			}),
			t
		);
	}),
	l0 = s0;
function f0(e, t) {
	for (var r = -1, n = e == null ? 0 : e.length, i = Array(n); ++r < n; )
		i[r] = t(e[r], r, e);
	return i;
}
var xc = f0,
	js = Xn,
	p0 = xc,
	h0 = De,
	d0 = Br,
	v0 = 1 / 0,
	Ms = js ? js.prototype : void 0,
	Cs = Ms ? Ms.toString : void 0;
function Ph(e) {
	if (typeof e == 'string') return e;
	if (h0(e)) return p0(e, Ph) + '';
	if (d0(e)) return Cs ? Cs.call(e) : '';
	var t = e + '';
	return t == '0' && 1 / e == -v0 ? '-0' : t;
}
var y0 = Ph,
	m0 = y0;
function g0(e) {
	return e == null ? '' : m0(e);
}
var $h = g0,
	b0 = De,
	x0 = dc,
	w0 = l0,
	O0 = $h;
function S0(e, t) {
	return b0(e) ? e : x0(e, t) ? [e] : w0(O0(e));
}
var Th = S0,
	_0 = Br,
	A0 = 1 / 0;
function P0(e) {
	if (typeof e == 'string' || _0(e)) return e;
	var t = e + '';
	return t == '0' && 1 / e == -A0 ? '-0' : t;
}
var Pa = P0,
	$0 = Th,
	T0 = Pa;
function E0(e, t) {
	t = $0(t, e);
	for (var r = 0, n = t.length; e != null && r < n; ) e = e[T0(t[r++])];
	return r && r == n ? e : void 0;
}
var wc = E0,
	j0 = wc;
function M0(e, t, r) {
	var n = e == null ? void 0 : j0(e, t);
	return n === void 0 ? r : n;
}
var Eh = M0;
const Ke = fe(Eh);
function C0(e) {
	return e == null;
}
var I0 = C0;
const Q = fe(I0);
var N0 = wt,
	k0 = De,
	D0 = Ot,
	L0 = '[object String]';
function B0(e) {
	return typeof e == 'string' || (!k0(e) && D0(e) && N0(e) == L0);
}
var R0 = B0;
const Yn = fe(R0);
var jh = { exports: {} },
	ie = {};
/**
 * @license React
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Oc = Symbol.for('react.element'),
	Sc = Symbol.for('react.portal'),
	$a = Symbol.for('react.fragment'),
	Ta = Symbol.for('react.strict_mode'),
	Ea = Symbol.for('react.profiler'),
	ja = Symbol.for('react.provider'),
	Ma = Symbol.for('react.context'),
	F0 = Symbol.for('react.server_context'),
	Ca = Symbol.for('react.forward_ref'),
	Ia = Symbol.for('react.suspense'),
	Na = Symbol.for('react.suspense_list'),
	ka = Symbol.for('react.memo'),
	Da = Symbol.for('react.lazy'),
	z0 = Symbol.for('react.offscreen'),
	Mh;
Mh = Symbol.for('react.module.reference');
function Ye(e) {
	if (typeof e == 'object' && e !== null) {
		var t = e.$$typeof;
		switch (t) {
			case Oc:
				switch (((e = e.type), e)) {
					case $a:
					case Ea:
					case Ta:
					case Ia:
					case Na:
						return e;
					default:
						switch (((e = e && e.$$typeof), e)) {
							case F0:
							case Ma:
							case Ca:
							case Da:
							case ka:
							case ja:
								return e;
							default:
								return t;
						}
				}
			case Sc:
				return t;
		}
	}
}
ie.ContextConsumer = Ma;
ie.ContextProvider = ja;
ie.Element = Oc;
ie.ForwardRef = Ca;
ie.Fragment = $a;
ie.Lazy = Da;
ie.Memo = ka;
ie.Portal = Sc;
ie.Profiler = Ea;
ie.StrictMode = Ta;
ie.Suspense = Ia;
ie.SuspenseList = Na;
ie.isAsyncMode = function () {
	return !1;
};
ie.isConcurrentMode = function () {
	return !1;
};
ie.isContextConsumer = function (e) {
	return Ye(e) === Ma;
};
ie.isContextProvider = function (e) {
	return Ye(e) === ja;
};
ie.isElement = function (e) {
	return typeof e == 'object' && e !== null && e.$$typeof === Oc;
};
ie.isForwardRef = function (e) {
	return Ye(e) === Ca;
};
ie.isFragment = function (e) {
	return Ye(e) === $a;
};
ie.isLazy = function (e) {
	return Ye(e) === Da;
};
ie.isMemo = function (e) {
	return Ye(e) === ka;
};
ie.isPortal = function (e) {
	return Ye(e) === Sc;
};
ie.isProfiler = function (e) {
	return Ye(e) === Ea;
};
ie.isStrictMode = function (e) {
	return Ye(e) === Ta;
};
ie.isSuspense = function (e) {
	return Ye(e) === Ia;
};
ie.isSuspenseList = function (e) {
	return Ye(e) === Na;
};
ie.isValidElementType = function (e) {
	return (
		typeof e == 'string' ||
		typeof e == 'function' ||
		e === $a ||
		e === Ea ||
		e === Ta ||
		e === Ia ||
		e === Na ||
		e === z0 ||
		(typeof e == 'object' &&
			e !== null &&
			(e.$$typeof === Da ||
				e.$$typeof === ka ||
				e.$$typeof === ja ||
				e.$$typeof === Ma ||
				e.$$typeof === Ca ||
				e.$$typeof === Mh ||
				e.getModuleId !== void 0))
	);
};
ie.typeOf = Ye;
jh.exports = ie;
var U0 = jh.exports,
	W0 = wt,
	q0 = Ot,
	G0 = '[object Number]';
function H0(e) {
	return typeof e == 'number' || (q0(e) && W0(e) == G0);
}
var Ch = H0;
const K0 = fe(Ch);
var V0 = Ch;
function X0(e) {
	return V0(e) && e != +e;
}
var Y0 = X0;
const Zn = fe(Y0);
var nt = function (t) {
		return t === 0 ? 0 : t > 0 ? 1 : -1;
	},
	Uo = function (t) {
		return Yn(t) && t.indexOf('%') === t.length - 1;
	},
	R = function (t) {
		return K0(t) && !Zn(t);
	},
	Oe = function (t) {
		return R(t) || Yn(t);
	},
	Z0 = 0,
	Jn = function (t) {
		var r = ++Z0;
		return ''.concat(t || '').concat(r);
	},
	Yt = function (t, r) {
		var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0,
			i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !1;
		if (!R(t) && !Yn(t)) return n;
		var a;
		if (Uo(t)) {
			var o = t.indexOf('%');
			a = (r * parseFloat(t.slice(0, o))) / 100;
		} else a = +t;
		return Zn(a) && (a = n), i && a > r && (a = r), a;
	},
	Pt = function (t) {
		if (!t) return null;
		var r = Object.keys(t);
		return r && r.length ? t[r[0]] : null;
	},
	J0 = function (t) {
		if (!Array.isArray(t)) return !1;
		for (var r = t.length, n = {}, i = 0; i < r; i++)
			if (!n[t[i]]) n[t[i]] = !0;
			else return !0;
		return !1;
	},
	tt = function (t, r) {
		return R(t) && R(r)
			? function (n) {
					return t + n * (r - t);
			  }
			: function () {
					return r;
			  };
	};
function Si(e, t, r) {
	return !e || !e.length
		? null
		: e.find(function (n) {
				return n && (typeof t == 'function' ? t(n) : Ke(n, t)) === r;
		  });
}
function pr(e, t) {
	for (var r in e)
		if (
			{}.hasOwnProperty.call(e, r) &&
			(!{}.hasOwnProperty.call(t, r) || e[r] !== t[r])
		)
			return !1;
	for (var n in t)
		if ({}.hasOwnProperty.call(t, n) && !{}.hasOwnProperty.call(e, n))
			return !1;
	return !0;
}
function Wo(e) {
	'@babel/helpers - typeof';
	return (
		(Wo =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Wo(e)
	);
}
var Q0 = ['viewBox', 'children'],
	ex = [
		'aria-activedescendant',
		'aria-atomic',
		'aria-autocomplete',
		'aria-busy',
		'aria-checked',
		'aria-colcount',
		'aria-colindex',
		'aria-colspan',
		'aria-controls',
		'aria-current',
		'aria-describedby',
		'aria-details',
		'aria-disabled',
		'aria-errormessage',
		'aria-expanded',
		'aria-flowto',
		'aria-haspopup',
		'aria-hidden',
		'aria-invalid',
		'aria-keyshortcuts',
		'aria-label',
		'aria-labelledby',
		'aria-level',
		'aria-live',
		'aria-modal',
		'aria-multiline',
		'aria-multiselectable',
		'aria-orientation',
		'aria-owns',
		'aria-placeholder',
		'aria-posinset',
		'aria-pressed',
		'aria-readonly',
		'aria-relevant',
		'aria-required',
		'aria-roledescription',
		'aria-rowcount',
		'aria-rowindex',
		'aria-rowspan',
		'aria-selected',
		'aria-setsize',
		'aria-sort',
		'aria-valuemax',
		'aria-valuemin',
		'aria-valuenow',
		'aria-valuetext',
		'className',
		'color',
		'height',
		'id',
		'lang',
		'max',
		'media',
		'method',
		'min',
		'name',
		'style',
		'target',
		'width',
		'role',
		'tabIndex',
		'accentHeight',
		'accumulate',
		'additive',
		'alignmentBaseline',
		'allowReorder',
		'alphabetic',
		'amplitude',
		'arabicForm',
		'ascent',
		'attributeName',
		'attributeType',
		'autoReverse',
		'azimuth',
		'baseFrequency',
		'baselineShift',
		'baseProfile',
		'bbox',
		'begin',
		'bias',
		'by',
		'calcMode',
		'capHeight',
		'clip',
		'clipPath',
		'clipPathUnits',
		'clipRule',
		'colorInterpolation',
		'colorInterpolationFilters',
		'colorProfile',
		'colorRendering',
		'contentScriptType',
		'contentStyleType',
		'cursor',
		'cx',
		'cy',
		'd',
		'decelerate',
		'descent',
		'diffuseConstant',
		'direction',
		'display',
		'divisor',
		'dominantBaseline',
		'dur',
		'dx',
		'dy',
		'edgeMode',
		'elevation',
		'enableBackground',
		'end',
		'exponent',
		'externalResourcesRequired',
		'fill',
		'fillOpacity',
		'fillRule',
		'filter',
		'filterRes',
		'filterUnits',
		'floodColor',
		'floodOpacity',
		'focusable',
		'fontFamily',
		'fontSize',
		'fontSizeAdjust',
		'fontStretch',
		'fontStyle',
		'fontVariant',
		'fontWeight',
		'format',
		'from',
		'fx',
		'fy',
		'g1',
		'g2',
		'glyphName',
		'glyphOrientationHorizontal',
		'glyphOrientationVertical',
		'glyphRef',
		'gradientTransform',
		'gradientUnits',
		'hanging',
		'horizAdvX',
		'horizOriginX',
		'href',
		'ideographic',
		'imageRendering',
		'in2',
		'in',
		'intercept',
		'k1',
		'k2',
		'k3',
		'k4',
		'k',
		'kernelMatrix',
		'kernelUnitLength',
		'kerning',
		'keyPoints',
		'keySplines',
		'keyTimes',
		'lengthAdjust',
		'letterSpacing',
		'lightingColor',
		'limitingConeAngle',
		'local',
		'markerEnd',
		'markerHeight',
		'markerMid',
		'markerStart',
		'markerUnits',
		'markerWidth',
		'mask',
		'maskContentUnits',
		'maskUnits',
		'mathematical',
		'mode',
		'numOctaves',
		'offset',
		'opacity',
		'operator',
		'order',
		'orient',
		'orientation',
		'origin',
		'overflow',
		'overlinePosition',
		'overlineThickness',
		'paintOrder',
		'panose1',
		'pathLength',
		'patternContentUnits',
		'patternTransform',
		'patternUnits',
		'pointerEvents',
		'pointsAtX',
		'pointsAtY',
		'pointsAtZ',
		'preserveAlpha',
		'preserveAspectRatio',
		'primitiveUnits',
		'r',
		'radius',
		'refX',
		'refY',
		'renderingIntent',
		'repeatCount',
		'repeatDur',
		'requiredExtensions',
		'requiredFeatures',
		'restart',
		'result',
		'rotate',
		'rx',
		'ry',
		'seed',
		'shapeRendering',
		'slope',
		'spacing',
		'specularConstant',
		'specularExponent',
		'speed',
		'spreadMethod',
		'startOffset',
		'stdDeviation',
		'stemh',
		'stemv',
		'stitchTiles',
		'stopColor',
		'stopOpacity',
		'strikethroughPosition',
		'strikethroughThickness',
		'string',
		'stroke',
		'strokeDasharray',
		'strokeDashoffset',
		'strokeLinecap',
		'strokeLinejoin',
		'strokeMiterlimit',
		'strokeOpacity',
		'strokeWidth',
		'surfaceScale',
		'systemLanguage',
		'tableValues',
		'targetX',
		'targetY',
		'textAnchor',
		'textDecoration',
		'textLength',
		'textRendering',
		'to',
		'transform',
		'u1',
		'u2',
		'underlinePosition',
		'underlineThickness',
		'unicode',
		'unicodeBidi',
		'unicodeRange',
		'unitsPerEm',
		'vAlphabetic',
		'values',
		'vectorEffect',
		'version',
		'vertAdvY',
		'vertOriginX',
		'vertOriginY',
		'vHanging',
		'vIdeographic',
		'viewTarget',
		'visibility',
		'vMathematical',
		'widths',
		'wordSpacing',
		'writingMode',
		'x1',
		'x2',
		'x',
		'xChannelSelector',
		'xHeight',
		'xlinkActuate',
		'xlinkArcrole',
		'xlinkHref',
		'xlinkRole',
		'xlinkShow',
		'xlinkTitle',
		'xlinkType',
		'xmlBase',
		'xmlLang',
		'xmlns',
		'xmlnsXlink',
		'xmlSpace',
		'y1',
		'y2',
		'y',
		'yChannelSelector',
		'z',
		'zoomAndPan',
		'ref',
		'key',
		'angle',
	],
	Is = ['points', 'pathLength'],
	ho = { svg: Q0, polygon: Is, polyline: Is },
	_c = [
		'dangerouslySetInnerHTML',
		'onCopy',
		'onCopyCapture',
		'onCut',
		'onCutCapture',
		'onPaste',
		'onPasteCapture',
		'onCompositionEnd',
		'onCompositionEndCapture',
		'onCompositionStart',
		'onCompositionStartCapture',
		'onCompositionUpdate',
		'onCompositionUpdateCapture',
		'onFocus',
		'onFocusCapture',
		'onBlur',
		'onBlurCapture',
		'onChange',
		'onChangeCapture',
		'onBeforeInput',
		'onBeforeInputCapture',
		'onInput',
		'onInputCapture',
		'onReset',
		'onResetCapture',
		'onSubmit',
		'onSubmitCapture',
		'onInvalid',
		'onInvalidCapture',
		'onLoad',
		'onLoadCapture',
		'onError',
		'onErrorCapture',
		'onKeyDown',
		'onKeyDownCapture',
		'onKeyPress',
		'onKeyPressCapture',
		'onKeyUp',
		'onKeyUpCapture',
		'onAbort',
		'onAbortCapture',
		'onCanPlay',
		'onCanPlayCapture',
		'onCanPlayThrough',
		'onCanPlayThroughCapture',
		'onDurationChange',
		'onDurationChangeCapture',
		'onEmptied',
		'onEmptiedCapture',
		'onEncrypted',
		'onEncryptedCapture',
		'onEnded',
		'onEndedCapture',
		'onLoadedData',
		'onLoadedDataCapture',
		'onLoadedMetadata',
		'onLoadedMetadataCapture',
		'onLoadStart',
		'onLoadStartCapture',
		'onPause',
		'onPauseCapture',
		'onPlay',
		'onPlayCapture',
		'onPlaying',
		'onPlayingCapture',
		'onProgress',
		'onProgressCapture',
		'onRateChange',
		'onRateChangeCapture',
		'onSeeked',
		'onSeekedCapture',
		'onSeeking',
		'onSeekingCapture',
		'onStalled',
		'onStalledCapture',
		'onSuspend',
		'onSuspendCapture',
		'onTimeUpdate',
		'onTimeUpdateCapture',
		'onVolumeChange',
		'onVolumeChangeCapture',
		'onWaiting',
		'onWaitingCapture',
		'onAuxClick',
		'onAuxClickCapture',
		'onClick',
		'onClickCapture',
		'onContextMenu',
		'onContextMenuCapture',
		'onDoubleClick',
		'onDoubleClickCapture',
		'onDrag',
		'onDragCapture',
		'onDragEnd',
		'onDragEndCapture',
		'onDragEnter',
		'onDragEnterCapture',
		'onDragExit',
		'onDragExitCapture',
		'onDragLeave',
		'onDragLeaveCapture',
		'onDragOver',
		'onDragOverCapture',
		'onDragStart',
		'onDragStartCapture',
		'onDrop',
		'onDropCapture',
		'onMouseDown',
		'onMouseDownCapture',
		'onMouseEnter',
		'onMouseLeave',
		'onMouseMove',
		'onMouseMoveCapture',
		'onMouseOut',
		'onMouseOutCapture',
		'onMouseOver',
		'onMouseOverCapture',
		'onMouseUp',
		'onMouseUpCapture',
		'onSelect',
		'onSelectCapture',
		'onTouchCancel',
		'onTouchCancelCapture',
		'onTouchEnd',
		'onTouchEndCapture',
		'onTouchMove',
		'onTouchMoveCapture',
		'onTouchStart',
		'onTouchStartCapture',
		'onPointerDown',
		'onPointerDownCapture',
		'onPointerMove',
		'onPointerMoveCapture',
		'onPointerUp',
		'onPointerUpCapture',
		'onPointerCancel',
		'onPointerCancelCapture',
		'onPointerEnter',
		'onPointerEnterCapture',
		'onPointerLeave',
		'onPointerLeaveCapture',
		'onPointerOver',
		'onPointerOverCapture',
		'onPointerOut',
		'onPointerOutCapture',
		'onGotPointerCapture',
		'onGotPointerCaptureCapture',
		'onLostPointerCapture',
		'onLostPointerCaptureCapture',
		'onScroll',
		'onScrollCapture',
		'onWheel',
		'onWheelCapture',
		'onAnimationStart',
		'onAnimationStartCapture',
		'onAnimationEnd',
		'onAnimationEndCapture',
		'onAnimationIteration',
		'onAnimationIterationCapture',
		'onTransitionEnd',
		'onTransitionEndCapture',
	],
	_i = function (t, r) {
		if (!t || typeof t == 'function' || typeof t == 'boolean') return null;
		var n = t;
		if ((L.isValidElement(t) && (n = t.props), !Rr(n))) return null;
		var i = {};
		return (
			Object.keys(n).forEach(function (a) {
				_c.includes(a) &&
					(i[a] =
						r ||
						function (o) {
							return n[a](n, o);
						});
			}),
			i
		);
	},
	tx = function (t, r, n) {
		return function (i) {
			return t(r, n, i), null;
		};
	},
	Ai = function (t, r, n) {
		if (!Rr(t) || Wo(t) !== 'object') return null;
		var i = null;
		return (
			Object.keys(t).forEach(function (a) {
				var o = t[a];
				_c.includes(a) &&
					typeof o == 'function' &&
					(i || (i = {}), (i[a] = tx(o, r, n)));
			}),
			i
		);
	},
	rx = ['children'],
	nx = ['children'];
function Ns(e, t) {
	if (e == null) return {};
	var r = ix(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function ix(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function qo(e) {
	'@babel/helpers - typeof';
	return (
		(qo =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		qo(e)
	);
}
var ks = {
		click: 'onClick',
		mousedown: 'onMouseDown',
		mouseup: 'onMouseUp',
		mouseover: 'onMouseOver',
		mousemove: 'onMouseMove',
		mouseout: 'onMouseOut',
		mouseenter: 'onMouseEnter',
		mouseleave: 'onMouseLeave',
		touchcancel: 'onTouchCancel',
		touchend: 'onTouchEnd',
		touchmove: 'onTouchMove',
		touchstart: 'onTouchStart',
		contextmenu: 'onContextMenu',
		dblclick: 'onDoubleClick',
	},
	Et = function (t) {
		return typeof t == 'string'
			? t
			: t
			? t.displayName || t.name || 'Component'
			: '';
	},
	Ds = null,
	vo = null,
	Ac = function e(t) {
		if (t === Ds && Array.isArray(vo)) return vo;
		var r = [];
		return (
			L.Children.forEach(t, function (n) {
				Q(n) ||
					(U0.isFragment(n) ? (r = r.concat(e(n.props.children))) : r.push(n));
			}),
			(vo = r),
			(Ds = t),
			r
		);
	};
function Ve(e, t) {
	var r = [],
		n = [];
	return (
		Array.isArray(t)
			? (n = t.map(function (i) {
					return Et(i);
			  }))
			: (n = [Et(t)]),
		Ac(e).forEach(function (i) {
			var a = Ke(i, 'type.displayName') || Ke(i, 'type.name');
			n.indexOf(a) !== -1 && r.push(i);
		}),
		r
	);
}
function Fe(e, t) {
	var r = Ve(e, t);
	return r && r[0];
}
var Ls = function (t) {
		if (!t || !t.props) return !1;
		var r = t.props,
			n = r.width,
			i = r.height;
		return !(!R(n) || n <= 0 || !R(i) || i <= 0);
	},
	ax = [
		'a',
		'altGlyph',
		'altGlyphDef',
		'altGlyphItem',
		'animate',
		'animateColor',
		'animateMotion',
		'animateTransform',
		'circle',
		'clipPath',
		'color-profile',
		'cursor',
		'defs',
		'desc',
		'ellipse',
		'feBlend',
		'feColormatrix',
		'feComponentTransfer',
		'feComposite',
		'feConvolveMatrix',
		'feDiffuseLighting',
		'feDisplacementMap',
		'feDistantLight',
		'feFlood',
		'feFuncA',
		'feFuncB',
		'feFuncG',
		'feFuncR',
		'feGaussianBlur',
		'feImage',
		'feMerge',
		'feMergeNode',
		'feMorphology',
		'feOffset',
		'fePointLight',
		'feSpecularLighting',
		'feSpotLight',
		'feTile',
		'feTurbulence',
		'filter',
		'font',
		'font-face',
		'font-face-format',
		'font-face-name',
		'font-face-url',
		'foreignObject',
		'g',
		'glyph',
		'glyphRef',
		'hkern',
		'image',
		'line',
		'lineGradient',
		'marker',
		'mask',
		'metadata',
		'missing-glyph',
		'mpath',
		'path',
		'pattern',
		'polygon',
		'polyline',
		'radialGradient',
		'rect',
		'script',
		'set',
		'stop',
		'style',
		'svg',
		'switch',
		'symbol',
		'text',
		'textPath',
		'title',
		'tref',
		'tspan',
		'use',
		'view',
		'vkern',
	],
	ox = function (t) {
		return t && t.type && Yn(t.type) && ax.indexOf(t.type) >= 0;
	},
	ux = function (t) {
		return t && qo(t) === 'object' && 'clipDot' in t;
	},
	cx = function (t, r, n, i) {
		var a,
			o = (a = ho == null ? void 0 : ho[i]) !== null && a !== void 0 ? a : [];
		return (
			(!J(t) && ((i && o.includes(r)) || ex.includes(r))) ||
			(n && _c.includes(r))
		);
	},
	ee = function (t, r, n) {
		if (!t || typeof t == 'function' || typeof t == 'boolean') return null;
		var i = t;
		if ((L.isValidElement(t) && (i = t.props), !Rr(i))) return null;
		var a = {};
		return (
			Object.keys(i).forEach(function (o) {
				var u;
				cx((u = i) === null || u === void 0 ? void 0 : u[o], o, r, n) &&
					(a[o] = i[o]);
			}),
			a
		);
	},
	Go = function e(t, r) {
		if (t === r) return !0;
		var n = L.Children.count(t);
		if (n !== L.Children.count(r)) return !1;
		if (n === 0) return !0;
		if (n === 1)
			return Bs(Array.isArray(t) ? t[0] : t, Array.isArray(r) ? r[0] : r);
		for (var i = 0; i < n; i++) {
			var a = t[i],
				o = r[i];
			if (Array.isArray(a) || Array.isArray(o)) {
				if (!e(a, o)) return !1;
			} else if (!Bs(a, o)) return !1;
		}
		return !0;
	},
	Bs = function (t, r) {
		if (Q(t) && Q(r)) return !0;
		if (!Q(t) && !Q(r)) {
			var n = t.props || {},
				i = n.children,
				a = Ns(n, rx),
				o = r.props || {},
				u = o.children,
				c = Ns(o, nx);
			return i && u ? pr(a, c) && Go(i, u) : !i && !u ? pr(a, c) : !1;
		}
		return !1;
	},
	Rs = function (t, r) {
		var n = [],
			i = {};
		return (
			Ac(t).forEach(function (a, o) {
				if (ox(a)) n.push(a);
				else if (a) {
					var u = Et(a.type),
						c = r[u] || {},
						s = c.handler,
						f = c.once;
					if (s && (!f || !i[u])) {
						var l = s(a, u, o);
						n.push(l), (i[u] = !0);
					}
				}
			}),
			n
		);
	},
	sx = function (t) {
		var r = t && t.type;
		return r && ks[r] ? ks[r] : null;
	},
	lx = function (t, r) {
		return Ac(r).indexOf(t);
	},
	fx = [
		'children',
		'width',
		'height',
		'viewBox',
		'className',
		'style',
		'title',
		'desc',
	];
function Ho() {
	return (
		(Ho = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Ho.apply(this, arguments)
	);
}
function px(e, t) {
	if (e == null) return {};
	var r = hx(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function hx(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function Ko(e) {
	var t = e.children,
		r = e.width,
		n = e.height,
		i = e.viewBox,
		a = e.className,
		o = e.style,
		u = e.title,
		c = e.desc,
		s = px(e, fx),
		f = i || { width: r, height: n, x: 0, y: 0 },
		l = ne('recharts-surface', a);
	return $.createElement(
		'svg',
		Ho({}, ee(s, !0, 'svg'), {
			className: l,
			width: r,
			height: n,
			style: o,
			viewBox: ''
				.concat(f.x, ' ')
				.concat(f.y, ' ')
				.concat(f.width, ' ')
				.concat(f.height),
		}),
		$.createElement('title', null, u),
		$.createElement('desc', null, c),
		t,
	);
}
var dx = ['children', 'className'];
function Vo() {
	return (
		(Vo = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Vo.apply(this, arguments)
	);
}
function vx(e, t) {
	if (e == null) return {};
	var r = yx(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function yx(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
var ve = $.forwardRef(function (e, t) {
		var r = e.children,
			n = e.className,
			i = vx(e, dx),
			a = ne('recharts-layer', n);
		return $.createElement('g', Vo({ className: a }, ee(i, !0), { ref: t }), r);
	}),
	vr = function (t, r) {
		for (
			var n = arguments.length, i = new Array(n > 2 ? n - 2 : 0), a = 2;
			a < n;
			a++
		)
			i[a - 2] = arguments[a];
	};
function mx(e, t, r) {
	var n = -1,
		i = e.length;
	t < 0 && (t = -t > i ? 0 : i + t),
		(r = r > i ? i : r),
		r < 0 && (r += i),
		(i = t > r ? 0 : (r - t) >>> 0),
		(t >>>= 0);
	for (var a = Array(i); ++n < i; ) a[n] = e[n + t];
	return a;
}
var gx = mx,
	bx = gx;
function xx(e, t, r) {
	var n = e.length;
	return (r = r === void 0 ? n : r), !t && r >= n ? e : bx(e, t, r);
}
var wx = xx,
	Ox = '\\ud800-\\udfff',
	Sx = '\\u0300-\\u036f',
	_x = '\\ufe20-\\ufe2f',
	Ax = '\\u20d0-\\u20ff',
	Px = Sx + _x + Ax,
	$x = '\\ufe0e\\ufe0f',
	Tx = '\\u200d',
	Ex = RegExp('[' + Tx + Ox + Px + $x + ']');
function jx(e) {
	return Ex.test(e);
}
var Ih = jx;
function Mx(e) {
	return e.split('');
}
var Cx = Mx,
	Nh = '\\ud800-\\udfff',
	Ix = '\\u0300-\\u036f',
	Nx = '\\ufe20-\\ufe2f',
	kx = '\\u20d0-\\u20ff',
	Dx = Ix + Nx + kx,
	Lx = '\\ufe0e\\ufe0f',
	Bx = '[' + Nh + ']',
	Xo = '[' + Dx + ']',
	Yo = '\\ud83c[\\udffb-\\udfff]',
	Rx = '(?:' + Xo + '|' + Yo + ')',
	kh = '[^' + Nh + ']',
	Dh = '(?:\\ud83c[\\udde6-\\uddff]){2}',
	Lh = '[\\ud800-\\udbff][\\udc00-\\udfff]',
	Fx = '\\u200d',
	Bh = Rx + '?',
	Rh = '[' + Lx + ']?',
	zx = '(?:' + Fx + '(?:' + [kh, Dh, Lh].join('|') + ')' + Rh + Bh + ')*',
	Ux = Rh + Bh + zx,
	Wx = '(?:' + [kh + Xo + '?', Xo, Dh, Lh, Bx].join('|') + ')',
	qx = RegExp(Yo + '(?=' + Yo + ')|' + Wx + Ux, 'g');
function Gx(e) {
	return e.match(qx) || [];
}
var Hx = Gx,
	Kx = Cx,
	Vx = Ih,
	Xx = Hx;
function Yx(e) {
	return Vx(e) ? Xx(e) : Kx(e);
}
var Zx = Yx,
	Jx = wx,
	Qx = Ih,
	ew = Zx,
	tw = $h;
function rw(e) {
	return function (t) {
		t = tw(t);
		var r = Qx(t) ? ew(t) : void 0,
			n = r ? r[0] : t.charAt(0),
			i = r ? Jx(r, 1).join('') : t.slice(1);
		return n[e]() + i;
	};
}
var nw = rw,
	iw = nw,
	aw = iw('toUpperCase'),
	ow = aw;
const La = fe(ow);
function ue(e) {
	return function () {
		return e;
	};
}
const Fh = Math.cos,
	Pi = Math.sin,
	it = Math.sqrt,
	$i = Math.PI,
	Ba = 2 * $i,
	Zo = Math.PI,
	Jo = 2 * Zo,
	zt = 1e-6,
	uw = Jo - zt;
function zh(e) {
	this._ += e[0];
	for (let t = 1, r = e.length; t < r; ++t) this._ += arguments[t] + e[t];
}
function cw(e) {
	let t = Math.floor(e);
	if (!(t >= 0)) throw new Error(`invalid digits: ${e}`);
	if (t > 15) return zh;
	const r = 10 ** t;
	return function (n) {
		this._ += n[0];
		for (let i = 1, a = n.length; i < a; ++i)
			this._ += Math.round(arguments[i] * r) / r + n[i];
	};
}
class sw {
	constructor(t) {
		(this._x0 = this._y0 = this._x1 = this._y1 = null),
			(this._ = ''),
			(this._append = t == null ? zh : cw(t));
	}
	moveTo(t, r) {
		this._append`M${(this._x0 = this._x1 = +t)},${(this._y0 = this._y1 = +r)}`;
	}
	closePath() {
		this._x1 !== null &&
			((this._x1 = this._x0), (this._y1 = this._y0), this._append`Z`);
	}
	lineTo(t, r) {
		this._append`L${(this._x1 = +t)},${(this._y1 = +r)}`;
	}
	quadraticCurveTo(t, r, n, i) {
		this._append`Q${+t},${+r},${(this._x1 = +n)},${(this._y1 = +i)}`;
	}
	bezierCurveTo(t, r, n, i, a, o) {
		this._append`C${+t},${+r},${+n},${+i},${(this._x1 = +a)},${(this._y1 =
			+o)}`;
	}
	arcTo(t, r, n, i, a) {
		if (((t = +t), (r = +r), (n = +n), (i = +i), (a = +a), a < 0))
			throw new Error(`negative radius: ${a}`);
		let o = this._x1,
			u = this._y1,
			c = n - t,
			s = i - r,
			f = o - t,
			l = u - r,
			p = f * f + l * l;
		if (this._x1 === null) this._append`M${(this._x1 = t)},${(this._y1 = r)}`;
		else if (p > zt)
			if (!(Math.abs(l * c - s * f) > zt) || !a)
				this._append`L${(this._x1 = t)},${(this._y1 = r)}`;
			else {
				let h = n - o,
					d = i - u,
					v = c * c + s * s,
					y = h * h + d * d,
					b = Math.sqrt(v),
					w = Math.sqrt(p),
					x = a * Math.tan((Zo - Math.acos((v + p - y) / (2 * b * w))) / 2),
					S = x / w,
					m = x / b;
				Math.abs(S - 1) > zt && this._append`L${t + S * f},${r + S * l}`,
					this._append`A${a},${a},0,0,${+(l * h > f * d)},${(this._x1 =
						t + m * c)},${(this._y1 = r + m * s)}`;
			}
	}
	arc(t, r, n, i, a, o) {
		if (((t = +t), (r = +r), (n = +n), (o = !!o), n < 0))
			throw new Error(`negative radius: ${n}`);
		let u = n * Math.cos(i),
			c = n * Math.sin(i),
			s = t + u,
			f = r + c,
			l = 1 ^ o,
			p = o ? i - a : a - i;
		this._x1 === null
			? this._append`M${s},${f}`
			: (Math.abs(this._x1 - s) > zt || Math.abs(this._y1 - f) > zt) &&
			  this._append`L${s},${f}`,
			n &&
				(p < 0 && (p = (p % Jo) + Jo),
				p > uw
					? this._append`A${n},${n},0,1,${l},${t - u},${
							r - c
					  }A${n},${n},0,1,${l},${(this._x1 = s)},${(this._y1 = f)}`
					: p > zt &&
					  this._append`A${n},${n},0,${+(p >= Zo)},${l},${(this._x1 =
							t + n * Math.cos(a))},${(this._y1 = r + n * Math.sin(a))}`);
	}
	rect(t, r, n, i) {
		this._append`M${(this._x0 = this._x1 = +t)},${(this._y0 = this._y1 =
			+r)}h${(n = +n)}v${+i}h${-n}Z`;
	}
	toString() {
		return this._;
	}
}
function Pc(e) {
	let t = 3;
	return (
		(e.digits = function (r) {
			if (!arguments.length) return t;
			if (r == null) t = null;
			else {
				const n = Math.floor(r);
				if (!(n >= 0)) throw new RangeError(`invalid digits: ${r}`);
				t = n;
			}
			return e;
		}),
		() => new sw(t)
	);
}
function $c(e) {
	return typeof e == 'object' && 'length' in e ? e : Array.from(e);
}
function Uh(e) {
	this._context = e;
}
Uh.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		this._point = 0;
	},
	lineEnd: function () {
		(this._line || (this._line !== 0 && this._point === 1)) &&
			this._context.closePath(),
			(this._line = 1 - this._line);
	},
	point: function (e, t) {
		switch (((e = +e), (t = +t), this._point)) {
			case 0:
				(this._point = 1),
					this._line ? this._context.lineTo(e, t) : this._context.moveTo(e, t);
				break;
			case 1:
				this._point = 2;
			default:
				this._context.lineTo(e, t);
				break;
		}
	},
};
function Ra(e) {
	return new Uh(e);
}
function Wh(e) {
	return e[0];
}
function qh(e) {
	return e[1];
}
function Gh(e, t) {
	var r = ue(!0),
		n = null,
		i = Ra,
		a = null,
		o = Pc(u);
	(e = typeof e == 'function' ? e : e === void 0 ? Wh : ue(e)),
		(t = typeof t == 'function' ? t : t === void 0 ? qh : ue(t));
	function u(c) {
		var s,
			f = (c = $c(c)).length,
			l,
			p = !1,
			h;
		for (n == null && (a = i((h = o()))), s = 0; s <= f; ++s)
			!(s < f && r((l = c[s]), s, c)) === p &&
				((p = !p) ? a.lineStart() : a.lineEnd()),
				p && a.point(+e(l, s, c), +t(l, s, c));
		if (h) return (a = null), h + '' || null;
	}
	return (
		(u.x = function (c) {
			return arguments.length
				? ((e = typeof c == 'function' ? c : ue(+c)), u)
				: e;
		}),
		(u.y = function (c) {
			return arguments.length
				? ((t = typeof c == 'function' ? c : ue(+c)), u)
				: t;
		}),
		(u.defined = function (c) {
			return arguments.length
				? ((r = typeof c == 'function' ? c : ue(!!c)), u)
				: r;
		}),
		(u.curve = function (c) {
			return arguments.length ? ((i = c), n != null && (a = i(n)), u) : i;
		}),
		(u.context = function (c) {
			return arguments.length
				? (c == null ? (n = a = null) : (a = i((n = c))), u)
				: n;
		}),
		u
	);
}
function si(e, t, r) {
	var n = null,
		i = ue(!0),
		a = null,
		o = Ra,
		u = null,
		c = Pc(s);
	(e = typeof e == 'function' ? e : e === void 0 ? Wh : ue(+e)),
		(t = typeof t == 'function' ? t : ue(t === void 0 ? 0 : +t)),
		(r = typeof r == 'function' ? r : r === void 0 ? qh : ue(+r));
	function s(l) {
		var p,
			h,
			d,
			v = (l = $c(l)).length,
			y,
			b = !1,
			w,
			x = new Array(v),
			S = new Array(v);
		for (a == null && (u = o((w = c()))), p = 0; p <= v; ++p) {
			if (!(p < v && i((y = l[p]), p, l)) === b)
				if ((b = !b)) (h = p), u.areaStart(), u.lineStart();
				else {
					for (u.lineEnd(), u.lineStart(), d = p - 1; d >= h; --d)
						u.point(x[d], S[d]);
					u.lineEnd(), u.areaEnd();
				}
			b &&
				((x[p] = +e(y, p, l)),
				(S[p] = +t(y, p, l)),
				u.point(n ? +n(y, p, l) : x[p], r ? +r(y, p, l) : S[p]));
		}
		if (w) return (u = null), w + '' || null;
	}
	function f() {
		return Gh().defined(i).curve(o).context(a);
	}
	return (
		(s.x = function (l) {
			return arguments.length
				? ((e = typeof l == 'function' ? l : ue(+l)), (n = null), s)
				: e;
		}),
		(s.x0 = function (l) {
			return arguments.length
				? ((e = typeof l == 'function' ? l : ue(+l)), s)
				: e;
		}),
		(s.x1 = function (l) {
			return arguments.length
				? ((n = l == null ? null : typeof l == 'function' ? l : ue(+l)), s)
				: n;
		}),
		(s.y = function (l) {
			return arguments.length
				? ((t = typeof l == 'function' ? l : ue(+l)), (r = null), s)
				: t;
		}),
		(s.y0 = function (l) {
			return arguments.length
				? ((t = typeof l == 'function' ? l : ue(+l)), s)
				: t;
		}),
		(s.y1 = function (l) {
			return arguments.length
				? ((r = l == null ? null : typeof l == 'function' ? l : ue(+l)), s)
				: r;
		}),
		(s.lineX0 = s.lineY0 =
			function () {
				return f().x(e).y(t);
			}),
		(s.lineY1 = function () {
			return f().x(e).y(r);
		}),
		(s.lineX1 = function () {
			return f().x(n).y(t);
		}),
		(s.defined = function (l) {
			return arguments.length
				? ((i = typeof l == 'function' ? l : ue(!!l)), s)
				: i;
		}),
		(s.curve = function (l) {
			return arguments.length ? ((o = l), a != null && (u = o(a)), s) : o;
		}),
		(s.context = function (l) {
			return arguments.length
				? (l == null ? (a = u = null) : (u = o((a = l))), s)
				: a;
		}),
		s
	);
}
class Hh {
	constructor(t, r) {
		(this._context = t), (this._x = r);
	}
	areaStart() {
		this._line = 0;
	}
	areaEnd() {
		this._line = NaN;
	}
	lineStart() {
		this._point = 0;
	}
	lineEnd() {
		(this._line || (this._line !== 0 && this._point === 1)) &&
			this._context.closePath(),
			(this._line = 1 - this._line);
	}
	point(t, r) {
		switch (((t = +t), (r = +r), this._point)) {
			case 0: {
				(this._point = 1),
					this._line ? this._context.lineTo(t, r) : this._context.moveTo(t, r);
				break;
			}
			case 1:
				this._point = 2;
			default: {
				this._x
					? this._context.bezierCurveTo(
							(this._x0 = (this._x0 + t) / 2),
							this._y0,
							this._x0,
							r,
							t,
							r,
					  )
					: this._context.bezierCurveTo(
							this._x0,
							(this._y0 = (this._y0 + r) / 2),
							t,
							this._y0,
							t,
							r,
					  );
				break;
			}
		}
		(this._x0 = t), (this._y0 = r);
	}
}
function lw(e) {
	return new Hh(e, !0);
}
function fw(e) {
	return new Hh(e, !1);
}
const Tc = {
		draw(e, t) {
			const r = it(t / $i);
			e.moveTo(r, 0), e.arc(0, 0, r, 0, Ba);
		},
	},
	pw = {
		draw(e, t) {
			const r = it(t / 5) / 2;
			e.moveTo(-3 * r, -r),
				e.lineTo(-r, -r),
				e.lineTo(-r, -3 * r),
				e.lineTo(r, -3 * r),
				e.lineTo(r, -r),
				e.lineTo(3 * r, -r),
				e.lineTo(3 * r, r),
				e.lineTo(r, r),
				e.lineTo(r, 3 * r),
				e.lineTo(-r, 3 * r),
				e.lineTo(-r, r),
				e.lineTo(-3 * r, r),
				e.closePath();
		},
	},
	Kh = it(1 / 3),
	hw = Kh * 2,
	dw = {
		draw(e, t) {
			const r = it(t / hw),
				n = r * Kh;
			e.moveTo(0, -r),
				e.lineTo(n, 0),
				e.lineTo(0, r),
				e.lineTo(-n, 0),
				e.closePath();
		},
	},
	vw = {
		draw(e, t) {
			const r = it(t),
				n = -r / 2;
			e.rect(n, n, r, r);
		},
	},
	yw = 0.8908130915292852,
	Vh = Pi($i / 10) / Pi((7 * $i) / 10),
	mw = Pi(Ba / 10) * Vh,
	gw = -Fh(Ba / 10) * Vh,
	bw = {
		draw(e, t) {
			const r = it(t * yw),
				n = mw * r,
				i = gw * r;
			e.moveTo(0, -r), e.lineTo(n, i);
			for (let a = 1; a < 5; ++a) {
				const o = (Ba * a) / 5,
					u = Fh(o),
					c = Pi(o);
				e.lineTo(c * r, -u * r), e.lineTo(u * n - c * i, c * n + u * i);
			}
			e.closePath();
		},
	},
	yo = it(3),
	xw = {
		draw(e, t) {
			const r = -it(t / (yo * 3));
			e.moveTo(0, r * 2),
				e.lineTo(-yo * r, -r),
				e.lineTo(yo * r, -r),
				e.closePath();
		},
	},
	We = -0.5,
	qe = it(3) / 2,
	Qo = 1 / it(12),
	ww = (Qo / 2 + 1) * 3,
	Ow = {
		draw(e, t) {
			const r = it(t / ww),
				n = r / 2,
				i = r * Qo,
				a = n,
				o = r * Qo + r,
				u = -a,
				c = o;
			e.moveTo(n, i),
				e.lineTo(a, o),
				e.lineTo(u, c),
				e.lineTo(We * n - qe * i, qe * n + We * i),
				e.lineTo(We * a - qe * o, qe * a + We * o),
				e.lineTo(We * u - qe * c, qe * u + We * c),
				e.lineTo(We * n + qe * i, We * i - qe * n),
				e.lineTo(We * a + qe * o, We * o - qe * a),
				e.lineTo(We * u + qe * c, We * c - qe * u),
				e.closePath();
		},
	};
function Sw(e, t) {
	let r = null,
		n = Pc(i);
	(e = typeof e == 'function' ? e : ue(e || Tc)),
		(t = typeof t == 'function' ? t : ue(t === void 0 ? 64 : +t));
	function i() {
		let a;
		if (
			(r || (r = a = n()),
			e.apply(this, arguments).draw(r, +t.apply(this, arguments)),
			a)
		)
			return (r = null), a + '' || null;
	}
	return (
		(i.type = function (a) {
			return arguments.length
				? ((e = typeof a == 'function' ? a : ue(a)), i)
				: e;
		}),
		(i.size = function (a) {
			return arguments.length
				? ((t = typeof a == 'function' ? a : ue(+a)), i)
				: t;
		}),
		(i.context = function (a) {
			return arguments.length ? ((r = a ?? null), i) : r;
		}),
		i
	);
}
function Ti() {}
function Ei(e, t, r) {
	e._context.bezierCurveTo(
		(2 * e._x0 + e._x1) / 3,
		(2 * e._y0 + e._y1) / 3,
		(e._x0 + 2 * e._x1) / 3,
		(e._y0 + 2 * e._y1) / 3,
		(e._x0 + 4 * e._x1 + t) / 6,
		(e._y0 + 4 * e._y1 + r) / 6,
	);
}
function Xh(e) {
	this._context = e;
}
Xh.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		(this._x0 = this._x1 = this._y0 = this._y1 = NaN), (this._point = 0);
	},
	lineEnd: function () {
		switch (this._point) {
			case 3:
				Ei(this, this._x1, this._y1);
			case 2:
				this._context.lineTo(this._x1, this._y1);
				break;
		}
		(this._line || (this._line !== 0 && this._point === 1)) &&
			this._context.closePath(),
			(this._line = 1 - this._line);
	},
	point: function (e, t) {
		switch (((e = +e), (t = +t), this._point)) {
			case 0:
				(this._point = 1),
					this._line ? this._context.lineTo(e, t) : this._context.moveTo(e, t);
				break;
			case 1:
				this._point = 2;
				break;
			case 2:
				(this._point = 3),
					this._context.lineTo(
						(5 * this._x0 + this._x1) / 6,
						(5 * this._y0 + this._y1) / 6,
					);
			default:
				Ei(this, e, t);
				break;
		}
		(this._x0 = this._x1),
			(this._x1 = e),
			(this._y0 = this._y1),
			(this._y1 = t);
	},
};
function _w(e) {
	return new Xh(e);
}
function Yh(e) {
	this._context = e;
}
Yh.prototype = {
	areaStart: Ti,
	areaEnd: Ti,
	lineStart: function () {
		(this._x0 =
			this._x1 =
			this._x2 =
			this._x3 =
			this._x4 =
			this._y0 =
			this._y1 =
			this._y2 =
			this._y3 =
			this._y4 =
				NaN),
			(this._point = 0);
	},
	lineEnd: function () {
		switch (this._point) {
			case 1: {
				this._context.moveTo(this._x2, this._y2), this._context.closePath();
				break;
			}
			case 2: {
				this._context.moveTo(
					(this._x2 + 2 * this._x3) / 3,
					(this._y2 + 2 * this._y3) / 3,
				),
					this._context.lineTo(
						(this._x3 + 2 * this._x2) / 3,
						(this._y3 + 2 * this._y2) / 3,
					),
					this._context.closePath();
				break;
			}
			case 3: {
				this.point(this._x2, this._y2),
					this.point(this._x3, this._y3),
					this.point(this._x4, this._y4);
				break;
			}
		}
	},
	point: function (e, t) {
		switch (((e = +e), (t = +t), this._point)) {
			case 0:
				(this._point = 1), (this._x2 = e), (this._y2 = t);
				break;
			case 1:
				(this._point = 2), (this._x3 = e), (this._y3 = t);
				break;
			case 2:
				(this._point = 3),
					(this._x4 = e),
					(this._y4 = t),
					this._context.moveTo(
						(this._x0 + 4 * this._x1 + e) / 6,
						(this._y0 + 4 * this._y1 + t) / 6,
					);
				break;
			default:
				Ei(this, e, t);
				break;
		}
		(this._x0 = this._x1),
			(this._x1 = e),
			(this._y0 = this._y1),
			(this._y1 = t);
	},
};
function Aw(e) {
	return new Yh(e);
}
function Zh(e) {
	this._context = e;
}
Zh.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		(this._x0 = this._x1 = this._y0 = this._y1 = NaN), (this._point = 0);
	},
	lineEnd: function () {
		(this._line || (this._line !== 0 && this._point === 3)) &&
			this._context.closePath(),
			(this._line = 1 - this._line);
	},
	point: function (e, t) {
		switch (((e = +e), (t = +t), this._point)) {
			case 0:
				this._point = 1;
				break;
			case 1:
				this._point = 2;
				break;
			case 2:
				this._point = 3;
				var r = (this._x0 + 4 * this._x1 + e) / 6,
					n = (this._y0 + 4 * this._y1 + t) / 6;
				this._line ? this._context.lineTo(r, n) : this._context.moveTo(r, n);
				break;
			case 3:
				this._point = 4;
			default:
				Ei(this, e, t);
				break;
		}
		(this._x0 = this._x1),
			(this._x1 = e),
			(this._y0 = this._y1),
			(this._y1 = t);
	},
};
function Pw(e) {
	return new Zh(e);
}
function Jh(e) {
	this._context = e;
}
Jh.prototype = {
	areaStart: Ti,
	areaEnd: Ti,
	lineStart: function () {
		this._point = 0;
	},
	lineEnd: function () {
		this._point && this._context.closePath();
	},
	point: function (e, t) {
		(e = +e),
			(t = +t),
			this._point
				? this._context.lineTo(e, t)
				: ((this._point = 1), this._context.moveTo(e, t));
	},
};
function $w(e) {
	return new Jh(e);
}
function Fs(e) {
	return e < 0 ? -1 : 1;
}
function zs(e, t, r) {
	var n = e._x1 - e._x0,
		i = t - e._x1,
		a = (e._y1 - e._y0) / (n || (i < 0 && -0)),
		o = (r - e._y1) / (i || (n < 0 && -0)),
		u = (a * i + o * n) / (n + i);
	return (
		(Fs(a) + Fs(o)) * Math.min(Math.abs(a), Math.abs(o), 0.5 * Math.abs(u)) || 0
	);
}
function Us(e, t) {
	var r = e._x1 - e._x0;
	return r ? ((3 * (e._y1 - e._y0)) / r - t) / 2 : t;
}
function mo(e, t, r) {
	var n = e._x0,
		i = e._y0,
		a = e._x1,
		o = e._y1,
		u = (a - n) / 3;
	e._context.bezierCurveTo(n + u, i + u * t, a - u, o - u * r, a, o);
}
function ji(e) {
	this._context = e;
}
ji.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		(this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN),
			(this._point = 0);
	},
	lineEnd: function () {
		switch (this._point) {
			case 2:
				this._context.lineTo(this._x1, this._y1);
				break;
			case 3:
				mo(this, this._t0, Us(this, this._t0));
				break;
		}
		(this._line || (this._line !== 0 && this._point === 1)) &&
			this._context.closePath(),
			(this._line = 1 - this._line);
	},
	point: function (e, t) {
		var r = NaN;
		if (((e = +e), (t = +t), !(e === this._x1 && t === this._y1))) {
			switch (this._point) {
				case 0:
					(this._point = 1),
						this._line
							? this._context.lineTo(e, t)
							: this._context.moveTo(e, t);
					break;
				case 1:
					this._point = 2;
					break;
				case 2:
					(this._point = 3), mo(this, Us(this, (r = zs(this, e, t))), r);
					break;
				default:
					mo(this, this._t0, (r = zs(this, e, t)));
					break;
			}
			(this._x0 = this._x1),
				(this._x1 = e),
				(this._y0 = this._y1),
				(this._y1 = t),
				(this._t0 = r);
		}
	},
};
function Qh(e) {
	this._context = new ed(e);
}
(Qh.prototype = Object.create(ji.prototype)).point = function (e, t) {
	ji.prototype.point.call(this, t, e);
};
function ed(e) {
	this._context = e;
}
ed.prototype = {
	moveTo: function (e, t) {
		this._context.moveTo(t, e);
	},
	closePath: function () {
		this._context.closePath();
	},
	lineTo: function (e, t) {
		this._context.lineTo(t, e);
	},
	bezierCurveTo: function (e, t, r, n, i, a) {
		this._context.bezierCurveTo(t, e, n, r, a, i);
	},
};
function Tw(e) {
	return new ji(e);
}
function Ew(e) {
	return new Qh(e);
}
function td(e) {
	this._context = e;
}
td.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		(this._x = []), (this._y = []);
	},
	lineEnd: function () {
		var e = this._x,
			t = this._y,
			r = e.length;
		if (r)
			if (
				(this._line
					? this._context.lineTo(e[0], t[0])
					: this._context.moveTo(e[0], t[0]),
				r === 2)
			)
				this._context.lineTo(e[1], t[1]);
			else
				for (var n = Ws(e), i = Ws(t), a = 0, o = 1; o < r; ++a, ++o)
					this._context.bezierCurveTo(
						n[0][a],
						i[0][a],
						n[1][a],
						i[1][a],
						e[o],
						t[o],
					);
		(this._line || (this._line !== 0 && r === 1)) && this._context.closePath(),
			(this._line = 1 - this._line),
			(this._x = this._y = null);
	},
	point: function (e, t) {
		this._x.push(+e), this._y.push(+t);
	},
};
function Ws(e) {
	var t,
		r = e.length - 1,
		n,
		i = new Array(r),
		a = new Array(r),
		o = new Array(r);
	for (i[0] = 0, a[0] = 2, o[0] = e[0] + 2 * e[1], t = 1; t < r - 1; ++t)
		(i[t] = 1), (a[t] = 4), (o[t] = 4 * e[t] + 2 * e[t + 1]);
	for (
		i[r - 1] = 2, a[r - 1] = 7, o[r - 1] = 8 * e[r - 1] + e[r], t = 1;
		t < r;
		++t
	)
		(n = i[t] / a[t - 1]), (a[t] -= n), (o[t] -= n * o[t - 1]);
	for (i[r - 1] = o[r - 1] / a[r - 1], t = r - 2; t >= 0; --t)
		i[t] = (o[t] - i[t + 1]) / a[t];
	for (a[r - 1] = (e[r] + i[r - 1]) / 2, t = 0; t < r - 1; ++t)
		a[t] = 2 * e[t + 1] - i[t + 1];
	return [i, a];
}
function jw(e) {
	return new td(e);
}
function Fa(e, t) {
	(this._context = e), (this._t = t);
}
Fa.prototype = {
	areaStart: function () {
		this._line = 0;
	},
	areaEnd: function () {
		this._line = NaN;
	},
	lineStart: function () {
		(this._x = this._y = NaN), (this._point = 0);
	},
	lineEnd: function () {
		0 < this._t &&
			this._t < 1 &&
			this._point === 2 &&
			this._context.lineTo(this._x, this._y),
			(this._line || (this._line !== 0 && this._point === 1)) &&
				this._context.closePath(),
			this._line >= 0 &&
				((this._t = 1 - this._t), (this._line = 1 - this._line));
	},
	point: function (e, t) {
		switch (((e = +e), (t = +t), this._point)) {
			case 0:
				(this._point = 1),
					this._line ? this._context.lineTo(e, t) : this._context.moveTo(e, t);
				break;
			case 1:
				this._point = 2;
			default: {
				if (this._t <= 0)
					this._context.lineTo(this._x, t), this._context.lineTo(e, t);
				else {
					var r = this._x * (1 - this._t) + e * this._t;
					this._context.lineTo(r, this._y), this._context.lineTo(r, t);
				}
				break;
			}
		}
		(this._x = e), (this._y = t);
	},
};
function Mw(e) {
	return new Fa(e, 0.5);
}
function Cw(e) {
	return new Fa(e, 0);
}
function Iw(e) {
	return new Fa(e, 1);
}
function yr(e, t) {
	if ((o = e.length) > 1)
		for (var r = 1, n, i, a = e[t[0]], o, u = a.length; r < o; ++r)
			for (i = a, a = e[t[r]], n = 0; n < u; ++n)
				a[n][1] += a[n][0] = isNaN(i[n][1]) ? i[n][0] : i[n][1];
}
function eu(e) {
	for (var t = e.length, r = new Array(t); --t >= 0; ) r[t] = t;
	return r;
}
function Nw(e, t) {
	return e[t];
}
function kw(e) {
	const t = [];
	return (t.key = e), t;
}
function Dw() {
	var e = ue([]),
		t = eu,
		r = yr,
		n = Nw;
	function i(a) {
		var o = Array.from(e.apply(this, arguments), kw),
			u,
			c = o.length,
			s = -1,
			f;
		for (const l of a)
			for (u = 0, ++s; u < c; ++u)
				(o[u][s] = [0, +n(l, o[u].key, s, a)]).data = l;
		for (u = 0, f = $c(t(o)); u < c; ++u) o[f[u]].index = u;
		return r(o, f), o;
	}
	return (
		(i.keys = function (a) {
			return arguments.length
				? ((e = typeof a == 'function' ? a : ue(Array.from(a))), i)
				: e;
		}),
		(i.value = function (a) {
			return arguments.length
				? ((n = typeof a == 'function' ? a : ue(+a)), i)
				: n;
		}),
		(i.order = function (a) {
			return arguments.length
				? ((t =
						a == null ? eu : typeof a == 'function' ? a : ue(Array.from(a))),
				  i)
				: t;
		}),
		(i.offset = function (a) {
			return arguments.length ? ((r = a ?? yr), i) : r;
		}),
		i
	);
}
function Lw(e, t) {
	if ((n = e.length) > 0) {
		for (var r, n, i = 0, a = e[0].length, o; i < a; ++i) {
			for (o = r = 0; r < n; ++r) o += e[r][i][1] || 0;
			if (o) for (r = 0; r < n; ++r) e[r][i][1] /= o;
		}
		yr(e, t);
	}
}
function Bw(e, t) {
	if ((i = e.length) > 0) {
		for (var r = 0, n = e[t[0]], i, a = n.length; r < a; ++r) {
			for (var o = 0, u = 0; o < i; ++o) u += e[o][r][1] || 0;
			n[r][1] += n[r][0] = -u / 2;
		}
		yr(e, t);
	}
}
function Rw(e, t) {
	if (!(!((o = e.length) > 0) || !((a = (i = e[t[0]]).length) > 0))) {
		for (var r = 0, n = 1, i, a, o; n < a; ++n) {
			for (var u = 0, c = 0, s = 0; u < o; ++u) {
				for (
					var f = e[t[u]],
						l = f[n][1] || 0,
						p = f[n - 1][1] || 0,
						h = (l - p) / 2,
						d = 0;
					d < u;
					++d
				) {
					var v = e[t[d]],
						y = v[n][1] || 0,
						b = v[n - 1][1] || 0;
					h += y - b;
				}
				(c += l), (s += h * l);
			}
			(i[n - 1][1] += i[n - 1][0] = r), c && (r -= s / c);
		}
		(i[n - 1][1] += i[n - 1][0] = r), yr(e, t);
	}
}
function vn(e) {
	'@babel/helpers - typeof';
	return (
		(vn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		vn(e)
	);
}
var Fw = ['type', 'size', 'sizeType'];
function tu() {
	return (
		(tu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		tu.apply(this, arguments)
	);
}
function qs(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Gs(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? qs(Object(r), !0).forEach(function (n) {
					zw(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: qs(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function zw(e, t, r) {
	return (
		(t = Uw(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Uw(e) {
	var t = Ww(e, 'string');
	return vn(t) == 'symbol' ? t : t + '';
}
function Ww(e, t) {
	if (vn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (vn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function qw(e, t) {
	if (e == null) return {};
	var r = Gw(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function Gw(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
var rd = {
		symbolCircle: Tc,
		symbolCross: pw,
		symbolDiamond: dw,
		symbolSquare: vw,
		symbolStar: bw,
		symbolTriangle: xw,
		symbolWye: Ow,
	},
	Hw = Math.PI / 180,
	Kw = function (t) {
		var r = 'symbol'.concat(La(t));
		return rd[r] || Tc;
	},
	Vw = function (t, r, n) {
		if (r === 'area') return t;
		switch (n) {
			case 'cross':
				return (5 * t * t) / 9;
			case 'diamond':
				return (0.5 * t * t) / Math.sqrt(3);
			case 'square':
				return t * t;
			case 'star': {
				var i = 18 * Hw;
				return (
					1.25 *
					t *
					t *
					(Math.tan(i) - Math.tan(i * 2) * Math.pow(Math.tan(i), 2))
				);
			}
			case 'triangle':
				return (Math.sqrt(3) * t * t) / 4;
			case 'wye':
				return ((21 - 10 * Math.sqrt(3)) * t * t) / 8;
			default:
				return (Math.PI * t * t) / 4;
		}
	},
	Xw = function (t, r) {
		rd['symbol'.concat(La(t))] = r;
	},
	Ec = function (t) {
		var r = t.type,
			n = r === void 0 ? 'circle' : r,
			i = t.size,
			a = i === void 0 ? 64 : i,
			o = t.sizeType,
			u = o === void 0 ? 'area' : o,
			c = qw(t, Fw),
			s = Gs(Gs({}, c), {}, { type: n, size: a, sizeType: u }),
			f = function () {
				var y = Kw(n),
					b = Sw().type(y).size(Vw(a, u, n));
				return b();
			},
			l = s.className,
			p = s.cx,
			h = s.cy,
			d = ee(s, !0);
		return p === +p && h === +h && a === +a
			? $.createElement(
					'path',
					tu({}, d, {
						className: ne('recharts-symbols', l),
						transform: 'translate('.concat(p, ', ').concat(h, ')'),
						d: f(),
					}),
			  )
			: null;
	};
Ec.registerSymbol = Xw;
function mr(e) {
	'@babel/helpers - typeof';
	return (
		(mr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		mr(e)
	);
}
function ru() {
	return (
		(ru = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		ru.apply(this, arguments)
	);
}
function Hs(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Yw(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Hs(Object(r), !0).forEach(function (n) {
					yn(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Hs(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function Zw(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function Jw(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, id(n.key), n);
	}
}
function Qw(e, t, r) {
	return (
		t && Jw(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function e1(e, t, r) {
	return (
		(t = Mi(t)),
		t1(
			e,
			nd() ? Reflect.construct(t, r || [], Mi(e).constructor) : t.apply(e, r),
		)
	);
}
function t1(e, t) {
	if (t && (mr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return r1(e);
}
function r1(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function nd() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (nd = function () {
		return !!e;
	})();
}
function Mi(e) {
	return (
		(Mi = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		Mi(e)
	);
}
function n1(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && nu(e, t);
}
function nu(e, t) {
	return (
		(nu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		nu(e, t)
	);
}
function yn(e, t, r) {
	return (
		(t = id(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function id(e) {
	var t = i1(e, 'string');
	return mr(t) == 'symbol' ? t : t + '';
}
function i1(e, t) {
	if (mr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (mr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Ge = 32,
	jc = (function (e) {
		function t() {
			return Zw(this, t), e1(this, t, arguments);
		}
		return (
			n1(t, e),
			Qw(t, [
				{
					key: 'renderIcon',
					value: function (n) {
						var i = this.props.inactiveColor,
							a = Ge / 2,
							o = Ge / 6,
							u = Ge / 3,
							c = n.inactive ? i : n.color;
						if (n.type === 'plainline')
							return $.createElement('line', {
								strokeWidth: 4,
								fill: 'none',
								stroke: c,
								strokeDasharray: n.payload.strokeDasharray,
								x1: 0,
								y1: a,
								x2: Ge,
								y2: a,
								className: 'recharts-legend-icon',
							});
						if (n.type === 'line')
							return $.createElement('path', {
								strokeWidth: 4,
								fill: 'none',
								stroke: c,
								d: 'M0,'
									.concat(a, 'h')
									.concat(
										u,
										`
            A`,
									)
									.concat(o, ',')
									.concat(o, ',0,1,1,')
									.concat(2 * u, ',')
									.concat(
										a,
										`
            H`,
									)
									.concat(Ge, 'M')
									.concat(2 * u, ',')
									.concat(
										a,
										`
            A`,
									)
									.concat(o, ',')
									.concat(o, ',0,1,1,')
									.concat(u, ',')
									.concat(a),
								className: 'recharts-legend-icon',
							});
						if (n.type === 'rect')
							return $.createElement('path', {
								stroke: 'none',
								fill: c,
								d: 'M0,'
									.concat(Ge / 8, 'h')
									.concat(Ge, 'v')
									.concat((Ge * 3) / 4, 'h')
									.concat(-Ge, 'z'),
								className: 'recharts-legend-icon',
							});
						if ($.isValidElement(n.legendIcon)) {
							var s = Yw({}, n);
							return delete s.legendIcon, $.cloneElement(n.legendIcon, s);
						}
						return $.createElement(Ec, {
							fill: c,
							cx: a,
							cy: a,
							size: Ge,
							sizeType: 'diameter',
							type: n.type,
						});
					},
				},
				{
					key: 'renderItems',
					value: function () {
						var n = this,
							i = this.props,
							a = i.payload,
							o = i.iconSize,
							u = i.layout,
							c = i.formatter,
							s = i.inactiveColor,
							f = { x: 0, y: 0, width: Ge, height: Ge },
							l = {
								display: u === 'horizontal' ? 'inline-block' : 'block',
								marginRight: 10,
							},
							p = {
								display: 'inline-block',
								verticalAlign: 'middle',
								marginRight: 4,
							};
						return a.map(function (h, d) {
							var v = h.formatter || c,
								y = ne(
									yn(
										yn(
											{ 'recharts-legend-item': !0 },
											'legend-item-'.concat(d),
											!0,
										),
										'inactive',
										h.inactive,
									),
								);
							if (h.type === 'none') return null;
							var b = J(h.value) ? null : h.value;
							vr(
								!J(h.value),
								`The name property is also required when using a function for the dataKey of a chart's cartesian components. Ex: <Bar name="Name of my Data"/>`,
							);
							var w = h.inactive ? s : h.color;
							return $.createElement(
								'li',
								ru(
									{ className: y, style: l, key: 'legend-item-'.concat(d) },
									Ai(n.props, h, d),
								),
								$.createElement(
									Ko,
									{ width: o, height: o, viewBox: f, style: p },
									n.renderIcon(h),
								),
								$.createElement(
									'span',
									{
										className: 'recharts-legend-item-text',
										style: { color: w },
									},
									v ? v(b, h, d) : b,
								),
							);
						});
					},
				},
				{
					key: 'render',
					value: function () {
						var n = this.props,
							i = n.payload,
							a = n.layout,
							o = n.align;
						if (!i || !i.length) return null;
						var u = {
							padding: 0,
							margin: 0,
							textAlign: a === 'horizontal' ? o : 'left',
						};
						return $.createElement(
							'ul',
							{ className: 'recharts-default-legend', style: u },
							this.renderItems(),
						);
					},
				},
			])
		);
	})(L.PureComponent);
yn(jc, 'displayName', 'Legend');
yn(jc, 'defaultProps', {
	iconSize: 14,
	layout: 'horizontal',
	align: 'center',
	verticalAlign: 'middle',
	inactiveColor: '#ccc',
});
var a1 = _a;
function o1() {
	(this.__data__ = new a1()), (this.size = 0);
}
var u1 = o1;
function c1(e) {
	var t = this.__data__,
		r = t.delete(e);
	return (this.size = t.size), r;
}
var s1 = c1;
function l1(e) {
	return this.__data__.get(e);
}
var f1 = l1;
function p1(e) {
	return this.__data__.has(e);
}
var h1 = p1,
	d1 = _a,
	v1 = mc,
	y1 = gc,
	m1 = 200;
function g1(e, t) {
	var r = this.__data__;
	if (r instanceof d1) {
		var n = r.__data__;
		if (!v1 || n.length < m1 - 1)
			return n.push([e, t]), (this.size = ++r.size), this;
		r = this.__data__ = new y1(n);
	}
	return r.set(e, t), (this.size = r.size), this;
}
var b1 = g1,
	x1 = _a,
	w1 = u1,
	O1 = s1,
	S1 = f1,
	_1 = h1,
	A1 = b1;
function Wr(e) {
	var t = (this.__data__ = new x1(e));
	this.size = t.size;
}
Wr.prototype.clear = w1;
Wr.prototype.delete = O1;
Wr.prototype.get = S1;
Wr.prototype.has = _1;
Wr.prototype.set = A1;
var ad = Wr,
	P1 = '__lodash_hash_undefined__';
function $1(e) {
	return this.__data__.set(e, P1), this;
}
var T1 = $1;
function E1(e) {
	return this.__data__.has(e);
}
var j1 = E1,
	M1 = gc,
	C1 = T1,
	I1 = j1;
function Ci(e) {
	var t = -1,
		r = e == null ? 0 : e.length;
	for (this.__data__ = new M1(); ++t < r; ) this.add(e[t]);
}
Ci.prototype.add = Ci.prototype.push = C1;
Ci.prototype.has = I1;
var od = Ci;
function N1(e, t) {
	for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
		if (t(e[r], r, e)) return !0;
	return !1;
}
var ud = N1;
function k1(e, t) {
	return e.has(t);
}
var cd = k1,
	D1 = od,
	L1 = ud,
	B1 = cd,
	R1 = 1,
	F1 = 2;
function z1(e, t, r, n, i, a) {
	var o = r & R1,
		u = e.length,
		c = t.length;
	if (u != c && !(o && c > u)) return !1;
	var s = a.get(e),
		f = a.get(t);
	if (s && f) return s == t && f == e;
	var l = -1,
		p = !0,
		h = r & F1 ? new D1() : void 0;
	for (a.set(e, t), a.set(t, e); ++l < u; ) {
		var d = e[l],
			v = t[l];
		if (n) var y = o ? n(v, d, l, t, e, a) : n(d, v, l, e, t, a);
		if (y !== void 0) {
			if (y) continue;
			p = !1;
			break;
		}
		if (h) {
			if (
				!L1(t, function (b, w) {
					if (!B1(h, w) && (d === b || i(d, b, r, n, a))) return h.push(w);
				})
			) {
				p = !1;
				break;
			}
		} else if (!(d === v || i(d, v, r, n, a))) {
			p = !1;
			break;
		}
	}
	return a.delete(e), a.delete(t), p;
}
var sd = z1,
	U1 = lt,
	W1 = U1.Uint8Array,
	q1 = W1;
function G1(e) {
	var t = -1,
		r = Array(e.size);
	return (
		e.forEach(function (n, i) {
			r[++t] = [i, n];
		}),
		r
	);
}
var H1 = G1;
function K1(e) {
	var t = -1,
		r = Array(e.size);
	return (
		e.forEach(function (n) {
			r[++t] = n;
		}),
		r
	);
}
var Mc = K1,
	Ks = Xn,
	Vs = q1,
	V1 = yc,
	X1 = sd,
	Y1 = H1,
	Z1 = Mc,
	J1 = 1,
	Q1 = 2,
	eO = '[object Boolean]',
	tO = '[object Date]',
	rO = '[object Error]',
	nO = '[object Map]',
	iO = '[object Number]',
	aO = '[object RegExp]',
	oO = '[object Set]',
	uO = '[object String]',
	cO = '[object Symbol]',
	sO = '[object ArrayBuffer]',
	lO = '[object DataView]',
	Xs = Ks ? Ks.prototype : void 0,
	go = Xs ? Xs.valueOf : void 0;
function fO(e, t, r, n, i, a, o) {
	switch (r) {
		case lO:
			if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
				return !1;
			(e = e.buffer), (t = t.buffer);
		case sO:
			return !(e.byteLength != t.byteLength || !a(new Vs(e), new Vs(t)));
		case eO:
		case tO:
		case iO:
			return V1(+e, +t);
		case rO:
			return e.name == t.name && e.message == t.message;
		case aO:
		case uO:
			return e == t + '';
		case nO:
			var u = Y1;
		case oO:
			var c = n & J1;
			if ((u || (u = Z1), e.size != t.size && !c)) return !1;
			var s = o.get(e);
			if (s) return s == t;
			(n |= Q1), o.set(e, t);
			var f = X1(u(e), u(t), n, i, a, o);
			return o.delete(e), f;
		case cO:
			if (go) return go.call(e) == go.call(t);
	}
	return !1;
}
var pO = fO;
function hO(e, t) {
	for (var r = -1, n = t.length, i = e.length; ++r < n; ) e[i + r] = t[r];
	return e;
}
var ld = hO,
	dO = ld,
	vO = De;
function yO(e, t, r) {
	var n = t(e);
	return vO(e) ? n : dO(n, r(e));
}
var mO = yO;
function gO(e, t) {
	for (var r = -1, n = e == null ? 0 : e.length, i = 0, a = []; ++r < n; ) {
		var o = e[r];
		t(o, r, e) && (a[i++] = o);
	}
	return a;
}
var bO = gO;
function xO() {
	return [];
}
var wO = xO,
	OO = bO,
	SO = wO,
	_O = Object.prototype,
	AO = _O.propertyIsEnumerable,
	Ys = Object.getOwnPropertySymbols,
	PO = Ys
		? function (e) {
				return e == null
					? []
					: ((e = Object(e)),
					  OO(Ys(e), function (t) {
							return AO.call(e, t);
					  }));
		  }
		: SO,
	$O = PO;
function TO(e, t) {
	for (var r = -1, n = Array(e); ++r < e; ) n[r] = t(r);
	return n;
}
var EO = TO,
	jO = wt,
	MO = Ot,
	CO = '[object Arguments]';
function IO(e) {
	return MO(e) && jO(e) == CO;
}
var NO = IO,
	Zs = NO,
	kO = Ot,
	fd = Object.prototype,
	DO = fd.hasOwnProperty,
	LO = fd.propertyIsEnumerable,
	BO = Zs(
		(function () {
			return arguments;
		})(),
	)
		? Zs
		: function (e) {
				return kO(e) && DO.call(e, 'callee') && !LO.call(e, 'callee');
		  },
	Cc = BO,
	Ii = { exports: {} };
function RO() {
	return !1;
}
var FO = RO;
Ii.exports;
(function (e, t) {
	var r = lt,
		n = FO,
		i = t && !t.nodeType && t,
		a = i && !0 && e && !e.nodeType && e,
		o = a && a.exports === i,
		u = o ? r.Buffer : void 0,
		c = u ? u.isBuffer : void 0,
		s = c || n;
	e.exports = s;
})(Ii, Ii.exports);
var pd = Ii.exports,
	zO = 9007199254740991,
	UO = /^(?:0|[1-9]\d*)$/;
function WO(e, t) {
	var r = typeof e;
	return (
		(t = t ?? zO),
		!!t &&
			(r == 'number' || (r != 'symbol' && UO.test(e))) &&
			e > -1 &&
			e % 1 == 0 &&
			e < t
	);
}
var Ic = WO,
	qO = 9007199254740991;
function GO(e) {
	return typeof e == 'number' && e > -1 && e % 1 == 0 && e <= qO;
}
var Nc = GO,
	HO = wt,
	KO = Nc,
	VO = Ot,
	XO = '[object Arguments]',
	YO = '[object Array]',
	ZO = '[object Boolean]',
	JO = '[object Date]',
	QO = '[object Error]',
	eS = '[object Function]',
	tS = '[object Map]',
	rS = '[object Number]',
	nS = '[object Object]',
	iS = '[object RegExp]',
	aS = '[object Set]',
	oS = '[object String]',
	uS = '[object WeakMap]',
	cS = '[object ArrayBuffer]',
	sS = '[object DataView]',
	lS = '[object Float32Array]',
	fS = '[object Float64Array]',
	pS = '[object Int8Array]',
	hS = '[object Int16Array]',
	dS = '[object Int32Array]',
	vS = '[object Uint8Array]',
	yS = '[object Uint8ClampedArray]',
	mS = '[object Uint16Array]',
	gS = '[object Uint32Array]',
	se = {};
se[lS] =
	se[fS] =
	se[pS] =
	se[hS] =
	se[dS] =
	se[vS] =
	se[yS] =
	se[mS] =
	se[gS] =
		!0;
se[XO] =
	se[YO] =
	se[cS] =
	se[ZO] =
	se[sS] =
	se[JO] =
	se[QO] =
	se[eS] =
	se[tS] =
	se[rS] =
	se[nS] =
	se[iS] =
	se[aS] =
	se[oS] =
	se[uS] =
		!1;
function bS(e) {
	return VO(e) && KO(e.length) && !!se[HO(e)];
}
var xS = bS;
function wS(e) {
	return function (t) {
		return e(t);
	};
}
var hd = wS,
	Ni = { exports: {} };
Ni.exports;
(function (e, t) {
	var r = wh,
		n = t && !t.nodeType && t,
		i = n && !0 && e && !e.nodeType && e,
		a = i && i.exports === n,
		o = a && r.process,
		u = (function () {
			try {
				var c = i && i.require && i.require('util').types;
				return c || (o && o.binding && o.binding('util'));
			} catch { /* Ignore errors */ }
		})();
	e.exports = u;
})(Ni, Ni.exports);
var OS = Ni.exports,
	SS = xS,
	_S = hd,
	Js = OS,
	Qs = Js && Js.isTypedArray,
	AS = Qs ? _S(Qs) : SS,
	dd = AS,
	PS = EO,
	$S = Cc,
	TS = De,
	ES = pd,
	jS = Ic,
	MS = dd,
	CS = Object.prototype,
	IS = CS.hasOwnProperty;
function NS(e, t) {
	var r = TS(e),
		n = !r && $S(e),
		i = !r && !n && ES(e),
		a = !r && !n && !i && MS(e),
		o = r || n || i || a,
		u = o ? PS(e.length, String) : [],
		c = u.length;
	for (var s in e)
		(t || IS.call(e, s)) &&
			!(
				o &&
				(s == 'length' ||
					(i && (s == 'offset' || s == 'parent')) ||
					(a && (s == 'buffer' || s == 'byteLength' || s == 'byteOffset')) ||
					jS(s, c))
			) &&
			u.push(s);
	return u;
}
var kS = NS,
	DS = Object.prototype;
function LS(e) {
	var t = e && e.constructor,
		r = (typeof t == 'function' && t.prototype) || DS;
	return e === r;
}
var BS = LS;
function RS(e, t) {
	return function (r) {
		return e(t(r));
	};
}
var vd = RS,
	FS = vd,
	zS = FS(Object.keys, Object),
	US = zS,
	WS = BS,
	qS = US,
	GS = Object.prototype,
	HS = GS.hasOwnProperty;
function KS(e) {
	if (!WS(e)) return qS(e);
	var t = [];
	for (var r in Object(e)) HS.call(e, r) && r != 'constructor' && t.push(r);
	return t;
}
var VS = KS,
	XS = vc,
	YS = Nc;
function ZS(e) {
	return e != null && YS(e.length) && !XS(e);
}
var Qn = ZS,
	JS = kS,
	QS = VS,
	e_ = Qn;
function t_(e) {
	return e_(e) ? JS(e) : QS(e);
}
var za = t_,
	r_ = mO,
	n_ = $O,
	i_ = za;
function a_(e) {
	return r_(e, i_, n_);
}
var o_ = a_,
	el = o_,
	u_ = 1,
	c_ = Object.prototype,
	s_ = c_.hasOwnProperty;
function l_(e, t, r, n, i, a) {
	var o = r & u_,
		u = el(e),
		c = u.length,
		s = el(t),
		f = s.length;
	if (c != f && !o) return !1;
	for (var l = c; l--; ) {
		var p = u[l];
		if (!(o ? p in t : s_.call(t, p))) return !1;
	}
	var h = a.get(e),
		d = a.get(t);
	if (h && d) return h == t && d == e;
	var v = !0;
	a.set(e, t), a.set(t, e);
	for (var y = o; ++l < c; ) {
		p = u[l];
		var b = e[p],
			w = t[p];
		if (n) var x = o ? n(w, b, p, t, e, a) : n(b, w, p, e, t, a);
		if (!(x === void 0 ? b === w || i(b, w, r, n, a) : x)) {
			v = !1;
			break;
		}
		y || (y = p == 'constructor');
	}
	if (v && !y) {
		var S = e.constructor,
			m = t.constructor;
		S != m &&
			'constructor' in e &&
			'constructor' in t &&
			!(
				typeof S == 'function' &&
				S instanceof S &&
				typeof m == 'function' &&
				m instanceof m
			) &&
			(v = !1);
	}
	return a.delete(e), a.delete(t), v;
}
var f_ = l_,
	p_ = er,
	h_ = lt,
	d_ = p_(h_, 'DataView'),
	v_ = d_,
	y_ = er,
	m_ = lt,
	g_ = y_(m_, 'Promise'),
	b_ = g_,
	x_ = er,
	w_ = lt,
	O_ = x_(w_, 'Set'),
	yd = O_,
	S_ = er,
	__ = lt,
	A_ = S_(__, 'WeakMap'),
	P_ = A_,
	iu = v_,
	au = mc,
	ou = b_,
	uu = yd,
	cu = P_,
	md = wt,
	qr = Sh,
	tl = '[object Map]',
	$_ = '[object Object]',
	rl = '[object Promise]',
	nl = '[object Set]',
	il = '[object WeakMap]',
	al = '[object DataView]',
	T_ = qr(iu),
	E_ = qr(au),
	j_ = qr(ou),
	M_ = qr(uu),
	C_ = qr(cu),
	Ut = md;
((iu && Ut(new iu(new ArrayBuffer(1))) != al) ||
	(au && Ut(new au()) != tl) ||
	(ou && Ut(ou.resolve()) != rl) ||
	(uu && Ut(new uu()) != nl) ||
	(cu && Ut(new cu()) != il)) &&
	(Ut = function (e) {
		var t = md(e),
			r = t == $_ ? e.constructor : void 0,
			n = r ? qr(r) : '';
		if (n)
			switch (n) {
				case T_:
					return al;
				case E_:
					return tl;
				case j_:
					return rl;
				case M_:
					return nl;
				case C_:
					return il;
			}
		return t;
	});
var I_ = Ut,
	bo = ad,
	N_ = sd,
	k_ = pO,
	D_ = f_,
	ol = I_,
	ul = De,
	cl = pd,
	L_ = dd,
	B_ = 1,
	sl = '[object Arguments]',
	ll = '[object Array]',
	li = '[object Object]',
	R_ = Object.prototype,
	fl = R_.hasOwnProperty;
function F_(e, t, r, n, i, a) {
	var o = ul(e),
		u = ul(t),
		c = o ? ll : ol(e),
		s = u ? ll : ol(t);
	(c = c == sl ? li : c), (s = s == sl ? li : s);
	var f = c == li,
		l = s == li,
		p = c == s;
	if (p && cl(e)) {
		if (!cl(t)) return !1;
		(o = !0), (f = !1);
	}
	if (p && !f)
		return (
			a || (a = new bo()),
			o || L_(e) ? N_(e, t, r, n, i, a) : k_(e, t, c, r, n, i, a)
		);
	if (!(r & B_)) {
		var h = f && fl.call(e, '__wrapped__'),
			d = l && fl.call(t, '__wrapped__');
		if (h || d) {
			var v = h ? e.value() : e,
				y = d ? t.value() : t;
			return a || (a = new bo()), i(v, y, r, n, a);
		}
	}
	return p ? (a || (a = new bo()), D_(e, t, r, n, i, a)) : !1;
}
var z_ = F_,
	U_ = z_,
	pl = Ot;
function gd(e, t, r, n, i) {
	return e === t
		? !0
		: e == null || t == null || (!pl(e) && !pl(t))
		? e !== e && t !== t
		: U_(e, t, r, n, gd, i);
}
var kc = gd,
	W_ = ad,
	q_ = kc,
	G_ = 1,
	H_ = 2;
function K_(e, t, r, n) {
	var i = r.length,
		a = i,
		o = !n;
	if (e == null) return !a;
	for (e = Object(e); i--; ) {
		var u = r[i];
		if (o && u[2] ? u[1] !== e[u[0]] : !(u[0] in e)) return !1;
	}
	for (; ++i < a; ) {
		u = r[i];
		var c = u[0],
			s = e[c],
			f = u[1];
		if (o && u[2]) {
			if (s === void 0 && !(c in e)) return !1;
		} else {
			var l = new W_();
			if (n) var p = n(s, f, c, e, t, l);
			if (!(p === void 0 ? q_(f, s, G_ | H_, n, l) : p)) return !1;
		}
	}
	return !0;
}
var V_ = K_,
	X_ = Ct;
function Y_(e) {
	return e === e && !X_(e);
}
var bd = Y_,
	Z_ = bd,
	J_ = za;
function Q_(e) {
	for (var t = J_(e), r = t.length; r--; ) {
		var n = t[r],
			i = e[n];
		t[r] = [n, i, Z_(i)];
	}
	return t;
}
var eA = Q_;
function tA(e, t) {
	return function (r) {
		return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
	};
}
var xd = tA,
	rA = V_,
	nA = eA,
	iA = xd;
function aA(e) {
	var t = nA(e);
	return t.length == 1 && t[0][2]
		? iA(t[0][0], t[0][1])
		: function (r) {
				return r === e || rA(r, e, t);
		  };
}
var oA = aA;
function uA(e, t) {
	return e != null && t in Object(e);
}
var cA = uA,
	sA = Th,
	lA = Cc,
	fA = De,
	pA = Ic,
	hA = Nc,
	dA = Pa;
function vA(e, t, r) {
	t = sA(t, e);
	for (var n = -1, i = t.length, a = !1; ++n < i; ) {
		var o = dA(t[n]);
		if (!(a = e != null && r(e, o))) break;
		e = e[o];
	}
	return a || ++n != i
		? a
		: ((i = e == null ? 0 : e.length),
		  !!i && hA(i) && pA(o, i) && (fA(e) || lA(e)));
}
var yA = vA,
	mA = cA,
	gA = yA;
function bA(e, t) {
	return e != null && gA(e, t, mA);
}
var xA = bA,
	wA = kc,
	OA = Eh,
	SA = xA,
	_A = dc,
	AA = bd,
	PA = xd,
	$A = Pa,
	TA = 1,
	EA = 2;
function jA(e, t) {
	return _A(e) && AA(t)
		? PA($A(e), t)
		: function (r) {
				var n = OA(r, e);
				return n === void 0 && n === t ? SA(r, e) : wA(t, n, TA | EA);
		  };
}
var MA = jA;
function CA(e) {
	return e;
}
var Gr = CA;
function IA(e) {
	return function (t) {
		return t == null ? void 0 : t[e];
	};
}
var NA = IA,
	kA = wc;
function DA(e) {
	return function (t) {
		return kA(t, e);
	};
}
var LA = DA,
	BA = NA,
	RA = LA,
	FA = dc,
	zA = Pa;
function UA(e) {
	return FA(e) ? BA(zA(e)) : RA(e);
}
var WA = UA,
	qA = oA,
	GA = MA,
	HA = Gr,
	KA = De,
	VA = WA;
function XA(e) {
	return typeof e == 'function'
		? e
		: e == null
		? HA
		: typeof e == 'object'
		? KA(e)
			? GA(e[0], e[1])
			: qA(e)
		: VA(e);
}
var It = XA;
function YA(e, t, r, n) {
	for (var i = e.length, a = r + (n ? 1 : -1); n ? a-- : ++a < i; )
		if (t(e[a], a, e)) return a;
	return -1;
}
var wd = YA;
function ZA(e) {
	return e !== e;
}
var JA = ZA;
function QA(e, t, r) {
	for (var n = r - 1, i = e.length; ++n < i; ) if (e[n] === t) return n;
	return -1;
}
var eP = QA,
	tP = wd,
	rP = JA,
	nP = eP;
function iP(e, t, r) {
	return t === t ? nP(e, t, r) : tP(e, rP, r);
}
var aP = iP,
	oP = aP;
function uP(e, t) {
	var r = e == null ? 0 : e.length;
	return !!r && oP(e, t, 0) > -1;
}
var cP = uP;
function sP(e, t, r) {
	for (var n = -1, i = e == null ? 0 : e.length; ++n < i; )
		if (r(t, e[n])) return !0;
	return !1;
}
var lP = sP;
function fP() {}
var pP = fP,
	xo = yd,
	hP = pP,
	dP = Mc,
	vP = 1 / 0,
	yP =
		xo && 1 / dP(new xo([, -0]))[1] == vP
			? function (e) {
					return new xo(e);
			  }
			: hP,
	mP = yP,
	gP = od,
	bP = cP,
	xP = lP,
	wP = cd,
	OP = mP,
	SP = Mc,
	_P = 200;
function AP(e, t, r) {
	var n = -1,
		i = bP,
		a = e.length,
		o = !0,
		u = [],
		c = u;
	if (r) (o = !1), (i = xP);
	else if (a >= _P) {
		var s = t ? null : OP(e);
		if (s) return SP(s);
		(o = !1), (i = wP), (c = new gP());
	} else c = t ? [] : u;
	e: for (; ++n < a; ) {
		var f = e[n],
			l = t ? t(f) : f;
		if (((f = r || f !== 0 ? f : 0), o && l === l)) {
			for (var p = c.length; p--; ) if (c[p] === l) continue e;
			t && c.push(l), u.push(f);
		} else i(c, l, r) || (c !== u && c.push(l), u.push(f));
	}
	return u;
}
var PP = AP,
	$P = It,
	TP = PP;
function EP(e, t) {
	return e && e.length ? TP(e, $P(t)) : [];
}
var jP = EP;
const hl = fe(jP);
function Od(e, t, r) {
	return t === !0 ? hl(e, r) : J(t) ? hl(e, t) : e;
}
function gr(e) {
	'@babel/helpers - typeof';
	return (
		(gr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		gr(e)
	);
}
var MP = ['ref'];
function dl(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function ft(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? dl(Object(r), !0).forEach(function (n) {
					Ua(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: dl(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function CP(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function vl(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, _d(n.key), n);
	}
}
function IP(e, t, r) {
	return (
		t && vl(e.prototype, t),
		r && vl(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function NP(e, t, r) {
	return (
		(t = ki(t)),
		kP(
			e,
			Sd() ? Reflect.construct(t, r || [], ki(e).constructor) : t.apply(e, r),
		)
	);
}
function kP(e, t) {
	if (t && (gr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return DP(e);
}
function DP(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Sd() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Sd = function () {
		return !!e;
	})();
}
function ki(e) {
	return (
		(ki = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ki(e)
	);
}
function LP(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && su(e, t);
}
function su(e, t) {
	return (
		(su = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		su(e, t)
	);
}
function Ua(e, t, r) {
	return (
		(t = _d(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function _d(e) {
	var t = BP(e, 'string');
	return gr(t) == 'symbol' ? t : t + '';
}
function BP(e, t) {
	if (gr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (gr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function RP(e, t) {
	if (e == null) return {};
	var r = FP(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function FP(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function zP(e) {
	return e.value;
}
function UP(e, t) {
	if ($.isValidElement(e)) return $.cloneElement(e, t);
	if (typeof e == 'function') return $.createElement(e, t);
	t.ref;
	var r = RP(t, MP);
	return $.createElement(jc, r);
}
var yl = 1,
	Kt = (function (e) {
		function t() {
			var r;
			CP(this, t);
			for (var n = arguments.length, i = new Array(n), a = 0; a < n; a++)
				i[a] = arguments[a];
			return (
				(r = NP(this, t, [].concat(i))),
				Ua(r, 'lastBoundingBox', { width: -1, height: -1 }),
				r
			);
		}
		return (
			LP(t, e),
			IP(
				t,
				[
					{
						key: 'componentDidMount',
						value: function () {
							this.updateBBox();
						},
					},
					{
						key: 'componentDidUpdate',
						value: function () {
							this.updateBBox();
						},
					},
					{
						key: 'getBBox',
						value: function () {
							if (this.wrapperNode && this.wrapperNode.getBoundingClientRect) {
								var n = this.wrapperNode.getBoundingClientRect();
								return (
									(n.height = this.wrapperNode.offsetHeight),
									(n.width = this.wrapperNode.offsetWidth),
									n
								);
							}
							return null;
						},
					},
					{
						key: 'updateBBox',
						value: function () {
							var n = this.props.onBBoxUpdate,
								i = this.getBBox();
							i
								? (Math.abs(i.width - this.lastBoundingBox.width) > yl ||
										Math.abs(i.height - this.lastBoundingBox.height) > yl) &&
								  ((this.lastBoundingBox.width = i.width),
								  (this.lastBoundingBox.height = i.height),
								  n && n(i))
								: (this.lastBoundingBox.width !== -1 ||
										this.lastBoundingBox.height !== -1) &&
								  ((this.lastBoundingBox.width = -1),
								  (this.lastBoundingBox.height = -1),
								  n && n(null));
						},
					},
					{
						key: 'getBBoxSnapshot',
						value: function () {
							return this.lastBoundingBox.width >= 0 &&
								this.lastBoundingBox.height >= 0
								? ft({}, this.lastBoundingBox)
								: { width: 0, height: 0 };
						},
					},
					{
						key: 'getDefaultPosition',
						value: function (n) {
							var i = this.props,
								a = i.layout,
								o = i.align,
								u = i.verticalAlign,
								c = i.margin,
								s = i.chartWidth,
								f = i.chartHeight,
								l,
								p;
							if (
								!n ||
								((n.left === void 0 || n.left === null) &&
									(n.right === void 0 || n.right === null))
							)
								if (o === 'center' && a === 'vertical') {
									var h = this.getBBoxSnapshot();
									l = { left: ((s || 0) - h.width) / 2 };
								} else
									l =
										o === 'right'
											? { right: (c && c.right) || 0 }
											: { left: (c && c.left) || 0 };
							if (
								!n ||
								((n.top === void 0 || n.top === null) &&
									(n.bottom === void 0 || n.bottom === null))
							)
								if (u === 'middle') {
									var d = this.getBBoxSnapshot();
									p = { top: ((f || 0) - d.height) / 2 };
								} else
									p =
										u === 'bottom'
											? { bottom: (c && c.bottom) || 0 }
											: { top: (c && c.top) || 0 };
							return ft(ft({}, l), p);
						},
					},
					{
						key: 'render',
						value: function () {
							var n = this,
								i = this.props,
								a = i.content,
								o = i.width,
								u = i.height,
								c = i.wrapperStyle,
								s = i.payloadUniqBy,
								f = i.payload,
								l = ft(
									ft(
										{
											position: 'absolute',
											width: o || 'auto',
											height: u || 'auto',
										},
										this.getDefaultPosition(c),
									),
									c,
								);
							return $.createElement(
								'div',
								{
									className: 'recharts-legend-wrapper',
									style: l,
									ref: function (h) {
										n.wrapperNode = h;
									},
								},
								UP(a, ft(ft({}, this.props), {}, { payload: Od(f, s, zP) })),
							);
						},
					},
				],
				[
					{
						key: 'getWithHeight',
						value: function (n, i) {
							var a = ft(ft({}, this.defaultProps), n.props),
								o = a.layout;
							return o === 'vertical' && R(n.props.height)
								? { height: n.props.height }
								: o === 'horizontal'
								? { width: n.props.width || i }
								: null;
						},
					},
				],
			)
		);
	})(L.PureComponent);
Ua(Kt, 'displayName', 'Legend');
Ua(Kt, 'defaultProps', {
	iconSize: 14,
	layout: 'horizontal',
	align: 'center',
	verticalAlign: 'bottom',
});
var ml = Xn,
	WP = Cc,
	qP = De,
	gl = ml ? ml.isConcatSpreadable : void 0;
function GP(e) {
	return qP(e) || WP(e) || !!(gl && e && e[gl]);
}
var HP = GP,
	KP = ld,
	VP = HP;
function Ad(e, t, r, n, i) {
	var a = -1,
		o = e.length;
	for (r || (r = VP), i || (i = []); ++a < o; ) {
		var u = e[a];
		t > 0 && r(u)
			? t > 1
				? Ad(u, t - 1, r, n, i)
				: KP(i, u)
			: n || (i[i.length] = u);
	}
	return i;
}
var Pd = Ad;
function XP(e) {
	return function (t, r, n) {
		for (var i = -1, a = Object(t), o = n(t), u = o.length; u--; ) {
			var c = o[e ? u : ++i];
			if (r(a[c], c, a) === !1) break;
		}
		return t;
	};
}
var YP = XP,
	ZP = YP,
	JP = ZP(),
	QP = JP,
	e$ = QP,
	t$ = za;
function r$(e, t) {
	return e && e$(e, t, t$);
}
var $d = r$,
	n$ = Qn;
function i$(e, t) {
	return function (r, n) {
		if (r == null) return r;
		if (!n$(r)) return e(r, n);
		for (
			var i = r.length, a = t ? i : -1, o = Object(r);
			(t ? a-- : ++a < i) && n(o[a], a, o) !== !1;

		);
		return r;
	};
}
var a$ = i$,
	o$ = $d,
	u$ = a$,
	c$ = u$(o$),
	Dc = c$,
	s$ = Dc,
	l$ = Qn;
function f$(e, t) {
	var r = -1,
		n = l$(e) ? Array(e.length) : [];
	return (
		s$(e, function (i, a, o) {
			n[++r] = t(i, a, o);
		}),
		n
	);
}
var Td = f$;
function p$(e, t) {
	var r = e.length;
	for (e.sort(t); r--; ) e[r] = e[r].value;
	return e;
}
var h$ = p$,
	bl = Br;
function d$(e, t) {
	if (e !== t) {
		var r = e !== void 0,
			n = e === null,
			i = e === e,
			a = bl(e),
			o = t !== void 0,
			u = t === null,
			c = t === t,
			s = bl(t);
		if (
			(!u && !s && !a && e > t) ||
			(a && o && c && !u && !s) ||
			(n && o && c) ||
			(!r && c) ||
			!i
		)
			return 1;
		if (
			(!n && !a && !s && e < t) ||
			(s && r && i && !n && !a) ||
			(u && r && i) ||
			(!o && i) ||
			!c
		)
			return -1;
	}
	return 0;
}
var v$ = d$,
	y$ = v$;
function m$(e, t, r) {
	for (
		var n = -1, i = e.criteria, a = t.criteria, o = i.length, u = r.length;
		++n < o;

	) {
		var c = y$(i[n], a[n]);
		if (c) {
			if (n >= u) return c;
			var s = r[n];
			return c * (s == 'desc' ? -1 : 1);
		}
	}
	return e.index - t.index;
}
var g$ = m$,
	wo = xc,
	b$ = wc,
	x$ = It,
	w$ = Td,
	O$ = h$,
	S$ = hd,
	_$ = g$,
	A$ = Gr,
	P$ = De;
function $$(e, t, r) {
	t.length
		? (t = wo(t, function (a) {
				return P$(a)
					? function (o) {
							return b$(o, a.length === 1 ? a[0] : a);
					  }
					: a;
		  }))
		: (t = [A$]);
	var n = -1;
	t = wo(t, S$(x$));
	var i = w$(e, function (a, o, u) {
		var c = wo(t, function (s) {
			return s(a);
		});
		return { criteria: c, index: ++n, value: a };
	});
	return O$(i, function (a, o) {
		return _$(a, o, r);
	});
}
var T$ = $$;
function E$(e, t, r) {
	switch (r.length) {
		case 0:
			return e.call(t);
		case 1:
			return e.call(t, r[0]);
		case 2:
			return e.call(t, r[0], r[1]);
		case 3:
			return e.call(t, r[0], r[1], r[2]);
	}
	return e.apply(t, r);
}
var j$ = E$,
	M$ = j$,
	xl = Math.max;
function C$(e, t, r) {
	return (
		(t = xl(t === void 0 ? e.length - 1 : t, 0)),
		function () {
			for (
				var n = arguments, i = -1, a = xl(n.length - t, 0), o = Array(a);
				++i < a;

			)
				o[i] = n[t + i];
			i = -1;
			for (var u = Array(t + 1); ++i < t; ) u[i] = n[i];
			return (u[t] = r(o)), M$(e, this, u);
		}
	);
}
var I$ = C$;
function N$(e) {
	return function () {
		return e;
	};
}
var k$ = N$,
	D$ = er,
	L$ = (function () {
		try {
			var e = D$(Object, 'defineProperty');
			return e({}, '', {}), e;
		} catch { /* Ignore errors */ }
	})(),
	Ed = L$,
	B$ = k$,
	wl = Ed,
	R$ = Gr,
	F$ = wl
		? function (e, t) {
				return wl(e, 'toString', {
					configurable: !0,
					enumerable: !1,
					value: B$(t),
					writable: !0,
				});
		  }
		: R$,
	z$ = F$,
	U$ = 800,
	W$ = 16,
	q$ = Date.now;
function G$(e) {
	var t = 0,
		r = 0;
	return function () {
		var n = q$(),
			i = W$ - (n - r);
		if (((r = n), i > 0)) {
			if (++t >= U$) return arguments[0];
		} else t = 0;
		return e.apply(void 0, arguments);
	};
}
var H$ = G$,
	K$ = z$,
	V$ = H$,
	X$ = V$(K$),
	Y$ = X$,
	Z$ = Gr,
	J$ = I$,
	Q$ = Y$;
function eT(e, t) {
	return Q$(J$(e, t, Z$), e + '');
}
var tT = eT,
	rT = yc,
	nT = Qn,
	iT = Ic,
	aT = Ct;
function oT(e, t, r) {
	if (!aT(r)) return !1;
	var n = typeof t;
	return (n == 'number' ? nT(r) && iT(t, r.length) : n == 'string' && t in r)
		? rT(r[t], e)
		: !1;
}
var Wa = oT,
	uT = Pd,
	cT = T$,
	sT = tT,
	Ol = Wa,
	lT = sT(function (e, t) {
		if (e == null) return [];
		var r = t.length;
		return (
			r > 1 && Ol(e, t[0], t[1])
				? (t = [])
				: r > 2 && Ol(t[0], t[1], t[2]) && (t = [t[0]]),
			cT(e, uT(t, 1), [])
		);
	}),
	fT = lT;
const Lc = fe(fT);
function mn(e) {
	'@babel/helpers - typeof';
	return (
		(mn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		mn(e)
	);
}
function lu() {
	return (
		(lu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		lu.apply(this, arguments)
	);
}
function pT(e, t) {
	return yT(e) || vT(e, t) || dT(e, t) || hT();
}
function hT() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function dT(e, t) {
	if (e) {
		if (typeof e == 'string') return Sl(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Sl(e, t);
	}
}
function Sl(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function vT(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function yT(e) {
	if (Array.isArray(e)) return e;
}
function _l(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Oo(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? _l(Object(r), !0).forEach(function (n) {
					mT(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: _l(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function mT(e, t, r) {
	return (
		(t = gT(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function gT(e) {
	var t = bT(e, 'string');
	return mn(t) == 'symbol' ? t : t + '';
}
function bT(e, t) {
	if (mn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (mn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function xT(e) {
	return Array.isArray(e) && Oe(e[0]) && Oe(e[1]) ? e.join(' ~ ') : e;
}
var wT = function (t) {
	var r = t.separator,
		n = r === void 0 ? ' : ' : r,
		i = t.contentStyle,
		a = i === void 0 ? {} : i,
		o = t.itemStyle,
		u = o === void 0 ? {} : o,
		c = t.labelStyle,
		s = c === void 0 ? {} : c,
		f = t.payload,
		l = t.formatter,
		p = t.itemSorter,
		h = t.wrapperClassName,
		d = t.labelClassName,
		v = t.label,
		y = t.labelFormatter,
		b = t.accessibilityLayer,
		w = b === void 0 ? !1 : b,
		x = function () {
			if (f && f.length) {
				var T = { padding: 0, margin: 0 },
					j = (p ? Lc(f, p) : f).map(function (C, I) {
						if (C.type === 'none') return null;
						var k = Oo(
								{
									display: 'block',
									paddingTop: 4,
									paddingBottom: 4,
									color: C.color || '#000',
								},
								u,
							),
							D = C.formatter || l || xT,
							B = C.value,
							F = C.name,
							H = B,
							V = F;
						if (D && H != null && V != null) {
							var G = D(B, F, C, I, f);
							if (Array.isArray(G)) {
								var X = pT(G, 2);
								(H = X[0]), (V = X[1]);
							} else H = G;
						}
						return $.createElement(
							'li',
							{
								className: 'recharts-tooltip-item',
								key: 'tooltip-item-'.concat(I),
								style: k,
							},
							Oe(V)
								? $.createElement(
										'span',
										{ className: 'recharts-tooltip-item-name' },
										V,
								  )
								: null,
							Oe(V)
								? $.createElement(
										'span',
										{ className: 'recharts-tooltip-item-separator' },
										n,
								  )
								: null,
							$.createElement(
								'span',
								{ className: 'recharts-tooltip-item-value' },
								H,
							),
							$.createElement(
								'span',
								{ className: 'recharts-tooltip-item-unit' },
								C.unit || '',
							),
						);
					});
				return $.createElement(
					'ul',
					{ className: 'recharts-tooltip-item-list', style: T },
					j,
				);
			}
			return null;
		},
		S = Oo(
			{
				margin: 0,
				padding: 10,
				backgroundColor: '#fff',
				border: '1px solid #ccc',
				whiteSpace: 'nowrap',
			},
			a,
		),
		m = Oo({ margin: 0 }, s),
		g = !Q(v),
		O = g ? v : '',
		_ = ne('recharts-default-tooltip', h),
		A = ne('recharts-tooltip-label', d);
	g && y && f !== void 0 && f !== null && (O = y(v, f));
	var E = w ? { role: 'status', 'aria-live': 'assertive' } : {};
	return $.createElement(
		'div',
		lu({ className: _, style: S }, E),
		$.createElement(
			'p',
			{ className: A, style: m },
			$.isValidElement(O) ? O : ''.concat(O),
		),
		x(),
	);
};
function gn(e) {
	'@babel/helpers - typeof';
	return (
		(gn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		gn(e)
	);
}
function fi(e, t, r) {
	return (
		(t = OT(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function OT(e) {
	var t = ST(e, 'string');
	return gn(t) == 'symbol' ? t : t + '';
}
function ST(e, t) {
	if (gn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (gn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Qr = 'recharts-tooltip-wrapper',
	_T = { visibility: 'hidden' };
function AT(e) {
	var t = e.coordinate,
		r = e.translateX,
		n = e.translateY;
	return ne(
		Qr,
		fi(
			fi(
				fi(
					fi({}, ''.concat(Qr, '-right'), R(r) && t && R(t.x) && r >= t.x),
					''.concat(Qr, '-left'),
					R(r) && t && R(t.x) && r < t.x,
				),
				''.concat(Qr, '-bottom'),
				R(n) && t && R(t.y) && n >= t.y,
			),
			''.concat(Qr, '-top'),
			R(n) && t && R(t.y) && n < t.y,
		),
	);
}
function Al(e) {
	var t = e.allowEscapeViewBox,
		r = e.coordinate,
		n = e.key,
		i = e.offsetTopLeft,
		a = e.position,
		o = e.reverseDirection,
		u = e.tooltipDimension,
		c = e.viewBox,
		s = e.viewBoxDimension;
	if (a && R(a[n])) return a[n];
	var f = r[n] - u - i,
		l = r[n] + i;
	if (t[n]) return o[n] ? f : l;
	if (o[n]) {
		var p = f,
			h = c[n];
		return p < h ? Math.max(l, c[n]) : Math.max(f, c[n]);
	}
	var d = l + u,
		v = c[n] + s;
	return d > v ? Math.max(f, c[n]) : Math.max(l, c[n]);
}
function PT(e) {
	var t = e.translateX,
		r = e.translateY,
		n = e.useTranslate3d;
	return {
		transform: n
			? 'translate3d('.concat(t, 'px, ').concat(r, 'px, 0)')
			: 'translate('.concat(t, 'px, ').concat(r, 'px)'),
	};
}
function $T(e) {
	var t = e.allowEscapeViewBox,
		r = e.coordinate,
		n = e.offsetTopLeft,
		i = e.position,
		a = e.reverseDirection,
		o = e.tooltipBox,
		u = e.useTranslate3d,
		c = e.viewBox,
		s,
		f,
		l;
	return (
		o.height > 0 && o.width > 0 && r
			? ((f = Al({
					allowEscapeViewBox: t,
					coordinate: r,
					key: 'x',
					offsetTopLeft: n,
					position: i,
					reverseDirection: a,
					tooltipDimension: o.width,
					viewBox: c,
					viewBoxDimension: c.width,
			  })),
			  (l = Al({
					allowEscapeViewBox: t,
					coordinate: r,
					key: 'y',
					offsetTopLeft: n,
					position: i,
					reverseDirection: a,
					tooltipDimension: o.height,
					viewBox: c,
					viewBoxDimension: c.height,
			  })),
			  (s = PT({ translateX: f, translateY: l, useTranslate3d: u })))
			: (s = _T),
		{
			cssProperties: s,
			cssClasses: AT({ translateX: f, translateY: l, coordinate: r }),
		}
	);
}
function br(e) {
	'@babel/helpers - typeof';
	return (
		(br =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		br(e)
	);
}
function Pl(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function $l(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Pl(Object(r), !0).forEach(function (n) {
					pu(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Pl(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function TT(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function ET(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Md(n.key), n);
	}
}
function jT(e, t, r) {
	return (
		t && ET(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function MT(e, t, r) {
	return (
		(t = Di(t)),
		CT(
			e,
			jd() ? Reflect.construct(t, r || [], Di(e).constructor) : t.apply(e, r),
		)
	);
}
function CT(e, t) {
	if (t && (br(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return IT(e);
}
function IT(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function jd() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (jd = function () {
		return !!e;
	})();
}
function Di(e) {
	return (
		(Di = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		Di(e)
	);
}
function NT(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && fu(e, t);
}
function fu(e, t) {
	return (
		(fu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		fu(e, t)
	);
}
function pu(e, t, r) {
	return (
		(t = Md(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Md(e) {
	var t = kT(e, 'string');
	return br(t) == 'symbol' ? t : t + '';
}
function kT(e, t) {
	if (br(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (br(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Tl = 1,
	DT = (function (e) {
		function t() {
			var r;
			TT(this, t);
			for (var n = arguments.length, i = new Array(n), a = 0; a < n; a++)
				i[a] = arguments[a];
			return (
				(r = MT(this, t, [].concat(i))),
				pu(r, 'state', {
					dismissed: !1,
					dismissedAtCoordinate: { x: 0, y: 0 },
					lastBoundingBox: { width: -1, height: -1 },
				}),
				pu(r, 'handleKeyDown', function (o) {
					if (o.key === 'Escape') {
						var u, c, s, f;
						r.setState({
							dismissed: !0,
							dismissedAtCoordinate: {
								x:
									(u =
										(c = r.props.coordinate) === null || c === void 0
											? void 0
											: c.x) !== null && u !== void 0
										? u
										: 0,
								y:
									(s =
										(f = r.props.coordinate) === null || f === void 0
											? void 0
											: f.y) !== null && s !== void 0
										? s
										: 0,
							},
						});
					}
				}),
				r
			);
		}
		return (
			NT(t, e),
			jT(t, [
				{
					key: 'updateBBox',
					value: function () {
						if (this.wrapperNode && this.wrapperNode.getBoundingClientRect) {
							var n = this.wrapperNode.getBoundingClientRect();
							(Math.abs(n.width - this.state.lastBoundingBox.width) > Tl ||
								Math.abs(n.height - this.state.lastBoundingBox.height) > Tl) &&
								this.setState({
									lastBoundingBox: { width: n.width, height: n.height },
								});
						} else
							(this.state.lastBoundingBox.width !== -1 ||
								this.state.lastBoundingBox.height !== -1) &&
								this.setState({ lastBoundingBox: { width: -1, height: -1 } });
					},
				},
				{
					key: 'componentDidMount',
					value: function () {
						document.addEventListener('keydown', this.handleKeyDown),
							this.updateBBox();
					},
				},
				{
					key: 'componentWillUnmount',
					value: function () {
						document.removeEventListener('keydown', this.handleKeyDown);
					},
				},
				{
					key: 'componentDidUpdate',
					value: function () {
						var n, i;
						this.props.active && this.updateBBox(),
							this.state.dismissed &&
								(((n = this.props.coordinate) === null || n === void 0
									? void 0
									: n.x) !== this.state.dismissedAtCoordinate.x ||
									((i = this.props.coordinate) === null || i === void 0
										? void 0
										: i.y) !== this.state.dismissedAtCoordinate.y) &&
								(this.state.dismissed = !1);
					},
				},
				{
					key: 'render',
					value: function () {
						var n = this,
							i = this.props,
							a = i.active,
							o = i.allowEscapeViewBox,
							u = i.animationDuration,
							c = i.animationEasing,
							s = i.children,
							f = i.coordinate,
							l = i.hasPayload,
							p = i.isAnimationActive,
							h = i.offset,
							d = i.position,
							v = i.reverseDirection,
							y = i.useTranslate3d,
							b = i.viewBox,
							w = i.wrapperStyle,
							x = $T({
								allowEscapeViewBox: o,
								coordinate: f,
								offsetTopLeft: h,
								position: d,
								reverseDirection: v,
								tooltipBox: this.state.lastBoundingBox,
								useTranslate3d: y,
								viewBox: b,
							}),
							S = x.cssClasses,
							m = x.cssProperties,
							g = $l(
								$l(
									{
										transition:
											p && a ? 'transform '.concat(u, 'ms ').concat(c) : void 0,
									},
									m,
								),
								{},
								{
									pointerEvents: 'none',
									visibility:
										!this.state.dismissed && a && l ? 'visible' : 'hidden',
									position: 'absolute',
									top: 0,
									left: 0,
								},
								w,
							);
						return $.createElement(
							'div',
							{
								tabIndex: -1,
								className: S,
								style: g,
								ref: function (_) {
									n.wrapperNode = _;
								},
							},
							s,
						);
					},
				},
			])
		);
	})(L.PureComponent),
	LT = function () {
		return !(
			typeof window < 'u' &&
			window.document &&
			window.document.createElement &&
			window.setTimeout
		);
	},
	vt = {
		isSsr: LT(),
		get: function (t) {
			return vt[t];
		},
		set: function (t, r) {
			if (typeof t == 'string') vt[t] = r;
			else {
				var n = Object.keys(t);
				n &&
					n.length &&
					n.forEach(function (i) {
						vt[i] = t[i];
					});
			}
		},
	};
function xr(e) {
	'@babel/helpers - typeof';
	return (
		(xr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		xr(e)
	);
}
function El(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function jl(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? El(Object(r), !0).forEach(function (n) {
					Bc(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: El(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function BT(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function RT(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Id(n.key), n);
	}
}
function FT(e, t, r) {
	return (
		t && RT(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function zT(e, t, r) {
	return (
		(t = Li(t)),
		UT(
			e,
			Cd() ? Reflect.construct(t, r || [], Li(e).constructor) : t.apply(e, r),
		)
	);
}
function UT(e, t) {
	if (t && (xr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return WT(e);
}
function WT(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Cd() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Cd = function () {
		return !!e;
	})();
}
function Li(e) {
	return (
		(Li = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		Li(e)
	);
}
function qT(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && hu(e, t);
}
function hu(e, t) {
	return (
		(hu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		hu(e, t)
	);
}
function Bc(e, t, r) {
	return (
		(t = Id(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Id(e) {
	var t = GT(e, 'string');
	return xr(t) == 'symbol' ? t : t + '';
}
function GT(e, t) {
	if (xr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (xr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function HT(e) {
	return e.dataKey;
}
function KT(e, t) {
	return $.isValidElement(e)
		? $.cloneElement(e, t)
		: typeof e == 'function'
		? $.createElement(e, t)
		: $.createElement(wT, t);
}
var at = (function (e) {
	function t() {
		return BT(this, t), zT(this, t, arguments);
	}
	return (
		qT(t, e),
		FT(t, [
			{
				key: 'render',
				value: function () {
					var n = this,
						i = this.props,
						a = i.active,
						o = i.allowEscapeViewBox,
						u = i.animationDuration,
						c = i.animationEasing,
						s = i.content,
						f = i.coordinate,
						l = i.filterNull,
						p = i.isAnimationActive,
						h = i.offset,
						d = i.payload,
						v = i.payloadUniqBy,
						y = i.position,
						b = i.reverseDirection,
						w = i.useTranslate3d,
						x = i.viewBox,
						S = i.wrapperStyle,
						m = d ?? [];
					l &&
						m.length &&
						(m = Od(
							d.filter(function (O) {
								return (
									O.value != null && (O.hide !== !0 || n.props.includeHidden)
								);
							}),
							v,
							HT,
						));
					var g = m.length > 0;
					return $.createElement(
						DT,
						{
							allowEscapeViewBox: o,
							animationDuration: u,
							animationEasing: c,
							isAnimationActive: p,
							active: a,
							coordinate: f,
							hasPayload: g,
							offset: h,
							position: y,
							reverseDirection: b,
							useTranslate3d: w,
							viewBox: x,
							wrapperStyle: S,
						},
						KT(s, jl(jl({}, this.props), {}, { payload: m })),
					);
				},
			},
		])
	);
})(L.PureComponent);
Bc(at, 'displayName', 'Tooltip');
Bc(at, 'defaultProps', {
	accessibilityLayer: !1,
	allowEscapeViewBox: { x: !1, y: !1 },
	animationDuration: 400,
	animationEasing: 'ease',
	contentStyle: {},
	coordinate: { x: 0, y: 0 },
	cursor: !0,
	cursorStyle: {},
	filterNull: !0,
	isAnimationActive: !vt.isSsr,
	itemStyle: {},
	labelStyle: {},
	offset: 10,
	reverseDirection: { x: !1, y: !1 },
	separator: ' : ',
	trigger: 'hover',
	useTranslate3d: !1,
	viewBox: { x: 0, y: 0, height: 0, width: 0 },
	wrapperStyle: {},
});
var VT = lt,
	XT = function () {
		return VT.Date.now();
	},
	YT = XT,
	ZT = /\s/;
function JT(e) {
	for (var t = e.length; t-- && ZT.test(e.charAt(t)); );
	return t;
}
var QT = JT,
	eE = QT,
	tE = /^\s+/;
function rE(e) {
	return e && e.slice(0, eE(e) + 1).replace(tE, '');
}
var nE = rE,
	iE = nE,
	Ml = Ct,
	aE = Br,
	Cl = NaN,
	oE = /^[-+]0x[0-9a-f]+$/i,
	uE = /^0b[01]+$/i,
	cE = /^0o[0-7]+$/i,
	sE = parseInt;
function lE(e) {
	if (typeof e == 'number') return e;
	if (aE(e)) return Cl;
	if (Ml(e)) {
		var t = typeof e.valueOf == 'function' ? e.valueOf() : e;
		e = Ml(t) ? t + '' : t;
	}
	if (typeof e != 'string') return e === 0 ? e : +e;
	e = iE(e);
	var r = uE.test(e);
	return r || cE.test(e) ? sE(e.slice(2), r ? 2 : 8) : oE.test(e) ? Cl : +e;
}
var Nd = lE,
	fE = Ct,
	So = YT,
	Il = Nd,
	pE = 'Expected a function',
	hE = Math.max,
	dE = Math.min;
function vE(e, t, r) {
	var n,
		i,
		a,
		o,
		u,
		c,
		s = 0,
		f = !1,
		l = !1,
		p = !0;
	if (typeof e != 'function') throw new TypeError(pE);
	(t = Il(t) || 0),
		fE(r) &&
			((f = !!r.leading),
			(l = 'maxWait' in r),
			(a = l ? hE(Il(r.maxWait) || 0, t) : a),
			(p = 'trailing' in r ? !!r.trailing : p));
	function h(g) {
		var O = n,
			_ = i;
		return (n = i = void 0), (s = g), (o = e.apply(_, O)), o;
	}
	function d(g) {
		return (s = g), (u = setTimeout(b, t)), f ? h(g) : o;
	}
	function v(g) {
		var O = g - c,
			_ = g - s,
			A = t - O;
		return l ? dE(A, a - _) : A;
	}
	function y(g) {
		var O = g - c,
			_ = g - s;
		return c === void 0 || O >= t || O < 0 || (l && _ >= a);
	}
	function b() {
		var g = So();
		if (y(g)) return w(g);
		u = setTimeout(b, v(g));
	}
	function w(g) {
		return (u = void 0), p && n ? h(g) : ((n = i = void 0), o);
	}
	function x() {
		u !== void 0 && clearTimeout(u), (s = 0), (n = c = i = u = void 0);
	}
	function S() {
		return u === void 0 ? o : w(So());
	}
	function m() {
		var g = So(),
			O = y(g);
		if (((n = arguments), (i = this), (c = g), O)) {
			if (u === void 0) return d(c);
			if (l) return clearTimeout(u), (u = setTimeout(b, t)), h(c);
		}
		return u === void 0 && (u = setTimeout(b, t)), o;
	}
	return (m.cancel = x), (m.flush = S), m;
}
var yE = vE,
	mE = yE,
	gE = Ct,
	bE = 'Expected a function';
function xE(e, t, r) {
	var n = !0,
		i = !0;
	if (typeof e != 'function') throw new TypeError(bE);
	return (
		gE(r) &&
			((n = 'leading' in r ? !!r.leading : n),
			(i = 'trailing' in r ? !!r.trailing : i)),
		mE(e, t, { leading: n, maxWait: t, trailing: i })
	);
}
var wE = xE;
const OE = fe(wE);
var kd = function (t) {
	return null;
};
kd.displayName = 'Cell';
function bn(e) {
	'@babel/helpers - typeof';
	return (
		(bn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		bn(e)
	);
}
function Nl(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function du(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Nl(Object(r), !0).forEach(function (n) {
					SE(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Nl(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function SE(e, t, r) {
	return (
		(t = _E(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function _E(e) {
	var t = AE(e, 'string');
	return bn(t) == 'symbol' ? t : t + '';
}
function AE(e, t) {
	if (bn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (bn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var ir = { widthCache: {}, cacheCount: 0 },
	PE = 2e3,
	$E = {
		position: 'absolute',
		top: '-20000px',
		left: 0,
		padding: 0,
		margin: 0,
		border: 'none',
		whiteSpace: 'pre',
	},
	kl = 'recharts_measurement_span';
function TE(e) {
	var t = du({}, e);
	return (
		Object.keys(t).forEach(function (r) {
			t[r] || delete t[r];
		}),
		t
	);
}
var ln = function (t) {
		var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		if (t == null || vt.isSsr) return { width: 0, height: 0 };
		var n = TE(r),
			i = JSON.stringify({ text: t, copyStyle: n });
		if (ir.widthCache[i]) return ir.widthCache[i];
		try {
			var a = document.getElementById(kl);
			a ||
				((a = document.createElement('span')),
				a.setAttribute('id', kl),
				a.setAttribute('aria-hidden', 'true'),
				document.body.appendChild(a));
			var o = du(du({}, $E), n);
			Object.assign(a.style, o), (a.textContent = ''.concat(t));
			var u = a.getBoundingClientRect(),
				c = { width: u.width, height: u.height };
			return (
				(ir.widthCache[i] = c),
				++ir.cacheCount > PE && ((ir.cacheCount = 0), (ir.widthCache = {})),
				c
			);
		} catch {
			return { width: 0, height: 0 };
		}
	},
	EE = function (t) {
		return {
			top: t.top + window.scrollY - document.documentElement.clientTop,
			left: t.left + window.scrollX - document.documentElement.clientLeft,
		};
	};
function xn(e) {
	'@babel/helpers - typeof';
	return (
		(xn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		xn(e)
	);
}
function Bi(e, t) {
	return IE(e) || CE(e, t) || ME(e, t) || jE();
}
function jE() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ME(e, t) {
	if (e) {
		if (typeof e == 'string') return Dl(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Dl(e, t);
	}
}
function Dl(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function CE(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t === 0)) {
				if (Object(r) !== r) return;
				c = !1;
			} else
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function IE(e) {
	if (Array.isArray(e)) return e;
}
function NE(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function Ll(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, DE(n.key), n);
	}
}
function kE(e, t, r) {
	return (
		t && Ll(e.prototype, t),
		r && Ll(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function DE(e) {
	var t = LE(e, 'string');
	return xn(t) == 'symbol' ? t : t + '';
}
function LE(e, t) {
	if (xn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t);
		if (xn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return String(e);
}
var Bl = /(-?\d+(?:\.\d+)?[a-zA-Z%]*)([*/])(-?\d+(?:\.\d+)?[a-zA-Z%]*)/,
	Rl = /(-?\d+(?:\.\d+)?[a-zA-Z%]*)([+-])(-?\d+(?:\.\d+)?[a-zA-Z%]*)/,
	BE = /^px|cm|vh|vw|em|rem|%|mm|in|pt|pc|ex|ch|vmin|vmax|Q$/,
	RE = /(-?\d+(?:\.\d+)?)([a-zA-Z%]+)?/,
	Dd = {
		cm: 96 / 2.54,
		mm: 96 / 25.4,
		pt: 96 / 72,
		pc: 96 / 6,
		in: 96,
		Q: 96 / (2.54 * 40),
		px: 1,
	},
	FE = Object.keys(Dd),
	sr = 'NaN';
function zE(e, t) {
	return e * Dd[t];
}
var pi = (function () {
	function e(t, r) {
		NE(this, e),
			(this.num = t),
			(this.unit = r),
			(this.num = t),
			(this.unit = r),
			Number.isNaN(t) && (this.unit = ''),
			r !== '' && !BE.test(r) && ((this.num = NaN), (this.unit = '')),
			FE.includes(r) && ((this.num = zE(t, r)), (this.unit = 'px'));
	}
	return kE(
		e,
		[
			{
				key: 'add',
				value: function (r) {
					return this.unit !== r.unit
						? new e(NaN, '')
						: new e(this.num + r.num, this.unit);
				},
			},
			{
				key: 'subtract',
				value: function (r) {
					return this.unit !== r.unit
						? new e(NaN, '')
						: new e(this.num - r.num, this.unit);
				},
			},
			{
				key: 'multiply',
				value: function (r) {
					return this.unit !== '' && r.unit !== '' && this.unit !== r.unit
						? new e(NaN, '')
						: new e(this.num * r.num, this.unit || r.unit);
				},
			},
			{
				key: 'divide',
				value: function (r) {
					return this.unit !== '' && r.unit !== '' && this.unit !== r.unit
						? new e(NaN, '')
						: new e(this.num / r.num, this.unit || r.unit);
				},
			},
			{
				key: 'toString',
				value: function () {
					return ''.concat(this.num).concat(this.unit);
				},
			},
			{
				key: 'isNaN',
				value: function () {
					return Number.isNaN(this.num);
				},
			},
		],
		[
			{
				key: 'parse',
				value: function (r) {
					var n,
						i = (n = RE.exec(r)) !== null && n !== void 0 ? n : [],
						a = Bi(i, 3),
						o = a[1],
						u = a[2];
					return new e(parseFloat(o), u ?? '');
				},
			},
		],
	);
})();
function Ld(e) {
	if (e.includes(sr)) return sr;
	for (var t = e; t.includes('*') || t.includes('/'); ) {
		var r,
			n = (r = Bl.exec(t)) !== null && r !== void 0 ? r : [],
			i = Bi(n, 4),
			a = i[1],
			o = i[2],
			u = i[3],
			c = pi.parse(a ?? ''),
			s = pi.parse(u ?? ''),
			f = o === '*' ? c.multiply(s) : c.divide(s);
		if (f.isNaN()) return sr;
		t = t.replace(Bl, f.toString());
	}
	for (; t.includes('+') || /.-\d+(?:\.\d+)?/.test(t); ) {
		var l,
			p = (l = Rl.exec(t)) !== null && l !== void 0 ? l : [],
			h = Bi(p, 4),
			d = h[1],
			v = h[2],
			y = h[3],
			b = pi.parse(d ?? ''),
			w = pi.parse(y ?? ''),
			x = v === '+' ? b.add(w) : b.subtract(w);
		if (x.isNaN()) return sr;
		t = t.replace(Rl, x.toString());
	}
	return t;
}
var Fl = /\(([^()]*)\)/;
function UE(e) {
	for (var t = e; t.includes('('); ) {
		var r = Fl.exec(t),
			n = Bi(r, 2),
			i = n[1];
		t = t.replace(Fl, Ld(i));
	}
	return t;
}
function WE(e) {
	var t = e.replace(/\s+/g, '');
	return (t = UE(t)), (t = Ld(t)), t;
}
function qE(e) {
	try {
		return WE(e);
	} catch {
		return sr;
	}
}
function _o(e) {
	var t = qE(e.slice(5, -1));
	return t === sr ? '' : t;
}
var GE = [
		'x',
		'y',
		'lineHeight',
		'capHeight',
		'scaleToFit',
		'textAnchor',
		'verticalAnchor',
		'fill',
	],
	HE = ['dx', 'dy', 'angle', 'className', 'breakAll'];
function vu() {
	return (
		(vu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		vu.apply(this, arguments)
	);
}
function zl(e, t) {
	if (e == null) return {};
	var r = KE(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function KE(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function Ul(e, t) {
	return ZE(e) || YE(e, t) || XE(e, t) || VE();
}
function VE() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function XE(e, t) {
	if (e) {
		if (typeof e == 'string') return Wl(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Wl(e, t);
	}
}
function Wl(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function YE(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t === 0)) {
				if (Object(r) !== r) return;
				c = !1;
			} else
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function ZE(e) {
	if (Array.isArray(e)) return e;
}
var Bd = /[ \f\n\r\t\v\u2028\u2029]+/,
	Rd = function (t) {
		var r = t.children,
			n = t.breakAll,
			i = t.style;
		try {
			var a = [];
			Q(r) || (n ? (a = r.toString().split('')) : (a = r.toString().split(Bd)));
			var o = a.map(function (c) {
					return { word: c, width: ln(c, i).width };
				}),
				u = n ? 0 : ln(' ', i).width;
			return { wordsWithComputedWidth: o, spaceWidth: u };
		} catch {
			return null;
		}
	},
	JE = function (t, r, n, i, a) {
		var o = t.maxLines,
			u = t.children,
			c = t.style,
			s = t.breakAll,
			f = R(o),
			l = u,
			p = function () {
				var I =
					arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
				return I.reduce(function (k, D) {
					var B = D.word,
						F = D.width,
						H = k[k.length - 1];
					if (H && (i == null || a || H.width + F + n < Number(i)))
						H.words.push(B), (H.width += F + n);
					else {
						var V = { words: [B], width: F };
						k.push(V);
					}
					return k;
				}, []);
			},
			h = p(r),
			d = function (I) {
				return I.reduce(function (k, D) {
					return k.width > D.width ? k : D;
				});
			};
		if (!f) return h;
		for (
			var v = '…',
				y = function (I) {
					var k = l.slice(0, I),
						D = Rd({
							breakAll: s,
							style: c,
							children: k + v,
						}).wordsWithComputedWidth,
						B = p(D),
						F = B.length > o || d(B).width > Number(i);
					return [F, B];
				},
				b = 0,
				w = l.length - 1,
				x = 0,
				S;
			b <= w && x <= l.length - 1;

		) {
			var m = Math.floor((b + w) / 2),
				g = m - 1,
				O = y(g),
				_ = Ul(O, 2),
				A = _[0],
				E = _[1],
				P = y(m),
				T = Ul(P, 1),
				j = T[0];
			if ((!A && !j && (b = m + 1), A && j && (w = m - 1), !A && j)) {
				S = E;
				break;
			}
			x++;
		}
		return S || h;
	},
	ql = function (t) {
		var r = Q(t) ? [] : t.toString().split(Bd);
		return [{ words: r }];
	},
	QE = function (t) {
		var r = t.width,
			n = t.scaleToFit,
			i = t.children,
			a = t.style,
			o = t.breakAll,
			u = t.maxLines;
		if ((r || n) && !vt.isSsr) {
			var c,
				s,
				f = Rd({ breakAll: o, children: i, style: a });
			if (f) {
				var l = f.wordsWithComputedWidth,
					p = f.spaceWidth;
				(c = l), (s = p);
			} else return ql(i);
			return JE(
				{ breakAll: o, children: i, maxLines: u, style: a },
				c,
				s,
				r,
				n,
			);
		}
		return ql(i);
	},
	Gl = '#808080',
	Ri = function (t) {
		var r = t.x,
			n = r === void 0 ? 0 : r,
			i = t.y,
			a = i === void 0 ? 0 : i,
			o = t.lineHeight,
			u = o === void 0 ? '1em' : o,
			c = t.capHeight,
			s = c === void 0 ? '0.71em' : c,
			f = t.scaleToFit,
			l = f === void 0 ? !1 : f,
			p = t.textAnchor,
			h = p === void 0 ? 'start' : p,
			d = t.verticalAnchor,
			v = d === void 0 ? 'end' : d,
			y = t.fill,
			b = y === void 0 ? Gl : y,
			w = zl(t, GE),
			x = L.useMemo(
				function () {
					return QE({
						breakAll: w.breakAll,
						children: w.children,
						maxLines: w.maxLines,
						scaleToFit: l,
						style: w.style,
						width: w.width,
					});
				},
				[w.breakAll, w.children, w.maxLines, l, w.style, w.width],
			),
			S = w.dx,
			m = w.dy,
			g = w.angle,
			O = w.className,
			_ = w.breakAll,
			A = zl(w, HE);
		if (!Oe(n) || !Oe(a)) return null;
		var E = n + (R(S) ? S : 0),
			P = a + (R(m) ? m : 0),
			T;
		switch (v) {
			case 'start':
				T = _o('calc('.concat(s, ')'));
				break;
			case 'middle':
				T = _o(
					'calc('
						.concat((x.length - 1) / 2, ' * -')
						.concat(u, ' + (')
						.concat(s, ' / 2))'),
				);
				break;
			default:
				T = _o('calc('.concat(x.length - 1, ' * -').concat(u, ')'));
				break;
		}
		var j = [];
		if (l) {
			var C = x[0].width,
				I = w.width;
			j.push('scale('.concat((R(I) ? I / C : 1) / C, ')'));
		}
		return (
			g && j.push('rotate('.concat(g, ', ').concat(E, ', ').concat(P, ')')),
			j.length && (A.transform = j.join(' ')),
			$.createElement(
				'text',
				vu({}, ee(A, !0), {
					x: E,
					y: P,
					className: ne('recharts-text', O),
					textAnchor: h,
					fill: b.includes('url') ? Gl : b,
				}),
				x.map(function (k, D) {
					var B = k.words.join(_ ? '' : ' ');
					return $.createElement(
						'tspan',
						{ x: E, dy: D === 0 ? T : u, key: ''.concat(B, '-').concat(D) },
						B,
					);
				}),
			)
		);
	};
function jt(e, t) {
	return e == null || t == null
		? NaN
		: e < t
		? -1
		: e > t
		? 1
		: e >= t
		? 0
		: NaN;
}
function ej(e, t) {
	return e == null || t == null
		? NaN
		: t < e
		? -1
		: t > e
		? 1
		: t >= e
		? 0
		: NaN;
}
function Rc(e) {
	let t, r, n;
	e.length !== 2
		? ((t = jt), (r = (u, c) => jt(e(u), c)), (n = (u, c) => e(u) - c))
		: ((t = e === jt || e === ej ? e : tj), (r = e), (n = e));
	function i(u, c, s = 0, f = u.length) {
		if (s < f) {
			if (t(c, c) !== 0) return f;
			do {
				const l = (s + f) >>> 1;
				r(u[l], c) < 0 ? (s = l + 1) : (f = l);
			} while (s < f);
		}
		return s;
	}
	function a(u, c, s = 0, f = u.length) {
		if (s < f) {
			if (t(c, c) !== 0) return f;
			do {
				const l = (s + f) >>> 1;
				r(u[l], c) <= 0 ? (s = l + 1) : (f = l);
			} while (s < f);
		}
		return s;
	}
	function o(u, c, s = 0, f = u.length) {
		const l = i(u, c, s, f - 1);
		return l > s && n(u[l - 1], c) > -n(u[l], c) ? l - 1 : l;
	}
	return { left: i, center: o, right: a };
}
function tj() {
	return 0;
}
function Fd(e) {
	return e === null ? NaN : +e;
}
function* rj(e, t) {
	for (let r of e) r != null && (r = +r) >= r && (yield r);
}
const nj = Rc(jt),
	ei = nj.right;
Rc(Fd).center;
class Hl extends Map {
	constructor(t, r = oj) {
		if (
			(super(),
			Object.defineProperties(this, {
				_intern: { value: new Map() },
				_key: { value: r },
			}),
			t != null)
		)
			for (const [n, i] of t) this.set(n, i);
	}
	get(t) {
		return super.get(Kl(this, t));
	}
	has(t) {
		return super.has(Kl(this, t));
	}
	set(t, r) {
		return super.set(ij(this, t), r);
	}
	delete(t) {
		return super.delete(aj(this, t));
	}
}
function Kl({ _intern: e, _key: t }, r) {
	const n = t(r);
	return e.has(n) ? e.get(n) : r;
}
function ij({ _intern: e, _key: t }, r) {
	const n = t(r);
	return e.has(n) ? e.get(n) : (e.set(n, r), r);
}
function aj({ _intern: e, _key: t }, r) {
	const n = t(r);
	return e.has(n) && ((r = e.get(n)), e.delete(n)), r;
}
function oj(e) {
	return e !== null && typeof e == 'object' ? e.valueOf() : e;
}
function uj(e = jt) {
	if (e === jt) return zd;
	if (typeof e != 'function') throw new TypeError('compare is not a function');
	return (t, r) => {
		const n = e(t, r);
		return n || n === 0 ? n : (e(r, r) === 0) - (e(t, t) === 0);
	};
}
function zd(e, t) {
	return (
		(e == null || !(e >= e)) - (t == null || !(t >= t)) ||
		(e < t ? -1 : e > t ? 1 : 0)
	);
}
const cj = Math.sqrt(50),
	sj = Math.sqrt(10),
	lj = Math.sqrt(2);
function Fi(e, t, r) {
	const n = (t - e) / Math.max(0, r),
		i = Math.floor(Math.log10(n)),
		a = n / Math.pow(10, i),
		o = a >= cj ? 10 : a >= sj ? 5 : a >= lj ? 2 : 1;
	let u, c, s;
	return (
		i < 0
			? ((s = Math.pow(10, -i) / o),
			  (u = Math.round(e * s)),
			  (c = Math.round(t * s)),
			  u / s < e && ++u,
			  c / s > t && --c,
			  (s = -s))
			: ((s = Math.pow(10, i) * o),
			  (u = Math.round(e / s)),
			  (c = Math.round(t / s)),
			  u * s < e && ++u,
			  c * s > t && --c),
		c < u && 0.5 <= r && r < 2 ? Fi(e, t, r * 2) : [u, c, s]
	);
}
function yu(e, t, r) {
	if (((t = +t), (e = +e), (r = +r), !(r > 0))) return [];
	if (e === t) return [e];
	const n = t < e,
		[i, a, o] = n ? Fi(t, e, r) : Fi(e, t, r);
	if (!(a >= i)) return [];
	const u = a - i + 1,
		c = new Array(u);
	if (n)
		if (o < 0) for (let s = 0; s < u; ++s) c[s] = (a - s) / -o;
		else for (let s = 0; s < u; ++s) c[s] = (a - s) * o;
	else if (o < 0) for (let s = 0; s < u; ++s) c[s] = (i + s) / -o;
	else for (let s = 0; s < u; ++s) c[s] = (i + s) * o;
	return c;
}
function mu(e, t, r) {
	return (t = +t), (e = +e), (r = +r), Fi(e, t, r)[2];
}
function gu(e, t, r) {
	(t = +t), (e = +e), (r = +r);
	const n = t < e,
		i = n ? mu(t, e, r) : mu(e, t, r);
	return (n ? -1 : 1) * (i < 0 ? 1 / -i : i);
}
function Vl(e, t) {
	let r;
	for (const n of e)
		n != null && (r < n || (r === void 0 && n >= n)) && (r = n);
	return r;
}
function Xl(e, t) {
	let r;
	for (const n of e)
		n != null && (r > n || (r === void 0 && n >= n)) && (r = n);
	return r;
}
function Ud(e, t, r = 0, n = 1 / 0, i) {
	if (
		((t = Math.floor(t)),
		(r = Math.floor(Math.max(0, r))),
		(n = Math.floor(Math.min(e.length - 1, n))),
		!(r <= t && t <= n))
	)
		return e;
	for (i = i === void 0 ? zd : uj(i); n > r; ) {
		if (n - r > 600) {
			const c = n - r + 1,
				s = t - r + 1,
				f = Math.log(c),
				l = 0.5 * Math.exp((2 * f) / 3),
				p = 0.5 * Math.sqrt((f * l * (c - l)) / c) * (s - c / 2 < 0 ? -1 : 1),
				h = Math.max(r, Math.floor(t - (s * l) / c + p)),
				d = Math.min(n, Math.floor(t + ((c - s) * l) / c + p));
			Ud(e, t, h, d, i);
		}
		const a = e[t];
		let o = r,
			u = n;
		for (en(e, r, t), i(e[n], a) > 0 && en(e, r, n); o < u; ) {
			for (en(e, o, u), ++o, --u; i(e[o], a) < 0; ) ++o;
			for (; i(e[u], a) > 0; ) --u;
		}
		i(e[r], a) === 0 ? en(e, r, u) : (++u, en(e, u, n)),
			u <= t && (r = u + 1),
			t <= u && (n = u - 1);
	}
	return e;
}
function en(e, t, r) {
	const n = e[t];
	(e[t] = e[r]), (e[r] = n);
}
function fj(e, t, r) {
	if (((e = Float64Array.from(rj(e))), !(!(n = e.length) || isNaN((t = +t))))) {
		if (t <= 0 || n < 2) return Xl(e);
		if (t >= 1) return Vl(e);
		var n,
			i = (n - 1) * t,
			a = Math.floor(i),
			o = Vl(Ud(e, a).subarray(0, a + 1)),
			u = Xl(e.subarray(a + 1));
		return o + (u - o) * (i - a);
	}
}
function pj(e, t, r = Fd) {
	if (!(!(n = e.length) || isNaN((t = +t)))) {
		if (t <= 0 || n < 2) return +r(e[0], 0, e);
		if (t >= 1) return +r(e[n - 1], n - 1, e);
		var n,
			i = (n - 1) * t,
			a = Math.floor(i),
			o = +r(e[a], a, e),
			u = +r(e[a + 1], a + 1, e);
		return o + (u - o) * (i - a);
	}
}
function hj(e, t, r) {
	(e = +e),
		(t = +t),
		(r = (i = arguments.length) < 2 ? ((t = e), (e = 0), 1) : i < 3 ? 1 : +r);
	for (
		var n = -1, i = Math.max(0, Math.ceil((t - e) / r)) | 0, a = new Array(i);
		++n < i;

	)
		a[n] = e + n * r;
	return a;
}
function Ze(e, t) {
	switch (arguments.length) {
		case 0:
			break;
		case 1:
			this.range(e);
			break;
		default:
			this.range(t).domain(e);
			break;
	}
	return this;
}
function St(e, t) {
	switch (arguments.length) {
		case 0:
			break;
		case 1: {
			typeof e == 'function' ? this.interpolator(e) : this.range(e);
			break;
		}
		default: {
			this.domain(e),
				typeof t == 'function' ? this.interpolator(t) : this.range(t);
			break;
		}
	}
	return this;
}
const bu = Symbol('implicit');
function Fc() {
	var e = new Hl(),
		t = [],
		r = [],
		n = bu;
	function i(a) {
		let o = e.get(a);
		if (o === void 0) {
			if (n !== bu) return n;
			e.set(a, (o = t.push(a) - 1));
		}
		return r[o % r.length];
	}
	return (
		(i.domain = function (a) {
			if (!arguments.length) return t.slice();
			(t = []), (e = new Hl());
			for (const o of a) e.has(o) || e.set(o, t.push(o) - 1);
			return i;
		}),
		(i.range = function (a) {
			return arguments.length ? ((r = Array.from(a)), i) : r.slice();
		}),
		(i.unknown = function (a) {
			return arguments.length ? ((n = a), i) : n;
		}),
		(i.copy = function () {
			return Fc(t, r).unknown(n);
		}),
		Ze.apply(i, arguments),
		i
	);
}
function wn() {
	var e = Fc().unknown(void 0),
		t = e.domain,
		r = e.range,
		n = 0,
		i = 1,
		a,
		o,
		u = !1,
		c = 0,
		s = 0,
		f = 0.5;
	delete e.unknown;
	function l() {
		var p = t().length,
			h = i < n,
			d = h ? i : n,
			v = h ? n : i;
		(a = (v - d) / Math.max(1, p - c + s * 2)),
			u && (a = Math.floor(a)),
			(d += (v - d - a * (p - c)) * f),
			(o = a * (1 - c)),
			u && ((d = Math.round(d)), (o = Math.round(o)));
		var y = hj(p).map(function (b) {
			return d + a * b;
		});
		return r(h ? y.reverse() : y);
	}
	return (
		(e.domain = function (p) {
			return arguments.length ? (t(p), l()) : t();
		}),
		(e.range = function (p) {
			return arguments.length
				? (([n, i] = p), (n = +n), (i = +i), l())
				: [n, i];
		}),
		(e.rangeRound = function (p) {
			return ([n, i] = p), (n = +n), (i = +i), (u = !0), l();
		}),
		(e.bandwidth = function () {
			return o;
		}),
		(e.step = function () {
			return a;
		}),
		(e.round = function (p) {
			return arguments.length ? ((u = !!p), l()) : u;
		}),
		(e.padding = function (p) {
			return arguments.length ? ((c = Math.min(1, (s = +p))), l()) : c;
		}),
		(e.paddingInner = function (p) {
			return arguments.length ? ((c = Math.min(1, p)), l()) : c;
		}),
		(e.paddingOuter = function (p) {
			return arguments.length ? ((s = +p), l()) : s;
		}),
		(e.align = function (p) {
			return arguments.length ? ((f = Math.max(0, Math.min(1, p))), l()) : f;
		}),
		(e.copy = function () {
			return wn(t(), [n, i]).round(u).paddingInner(c).paddingOuter(s).align(f);
		}),
		Ze.apply(l(), arguments)
	);
}
function Wd(e) {
	var t = e.copy;
	return (
		(e.padding = e.paddingOuter),
		delete e.paddingInner,
		delete e.paddingOuter,
		(e.copy = function () {
			return Wd(t());
		}),
		e
	);
}
function fn() {
	return Wd(wn.apply(null, arguments).paddingInner(1));
}
function zc(e, t, r) {
	(e.prototype = t.prototype = r), (r.constructor = e);
}
function qd(e, t) {
	var r = Object.create(e.prototype);
	for (var n in t) r[n] = t[n];
	return r;
}
function ti() {}
var On = 0.7,
	zi = 1 / On,
	hr = '\\s*([+-]?\\d+)\\s*',
	Sn = '\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*',
	ut = '\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*',
	dj = /^#([0-9a-f]{3,8})$/,
	vj = new RegExp(`^rgb\\(${hr},${hr},${hr}\\)$`),
	yj = new RegExp(`^rgb\\(${ut},${ut},${ut}\\)$`),
	mj = new RegExp(`^rgba\\(${hr},${hr},${hr},${Sn}\\)$`),
	gj = new RegExp(`^rgba\\(${ut},${ut},${ut},${Sn}\\)$`),
	bj = new RegExp(`^hsl\\(${Sn},${ut},${ut}\\)$`),
	xj = new RegExp(`^hsla\\(${Sn},${ut},${ut},${Sn}\\)$`),
	Yl = {
		aliceblue: 15792383,
		antiquewhite: 16444375,
		aqua: 65535,
		aquamarine: 8388564,
		azure: 15794175,
		beige: 16119260,
		bisque: 16770244,
		black: 0,
		blanchedalmond: 16772045,
		blue: 255,
		blueviolet: 9055202,
		brown: 10824234,
		burlywood: 14596231,
		cadetblue: 6266528,
		chartreuse: 8388352,
		chocolate: 13789470,
		coral: 16744272,
		cornflowerblue: 6591981,
		cornsilk: 16775388,
		crimson: 14423100,
		cyan: 65535,
		darkblue: 139,
		darkcyan: 35723,
		darkgoldenrod: 12092939,
		darkgray: 11119017,
		darkgreen: 25600,
		darkgrey: 11119017,
		darkkhaki: 12433259,
		darkmagenta: 9109643,
		darkolivegreen: 5597999,
		darkorange: 16747520,
		darkorchid: 10040012,
		darkred: 9109504,
		darksalmon: 15308410,
		darkseagreen: 9419919,
		darkslateblue: 4734347,
		darkslategray: 3100495,
		darkslategrey: 3100495,
		darkturquoise: 52945,
		darkviolet: 9699539,
		deeppink: 16716947,
		deepskyblue: 49151,
		dimgray: 6908265,
		dimgrey: 6908265,
		dodgerblue: 2003199,
		firebrick: 11674146,
		floralwhite: 16775920,
		forestgreen: 2263842,
		fuchsia: 16711935,
		gainsboro: 14474460,
		ghostwhite: 16316671,
		gold: 16766720,
		goldenrod: 14329120,
		gray: 8421504,
		green: 32768,
		greenyellow: 11403055,
		grey: 8421504,
		honeydew: 15794160,
		hotpink: 16738740,
		indianred: 13458524,
		indigo: 4915330,
		ivory: 16777200,
		khaki: 15787660,
		lavender: 15132410,
		lavenderblush: 16773365,
		lawngreen: 8190976,
		lemonchiffon: 16775885,
		lightblue: 11393254,
		lightcoral: 15761536,
		lightcyan: 14745599,
		lightgoldenrodyellow: 16448210,
		lightgray: 13882323,
		lightgreen: 9498256,
		lightgrey: 13882323,
		lightpink: 16758465,
		lightsalmon: 16752762,
		lightseagreen: 2142890,
		lightskyblue: 8900346,
		lightslategray: 7833753,
		lightslategrey: 7833753,
		lightsteelblue: 11584734,
		lightyellow: 16777184,
		lime: 65280,
		limegreen: 3329330,
		linen: 16445670,
		magenta: 16711935,
		maroon: 8388608,
		mediumaquamarine: 6737322,
		mediumblue: 205,
		mediumorchid: 12211667,
		mediumpurple: 9662683,
		mediumseagreen: 3978097,
		mediumslateblue: 8087790,
		mediumspringgreen: 64154,
		mediumturquoise: 4772300,
		mediumvioletred: 13047173,
		midnightblue: 1644912,
		mintcream: 16121850,
		mistyrose: 16770273,
		moccasin: 16770229,
		navajowhite: 16768685,
		navy: 128,
		oldlace: 16643558,
		olive: 8421376,
		olivedrab: 7048739,
		orange: 16753920,
		orangered: 16729344,
		orchid: 14315734,
		palegoldenrod: 15657130,
		palegreen: 10025880,
		paleturquoise: 11529966,
		palevioletred: 14381203,
		papayawhip: 16773077,
		peachpuff: 16767673,
		peru: 13468991,
		pink: 16761035,
		plum: 14524637,
		powderblue: 11591910,
		purple: 8388736,
		rebeccapurple: 6697881,
		red: 16711680,
		rosybrown: 12357519,
		royalblue: 4286945,
		saddlebrown: 9127187,
		salmon: 16416882,
		sandybrown: 16032864,
		seagreen: 3050327,
		seashell: 16774638,
		sienna: 10506797,
		silver: 12632256,
		skyblue: 8900331,
		slateblue: 6970061,
		slategray: 7372944,
		slategrey: 7372944,
		snow: 16775930,
		springgreen: 65407,
		steelblue: 4620980,
		tan: 13808780,
		teal: 32896,
		thistle: 14204888,
		tomato: 16737095,
		turquoise: 4251856,
		violet: 15631086,
		wheat: 16113331,
		white: 16777215,
		whitesmoke: 16119285,
		yellow: 16776960,
		yellowgreen: 10145074,
	};
zc(ti, _n, {
	copy(e) {
		return Object.assign(new this.constructor(), this, e);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: Zl,
	formatHex: Zl,
	formatHex8: wj,
	formatHsl: Oj,
	formatRgb: Jl,
	toString: Jl,
});
function Zl() {
	return this.rgb().formatHex();
}
function wj() {
	return this.rgb().formatHex8();
}
function Oj() {
	return Gd(this).formatHsl();
}
function Jl() {
	return this.rgb().formatRgb();
}
function _n(e) {
	var t, r;
	return (
		(e = (e + '').trim().toLowerCase()),
		(t = dj.exec(e))
			? ((r = t[1].length),
			  (t = parseInt(t[1], 16)),
			  r === 6
					? Ql(t)
					: r === 3
					? new ke(
							((t >> 8) & 15) | ((t >> 4) & 240),
							((t >> 4) & 15) | (t & 240),
							((t & 15) << 4) | (t & 15),
							1,
					  )
					: r === 8
					? hi(
							(t >> 24) & 255,
							(t >> 16) & 255,
							(t >> 8) & 255,
							(t & 255) / 255,
					  )
					: r === 4
					? hi(
							((t >> 12) & 15) | ((t >> 8) & 240),
							((t >> 8) & 15) | ((t >> 4) & 240),
							((t >> 4) & 15) | (t & 240),
							(((t & 15) << 4) | (t & 15)) / 255,
					  )
					: null)
			: (t = vj.exec(e))
			? new ke(t[1], t[2], t[3], 1)
			: (t = yj.exec(e))
			? new ke((t[1] * 255) / 100, (t[2] * 255) / 100, (t[3] * 255) / 100, 1)
			: (t = mj.exec(e))
			? hi(t[1], t[2], t[3], t[4])
			: (t = gj.exec(e))
			? hi((t[1] * 255) / 100, (t[2] * 255) / 100, (t[3] * 255) / 100, t[4])
			: (t = bj.exec(e))
			? rf(t[1], t[2] / 100, t[3] / 100, 1)
			: (t = xj.exec(e))
			? rf(t[1], t[2] / 100, t[3] / 100, t[4])
			: Yl.hasOwnProperty(e)
			? Ql(Yl[e])
			: e === 'transparent'
			? new ke(NaN, NaN, NaN, 0)
			: null
	);
}
function Ql(e) {
	return new ke((e >> 16) & 255, (e >> 8) & 255, e & 255, 1);
}
function hi(e, t, r, n) {
	return n <= 0 && (e = t = r = NaN), new ke(e, t, r, n);
}
function Sj(e) {
	return (
		e instanceof ti || (e = _n(e)),
		e ? ((e = e.rgb()), new ke(e.r, e.g, e.b, e.opacity)) : new ke()
	);
}
function xu(e, t, r, n) {
	return arguments.length === 1 ? Sj(e) : new ke(e, t, r, n ?? 1);
}
function ke(e, t, r, n) {
	(this.r = +e), (this.g = +t), (this.b = +r), (this.opacity = +n);
}
zc(
	ke,
	xu,
	qd(ti, {
		brighter(e) {
			return (
				(e = e == null ? zi : Math.pow(zi, e)),
				new ke(this.r * e, this.g * e, this.b * e, this.opacity)
			);
		},
		darker(e) {
			return (
				(e = e == null ? On : Math.pow(On, e)),
				new ke(this.r * e, this.g * e, this.b * e, this.opacity)
			);
		},
		rgb() {
			return this;
		},
		clamp() {
			return new ke(Vt(this.r), Vt(this.g), Vt(this.b), Ui(this.opacity));
		},
		displayable() {
			return (
				-0.5 <= this.r &&
				this.r < 255.5 &&
				-0.5 <= this.g &&
				this.g < 255.5 &&
				-0.5 <= this.b &&
				this.b < 255.5 &&
				0 <= this.opacity &&
				this.opacity <= 1
			);
		},
		hex: ef,
		formatHex: ef,
		formatHex8: _j,
		formatRgb: tf,
		toString: tf,
	}),
);
function ef() {
	return `#${qt(this.r)}${qt(this.g)}${qt(this.b)}`;
}
function _j() {
	return `#${qt(this.r)}${qt(this.g)}${qt(this.b)}${qt(
		(isNaN(this.opacity) ? 1 : this.opacity) * 255,
	)}`;
}
function tf() {
	const e = Ui(this.opacity);
	return `${e === 1 ? 'rgb(' : 'rgba('}${Vt(this.r)}, ${Vt(this.g)}, ${Vt(
		this.b,
	)}${e === 1 ? ')' : `, ${e})`}`;
}
function Ui(e) {
	return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function Vt(e) {
	return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function qt(e) {
	return (e = Vt(e)), (e < 16 ? '0' : '') + e.toString(16);
}
function rf(e, t, r, n) {
	return (
		n <= 0
			? (e = t = r = NaN)
			: r <= 0 || r >= 1
			? (e = t = NaN)
			: t <= 0 && (e = NaN),
		new rt(e, t, r, n)
	);
}
function Gd(e) {
	if (e instanceof rt) return new rt(e.h, e.s, e.l, e.opacity);
	if ((e instanceof ti || (e = _n(e)), !e)) return new rt();
	if (e instanceof rt) return e;
	e = e.rgb();
	var t = e.r / 255,
		r = e.g / 255,
		n = e.b / 255,
		i = Math.min(t, r, n),
		a = Math.max(t, r, n),
		o = NaN,
		u = a - i,
		c = (a + i) / 2;
	return (
		u
			? (t === a
					? (o = (r - n) / u + (r < n) * 6)
					: r === a
					? (o = (n - t) / u + 2)
					: (o = (t - r) / u + 4),
			  (u /= c < 0.5 ? a + i : 2 - a - i),
			  (o *= 60))
			: (u = c > 0 && c < 1 ? 0 : o),
		new rt(o, u, c, e.opacity)
	);
}
function Aj(e, t, r, n) {
	return arguments.length === 1 ? Gd(e) : new rt(e, t, r, n ?? 1);
}
function rt(e, t, r, n) {
	(this.h = +e), (this.s = +t), (this.l = +r), (this.opacity = +n);
}
zc(
	rt,
	Aj,
	qd(ti, {
		brighter(e) {
			return (
				(e = e == null ? zi : Math.pow(zi, e)),
				new rt(this.h, this.s, this.l * e, this.opacity)
			);
		},
		darker(e) {
			return (
				(e = e == null ? On : Math.pow(On, e)),
				new rt(this.h, this.s, this.l * e, this.opacity)
			);
		},
		rgb() {
			var e = (this.h % 360) + (this.h < 0) * 360,
				t = isNaN(e) || isNaN(this.s) ? 0 : this.s,
				r = this.l,
				n = r + (r < 0.5 ? r : 1 - r) * t,
				i = 2 * r - n;
			return new ke(
				Ao(e >= 240 ? e - 240 : e + 120, i, n),
				Ao(e, i, n),
				Ao(e < 120 ? e + 240 : e - 120, i, n),
				this.opacity,
			);
		},
		clamp() {
			return new rt(nf(this.h), di(this.s), di(this.l), Ui(this.opacity));
		},
		displayable() {
			return (
				((0 <= this.s && this.s <= 1) || isNaN(this.s)) &&
				0 <= this.l &&
				this.l <= 1 &&
				0 <= this.opacity &&
				this.opacity <= 1
			);
		},
		formatHsl() {
			const e = Ui(this.opacity);
			return `${e === 1 ? 'hsl(' : 'hsla('}${nf(this.h)}, ${
				di(this.s) * 100
			}%, ${di(this.l) * 100}%${e === 1 ? ')' : `, ${e})`}`;
		},
	}),
);
function nf(e) {
	return (e = (e || 0) % 360), e < 0 ? e + 360 : e;
}
function di(e) {
	return Math.max(0, Math.min(1, e || 0));
}
function Ao(e, t, r) {
	return (
		(e < 60
			? t + ((r - t) * e) / 60
			: e < 180
			? r
			: e < 240
			? t + ((r - t) * (240 - e)) / 60
			: t) * 255
	);
}
const Uc = (e) => () => e;
function Pj(e, t) {
	return function (r) {
		return e + r * t;
	};
}
function $j(e, t, r) {
	return (
		(e = Math.pow(e, r)),
		(t = Math.pow(t, r) - e),
		(r = 1 / r),
		function (n) {
			return Math.pow(e + n * t, r);
		}
	);
}
function Tj(e) {
	return (e = +e) == 1
		? Hd
		: function (t, r) {
				return r - t ? $j(t, r, e) : Uc(isNaN(t) ? r : t);
		  };
}
function Hd(e, t) {
	var r = t - e;
	return r ? Pj(e, r) : Uc(isNaN(e) ? t : e);
}
const af = (function e(t) {
	var r = Tj(t);
	function n(i, a) {
		var o = r((i = xu(i)).r, (a = xu(a)).r),
			u = r(i.g, a.g),
			c = r(i.b, a.b),
			s = Hd(i.opacity, a.opacity);
		return function (f) {
			return (
				(i.r = o(f)), (i.g = u(f)), (i.b = c(f)), (i.opacity = s(f)), i + ''
			);
		};
	}
	return (n.gamma = e), n;
})(1);
function Ej(e, t) {
	t || (t = []);
	var r = e ? Math.min(t.length, e.length) : 0,
		n = t.slice(),
		i;
	return function (a) {
		for (i = 0; i < r; ++i) n[i] = e[i] * (1 - a) + t[i] * a;
		return n;
	};
}
function jj(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
function Mj(e, t) {
	var r = t ? t.length : 0,
		n = e ? Math.min(r, e.length) : 0,
		i = new Array(n),
		a = new Array(r),
		o;
	for (o = 0; o < n; ++o) i[o] = Hr(e[o], t[o]);
	for (; o < r; ++o) a[o] = t[o];
	return function (u) {
		for (o = 0; o < n; ++o) a[o] = i[o](u);
		return a;
	};
}
function Cj(e, t) {
	var r = new Date();
	return (
		(e = +e),
		(t = +t),
		function (n) {
			return r.setTime(e * (1 - n) + t * n), r;
		}
	);
}
function Wi(e, t) {
	return (
		(e = +e),
		(t = +t),
		function (r) {
			return e * (1 - r) + t * r;
		}
	);
}
function Ij(e, t) {
	var r = {},
		n = {},
		i;
	(e === null || typeof e != 'object') && (e = {}),
		(t === null || typeof t != 'object') && (t = {});
	for (i in t) i in e ? (r[i] = Hr(e[i], t[i])) : (n[i] = t[i]);
	return function (a) {
		for (i in r) n[i] = r[i](a);
		return n;
	};
}
var wu = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
	Po = new RegExp(wu.source, 'g');
function Nj(e) {
	return function () {
		return e;
	};
}
function kj(e) {
	return function (t) {
		return e(t) + '';
	};
}
function Dj(e, t) {
	var r = (wu.lastIndex = Po.lastIndex = 0),
		n,
		i,
		a,
		o = -1,
		u = [],
		c = [];
	for (e = e + '', t = t + ''; (n = wu.exec(e)) && (i = Po.exec(t)); )
		(a = i.index) > r &&
			((a = t.slice(r, a)), u[o] ? (u[o] += a) : (u[++o] = a)),
			(n = n[0]) === (i = i[0])
				? u[o]
					? (u[o] += i)
					: (u[++o] = i)
				: ((u[++o] = null), c.push({ i: o, x: Wi(n, i) })),
			(r = Po.lastIndex);
	return (
		r < t.length && ((a = t.slice(r)), u[o] ? (u[o] += a) : (u[++o] = a)),
		u.length < 2
			? c[0]
				? kj(c[0].x)
				: Nj(t)
			: ((t = c.length),
			  function (s) {
					for (var f = 0, l; f < t; ++f) u[(l = c[f]).i] = l.x(s);
					return u.join('');
			  })
	);
}
function Hr(e, t) {
	var r = typeof t,
		n;
	return t == null || r === 'boolean'
		? Uc(t)
		: (r === 'number'
				? Wi
				: r === 'string'
				? (n = _n(t))
					? ((t = n), af)
					: Dj
				: t instanceof _n
				? af
				: t instanceof Date
				? Cj
				: jj(t)
				? Ej
				: Array.isArray(t)
				? Mj
				: (typeof t.valueOf != 'function' && typeof t.toString != 'function') ||
				  isNaN(t)
				? Ij
				: Wi)(e, t);
}
function Wc(e, t) {
	return (
		(e = +e),
		(t = +t),
		function (r) {
			return Math.round(e * (1 - r) + t * r);
		}
	);
}
function Lj(e, t) {
	t === void 0 && ((t = e), (e = Hr));
	for (
		var r = 0, n = t.length - 1, i = t[0], a = new Array(n < 0 ? 0 : n);
		r < n;

	)
		a[r] = e(i, (i = t[++r]));
	return function (o) {
		var u = Math.max(0, Math.min(n - 1, Math.floor((o *= n))));
		return a[u](o - u);
	};
}
function Bj(e) {
	return function () {
		return e;
	};
}
function qi(e) {
	return +e;
}
var of = [0, 1];
function Ce(e) {
	return e;
}
function Ou(e, t) {
	return (t -= e = +e)
		? function (r) {
				return (r - e) / t;
		  }
		: Bj(isNaN(t) ? NaN : 0.5);
}
function Rj(e, t) {
	var r;
	return (
		e > t && ((r = e), (e = t), (t = r)),
		function (n) {
			return Math.max(e, Math.min(t, n));
		}
	);
}
function Fj(e, t, r) {
	var n = e[0],
		i = e[1],
		a = t[0],
		o = t[1];
	return (
		i < n ? ((n = Ou(i, n)), (a = r(o, a))) : ((n = Ou(n, i)), (a = r(a, o))),
		function (u) {
			return a(n(u));
		}
	);
}
function zj(e, t, r) {
	var n = Math.min(e.length, t.length) - 1,
		i = new Array(n),
		a = new Array(n),
		o = -1;
	for (
		e[n] < e[0] && ((e = e.slice().reverse()), (t = t.slice().reverse()));
		++o < n;

	)
		(i[o] = Ou(e[o], e[o + 1])), (a[o] = r(t[o], t[o + 1]));
	return function (u) {
		var c = ei(e, u, 1, n) - 1;
		return a[c](i[c](u));
	};
}
function ri(e, t) {
	return t
		.domain(e.domain())
		.range(e.range())
		.interpolate(e.interpolate())
		.clamp(e.clamp())
		.unknown(e.unknown());
}
function qa() {
	var e = of,
		t = of,
		r = Hr,
		n,
		i,
		a,
		o = Ce,
		u,
		c,
		s;
	function f() {
		var p = Math.min(e.length, t.length);
		return (
			o !== Ce && (o = Rj(e[0], e[p - 1])),
			(u = p > 2 ? zj : Fj),
			(c = s = null),
			l
		);
	}
	function l(p) {
		return p == null || isNaN((p = +p))
			? a
			: (c || (c = u(e.map(n), t, r)))(n(o(p)));
	}
	return (
		(l.invert = function (p) {
			return o(i((s || (s = u(t, e.map(n), Wi)))(p)));
		}),
		(l.domain = function (p) {
			return arguments.length ? ((e = Array.from(p, qi)), f()) : e.slice();
		}),
		(l.range = function (p) {
			return arguments.length ? ((t = Array.from(p)), f()) : t.slice();
		}),
		(l.rangeRound = function (p) {
			return (t = Array.from(p)), (r = Wc), f();
		}),
		(l.clamp = function (p) {
			return arguments.length ? ((o = p ? !0 : Ce), f()) : o !== Ce;
		}),
		(l.interpolate = function (p) {
			return arguments.length ? ((r = p), f()) : r;
		}),
		(l.unknown = function (p) {
			return arguments.length ? ((a = p), l) : a;
		}),
		function (p, h) {
			return (n = p), (i = h), f();
		}
	);
}
function qc() {
	return qa()(Ce, Ce);
}
function Uj(e) {
	return Math.abs((e = Math.round(e))) >= 1e21
		? e.toLocaleString('en').replace(/,/g, '')
		: e.toString(10);
}
function Gi(e, t) {
	if (
		(r = (e = t ? e.toExponential(t - 1) : e.toExponential()).indexOf('e')) < 0
	)
		return null;
	var r,
		n = e.slice(0, r);
	return [n.length > 1 ? n[0] + n.slice(2) : n, +e.slice(r + 1)];
}
function wr(e) {
	return (e = Gi(Math.abs(e))), e ? e[1] : NaN;
}
function Wj(e, t) {
	return function (r, n) {
		for (
			var i = r.length, a = [], o = 0, u = e[0], c = 0;
			i > 0 &&
			u > 0 &&
			(c + u + 1 > n && (u = Math.max(1, n - c)),
			a.push(r.substring((i -= u), i + u)),
			!((c += u + 1) > n));

		)
			u = e[(o = (o + 1) % e.length)];
		return a.reverse().join(t);
	};
}
function qj(e) {
	return function (t) {
		return t.replace(/[0-9]/g, function (r) {
			return e[+r];
		});
	};
}
var Gj =
	/^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function An(e) {
	if (!(t = Gj.exec(e))) throw new Error('invalid format: ' + e);
	var t;
	return new Gc({
		fill: t[1],
		align: t[2],
		sign: t[3],
		symbol: t[4],
		zero: t[5],
		width: t[6],
		comma: t[7],
		precision: t[8] && t[8].slice(1),
		trim: t[9],
		type: t[10],
	});
}
An.prototype = Gc.prototype;
function Gc(e) {
	(this.fill = e.fill === void 0 ? ' ' : e.fill + ''),
		(this.align = e.align === void 0 ? '>' : e.align + ''),
		(this.sign = e.sign === void 0 ? '-' : e.sign + ''),
		(this.symbol = e.symbol === void 0 ? '' : e.symbol + ''),
		(this.zero = !!e.zero),
		(this.width = e.width === void 0 ? void 0 : +e.width),
		(this.comma = !!e.comma),
		(this.precision = e.precision === void 0 ? void 0 : +e.precision),
		(this.trim = !!e.trim),
		(this.type = e.type === void 0 ? '' : e.type + '');
}
Gc.prototype.toString = function () {
	return (
		this.fill +
		this.align +
		this.sign +
		this.symbol +
		(this.zero ? '0' : '') +
		(this.width === void 0 ? '' : Math.max(1, this.width | 0)) +
		(this.comma ? ',' : '') +
		(this.precision === void 0 ? '' : '.' + Math.max(0, this.precision | 0)) +
		(this.trim ? '~' : '') +
		this.type
	);
};
function Hj(e) {
	e: for (var t = e.length, r = 1, n = -1, i; r < t; ++r)
		switch (e[r]) {
			case '.':
				n = i = r;
				break;
			case '0':
				n === 0 && (n = r), (i = r);
				break;
			default:
				if (!+e[r]) break e;
				n > 0 && (n = 0);
				break;
		}
	return n > 0 ? e.slice(0, n) + e.slice(i + 1) : e;
}
var Kd;
function Kj(e, t) {
	var r = Gi(e, t);
	if (!r) return e + '';
	var n = r[0],
		i = r[1],
		a = i - (Kd = Math.max(-8, Math.min(8, Math.floor(i / 3))) * 3) + 1,
		o = n.length;
	return a === o
		? n
		: a > o
		? n + new Array(a - o + 1).join('0')
		: a > 0
		? n.slice(0, a) + '.' + n.slice(a)
		: '0.' + new Array(1 - a).join('0') + Gi(e, Math.max(0, t + a - 1))[0];
}
function uf(e, t) {
	var r = Gi(e, t);
	if (!r) return e + '';
	var n = r[0],
		i = r[1];
	return i < 0
		? '0.' + new Array(-i).join('0') + n
		: n.length > i + 1
		? n.slice(0, i + 1) + '.' + n.slice(i + 1)
		: n + new Array(i - n.length + 2).join('0');
}
const cf = {
	'%': (e, t) => (e * 100).toFixed(t),
	b: (e) => Math.round(e).toString(2),
	c: (e) => e + '',
	d: Uj,
	e: (e, t) => e.toExponential(t),
	f: (e, t) => e.toFixed(t),
	g: (e, t) => e.toPrecision(t),
	o: (e) => Math.round(e).toString(8),
	p: (e, t) => uf(e * 100, t),
	r: uf,
	s: Kj,
	X: (e) => Math.round(e).toString(16).toUpperCase(),
	x: (e) => Math.round(e).toString(16),
};
function sf(e) {
	return e;
}
var lf = Array.prototype.map,
	ff = [
		'y',
		'z',
		'a',
		'f',
		'p',
		'n',
		'µ',
		'm',
		'',
		'k',
		'M',
		'G',
		'T',
		'P',
		'E',
		'Z',
		'Y',
	];
function Vj(e) {
	var t =
			e.grouping === void 0 || e.thousands === void 0
				? sf
				: Wj(lf.call(e.grouping, Number), e.thousands + ''),
		r = e.currency === void 0 ? '' : e.currency[0] + '',
		n = e.currency === void 0 ? '' : e.currency[1] + '',
		i = e.decimal === void 0 ? '.' : e.decimal + '',
		a = e.numerals === void 0 ? sf : qj(lf.call(e.numerals, String)),
		o = e.percent === void 0 ? '%' : e.percent + '',
		u = e.minus === void 0 ? '−' : e.minus + '',
		c = e.nan === void 0 ? 'NaN' : e.nan + '';
	function s(l) {
		l = An(l);
		var p = l.fill,
			h = l.align,
			d = l.sign,
			v = l.symbol,
			y = l.zero,
			b = l.width,
			w = l.comma,
			x = l.precision,
			S = l.trim,
			m = l.type;
		m === 'n'
			? ((w = !0), (m = 'g'))
			: cf[m] || (x === void 0 && (x = 12), (S = !0), (m = 'g')),
			(y || (p === '0' && h === '=')) && ((y = !0), (p = '0'), (h = '='));
		var g =
				v === '$'
					? r
					: v === '#' && /[boxX]/.test(m)
					? '0' + m.toLowerCase()
					: '',
			O = v === '$' ? n : /[%p]/.test(m) ? o : '',
			_ = cf[m],
			A = /[defgprs%]/.test(m);
		x =
			x === void 0
				? 6
				: /[gprs]/.test(m)
				? Math.max(1, Math.min(21, x))
				: Math.max(0, Math.min(20, x));
		function E(P) {
			var T = g,
				j = O,
				C,
				I,
				k;
			if (m === 'c') (j = _(P) + j), (P = '');
			else {
				P = +P;
				var D = P < 0 || 1 / P < 0;
				if (
					((P = isNaN(P) ? c : _(Math.abs(P), x)),
					S && (P = Hj(P)),
					D && +P == 0 && d !== '+' && (D = !1),
					(T = (D ? (d === '(' ? d : u) : d === '-' || d === '(' ? '' : d) + T),
					(j =
						(m === 's' ? ff[8 + Kd / 3] : '') +
						j +
						(D && d === '(' ? ')' : '')),
					A)
				) {
					for (C = -1, I = P.length; ++C < I; )
						if (((k = P.charCodeAt(C)), 48 > k || k > 57)) {
							(j = (k === 46 ? i + P.slice(C + 1) : P.slice(C)) + j),
								(P = P.slice(0, C));
							break;
						}
				}
			}
			w && !y && (P = t(P, 1 / 0));
			var B = T.length + P.length + j.length,
				F = B < b ? new Array(b - B + 1).join(p) : '';
			switch (
				(w && y && ((P = t(F + P, F.length ? b - j.length : 1 / 0)), (F = '')),
				h)
			) {
				case '<':
					P = T + P + j + F;
					break;
				case '=':
					P = T + F + P + j;
					break;
				case '^':
					P = F.slice(0, (B = F.length >> 1)) + T + P + j + F.slice(B);
					break;
				default:
					P = F + T + P + j;
					break;
			}
			return a(P);
		}
		return (
			(E.toString = function () {
				return l + '';
			}),
			E
		);
	}
	function f(l, p) {
		var h = s(((l = An(l)), (l.type = 'f'), l)),
			d = Math.max(-8, Math.min(8, Math.floor(wr(p) / 3))) * 3,
			v = Math.pow(10, -d),
			y = ff[8 + d / 3];
		return function (b) {
			return h(v * b) + y;
		};
	}
	return { format: s, formatPrefix: f };
}
var vi, Hc, Vd;
Xj({ thousands: ',', grouping: [3], currency: ['$', ''] });
function Xj(e) {
	return (vi = Vj(e)), (Hc = vi.format), (Vd = vi.formatPrefix), vi;
}
function Yj(e) {
	return Math.max(0, -wr(Math.abs(e)));
}
function Zj(e, t) {
	return Math.max(
		0,
		Math.max(-8, Math.min(8, Math.floor(wr(t) / 3))) * 3 - wr(Math.abs(e)),
	);
}
function Jj(e, t) {
	return (
		(e = Math.abs(e)), (t = Math.abs(t) - e), Math.max(0, wr(t) - wr(e)) + 1
	);
}
function Xd(e, t, r, n) {
	var i = gu(e, t, r),
		a;
	switch (((n = An(n ?? ',f')), n.type)) {
		case 's': {
			var o = Math.max(Math.abs(e), Math.abs(t));
			return (
				n.precision == null && !isNaN((a = Zj(i, o))) && (n.precision = a),
				Vd(n, o)
			);
		}
		case '':
		case 'e':
		case 'g':
		case 'p':
		case 'r': {
			n.precision == null &&
				!isNaN((a = Jj(i, Math.max(Math.abs(e), Math.abs(t))))) &&
				(n.precision = a - (n.type === 'e'));
			break;
		}
		case 'f':
		case '%': {
			n.precision == null &&
				!isNaN((a = Yj(i))) &&
				(n.precision = a - (n.type === '%') * 2);
			break;
		}
	}
	return Hc(n);
}
function Nt(e) {
	var t = e.domain;
	return (
		(e.ticks = function (r) {
			var n = t();
			return yu(n[0], n[n.length - 1], r ?? 10);
		}),
		(e.tickFormat = function (r, n) {
			var i = t();
			return Xd(i[0], i[i.length - 1], r ?? 10, n);
		}),
		(e.nice = function (r) {
			r == null && (r = 10);
			var n = t(),
				i = 0,
				a = n.length - 1,
				o = n[i],
				u = n[a],
				c,
				s,
				f = 10;
			for (
				u < o && ((s = o), (o = u), (u = s), (s = i), (i = a), (a = s));
				f-- > 0;

			) {
				if (((s = mu(o, u, r)), s === c)) return (n[i] = o), (n[a] = u), t(n);
				if (s > 0) (o = Math.floor(o / s) * s), (u = Math.ceil(u / s) * s);
				else if (s < 0) (o = Math.ceil(o * s) / s), (u = Math.floor(u * s) / s);
				else break;
				c = s;
			}
			return e;
		}),
		e
	);
}
function Hi() {
	var e = qc();
	return (
		(e.copy = function () {
			return ri(e, Hi());
		}),
		Ze.apply(e, arguments),
		Nt(e)
	);
}
function Yd(e) {
	var t;
	function r(n) {
		return n == null || isNaN((n = +n)) ? t : n;
	}
	return (
		(r.invert = r),
		(r.domain = r.range =
			function (n) {
				return arguments.length ? ((e = Array.from(n, qi)), r) : e.slice();
			}),
		(r.unknown = function (n) {
			return arguments.length ? ((t = n), r) : t;
		}),
		(r.copy = function () {
			return Yd(e).unknown(t);
		}),
		(e = arguments.length ? Array.from(e, qi) : [0, 1]),
		Nt(r)
	);
}
function Zd(e, t) {
	e = e.slice();
	var r = 0,
		n = e.length - 1,
		i = e[r],
		a = e[n],
		o;
	return (
		a < i && ((o = r), (r = n), (n = o), (o = i), (i = a), (a = o)),
		(e[r] = t.floor(i)),
		(e[n] = t.ceil(a)),
		e
	);
}
function pf(e) {
	return Math.log(e);
}
function hf(e) {
	return Math.exp(e);
}
function Qj(e) {
	return -Math.log(-e);
}
function eM(e) {
	return -Math.exp(-e);
}
function tM(e) {
	return isFinite(e) ? +('1e' + e) : e < 0 ? 0 : e;
}
function rM(e) {
	return e === 10 ? tM : e === Math.E ? Math.exp : (t) => Math.pow(e, t);
}
function nM(e) {
	return e === Math.E
		? Math.log
		: (e === 10 && Math.log10) ||
				(e === 2 && Math.log2) ||
				((e = Math.log(e)), (t) => Math.log(t) / e);
}
function df(e) {
	return (t, r) => -e(-t, r);
}
function Kc(e) {
	const t = e(pf, hf),
		r = t.domain;
	let n = 10,
		i,
		a;
	function o() {
		return (
			(i = nM(n)),
			(a = rM(n)),
			r()[0] < 0 ? ((i = df(i)), (a = df(a)), e(Qj, eM)) : e(pf, hf),
			t
		);
	}
	return (
		(t.base = function (u) {
			return arguments.length ? ((n = +u), o()) : n;
		}),
		(t.domain = function (u) {
			return arguments.length ? (r(u), o()) : r();
		}),
		(t.ticks = (u) => {
			const c = r();
			let s = c[0],
				f = c[c.length - 1];
			const l = f < s;
			l && ([s, f] = [f, s]);
			let p = i(s),
				h = i(f),
				d,
				v;
			const y = u == null ? 10 : +u;
			let b = [];
			if (!(n % 1) && h - p < y) {
				if (((p = Math.floor(p)), (h = Math.ceil(h)), s > 0)) {
					for (; p <= h; ++p)
						for (d = 1; d < n; ++d)
							if (((v = p < 0 ? d / a(-p) : d * a(p)), !(v < s))) {
								if (v > f) break;
								b.push(v);
							}
				} else
					for (; p <= h; ++p)
						for (d = n - 1; d >= 1; --d)
							if (((v = p > 0 ? d / a(-p) : d * a(p)), !(v < s))) {
								if (v > f) break;
								b.push(v);
							}
				b.length * 2 < y && (b = yu(s, f, y));
			} else b = yu(p, h, Math.min(h - p, y)).map(a);
			return l ? b.reverse() : b;
		}),
		(t.tickFormat = (u, c) => {
			if (
				(u == null && (u = 10),
				c == null && (c = n === 10 ? 's' : ','),
				typeof c != 'function' &&
					(!(n % 1) && (c = An(c)).precision == null && (c.trim = !0),
					(c = Hc(c))),
				u === 1 / 0)
			)
				return c;
			const s = Math.max(1, (n * u) / t.ticks().length);
			return (f) => {
				let l = f / a(Math.round(i(f)));
				return l * n < n - 0.5 && (l *= n), l <= s ? c(f) : '';
			};
		}),
		(t.nice = () =>
			r(
				Zd(r(), {
					floor: (u) => a(Math.floor(i(u))),
					ceil: (u) => a(Math.ceil(i(u))),
				}),
			)),
		t
	);
}
function Jd() {
	const e = Kc(qa()).domain([1, 10]);
	return (e.copy = () => ri(e, Jd()).base(e.base())), Ze.apply(e, arguments), e;
}
function vf(e) {
	return function (t) {
		return Math.sign(t) * Math.log1p(Math.abs(t / e));
	};
}
function yf(e) {
	return function (t) {
		return Math.sign(t) * Math.expm1(Math.abs(t)) * e;
	};
}
function Vc(e) {
	var t = 1,
		r = e(vf(t), yf(t));
	return (
		(r.constant = function (n) {
			return arguments.length ? e(vf((t = +n)), yf(t)) : t;
		}),
		Nt(r)
	);
}
function Qd() {
	var e = Vc(qa());
	return (
		(e.copy = function () {
			return ri(e, Qd()).constant(e.constant());
		}),
		Ze.apply(e, arguments)
	);
}
function mf(e) {
	return function (t) {
		return t < 0 ? -Math.pow(-t, e) : Math.pow(t, e);
	};
}
function iM(e) {
	return e < 0 ? -Math.sqrt(-e) : Math.sqrt(e);
}
function aM(e) {
	return e < 0 ? -e * e : e * e;
}
function Xc(e) {
	var t = e(Ce, Ce),
		r = 1;
	function n() {
		return r === 1 ? e(Ce, Ce) : r === 0.5 ? e(iM, aM) : e(mf(r), mf(1 / r));
	}
	return (
		(t.exponent = function (i) {
			return arguments.length ? ((r = +i), n()) : r;
		}),
		Nt(t)
	);
}
function Yc() {
	var e = Xc(qa());
	return (
		(e.copy = function () {
			return ri(e, Yc()).exponent(e.exponent());
		}),
		Ze.apply(e, arguments),
		e
	);
}
function oM() {
	return Yc.apply(null, arguments).exponent(0.5);
}
function gf(e) {
	return Math.sign(e) * e * e;
}
function uM(e) {
	return Math.sign(e) * Math.sqrt(Math.abs(e));
}
function ev() {
	var e = qc(),
		t = [0, 1],
		r = !1,
		n;
	function i(a) {
		var o = uM(e(a));
		return isNaN(o) ? n : r ? Math.round(o) : o;
	}
	return (
		(i.invert = function (a) {
			return e.invert(gf(a));
		}),
		(i.domain = function (a) {
			return arguments.length ? (e.domain(a), i) : e.domain();
		}),
		(i.range = function (a) {
			return arguments.length
				? (e.range((t = Array.from(a, qi)).map(gf)), i)
				: t.slice();
		}),
		(i.rangeRound = function (a) {
			return i.range(a).round(!0);
		}),
		(i.round = function (a) {
			return arguments.length ? ((r = !!a), i) : r;
		}),
		(i.clamp = function (a) {
			return arguments.length ? (e.clamp(a), i) : e.clamp();
		}),
		(i.unknown = function (a) {
			return arguments.length ? ((n = a), i) : n;
		}),
		(i.copy = function () {
			return ev(e.domain(), t).round(r).clamp(e.clamp()).unknown(n);
		}),
		Ze.apply(i, arguments),
		Nt(i)
	);
}
function tv() {
	var e = [],
		t = [],
		r = [],
		n;
	function i() {
		var o = 0,
			u = Math.max(1, t.length);
		for (r = new Array(u - 1); ++o < u; ) r[o - 1] = pj(e, o / u);
		return a;
	}
	function a(o) {
		return o == null || isNaN((o = +o)) ? n : t[ei(r, o)];
	}
	return (
		(a.invertExtent = function (o) {
			var u = t.indexOf(o);
			return u < 0
				? [NaN, NaN]
				: [u > 0 ? r[u - 1] : e[0], u < r.length ? r[u] : e[e.length - 1]];
		}),
		(a.domain = function (o) {
			if (!arguments.length) return e.slice();
			e = [];
			for (let u of o) u != null && !isNaN((u = +u)) && e.push(u);
			return e.sort(jt), i();
		}),
		(a.range = function (o) {
			return arguments.length ? ((t = Array.from(o)), i()) : t.slice();
		}),
		(a.unknown = function (o) {
			return arguments.length ? ((n = o), a) : n;
		}),
		(a.quantiles = function () {
			return r.slice();
		}),
		(a.copy = function () {
			return tv().domain(e).range(t).unknown(n);
		}),
		Ze.apply(a, arguments)
	);
}
function rv() {
	var e = 0,
		t = 1,
		r = 1,
		n = [0.5],
		i = [0, 1],
		a;
	function o(c) {
		return c != null && c <= c ? i[ei(n, c, 0, r)] : a;
	}
	function u() {
		var c = -1;
		for (n = new Array(r); ++c < r; )
			n[c] = ((c + 1) * t - (c - r) * e) / (r + 1);
		return o;
	}
	return (
		(o.domain = function (c) {
			return arguments.length
				? (([e, t] = c), (e = +e), (t = +t), u())
				: [e, t];
		}),
		(o.range = function (c) {
			return arguments.length
				? ((r = (i = Array.from(c)).length - 1), u())
				: i.slice();
		}),
		(o.invertExtent = function (c) {
			var s = i.indexOf(c);
			return s < 0
				? [NaN, NaN]
				: s < 1
				? [e, n[0]]
				: s >= r
				? [n[r - 1], t]
				: [n[s - 1], n[s]];
		}),
		(o.unknown = function (c) {
			return arguments.length && (a = c), o;
		}),
		(o.thresholds = function () {
			return n.slice();
		}),
		(o.copy = function () {
			return rv().domain([e, t]).range(i).unknown(a);
		}),
		Ze.apply(Nt(o), arguments)
	);
}
function nv() {
	var e = [0.5],
		t = [0, 1],
		r,
		n = 1;
	function i(a) {
		return a != null && a <= a ? t[ei(e, a, 0, n)] : r;
	}
	return (
		(i.domain = function (a) {
			return arguments.length
				? ((e = Array.from(a)), (n = Math.min(e.length, t.length - 1)), i)
				: e.slice();
		}),
		(i.range = function (a) {
			return arguments.length
				? ((t = Array.from(a)), (n = Math.min(e.length, t.length - 1)), i)
				: t.slice();
		}),
		(i.invertExtent = function (a) {
			var o = t.indexOf(a);
			return [e[o - 1], e[o]];
		}),
		(i.unknown = function (a) {
			return arguments.length ? ((r = a), i) : r;
		}),
		(i.copy = function () {
			return nv().domain(e).range(t).unknown(r);
		}),
		Ze.apply(i, arguments)
	);
}
const $o = new Date(),
	To = new Date();
function Se(e, t, r, n) {
	function i(a) {
		return e((a = arguments.length === 0 ? new Date() : new Date(+a))), a;
	}
	return (
		(i.floor = (a) => (e((a = new Date(+a))), a)),
		(i.ceil = (a) => (e((a = new Date(a - 1))), t(a, 1), e(a), a)),
		(i.round = (a) => {
			const o = i(a),
				u = i.ceil(a);
			return a - o < u - a ? o : u;
		}),
		(i.offset = (a, o) => (
			t((a = new Date(+a)), o == null ? 1 : Math.floor(o)), a
		)),
		(i.range = (a, o, u) => {
			const c = [];
			if (
				((a = i.ceil(a)),
				(u = u == null ? 1 : Math.floor(u)),
				!(a < o) || !(u > 0))
			)
				return c;
			let s;
			do c.push((s = new Date(+a))), t(a, u), e(a);
			while (s < a && a < o);
			return c;
		}),
		(i.filter = (a) =>
			Se(
				(o) => {
					if (o >= o) for (; e(o), !a(o); ) o.setTime(o - 1);
				},
				(o, u) => {
					if (o >= o)
						if (u < 0) for (; ++u <= 0; ) for (; t(o, -1), !a(o); );
						else for (; --u >= 0; ) for (; t(o, 1), !a(o); );
				},
			)),
		r &&
			((i.count = (a, o) => (
				$o.setTime(+a), To.setTime(+o), e($o), e(To), Math.floor(r($o, To))
			)),
			(i.every = (a) => (
				(a = Math.floor(a)),
				!isFinite(a) || !(a > 0)
					? null
					: a > 1
					? i.filter(n ? (o) => n(o) % a === 0 : (o) => i.count(0, o) % a === 0)
					: i
			))),
		i
	);
}
const Ki = Se(
	() => {},
	(e, t) => {
		e.setTime(+e + t);
	},
	(e, t) => t - e,
);
Ki.every = (e) => (
	(e = Math.floor(e)),
	!isFinite(e) || !(e > 0)
		? null
		: e > 1
		? Se(
				(t) => {
					t.setTime(Math.floor(t / e) * e);
				},
				(t, r) => {
					t.setTime(+t + r * e);
				},
				(t, r) => (r - t) / e,
		  )
		: Ki
);
Ki.range;
const pt = 1e3,
	He = pt * 60,
	ht = He * 60,
	mt = ht * 24,
	Zc = mt * 7,
	bf = mt * 30,
	Eo = mt * 365,
	Gt = Se(
		(e) => {
			e.setTime(e - e.getMilliseconds());
		},
		(e, t) => {
			e.setTime(+e + t * pt);
		},
		(e, t) => (t - e) / pt,
		(e) => e.getUTCSeconds(),
	);
Gt.range;
const Jc = Se(
	(e) => {
		e.setTime(e - e.getMilliseconds() - e.getSeconds() * pt);
	},
	(e, t) => {
		e.setTime(+e + t * He);
	},
	(e, t) => (t - e) / He,
	(e) => e.getMinutes(),
);
Jc.range;
const Qc = Se(
	(e) => {
		e.setUTCSeconds(0, 0);
	},
	(e, t) => {
		e.setTime(+e + t * He);
	},
	(e, t) => (t - e) / He,
	(e) => e.getUTCMinutes(),
);
Qc.range;
const es = Se(
	(e) => {
		e.setTime(
			e - e.getMilliseconds() - e.getSeconds() * pt - e.getMinutes() * He,
		);
	},
	(e, t) => {
		e.setTime(+e + t * ht);
	},
	(e, t) => (t - e) / ht,
	(e) => e.getHours(),
);
es.range;
const ts = Se(
	(e) => {
		e.setUTCMinutes(0, 0, 0);
	},
	(e, t) => {
		e.setTime(+e + t * ht);
	},
	(e, t) => (t - e) / ht,
	(e) => e.getUTCHours(),
);
ts.range;
const ni = Se(
	(e) => e.setHours(0, 0, 0, 0),
	(e, t) => e.setDate(e.getDate() + t),
	(e, t) => (t - e - (t.getTimezoneOffset() - e.getTimezoneOffset()) * He) / mt,
	(e) => e.getDate() - 1,
);
ni.range;
const Ga = Se(
	(e) => {
		e.setUTCHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setUTCDate(e.getUTCDate() + t);
	},
	(e, t) => (t - e) / mt,
	(e) => e.getUTCDate() - 1,
);
Ga.range;
const iv = Se(
	(e) => {
		e.setUTCHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setUTCDate(e.getUTCDate() + t);
	},
	(e, t) => (t - e) / mt,
	(e) => Math.floor(e / mt),
);
iv.range;
function tr(e) {
	return Se(
		(t) => {
			t.setDate(t.getDate() - ((t.getDay() + 7 - e) % 7)),
				t.setHours(0, 0, 0, 0);
		},
		(t, r) => {
			t.setDate(t.getDate() + r * 7);
		},
		(t, r) =>
			(r - t - (r.getTimezoneOffset() - t.getTimezoneOffset()) * He) / Zc,
	);
}
const Ha = tr(0),
	Vi = tr(1),
	cM = tr(2),
	sM = tr(3),
	Or = tr(4),
	lM = tr(5),
	fM = tr(6);
Ha.range;
Vi.range;
cM.range;
sM.range;
Or.range;
lM.range;
fM.range;
function rr(e) {
	return Se(
		(t) => {
			t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 7 - e) % 7)),
				t.setUTCHours(0, 0, 0, 0);
		},
		(t, r) => {
			t.setUTCDate(t.getUTCDate() + r * 7);
		},
		(t, r) => (r - t) / Zc,
	);
}
const Ka = rr(0),
	Xi = rr(1),
	pM = rr(2),
	hM = rr(3),
	Sr = rr(4),
	dM = rr(5),
	vM = rr(6);
Ka.range;
Xi.range;
pM.range;
hM.range;
Sr.range;
dM.range;
vM.range;
const rs = Se(
	(e) => {
		e.setDate(1), e.setHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setMonth(e.getMonth() + t);
	},
	(e, t) =>
		t.getMonth() - e.getMonth() + (t.getFullYear() - e.getFullYear()) * 12,
	(e) => e.getMonth(),
);
rs.range;
const ns = Se(
	(e) => {
		e.setUTCDate(1), e.setUTCHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setUTCMonth(e.getUTCMonth() + t);
	},
	(e, t) =>
		t.getUTCMonth() -
		e.getUTCMonth() +
		(t.getUTCFullYear() - e.getUTCFullYear()) * 12,
	(e) => e.getUTCMonth(),
);
ns.range;
const gt = Se(
	(e) => {
		e.setMonth(0, 1), e.setHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setFullYear(e.getFullYear() + t);
	},
	(e, t) => t.getFullYear() - e.getFullYear(),
	(e) => e.getFullYear(),
);
gt.every = (e) =>
	!isFinite((e = Math.floor(e))) || !(e > 0)
		? null
		: Se(
				(t) => {
					t.setFullYear(Math.floor(t.getFullYear() / e) * e),
						t.setMonth(0, 1),
						t.setHours(0, 0, 0, 0);
				},
				(t, r) => {
					t.setFullYear(t.getFullYear() + r * e);
				},
		  );
gt.range;
const bt = Se(
	(e) => {
		e.setUTCMonth(0, 1), e.setUTCHours(0, 0, 0, 0);
	},
	(e, t) => {
		e.setUTCFullYear(e.getUTCFullYear() + t);
	},
	(e, t) => t.getUTCFullYear() - e.getUTCFullYear(),
	(e) => e.getUTCFullYear(),
);
bt.every = (e) =>
	!isFinite((e = Math.floor(e))) || !(e > 0)
		? null
		: Se(
				(t) => {
					t.setUTCFullYear(Math.floor(t.getUTCFullYear() / e) * e),
						t.setUTCMonth(0, 1),
						t.setUTCHours(0, 0, 0, 0);
				},
				(t, r) => {
					t.setUTCFullYear(t.getUTCFullYear() + r * e);
				},
		  );
bt.range;
function av(e, t, r, n, i, a) {
	const o = [
		[Gt, 1, pt],
		[Gt, 5, 5 * pt],
		[Gt, 15, 15 * pt],
		[Gt, 30, 30 * pt],
		[a, 1, He],
		[a, 5, 5 * He],
		[a, 15, 15 * He],
		[a, 30, 30 * He],
		[i, 1, ht],
		[i, 3, 3 * ht],
		[i, 6, 6 * ht],
		[i, 12, 12 * ht],
		[n, 1, mt],
		[n, 2, 2 * mt],
		[r, 1, Zc],
		[t, 1, bf],
		[t, 3, 3 * bf],
		[e, 1, Eo],
	];
	function u(s, f, l) {
		const p = f < s;
		p && ([s, f] = [f, s]);
		const h = l && typeof l.range == 'function' ? l : c(s, f, l),
			d = h ? h.range(s, +f + 1) : [];
		return p ? d.reverse() : d;
	}
	function c(s, f, l) {
		const p = Math.abs(f - s) / l,
			h = Rc(([, , y]) => y).right(o, p);
		if (h === o.length) return e.every(gu(s / Eo, f / Eo, l));
		if (h === 0) return Ki.every(Math.max(gu(s, f, l), 1));
		const [d, v] = o[p / o[h - 1][2] < o[h][2] / p ? h - 1 : h];
		return d.every(v);
	}
	return [u, c];
}
const [yM, mM] = av(bt, ns, Ka, iv, ts, Qc),
	[gM, bM] = av(gt, rs, Ha, ni, es, Jc);
function jo(e) {
	if (0 <= e.y && e.y < 100) {
		var t = new Date(-1, e.m, e.d, e.H, e.M, e.S, e.L);
		return t.setFullYear(e.y), t;
	}
	return new Date(e.y, e.m, e.d, e.H, e.M, e.S, e.L);
}
function Mo(e) {
	if (0 <= e.y && e.y < 100) {
		var t = new Date(Date.UTC(-1, e.m, e.d, e.H, e.M, e.S, e.L));
		return t.setUTCFullYear(e.y), t;
	}
	return new Date(Date.UTC(e.y, e.m, e.d, e.H, e.M, e.S, e.L));
}
function tn(e, t, r) {
	return { y: e, m: t, d: r, H: 0, M: 0, S: 0, L: 0 };
}
function xM(e) {
	var t = e.dateTime,
		r = e.date,
		n = e.time,
		i = e.periods,
		a = e.days,
		o = e.shortDays,
		u = e.months,
		c = e.shortMonths,
		s = rn(i),
		f = nn(i),
		l = rn(a),
		p = nn(a),
		h = rn(o),
		d = nn(o),
		v = rn(u),
		y = nn(u),
		b = rn(c),
		w = nn(c),
		x = {
			a: D,
			A: B,
			b: F,
			B: H,
			c: null,
			d: Af,
			e: Af,
			f: WM,
			g: QM,
			G: tC,
			H: FM,
			I: zM,
			j: UM,
			L: ov,
			m: qM,
			M: GM,
			p: V,
			q: G,
			Q: Tf,
			s: Ef,
			S: HM,
			u: KM,
			U: VM,
			V: XM,
			w: YM,
			W: ZM,
			x: null,
			X: null,
			y: JM,
			Y: eC,
			Z: rC,
			'%': $f,
		},
		S = {
			a: X,
			A: ce,
			b: ye,
			B: Le,
			c: null,
			d: Pf,
			e: Pf,
			f: oC,
			g: yC,
			G: gC,
			H: nC,
			I: iC,
			j: aC,
			L: cv,
			m: uC,
			M: cC,
			p: Lt,
			q: Ie,
			Q: Tf,
			s: Ef,
			S: sC,
			u: lC,
			U: fC,
			V: pC,
			w: hC,
			W: dC,
			x: null,
			X: null,
			y: vC,
			Y: mC,
			Z: bC,
			'%': $f,
		},
		m = {
			a: E,
			A: P,
			b: T,
			B: j,
			c: C,
			d: Sf,
			e: Sf,
			f: DM,
			g: Of,
			G: wf,
			H: _f,
			I: _f,
			j: CM,
			L: kM,
			m: MM,
			M: IM,
			p: A,
			q: jM,
			Q: BM,
			s: RM,
			S: NM,
			u: AM,
			U: PM,
			V: $M,
			w: _M,
			W: TM,
			x: I,
			X: k,
			y: Of,
			Y: wf,
			Z: EM,
			'%': LM,
		};
	(x.x = g(r, x)),
		(x.X = g(n, x)),
		(x.c = g(t, x)),
		(S.x = g(r, S)),
		(S.X = g(n, S)),
		(S.c = g(t, S));
	function g(W, Y) {
		return function (Z) {
			var N = [],
				he = -1,
				te = 0,
				be = W.length,
				xe,
				Ne,
				_t;
			for (Z instanceof Date || (Z = new Date(+Z)); ++he < be; )
				W.charCodeAt(he) === 37 &&
					(N.push(W.slice(te, he)),
					(Ne = xf[(xe = W.charAt(++he))]) != null
						? (xe = W.charAt(++he))
						: (Ne = xe === 'e' ? ' ' : '0'),
					(_t = Y[xe]) && (xe = _t(Z, Ne)),
					N.push(xe),
					(te = he + 1));
			return N.push(W.slice(te, he)), N.join('');
		};
	}
	function O(W, Y) {
		return function (Z) {
			var N = tn(1900, void 0, 1),
				he = _(N, W, (Z += ''), 0),
				te,
				be;
			if (he != Z.length) return null;
			if ('Q' in N) return new Date(N.Q);
			if ('s' in N) return new Date(N.s * 1e3 + ('L' in N ? N.L : 0));
			if (
				(Y && !('Z' in N) && (N.Z = 0),
				'p' in N && (N.H = (N.H % 12) + N.p * 12),
				N.m === void 0 && (N.m = 'q' in N ? N.q : 0),
				'V' in N)
			) {
				if (N.V < 1 || N.V > 53) return null;
				'w' in N || (N.w = 1),
					'Z' in N
						? ((te = Mo(tn(N.y, 0, 1))),
						  (be = te.getUTCDay()),
						  (te = be > 4 || be === 0 ? Xi.ceil(te) : Xi(te)),
						  (te = Ga.offset(te, (N.V - 1) * 7)),
						  (N.y = te.getUTCFullYear()),
						  (N.m = te.getUTCMonth()),
						  (N.d = te.getUTCDate() + ((N.w + 6) % 7)))
						: ((te = jo(tn(N.y, 0, 1))),
						  (be = te.getDay()),
						  (te = be > 4 || be === 0 ? Vi.ceil(te) : Vi(te)),
						  (te = ni.offset(te, (N.V - 1) * 7)),
						  (N.y = te.getFullYear()),
						  (N.m = te.getMonth()),
						  (N.d = te.getDate() + ((N.w + 6) % 7)));
			} else
				('W' in N || 'U' in N) &&
					('w' in N || (N.w = 'u' in N ? N.u % 7 : 'W' in N ? 1 : 0),
					(be =
						'Z' in N
							? Mo(tn(N.y, 0, 1)).getUTCDay()
							: jo(tn(N.y, 0, 1)).getDay()),
					(N.m = 0),
					(N.d =
						'W' in N
							? ((N.w + 6) % 7) + N.W * 7 - ((be + 5) % 7)
							: N.w + N.U * 7 - ((be + 6) % 7)));
			return 'Z' in N
				? ((N.H += (N.Z / 100) | 0), (N.M += N.Z % 100), Mo(N))
				: jo(N);
		};
	}
	function _(W, Y, Z, N) {
		for (var he = 0, te = Y.length, be = Z.length, xe, Ne; he < te; ) {
			if (N >= be) return -1;
			if (((xe = Y.charCodeAt(he++)), xe === 37)) {
				if (
					((xe = Y.charAt(he++)),
					(Ne = m[xe in xf ? Y.charAt(he++) : xe]),
					!Ne || (N = Ne(W, Z, N)) < 0)
				)
					return -1;
			} else if (xe != Z.charCodeAt(N++)) return -1;
		}
		return N;
	}
	function A(W, Y, Z) {
		var N = s.exec(Y.slice(Z));
		return N ? ((W.p = f.get(N[0].toLowerCase())), Z + N[0].length) : -1;
	}
	function E(W, Y, Z) {
		var N = h.exec(Y.slice(Z));
		return N ? ((W.w = d.get(N[0].toLowerCase())), Z + N[0].length) : -1;
	}
	function P(W, Y, Z) {
		var N = l.exec(Y.slice(Z));
		return N ? ((W.w = p.get(N[0].toLowerCase())), Z + N[0].length) : -1;
	}
	function T(W, Y, Z) {
		var N = b.exec(Y.slice(Z));
		return N ? ((W.m = w.get(N[0].toLowerCase())), Z + N[0].length) : -1;
	}
	function j(W, Y, Z) {
		var N = v.exec(Y.slice(Z));
		return N ? ((W.m = y.get(N[0].toLowerCase())), Z + N[0].length) : -1;
	}
	function C(W, Y, Z) {
		return _(W, t, Y, Z);
	}
	function I(W, Y, Z) {
		return _(W, r, Y, Z);
	}
	function k(W, Y, Z) {
		return _(W, n, Y, Z);
	}
	function D(W) {
		return o[W.getDay()];
	}
	function B(W) {
		return a[W.getDay()];
	}
	function F(W) {
		return c[W.getMonth()];
	}
	function H(W) {
		return u[W.getMonth()];
	}
	function V(W) {
		return i[+(W.getHours() >= 12)];
	}
	function G(W) {
		return 1 + ~~(W.getMonth() / 3);
	}
	function X(W) {
		return o[W.getUTCDay()];
	}
	function ce(W) {
		return a[W.getUTCDay()];
	}
	function ye(W) {
		return c[W.getUTCMonth()];
	}
	function Le(W) {
		return u[W.getUTCMonth()];
	}
	function Lt(W) {
		return i[+(W.getUTCHours() >= 12)];
	}
	function Ie(W) {
		return 1 + ~~(W.getUTCMonth() / 3);
	}
	return {
		format: function (W) {
			var Y = g((W += ''), x);
			return (
				(Y.toString = function () {
					return W;
				}),
				Y
			);
		},
		parse: function (W) {
			var Y = O((W += ''), !1);
			return (
				(Y.toString = function () {
					return W;
				}),
				Y
			);
		},
		utcFormat: function (W) {
			var Y = g((W += ''), S);
			return (
				(Y.toString = function () {
					return W;
				}),
				Y
			);
		},
		utcParse: function (W) {
			var Y = O((W += ''), !0);
			return (
				(Y.toString = function () {
					return W;
				}),
				Y
			);
		},
	};
}
var xf = { '-': '', _: ' ', 0: '0' },
	Ae = /^\s*\d+/,
	wM = /^%/,
	OM = /[\\^$*+?|[\]().{}]/g;
function re(e, t, r) {
	var n = e < 0 ? '-' : '',
		i = (n ? -e : e) + '',
		a = i.length;
	return n + (a < r ? new Array(r - a + 1).join(t) + i : i);
}
function SM(e) {
	return e.replace(OM, '\\$&');
}
function rn(e) {
	return new RegExp('^(?:' + e.map(SM).join('|') + ')', 'i');
}
function nn(e) {
	return new Map(e.map((t, r) => [t.toLowerCase(), r]));
}
function _M(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 1));
	return n ? ((e.w = +n[0]), r + n[0].length) : -1;
}
function AM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 1));
	return n ? ((e.u = +n[0]), r + n[0].length) : -1;
}
function PM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.U = +n[0]), r + n[0].length) : -1;
}
function $M(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.V = +n[0]), r + n[0].length) : -1;
}
function TM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.W = +n[0]), r + n[0].length) : -1;
}
function wf(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 4));
	return n ? ((e.y = +n[0]), r + n[0].length) : -1;
}
function Of(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.y = +n[0] + (+n[0] > 68 ? 1900 : 2e3)), r + n[0].length) : -1;
}
function EM(e, t, r) {
	var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(t.slice(r, r + 6));
	return n
		? ((e.Z = n[1] ? 0 : -(n[2] + (n[3] || '00'))), r + n[0].length)
		: -1;
}
function jM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 1));
	return n ? ((e.q = n[0] * 3 - 3), r + n[0].length) : -1;
}
function MM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.m = n[0] - 1), r + n[0].length) : -1;
}
function Sf(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.d = +n[0]), r + n[0].length) : -1;
}
function CM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 3));
	return n ? ((e.m = 0), (e.d = +n[0]), r + n[0].length) : -1;
}
function _f(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.H = +n[0]), r + n[0].length) : -1;
}
function IM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.M = +n[0]), r + n[0].length) : -1;
}
function NM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 2));
	return n ? ((e.S = +n[0]), r + n[0].length) : -1;
}
function kM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 3));
	return n ? ((e.L = +n[0]), r + n[0].length) : -1;
}
function DM(e, t, r) {
	var n = Ae.exec(t.slice(r, r + 6));
	return n ? ((e.L = Math.floor(n[0] / 1e3)), r + n[0].length) : -1;
}
function LM(e, t, r) {
	var n = wM.exec(t.slice(r, r + 1));
	return n ? r + n[0].length : -1;
}
function BM(e, t, r) {
	var n = Ae.exec(t.slice(r));
	return n ? ((e.Q = +n[0]), r + n[0].length) : -1;
}
function RM(e, t, r) {
	var n = Ae.exec(t.slice(r));
	return n ? ((e.s = +n[0]), r + n[0].length) : -1;
}
function Af(e, t) {
	return re(e.getDate(), t, 2);
}
function FM(e, t) {
	return re(e.getHours(), t, 2);
}
function zM(e, t) {
	return re(e.getHours() % 12 || 12, t, 2);
}
function UM(e, t) {
	return re(1 + ni.count(gt(e), e), t, 3);
}
function ov(e, t) {
	return re(e.getMilliseconds(), t, 3);
}
function WM(e, t) {
	return ov(e, t) + '000';
}
function qM(e, t) {
	return re(e.getMonth() + 1, t, 2);
}
function GM(e, t) {
	return re(e.getMinutes(), t, 2);
}
function HM(e, t) {
	return re(e.getSeconds(), t, 2);
}
function KM(e) {
	var t = e.getDay();
	return t === 0 ? 7 : t;
}
function VM(e, t) {
	return re(Ha.count(gt(e) - 1, e), t, 2);
}
function uv(e) {
	var t = e.getDay();
	return t >= 4 || t === 0 ? Or(e) : Or.ceil(e);
}
function XM(e, t) {
	return (e = uv(e)), re(Or.count(gt(e), e) + (gt(e).getDay() === 4), t, 2);
}
function YM(e) {
	return e.getDay();
}
function ZM(e, t) {
	return re(Vi.count(gt(e) - 1, e), t, 2);
}
function JM(e, t) {
	return re(e.getFullYear() % 100, t, 2);
}
function QM(e, t) {
	return (e = uv(e)), re(e.getFullYear() % 100, t, 2);
}
function eC(e, t) {
	return re(e.getFullYear() % 1e4, t, 4);
}
function tC(e, t) {
	var r = e.getDay();
	return (
		(e = r >= 4 || r === 0 ? Or(e) : Or.ceil(e)),
		re(e.getFullYear() % 1e4, t, 4)
	);
}
function rC(e) {
	var t = e.getTimezoneOffset();
	return (
		(t > 0 ? '-' : ((t *= -1), '+')) +
		re((t / 60) | 0, '0', 2) +
		re(t % 60, '0', 2)
	);
}
function Pf(e, t) {
	return re(e.getUTCDate(), t, 2);
}
function nC(e, t) {
	return re(e.getUTCHours(), t, 2);
}
function iC(e, t) {
	return re(e.getUTCHours() % 12 || 12, t, 2);
}
function aC(e, t) {
	return re(1 + Ga.count(bt(e), e), t, 3);
}
function cv(e, t) {
	return re(e.getUTCMilliseconds(), t, 3);
}
function oC(e, t) {
	return cv(e, t) + '000';
}
function uC(e, t) {
	return re(e.getUTCMonth() + 1, t, 2);
}
function cC(e, t) {
	return re(e.getUTCMinutes(), t, 2);
}
function sC(e, t) {
	return re(e.getUTCSeconds(), t, 2);
}
function lC(e) {
	var t = e.getUTCDay();
	return t === 0 ? 7 : t;
}
function fC(e, t) {
	return re(Ka.count(bt(e) - 1, e), t, 2);
}
function sv(e) {
	var t = e.getUTCDay();
	return t >= 4 || t === 0 ? Sr(e) : Sr.ceil(e);
}
function pC(e, t) {
	return (e = sv(e)), re(Sr.count(bt(e), e) + (bt(e).getUTCDay() === 4), t, 2);
}
function hC(e) {
	return e.getUTCDay();
}
function dC(e, t) {
	return re(Xi.count(bt(e) - 1, e), t, 2);
}
function vC(e, t) {
	return re(e.getUTCFullYear() % 100, t, 2);
}
function yC(e, t) {
	return (e = sv(e)), re(e.getUTCFullYear() % 100, t, 2);
}
function mC(e, t) {
	return re(e.getUTCFullYear() % 1e4, t, 4);
}
function gC(e, t) {
	var r = e.getUTCDay();
	return (
		(e = r >= 4 || r === 0 ? Sr(e) : Sr.ceil(e)),
		re(e.getUTCFullYear() % 1e4, t, 4)
	);
}
function bC() {
	return '+0000';
}
function $f() {
	return '%';
}
function Tf(e) {
	return +e;
}
function Ef(e) {
	return Math.floor(+e / 1e3);
}
var ar, lv, fv;
xC({
	dateTime: '%x, %X',
	date: '%-m/%-d/%Y',
	time: '%-I:%M:%S %p',
	periods: ['AM', 'PM'],
	days: [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	],
	shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	months: [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	],
	shortMonths: [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	],
});
function xC(e) {
	return (
		(ar = xM(e)),
		(lv = ar.format),
		ar.parse,
		(fv = ar.utcFormat),
		ar.utcParse,
		ar
	);
}
function wC(e) {
	return new Date(e);
}
function OC(e) {
	return e instanceof Date ? +e : +new Date(+e);
}
function is(e, t, r, n, i, a, o, u, c, s) {
	var f = qc(),
		l = f.invert,
		p = f.domain,
		h = s('.%L'),
		d = s(':%S'),
		v = s('%I:%M'),
		y = s('%I %p'),
		b = s('%a %d'),
		w = s('%b %d'),
		x = s('%B'),
		S = s('%Y');
	function m(g) {
		return (
			c(g) < g
				? h
				: u(g) < g
				? d
				: o(g) < g
				? v
				: a(g) < g
				? y
				: n(g) < g
				? i(g) < g
					? b
					: w
				: r(g) < g
				? x
				: S
		)(g);
	}
	return (
		(f.invert = function (g) {
			return new Date(l(g));
		}),
		(f.domain = function (g) {
			return arguments.length ? p(Array.from(g, OC)) : p().map(wC);
		}),
		(f.ticks = function (g) {
			var O = p();
			return e(O[0], O[O.length - 1], g ?? 10);
		}),
		(f.tickFormat = function (g, O) {
			return O == null ? m : s(O);
		}),
		(f.nice = function (g) {
			var O = p();
			return (
				(!g || typeof g.range != 'function') &&
					(g = t(O[0], O[O.length - 1], g ?? 10)),
				g ? p(Zd(O, g)) : f
			);
		}),
		(f.copy = function () {
			return ri(f, is(e, t, r, n, i, a, o, u, c, s));
		}),
		f
	);
}
function SC() {
	return Ze.apply(
		is(gM, bM, gt, rs, Ha, ni, es, Jc, Gt, lv).domain([
			new Date(2e3, 0, 1),
			new Date(2e3, 0, 2),
		]),
		arguments,
	);
}
function _C() {
	return Ze.apply(
		is(yM, mM, bt, ns, Ka, Ga, ts, Qc, Gt, fv).domain([
			Date.UTC(2e3, 0, 1),
			Date.UTC(2e3, 0, 2),
		]),
		arguments,
	);
}
function Va() {
	var e = 0,
		t = 1,
		r,
		n,
		i,
		a,
		o = Ce,
		u = !1,
		c;
	function s(l) {
		return l == null || isNaN((l = +l))
			? c
			: o(
					i === 0
						? 0.5
						: ((l = (a(l) - r) * i), u ? Math.max(0, Math.min(1, l)) : l),
			  );
	}
	(s.domain = function (l) {
		return arguments.length
			? (([e, t] = l),
			  (r = a((e = +e))),
			  (n = a((t = +t))),
			  (i = r === n ? 0 : 1 / (n - r)),
			  s)
			: [e, t];
	}),
		(s.clamp = function (l) {
			return arguments.length ? ((u = !!l), s) : u;
		}),
		(s.interpolator = function (l) {
			return arguments.length ? ((o = l), s) : o;
		});
	function f(l) {
		return function (p) {
			var h, d;
			return arguments.length ? (([h, d] = p), (o = l(h, d)), s) : [o(0), o(1)];
		};
	}
	return (
		(s.range = f(Hr)),
		(s.rangeRound = f(Wc)),
		(s.unknown = function (l) {
			return arguments.length ? ((c = l), s) : c;
		}),
		function (l) {
			return (
				(a = l), (r = l(e)), (n = l(t)), (i = r === n ? 0 : 1 / (n - r)), s
			);
		}
	);
}
function kt(e, t) {
	return t
		.domain(e.domain())
		.interpolator(e.interpolator())
		.clamp(e.clamp())
		.unknown(e.unknown());
}
function pv() {
	var e = Nt(Va()(Ce));
	return (
		(e.copy = function () {
			return kt(e, pv());
		}),
		St.apply(e, arguments)
	);
}
function hv() {
	var e = Kc(Va()).domain([1, 10]);
	return (
		(e.copy = function () {
			return kt(e, hv()).base(e.base());
		}),
		St.apply(e, arguments)
	);
}
function dv() {
	var e = Vc(Va());
	return (
		(e.copy = function () {
			return kt(e, dv()).constant(e.constant());
		}),
		St.apply(e, arguments)
	);
}
function as() {
	var e = Xc(Va());
	return (
		(e.copy = function () {
			return kt(e, as()).exponent(e.exponent());
		}),
		St.apply(e, arguments)
	);
}
function AC() {
	return as.apply(null, arguments).exponent(0.5);
}
function vv() {
	var e = [],
		t = Ce;
	function r(n) {
		if (n != null && !isNaN((n = +n)))
			return t((ei(e, n, 1) - 1) / (e.length - 1));
	}
	return (
		(r.domain = function (n) {
			if (!arguments.length) return e.slice();
			e = [];
			for (let i of n) i != null && !isNaN((i = +i)) && e.push(i);
			return e.sort(jt), r;
		}),
		(r.interpolator = function (n) {
			return arguments.length ? ((t = n), r) : t;
		}),
		(r.range = function () {
			return e.map((n, i) => t(i / (e.length - 1)));
		}),
		(r.quantiles = function (n) {
			return Array.from({ length: n + 1 }, (i, a) => fj(e, a / n));
		}),
		(r.copy = function () {
			return vv(t).domain(e);
		}),
		St.apply(r, arguments)
	);
}
function Xa() {
	var e = 0,
		t = 0.5,
		r = 1,
		n = 1,
		i,
		a,
		o,
		u,
		c,
		s = Ce,
		f,
		l = !1,
		p;
	function h(v) {
		return isNaN((v = +v))
			? p
			: ((v = 0.5 + ((v = +f(v)) - a) * (n * v < n * a ? u : c)),
			  s(l ? Math.max(0, Math.min(1, v)) : v));
	}
	(h.domain = function (v) {
		return arguments.length
			? (([e, t, r] = v),
			  (i = f((e = +e))),
			  (a = f((t = +t))),
			  (o = f((r = +r))),
			  (u = i === a ? 0 : 0.5 / (a - i)),
			  (c = a === o ? 0 : 0.5 / (o - a)),
			  (n = a < i ? -1 : 1),
			  h)
			: [e, t, r];
	}),
		(h.clamp = function (v) {
			return arguments.length ? ((l = !!v), h) : l;
		}),
		(h.interpolator = function (v) {
			return arguments.length ? ((s = v), h) : s;
		});
	function d(v) {
		return function (y) {
			var b, w, x;
			return arguments.length
				? (([b, w, x] = y), (s = Lj(v, [b, w, x])), h)
				: [s(0), s(0.5), s(1)];
		};
	}
	return (
		(h.range = d(Hr)),
		(h.rangeRound = d(Wc)),
		(h.unknown = function (v) {
			return arguments.length ? ((p = v), h) : p;
		}),
		function (v) {
			return (
				(f = v),
				(i = v(e)),
				(a = v(t)),
				(o = v(r)),
				(u = i === a ? 0 : 0.5 / (a - i)),
				(c = a === o ? 0 : 0.5 / (o - a)),
				(n = a < i ? -1 : 1),
				h
			);
		}
	);
}
function yv() {
	var e = Nt(Xa()(Ce));
	return (
		(e.copy = function () {
			return kt(e, yv());
		}),
		St.apply(e, arguments)
	);
}
function mv() {
	var e = Kc(Xa()).domain([0.1, 1, 10]);
	return (
		(e.copy = function () {
			return kt(e, mv()).base(e.base());
		}),
		St.apply(e, arguments)
	);
}
function gv() {
	var e = Vc(Xa());
	return (
		(e.copy = function () {
			return kt(e, gv()).constant(e.constant());
		}),
		St.apply(e, arguments)
	);
}
function os() {
	var e = Xc(Xa());
	return (
		(e.copy = function () {
			return kt(e, os()).exponent(e.exponent());
		}),
		St.apply(e, arguments)
	);
}
function PC() {
	return os.apply(null, arguments).exponent(0.5);
}
const jf = Object.freeze(
	Object.defineProperty(
		{
			__proto__: null,
			scaleBand: wn,
			scaleDiverging: yv,
			scaleDivergingLog: mv,
			scaleDivergingPow: os,
			scaleDivergingSqrt: PC,
			scaleDivergingSymlog: gv,
			scaleIdentity: Yd,
			scaleImplicit: bu,
			scaleLinear: Hi,
			scaleLog: Jd,
			scaleOrdinal: Fc,
			scalePoint: fn,
			scalePow: Yc,
			scaleQuantile: tv,
			scaleQuantize: rv,
			scaleRadial: ev,
			scaleSequential: pv,
			scaleSequentialLog: hv,
			scaleSequentialPow: as,
			scaleSequentialQuantile: vv,
			scaleSequentialSqrt: AC,
			scaleSequentialSymlog: dv,
			scaleSqrt: oM,
			scaleSymlog: Qd,
			scaleThreshold: nv,
			scaleTime: SC,
			scaleUtc: _C,
			tickFormat: Xd,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
);
var $C = Br;
function TC(e, t, r) {
	for (var n = -1, i = e.length; ++n < i; ) {
		var a = e[n],
			o = t(a);
		if (o != null && (u === void 0 ? o === o && !$C(o) : r(o, u)))
			var u = o,
				c = a;
	}
	return c;
}
var bv = TC;
function EC(e, t) {
	return e > t;
}
var jC = EC,
	MC = bv,
	CC = jC,
	IC = Gr;
function NC(e) {
	return e && e.length ? MC(e, IC, CC) : void 0;
}
var kC = NC;
const Ya = fe(kC);
function DC(e, t) {
	return e < t;
}
var LC = DC,
	BC = bv,
	RC = LC,
	FC = Gr;
function zC(e) {
	return e && e.length ? BC(e, FC, RC) : void 0;
}
var UC = zC;
const Za = fe(UC);
var WC = xc,
	qC = It,
	GC = Td,
	HC = De;
function KC(e, t) {
	var r = HC(e) ? WC : GC;
	return r(e, qC(t));
}
var VC = KC,
	XC = Pd,
	YC = VC;
function ZC(e, t) {
	return XC(YC(e, t), 1);
}
var JC = ZC;
const QC = fe(JC);
var eI = kc;
function tI(e, t) {
	return eI(e, t);
}
var rI = tI;
const Ja = fe(rI);
var Kr = 1e9,
	nI = {
		precision: 20,
		rounding: 4,
		toExpNeg: -7,
		toExpPos: 21,
		LN10: '2.302585092994045684017991454684364207601101488628772976033327900967572609677352480235997205089598298341967784042286',
	},
	cs,
	pe = !0,
	Xe = '[DecimalError] ',
	Xt = Xe + 'Invalid argument: ',
	us = Xe + 'Exponent out of range: ',
	Vr = Math.floor,
	Wt = Math.pow,
	iI = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
	ze,
	_e = 1e7,
	le = 7,
	xv = 9007199254740991,
	Yi = Vr(xv / le),
	q = {};
q.absoluteValue = q.abs = function () {
	var e = new this.constructor(this);
	return e.s && (e.s = 1), e;
};
q.comparedTo = q.cmp = function (e) {
	var t,
		r,
		n,
		i,
		a = this;
	if (((e = new a.constructor(e)), a.s !== e.s)) return a.s || -e.s;
	if (a.e !== e.e) return (a.e > e.e) ^ (a.s < 0) ? 1 : -1;
	for (n = a.d.length, i = e.d.length, t = 0, r = n < i ? n : i; t < r; ++t)
		if (a.d[t] !== e.d[t]) return (a.d[t] > e.d[t]) ^ (a.s < 0) ? 1 : -1;
	return n === i ? 0 : (n > i) ^ (a.s < 0) ? 1 : -1;
};
q.decimalPlaces = q.dp = function () {
	var e = this,
		t = e.d.length - 1,
		r = (t - e.e) * le;
	if (((t = e.d[t]), t)) for (; t % 10 == 0; t /= 10) r--;
	return r < 0 ? 0 : r;
};
q.dividedBy = q.div = function (e) {
	return yt(this, new this.constructor(e));
};
q.dividedToIntegerBy = q.idiv = function (e) {
	var t = this,
		r = t.constructor;
	return oe(yt(t, new r(e), 0, 1), r.precision);
};
q.equals = q.eq = function (e) {
	return !this.cmp(e);
};
q.exponent = function () {
	return ge(this);
};
q.greaterThan = q.gt = function (e) {
	return this.cmp(e) > 0;
};
q.greaterThanOrEqualTo = q.gte = function (e) {
	return this.cmp(e) >= 0;
};
q.isInteger = q.isint = function () {
	return this.e > this.d.length - 2;
};
q.isNegative = q.isneg = function () {
	return this.s < 0;
};
q.isPositive = q.ispos = function () {
	return this.s > 0;
};
q.isZero = function () {
	return this.s === 0;
};
q.lessThan = q.lt = function (e) {
	return this.cmp(e) < 0;
};
q.lessThanOrEqualTo = q.lte = function (e) {
	return this.cmp(e) < 1;
};
q.logarithm = q.log = function (e) {
	var t,
		r = this,
		n = r.constructor,
		i = n.precision,
		a = i + 5;
	if (e === void 0) e = new n(10);
	else if (((e = new n(e)), e.s < 1 || e.eq(ze))) throw Error(Xe + 'NaN');
	if (r.s < 1) throw Error(Xe + (r.s ? 'NaN' : '-Infinity'));
	return r.eq(ze)
		? new n(0)
		: ((pe = !1), (t = yt(Pn(r, a), Pn(e, a), a)), (pe = !0), oe(t, i));
};
q.minus = q.sub = function (e) {
	var t = this;
	return (
		(e = new t.constructor(e)), t.s == e.s ? Sv(t, e) : wv(t, ((e.s = -e.s), e))
	);
};
q.modulo = q.mod = function (e) {
	var t,
		r = this,
		n = r.constructor,
		i = n.precision;
	if (((e = new n(e)), !e.s)) throw Error(Xe + 'NaN');
	return r.s
		? ((pe = !1), (t = yt(r, e, 0, 1).times(e)), (pe = !0), r.minus(t))
		: oe(new n(r), i);
};
q.naturalExponential = q.exp = function () {
	return Ov(this);
};
q.naturalLogarithm = q.ln = function () {
	return Pn(this);
};
q.negated = q.neg = function () {
	var e = new this.constructor(this);
	return (e.s = -e.s || 0), e;
};
q.plus = q.add = function (e) {
	var t = this;
	return (
		(e = new t.constructor(e)), t.s == e.s ? wv(t, e) : Sv(t, ((e.s = -e.s), e))
	);
};
q.precision = q.sd = function (e) {
	var t,
		r,
		n,
		i = this;
	if (e !== void 0 && e !== !!e && e !== 1 && e !== 0) throw Error(Xt + e);
	if (
		((t = ge(i) + 1), (n = i.d.length - 1), (r = n * le + 1), (n = i.d[n]), n)
	) {
		for (; n % 10 == 0; n /= 10) r--;
		for (n = i.d[0]; n >= 10; n /= 10) r++;
	}
	return e && t > r ? t : r;
};
q.squareRoot = q.sqrt = function () {
	var e,
		t,
		r,
		n,
		i,
		a,
		o,
		u = this,
		c = u.constructor;
	if (u.s < 1) {
		if (!u.s) return new c(0);
		throw Error(Xe + 'NaN');
	}
	for (
		e = ge(u),
			pe = !1,
			i = Math.sqrt(+u),
			i == 0 || i == 1 / 0
				? ((t = ot(u.d)),
				  (t.length + e) % 2 == 0 && (t += '0'),
				  (i = Math.sqrt(t)),
				  (e = Vr((e + 1) / 2) - (e < 0 || e % 2)),
				  i == 1 / 0
						? (t = '5e' + e)
						: ((t = i.toExponential()),
						  (t = t.slice(0, t.indexOf('e') + 1) + e)),
				  (n = new c(t)))
				: (n = new c(i.toString())),
			r = c.precision,
			i = o = r + 3;
		;

	)
		if (
			((a = n),
			(n = a.plus(yt(u, a, o + 2)).times(0.5)),
			ot(a.d).slice(0, o) === (t = ot(n.d)).slice(0, o))
		) {
			if (((t = t.slice(o - 3, o + 1)), i == o && t == '4999')) {
				if ((oe(a, r + 1, 0), a.times(a).eq(u))) {
					n = a;
					break;
				}
			} else if (t != '9999') break;
			o += 4;
		}
	return (pe = !0), oe(n, r);
};
q.times = q.mul = function (e) {
	var t,
		r,
		n,
		i,
		a,
		o,
		u,
		c,
		s,
		f = this,
		l = f.constructor,
		p = f.d,
		h = (e = new l(e)).d;
	if (!f.s || !e.s) return new l(0);
	for (
		e.s *= f.s,
			r = f.e + e.e,
			c = p.length,
			s = h.length,
			c < s && ((a = p), (p = h), (h = a), (o = c), (c = s), (s = o)),
			a = [],
			o = c + s,
			n = o;
		n--;

	)
		a.push(0);
	for (n = s; --n >= 0; ) {
		for (t = 0, i = c + n; i > n; )
			(u = a[i] + h[n] * p[i - n - 1] + t),
				(a[i--] = u % _e | 0),
				(t = (u / _e) | 0);
		a[i] = (a[i] + t) % _e | 0;
	}
	for (; !a[--o]; ) a.pop();
	return t ? ++r : a.shift(), (e.d = a), (e.e = r), pe ? oe(e, l.precision) : e;
};
q.toDecimalPlaces = q.todp = function (e, t) {
	var r = this,
		n = r.constructor;
	return (
		(r = new n(r)),
		e === void 0
			? r
			: (st(e, 0, Kr),
			  t === void 0 ? (t = n.rounding) : st(t, 0, 8),
			  oe(r, e + ge(r) + 1, t))
	);
};
q.toExponential = function (e, t) {
	var r,
		n = this,
		i = n.constructor;
	return (
		e === void 0
			? (r = Zt(n, !0))
			: (st(e, 0, Kr),
			  t === void 0 ? (t = i.rounding) : st(t, 0, 8),
			  (n = oe(new i(n), e + 1, t)),
			  (r = Zt(n, !0, e + 1))),
		r
	);
};
q.toFixed = function (e, t) {
	var r,
		n,
		i = this,
		a = i.constructor;
	return e === void 0
		? Zt(i)
		: (st(e, 0, Kr),
		  t === void 0 ? (t = a.rounding) : st(t, 0, 8),
		  (n = oe(new a(i), e + ge(i) + 1, t)),
		  (r = Zt(n.abs(), !1, e + ge(n) + 1)),
		  i.isneg() && !i.isZero() ? '-' + r : r);
};
q.toInteger = q.toint = function () {
	var e = this,
		t = e.constructor;
	return oe(new t(e), ge(e) + 1, t.rounding);
};
q.toNumber = function () {
	return +this;
};
q.toPower = q.pow = function (e) {
	var t,
		r,
		n,
		i,
		a,
		o,
		u = this,
		c = u.constructor,
		s = 12,
		f = +(e = new c(e));
	if (!e.s) return new c(ze);
	if (((u = new c(u)), !u.s)) {
		if (e.s < 1) throw Error(Xe + 'Infinity');
		return u;
	}
	if (u.eq(ze)) return u;
	if (((n = c.precision), e.eq(ze))) return oe(u, n);
	if (((t = e.e), (r = e.d.length - 1), (o = t >= r), (a = u.s), o)) {
		if ((r = f < 0 ? -f : f) <= xv) {
			for (
				i = new c(ze), t = Math.ceil(n / le + 4), pe = !1;
				r % 2 && ((i = i.times(u)), Cf(i.d, t)), (r = Vr(r / 2)), r !== 0;

			)
				(u = u.times(u)), Cf(u.d, t);
			return (pe = !0), e.s < 0 ? new c(ze).div(i) : oe(i, n);
		}
	} else if (a < 0) throw Error(Xe + 'NaN');
	return (
		(a = a < 0 && e.d[Math.max(t, r)] & 1 ? -1 : 1),
		(u.s = 1),
		(pe = !1),
		(i = e.times(Pn(u, n + s))),
		(pe = !0),
		(i = Ov(i)),
		(i.s = a),
		i
	);
};
q.toPrecision = function (e, t) {
	var r,
		n,
		i = this,
		a = i.constructor;
	return (
		e === void 0
			? ((r = ge(i)), (n = Zt(i, r <= a.toExpNeg || r >= a.toExpPos)))
			: (st(e, 1, Kr),
			  t === void 0 ? (t = a.rounding) : st(t, 0, 8),
			  (i = oe(new a(i), e, t)),
			  (r = ge(i)),
			  (n = Zt(i, e <= r || r <= a.toExpNeg, e))),
		n
	);
};
q.toSignificantDigits = q.tosd = function (e, t) {
	var r = this,
		n = r.constructor;
	return (
		e === void 0
			? ((e = n.precision), (t = n.rounding))
			: (st(e, 1, Kr), t === void 0 ? (t = n.rounding) : st(t, 0, 8)),
		oe(new n(r), e, t)
	);
};
q.toString =
	q.valueOf =
	q.val =
	q.toJSON =
	q[Symbol.for('nodejs.util.inspect.custom')] =
		function () {
			var e = this,
				t = ge(e),
				r = e.constructor;
			return Zt(e, t <= r.toExpNeg || t >= r.toExpPos);
		};
function wv(e, t) {
	var r,
		n,
		i,
		a,
		o,
		u,
		c,
		s,
		f = e.constructor,
		l = f.precision;
	if (!e.s || !t.s) return t.s || (t = new f(e)), pe ? oe(t, l) : t;
	if (
		((c = e.d),
		(s = t.d),
		(o = e.e),
		(i = t.e),
		(c = c.slice()),
		(a = o - i),
		a)
	) {
		for (
			a < 0
				? ((n = c), (a = -a), (u = s.length))
				: ((n = s), (i = o), (u = c.length)),
				o = Math.ceil(l / le),
				u = o > u ? o + 1 : u + 1,
				a > u && ((a = u), (n.length = 1)),
				n.reverse();
			a--;

		)
			n.push(0);
		n.reverse();
	}
	for (
		u = c.length,
			a = s.length,
			u - a < 0 && ((a = u), (n = s), (s = c), (c = n)),
			r = 0;
		a;

	)
		(r = ((c[--a] = c[a] + s[a] + r) / _e) | 0), (c[a] %= _e);
	for (r && (c.unshift(r), ++i), u = c.length; c[--u] == 0; ) c.pop();
	return (t.d = c), (t.e = i), pe ? oe(t, l) : t;
}
function st(e, t, r) {
	if (e !== ~~e || e < t || e > r) throw Error(Xt + e);
}
function ot(e) {
	var t,
		r,
		n,
		i = e.length - 1,
		a = '',
		o = e[0];
	if (i > 0) {
		for (a += o, t = 1; t < i; t++)
			(n = e[t] + ''), (r = le - n.length), r && (a += At(r)), (a += n);
		(o = e[t]), (n = o + ''), (r = le - n.length), r && (a += At(r));
	} else if (o === 0) return '0';
	for (; o % 10 === 0; ) o /= 10;
	return a + o;
}
var yt = (function () {
	function e(n, i) {
		var a,
			o = 0,
			u = n.length;
		for (n = n.slice(); u--; )
			(a = n[u] * i + o), (n[u] = a % _e | 0), (o = (a / _e) | 0);
		return o && n.unshift(o), n;
	}
	function t(n, i, a, o) {
		var u, c;
		if (a != o) c = a > o ? 1 : -1;
		else
			for (u = c = 0; u < a; u++)
				if (n[u] != i[u]) {
					c = n[u] > i[u] ? 1 : -1;
					break;
				}
		return c;
	}
	function r(n, i, a) {
		for (var o = 0; a--; )
			(n[a] -= o), (o = n[a] < i[a] ? 1 : 0), (n[a] = o * _e + n[a] - i[a]);
		for (; !n[0] && n.length > 1; ) n.shift();
	}
	return function (n, i, a, o) {
		var u,
			c,
			s,
			f,
			l,
			p,
			h,
			d,
			v,
			y,
			b,
			w,
			x,
			S,
			m,
			g,
			O,
			_,
			A = n.constructor,
			E = n.s == i.s ? 1 : -1,
			P = n.d,
			T = i.d;
		if (!n.s) return new A(n);
		if (!i.s) throw Error(Xe + 'Division by zero');
		for (
			c = n.e - i.e,
				O = T.length,
				m = P.length,
				h = new A(E),
				d = h.d = [],
				s = 0;
			T[s] == (P[s] || 0);

		)
			++s;
		if (
			(T[s] > (P[s] || 0) && --c,
			a == null
				? (w = a = A.precision)
				: o
				? (w = a + (ge(n) - ge(i)) + 1)
				: (w = a),
			w < 0)
		)
			return new A(0);
		if (((w = (w / le + 2) | 0), (s = 0), O == 1))
			for (f = 0, T = T[0], w++; (s < m || f) && w--; s++)
				(x = f * _e + (P[s] || 0)), (d[s] = (x / T) | 0), (f = x % T | 0);
		else {
			for (
				f = (_e / (T[0] + 1)) | 0,
					f > 1 &&
						((T = e(T, f)), (P = e(P, f)), (O = T.length), (m = P.length)),
					S = O,
					v = P.slice(0, O),
					y = v.length;
				y < O;

			)
				v[y++] = 0;
			(_ = T.slice()), _.unshift(0), (g = T[0]), T[1] >= _e / 2 && ++g;
			do
				(f = 0),
					(u = t(T, v, O, y)),
					u < 0
						? ((b = v[0]),
						  O != y && (b = b * _e + (v[1] || 0)),
						  (f = (b / g) | 0),
						  f > 1
								? (f >= _e && (f = _e - 1),
								  (l = e(T, f)),
								  (p = l.length),
								  (y = v.length),
								  (u = t(l, v, p, y)),
								  u == 1 && (f--, r(l, O < p ? _ : T, p)))
								: (f == 0 && (u = f = 1), (l = T.slice())),
						  (p = l.length),
						  p < y && l.unshift(0),
						  r(v, l, y),
						  u == -1 &&
								((y = v.length),
								(u = t(T, v, O, y)),
								u < 1 && (f++, r(v, O < y ? _ : T, y))),
						  (y = v.length))
						: u === 0 && (f++, (v = [0])),
					(d[s++] = f),
					u && v[0] ? (v[y++] = P[S] || 0) : ((v = [P[S]]), (y = 1));
			while ((S++ < m || v[0] !== void 0) && w--);
		}
		return d[0] || d.shift(), (h.e = c), oe(h, o ? a + ge(h) + 1 : a);
	};
})();
function Ov(e, t) {
	var r,
		n,
		i,
		a,
		o,
		u,
		c = 0,
		s = 0,
		f = e.constructor,
		l = f.precision;
	if (ge(e) > 16) throw Error(us + ge(e));
	if (!e.s) return new f(ze);
	for (
		t == null ? ((pe = !1), (u = l)) : (u = t), o = new f(0.03125);
		e.abs().gte(0.1);

	)
		(e = e.times(o)), (s += 5);
	for (
		n = ((Math.log(Wt(2, s)) / Math.LN10) * 2 + 5) | 0,
			u += n,
			r = i = a = new f(ze),
			f.precision = u;
		;

	) {
		if (
			((i = oe(i.times(e), u)),
			(r = r.times(++c)),
			(o = a.plus(yt(i, r, u))),
			ot(o.d).slice(0, u) === ot(a.d).slice(0, u))
		) {
			for (; s--; ) a = oe(a.times(a), u);
			return (f.precision = l), t == null ? ((pe = !0), oe(a, l)) : a;
		}
		a = o;
	}
}
function ge(e) {
	for (var t = e.e * le, r = e.d[0]; r >= 10; r /= 10) t++;
	return t;
}
function Co(e, t, r) {
	if (t > e.LN10.sd())
		throw (
			((pe = !0),
			r && (e.precision = r),
			Error(Xe + 'LN10 precision limit exceeded'))
		);
	return oe(new e(e.LN10), t);
}
function At(e) {
	for (var t = ''; e--; ) t += '0';
	return t;
}
function Pn(e, t) {
	var r,
		n,
		i,
		a,
		o,
		u,
		c,
		s,
		f,
		l = 1,
		p = 10,
		h = e,
		d = h.d,
		v = h.constructor,
		y = v.precision;
	if (h.s < 1) throw Error(Xe + (h.s ? 'NaN' : '-Infinity'));
	if (h.eq(ze)) return new v(0);
	if ((t == null ? ((pe = !1), (s = y)) : (s = t), h.eq(10)))
		return t == null && (pe = !0), Co(v, s);
	if (
		((s += p),
		(v.precision = s),
		(r = ot(d)),
		(n = r.charAt(0)),
		(a = ge(h)),
		Math.abs(a) < 15e14)
	) {
		for (; (n < 7 && n != 1) || (n == 1 && r.charAt(1) > 3); )
			(h = h.times(e)), (r = ot(h.d)), (n = r.charAt(0)), l++;
		(a = ge(h)),
			n > 1 ? ((h = new v('0.' + r)), a++) : (h = new v(n + '.' + r.slice(1)));
	} else
		return (
			(c = Co(v, s + 2, y).times(a + '')),
			(h = Pn(new v(n + '.' + r.slice(1)), s - p).plus(c)),
			(v.precision = y),
			t == null ? ((pe = !0), oe(h, y)) : h
		);
	for (
		u = o = h = yt(h.minus(ze), h.plus(ze), s), f = oe(h.times(h), s), i = 3;
		;

	) {
		if (
			((o = oe(o.times(f), s)),
			(c = u.plus(yt(o, new v(i), s))),
			ot(c.d).slice(0, s) === ot(u.d).slice(0, s))
		)
			return (
				(u = u.times(2)),
				a !== 0 && (u = u.plus(Co(v, s + 2, y).times(a + ''))),
				(u = yt(u, new v(l), s)),
				(v.precision = y),
				t == null ? ((pe = !0), oe(u, y)) : u
			);
		(u = c), (i += 2);
	}
}
function Mf(e, t) {
	var r, n, i;
	for (
		(r = t.indexOf('.')) > -1 && (t = t.replace('.', '')),
			(n = t.search(/e/i)) > 0
				? (r < 0 && (r = n), (r += +t.slice(n + 1)), (t = t.substring(0, n)))
				: r < 0 && (r = t.length),
			n = 0;
		t.charCodeAt(n) === 48;

	)
		++n;
	for (i = t.length; t.charCodeAt(i - 1) === 48; ) --i;
	if (((t = t.slice(n, i)), t)) {
		if (
			((i -= n),
			(r = r - n - 1),
			(e.e = Vr(r / le)),
			(e.d = []),
			(n = (r + 1) % le),
			r < 0 && (n += le),
			n < i)
		) {
			for (n && e.d.push(+t.slice(0, n)), i -= le; n < i; )
				e.d.push(+t.slice(n, (n += le)));
			(t = t.slice(n)), (n = le - t.length);
		} else n -= i;
		for (; n--; ) t += '0';
		if ((e.d.push(+t), pe && (e.e > Yi || e.e < -Yi))) throw Error(us + r);
	} else (e.s = 0), (e.e = 0), (e.d = [0]);
	return e;
}
function oe(e, t, r) {
	var n,
		i,
		a,
		o,
		u,
		c,
		s,
		f,
		l = e.d;
	for (o = 1, a = l[0]; a >= 10; a /= 10) o++;
	if (((n = t - o), n < 0)) (n += le), (i = t), (s = l[(f = 0)]);
	else {
		if (((f = Math.ceil((n + 1) / le)), (a = l.length), f >= a)) return e;
		for (s = a = l[f], o = 1; a >= 10; a /= 10) o++;
		(n %= le), (i = n - le + o);
	}
	if (
		(r !== void 0 &&
			((a = Wt(10, o - i - 1)),
			(u = (s / a) % 10 | 0),
			(c = t < 0 || l[f + 1] !== void 0 || s % a),
			(c =
				r < 4
					? (u || c) && (r == 0 || r == (e.s < 0 ? 3 : 2))
					: u > 5 ||
					  (u == 5 &&
							(r == 4 ||
								c ||
								(r == 6 &&
									(n > 0 ? (i > 0 ? s / Wt(10, o - i) : 0) : l[f - 1]) % 10 &
										1) ||
								r == (e.s < 0 ? 8 : 7))))),
		t < 1 || !l[0])
	)
		return (
			c
				? ((a = ge(e)),
				  (l.length = 1),
				  (t = t - a - 1),
				  (l[0] = Wt(10, (le - (t % le)) % le)),
				  (e.e = Vr(-t / le) || 0))
				: ((l.length = 1), (l[0] = e.e = e.s = 0)),
			e
		);
	if (
		(n == 0
			? ((l.length = f), (a = 1), f--)
			: ((l.length = f + 1),
			  (a = Wt(10, le - n)),
			  (l[f] = i > 0 ? ((s / Wt(10, o - i)) % Wt(10, i) | 0) * a : 0)),
		c)
	)
		for (;;)
			if (f == 0) {
				(l[0] += a) == _e && ((l[0] = 1), ++e.e);
				break;
			} else {
				if (((l[f] += a), l[f] != _e)) break;
				(l[f--] = 0), (a = 1);
			}
	for (n = l.length; l[--n] === 0; ) l.pop();
	if (pe && (e.e > Yi || e.e < -Yi)) throw Error(us + ge(e));
	return e;
}
function Sv(e, t) {
	var r,
		n,
		i,
		a,
		o,
		u,
		c,
		s,
		f,
		l,
		p = e.constructor,
		h = p.precision;
	if (!e.s || !t.s)
		return t.s ? (t.s = -t.s) : (t = new p(e)), pe ? oe(t, h) : t;
	if (
		((c = e.d),
		(l = t.d),
		(n = t.e),
		(s = e.e),
		(c = c.slice()),
		(o = s - n),
		o)
	) {
		for (
			f = o < 0,
				f
					? ((r = c), (o = -o), (u = l.length))
					: ((r = l), (n = s), (u = c.length)),
				i = Math.max(Math.ceil(h / le), u) + 2,
				o > i && ((o = i), (r.length = 1)),
				r.reverse(),
				i = o;
			i--;

		)
			r.push(0);
		r.reverse();
	} else {
		for (i = c.length, u = l.length, f = i < u, f && (u = i), i = 0; i < u; i++)
			if (c[i] != l[i]) {
				f = c[i] < l[i];
				break;
			}
		o = 0;
	}
	for (
		f && ((r = c), (c = l), (l = r), (t.s = -t.s)),
			u = c.length,
			i = l.length - u;
		i > 0;
		--i
	)
		c[u++] = 0;
	for (i = l.length; i > o; ) {
		if (c[--i] < l[i]) {
			for (a = i; a && c[--a] === 0; ) c[a] = _e - 1;
			--c[a], (c[i] += _e);
		}
		c[i] -= l[i];
	}
	for (; c[--u] === 0; ) c.pop();
	for (; c[0] === 0; c.shift()) --n;
	return c[0] ? ((t.d = c), (t.e = n), pe ? oe(t, h) : t) : new p(0);
}
function Zt(e, t, r) {
	var n,
		i = ge(e),
		a = ot(e.d),
		o = a.length;
	return (
		t
			? (r && (n = r - o) > 0
					? (a = a.charAt(0) + '.' + a.slice(1) + At(n))
					: o > 1 && (a = a.charAt(0) + '.' + a.slice(1)),
			  (a = a + (i < 0 ? 'e' : 'e+') + i))
			: i < 0
			? ((a = '0.' + At(-i - 1) + a), r && (n = r - o) > 0 && (a += At(n)))
			: i >= o
			? ((a += At(i + 1 - o)),
			  r && (n = r - i - 1) > 0 && (a = a + '.' + At(n)))
			: ((n = i + 1) < o && (a = a.slice(0, n) + '.' + a.slice(n)),
			  r && (n = r - o) > 0 && (i + 1 === o && (a += '.'), (a += At(n)))),
		e.s < 0 ? '-' + a : a
	);
}
function Cf(e, t) {
	if (e.length > t) return (e.length = t), !0;
}
function _v(e) {
	var t, r, n;
	function i(a) {
		var o = this;
		if (!(o instanceof i)) return new i(a);
		if (((o.constructor = i), a instanceof i)) {
			(o.s = a.s), (o.e = a.e), (o.d = (a = a.d) ? a.slice() : a);
			return;
		}
		if (typeof a == 'number') {
			if (a * 0 !== 0) throw Error(Xt + a);
			if (a > 0) o.s = 1;
			else if (a < 0) (a = -a), (o.s = -1);
			else {
				(o.s = 0), (o.e = 0), (o.d = [0]);
				return;
			}
			if (a === ~~a && a < 1e7) {
				(o.e = 0), (o.d = [a]);
				return;
			}
			return Mf(o, a.toString());
		} else if (typeof a != 'string') throw Error(Xt + a);
		if (
			(a.charCodeAt(0) === 45 ? ((a = a.slice(1)), (o.s = -1)) : (o.s = 1),
			iI.test(a))
		)
			Mf(o, a);
		else throw Error(Xt + a);
	}
	if (
		((i.prototype = q),
		(i.ROUND_UP = 0),
		(i.ROUND_DOWN = 1),
		(i.ROUND_CEIL = 2),
		(i.ROUND_FLOOR = 3),
		(i.ROUND_HALF_UP = 4),
		(i.ROUND_HALF_DOWN = 5),
		(i.ROUND_HALF_EVEN = 6),
		(i.ROUND_HALF_CEIL = 7),
		(i.ROUND_HALF_FLOOR = 8),
		(i.clone = _v),
		(i.config = i.set = aI),
		e === void 0 && (e = {}),
		e)
	)
		for (
			n = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'LN10'], t = 0;
			t < n.length;

		)
			e.hasOwnProperty((r = n[t++])) || (e[r] = this[r]);
	return i.config(e), i;
}
function aI(e) {
	if (!e || typeof e != 'object') throw Error(Xe + 'Object expected');
	var t,
		r,
		n,
		i = [
			'precision',
			1,
			Kr,
			'rounding',
			0,
			8,
			'toExpNeg',
			-1 / 0,
			0,
			'toExpPos',
			0,
			1 / 0,
		];
	for (t = 0; t < i.length; t += 3)
		if ((n = e[(r = i[t])]) !== void 0)
			if (Vr(n) === n && n >= i[t + 1] && n <= i[t + 2]) this[r] = n;
			else throw Error(Xt + r + ': ' + n);
	if ((n = e[(r = 'LN10')]) !== void 0)
		if (n == Math.LN10) this[r] = new this(n);
		else throw Error(Xt + r + ': ' + n);
	return this;
}
var cs = _v(nI);
ze = new cs(1);
const ae = cs;
function oI(e) {
	return lI(e) || sI(e) || cI(e) || uI();
}
function uI() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function cI(e, t) {
	if (e) {
		if (typeof e == 'string') return Su(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Su(e, t);
	}
}
function sI(e) {
	if (typeof Symbol < 'u' && Symbol.iterator in Object(e)) return Array.from(e);
}
function lI(e) {
	if (Array.isArray(e)) return Su(e);
}
function Su(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
var fI = function (t) {
		return t;
	},
	Av = { '@@functional/placeholder': !0 },
	Pv = function (t) {
		return t === Av;
	},
	If = function (t) {
		return function r() {
			return arguments.length === 0 ||
				(arguments.length === 1 &&
					Pv(arguments.length <= 0 ? void 0 : arguments[0]))
				? r
				: t.apply(void 0, arguments);
		};
	},
	pI = function e(t, r) {
		return t === 1
			? r
			: If(function () {
					for (var n = arguments.length, i = new Array(n), a = 0; a < n; a++)
						i[a] = arguments[a];
					var o = i.filter(function (u) {
						return u !== Av;
					}).length;
					return o >= t
						? r.apply(void 0, i)
						: e(
								t - o,
								If(function () {
									for (
										var u = arguments.length, c = new Array(u), s = 0;
										s < u;
										s++
									)
										c[s] = arguments[s];
									var f = i.map(function (l) {
										return Pv(l) ? c.shift() : l;
									});
									return r.apply(void 0, oI(f).concat(c));
								}),
						  );
			  });
	},
	Qa = function (t) {
		return pI(t.length, t);
	},
	_u = function (t, r) {
		for (var n = [], i = t; i < r; ++i) n[i - t] = i;
		return n;
	},
	hI = Qa(function (e, t) {
		return Array.isArray(t)
			? t.map(e)
			: Object.keys(t)
					.map(function (r) {
						return t[r];
					})
					.map(e);
	}),
	dI = function () {
		for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
			r[n] = arguments[n];
		if (!r.length) return fI;
		var i = r.reverse(),
			a = i[0],
			o = i.slice(1);
		return function () {
			return o.reduce(function (u, c) {
				return c(u);
			}, a.apply(void 0, arguments));
		};
	},
	Au = function (t) {
		return Array.isArray(t) ? t.reverse() : t.split('').reverse.join('');
	},
	$v = function (t) {
		var r = null,
			n = null;
		return function () {
			for (var i = arguments.length, a = new Array(i), o = 0; o < i; o++)
				a[o] = arguments[o];
			return (
				(r &&
					a.every(function (u, c) {
						return u === r[c];
					})) ||
					((r = a), (n = t.apply(void 0, a))),
				n
			);
		};
	};
function vI(e) {
	var t;
	return (
		e === 0
			? (t = 1)
			: (t = Math.floor(new ae(e).abs().log(10).toNumber()) + 1),
		t
	);
}
function yI(e, t, r) {
	for (var n = new ae(e), i = 0, a = []; n.lt(t) && i < 1e5; )
		a.push(n.toNumber()), (n = n.add(r)), i++;
	return a;
}
var mI = Qa(function (e, t, r) {
		var n = +e,
			i = +t;
		return n + r * (i - n);
	}),
	gI = Qa(function (e, t, r) {
		var n = t - +e;
		return (n = n || 1 / 0), (r - e) / n;
	}),
	bI = Qa(function (e, t, r) {
		var n = t - +e;
		return (n = n || 1 / 0), Math.max(0, Math.min(1, (r - e) / n));
	});
const eo = {
	rangeStep: yI,
	getDigitCount: vI,
	interpolateNumber: mI,
	uninterpolateNumber: gI,
	uninterpolateTruncation: bI,
};
function Pu(e) {
	return OI(e) || wI(e) || Tv(e) || xI();
}
function xI() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function wI(e) {
	if (typeof Symbol < 'u' && Symbol.iterator in Object(e)) return Array.from(e);
}
function OI(e) {
	if (Array.isArray(e)) return $u(e);
}
function $n(e, t) {
	return AI(e) || _I(e, t) || Tv(e, t) || SI();
}
function SI() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Tv(e, t) {
	if (e) {
		if (typeof e == 'string') return $u(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return $u(e, t);
	}
}
function $u(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function _I(e, t) {
	if (!(typeof Symbol > 'u' || !(Symbol.iterator in Object(e)))) {
		var r = [],
			n = !0,
			i = !1,
			a = void 0;
		try {
			for (
				var o = e[Symbol.iterator](), u;
				!(n = (u = o.next()).done) && (r.push(u.value), !(t && r.length === t));
				n = !0
			);
		} catch (c) {
			(i = !0), (a = c);
		} finally {
			try {
				!n && o.return != null && o.return();
			} finally {
				if (i) throw a;
			}
		}
		return r;
	}
}
function AI(e) {
	if (Array.isArray(e)) return e;
}
function Ev(e) {
	var t = $n(e, 2),
		r = t[0],
		n = t[1],
		i = r,
		a = n;
	return r > n && ((i = n), (a = r)), [i, a];
}
function jv(e, t, r) {
	if (e.lte(0)) return new ae(0);
	var n = eo.getDigitCount(e.toNumber()),
		i = new ae(10).pow(n),
		a = e.div(i),
		o = n !== 1 ? 0.05 : 0.1,
		u = new ae(Math.ceil(a.div(o).toNumber())).add(r).mul(o),
		c = u.mul(i);
	return t ? c : new ae(Math.ceil(c));
}
function PI(e, t, r) {
	var n = 1,
		i = new ae(e);
	if (!i.isint() && r) {
		var a = Math.abs(e);
		a < 1
			? ((n = new ae(10).pow(eo.getDigitCount(e) - 1)),
			  (i = new ae(Math.floor(i.div(n).toNumber())).mul(n)))
			: a > 1 && (i = new ae(Math.floor(e)));
	} else
		e === 0
			? (i = new ae(Math.floor((t - 1) / 2)))
			: r || (i = new ae(Math.floor(e)));
	var o = Math.floor((t - 1) / 2),
		u = dI(
			hI(function (c) {
				return i.add(new ae(c - o).mul(n)).toNumber();
			}),
			_u,
		);
	return u(0, t);
}
function Mv(e, t, r, n) {
	var i = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0;
	if (!Number.isFinite((t - e) / (r - 1)))
		return { step: new ae(0), tickMin: new ae(0), tickMax: new ae(0) };
	var a = jv(new ae(t).sub(e).div(r - 1), n, i),
		o;
	e <= 0 && t >= 0
		? (o = new ae(0))
		: ((o = new ae(e).add(t).div(2)), (o = o.sub(new ae(o).mod(a))));
	var u = Math.ceil(o.sub(e).div(a).toNumber()),
		c = Math.ceil(new ae(t).sub(o).div(a).toNumber()),
		s = u + c + 1;
	return s > r
		? Mv(e, t, r, n, i + 1)
		: (s < r && ((c = t > 0 ? c + (r - s) : c), (u = t > 0 ? u : u + (r - s))),
		  {
				step: a,
				tickMin: o.sub(new ae(u).mul(a)),
				tickMax: o.add(new ae(c).mul(a)),
		  });
}
function $I(e) {
	var t = $n(e, 2),
		r = t[0],
		n = t[1],
		i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 6,
		a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0,
		o = Math.max(i, 2),
		u = Ev([r, n]),
		c = $n(u, 2),
		s = c[0],
		f = c[1];
	if (s === -1 / 0 || f === 1 / 0) {
		var l =
			f === 1 / 0
				? [s].concat(
						Pu(
							_u(0, i - 1).map(function () {
								return 1 / 0;
							}),
						),
				  )
				: [].concat(
						Pu(
							_u(0, i - 1).map(function () {
								return -1 / 0;
							}),
						),
						[f],
				  );
		return r > n ? Au(l) : l;
	}
	if (s === f) return PI(s, i, a);
	var p = Mv(s, f, o, a),
		h = p.step,
		d = p.tickMin,
		v = p.tickMax,
		y = eo.rangeStep(d, v.add(new ae(0.1).mul(h)), h);
	return r > n ? Au(y) : y;
}
function TI(e, t) {
	var r = $n(e, 2),
		n = r[0],
		i = r[1],
		a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0,
		o = Ev([n, i]),
		u = $n(o, 2),
		c = u[0],
		s = u[1];
	if (c === -1 / 0 || s === 1 / 0) return [n, i];
	if (c === s) return [c];
	var f = Math.max(t, 2),
		l = jv(new ae(s).sub(c).div(f - 1), a, 0),
		p = [].concat(
			Pu(eo.rangeStep(new ae(c), new ae(s).sub(new ae(0.99).mul(l)), l)),
			[s],
		);
	return n > i ? Au(p) : p;
}
var EI = $v($I),
	jI = $v(TI),
	MI = 'Invariant failed';
function Jt(e, t) {
	throw new Error(MI);
}
var CI = [
	'offset',
	'layout',
	'width',
	'dataKey',
	'data',
	'dataPointFormatter',
	'xAxis',
	'yAxis',
];
function _r(e) {
	'@babel/helpers - typeof';
	return (
		(_r =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		_r(e)
	);
}
function Zi() {
	return (
		(Zi = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Zi.apply(this, arguments)
	);
}
function II(e, t) {
	return LI(e) || DI(e, t) || kI(e, t) || NI();
}
function NI() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function kI(e, t) {
	if (e) {
		if (typeof e == 'string') return Nf(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Nf(e, t);
	}
}
function Nf(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function DI(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function LI(e) {
	if (Array.isArray(e)) return e;
}
function BI(e, t) {
	if (e == null) return {};
	var r = RI(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function RI(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function FI(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function zI(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Nv(n.key), n);
	}
}
function UI(e, t, r) {
	return (
		t && zI(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function WI(e, t, r) {
	return (
		(t = Ji(t)),
		qI(
			e,
			Cv() ? Reflect.construct(t, r || [], Ji(e).constructor) : t.apply(e, r),
		)
	);
}
function qI(e, t) {
	if (t && (_r(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return GI(e);
}
function GI(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Cv() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Cv = function () {
		return !!e;
	})();
}
function Ji(e) {
	return (
		(Ji = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		Ji(e)
	);
}
function HI(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Tu(e, t);
}
function Tu(e, t) {
	return (
		(Tu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Tu(e, t)
	);
}
function Iv(e, t, r) {
	return (
		(t = Nv(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Nv(e) {
	var t = KI(e, 'string');
	return _r(t) == 'symbol' ? t : t + '';
}
function KI(e, t) {
	if (_r(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (_r(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var ii = (function (e) {
	function t() {
		return FI(this, t), WI(this, t, arguments);
	}
	return (
		HI(t, e),
		UI(t, [
			{
				key: 'render',
				value: function () {
					var n = this.props,
						i = n.offset,
						a = n.layout,
						o = n.width,
						u = n.dataKey,
						c = n.data,
						s = n.dataPointFormatter,
						f = n.xAxis,
						l = n.yAxis,
						p = BI(n, CI),
						h = ee(p, !1);
					this.props.direction === 'x' && f.type !== 'number' && Jt();
					var d = c.map(function (v) {
						var y = s(v, u),
							b = y.x,
							w = y.y,
							x = y.value,
							S = y.errorVal;
						if (!S) return null;
						var m = [],
							g,
							O;
						if (Array.isArray(S)) {
							var _ = II(S, 2);
							(g = _[0]), (O = _[1]);
						} else g = O = S;
						if (a === 'vertical') {
							var A = f.scale,
								E = w + i,
								P = E + o,
								T = E - o,
								j = A(x - g),
								C = A(x + O);
							m.push({ x1: C, y1: P, x2: C, y2: T }),
								m.push({ x1: j, y1: E, x2: C, y2: E }),
								m.push({ x1: j, y1: P, x2: j, y2: T });
						} else if (a === 'horizontal') {
							var I = l.scale,
								k = b + i,
								D = k - o,
								B = k + o,
								F = I(x - g),
								H = I(x + O);
							m.push({ x1: D, y1: H, x2: B, y2: H }),
								m.push({ x1: k, y1: F, x2: k, y2: H }),
								m.push({ x1: D, y1: F, x2: B, y2: F });
						}
						return $.createElement(
							ve,
							Zi(
								{
									className: 'recharts-errorBar',
									key: 'bar-'.concat(
										m.map(function (V) {
											return ''
												.concat(V.x1, '-')
												.concat(V.x2, '-')
												.concat(V.y1, '-')
												.concat(V.y2);
										}),
									),
								},
								h,
							),
							m.map(function (V) {
								return $.createElement(
									'line',
									Zi({}, V, {
										key: 'line-'
											.concat(V.x1, '-')
											.concat(V.x2, '-')
											.concat(V.y1, '-')
											.concat(V.y2),
									}),
								);
							}),
						);
					});
					return $.createElement(ve, { className: 'recharts-errorBars' }, d);
				},
			},
		])
	);
})($.Component);
Iv(ii, 'defaultProps', {
	stroke: 'black',
	strokeWidth: 1.5,
	width: 5,
	offset: 0,
	layout: 'horizontal',
});
Iv(ii, 'displayName', 'ErrorBar');
function Tn(e) {
	'@babel/helpers - typeof';
	return (
		(Tn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Tn(e)
	);
}
function kf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Ft(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? kf(Object(r), !0).forEach(function (n) {
					VI(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: kf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function VI(e, t, r) {
	return (
		(t = XI(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function XI(e) {
	var t = YI(e, 'string');
	return Tn(t) == 'symbol' ? t : t + '';
}
function YI(e, t) {
	if (Tn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Tn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var kv = function (t) {
	var r = t.children,
		n = t.formattedGraphicalItems,
		i = t.legendWidth,
		a = t.legendContent,
		o = Fe(r, Kt);
	if (!o) return null;
	var u = Kt.defaultProps,
		c = u !== void 0 ? Ft(Ft({}, u), o.props) : {},
		s;
	return (
		o.props && o.props.payload
			? (s = o.props && o.props.payload)
			: a === 'children'
			? (s = (n || []).reduce(function (f, l) {
					var p = l.item,
						h = l.props,
						d = h.sectors || h.data || [];
					return f.concat(
						d.map(function (v) {
							return {
								type: o.props.iconType || p.props.legendType,
								value: v.name,
								color: v.fill,
								payload: v,
							};
						}),
					);
			  }, []))
			: (s = (n || []).map(function (f) {
					var l = f.item,
						p = l.type.defaultProps,
						h = p !== void 0 ? Ft(Ft({}, p), l.props) : {},
						d = h.dataKey,
						v = h.name,
						y = h.legendType,
						b = h.hide;
					return {
						inactive: b,
						dataKey: d,
						type: c.iconType || y || 'square',
						color: ss(l),
						value: v || d,
						payload: h,
					};
			  })),
		Ft(Ft(Ft({}, c), Kt.getWithHeight(o, i)), {}, { payload: s, item: o })
	);
};
function En(e) {
	'@babel/helpers - typeof';
	return (
		(En =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		En(e)
	);
}
function Df(e) {
	return e2(e) || QI(e) || JI(e) || ZI();
}
function ZI() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function JI(e, t) {
	if (e) {
		if (typeof e == 'string') return Eu(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Eu(e, t);
	}
}
function QI(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function e2(e) {
	if (Array.isArray(e)) return Eu(e);
}
function Eu(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function Lf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function de(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Lf(Object(r), !0).forEach(function (n) {
					dr(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Lf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function dr(e, t, r) {
	return (
		(t = t2(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function t2(e) {
	var t = r2(e, 'string');
	return En(t) == 'symbol' ? t : t + '';
}
function r2(e, t) {
	if (En(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (En(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Ue(e, t, r) {
	return Q(e) || Q(t) ? r : Oe(t) ? Ke(e, t, r) : J(t) ? t(e) : r;
}
function pn(e, t, r, n) {
	var i = QC(e, function (u) {
		return Ue(u, t);
	});
	if (r === 'number') {
		var a = i.filter(function (u) {
			return R(u) || parseFloat(u);
		});
		return a.length ? [Za(a), Ya(a)] : [1 / 0, -1 / 0];
	}
	var o = n
		? i.filter(function (u) {
				return !Q(u);
		  })
		: i;
	return o.map(function (u) {
		return Oe(u) || u instanceof Date ? u : '';
	});
}
var n2 = function (t) {
		var r,
			n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [],
			i = arguments.length > 2 ? arguments[2] : void 0,
			a = arguments.length > 3 ? arguments[3] : void 0,
			o = -1,
			u = (r = n == null ? void 0 : n.length) !== null && r !== void 0 ? r : 0;
		if (u <= 1) return 0;
		if (
			a &&
			a.axisType === 'angleAxis' &&
			Math.abs(Math.abs(a.range[1] - a.range[0]) - 360) <= 1e-6
		)
			for (var c = a.range, s = 0; s < u; s++) {
				var f = s > 0 ? i[s - 1].coordinate : i[u - 1].coordinate,
					l = i[s].coordinate,
					p = s >= u - 1 ? i[0].coordinate : i[s + 1].coordinate,
					h = void 0;
				if (nt(l - f) !== nt(p - l)) {
					var d = [];
					if (nt(p - l) === nt(c[1] - c[0])) {
						h = p;
						var v = l + c[1] - c[0];
						(d[0] = Math.min(v, (v + f) / 2)),
							(d[1] = Math.max(v, (v + f) / 2));
					} else {
						h = f;
						var y = p + c[1] - c[0];
						(d[0] = Math.min(l, (y + l) / 2)),
							(d[1] = Math.max(l, (y + l) / 2));
					}
					var b = [Math.min(l, (h + l) / 2), Math.max(l, (h + l) / 2)];
					if ((t > b[0] && t <= b[1]) || (t >= d[0] && t <= d[1])) {
						o = i[s].index;
						break;
					}
				} else {
					var w = Math.min(f, p),
						x = Math.max(f, p);
					if (t > (w + l) / 2 && t <= (x + l) / 2) {
						o = i[s].index;
						break;
					}
				}
			}
		else
			for (var S = 0; S < u; S++)
				if (
					(S === 0 && t <= (n[S].coordinate + n[S + 1].coordinate) / 2) ||
					(S > 0 &&
						S < u - 1 &&
						t > (n[S].coordinate + n[S - 1].coordinate) / 2 &&
						t <= (n[S].coordinate + n[S + 1].coordinate) / 2) ||
					(S === u - 1 && t > (n[S].coordinate + n[S - 1].coordinate) / 2)
				) {
					o = n[S].index;
					break;
				}
		return o;
	},
	ss = function (t) {
		var r,
			n = t,
			i = n.type.displayName,
			a =
				(r = t.type) !== null && r !== void 0 && r.defaultProps
					? de(de({}, t.type.defaultProps), t.props)
					: t.props,
			o = a.stroke,
			u = a.fill,
			c;
		switch (i) {
			case 'Line':
				c = o;
				break;
			case 'Area':
			case 'Radar':
				c = o && o !== 'none' ? o : u;
				break;
			default:
				c = u;
				break;
		}
		return c;
	},
	i2 = function (t) {
		var r = t.barSize,
			n = t.totalSize,
			i = t.stackGroups,
			a = i === void 0 ? {} : i;
		if (!a) return {};
		for (var o = {}, u = Object.keys(a), c = 0, s = u.length; c < s; c++)
			for (
				var f = a[u[c]].stackGroups, l = Object.keys(f), p = 0, h = l.length;
				p < h;
				p++
			) {
				var d = f[l[p]],
					v = d.items,
					y = d.cateAxisId,
					b = v.filter(function (O) {
						return Et(O.type).indexOf('Bar') >= 0;
					});
				if (b && b.length) {
					var w = b[0].type.defaultProps,
						x = w !== void 0 ? de(de({}, w), b[0].props) : b[0].props,
						S = x.barSize,
						m = x[y];
					o[m] || (o[m] = []);
					var g = Q(S) ? r : S;
					o[m].push({
						item: b[0],
						stackList: b.slice(1),
						barSize: Q(g) ? void 0 : Yt(g, n, 0),
					});
				}
			}
		return o;
	},
	a2 = function (t) {
		var r = t.barGap,
			n = t.barCategoryGap,
			i = t.bandSize,
			a = t.sizeList,
			o = a === void 0 ? [] : a,
			u = t.maxBarSize,
			c = o.length;
		if (c < 1) return null;
		var s = Yt(r, i, 0, !0),
			f,
			l = [];
		if (o[0].barSize === +o[0].barSize) {
			var p = !1,
				h = i / c,
				d = o.reduce(function (S, m) {
					return S + m.barSize || 0;
				}, 0);
			(d += (c - 1) * s),
				d >= i && ((d -= (c - 1) * s), (s = 0)),
				d >= i && h > 0 && ((p = !0), (h *= 0.9), (d = c * h));
			var v = ((i - d) / 2) >> 0,
				y = { offset: v - s, size: 0 };
			f = o.reduce(function (S, m) {
				var g = {
						item: m.item,
						position: {
							offset: y.offset + y.size + s,
							size: p ? h : m.barSize,
						},
					},
					O = [].concat(Df(S), [g]);
				return (
					(y = O[O.length - 1].position),
					m.stackList &&
						m.stackList.length &&
						m.stackList.forEach(function (_) {
							O.push({ item: _, position: y });
						}),
					O
				);
			}, l);
		} else {
			var b = Yt(n, i, 0, !0);
			i - 2 * b - (c - 1) * s <= 0 && (s = 0);
			var w = (i - 2 * b - (c - 1) * s) / c;
			w > 1 && (w >>= 0);
			var x = u === +u ? Math.min(w, u) : w;
			f = o.reduce(function (S, m, g) {
				var O = [].concat(Df(S), [
					{
						item: m.item,
						position: { offset: b + (w + s) * g + (w - x) / 2, size: x },
					},
				]);
				return (
					m.stackList &&
						m.stackList.length &&
						m.stackList.forEach(function (_) {
							O.push({ item: _, position: O[O.length - 1].position });
						}),
					O
				);
			}, l);
		}
		return f;
	},
	o2 = function (t, r, n, i) {
		var a = n.children,
			o = n.width,
			u = n.margin,
			c = o - (u.left || 0) - (u.right || 0),
			s = kv({ children: a, legendWidth: c });
		if (s) {
			var f = i || {},
				l = f.width,
				p = f.height,
				h = s.align,
				d = s.verticalAlign,
				v = s.layout;
			if (
				(v === 'vertical' || (v === 'horizontal' && d === 'middle')) &&
				h !== 'center' &&
				R(t[h])
			)
				return de(de({}, t), {}, dr({}, h, t[h] + (l || 0)));
			if (
				(v === 'horizontal' || (v === 'vertical' && h === 'center')) &&
				d !== 'middle' &&
				R(t[d])
			)
				return de(de({}, t), {}, dr({}, d, t[d] + (p || 0)));
		}
		return t;
	},
	u2 = function (t, r, n) {
		return Q(r)
			? !0
			: t === 'horizontal'
			? r === 'yAxis'
			: t === 'vertical' || n === 'x'
			? r === 'xAxis'
			: n === 'y'
			? r === 'yAxis'
			: !0;
	},
	Dv = function (t, r, n, i, a) {
		var o = r.props.children,
			u = Ve(o, ii).filter(function (s) {
				return u2(i, a, s.props.direction);
			});
		if (u && u.length) {
			var c = u.map(function (s) {
				return s.props.dataKey;
			});
			return t.reduce(
				function (s, f) {
					var l = Ue(f, n);
					if (Q(l)) return s;
					var p = Array.isArray(l) ? [Za(l), Ya(l)] : [l, l],
						h = c.reduce(
							function (d, v) {
								var y = Ue(f, v, 0),
									b = p[0] - Math.abs(Array.isArray(y) ? y[0] : y),
									w = p[1] + Math.abs(Array.isArray(y) ? y[1] : y);
								return [Math.min(b, d[0]), Math.max(w, d[1])];
							},
							[1 / 0, -1 / 0],
						);
					return [Math.min(h[0], s[0]), Math.max(h[1], s[1])];
				},
				[1 / 0, -1 / 0],
			);
		}
		return null;
	},
	c2 = function (t, r, n, i, a) {
		var o = r
			.map(function (u) {
				return Dv(t, u, n, a, i);
			})
			.filter(function (u) {
				return !Q(u);
			});
		return o && o.length
			? o.reduce(
					function (u, c) {
						return [Math.min(u[0], c[0]), Math.max(u[1], c[1])];
					},
					[1 / 0, -1 / 0],
			  )
			: null;
	},
	Lv = function (t, r, n, i, a) {
		var o = r.map(function (c) {
			var s = c.props.dataKey;
			return (n === 'number' && s && Dv(t, c, s, i)) || pn(t, s, n, a);
		});
		if (n === 'number')
			return o.reduce(
				function (c, s) {
					return [Math.min(c[0], s[0]), Math.max(c[1], s[1])];
				},
				[1 / 0, -1 / 0],
			);
		var u = {};
		return o.reduce(function (c, s) {
			for (var f = 0, l = s.length; f < l; f++)
				u[s[f]] || ((u[s[f]] = !0), c.push(s[f]));
			return c;
		}, []);
	},
	Bv = function (t, r) {
		return (
			(t === 'horizontal' && r === 'xAxis') ||
			(t === 'vertical' && r === 'yAxis') ||
			(t === 'centric' && r === 'angleAxis') ||
			(t === 'radial' && r === 'radiusAxis')
		);
	},
	Rv = function (t, r, n, i) {
		if (i)
			return t.map(function (c) {
				return c.coordinate;
			});
		var a,
			o,
			u = t.map(function (c) {
				return (
					c.coordinate === r && (a = !0),
					c.coordinate === n && (o = !0),
					c.coordinate
				);
			});
		return a || u.push(r), o || u.push(n), u;
	},
	dt = function (t, r, n) {
		if (!t) return null;
		var i = t.scale,
			a = t.duplicateDomain,
			o = t.type,
			u = t.range,
			c = t.realScaleType === 'scaleBand' ? i.bandwidth() / 2 : 2,
			s = (r || n) && o === 'category' && i.bandwidth ? i.bandwidth() / c : 0;
		if (
			((s =
				t.axisType === 'angleAxis' && (u == null ? void 0 : u.length) >= 2
					? nt(u[0] - u[1]) * 2 * s
					: s),
			r && (t.ticks || t.niceTicks))
		) {
			var f = (t.ticks || t.niceTicks).map(function (l) {
				var p = a ? a.indexOf(l) : l;
				return { coordinate: i(p) + s, value: l, offset: s };
			});
			return f.filter(function (l) {
				return !Zn(l.coordinate);
			});
		}
		return t.isCategorical && t.categoricalDomain
			? t.categoricalDomain.map(function (l, p) {
					return { coordinate: i(l) + s, value: l, index: p, offset: s };
			  })
			: i.ticks && !n
			? i.ticks(t.tickCount).map(function (l) {
					return { coordinate: i(l) + s, value: l, offset: s };
			  })
			: i.domain().map(function (l, p) {
					return {
						coordinate: i(l) + s,
						value: a ? a[l] : l,
						index: p,
						offset: s,
					};
			  });
	},
	Io = new WeakMap(),
	yi = function (t, r) {
		if (typeof r != 'function') return t;
		Io.has(t) || Io.set(t, new WeakMap());
		var n = Io.get(t);
		if (n.has(r)) return n.get(r);
		var i = function () {
			t.apply(void 0, arguments), r.apply(void 0, arguments);
		};
		return n.set(r, i), i;
	},
	s2 = function (t, r, n) {
		var i = t.scale,
			a = t.type,
			o = t.layout,
			u = t.axisType;
		if (i === 'auto')
			return o === 'radial' && u === 'radiusAxis'
				? { scale: wn(), realScaleType: 'band' }
				: o === 'radial' && u === 'angleAxis'
				? { scale: Hi(), realScaleType: 'linear' }
				: a === 'category' &&
				  r &&
				  (r.indexOf('LineChart') >= 0 ||
						r.indexOf('AreaChart') >= 0 ||
						(r.indexOf('ComposedChart') >= 0 && !n))
				? { scale: fn(), realScaleType: 'point' }
				: a === 'category'
				? { scale: wn(), realScaleType: 'band' }
				: { scale: Hi(), realScaleType: 'linear' };
		if (Yn(i)) {
			var c = 'scale'.concat(La(i));
			return { scale: (jf[c] || fn)(), realScaleType: jf[c] ? c : 'point' };
		}
		return J(i) ? { scale: i } : { scale: fn(), realScaleType: 'point' };
	},
	Bf = 1e-4,
	l2 = function (t) {
		var r = t.domain();
		if (!(!r || r.length <= 2)) {
			var n = r.length,
				i = t.range(),
				a = Math.min(i[0], i[1]) - Bf,
				o = Math.max(i[0], i[1]) + Bf,
				u = t(r[0]),
				c = t(r[n - 1]);
			(u < a || u > o || c < a || c > o) && t.domain([r[0], r[n - 1]]);
		}
	},
	f2 = function (t, r) {
		if (!t) return null;
		for (var n = 0, i = t.length; n < i; n++)
			if (t[n].item === r) return t[n].position;
		return null;
	},
	p2 = function (t, r) {
		if (!r || r.length !== 2 || !R(r[0]) || !R(r[1])) return t;
		var n = Math.min(r[0], r[1]),
			i = Math.max(r[0], r[1]),
			a = [t[0], t[1]];
		return (
			(!R(t[0]) || t[0] < n) && (a[0] = n),
			(!R(t[1]) || t[1] > i) && (a[1] = i),
			a[0] > i && (a[0] = i),
			a[1] < n && (a[1] = n),
			a
		);
	},
	h2 = function (t) {
		var r = t.length;
		if (!(r <= 0))
			for (var n = 0, i = t[0].length; n < i; ++n)
				for (var a = 0, o = 0, u = 0; u < r; ++u) {
					var c = Zn(t[u][n][1]) ? t[u][n][0] : t[u][n][1];
					c >= 0
						? ((t[u][n][0] = a), (t[u][n][1] = a + c), (a = t[u][n][1]))
						: ((t[u][n][0] = o), (t[u][n][1] = o + c), (o = t[u][n][1]));
				}
	},
	d2 = function (t) {
		var r = t.length;
		if (!(r <= 0))
			for (var n = 0, i = t[0].length; n < i; ++n)
				for (var a = 0, o = 0; o < r; ++o) {
					var u = Zn(t[o][n][1]) ? t[o][n][0] : t[o][n][1];
					u >= 0
						? ((t[o][n][0] = a), (t[o][n][1] = a + u), (a = t[o][n][1]))
						: ((t[o][n][0] = 0), (t[o][n][1] = 0));
				}
	},
	v2 = {
		sign: h2,
		expand: Lw,
		none: yr,
		silhouette: Bw,
		wiggle: Rw,
		positive: d2,
	},
	y2 = function (t, r, n) {
		var i = r.map(function (u) {
				return u.props.dataKey;
			}),
			a = v2[n],
			o = Dw()
				.keys(i)
				.value(function (u, c) {
					return +Ue(u, c, 0);
				})
				.order(eu)
				.offset(a);
		return o(t);
	},
	m2 = function (t, r, n, i, a, o) {
		if (!t) return null;
		var u = o ? r.reverse() : r,
			c = {},
			s = u.reduce(function (l, p) {
				var h,
					d =
						(h = p.type) !== null && h !== void 0 && h.defaultProps
							? de(de({}, p.type.defaultProps), p.props)
							: p.props,
					v = d.stackId,
					y = d.hide;
				if (y) return l;
				var b = d[n],
					w = l[b] || { hasStack: !1, stackGroups: {} };
				if (Oe(v)) {
					var x = w.stackGroups[v] || {
						numericAxisId: n,
						cateAxisId: i,
						items: [],
					};
					x.items.push(p), (w.hasStack = !0), (w.stackGroups[v] = x);
				} else w.stackGroups[Jn('_stackId_')] = { numericAxisId: n, cateAxisId: i, items: [p] };
				return de(de({}, l), {}, dr({}, b, w));
			}, c),
			f = {};
		return Object.keys(s).reduce(function (l, p) {
			var h = s[p];
			if (h.hasStack) {
				var d = {};
				h.stackGroups = Object.keys(h.stackGroups).reduce(function (v, y) {
					var b = h.stackGroups[y];
					return de(
						de({}, v),
						{},
						dr({}, y, {
							numericAxisId: n,
							cateAxisId: i,
							items: b.items,
							stackedData: y2(t, b.items, a),
						}),
					);
				}, d);
			}
			return de(de({}, l), {}, dr({}, p, h));
		}, f);
	},
	g2 = function (t, r) {
		var n = r.realScaleType,
			i = r.type,
			a = r.tickCount,
			o = r.originalDomain,
			u = r.allowDecimals,
			c = n || r.scale;
		if (c !== 'auto' && c !== 'linear') return null;
		if (a && i === 'number' && o && (o[0] === 'auto' || o[1] === 'auto')) {
			var s = t.domain();
			if (!s.length) return null;
			var f = EI(s, a, u);
			return t.domain([Za(f), Ya(f)]), { niceTicks: f };
		}
		if (a && i === 'number') {
			var l = t.domain(),
				p = jI(l, a, u);
			return { niceTicks: p };
		}
		return null;
	};
function Rf(e) {
	var t = e.axis,
		r = e.ticks,
		n = e.bandSize,
		i = e.entry,
		a = e.index,
		o = e.dataKey;
	if (t.type === 'category') {
		if (!t.allowDuplicatedCategory && t.dataKey && !Q(i[t.dataKey])) {
			var u = Si(r, 'value', i[t.dataKey]);
			if (u) return u.coordinate + n / 2;
		}
		return r[a] ? r[a].coordinate + n / 2 : null;
	}
	var c = Ue(i, Q(o) ? t.dataKey : o);
	return Q(c) ? null : t.scale(c);
}
var Ff = function (t) {
		var r = t.axis,
			n = t.ticks,
			i = t.offset,
			a = t.bandSize,
			o = t.entry,
			u = t.index;
		if (r.type === 'category') return n[u] ? n[u].coordinate + i : null;
		var c = Ue(o, r.dataKey, r.domain[u]);
		return Q(c) ? null : r.scale(c) - a / 2 + i;
	},
	b2 = function (t) {
		var r = t.numericAxis,
			n = r.scale.domain();
		if (r.type === 'number') {
			var i = Math.min(n[0], n[1]),
				a = Math.max(n[0], n[1]);
			return i <= 0 && a >= 0 ? 0 : a < 0 ? a : i;
		}
		return n[0];
	},
	x2 = function (t, r) {
		var n,
			i =
				(n = t.type) !== null && n !== void 0 && n.defaultProps
					? de(de({}, t.type.defaultProps), t.props)
					: t.props,
			a = i.stackId;
		if (Oe(a)) {
			var o = r[a];
			if (o) {
				var u = o.items.indexOf(t);
				return u >= 0 ? o.stackedData[u] : null;
			}
		}
		return null;
	},
	w2 = function (t) {
		return t.reduce(
			function (r, n) {
				return [Za(n.concat([r[0]]).filter(R)), Ya(n.concat([r[1]]).filter(R))];
			},
			[1 / 0, -1 / 0],
		);
	},
	Fv = function (t, r, n) {
		return Object.keys(t)
			.reduce(
				function (i, a) {
					var o = t[a],
						u = o.stackedData,
						c = u.reduce(
							function (s, f) {
								var l = w2(f.slice(r, n + 1));
								return [Math.min(s[0], l[0]), Math.max(s[1], l[1])];
							},
							[1 / 0, -1 / 0],
						);
					return [Math.min(c[0], i[0]), Math.max(c[1], i[1])];
				},
				[1 / 0, -1 / 0],
			)
			.map(function (i) {
				return i === 1 / 0 || i === -1 / 0 ? 0 : i;
			});
	},
	zf = /^dataMin[\s]*-[\s]*([0-9]+([.]{1}[0-9]+){0,1})$/,
	Uf = /^dataMax[\s]*\+[\s]*([0-9]+([.]{1}[0-9]+){0,1})$/,
	ju = function (t, r, n) {
		if (J(t)) return t(r, n);
		if (!Array.isArray(t)) return r;
		var i = [];
		if (R(t[0])) i[0] = n ? t[0] : Math.min(t[0], r[0]);
		else if (zf.test(t[0])) {
			var a = +zf.exec(t[0])[1];
			i[0] = r[0] - a;
		} else J(t[0]) ? (i[0] = t[0](r[0])) : (i[0] = r[0]);
		if (R(t[1])) i[1] = n ? t[1] : Math.max(t[1], r[1]);
		else if (Uf.test(t[1])) {
			var o = +Uf.exec(t[1])[1];
			i[1] = r[1] + o;
		} else J(t[1]) ? (i[1] = t[1](r[1])) : (i[1] = r[1]);
		return i;
	},
	Qi = function (t, r, n) {
		if (t && t.scale && t.scale.bandwidth) {
			var i = t.scale.bandwidth();
			if (!n || i > 0) return i;
		}
		if (t && r && r.length >= 2) {
			for (
				var a = Lc(r, function (l) {
						return l.coordinate;
					}),
					o = 1 / 0,
					u = 1,
					c = a.length;
				u < c;
				u++
			) {
				var s = a[u],
					f = a[u - 1];
				o = Math.min((s.coordinate || 0) - (f.coordinate || 0), o);
			}
			return o === 1 / 0 ? 0 : o;
		}
		return n ? void 0 : 0;
	},
	Wf = function (t, r, n) {
		return !t || !t.length || Ja(t, Ke(n, 'type.defaultProps.domain')) ? r : t;
	},
	zv = function (t, r) {
		var n = t.type.defaultProps
				? de(de({}, t.type.defaultProps), t.props)
				: t.props,
			i = n.dataKey,
			a = n.name,
			o = n.unit,
			u = n.formatter,
			c = n.tooltipType,
			s = n.chartType,
			f = n.hide;
		return de(
			de({}, ee(t, !1)),
			{},
			{
				dataKey: i,
				unit: o,
				formatter: u,
				name: a || i,
				color: ss(t),
				value: Ue(r, i),
				type: c,
				payload: r,
				chartType: s,
				hide: f,
			},
		);
	};
function jn(e) {
	'@babel/helpers - typeof';
	return (
		(jn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		jn(e)
	);
}
function qf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Gf(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? qf(Object(r), !0).forEach(function (n) {
					O2(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: qf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function O2(e, t, r) {
	return (
		(t = S2(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function S2(e) {
	var t = _2(e, 'string');
	return jn(t) == 'symbol' ? t : t + '';
}
function _2(e, t) {
	if (jn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (jn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var ea = Math.PI / 180,
	A2 = function (t) {
		return (t * 180) / Math.PI;
	},
	$e = function (t, r, n, i) {
		return { x: t + Math.cos(-ea * i) * n, y: r + Math.sin(-ea * i) * n };
	},
	P2 = function (t, r) {
		var n = t.x,
			i = t.y,
			a = r.x,
			o = r.y;
		return Math.sqrt(Math.pow(n - a, 2) + Math.pow(i - o, 2));
	},
	$2 = function (t, r) {
		var n = t.x,
			i = t.y,
			a = r.cx,
			o = r.cy,
			u = P2({ x: n, y: i }, { x: a, y: o });
		if (u <= 0) return { radius: u };
		var c = (n - a) / u,
			s = Math.acos(c);
		return (
			i > o && (s = 2 * Math.PI - s),
			{ radius: u, angle: A2(s), angleInRadian: s }
		);
	},
	T2 = function (t) {
		var r = t.startAngle,
			n = t.endAngle,
			i = Math.floor(r / 360),
			a = Math.floor(n / 360),
			o = Math.min(i, a);
		return { startAngle: r - o * 360, endAngle: n - o * 360 };
	},
	E2 = function (t, r) {
		var n = r.startAngle,
			i = r.endAngle,
			a = Math.floor(n / 360),
			o = Math.floor(i / 360),
			u = Math.min(a, o);
		return t + u * 360;
	},
	Hf = function (t, r) {
		var n = t.x,
			i = t.y,
			a = $2({ x: n, y: i }, r),
			o = a.radius,
			u = a.angle,
			c = r.innerRadius,
			s = r.outerRadius;
		if (o < c || o > s) return !1;
		if (o === 0) return !0;
		var f = T2(r),
			l = f.startAngle,
			p = f.endAngle,
			h = u,
			d;
		if (l <= p) {
			for (; h > p; ) h -= 360;
			for (; h < l; ) h += 360;
			d = h >= l && h <= p;
		} else {
			for (; h > l; ) h -= 360;
			for (; h < p; ) h += 360;
			d = h >= p && h <= l;
		}
		return d ? Gf(Gf({}, r), {}, { radius: o, angle: E2(h, r) }) : null;
	};
function Mn(e) {
	'@babel/helpers - typeof';
	return (
		(Mn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Mn(e)
	);
}
var j2 = ['offset'];
function M2(e) {
	return k2(e) || N2(e) || I2(e) || C2();
}
function C2() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function I2(e, t) {
	if (e) {
		if (typeof e == 'string') return Mu(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Mu(e, t);
	}
}
function N2(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function k2(e) {
	if (Array.isArray(e)) return Mu(e);
}
function Mu(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function D2(e, t) {
	if (e == null) return {};
	var r = L2(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function L2(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function Kf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function we(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Kf(Object(r), !0).forEach(function (n) {
					B2(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Kf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function B2(e, t, r) {
	return (
		(t = R2(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function R2(e) {
	var t = F2(e, 'string');
	return Mn(t) == 'symbol' ? t : t + '';
}
function F2(e, t) {
	if (Mn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Mn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Cn() {
	return (
		(Cn = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Cn.apply(this, arguments)
	);
}
var z2 = function (t) {
		var r = t.value,
			n = t.formatter,
			i = Q(t.children) ? r : t.children;
		return J(n) ? n(i) : i;
	},
	U2 = function (t, r) {
		var n = nt(r - t),
			i = Math.min(Math.abs(r - t), 360);
		return n * i;
	},
	W2 = function (t, r, n) {
		var i = t.position,
			a = t.viewBox,
			o = t.offset,
			u = t.className,
			c = a,
			s = c.cx,
			f = c.cy,
			l = c.innerRadius,
			p = c.outerRadius,
			h = c.startAngle,
			d = c.endAngle,
			v = c.clockWise,
			y = (l + p) / 2,
			b = U2(h, d),
			w = b >= 0 ? 1 : -1,
			x,
			S;
		i === 'insideStart'
			? ((x = h + w * o), (S = v))
			: i === 'insideEnd'
			? ((x = d - w * o), (S = !v))
			: i === 'end' && ((x = d + w * o), (S = v)),
			(S = b <= 0 ? S : !S);
		var m = $e(s, f, y, x),
			g = $e(s, f, y, x + (S ? 1 : -1) * 359),
			O = 'M'
				.concat(m.x, ',')
				.concat(
					m.y,
					`
    A`,
				)
				.concat(y, ',')
				.concat(y, ',0,1,')
				.concat(
					S ? 0 : 1,
					`,
    `,
				)
				.concat(g.x, ',')
				.concat(g.y),
			_ = Q(t.id) ? Jn('recharts-radial-line-') : t.id;
		return $.createElement(
			'text',
			Cn({}, n, {
				dominantBaseline: 'central',
				className: ne('recharts-radial-bar-label', u),
			}),
			$.createElement('defs', null, $.createElement('path', { id: _, d: O })),
			$.createElement('textPath', { xlinkHref: '#'.concat(_) }, r),
		);
	},
	q2 = function (t) {
		var r = t.viewBox,
			n = t.offset,
			i = t.position,
			a = r,
			o = a.cx,
			u = a.cy,
			c = a.innerRadius,
			s = a.outerRadius,
			f = a.startAngle,
			l = a.endAngle,
			p = (f + l) / 2;
		if (i === 'outside') {
			var h = $e(o, u, s + n, p),
				d = h.x,
				v = h.y;
			return {
				x: d,
				y: v,
				textAnchor: d >= o ? 'start' : 'end',
				verticalAnchor: 'middle',
			};
		}
		if (i === 'center')
			return { x: o, y: u, textAnchor: 'middle', verticalAnchor: 'middle' };
		if (i === 'centerTop')
			return { x: o, y: u, textAnchor: 'middle', verticalAnchor: 'start' };
		if (i === 'centerBottom')
			return { x: o, y: u, textAnchor: 'middle', verticalAnchor: 'end' };
		var y = (c + s) / 2,
			b = $e(o, u, y, p),
			w = b.x,
			x = b.y;
		return { x: w, y: x, textAnchor: 'middle', verticalAnchor: 'middle' };
	},
	G2 = function (t) {
		var r = t.viewBox,
			n = t.parentViewBox,
			i = t.offset,
			a = t.position,
			o = r,
			u = o.x,
			c = o.y,
			s = o.width,
			f = o.height,
			l = f >= 0 ? 1 : -1,
			p = l * i,
			h = l > 0 ? 'end' : 'start',
			d = l > 0 ? 'start' : 'end',
			v = s >= 0 ? 1 : -1,
			y = v * i,
			b = v > 0 ? 'end' : 'start',
			w = v > 0 ? 'start' : 'end';
		if (a === 'top') {
			var x = {
				x: u + s / 2,
				y: c - l * i,
				textAnchor: 'middle',
				verticalAnchor: h,
			};
			return we(we({}, x), n ? { height: Math.max(c - n.y, 0), width: s } : {});
		}
		if (a === 'bottom') {
			var S = {
				x: u + s / 2,
				y: c + f + p,
				textAnchor: 'middle',
				verticalAnchor: d,
			};
			return we(
				we({}, S),
				n ? { height: Math.max(n.y + n.height - (c + f), 0), width: s } : {},
			);
		}
		if (a === 'left') {
			var m = {
				x: u - y,
				y: c + f / 2,
				textAnchor: b,
				verticalAnchor: 'middle',
			};
			return we(
				we({}, m),
				n ? { width: Math.max(m.x - n.x, 0), height: f } : {},
			);
		}
		if (a === 'right') {
			var g = {
				x: u + s + y,
				y: c + f / 2,
				textAnchor: w,
				verticalAnchor: 'middle',
			};
			return we(
				we({}, g),
				n ? { width: Math.max(n.x + n.width - g.x, 0), height: f } : {},
			);
		}
		var O = n ? { width: s, height: f } : {};
		return a === 'insideLeft'
			? we(
					{ x: u + y, y: c + f / 2, textAnchor: w, verticalAnchor: 'middle' },
					O,
			  )
			: a === 'insideRight'
			? we(
					{
						x: u + s - y,
						y: c + f / 2,
						textAnchor: b,
						verticalAnchor: 'middle',
					},
					O,
			  )
			: a === 'insideTop'
			? we(
					{ x: u + s / 2, y: c + p, textAnchor: 'middle', verticalAnchor: d },
					O,
			  )
			: a === 'insideBottom'
			? we(
					{
						x: u + s / 2,
						y: c + f - p,
						textAnchor: 'middle',
						verticalAnchor: h,
					},
					O,
			  )
			: a === 'insideTopLeft'
			? we({ x: u + y, y: c + p, textAnchor: w, verticalAnchor: d }, O)
			: a === 'insideTopRight'
			? we({ x: u + s - y, y: c + p, textAnchor: b, verticalAnchor: d }, O)
			: a === 'insideBottomLeft'
			? we({ x: u + y, y: c + f - p, textAnchor: w, verticalAnchor: h }, O)
			: a === 'insideBottomRight'
			? we({ x: u + s - y, y: c + f - p, textAnchor: b, verticalAnchor: h }, O)
			: Rr(a) && (R(a.x) || Uo(a.x)) && (R(a.y) || Uo(a.y))
			? we(
					{
						x: u + Yt(a.x, s),
						y: c + Yt(a.y, f),
						textAnchor: 'end',
						verticalAnchor: 'end',
					},
					O,
			  )
			: we(
					{
						x: u + s / 2,
						y: c + f / 2,
						textAnchor: 'middle',
						verticalAnchor: 'middle',
					},
					O,
			  );
	},
	H2 = function (t) {
		return 'cx' in t && R(t.cx);
	};
function Ee(e) {
	var t = e.offset,
		r = t === void 0 ? 5 : t,
		n = D2(e, j2),
		i = we({ offset: r }, n),
		a = i.viewBox,
		o = i.position,
		u = i.value,
		c = i.children,
		s = i.content,
		f = i.className,
		l = f === void 0 ? '' : f,
		p = i.textBreakAll;
	if (!a || (Q(u) && Q(c) && !L.isValidElement(s) && !J(s))) return null;
	if (L.isValidElement(s)) return L.cloneElement(s, i);
	var h;
	if (J(s)) {
		if (((h = L.createElement(s, i)), L.isValidElement(h))) return h;
	} else h = z2(i);
	var d = H2(a),
		v = ee(i, !0);
	if (d && (o === 'insideStart' || o === 'insideEnd' || o === 'end'))
		return W2(i, h, v);
	var y = d ? q2(i) : G2(i);
	return $.createElement(
		Ri,
		Cn({ className: ne('recharts-label', l) }, v, y, { breakAll: p }),
		h,
	);
}
Ee.displayName = 'Label';
var Uv = function (t) {
		var r = t.cx,
			n = t.cy,
			i = t.angle,
			a = t.startAngle,
			o = t.endAngle,
			u = t.r,
			c = t.radius,
			s = t.innerRadius,
			f = t.outerRadius,
			l = t.x,
			p = t.y,
			h = t.top,
			d = t.left,
			v = t.width,
			y = t.height,
			b = t.clockWise,
			w = t.labelViewBox;
		if (w) return w;
		if (R(v) && R(y)) {
			if (R(l) && R(p)) return { x: l, y: p, width: v, height: y };
			if (R(h) && R(d)) return { x: h, y: d, width: v, height: y };
		}
		return R(l) && R(p)
			? { x: l, y: p, width: 0, height: 0 }
			: R(r) && R(n)
			? {
					cx: r,
					cy: n,
					startAngle: a || i || 0,
					endAngle: o || i || 0,
					innerRadius: s || 0,
					outerRadius: f || c || u || 0,
					clockWise: b,
			  }
			: t.viewBox
			? t.viewBox
			: {};
	},
	K2 = function (t, r) {
		return t
			? t === !0
				? $.createElement(Ee, { key: 'label-implicit', viewBox: r })
				: Oe(t)
				? $.createElement(Ee, { key: 'label-implicit', viewBox: r, value: t })
				: L.isValidElement(t)
				? t.type === Ee
					? L.cloneElement(t, { key: 'label-implicit', viewBox: r })
					: $.createElement(Ee, {
							key: 'label-implicit',
							content: t,
							viewBox: r,
					  })
				: J(t)
				? $.createElement(Ee, { key: 'label-implicit', content: t, viewBox: r })
				: Rr(t)
				? $.createElement(Ee, Cn({ viewBox: r }, t, { key: 'label-implicit' }))
				: null
			: null;
	},
	V2 = function (t, r) {
		var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0;
		if (!t || (!t.children && n && !t.label)) return null;
		var i = t.children,
			a = Uv(t),
			o = Ve(i, Ee).map(function (c, s) {
				return L.cloneElement(c, { viewBox: r || a, key: 'label-'.concat(s) });
			});
		if (!n) return o;
		var u = K2(t.label, r || a);
		return [u].concat(M2(o));
	};
Ee.parseViewBox = Uv;
Ee.renderCallByParent = V2;
function X2(e) {
	var t = e == null ? 0 : e.length;
	return t ? e[t - 1] : void 0;
}
var Y2 = X2;
const Z2 = fe(Y2);
function In(e) {
	'@babel/helpers - typeof';
	return (
		(In =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		In(e)
	);
}
var J2 = ['valueAccessor'],
	Q2 = ['data', 'dataKey', 'clockWise', 'id', 'textBreakAll'];
function eN(e) {
	return iN(e) || nN(e) || rN(e) || tN();
}
function tN() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function rN(e, t) {
	if (e) {
		if (typeof e == 'string') return Cu(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Cu(e, t);
	}
}
function nN(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function iN(e) {
	if (Array.isArray(e)) return Cu(e);
}
function Cu(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function ta() {
	return (
		(ta = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		ta.apply(this, arguments)
	);
}
function Vf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Xf(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Vf(Object(r), !0).forEach(function (n) {
					aN(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Vf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function aN(e, t, r) {
	return (
		(t = oN(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function oN(e) {
	var t = uN(e, 'string');
	return In(t) == 'symbol' ? t : t + '';
}
function uN(e, t) {
	if (In(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (In(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Yf(e, t) {
	if (e == null) return {};
	var r = cN(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function cN(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
var sN = function (t) {
	return Array.isArray(t.value) ? Z2(t.value) : t.value;
};
function Mt(e) {
	var t = e.valueAccessor,
		r = t === void 0 ? sN : t,
		n = Yf(e, J2),
		i = n.data,
		a = n.dataKey,
		o = n.clockWise,
		u = n.id,
		c = n.textBreakAll,
		s = Yf(n, Q2);
	return !i || !i.length
		? null
		: $.createElement(
				ve,
				{ className: 'recharts-label-list' },
				i.map(function (f, l) {
					var p = Q(a) ? r(f, l) : Ue(f && f.payload, a),
						h = Q(u) ? {} : { id: ''.concat(u, '-').concat(l) };
					return $.createElement(
						Ee,
						ta({}, ee(f, !0), s, h, {
							parentViewBox: f.parentViewBox,
							value: p,
							textBreakAll: c,
							viewBox: Ee.parseViewBox(
								Q(o) ? f : Xf(Xf({}, f), {}, { clockWise: o }),
							),
							key: 'label-'.concat(l),
							index: l,
						}),
					);
				}),
		  );
}
Mt.displayName = 'LabelList';
function lN(e, t) {
	return e
		? e === !0
			? $.createElement(Mt, { key: 'labelList-implicit', data: t })
			: $.isValidElement(e) || J(e)
			? $.createElement(Mt, { key: 'labelList-implicit', data: t, content: e })
			: Rr(e)
			? $.createElement(Mt, ta({ data: t }, e, { key: 'labelList-implicit' }))
			: null
		: null;
}
function fN(e, t) {
	var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0;
	if (!e || (!e.children && r && !e.label)) return null;
	var n = e.children,
		i = Ve(n, Mt).map(function (o, u) {
			return L.cloneElement(o, { data: t, key: 'labelList-'.concat(u) });
		});
	if (!r) return i;
	var a = lN(e.label, t);
	return [a].concat(eN(i));
}
Mt.renderCallByParent = fN;
function Nn(e) {
	'@babel/helpers - typeof';
	return (
		(Nn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Nn(e)
	);
}
function Iu() {
	return (
		(Iu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Iu.apply(this, arguments)
	);
}
function Zf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Jf(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Zf(Object(r), !0).forEach(function (n) {
					pN(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Zf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function pN(e, t, r) {
	return (
		(t = hN(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function hN(e) {
	var t = dN(e, 'string');
	return Nn(t) == 'symbol' ? t : t + '';
}
function dN(e, t) {
	if (Nn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Nn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var vN = function (t, r) {
		var n = nt(r - t),
			i = Math.min(Math.abs(r - t), 359.999);
		return n * i;
	},
	mi = function (t) {
		var r = t.cx,
			n = t.cy,
			i = t.radius,
			a = t.angle,
			o = t.sign,
			u = t.isExternal,
			c = t.cornerRadius,
			s = t.cornerIsExternal,
			f = c * (u ? 1 : -1) + i,
			l = Math.asin(c / f) / ea,
			p = s ? a : a + o * l,
			h = $e(r, n, f, p),
			d = $e(r, n, i, p),
			v = s ? a - o * l : a,
			y = $e(r, n, f * Math.cos(l * ea), v);
		return { center: h, circleTangency: d, lineTangency: y, theta: l };
	},
	Wv = function (t) {
		var r = t.cx,
			n = t.cy,
			i = t.innerRadius,
			a = t.outerRadius,
			o = t.startAngle,
			u = t.endAngle,
			c = vN(o, u),
			s = o + c,
			f = $e(r, n, a, o),
			l = $e(r, n, a, s),
			p = 'M '
				.concat(f.x, ',')
				.concat(
					f.y,
					`
    A `,
				)
				.concat(a, ',')
				.concat(
					a,
					`,0,
    `,
				)
				.concat(+(Math.abs(c) > 180), ',')
				.concat(
					+(o > s),
					`,
    `,
				)
				.concat(l.x, ',')
				.concat(
					l.y,
					`
  `,
				);
		if (i > 0) {
			var h = $e(r, n, i, o),
				d = $e(r, n, i, s);
			p += 'L '
				.concat(d.x, ',')
				.concat(
					d.y,
					`
            A `,
				)
				.concat(i, ',')
				.concat(
					i,
					`,0,
            `,
				)
				.concat(+(Math.abs(c) > 180), ',')
				.concat(
					+(o <= s),
					`,
            `,
				)
				.concat(h.x, ',')
				.concat(h.y, ' Z');
		} else p += 'L '.concat(r, ',').concat(n, ' Z');
		return p;
	},
	yN = function (t) {
		var r = t.cx,
			n = t.cy,
			i = t.innerRadius,
			a = t.outerRadius,
			o = t.cornerRadius,
			u = t.forceCornerRadius,
			c = t.cornerIsExternal,
			s = t.startAngle,
			f = t.endAngle,
			l = nt(f - s),
			p = mi({
				cx: r,
				cy: n,
				radius: a,
				angle: s,
				sign: l,
				cornerRadius: o,
				cornerIsExternal: c,
			}),
			h = p.circleTangency,
			d = p.lineTangency,
			v = p.theta,
			y = mi({
				cx: r,
				cy: n,
				radius: a,
				angle: f,
				sign: -l,
				cornerRadius: o,
				cornerIsExternal: c,
			}),
			b = y.circleTangency,
			w = y.lineTangency,
			x = y.theta,
			S = c ? Math.abs(s - f) : Math.abs(s - f) - v - x;
		if (S < 0)
			return u
				? 'M '
						.concat(d.x, ',')
						.concat(
							d.y,
							`
        a`,
						)
						.concat(o, ',')
						.concat(o, ',0,0,1,')
						.concat(
							o * 2,
							`,0
        a`,
						)
						.concat(o, ',')
						.concat(o, ',0,0,1,')
						.concat(
							-o * 2,
							`,0
      `,
						)
				: Wv({
						cx: r,
						cy: n,
						innerRadius: i,
						outerRadius: a,
						startAngle: s,
						endAngle: f,
				  });
		var m = 'M '
			.concat(d.x, ',')
			.concat(
				d.y,
				`
    A`,
			)
			.concat(o, ',')
			.concat(o, ',0,0,')
			.concat(+(l < 0), ',')
			.concat(h.x, ',')
			.concat(
				h.y,
				`
    A`,
			)
			.concat(a, ',')
			.concat(a, ',0,')
			.concat(+(S > 180), ',')
			.concat(+(l < 0), ',')
			.concat(b.x, ',')
			.concat(
				b.y,
				`
    A`,
			)
			.concat(o, ',')
			.concat(o, ',0,0,')
			.concat(+(l < 0), ',')
			.concat(w.x, ',')
			.concat(
				w.y,
				`
  `,
			);
		if (i > 0) {
			var g = mi({
					cx: r,
					cy: n,
					radius: i,
					angle: s,
					sign: l,
					isExternal: !0,
					cornerRadius: o,
					cornerIsExternal: c,
				}),
				O = g.circleTangency,
				_ = g.lineTangency,
				A = g.theta,
				E = mi({
					cx: r,
					cy: n,
					radius: i,
					angle: f,
					sign: -l,
					isExternal: !0,
					cornerRadius: o,
					cornerIsExternal: c,
				}),
				P = E.circleTangency,
				T = E.lineTangency,
				j = E.theta,
				C = c ? Math.abs(s - f) : Math.abs(s - f) - A - j;
			if (C < 0 && o === 0)
				return ''.concat(m, 'L').concat(r, ',').concat(n, 'Z');
			m += 'L'
				.concat(T.x, ',')
				.concat(
					T.y,
					`
      A`,
				)
				.concat(o, ',')
				.concat(o, ',0,0,')
				.concat(+(l < 0), ',')
				.concat(P.x, ',')
				.concat(
					P.y,
					`
      A`,
				)
				.concat(i, ',')
				.concat(i, ',0,')
				.concat(+(C > 180), ',')
				.concat(+(l > 0), ',')
				.concat(O.x, ',')
				.concat(
					O.y,
					`
      A`,
				)
				.concat(o, ',')
				.concat(o, ',0,0,')
				.concat(+(l < 0), ',')
				.concat(_.x, ',')
				.concat(_.y, 'Z');
		} else m += 'L'.concat(r, ',').concat(n, 'Z');
		return m;
	},
	mN = {
		cx: 0,
		cy: 0,
		innerRadius: 0,
		outerRadius: 0,
		startAngle: 0,
		endAngle: 0,
		cornerRadius: 0,
		forceCornerRadius: !1,
		cornerIsExternal: !1,
	},
	qv = function (t) {
		var r = Jf(Jf({}, mN), t),
			n = r.cx,
			i = r.cy,
			a = r.innerRadius,
			o = r.outerRadius,
			u = r.cornerRadius,
			c = r.forceCornerRadius,
			s = r.cornerIsExternal,
			f = r.startAngle,
			l = r.endAngle,
			p = r.className;
		if (o < a || f === l) return null;
		var h = ne('recharts-sector', p),
			d = o - a,
			v = Yt(u, d, 0, !0),
			y;
		return (
			v > 0 && Math.abs(f - l) < 360
				? (y = yN({
						cx: n,
						cy: i,
						innerRadius: a,
						outerRadius: o,
						cornerRadius: Math.min(v, d / 2),
						forceCornerRadius: c,
						cornerIsExternal: s,
						startAngle: f,
						endAngle: l,
				  }))
				: (y = Wv({
						cx: n,
						cy: i,
						innerRadius: a,
						outerRadius: o,
						startAngle: f,
						endAngle: l,
				  })),
			$.createElement(
				'path',
				Iu({}, ee(r, !0), { className: h, d: y, role: 'img' }),
			)
		);
	};
function kn(e) {
	'@babel/helpers - typeof';
	return (
		(kn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		kn(e)
	);
}
function Nu() {
	return (
		(Nu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Nu.apply(this, arguments)
	);
}
function Qf(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function ep(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Qf(Object(r), !0).forEach(function (n) {
					gN(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Qf(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function gN(e, t, r) {
	return (
		(t = bN(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function bN(e) {
	var t = xN(e, 'string');
	return kn(t) == 'symbol' ? t : t + '';
}
function xN(e, t) {
	if (kn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (kn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var tp = {
		curveBasisClosed: Aw,
		curveBasisOpen: Pw,
		curveBasis: _w,
		curveBumpX: lw,
		curveBumpY: fw,
		curveLinearClosed: $w,
		curveLinear: Ra,
		curveMonotoneX: Tw,
		curveMonotoneY: Ew,
		curveNatural: jw,
		curveStep: Mw,
		curveStepAfter: Iw,
		curveStepBefore: Cw,
	},
	gi = function (t) {
		return t.x === +t.x && t.y === +t.y;
	},
	an = function (t) {
		return t.x;
	},
	on = function (t) {
		return t.y;
	},
	wN = function (t, r) {
		if (J(t)) return t;
		var n = 'curve'.concat(La(t));
		return (n === 'curveMonotone' || n === 'curveBump') && r
			? tp[''.concat(n).concat(r === 'vertical' ? 'Y' : 'X')]
			: tp[n] || Ra;
	},
	ON = function (t) {
		var r = t.type,
			n = r === void 0 ? 'linear' : r,
			i = t.points,
			a = i === void 0 ? [] : i,
			o = t.baseLine,
			u = t.layout,
			c = t.connectNulls,
			s = c === void 0 ? !1 : c,
			f = wN(n, u),
			l = s
				? a.filter(function (v) {
						return gi(v);
				  })
				: a,
			p;
		if (Array.isArray(o)) {
			var h = s
					? o.filter(function (v) {
							return gi(v);
					  })
					: o,
				d = l.map(function (v, y) {
					return ep(ep({}, v), {}, { base: h[y] });
				});
			return (
				u === 'vertical'
					? (p = si()
							.y(on)
							.x1(an)
							.x0(function (v) {
								return v.base.x;
							}))
					: (p = si()
							.x(an)
							.y1(on)
							.y0(function (v) {
								return v.base.y;
							})),
				p.defined(gi).curve(f),
				p(d)
			);
		}
		return (
			u === 'vertical' && R(o)
				? (p = si().y(on).x1(an).x0(o))
				: R(o)
				? (p = si().x(an).y1(on).y0(o))
				: (p = Gh().x(an).y(on)),
			p.defined(gi).curve(f),
			p(l)
		);
	},
	ku = function (t) {
		var r = t.className,
			n = t.points,
			i = t.path,
			a = t.pathRef;
		if ((!n || !n.length) && !i) return null;
		var o = n && n.length ? ON(t) : i;
		return $.createElement(
			'path',
			Nu({}, ee(t, !1), _i(t), {
				className: ne('recharts-curve', r),
				d: o,
				ref: a,
			}),
		);
	},
	SN = Object.getOwnPropertyNames,
	_N = Object.getOwnPropertySymbols,
	AN = Object.prototype.hasOwnProperty;
function rp(e, t) {
	return function (n, i, a) {
		return e(n, i, a) && t(n, i, a);
	};
}
function bi(e) {
	return function (r, n, i) {
		if (!r || !n || typeof r != 'object' || typeof n != 'object')
			return e(r, n, i);
		var a = i.cache,
			o = a.get(r),
			u = a.get(n);
		if (o && u) return o === n && u === r;
		a.set(r, n), a.set(n, r);
		var c = e(r, n, i);
		return a.delete(r), a.delete(n), c;
	};
}
function np(e) {
	return SN(e).concat(_N(e));
}
var Gv =
	Object.hasOwn ||
	function (e, t) {
		return AN.call(e, t);
	};
function Xr(e, t) {
	return e || t ? e === t : e === t || (e !== e && t !== t);
}
var Hv = '_owner',
	ip = Object.getOwnPropertyDescriptor,
	ap = Object.keys;
function PN(e, t, r) {
	var n = e.length;
	if (t.length !== n) return !1;
	for (; n-- > 0; ) if (!r.equals(e[n], t[n], n, n, e, t, r)) return !1;
	return !0;
}
function $N(e, t) {
	return Xr(e.getTime(), t.getTime());
}
function op(e, t, r) {
	if (e.size !== t.size) return !1;
	for (var n = {}, i = e.entries(), a = 0, o, u; (o = i.next()) && !o.done; ) {
		for (var c = t.entries(), s = !1, f = 0; (u = c.next()) && !u.done; ) {
			var l = o.value,
				p = l[0],
				h = l[1],
				d = u.value,
				v = d[0],
				y = d[1];
			!s &&
				!n[f] &&
				(s = r.equals(p, v, a, f, e, t, r) && r.equals(h, y, p, v, e, t, r)) &&
				(n[f] = !0),
				f++;
		}
		if (!s) return !1;
		a++;
	}
	return !0;
}
function TN(e, t, r) {
	var n = ap(e),
		i = n.length;
	if (ap(t).length !== i) return !1;
	for (var a; i-- > 0; )
		if (
			((a = n[i]),
			(a === Hv && (e.$$typeof || t.$$typeof) && e.$$typeof !== t.$$typeof) ||
				!Gv(t, a) ||
				!r.equals(e[a], t[a], a, a, e, t, r))
		)
			return !1;
	return !0;
}
function un(e, t, r) {
	var n = np(e),
		i = n.length;
	if (np(t).length !== i) return !1;
	for (var a, o, u; i-- > 0; )
		if (
			((a = n[i]),
			(a === Hv && (e.$$typeof || t.$$typeof) && e.$$typeof !== t.$$typeof) ||
				!Gv(t, a) ||
				!r.equals(e[a], t[a], a, a, e, t, r) ||
				((o = ip(e, a)),
				(u = ip(t, a)),
				(o || u) &&
					(!o ||
						!u ||
						o.configurable !== u.configurable ||
						o.enumerable !== u.enumerable ||
						o.writable !== u.writable)))
		)
			return !1;
	return !0;
}
function EN(e, t) {
	return Xr(e.valueOf(), t.valueOf());
}
function jN(e, t) {
	return e.source === t.source && e.flags === t.flags;
}
function up(e, t, r) {
	if (e.size !== t.size) return !1;
	for (var n = {}, i = e.values(), a, o; (a = i.next()) && !a.done; ) {
		for (var u = t.values(), c = !1, s = 0; (o = u.next()) && !o.done; )
			!c &&
				!n[s] &&
				(c = r.equals(a.value, o.value, a.value, o.value, e, t, r)) &&
				(n[s] = !0),
				s++;
		if (!c) return !1;
	}
	return !0;
}
function MN(e, t) {
	var r = e.length;
	if (t.length !== r) return !1;
	for (; r-- > 0; ) if (e[r] !== t[r]) return !1;
	return !0;
}
var CN = '[object Arguments]',
	IN = '[object Boolean]',
	NN = '[object Date]',
	kN = '[object Map]',
	DN = '[object Number]',
	LN = '[object Object]',
	BN = '[object RegExp]',
	RN = '[object Set]',
	FN = '[object String]',
	zN = Array.isArray,
	cp =
		typeof ArrayBuffer == 'function' && ArrayBuffer.isView
			? ArrayBuffer.isView
			: null,
	sp = Object.assign,
	UN = Object.prototype.toString.call.bind(Object.prototype.toString);
function WN(e) {
	var t = e.areArraysEqual,
		r = e.areDatesEqual,
		n = e.areMapsEqual,
		i = e.areObjectsEqual,
		a = e.arePrimitiveWrappersEqual,
		o = e.areRegExpsEqual,
		u = e.areSetsEqual,
		c = e.areTypedArraysEqual;
	return function (f, l, p) {
		if (f === l) return !0;
		if (f == null || l == null || typeof f != 'object' || typeof l != 'object')
			return f !== f && l !== l;
		var h = f.constructor;
		if (h !== l.constructor) return !1;
		if (h === Object) return i(f, l, p);
		if (zN(f)) return t(f, l, p);
		if (cp != null && cp(f)) return c(f, l, p);
		if (h === Date) return r(f, l, p);
		if (h === RegExp) return o(f, l, p);
		if (h === Map) return n(f, l, p);
		if (h === Set) return u(f, l, p);
		var d = UN(f);
		return d === NN
			? r(f, l, p)
			: d === BN
			? o(f, l, p)
			: d === kN
			? n(f, l, p)
			: d === RN
			? u(f, l, p)
			: d === LN
			? typeof f.then != 'function' && typeof l.then != 'function' && i(f, l, p)
			: d === CN
			? i(f, l, p)
			: d === IN || d === DN || d === FN
			? a(f, l, p)
			: !1;
	};
}
function qN(e) {
	var t = e.circular,
		r = e.createCustomConfig,
		n = e.strict,
		i = {
			areArraysEqual: n ? un : PN,
			areDatesEqual: $N,
			areMapsEqual: n ? rp(op, un) : op,
			areObjectsEqual: n ? un : TN,
			arePrimitiveWrappersEqual: EN,
			areRegExpsEqual: jN,
			areSetsEqual: n ? rp(up, un) : up,
			areTypedArraysEqual: n ? un : MN,
		};
	if ((r && (i = sp({}, i, r(i))), t)) {
		var a = bi(i.areArraysEqual),
			o = bi(i.areMapsEqual),
			u = bi(i.areObjectsEqual),
			c = bi(i.areSetsEqual);
		i = sp({}, i, {
			areArraysEqual: a,
			areMapsEqual: o,
			areObjectsEqual: u,
			areSetsEqual: c,
		});
	}
	return i;
}
function GN(e) {
	return function (t, r, n, i, a, o, u) {
		return e(t, r, u);
	};
}
function HN(e) {
	var t = e.circular,
		r = e.comparator,
		n = e.createState,
		i = e.equals,
		a = e.strict;
	if (n)
		return function (c, s) {
			var f = n(),
				l = f.cache,
				p = l === void 0 ? (t ? new WeakMap() : void 0) : l,
				h = f.meta;
			return r(c, s, { cache: p, equals: i, meta: h, strict: a });
		};
	if (t)
		return function (c, s) {
			return r(c, s, {
				cache: new WeakMap(),
				equals: i,
				meta: void 0,
				strict: a,
			});
		};
	var o = { cache: void 0, equals: i, meta: void 0, strict: a };
	return function (c, s) {
		return r(c, s, o);
	};
}
var KN = Dt();
Dt({ strict: !0 });
Dt({ circular: !0 });
Dt({ circular: !0, strict: !0 });
Dt({
	createInternalComparator: function () {
		return Xr;
	},
});
Dt({
	strict: !0,
	createInternalComparator: function () {
		return Xr;
	},
});
Dt({
	circular: !0,
	createInternalComparator: function () {
		return Xr;
	},
});
Dt({
	circular: !0,
	createInternalComparator: function () {
		return Xr;
	},
	strict: !0,
});
function Dt(e) {
	e === void 0 && (e = {});
	var t = e.circular,
		r = t === void 0 ? !1 : t,
		n = e.createInternalComparator,
		i = e.createState,
		a = e.strict,
		o = a === void 0 ? !1 : a,
		u = qN(e),
		c = WN(u),
		s = n ? n(c) : GN(c);
	return HN({
		circular: r,
		comparator: c,
		createState: i,
		equals: s,
		strict: o,
	});
}
function VN(e) {
	typeof requestAnimationFrame < 'u' && requestAnimationFrame(e);
}
function lp(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0,
		r = -1,
		n = function i(a) {
			r < 0 && (r = a), a - r > t ? (e(a), (r = -1)) : VN(i);
		};
	requestAnimationFrame(n);
}
function Du(e) {
	'@babel/helpers - typeof';
	return (
		(Du =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Du(e)
	);
}
function XN(e) {
	return QN(e) || JN(e) || ZN(e) || YN();
}
function YN() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ZN(e, t) {
	if (e) {
		if (typeof e == 'string') return fp(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return fp(e, t);
	}
}
function fp(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function JN(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function QN(e) {
	if (Array.isArray(e)) return e;
}
function ek() {
	var e = {},
		t = function () {
			return null;
		},
		r = !1,
		n = function i(a) {
			if (!r) {
				if (Array.isArray(a)) {
					if (!a.length) return;
					var o = a,
						u = XN(o),
						c = u[0],
						s = u.slice(1);
					if (typeof c == 'number') {
						lp(i.bind(null, s), c);
						return;
					}
					i(c), lp(i.bind(null, s));
					return;
				}
				Du(a) === 'object' && ((e = a), t(e)), typeof a == 'function' && a();
			}
		};
	return {
		stop: function () {
			r = !0;
		},
		start: function (a) {
			(r = !1), n(a);
		},
		subscribe: function (a) {
			return (
				(t = a),
				function () {
					t = function () {
						return null;
					};
				}
			);
		},
	};
}
function Dn(e) {
	'@babel/helpers - typeof';
	return (
		(Dn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Dn(e)
	);
}
function pp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function hp(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? pp(Object(r), !0).forEach(function (n) {
					Kv(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: pp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function Kv(e, t, r) {
	return (
		(t = tk(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function tk(e) {
	var t = rk(e, 'string');
	return Dn(t) === 'symbol' ? t : String(t);
}
function rk(e, t) {
	if (Dn(e) !== 'object' || e === null) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Dn(n) !== 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var nk = function (t, r) {
		return [Object.keys(t), Object.keys(r)].reduce(function (n, i) {
			return n.filter(function (a) {
				return i.includes(a);
			});
		});
	},
	ik = function (t) {
		return t;
	},
	ak = function (t) {
		return t.replace(/([A-Z])/g, function (r) {
			return '-'.concat(r.toLowerCase());
		});
	},
	hn = function (t, r) {
		return Object.keys(r).reduce(function (n, i) {
			return hp(hp({}, n), {}, Kv({}, i, t(i, r[i])));
		}, {});
	},
	dp = function (t, r, n) {
		return t
			.map(function (i) {
				return ''.concat(ak(i), ' ').concat(r, 'ms ').concat(n);
			})
			.join(',');
	};
function ok(e, t) {
	return sk(e) || ck(e, t) || Vv(e, t) || uk();
}
function uk() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ck(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function sk(e) {
	if (Array.isArray(e)) return e;
}
function lk(e) {
	return hk(e) || pk(e) || Vv(e) || fk();
}
function fk() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Vv(e, t) {
	if (e) {
		if (typeof e == 'string') return Lu(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Lu(e, t);
	}
}
function pk(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function hk(e) {
	if (Array.isArray(e)) return Lu(e);
}
function Lu(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
var ra = 1e-4,
	Xv = function (t, r) {
		return [0, 3 * t, 3 * r - 6 * t, 3 * t - 3 * r + 1];
	},
	Yv = function (t, r) {
		return t
			.map(function (n, i) {
				return n * Math.pow(r, i);
			})
			.reduce(function (n, i) {
				return n + i;
			});
	},
	vp = function (t, r) {
		return function (n) {
			var i = Xv(t, r);
			return Yv(i, n);
		};
	},
	dk = function (t, r) {
		return function (n) {
			var i = Xv(t, r),
				a = [].concat(
					lk(
						i
							.map(function (o, u) {
								return o * u;
							})
							.slice(1),
					),
					[0],
				);
			return Yv(a, n);
		};
	},
	yp = function () {
		for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
			r[n] = arguments[n];
		var i = r[0],
			a = r[1],
			o = r[2],
			u = r[3];
		if (r.length === 1)
			switch (r[0]) {
				case 'linear':
					(i = 0), (a = 0), (o = 1), (u = 1);
					break;
				case 'ease':
					(i = 0.25), (a = 0.1), (o = 0.25), (u = 1);
					break;
				case 'ease-in':
					(i = 0.42), (a = 0), (o = 1), (u = 1);
					break;
				case 'ease-out':
					(i = 0.42), (a = 0), (o = 0.58), (u = 1);
					break;
				case 'ease-in-out':
					(i = 0), (a = 0), (o = 0.58), (u = 1);
					break;
				default: {
					var c = r[0].split('(');
					if (
						c[0] === 'cubic-bezier' &&
						c[1].split(')')[0].split(',').length === 4
					) {
						var s = c[1]
								.split(')')[0]
								.split(',')
								.map(function (y) {
									return parseFloat(y);
								}),
							f = ok(s, 4);
						(i = f[0]), (a = f[1]), (o = f[2]), (u = f[3]);
					}
				}
			}
		var l = vp(i, o),
			p = vp(a, u),
			h = dk(i, o),
			d = function (b) {
				return b > 1 ? 1 : b < 0 ? 0 : b;
			},
			v = function (b) {
				for (var w = b > 1 ? 1 : b, x = w, S = 0; S < 8; ++S) {
					var m = l(x) - w,
						g = h(x);
					if (Math.abs(m - w) < ra || g < ra) return p(x);
					x = d(x - m / g);
				}
				return p(x);
			};
		return (v.isStepper = !1), v;
	},
	vk = function () {
		var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
			r = t.stiff,
			n = r === void 0 ? 100 : r,
			i = t.damping,
			a = i === void 0 ? 8 : i,
			o = t.dt,
			u = o === void 0 ? 17 : o,
			c = function (f, l, p) {
				var h = -(f - l) * n,
					d = p * a,
					v = p + ((h - d) * u) / 1e3,
					y = (p * u) / 1e3 + f;
				return Math.abs(y - l) < ra && Math.abs(v) < ra ? [l, 0] : [y, v];
			};
		return (c.isStepper = !0), (c.dt = u), c;
	},
	yk = function () {
		for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
			r[n] = arguments[n];
		var i = r[0];
		if (typeof i == 'string')
			switch (i) {
				case 'ease':
				case 'ease-in-out':
				case 'ease-out':
				case 'ease-in':
				case 'linear':
					return yp(i);
				case 'spring':
					return vk();
				default:
					if (i.split('(')[0] === 'cubic-bezier') return yp(i);
			}
		return typeof i == 'function' ? i : null;
	};
function Ln(e) {
	'@babel/helpers - typeof';
	return (
		(Ln =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Ln(e)
	);
}
function mp(e) {
	return bk(e) || gk(e) || Zv(e) || mk();
}
function mk() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function gk(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function bk(e) {
	if (Array.isArray(e)) return Ru(e);
}
function gp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Pe(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? gp(Object(r), !0).forEach(function (n) {
					Bu(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: gp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function Bu(e, t, r) {
	return (
		(t = xk(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function xk(e) {
	var t = wk(e, 'string');
	return Ln(t) === 'symbol' ? t : String(t);
}
function wk(e, t) {
	if (Ln(e) !== 'object' || e === null) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Ln(n) !== 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Ok(e, t) {
	return Ak(e) || _k(e, t) || Zv(e, t) || Sk();
}
function Sk() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Zv(e, t) {
	if (e) {
		if (typeof e == 'string') return Ru(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Ru(e, t);
	}
}
function Ru(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function _k(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function Ak(e) {
	if (Array.isArray(e)) return e;
}
var na = function (t, r, n) {
		return t + (r - t) * n;
	},
	Fu = function (t) {
		var r = t.from,
			n = t.to;
		return r !== n;
	},
	Pk = function e(t, r, n) {
		var i = hn(function (a, o) {
			if (Fu(o)) {
				var u = t(o.from, o.to, o.velocity),
					c = Ok(u, 2),
					s = c[0],
					f = c[1];
				return Pe(Pe({}, o), {}, { from: s, velocity: f });
			}
			return o;
		}, r);
		return n < 1
			? hn(function (a, o) {
					return Fu(o)
						? Pe(
								Pe({}, o),
								{},
								{
									velocity: na(o.velocity, i[a].velocity, n),
									from: na(o.from, i[a].from, n),
								},
						  )
						: o;
			  }, r)
			: e(t, i, n - 1);
	};
const $k = function (e, t, r, n, i) {
	var a = nk(e, t),
		o = a.reduce(function (y, b) {
			return Pe(Pe({}, y), {}, Bu({}, b, [e[b], t[b]]));
		}, {}),
		u = a.reduce(function (y, b) {
			return Pe(
				Pe({}, y),
				{},
				Bu({}, b, { from: e[b], velocity: 0, to: t[b] }),
			);
		}, {}),
		c = -1,
		s,
		f,
		l = function () {
			return null;
		},
		p = function () {
			return hn(function (b, w) {
				return w.from;
			}, u);
		},
		h = function () {
			return !Object.values(u).filter(Fu).length;
		},
		d = function (b) {
			s || (s = b);
			var w = b - s,
				x = w / r.dt;
			(u = Pk(r, u, x)),
				i(Pe(Pe(Pe({}, e), t), p())),
				(s = b),
				h() || (c = requestAnimationFrame(l));
		},
		v = function (b) {
			f || (f = b);
			var w = (b - f) / n,
				x = hn(function (m, g) {
					return na.apply(void 0, mp(g).concat([r(w)]));
				}, o);
			if ((i(Pe(Pe(Pe({}, e), t), x)), w < 1)) c = requestAnimationFrame(l);
			else {
				var S = hn(function (m, g) {
					return na.apply(void 0, mp(g).concat([r(1)]));
				}, o);
				i(Pe(Pe(Pe({}, e), t), S));
			}
		};
	return (
		(l = r.isStepper ? d : v),
		function () {
			return (
				requestAnimationFrame(l),
				function () {
					cancelAnimationFrame(c);
				}
			);
		}
	);
};
function Ar(e) {
	'@babel/helpers - typeof';
	return (
		(Ar =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Ar(e)
	);
}
var Tk = [
	'children',
	'begin',
	'duration',
	'attributeName',
	'easing',
	'isActive',
	'steps',
	'from',
	'to',
	'canBegin',
	'onAnimationEnd',
	'shouldReAnimate',
	'onAnimationReStart',
];
function Ek(e, t) {
	if (e == null) return {};
	var r = jk(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function jk(e, t) {
	if (e == null) return {};
	var r = {},
		n = Object.keys(e),
		i,
		a;
	for (a = 0; a < n.length; a++)
		(i = n[a]), !(t.indexOf(i) >= 0) && (r[i] = e[i]);
	return r;
}
function No(e) {
	return Nk(e) || Ik(e) || Ck(e) || Mk();
}
function Mk() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ck(e, t) {
	if (e) {
		if (typeof e == 'string') return zu(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return zu(e, t);
	}
}
function Ik(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function Nk(e) {
	if (Array.isArray(e)) return zu(e);
}
function zu(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function bp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Je(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? bp(Object(r), !0).forEach(function (n) {
					sn(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: bp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function sn(e, t, r) {
	return (
		(t = Jv(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function kk(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function Dk(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Jv(n.key), n);
	}
}
function Lk(e, t, r) {
	return (
		t && Dk(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function Jv(e) {
	var t = Bk(e, 'string');
	return Ar(t) === 'symbol' ? t : String(t);
}
function Bk(e, t) {
	if (Ar(e) !== 'object' || e === null) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Ar(n) !== 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Rk(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Uu(e, t);
}
function Uu(e, t) {
	return (
		(Uu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Uu(e, t)
	);
}
function Fk(e) {
	var t = zk();
	return function () {
		var n = ia(e),
			i;
		if (t) {
			var a = ia(this).constructor;
			i = Reflect.construct(n, arguments, a);
		} else i = n.apply(this, arguments);
		return Wu(this, i);
	};
}
function Wu(e, t) {
	if (t && (Ar(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return qu(e);
}
function qu(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function zk() {
	if (typeof Reflect > 'u' || !Reflect.construct || Reflect.construct.sham)
		return !1;
	if (typeof Proxy == 'function') return !0;
	try {
		return (
			Boolean.prototype.valueOf.call(
				Reflect.construct(Boolean, [], function () {}),
			),
			!0
		);
	} catch {
		return !1;
	}
}
function ia(e) {
	return (
		(ia = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ia(e)
	);
}
var xt = (function (e) {
	Rk(r, e);
	var t = Fk(r);
	function r(n, i) {
		var a;
		kk(this, r), (a = t.call(this, n, i));
		var o = a.props,
			u = o.isActive,
			c = o.attributeName,
			s = o.from,
			f = o.to,
			l = o.steps,
			p = o.children,
			h = o.duration;
		if (
			((a.handleStyleChange = a.handleStyleChange.bind(qu(a))),
			(a.changeStyle = a.changeStyle.bind(qu(a))),
			!u || h <= 0)
		)
			return (
				(a.state = { style: {} }),
				typeof p == 'function' && (a.state = { style: f }),
				Wu(a)
			);
		if (l && l.length) a.state = { style: l[0].style };
		else if (s) {
			if (typeof p == 'function') return (a.state = { style: s }), Wu(a);
			a.state = { style: c ? sn({}, c, s) : s };
		} else a.state = { style: {} };
		return a;
	}
	return (
		Lk(r, [
			{
				key: 'componentDidMount',
				value: function () {
					var i = this.props,
						a = i.isActive,
						o = i.canBegin;
					(this.mounted = !0), !(!a || !o) && this.runAnimation(this.props);
				},
			},
			{
				key: 'componentDidUpdate',
				value: function (i) {
					var a = this.props,
						o = a.isActive,
						u = a.canBegin,
						c = a.attributeName,
						s = a.shouldReAnimate,
						f = a.to,
						l = a.from,
						p = this.state.style;
					if (u) {
						if (!o) {
							var h = { style: c ? sn({}, c, f) : f };
							this.state &&
								p &&
								((c && p[c] !== f) || (!c && p !== f)) &&
								this.setState(h);
							return;
						}
						if (!(KN(i.to, f) && i.canBegin && i.isActive)) {
							var d = !i.canBegin || !i.isActive;
							this.manager && this.manager.stop(),
								this.stopJSAnimation && this.stopJSAnimation();
							var v = d || s ? l : i.to;
							if (this.state && p) {
								var y = { style: c ? sn({}, c, v) : v };
								((c && p[c] !== v) || (!c && p !== v)) && this.setState(y);
							}
							this.runAnimation(
								Je(Je({}, this.props), {}, { from: v, begin: 0 }),
							);
						}
					}
				},
			},
			{
				key: 'componentWillUnmount',
				value: function () {
					this.mounted = !1;
					var i = this.props.onAnimationEnd;
					this.unSubscribe && this.unSubscribe(),
						this.manager && (this.manager.stop(), (this.manager = null)),
						this.stopJSAnimation && this.stopJSAnimation(),
						i && i();
				},
			},
			{
				key: 'handleStyleChange',
				value: function (i) {
					this.changeStyle(i);
				},
			},
			{
				key: 'changeStyle',
				value: function (i) {
					this.mounted && this.setState({ style: i });
				},
			},
			{
				key: 'runJSAnimation',
				value: function (i) {
					var a = this,
						o = i.from,
						u = i.to,
						c = i.duration,
						s = i.easing,
						f = i.begin,
						l = i.onAnimationEnd,
						p = i.onAnimationStart,
						h = $k(o, u, yk(s), c, this.changeStyle),
						d = function () {
							a.stopJSAnimation = h();
						};
					this.manager.start([p, f, d, c, l]);
				},
			},
			{
				key: 'runStepAnimation',
				value: function (i) {
					var a = this,
						o = i.steps,
						u = i.begin,
						c = i.onAnimationStart,
						s = o[0],
						f = s.style,
						l = s.duration,
						p = l === void 0 ? 0 : l,
						h = function (v, y, b) {
							if (b === 0) return v;
							var w = y.duration,
								x = y.easing,
								S = x === void 0 ? 'ease' : x,
								m = y.style,
								g = y.properties,
								O = y.onAnimationEnd,
								_ = b > 0 ? o[b - 1] : y,
								A = g || Object.keys(m);
							if (typeof S == 'function' || S === 'spring')
								return [].concat(No(v), [
									a.runJSAnimation.bind(a, {
										from: _.style,
										to: m,
										duration: w,
										easing: S,
									}),
									w,
								]);
							var E = dp(A, w, S),
								P = Je(Je(Je({}, _.style), m), {}, { transition: E });
							return [].concat(No(v), [P, w, O]).filter(ik);
						};
					return this.manager.start(
						[c].concat(No(o.reduce(h, [f, Math.max(p, u)])), [
							i.onAnimationEnd,
						]),
					);
				},
			},
			{
				key: 'runAnimation',
				value: function (i) {
					this.manager || (this.manager = ek());
					var a = i.begin,
						o = i.duration,
						u = i.attributeName,
						c = i.to,
						s = i.easing,
						f = i.onAnimationStart,
						l = i.onAnimationEnd,
						p = i.steps,
						h = i.children,
						d = this.manager;
					if (
						((this.unSubscribe = d.subscribe(this.handleStyleChange)),
						typeof s == 'function' || typeof h == 'function' || s === 'spring')
					) {
						this.runJSAnimation(i);
						return;
					}
					if (p.length > 1) {
						this.runStepAnimation(i);
						return;
					}
					var v = u ? sn({}, u, c) : c,
						y = dp(Object.keys(v), o, s);
					d.start([f, a, Je(Je({}, v), {}, { transition: y }), o, l]);
				},
			},
			{
				key: 'render',
				value: function () {
					var i = this.props,
						a = i.children;
					i.begin;
					var o = i.duration;
					i.attributeName, i.easing;
					var u = i.isActive;
					i.steps,
						i.from,
						i.to,
						i.canBegin,
						i.onAnimationEnd,
						i.shouldReAnimate,
						i.onAnimationReStart;
					var c = Ek(i, Tk),
						s = L.Children.count(a),
						f = this.state.style;
					if (typeof a == 'function') return a(f);
					if (!u || s === 0 || o <= 0) return a;
					var l = function (h) {
						var d = h.props,
							v = d.style,
							y = v === void 0 ? {} : v,
							b = d.className,
							w = L.cloneElement(
								h,
								Je(Je({}, c), {}, { style: Je(Je({}, y), f), className: b }),
							);
						return w;
					};
					return s === 1
						? l(L.Children.only(a))
						: $.createElement(
								'div',
								null,
								L.Children.map(a, function (p) {
									return l(p);
								}),
						  );
				},
			},
		]),
		r
	);
})(L.PureComponent);
xt.displayName = 'Animate';
xt.defaultProps = {
	begin: 0,
	duration: 1e3,
	from: '',
	to: '',
	attributeName: '',
	easing: 'ease',
	isActive: !0,
	canBegin: !0,
	steps: [],
	onAnimationEnd: function () {},
	onAnimationStart: function () {},
};
xt.propTypes = {
	from: z.oneOfType([z.object, z.string]),
	to: z.oneOfType([z.object, z.string]),
	attributeName: z.string,
	duration: z.number,
	begin: z.number,
	easing: z.oneOfType([z.string, z.func]),
	steps: z.arrayOf(
		z.shape({
			duration: z.number.isRequired,
			style: z.object.isRequired,
			easing: z.oneOfType([
				z.oneOf(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear']),
				z.func,
			]),
			properties: z.arrayOf('string'),
			onAnimationEnd: z.func,
		}),
	),
	children: z.oneOfType([z.node, z.func]),
	isActive: z.bool,
	canBegin: z.bool,
	onAnimationEnd: z.func,
	shouldReAnimate: z.bool,
	onAnimationStart: z.func,
	onAnimationReStart: z.func,
};
z.object, z.object, z.object, z.element;
z.object, z.object, z.object, z.oneOfType([z.array, z.element]), z.any;
function Bn(e) {
	'@babel/helpers - typeof';
	return (
		(Bn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Bn(e)
	);
}
function aa() {
	return (
		(aa = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		aa.apply(this, arguments)
	);
}
function Uk(e, t) {
	return Hk(e) || Gk(e, t) || qk(e, t) || Wk();
}
function Wk() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function qk(e, t) {
	if (e) {
		if (typeof e == 'string') return xp(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return xp(e, t);
	}
}
function xp(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function Gk(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function Hk(e) {
	if (Array.isArray(e)) return e;
}
function wp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Op(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? wp(Object(r), !0).forEach(function (n) {
					Kk(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: wp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function Kk(e, t, r) {
	return (
		(t = Vk(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Vk(e) {
	var t = Xk(e, 'string');
	return Bn(t) == 'symbol' ? t : t + '';
}
function Xk(e, t) {
	if (Bn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Bn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Sp = function (t, r, n, i, a) {
		var o = Math.min(Math.abs(n) / 2, Math.abs(i) / 2),
			u = i >= 0 ? 1 : -1,
			c = n >= 0 ? 1 : -1,
			s = (i >= 0 && n >= 0) || (i < 0 && n < 0) ? 1 : 0,
			f;
		if (o > 0 && a instanceof Array) {
			for (var l = [0, 0, 0, 0], p = 0, h = 4; p < h; p++)
				l[p] = a[p] > o ? o : a[p];
			(f = 'M'.concat(t, ',').concat(r + u * l[0])),
				l[0] > 0 &&
					(f += 'A '
						.concat(l[0], ',')
						.concat(l[0], ',0,0,')
						.concat(s, ',')
						.concat(t + c * l[0], ',')
						.concat(r)),
				(f += 'L '.concat(t + n - c * l[1], ',').concat(r)),
				l[1] > 0 &&
					(f += 'A '
						.concat(l[1], ',')
						.concat(l[1], ',0,0,')
						.concat(
							s,
							`,
        `,
						)
						.concat(t + n, ',')
						.concat(r + u * l[1])),
				(f += 'L '.concat(t + n, ',').concat(r + i - u * l[2])),
				l[2] > 0 &&
					(f += 'A '
						.concat(l[2], ',')
						.concat(l[2], ',0,0,')
						.concat(
							s,
							`,
        `,
						)
						.concat(t + n - c * l[2], ',')
						.concat(r + i)),
				(f += 'L '.concat(t + c * l[3], ',').concat(r + i)),
				l[3] > 0 &&
					(f += 'A '
						.concat(l[3], ',')
						.concat(l[3], ',0,0,')
						.concat(
							s,
							`,
        `,
						)
						.concat(t, ',')
						.concat(r + i - u * l[3])),
				(f += 'Z');
		} else if (o > 0 && a === +a && a > 0) {
			var d = Math.min(o, a);
			f = 'M '
				.concat(t, ',')
				.concat(
					r + u * d,
					`
            A `,
				)
				.concat(d, ',')
				.concat(d, ',0,0,')
				.concat(s, ',')
				.concat(t + c * d, ',')
				.concat(
					r,
					`
            L `,
				)
				.concat(t + n - c * d, ',')
				.concat(
					r,
					`
            A `,
				)
				.concat(d, ',')
				.concat(d, ',0,0,')
				.concat(s, ',')
				.concat(t + n, ',')
				.concat(
					r + u * d,
					`
            L `,
				)
				.concat(t + n, ',')
				.concat(
					r + i - u * d,
					`
            A `,
				)
				.concat(d, ',')
				.concat(d, ',0,0,')
				.concat(s, ',')
				.concat(t + n - c * d, ',')
				.concat(
					r + i,
					`
            L `,
				)
				.concat(t + c * d, ',')
				.concat(
					r + i,
					`
            A `,
				)
				.concat(d, ',')
				.concat(d, ',0,0,')
				.concat(s, ',')
				.concat(t, ',')
				.concat(r + i - u * d, ' Z');
		} else
			f = 'M '
				.concat(t, ',')
				.concat(r, ' h ')
				.concat(n, ' v ')
				.concat(i, ' h ')
				.concat(-n, ' Z');
		return f;
	},
	Yk = function (t, r) {
		if (!t || !r) return !1;
		var n = t.x,
			i = t.y,
			a = r.x,
			o = r.y,
			u = r.width,
			c = r.height;
		if (Math.abs(u) > 0 && Math.abs(c) > 0) {
			var s = Math.min(a, a + u),
				f = Math.max(a, a + u),
				l = Math.min(o, o + c),
				p = Math.max(o, o + c);
			return n >= s && n <= f && i >= l && i <= p;
		}
		return !1;
	},
	Zk = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		radius: 0,
		isAnimationActive: !1,
		isUpdateAnimationActive: !1,
		animationBegin: 0,
		animationDuration: 1500,
		animationEasing: 'ease',
	},
	ls = function (t) {
		var r = Op(Op({}, Zk), t),
			n = L.useRef(),
			i = L.useState(-1),
			a = Uk(i, 2),
			o = a[0],
			u = a[1];
		L.useEffect(function () {
			if (n.current && n.current.getTotalLength)
				try {
					var S = n.current.getTotalLength();
					S && u(S);
				} catch { /* Ignore errors */ }
		}, []);
		var c = r.x,
			s = r.y,
			f = r.width,
			l = r.height,
			p = r.radius,
			h = r.className,
			d = r.animationEasing,
			v = r.animationDuration,
			y = r.animationBegin,
			b = r.isAnimationActive,
			w = r.isUpdateAnimationActive;
		if (c !== +c || s !== +s || f !== +f || l !== +l || f === 0 || l === 0)
			return null;
		var x = ne('recharts-rectangle', h);
		return w
			? $.createElement(
					xt,
					{
						canBegin: o > 0,
						from: { width: f, height: l, x: c, y: s },
						to: { width: f, height: l, x: c, y: s },
						duration: v,
						animationEasing: d,
						isActive: w,
					},
					function (S) {
						var m = S.width,
							g = S.height,
							O = S.x,
							_ = S.y;
						return $.createElement(
							xt,
							{
								canBegin: o > 0,
								from: '0px '.concat(o === -1 ? 1 : o, 'px'),
								to: ''.concat(o, 'px 0px'),
								attributeName: 'strokeDasharray',
								begin: y,
								duration: v,
								isActive: b,
								easing: d,
							},
							$.createElement(
								'path',
								aa({}, ee(r, !0), {
									className: x,
									d: Sp(O, _, m, g, p),
									ref: n,
								}),
							),
						);
					},
			  )
			: $.createElement(
					'path',
					aa({}, ee(r, !0), { className: x, d: Sp(c, s, f, l, p) }),
			  );
	};
function Gu() {
	return (
		(Gu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Gu.apply(this, arguments)
	);
}
var fs = function (t) {
	var r = t.cx,
		n = t.cy,
		i = t.r,
		a = t.className,
		o = ne('recharts-dot', a);
	return r === +r && n === +n && i === +i
		? $.createElement(
				'circle',
				Gu({}, ee(t, !1), _i(t), { className: o, cx: r, cy: n, r: i }),
		  )
		: null;
};
function Rn(e) {
	'@babel/helpers - typeof';
	return (
		(Rn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Rn(e)
	);
}
var Jk = ['x', 'y', 'top', 'left', 'width', 'height', 'className'];
function Hu() {
	return (
		(Hu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Hu.apply(this, arguments)
	);
}
function _p(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Qk(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? _p(Object(r), !0).forEach(function (n) {
					eD(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: _p(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function eD(e, t, r) {
	return (
		(t = tD(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function tD(e) {
	var t = rD(e, 'string');
	return Rn(t) == 'symbol' ? t : t + '';
}
function rD(e, t) {
	if (Rn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Rn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function nD(e, t) {
	if (e == null) return {};
	var r = iD(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function iD(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
var aD = function (t, r, n, i, a, o) {
		return 'M'
			.concat(t, ',')
			.concat(a, 'v')
			.concat(i, 'M')
			.concat(o, ',')
			.concat(r, 'h')
			.concat(n);
	},
	oD = function (t) {
		var r = t.x,
			n = r === void 0 ? 0 : r,
			i = t.y,
			a = i === void 0 ? 0 : i,
			o = t.top,
			u = o === void 0 ? 0 : o,
			c = t.left,
			s = c === void 0 ? 0 : c,
			f = t.width,
			l = f === void 0 ? 0 : f,
			p = t.height,
			h = p === void 0 ? 0 : p,
			d = t.className,
			v = nD(t, Jk),
			y = Qk({ x: n, y: a, top: u, left: s, width: l, height: h }, v);
		return !R(n) || !R(a) || !R(l) || !R(h) || !R(u) || !R(s)
			? null
			: $.createElement(
					'path',
					Hu({}, ee(y, !0), {
						className: ne('recharts-cross', d),
						d: aD(n, a, l, h, u, s),
					}),
			  );
	},
	uD = vd,
	cD = uD(Object.getPrototypeOf, Object),
	sD = cD,
	lD = wt,
	fD = sD,
	pD = Ot,
	hD = '[object Object]',
	dD = Function.prototype,
	vD = Object.prototype,
	Qv = dD.toString,
	yD = vD.hasOwnProperty,
	mD = Qv.call(Object);
function gD(e) {
	if (!pD(e) || lD(e) != hD) return !1;
	var t = fD(e);
	if (t === null) return !0;
	var r = yD.call(t, 'constructor') && t.constructor;
	return typeof r == 'function' && r instanceof r && Qv.call(r) == mD;
}
var bD = gD;
const xD = fe(bD);
var wD = wt,
	OD = Ot,
	SD = '[object Boolean]';
function _D(e) {
	return e === !0 || e === !1 || (OD(e) && wD(e) == SD);
}
var AD = _D;
const PD = fe(AD);
function Fn(e) {
	'@babel/helpers - typeof';
	return (
		(Fn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Fn(e)
	);
}
function oa() {
	return (
		(oa = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		oa.apply(this, arguments)
	);
}
function $D(e, t) {
	return MD(e) || jD(e, t) || ED(e, t) || TD();
}
function TD() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ED(e, t) {
	if (e) {
		if (typeof e == 'string') return Ap(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Ap(e, t);
	}
}
function Ap(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function jD(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function MD(e) {
	if (Array.isArray(e)) return e;
}
function Pp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function $p(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Pp(Object(r), !0).forEach(function (n) {
					CD(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Pp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function CD(e, t, r) {
	return (
		(t = ID(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function ID(e) {
	var t = ND(e, 'string');
	return Fn(t) == 'symbol' ? t : t + '';
}
function ND(e, t) {
	if (Fn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Fn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Tp = function (t, r, n, i, a) {
		var o = n - i,
			u;
		return (
			(u = 'M '.concat(t, ',').concat(r)),
			(u += 'L '.concat(t + n, ',').concat(r)),
			(u += 'L '.concat(t + n - o / 2, ',').concat(r + a)),
			(u += 'L '.concat(t + n - o / 2 - i, ',').concat(r + a)),
			(u += 'L '.concat(t, ',').concat(r, ' Z')),
			u
		);
	},
	kD = {
		x: 0,
		y: 0,
		upperWidth: 0,
		lowerWidth: 0,
		height: 0,
		isUpdateAnimationActive: !1,
		animationBegin: 0,
		animationDuration: 1500,
		animationEasing: 'ease',
	},
	DD = function (t) {
		var r = $p($p({}, kD), t),
			n = L.useRef(),
			i = L.useState(-1),
			a = $D(i, 2),
			o = a[0],
			u = a[1];
		L.useEffect(function () {
			if (n.current && n.current.getTotalLength)
				try {
					var x = n.current.getTotalLength();
					x && u(x);
				} catch { /* Ignore errors */ }
		}, []);
		var c = r.x,
			s = r.y,
			f = r.upperWidth,
			l = r.lowerWidth,
			p = r.height,
			h = r.className,
			d = r.animationEasing,
			v = r.animationDuration,
			y = r.animationBegin,
			b = r.isUpdateAnimationActive;
		if (
			c !== +c ||
			s !== +s ||
			f !== +f ||
			l !== +l ||
			p !== +p ||
			(f === 0 && l === 0) ||
			p === 0
		)
			return null;
		var w = ne('recharts-trapezoid', h);
		return b
			? $.createElement(
					xt,
					{
						canBegin: o > 0,
						from: { upperWidth: 0, lowerWidth: 0, height: p, x: c, y: s },
						to: { upperWidth: f, lowerWidth: l, height: p, x: c, y: s },
						duration: v,
						animationEasing: d,
						isActive: b,
					},
					function (x) {
						var S = x.upperWidth,
							m = x.lowerWidth,
							g = x.height,
							O = x.x,
							_ = x.y;
						return $.createElement(
							xt,
							{
								canBegin: o > 0,
								from: '0px '.concat(o === -1 ? 1 : o, 'px'),
								to: ''.concat(o, 'px 0px'),
								attributeName: 'strokeDasharray',
								begin: y,
								duration: v,
								easing: d,
							},
							$.createElement(
								'path',
								oa({}, ee(r, !0), {
									className: w,
									d: Tp(O, _, S, m, g),
									ref: n,
								}),
							),
						);
					},
			  )
			: $.createElement(
					'g',
					null,
					$.createElement(
						'path',
						oa({}, ee(r, !0), { className: w, d: Tp(c, s, f, l, p) }),
					),
			  );
	},
	LD = [
		'option',
		'shapeType',
		'propTransformer',
		'activeClassName',
		'isActive',
	];
function zn(e) {
	'@babel/helpers - typeof';
	return (
		(zn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		zn(e)
	);
}
function BD(e, t) {
	if (e == null) return {};
	var r = RD(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function RD(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function Ep(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function ua(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Ep(Object(r), !0).forEach(function (n) {
					FD(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Ep(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function FD(e, t, r) {
	return (
		(t = zD(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function zD(e) {
	var t = UD(e, 'string');
	return zn(t) == 'symbol' ? t : t + '';
}
function UD(e, t) {
	if (zn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (zn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function WD(e, t) {
	return ua(ua({}, t), e);
}
function qD(e, t) {
	return e === 'symbols';
}
function jp(e) {
	var t = e.shapeType,
		r = e.elementProps;
	switch (t) {
		case 'rectangle':
			return $.createElement(ls, r);
		case 'trapezoid':
			return $.createElement(DD, r);
		case 'sector':
			return $.createElement(qv, r);
		case 'symbols':
			if (qD(t)) return $.createElement(Ec, r);
			break;
		default:
			return null;
	}
}
function GD(e) {
	return L.isValidElement(e) ? e.props : e;
}
function HD(e) {
	var t = e.option,
		r = e.shapeType,
		n = e.propTransformer,
		i = n === void 0 ? WD : n,
		a = e.activeClassName,
		o = a === void 0 ? 'recharts-active-shape' : a,
		u = e.isActive,
		c = BD(e, LD),
		s;
	if (L.isValidElement(t)) s = L.cloneElement(t, ua(ua({}, c), GD(t)));
	else if (J(t)) s = t(c);
	else if (xD(t) && !PD(t)) {
		var f = i(t, c);
		s = $.createElement(jp, { shapeType: r, elementProps: f });
	} else {
		var l = c;
		s = $.createElement(jp, { shapeType: r, elementProps: l });
	}
	return u ? $.createElement(ve, { className: o }, s) : s;
}
function to(e, t) {
	return t != null && 'trapezoids' in e.props;
}
function ro(e, t) {
	return t != null && 'sectors' in e.props;
}
function Un(e, t) {
	return t != null && 'points' in e.props;
}
function KD(e, t) {
	var r,
		n,
		i =
			e.x ===
				(t == null || (r = t.labelViewBox) === null || r === void 0
					? void 0
					: r.x) || e.x === t.x,
		a =
			e.y ===
				(t == null || (n = t.labelViewBox) === null || n === void 0
					? void 0
					: n.y) || e.y === t.y;
	return i && a;
}
function VD(e, t) {
	var r = e.endAngle === t.endAngle,
		n = e.startAngle === t.startAngle;
	return r && n;
}
function XD(e, t) {
	var r = e.x === t.x,
		n = e.y === t.y,
		i = e.z === t.z;
	return r && n && i;
}
function YD(e, t) {
	var r;
	return to(e, t) ? (r = KD) : ro(e, t) ? (r = VD) : Un(e, t) && (r = XD), r;
}
function ZD(e, t) {
	var r;
	return (
		to(e, t)
			? (r = 'trapezoids')
			: ro(e, t)
			? (r = 'sectors')
			: Un(e, t) && (r = 'points'),
		r
	);
}
function JD(e, t) {
	if (to(e, t)) {
		var r;
		return (r = t.tooltipPayload) === null ||
			r === void 0 ||
			(r = r[0]) === null ||
			r === void 0 ||
			(r = r.payload) === null ||
			r === void 0
			? void 0
			: r.payload;
	}
	if (ro(e, t)) {
		var n;
		return (n = t.tooltipPayload) === null ||
			n === void 0 ||
			(n = n[0]) === null ||
			n === void 0 ||
			(n = n.payload) === null ||
			n === void 0
			? void 0
			: n.payload;
	}
	return Un(e, t) ? t.payload : {};
}
function QD(e) {
	var t = e.activeTooltipItem,
		r = e.graphicalItem,
		n = e.itemData,
		i = ZD(r, t),
		a = JD(r, t),
		o = n.filter(function (c, s) {
			var f = Ja(a, c),
				l = r.props[i].filter(function (d) {
					var v = YD(r, t);
					return v(d, t);
				}),
				p = r.props[i].indexOf(l[l.length - 1]),
				h = s === p;
			return f && h;
		}),
		u = n.indexOf(o[o.length - 1]);
	return u;
}
var eL = Math.ceil,
	tL = Math.max;
function rL(e, t, r, n) {
	for (var i = -1, a = tL(eL((t - e) / (r || 1)), 0), o = Array(a); a--; )
		(o[n ? a : ++i] = e), (e += r);
	return o;
}
var nL = rL,
	iL = Nd,
	Mp = 1 / 0,
	aL = 17976931348623157e292;
function oL(e) {
	if (!e) return e === 0 ? e : 0;
	if (((e = iL(e)), e === Mp || e === -Mp)) {
		var t = e < 0 ? -1 : 1;
		return t * aL;
	}
	return e === e ? e : 0;
}
var ey = oL,
	uL = nL,
	cL = Wa,
	ko = ey;
function sL(e) {
	return function (t, r, n) {
		return (
			n && typeof n != 'number' && cL(t, r, n) && (r = n = void 0),
			(t = ko(t)),
			r === void 0 ? ((r = t), (t = 0)) : (r = ko(r)),
			(n = n === void 0 ? (t < r ? 1 : -1) : ko(n)),
			uL(t, r, n, e)
		);
	};
}
var lL = sL,
	fL = lL,
	pL = fL(),
	hL = pL;
const ca = fe(hL);
function Wn(e) {
	'@babel/helpers - typeof';
	return (
		(Wn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Wn(e)
	);
}
function Cp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Ip(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Cp(Object(r), !0).forEach(function (n) {
					ty(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Cp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function ty(e, t, r) {
	return (
		(t = dL(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function dL(e) {
	var t = vL(e, 'string');
	return Wn(t) == 'symbol' ? t : t + '';
}
function vL(e, t) {
	if (Wn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Wn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var yL = ['Webkit', 'Moz', 'O', 'ms'],
	mL = function (t, r) {
		var n = t.replace(/(\w)/, function (a) {
				return a.toUpperCase();
			}),
			i = yL.reduce(function (a, o) {
				return Ip(Ip({}, a), {}, ty({}, o + n, r));
			}, {});
		return (i[t] = r), i;
	};
function Pr(e) {
	'@babel/helpers - typeof';
	return (
		(Pr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Pr(e)
	);
}
function sa() {
	return (
		(sa = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		sa.apply(this, arguments)
	);
}
function Np(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Do(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Np(Object(r), !0).forEach(function (n) {
					Re(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Np(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function gL(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function kp(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, ny(n.key), n);
	}
}
function bL(e, t, r) {
	return (
		t && kp(e.prototype, t),
		r && kp(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function xL(e, t, r) {
	return (
		(t = la(t)),
		wL(
			e,
			ry() ? Reflect.construct(t, r || [], la(e).constructor) : t.apply(e, r),
		)
	);
}
function wL(e, t) {
	if (t && (Pr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return OL(e);
}
function OL(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function ry() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (ry = function () {
		return !!e;
	})();
}
function la(e) {
	return (
		(la = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		la(e)
	);
}
function SL(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Ku(e, t);
}
function Ku(e, t) {
	return (
		(Ku = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Ku(e, t)
	);
}
function Re(e, t, r) {
	return (
		(t = ny(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function ny(e) {
	var t = _L(e, 'string');
	return Pr(t) == 'symbol' ? t : t + '';
}
function _L(e, t) {
	if (Pr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Pr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var AL = function (t) {
		var r = t.data,
			n = t.startIndex,
			i = t.endIndex,
			a = t.x,
			o = t.width,
			u = t.travellerWidth;
		if (!r || !r.length) return {};
		var c = r.length,
			s = fn()
				.domain(ca(0, c))
				.range([a, a + o - u]),
			f = s.domain().map(function (l) {
				return s(l);
			});
		return {
			isTextActive: !1,
			isSlideMoving: !1,
			isTravellerMoving: !1,
			isTravellerFocused: !1,
			startX: s(n),
			endX: s(i),
			scale: s,
			scaleValues: f,
		};
	},
	Dp = function (t) {
		return t.changedTouches && !!t.changedTouches.length;
	},
	$r = (function (e) {
		function t(r) {
			var n;
			return (
				gL(this, t),
				(n = xL(this, t, [r])),
				Re(n, 'handleDrag', function (i) {
					n.leaveTimer && (clearTimeout(n.leaveTimer), (n.leaveTimer = null)),
						n.state.isTravellerMoving
							? n.handleTravellerMove(i)
							: n.state.isSlideMoving && n.handleSlideDrag(i);
				}),
				Re(n, 'handleTouchMove', function (i) {
					i.changedTouches != null &&
						i.changedTouches.length > 0 &&
						n.handleDrag(i.changedTouches[0]);
				}),
				Re(n, 'handleDragEnd', function () {
					n.setState({ isTravellerMoving: !1, isSlideMoving: !1 }, function () {
						var i = n.props,
							a = i.endIndex,
							o = i.onDragEnd,
							u = i.startIndex;
						o == null || o({ endIndex: a, startIndex: u });
					}),
						n.detachDragEndListener();
				}),
				Re(n, 'handleLeaveWrapper', function () {
					(n.state.isTravellerMoving || n.state.isSlideMoving) &&
						(n.leaveTimer = window.setTimeout(
							n.handleDragEnd,
							n.props.leaveTimeOut,
						));
				}),
				Re(n, 'handleEnterSlideOrTraveller', function () {
					n.setState({ isTextActive: !0 });
				}),
				Re(n, 'handleLeaveSlideOrTraveller', function () {
					n.setState({ isTextActive: !1 });
				}),
				Re(n, 'handleSlideDragStart', function (i) {
					var a = Dp(i) ? i.changedTouches[0] : i;
					n.setState({
						isTravellerMoving: !1,
						isSlideMoving: !0,
						slideMoveStartX: a.pageX,
					}),
						n.attachDragEndListener();
				}),
				(n.travellerDragStartHandlers = {
					startX: n.handleTravellerDragStart.bind(n, 'startX'),
					endX: n.handleTravellerDragStart.bind(n, 'endX'),
				}),
				(n.state = {}),
				n
			);
		}
		return (
			SL(t, e),
			bL(
				t,
				[
					{
						key: 'componentWillUnmount',
						value: function () {
							this.leaveTimer &&
								(clearTimeout(this.leaveTimer), (this.leaveTimer = null)),
								this.detachDragEndListener();
						},
					},
					{
						key: 'getIndex',
						value: function (n) {
							var i = n.startX,
								a = n.endX,
								o = this.state.scaleValues,
								u = this.props,
								c = u.gap,
								s = u.data,
								f = s.length - 1,
								l = Math.min(i, a),
								p = Math.max(i, a),
								h = t.getIndexInRange(o, l),
								d = t.getIndexInRange(o, p);
							return {
								startIndex: h - (h % c),
								endIndex: d === f ? f : d - (d % c),
							};
						},
					},
					{
						key: 'getTextOfTick',
						value: function (n) {
							var i = this.props,
								a = i.data,
								o = i.tickFormatter,
								u = i.dataKey,
								c = Ue(a[n], u, n);
							return J(o) ? o(c, n) : c;
						},
					},
					{
						key: 'attachDragEndListener',
						value: function () {
							window.addEventListener('mouseup', this.handleDragEnd, !0),
								window.addEventListener('touchend', this.handleDragEnd, !0),
								window.addEventListener('mousemove', this.handleDrag, !0);
						},
					},
					{
						key: 'detachDragEndListener',
						value: function () {
							window.removeEventListener('mouseup', this.handleDragEnd, !0),
								window.removeEventListener('touchend', this.handleDragEnd, !0),
								window.removeEventListener('mousemove', this.handleDrag, !0);
						},
					},
					{
						key: 'handleSlideDrag',
						value: function (n) {
							var i = this.state,
								a = i.slideMoveStartX,
								o = i.startX,
								u = i.endX,
								c = this.props,
								s = c.x,
								f = c.width,
								l = c.travellerWidth,
								p = c.startIndex,
								h = c.endIndex,
								d = c.onChange,
								v = n.pageX - a;
							v > 0
								? (v = Math.min(v, s + f - l - u, s + f - l - o))
								: v < 0 && (v = Math.max(v, s - o, s - u));
							var y = this.getIndex({ startX: o + v, endX: u + v });
							(y.startIndex !== p || y.endIndex !== h) && d && d(y),
								this.setState({
									startX: o + v,
									endX: u + v,
									slideMoveStartX: n.pageX,
								});
						},
					},
					{
						key: 'handleTravellerDragStart',
						value: function (n, i) {
							var a = Dp(i) ? i.changedTouches[0] : i;
							this.setState({
								isSlideMoving: !1,
								isTravellerMoving: !0,
								movingTravellerId: n,
								brushMoveStartX: a.pageX,
							}),
								this.attachDragEndListener();
						},
					},
					{
						key: 'handleTravellerMove',
						value: function (n) {
							var i = this.state,
								a = i.brushMoveStartX,
								o = i.movingTravellerId,
								u = i.endX,
								c = i.startX,
								s = this.state[o],
								f = this.props,
								l = f.x,
								p = f.width,
								h = f.travellerWidth,
								d = f.onChange,
								v = f.gap,
								y = f.data,
								b = { startX: this.state.startX, endX: this.state.endX },
								w = n.pageX - a;
							w > 0
								? (w = Math.min(w, l + p - h - s))
								: w < 0 && (w = Math.max(w, l - s)),
								(b[o] = s + w);
							var x = this.getIndex(b),
								S = x.startIndex,
								m = x.endIndex,
								g = function () {
									var _ = y.length - 1;
									return (
										(o === 'startX' && (u > c ? S % v === 0 : m % v === 0)) ||
										(u < c && m === _) ||
										(o === 'endX' && (u > c ? m % v === 0 : S % v === 0)) ||
										(u > c && m === _)
									);
								};
							this.setState(
								Re(Re({}, o, s + w), 'brushMoveStartX', n.pageX),
								function () {
									d && g() && d(x);
								},
							);
						},
					},
					{
						key: 'handleTravellerMoveKeyboard',
						value: function (n, i) {
							var a = this,
								o = this.state,
								u = o.scaleValues,
								c = o.startX,
								s = o.endX,
								f = this.state[i],
								l = u.indexOf(f);
							if (l !== -1) {
								var p = l + n;
								if (!(p === -1 || p >= u.length)) {
									var h = u[p];
									(i === 'startX' && h >= s) ||
										(i === 'endX' && h <= c) ||
										this.setState(Re({}, i, h), function () {
											a.props.onChange(
												a.getIndex({
													startX: a.state.startX,
													endX: a.state.endX,
												}),
											);
										});
								}
							}
						},
					},
					{
						key: 'renderBackground',
						value: function () {
							var n = this.props,
								i = n.x,
								a = n.y,
								o = n.width,
								u = n.height,
								c = n.fill,
								s = n.stroke;
							return $.createElement('rect', {
								stroke: s,
								fill: c,
								x: i,
								y: a,
								width: o,
								height: u,
							});
						},
					},
					{
						key: 'renderPanorama',
						value: function () {
							var n = this.props,
								i = n.x,
								a = n.y,
								o = n.width,
								u = n.height,
								c = n.data,
								s = n.children,
								f = n.padding,
								l = L.Children.only(s);
							return l
								? $.cloneElement(l, {
										x: i,
										y: a,
										width: o,
										height: u,
										margin: f,
										compact: !0,
										data: c,
								  })
								: null;
						},
					},
					{
						key: 'renderTravellerLayer',
						value: function (n, i) {
							var a,
								o,
								u = this,
								c = this.props,
								s = c.y,
								f = c.travellerWidth,
								l = c.height,
								p = c.traveller,
								h = c.ariaLabel,
								d = c.data,
								v = c.startIndex,
								y = c.endIndex,
								b = Math.max(n, this.props.x),
								w = Do(
									Do({}, ee(this.props, !1)),
									{},
									{ x: b, y: s, width: f, height: l },
								),
								x =
									h ||
									'Min value: '
										.concat(
											(a = d[v]) === null || a === void 0 ? void 0 : a.name,
											', Max value: ',
										)
										.concat(
											(o = d[y]) === null || o === void 0 ? void 0 : o.name,
										);
							return $.createElement(
								ve,
								{
									tabIndex: 0,
									role: 'slider',
									'aria-label': x,
									'aria-valuenow': n,
									className: 'recharts-brush-traveller',
									onMouseEnter: this.handleEnterSlideOrTraveller,
									onMouseLeave: this.handleLeaveSlideOrTraveller,
									onMouseDown: this.travellerDragStartHandlers[i],
									onTouchStart: this.travellerDragStartHandlers[i],
									onKeyDown: function (m) {
										['ArrowLeft', 'ArrowRight'].includes(m.key) &&
											(m.preventDefault(),
											m.stopPropagation(),
											u.handleTravellerMoveKeyboard(
												m.key === 'ArrowRight' ? 1 : -1,
												i,
											));
									},
									onFocus: function () {
										u.setState({ isTravellerFocused: !0 });
									},
									onBlur: function () {
										u.setState({ isTravellerFocused: !1 });
									},
									style: { cursor: 'col-resize' },
								},
								t.renderTraveller(p, w),
							);
						},
					},
					{
						key: 'renderSlide',
						value: function (n, i) {
							var a = this.props,
								o = a.y,
								u = a.height,
								c = a.stroke,
								s = a.travellerWidth,
								f = Math.min(n, i) + s,
								l = Math.max(Math.abs(i - n) - s, 0);
							return $.createElement('rect', {
								className: 'recharts-brush-slide',
								onMouseEnter: this.handleEnterSlideOrTraveller,
								onMouseLeave: this.handleLeaveSlideOrTraveller,
								onMouseDown: this.handleSlideDragStart,
								onTouchStart: this.handleSlideDragStart,
								style: { cursor: 'move' },
								stroke: 'none',
								fill: c,
								fillOpacity: 0.2,
								x: f,
								y: o,
								width: l,
								height: u,
							});
						},
					},
					{
						key: 'renderText',
						value: function () {
							var n = this.props,
								i = n.startIndex,
								a = n.endIndex,
								o = n.y,
								u = n.height,
								c = n.travellerWidth,
								s = n.stroke,
								f = this.state,
								l = f.startX,
								p = f.endX,
								h = 5,
								d = { pointerEvents: 'none', fill: s };
							return $.createElement(
								ve,
								{ className: 'recharts-brush-texts' },
								$.createElement(
									Ri,
									sa(
										{
											textAnchor: 'end',
											verticalAnchor: 'middle',
											x: Math.min(l, p) - h,
											y: o + u / 2,
										},
										d,
									),
									this.getTextOfTick(i),
								),
								$.createElement(
									Ri,
									sa(
										{
											textAnchor: 'start',
											verticalAnchor: 'middle',
											x: Math.max(l, p) + c + h,
											y: o + u / 2,
										},
										d,
									),
									this.getTextOfTick(a),
								),
							);
						},
					},
					{
						key: 'render',
						value: function () {
							var n = this.props,
								i = n.data,
								a = n.className,
								o = n.children,
								u = n.x,
								c = n.y,
								s = n.width,
								f = n.height,
								l = n.alwaysShowText,
								p = this.state,
								h = p.startX,
								d = p.endX,
								v = p.isTextActive,
								y = p.isSlideMoving,
								b = p.isTravellerMoving,
								w = p.isTravellerFocused;
							if (
								!i ||
								!i.length ||
								!R(u) ||
								!R(c) ||
								!R(s) ||
								!R(f) ||
								s <= 0 ||
								f <= 0
							)
								return null;
							var x = ne('recharts-brush', a),
								S = $.Children.count(o) === 1,
								m = mL('userSelect', 'none');
							return $.createElement(
								ve,
								{
									className: x,
									onMouseLeave: this.handleLeaveWrapper,
									onTouchMove: this.handleTouchMove,
									style: m,
								},
								this.renderBackground(),
								S && this.renderPanorama(),
								this.renderSlide(h, d),
								this.renderTravellerLayer(h, 'startX'),
								this.renderTravellerLayer(d, 'endX'),
								(v || y || b || w || l) && this.renderText(),
							);
						},
					},
				],
				[
					{
						key: 'renderDefaultTraveller',
						value: function (n) {
							var i = n.x,
								a = n.y,
								o = n.width,
								u = n.height,
								c = n.stroke,
								s = Math.floor(a + u / 2) - 1;
							return $.createElement(
								$.Fragment,
								null,
								$.createElement('rect', {
									x: i,
									y: a,
									width: o,
									height: u,
									fill: c,
									stroke: 'none',
								}),
								$.createElement('line', {
									x1: i + 1,
									y1: s,
									x2: i + o - 1,
									y2: s,
									fill: 'none',
									stroke: '#fff',
								}),
								$.createElement('line', {
									x1: i + 1,
									y1: s + 2,
									x2: i + o - 1,
									y2: s + 2,
									fill: 'none',
									stroke: '#fff',
								}),
							);
						},
					},
					{
						key: 'renderTraveller',
						value: function (n, i) {
							var a;
							return (
								$.isValidElement(n)
									? (a = $.cloneElement(n, i))
									: J(n)
									? (a = n(i))
									: (a = t.renderDefaultTraveller(i)),
								a
							);
						},
					},
					{
						key: 'getDerivedStateFromProps',
						value: function (n, i) {
							var a = n.data,
								o = n.width,
								u = n.x,
								c = n.travellerWidth,
								s = n.updateId,
								f = n.startIndex,
								l = n.endIndex;
							if (a !== i.prevData || s !== i.prevUpdateId)
								return Do(
									{
										prevData: a,
										prevTravellerWidth: c,
										prevUpdateId: s,
										prevX: u,
										prevWidth: o,
									},
									a && a.length
										? AL({
												data: a,
												width: o,
												x: u,
												travellerWidth: c,
												startIndex: f,
												endIndex: l,
										  })
										: { scale: null, scaleValues: null },
								);
							if (
								i.scale &&
								(o !== i.prevWidth ||
									u !== i.prevX ||
									c !== i.prevTravellerWidth)
							) {
								i.scale.range([u, u + o - c]);
								var p = i.scale.domain().map(function (h) {
									return i.scale(h);
								});
								return {
									prevData: a,
									prevTravellerWidth: c,
									prevUpdateId: s,
									prevX: u,
									prevWidth: o,
									startX: i.scale(n.startIndex),
									endX: i.scale(n.endIndex),
									scaleValues: p,
								};
							}
							return null;
						},
					},
					{
						key: 'getIndexInRange',
						value: function (n, i) {
							for (var a = n.length, o = 0, u = a - 1; u - o > 1; ) {
								var c = Math.floor((o + u) / 2);
								n[c] > i ? (u = c) : (o = c);
							}
							return i >= n[u] ? u : o;
						},
					},
				],
			)
		);
	})(L.PureComponent);
Re($r, 'displayName', 'Brush');
Re($r, 'defaultProps', {
	height: 40,
	travellerWidth: 5,
	gap: 1,
	fill: '#fff',
	stroke: '#666',
	padding: { top: 1, right: 1, bottom: 1, left: 1 },
	leaveTimeOut: 1e3,
	alwaysShowText: !1,
});
var PL = Dc;
function $L(e, t) {
	var r;
	return (
		PL(e, function (n, i, a) {
			return (r = t(n, i, a)), !r;
		}),
		!!r
	);
}
var TL = $L,
	EL = ud,
	jL = It,
	ML = TL,
	CL = De,
	IL = Wa;
function NL(e, t, r) {
	var n = CL(e) ? EL : ML;
	return r && IL(e, t, r) && (t = void 0), n(e, jL(t));
}
var kL = NL;
const DL = fe(kL);
var ct = function (t, r) {
		var n = t.alwaysShow,
			i = t.ifOverflow;
		return n && (i = 'extendDomain'), i === r;
	},
	Lp = Ed;
function LL(e, t, r) {
	t == '__proto__' && Lp
		? Lp(e, t, { configurable: !0, enumerable: !0, value: r, writable: !0 })
		: (e[t] = r);
}
var BL = LL,
	RL = BL,
	FL = $d,
	zL = It;
function UL(e, t) {
	var r = {};
	return (
		(t = zL(t)),
		FL(e, function (n, i, a) {
			RL(r, i, t(n, i, a));
		}),
		r
	);
}
var WL = UL;
const qL = fe(WL);
function GL(e, t) {
	for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
		if (!t(e[r], r, e)) return !1;
	return !0;
}
var HL = GL,
	KL = Dc;
function VL(e, t) {
	var r = !0;
	return (
		KL(e, function (n, i, a) {
			return (r = !!t(n, i, a)), r;
		}),
		r
	);
}
var XL = VL,
	YL = HL,
	ZL = XL,
	JL = It,
	QL = De,
	eB = Wa;
function tB(e, t, r) {
	var n = QL(e) ? YL : ZL;
	return r && eB(e, t, r) && (t = void 0), n(e, JL(t));
}
var rB = tB;
const iy = fe(rB);
var nB = ['x', 'y'];
function qn(e) {
	'@babel/helpers - typeof';
	return (
		(qn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		qn(e)
	);
}
function Vu() {
	return (
		(Vu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Vu.apply(this, arguments)
	);
}
function Bp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function cn(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Bp(Object(r), !0).forEach(function (n) {
					iB(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Bp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function iB(e, t, r) {
	return (
		(t = aB(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function aB(e) {
	var t = oB(e, 'string');
	return qn(t) == 'symbol' ? t : t + '';
}
function oB(e, t) {
	if (qn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (qn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function uB(e, t) {
	if (e == null) return {};
	var r = cB(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function cB(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function sB(e, t) {
	var r = e.x,
		n = e.y,
		i = uB(e, nB),
		a = ''.concat(r),
		o = parseInt(a, 10),
		u = ''.concat(n),
		c = parseInt(u, 10),
		s = ''.concat(t.height || i.height),
		f = parseInt(s, 10),
		l = ''.concat(t.width || i.width),
		p = parseInt(l, 10);
	return cn(
		cn(cn(cn(cn({}, t), i), o ? { x: o } : {}), c ? { y: c } : {}),
		{},
		{ height: f, width: p, name: t.name, radius: t.radius },
	);
}
function Rp(e) {
	return $.createElement(
		HD,
		Vu(
			{
				shapeType: 'rectangle',
				propTransformer: sB,
				activeClassName: 'recharts-active-bar',
			},
			e,
		),
	);
}
var lB = function (t) {
		var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
		return function (n, i) {
			if (typeof t == 'number') return t;
			var a = typeof n == 'number';
			return a ? t(n, i) : (a || Jt(), r);
		};
	},
	fB = ['value', 'background'],
	ay;
function Tr(e) {
	'@babel/helpers - typeof';
	return (
		(Tr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Tr(e)
	);
}
function pB(e, t) {
	if (e == null) return {};
	var r = hB(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function hB(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function fa() {
	return (
		(fa = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		fa.apply(this, arguments)
	);
}
function Fp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function me(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Fp(Object(r), !0).forEach(function (n) {
					Tt(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Fp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function dB(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function zp(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, uy(n.key), n);
	}
}
function vB(e, t, r) {
	return (
		t && zp(e.prototype, t),
		r && zp(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function yB(e, t, r) {
	return (
		(t = pa(t)),
		mB(
			e,
			oy() ? Reflect.construct(t, r || [], pa(e).constructor) : t.apply(e, r),
		)
	);
}
function mB(e, t) {
	if (t && (Tr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return gB(e);
}
function gB(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function oy() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (oy = function () {
		return !!e;
	})();
}
function pa(e) {
	return (
		(pa = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		pa(e)
	);
}
function bB(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Xu(e, t);
}
function Xu(e, t) {
	return (
		(Xu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Xu(e, t)
	);
}
function Tt(e, t, r) {
	return (
		(t = uy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function uy(e) {
	var t = xB(e, 'string');
	return Tr(t) == 'symbol' ? t : t + '';
}
function xB(e, t) {
	if (Tr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Tr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var ai = (function (e) {
	function t() {
		var r;
		dB(this, t);
		for (var n = arguments.length, i = new Array(n), a = 0; a < n; a++)
			i[a] = arguments[a];
		return (
			(r = yB(this, t, [].concat(i))),
			Tt(r, 'state', { isAnimationFinished: !1 }),
			Tt(r, 'id', Jn('recharts-bar-')),
			Tt(r, 'handleAnimationEnd', function () {
				var o = r.props.onAnimationEnd;
				r.setState({ isAnimationFinished: !0 }), o && o();
			}),
			Tt(r, 'handleAnimationStart', function () {
				var o = r.props.onAnimationStart;
				r.setState({ isAnimationFinished: !1 }), o && o();
			}),
			r
		);
	}
	return (
		bB(t, e),
		vB(
			t,
			[
				{
					key: 'renderRectanglesStatically',
					value: function (n) {
						var i = this,
							a = this.props,
							o = a.shape,
							u = a.dataKey,
							c = a.activeIndex,
							s = a.activeBar,
							f = ee(this.props, !1);
						return (
							n &&
							n.map(function (l, p) {
								var h = p === c,
									d = h ? s : o,
									v = me(
										me(me({}, f), l),
										{},
										{
											isActive: h,
											option: d,
											index: p,
											dataKey: u,
											onAnimationStart: i.handleAnimationStart,
											onAnimationEnd: i.handleAnimationEnd,
										},
									);
								return $.createElement(
									ve,
									fa(
										{ className: 'recharts-bar-rectangle' },
										Ai(i.props, l, p),
										{
											key: 'rectangle-'
												.concat(l == null ? void 0 : l.x, '-')
												.concat(l == null ? void 0 : l.y, '-')
												.concat(l == null ? void 0 : l.value),
										},
									),
									$.createElement(Rp, v),
								);
							})
						);
					},
				},
				{
					key: 'renderRectanglesWithAnimation',
					value: function () {
						var n = this,
							i = this.props,
							a = i.data,
							o = i.layout,
							u = i.isAnimationActive,
							c = i.animationBegin,
							s = i.animationDuration,
							f = i.animationEasing,
							l = i.animationId,
							p = this.state.prevData;
						return $.createElement(
							xt,
							{
								begin: c,
								duration: s,
								isActive: u,
								easing: f,
								from: { t: 0 },
								to: { t: 1 },
								key: 'bar-'.concat(l),
								onAnimationEnd: this.handleAnimationEnd,
								onAnimationStart: this.handleAnimationStart,
							},
							function (h) {
								var d = h.t,
									v = a.map(function (y, b) {
										var w = p && p[b];
										if (w) {
											var x = tt(w.x, y.x),
												S = tt(w.y, y.y),
												m = tt(w.width, y.width),
												g = tt(w.height, y.height);
											return me(
												me({}, y),
												{},
												{ x: x(d), y: S(d), width: m(d), height: g(d) },
											);
										}
										if (o === 'horizontal') {
											var O = tt(0, y.height),
												_ = O(d);
											return me(
												me({}, y),
												{},
												{ y: y.y + y.height - _, height: _ },
											);
										}
										var A = tt(0, y.width),
											E = A(d);
										return me(me({}, y), {}, { width: E });
									});
								return $.createElement(
									ve,
									null,
									n.renderRectanglesStatically(v),
								);
							},
						);
					},
				},
				{
					key: 'renderRectangles',
					value: function () {
						var n = this.props,
							i = n.data,
							a = n.isAnimationActive,
							o = this.state.prevData;
						return a && i && i.length && (!o || !Ja(o, i))
							? this.renderRectanglesWithAnimation()
							: this.renderRectanglesStatically(i);
					},
				},
				{
					key: 'renderBackground',
					value: function () {
						var n = this,
							i = this.props,
							a = i.data,
							o = i.dataKey,
							u = i.activeIndex,
							c = ee(this.props.background, !1);
						return a.map(function (s, f) {
							s.value;
							var l = s.background,
								p = pB(s, fB);
							if (!l) return null;
							var h = me(
								me(
									me(me(me({}, p), {}, { fill: '#eee' }, l), c),
									Ai(n.props, s, f),
								),
								{},
								{
									onAnimationStart: n.handleAnimationStart,
									onAnimationEnd: n.handleAnimationEnd,
									dataKey: o,
									index: f,
									className: 'recharts-bar-background-rectangle',
								},
							);
							return $.createElement(
								Rp,
								fa(
									{
										key: 'background-bar-'.concat(f),
										option: n.props.background,
										isActive: f === u,
									},
									h,
								),
							);
						});
					},
				},
				{
					key: 'renderErrorBar',
					value: function (n, i) {
						if (this.props.isAnimationActive && !this.state.isAnimationFinished)
							return null;
						var a = this.props,
							o = a.data,
							u = a.xAxis,
							c = a.yAxis,
							s = a.layout,
							f = a.children,
							l = Ve(f, ii);
						if (!l) return null;
						var p = s === 'vertical' ? o[0].height / 2 : o[0].width / 2,
							h = function (y, b) {
								var w = Array.isArray(y.value) ? y.value[1] : y.value;
								return { x: y.x, y: y.y, value: w, errorVal: Ue(y, b) };
							},
							d = { clipPath: n ? 'url(#clipPath-'.concat(i, ')') : null };
						return $.createElement(
							ve,
							d,
							l.map(function (v) {
								return $.cloneElement(v, {
									key: 'error-bar-'.concat(i, '-').concat(v.props.dataKey),
									data: o,
									xAxis: u,
									yAxis: c,
									layout: s,
									offset: p,
									dataPointFormatter: h,
								});
							}),
						);
					},
				},
				{
					key: 'render',
					value: function () {
						var n = this.props,
							i = n.hide,
							a = n.data,
							o = n.className,
							u = n.xAxis,
							c = n.yAxis,
							s = n.left,
							f = n.top,
							l = n.width,
							p = n.height,
							h = n.isAnimationActive,
							d = n.background,
							v = n.id;
						if (i || !a || !a.length) return null;
						var y = this.state.isAnimationFinished,
							b = ne('recharts-bar', o),
							w = u && u.allowDataOverflow,
							x = c && c.allowDataOverflow,
							S = w || x,
							m = Q(v) ? this.id : v;
						return $.createElement(
							ve,
							{ className: b },
							w || x
								? $.createElement(
										'defs',
										null,
										$.createElement(
											'clipPath',
											{ id: 'clipPath-'.concat(m) },
											$.createElement('rect', {
												x: w ? s : s - l / 2,
												y: x ? f : f - p / 2,
												width: w ? l : l * 2,
												height: x ? p : p * 2,
											}),
										),
								  )
								: null,
							$.createElement(
								ve,
								{
									className: 'recharts-bar-rectangles',
									clipPath: S ? 'url(#clipPath-'.concat(m, ')') : null,
								},
								d ? this.renderBackground() : null,
								this.renderRectangles(),
							),
							this.renderErrorBar(S, m),
							(!h || y) && Mt.renderCallByParent(this.props, a),
						);
					},
				},
			],
			[
				{
					key: 'getDerivedStateFromProps',
					value: function (n, i) {
						return n.animationId !== i.prevAnimationId
							? {
									prevAnimationId: n.animationId,
									curData: n.data,
									prevData: i.curData,
							  }
							: n.data !== i.curData
							? { curData: n.data }
							: null;
					},
				},
			],
		)
	);
})(L.PureComponent);
ay = ai;
Tt(ai, 'displayName', 'Bar');
Tt(ai, 'defaultProps', {
	xAxisId: 0,
	yAxisId: 0,
	legendType: 'rect',
	minPointSize: 0,
	hide: !1,
	data: [],
	layout: 'vertical',
	activeBar: !1,
	isAnimationActive: !vt.isSsr,
	animationBegin: 0,
	animationDuration: 400,
	animationEasing: 'ease',
});
Tt(ai, 'getComposedData', function (e) {
	var t = e.props,
		r = e.item,
		n = e.barPosition,
		i = e.bandSize,
		a = e.xAxis,
		o = e.yAxis,
		u = e.xAxisTicks,
		c = e.yAxisTicks,
		s = e.stackedData,
		f = e.dataStartIndex,
		l = e.displayedData,
		p = e.offset,
		h = f2(n, r);
	if (!h) return null;
	var d = t.layout,
		v = r.type.defaultProps,
		y = v !== void 0 ? me(me({}, v), r.props) : r.props,
		b = y.dataKey,
		w = y.children,
		x = y.minPointSize,
		S = d === 'horizontal' ? o : a,
		m = s ? S.scale.domain() : null,
		g = b2({ numericAxis: S }),
		O = Ve(w, kd),
		_ = l.map(function (A, E) {
			var P, T, j, C, I, k;
			s
				? (P = p2(s[f + E], m))
				: ((P = Ue(A, b)), Array.isArray(P) || (P = [g, P]));
			var D = lB(x, ay.defaultProps.minPointSize)(P[1], E);
			if (d === 'horizontal') {
				var B,
					F = [o.scale(P[0]), o.scale(P[1])],
					H = F[0],
					V = F[1];
				(T = Ff({
					axis: a,
					ticks: u,
					bandSize: i,
					offset: h.offset,
					entry: A,
					index: E,
				})),
					(j = (B = V ?? H) !== null && B !== void 0 ? B : void 0),
					(C = h.size);
				var G = H - V;
				if (
					((I = Number.isNaN(G) ? 0 : G),
					(k = { x: T, y: o.y, width: C, height: o.height }),
					Math.abs(D) > 0 && Math.abs(I) < Math.abs(D))
				) {
					var X = nt(I || D) * (Math.abs(D) - Math.abs(I));
					(j -= X), (I += X);
				}
			} else {
				var ce = [a.scale(P[0]), a.scale(P[1])],
					ye = ce[0],
					Le = ce[1];
				if (
					((T = ye),
					(j = Ff({
						axis: o,
						ticks: c,
						bandSize: i,
						offset: h.offset,
						entry: A,
						index: E,
					})),
					(C = Le - ye),
					(I = h.size),
					(k = { x: a.x, y: j, width: a.width, height: I }),
					Math.abs(D) > 0 && Math.abs(C) < Math.abs(D))
				) {
					var Lt = nt(C || D) * (Math.abs(D) - Math.abs(C));
					C += Lt;
				}
			}
			return me(
				me(
					me({}, A),
					{},
					{
						x: T,
						y: j,
						width: C,
						height: I,
						value: s ? P : P[1],
						payload: A,
						background: k,
					},
					O && O[E] && O[E].props,
				),
				{},
				{
					tooltipPayload: [zv(r, A)],
					tooltipPosition: { x: T + C / 2, y: j + I / 2 },
				},
			);
		});
	return me({ data: _, layout: d }, p);
});
function Gn(e) {
	'@babel/helpers - typeof';
	return (
		(Gn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Gn(e)
	);
}
function wB(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function Up(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, cy(n.key), n);
	}
}
function OB(e, t, r) {
	return (
		t && Up(e.prototype, t),
		r && Up(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function Wp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Qe(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Wp(Object(r), !0).forEach(function (n) {
					no(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Wp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function no(e, t, r) {
	return (
		(t = cy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function cy(e) {
	var t = SB(e, 'string');
	return Gn(t) == 'symbol' ? t : t + '';
}
function SB(e, t) {
	if (Gn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Gn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var _B = function (t, r, n, i, a) {
		var o = t.width,
			u = t.height,
			c = t.layout,
			s = t.children,
			f = Object.keys(r),
			l = {
				left: n.left,
				leftMirror: n.left,
				right: o - n.right,
				rightMirror: o - n.right,
				top: n.top,
				topMirror: n.top,
				bottom: u - n.bottom,
				bottomMirror: u - n.bottom,
			},
			p = !!Fe(s, ai);
		return f.reduce(function (h, d) {
			var v = r[d],
				y = v.orientation,
				b = v.domain,
				w = v.padding,
				x = w === void 0 ? {} : w,
				S = v.mirror,
				m = v.reversed,
				g = ''.concat(y).concat(S ? 'Mirror' : ''),
				O,
				_,
				A,
				E,
				P;
			if (
				v.type === 'number' &&
				(v.padding === 'gap' || v.padding === 'no-gap')
			) {
				var T = b[1] - b[0],
					j = 1 / 0,
					C = v.categoricalDomain.sort();
				if (
					(C.forEach(function (ce, ye) {
						ye > 0 && (j = Math.min((ce || 0) - (C[ye - 1] || 0), j));
					}),
					Number.isFinite(j))
				) {
					var I = j / T,
						k = v.layout === 'vertical' ? n.height : n.width;
					if (
						(v.padding === 'gap' && (O = (I * k) / 2), v.padding === 'no-gap')
					) {
						var D = Yt(t.barCategoryGap, I * k),
							B = (I * k) / 2;
						O = B - D - ((B - D) / k) * D;
					}
				}
			}
			i === 'xAxis'
				? (_ = [
						n.left + (x.left || 0) + (O || 0),
						n.left + n.width - (x.right || 0) - (O || 0),
				  ])
				: i === 'yAxis'
				? (_ =
						c === 'horizontal'
							? [n.top + n.height - (x.bottom || 0), n.top + (x.top || 0)]
							: [
									n.top + (x.top || 0) + (O || 0),
									n.top + n.height - (x.bottom || 0) - (O || 0),
							  ])
				: (_ = v.range),
				m && (_ = [_[1], _[0]]);
			var F = s2(v, a, p),
				H = F.scale,
				V = F.realScaleType;
			H.domain(b).range(_), l2(H);
			var G = g2(H, Qe(Qe({}, v), {}, { realScaleType: V }));
			i === 'xAxis'
				? ((P = (y === 'top' && !S) || (y === 'bottom' && S)),
				  (A = n.left),
				  (E = l[g] - P * v.height))
				: i === 'yAxis' &&
				  ((P = (y === 'left' && !S) || (y === 'right' && S)),
				  (A = l[g] - P * v.width),
				  (E = n.top));
			var X = Qe(
				Qe(Qe({}, v), G),
				{},
				{
					realScaleType: V,
					x: A,
					y: E,
					scale: H,
					width: i === 'xAxis' ? n.width : v.width,
					height: i === 'yAxis' ? n.height : v.height,
				},
			);
			return (
				(X.bandSize = Qi(X, G)),
				!v.hide && i === 'xAxis'
					? (l[g] += (P ? -1 : 1) * X.height)
					: v.hide || (l[g] += (P ? -1 : 1) * X.width),
				Qe(Qe({}, h), {}, no({}, d, X))
			);
		}, {});
	},
	sy = function (t, r) {
		var n = t.x,
			i = t.y,
			a = r.x,
			o = r.y;
		return {
			x: Math.min(n, a),
			y: Math.min(i, o),
			width: Math.abs(a - n),
			height: Math.abs(o - i),
		};
	},
	AB = function (t) {
		var r = t.x1,
			n = t.y1,
			i = t.x2,
			a = t.y2;
		return sy({ x: r, y: n }, { x: i, y: a });
	},
	ly = (function () {
		function e(t) {
			wB(this, e), (this.scale = t);
		}
		return OB(
			e,
			[
				{
					key: 'domain',
					get: function () {
						return this.scale.domain;
					},
				},
				{
					key: 'range',
					get: function () {
						return this.scale.range;
					},
				},
				{
					key: 'rangeMin',
					get: function () {
						return this.range()[0];
					},
				},
				{
					key: 'rangeMax',
					get: function () {
						return this.range()[1];
					},
				},
				{
					key: 'bandwidth',
					get: function () {
						return this.scale.bandwidth;
					},
				},
				{
					key: 'apply',
					value: function (r) {
						var n =
								arguments.length > 1 && arguments[1] !== void 0
									? arguments[1]
									: {},
							i = n.bandAware,
							a = n.position;
						if (r !== void 0) {
							if (a)
								switch (a) {
									case 'start':
										return this.scale(r);
									case 'middle': {
										var o = this.bandwidth ? this.bandwidth() / 2 : 0;
										return this.scale(r) + o;
									}
									case 'end': {
										var u = this.bandwidth ? this.bandwidth() : 0;
										return this.scale(r) + u;
									}
									default:
										return this.scale(r);
								}
							if (i) {
								var c = this.bandwidth ? this.bandwidth() / 2 : 0;
								return this.scale(r) + c;
							}
							return this.scale(r);
						}
					},
				},
				{
					key: 'isInRange',
					value: function (r) {
						var n = this.range(),
							i = n[0],
							a = n[n.length - 1];
						return i <= a ? r >= i && r <= a : r >= a && r <= i;
					},
				},
			],
			[
				{
					key: 'create',
					value: function (r) {
						return new e(r);
					},
				},
			],
		);
	})();
no(ly, 'EPS', 1e-4);
var ps = function (t) {
	var r = Object.keys(t).reduce(function (n, i) {
		return Qe(Qe({}, n), {}, no({}, i, ly.create(t[i])));
	}, {});
	return Qe(
		Qe({}, r),
		{},
		{
			apply: function (i) {
				var a =
						arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
					o = a.bandAware,
					u = a.position;
				return qL(i, function (c, s) {
					return r[s].apply(c, { bandAware: o, position: u });
				});
			},
			isInRange: function (i) {
				return iy(i, function (a, o) {
					return r[o].isInRange(a);
				});
			},
		},
	);
};
function PB(e) {
	return ((e % 180) + 180) % 180;
}
var $B = function (t) {
		var r = t.width,
			n = t.height,
			i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0,
			a = PB(i),
			o = (a * Math.PI) / 180,
			u = Math.atan(n / r),
			c = o > u && o < Math.PI - u ? n / Math.sin(o) : r / Math.cos(o);
		return Math.abs(c);
	},
	TB = It,
	EB = Qn,
	jB = za;
function MB(e) {
	return function (t, r, n) {
		var i = Object(t);
		if (!EB(t)) {
			var a = TB(r);
			(t = jB(t)),
				(r = function (u) {
					return a(i[u], u, i);
				});
		}
		var o = e(t, r, n);
		return o > -1 ? i[a ? t[o] : o] : void 0;
	};
}
var CB = MB,
	IB = ey;
function NB(e) {
	var t = IB(e),
		r = t % 1;
	return t === t ? (r ? t - r : t) : 0;
}
var kB = NB,
	DB = wd,
	LB = It,
	BB = kB,
	RB = Math.max;
function FB(e, t, r) {
	var n = e == null ? 0 : e.length;
	if (!n) return -1;
	var i = r == null ? 0 : BB(r);
	return i < 0 && (i = RB(n + i, 0)), DB(e, LB(t), i);
}
var zB = FB,
	UB = CB,
	WB = zB,
	qB = UB(WB),
	GB = qB;
const HB = fe(GB);
var KB = t0(
		function (e) {
			return { x: e.left, y: e.top, width: e.width, height: e.height };
		},
		function (e) {
			return ['l', e.left, 't', e.top, 'w', e.width, 'h', e.height].join('');
		},
	),
	hs = L.createContext(void 0),
	ds = L.createContext(void 0),
	fy = L.createContext(void 0),
	py = L.createContext({}),
	hy = L.createContext(void 0),
	dy = L.createContext(0),
	vy = L.createContext(0),
	qp = function (t) {
		var r = t.state,
			n = r.xAxisMap,
			i = r.yAxisMap,
			a = r.offset,
			o = t.clipPathId,
			u = t.children,
			c = t.width,
			s = t.height,
			f = KB(a);
		return $.createElement(
			hs.Provider,
			{ value: n },
			$.createElement(
				ds.Provider,
				{ value: i },
				$.createElement(
					py.Provider,
					{ value: a },
					$.createElement(
						fy.Provider,
						{ value: f },
						$.createElement(
							hy.Provider,
							{ value: o },
							$.createElement(
								dy.Provider,
								{ value: s },
								$.createElement(vy.Provider, { value: c }, u),
							),
						),
					),
				),
			),
		);
	},
	VB = function () {
		return L.useContext(hy);
	},
	yy = function (t) {
		var r = L.useContext(hs);
		r == null && Jt();
		var n = r[t];
		return n == null && Jt(), n;
	},
	XB = function () {
		var t = L.useContext(hs);
		return Pt(t);
	},
	YB = function () {
		var t = L.useContext(ds),
			r = HB(t, function (n) {
				return iy(n.domain, Number.isFinite);
			});
		return r || Pt(t);
	},
	my = function (t) {
		var r = L.useContext(ds);
		r == null && Jt();
		var n = r[t];
		return n == null && Jt(), n;
	},
	ZB = function () {
		var t = L.useContext(fy);
		return t;
	},
	JB = function () {
		return L.useContext(py);
	},
	vs = function () {
		return L.useContext(vy);
	},
	ys = function () {
		return L.useContext(dy);
	};
function Er(e) {
	'@babel/helpers - typeof';
	return (
		(Er =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Er(e)
	);
}
function QB(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function eR(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, by(n.key), n);
	}
}
function tR(e, t, r) {
	return (
		t && eR(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function rR(e, t, r) {
	return (
		(t = ha(t)),
		nR(
			e,
			gy() ? Reflect.construct(t, r || [], ha(e).constructor) : t.apply(e, r),
		)
	);
}
function nR(e, t) {
	if (t && (Er(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return iR(e);
}
function iR(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function gy() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (gy = function () {
		return !!e;
	})();
}
function ha(e) {
	return (
		(ha = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ha(e)
	);
}
function aR(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Yu(e, t);
}
function Yu(e, t) {
	return (
		(Yu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Yu(e, t)
	);
}
function Gp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Hp(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Gp(Object(r), !0).forEach(function (n) {
					ms(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Gp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function ms(e, t, r) {
	return (
		(t = by(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function by(e) {
	var t = oR(e, 'string');
	return Er(t) == 'symbol' ? t : t + '';
}
function oR(e, t) {
	if (Er(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Er(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function uR(e, t) {
	return fR(e) || lR(e, t) || sR(e, t) || cR();
}
function cR() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function sR(e, t) {
	if (e) {
		if (typeof e == 'string') return Kp(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return Kp(e, t);
	}
}
function Kp(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function lR(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function fR(e) {
	if (Array.isArray(e)) return e;
}
function Zu() {
	return (
		(Zu = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Zu.apply(this, arguments)
	);
}
var pR = function (t, r) {
		var n;
		return (
			$.isValidElement(t)
				? (n = $.cloneElement(t, r))
				: J(t)
				? (n = t(r))
				: (n = $.createElement(
						'line',
						Zu({}, r, { className: 'recharts-reference-line-line' }),
				  )),
			n
		);
	},
	hR = function (t, r, n, i, a, o, u, c, s) {
		var f = a.x,
			l = a.y,
			p = a.width,
			h = a.height;
		if (n) {
			var d = s.y,
				v = t.y.apply(d, { position: o });
			if (ct(s, 'discard') && !t.y.isInRange(v)) return null;
			var y = [
				{ x: f + p, y: v },
				{ x: f, y: v },
			];
			return c === 'left' ? y.reverse() : y;
		}
		if (r) {
			var b = s.x,
				w = t.x.apply(b, { position: o });
			if (ct(s, 'discard') && !t.x.isInRange(w)) return null;
			var x = [
				{ x: w, y: l + h },
				{ x: w, y: l },
			];
			return u === 'top' ? x.reverse() : x;
		}
		if (i) {
			var S = s.segment,
				m = S.map(function (g) {
					return t.apply(g, { position: o });
				});
			return ct(s, 'discard') &&
				DL(m, function (g) {
					return !t.isInRange(g);
				})
				? null
				: m;
		}
		return null;
	};
function dR(e) {
	var t = e.x,
		r = e.y,
		n = e.segment,
		i = e.xAxisId,
		a = e.yAxisId,
		o = e.shape,
		u = e.className,
		c = e.alwaysShow,
		s = VB(),
		f = yy(i),
		l = my(a),
		p = ZB();
	if (!s || !p) return null;
	vr(
		c === void 0,
		'The alwaysShow prop is deprecated. Please use ifOverflow="extendDomain" instead.',
	);
	var h = ps({ x: f.scale, y: l.scale }),
		d = Oe(t),
		v = Oe(r),
		y = n && n.length === 2,
		b = hR(h, d, v, y, p, e.position, f.orientation, l.orientation, e);
	if (!b) return null;
	var w = uR(b, 2),
		x = w[0],
		S = x.x,
		m = x.y,
		g = w[1],
		O = g.x,
		_ = g.y,
		A = ct(e, 'hidden') ? 'url(#'.concat(s, ')') : void 0,
		E = Hp(Hp({ clipPath: A }, ee(e, !0)), {}, { x1: S, y1: m, x2: O, y2: _ });
	return $.createElement(
		ve,
		{ className: ne('recharts-reference-line', u) },
		pR(o, E),
		Ee.renderCallByParent(e, AB({ x1: S, y1: m, x2: O, y2: _ })),
	);
}
var $t = (function (e) {
	function t() {
		return QB(this, t), rR(this, t, arguments);
	}
	return (
		aR(t, e),
		tR(t, [
			{
				key: 'render',
				value: function () {
					return $.createElement(dR, this.props);
				},
			},
		])
	);
})($.Component);
ms($t, 'displayName', 'ReferenceLine');
ms($t, 'defaultProps', {
	isFront: !1,
	ifOverflow: 'discard',
	xAxisId: 0,
	yAxisId: 0,
	fill: 'none',
	stroke: '#ccc',
	fillOpacity: 1,
	strokeWidth: 1,
	position: 'middle',
});
function Ju() {
	return (
		(Ju = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Ju.apply(this, arguments)
	);
}
function jr(e) {
	'@babel/helpers - typeof';
	return (
		(jr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		jr(e)
	);
}
function Vp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Xp(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Vp(Object(r), !0).forEach(function (n) {
					io(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Vp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function vR(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function yR(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, wy(n.key), n);
	}
}
function mR(e, t, r) {
	return (
		t && yR(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function gR(e, t, r) {
	return (
		(t = da(t)),
		bR(
			e,
			xy() ? Reflect.construct(t, r || [], da(e).constructor) : t.apply(e, r),
		)
	);
}
function bR(e, t) {
	if (t && (jr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return xR(e);
}
function xR(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function xy() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (xy = function () {
		return !!e;
	})();
}
function da(e) {
	return (
		(da = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		da(e)
	);
}
function wR(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && Qu(e, t);
}
function Qu(e, t) {
	return (
		(Qu = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		Qu(e, t)
	);
}
function io(e, t, r) {
	return (
		(t = wy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function wy(e) {
	var t = OR(e, 'string');
	return jr(t) == 'symbol' ? t : t + '';
}
function OR(e, t) {
	if (jr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (jr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var SR = function (t) {
		var r = t.x,
			n = t.y,
			i = t.xAxis,
			a = t.yAxis,
			o = ps({ x: i.scale, y: a.scale }),
			u = o.apply({ x: r, y: n }, { bandAware: !0 });
		return ct(t, 'discard') && !o.isInRange(u) ? null : u;
	},
	ao = (function (e) {
		function t() {
			return vR(this, t), gR(this, t, arguments);
		}
		return (
			wR(t, e),
			mR(t, [
				{
					key: 'render',
					value: function () {
						var n = this.props,
							i = n.x,
							a = n.y,
							o = n.r,
							u = n.alwaysShow,
							c = n.clipPathId,
							s = Oe(i),
							f = Oe(a);
						if (
							(vr(
								u === void 0,
								'The alwaysShow prop is deprecated. Please use ifOverflow="extendDomain" instead.',
							),
							!s || !f)
						)
							return null;
						var l = SR(this.props);
						if (!l) return null;
						var p = l.x,
							h = l.y,
							d = this.props,
							v = d.shape,
							y = d.className,
							b = ct(this.props, 'hidden') ? 'url(#'.concat(c, ')') : void 0,
							w = Xp(
								Xp({ clipPath: b }, ee(this.props, !0)),
								{},
								{ cx: p, cy: h },
							);
						return $.createElement(
							ve,
							{ className: ne('recharts-reference-dot', y) },
							t.renderDot(v, w),
							Ee.renderCallByParent(this.props, {
								x: p - o,
								y: h - o,
								width: 2 * o,
								height: 2 * o,
							}),
						);
					},
				},
			])
		);
	})($.Component);
io(ao, 'displayName', 'ReferenceDot');
io(ao, 'defaultProps', {
	isFront: !1,
	ifOverflow: 'discard',
	xAxisId: 0,
	yAxisId: 0,
	r: 10,
	fill: '#fff',
	stroke: '#ccc',
	fillOpacity: 1,
	strokeWidth: 1,
});
io(ao, 'renderDot', function (e, t) {
	var r;
	return (
		$.isValidElement(e)
			? (r = $.cloneElement(e, t))
			: J(e)
			? (r = e(t))
			: (r = $.createElement(
					fs,
					Ju({}, t, {
						cx: t.cx,
						cy: t.cy,
						className: 'recharts-reference-dot-dot',
					}),
			  )),
		r
	);
});
function ec() {
	return (
		(ec = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		ec.apply(this, arguments)
	);
}
function Mr(e) {
	'@babel/helpers - typeof';
	return (
		(Mr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Mr(e)
	);
}
function Yp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Zp(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Yp(Object(r), !0).forEach(function (n) {
					oo(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Yp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function _R(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function AR(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Sy(n.key), n);
	}
}
function PR(e, t, r) {
	return (
		t && AR(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function $R(e, t, r) {
	return (
		(t = va(t)),
		TR(
			e,
			Oy() ? Reflect.construct(t, r || [], va(e).constructor) : t.apply(e, r),
		)
	);
}
function TR(e, t) {
	if (t && (Mr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return ER(e);
}
function ER(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Oy() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Oy = function () {
		return !!e;
	})();
}
function va(e) {
	return (
		(va = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		va(e)
	);
}
function jR(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && tc(e, t);
}
function tc(e, t) {
	return (
		(tc = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		tc(e, t)
	);
}
function oo(e, t, r) {
	return (
		(t = Sy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Sy(e) {
	var t = MR(e, 'string');
	return Mr(t) == 'symbol' ? t : t + '';
}
function MR(e, t) {
	if (Mr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Mr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var CR = function (t, r, n, i, a) {
		var o = a.x1,
			u = a.x2,
			c = a.y1,
			s = a.y2,
			f = a.xAxis,
			l = a.yAxis;
		if (!f || !l) return null;
		var p = ps({ x: f.scale, y: l.scale }),
			h = {
				x: t ? p.x.apply(o, { position: 'start' }) : p.x.rangeMin,
				y: n ? p.y.apply(c, { position: 'start' }) : p.y.rangeMin,
			},
			d = {
				x: r ? p.x.apply(u, { position: 'end' }) : p.x.rangeMax,
				y: i ? p.y.apply(s, { position: 'end' }) : p.y.rangeMax,
			};
		return ct(a, 'discard') && (!p.isInRange(h) || !p.isInRange(d))
			? null
			: sy(h, d);
	},
	uo = (function (e) {
		function t() {
			return _R(this, t), $R(this, t, arguments);
		}
		return (
			jR(t, e),
			PR(t, [
				{
					key: 'render',
					value: function () {
						var n = this.props,
							i = n.x1,
							a = n.x2,
							o = n.y1,
							u = n.y2,
							c = n.className,
							s = n.alwaysShow,
							f = n.clipPathId;
						vr(
							s === void 0,
							'The alwaysShow prop is deprecated. Please use ifOverflow="extendDomain" instead.',
						);
						var l = Oe(i),
							p = Oe(a),
							h = Oe(o),
							d = Oe(u),
							v = this.props.shape;
						if (!l && !p && !h && !d && !v) return null;
						var y = CR(l, p, h, d, this.props);
						if (!y && !v) return null;
						var b = ct(this.props, 'hidden') ? 'url(#'.concat(f, ')') : void 0;
						return $.createElement(
							ve,
							{ className: ne('recharts-reference-area', c) },
							t.renderRect(v, Zp(Zp({ clipPath: b }, ee(this.props, !0)), y)),
							Ee.renderCallByParent(this.props, y),
						);
					},
				},
			])
		);
	})($.Component);
oo(uo, 'displayName', 'ReferenceArea');
oo(uo, 'defaultProps', {
	isFront: !1,
	ifOverflow: 'discard',
	xAxisId: 0,
	yAxisId: 0,
	r: 10,
	fill: '#ccc',
	fillOpacity: 0.5,
	stroke: 'none',
	strokeWidth: 1,
});
oo(uo, 'renderRect', function (e, t) {
	var r;
	return (
		$.isValidElement(e)
			? (r = $.cloneElement(e, t))
			: J(e)
			? (r = e(t))
			: (r = $.createElement(
					ls,
					ec({}, t, { className: 'recharts-reference-area-rect' }),
			  )),
		r
	);
});
function _y(e, t, r) {
	if (t < 1) return [];
	if (t === 1 && r === void 0) return e;
	for (var n = [], i = 0; i < e.length; i += t) n.push(e[i]);
	return n;
}
function IR(e, t, r) {
	var n = { width: e.width + t.width, height: e.height + t.height };
	return $B(n, r);
}
function NR(e, t, r) {
	var n = r === 'width',
		i = e.x,
		a = e.y,
		o = e.width,
		u = e.height;
	return t === 1
		? { start: n ? i : a, end: n ? i + o : a + u }
		: { start: n ? i + o : a + u, end: n ? i : a };
}
function ya(e, t, r, n, i) {
	if (e * t < e * n || e * t > e * i) return !1;
	var a = r();
	return e * (t - (e * a) / 2 - n) >= 0 && e * (t + (e * a) / 2 - i) <= 0;
}
function kR(e, t) {
	return _y(e, t + 1);
}
function DR(e, t, r, n, i) {
	for (
		var a = (n || []).slice(),
			o = t.start,
			u = t.end,
			c = 0,
			s = 1,
			f = o,
			l = function () {
				var d = n == null ? void 0 : n[c];
				if (d === void 0) return { v: _y(n, s) };
				var v = c,
					y,
					b = function () {
						return y === void 0 && (y = r(d, v)), y;
					},
					w = d.coordinate,
					x = c === 0 || ya(e, w, b, f, u);
				x || ((c = 0), (f = o), (s += 1)),
					x && ((f = w + e * (b() / 2 + i)), (c += s));
			},
			p;
		s <= a.length;

	)
		if (((p = l()), p)) return p.v;
	return [];
}
function Hn(e) {
	'@babel/helpers - typeof';
	return (
		(Hn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Hn(e)
	);
}
function Jp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Te(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Jp(Object(r), !0).forEach(function (n) {
					LR(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Jp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function LR(e, t, r) {
	return (
		(t = BR(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function BR(e) {
	var t = RR(e, 'string');
	return Hn(t) == 'symbol' ? t : t + '';
}
function RR(e, t) {
	if (Hn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Hn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function FR(e, t, r, n, i) {
	for (
		var a = (n || []).slice(),
			o = a.length,
			u = t.start,
			c = t.end,
			s = function (p) {
				var h = a[p],
					d,
					v = function () {
						return d === void 0 && (d = r(h, p)), d;
					};
				if (p === o - 1) {
					var y = e * (h.coordinate + (e * v()) / 2 - c);
					a[p] = h = Te(
						Te({}, h),
						{},
						{ tickCoord: y > 0 ? h.coordinate - y * e : h.coordinate },
					);
				} else a[p] = h = Te(Te({}, h), {}, { tickCoord: h.coordinate });
				var b = ya(e, h.tickCoord, v, u, c);
				b &&
					((c = h.tickCoord - e * (v() / 2 + i)),
					(a[p] = Te(Te({}, h), {}, { isShow: !0 })));
			},
			f = o - 1;
		f >= 0;
		f--
	)
		s(f);
	return a;
}
function zR(e, t, r, n, i, a) {
	var o = (n || []).slice(),
		u = o.length,
		c = t.start,
		s = t.end;
	if (a) {
		var f = n[u - 1],
			l = r(f, u - 1),
			p = e * (f.coordinate + (e * l) / 2 - s);
		o[u - 1] = f = Te(
			Te({}, f),
			{},
			{ tickCoord: p > 0 ? f.coordinate - p * e : f.coordinate },
		);
		var h = ya(
			e,
			f.tickCoord,
			function () {
				return l;
			},
			c,
			s,
		);
		h &&
			((s = f.tickCoord - e * (l / 2 + i)),
			(o[u - 1] = Te(Te({}, f), {}, { isShow: !0 })));
	}
	for (
		var d = a ? u - 1 : u,
			v = function (w) {
				var x = o[w],
					S,
					m = function () {
						return S === void 0 && (S = r(x, w)), S;
					};
				if (w === 0) {
					var g = e * (x.coordinate - (e * m()) / 2 - c);
					o[w] = x = Te(
						Te({}, x),
						{},
						{ tickCoord: g < 0 ? x.coordinate - g * e : x.coordinate },
					);
				} else o[w] = x = Te(Te({}, x), {}, { tickCoord: x.coordinate });
				var O = ya(e, x.tickCoord, m, c, s);
				O &&
					((c = x.tickCoord + e * (m() / 2 + i)),
					(o[w] = Te(Te({}, x), {}, { isShow: !0 })));
			},
			y = 0;
		y < d;
		y++
	)
		v(y);
	return o;
}
function gs(e, t, r) {
	var n = e.tick,
		i = e.ticks,
		a = e.viewBox,
		o = e.minTickGap,
		u = e.orientation,
		c = e.interval,
		s = e.tickFormatter,
		f = e.unit,
		l = e.angle;
	if (!i || !i.length || !n) return [];
	if (R(c) || vt.isSsr) return kR(i, typeof c == 'number' && R(c) ? c : 0);
	var p = [],
		h = u === 'top' || u === 'bottom' ? 'width' : 'height',
		d =
			f && h === 'width'
				? ln(f, { fontSize: t, letterSpacing: r })
				: { width: 0, height: 0 },
		v = function (x, S) {
			var m = J(s) ? s(x.value, S) : x.value;
			return h === 'width'
				? IR(ln(m, { fontSize: t, letterSpacing: r }), d, l)
				: ln(m, { fontSize: t, letterSpacing: r })[h];
		},
		y = i.length >= 2 ? nt(i[1].coordinate - i[0].coordinate) : 1,
		b = NR(a, y, h);
	return c === 'equidistantPreserveStart'
		? DR(y, b, v, i, o)
		: (c === 'preserveStart' || c === 'preserveStartEnd'
				? (p = zR(y, b, v, i, o, c === 'preserveStartEnd'))
				: (p = FR(y, b, v, i, o)),
		  p.filter(function (w) {
				return w.isShow;
		  }));
}
var UR = ['viewBox'],
	WR = ['viewBox'],
	qR = ['ticks'];
function Cr(e) {
	'@babel/helpers - typeof';
	return (
		(Cr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Cr(e)
	);
}
function lr() {
	return (
		(lr = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		lr.apply(this, arguments)
	);
}
function Qp(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Me(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? Qp(Object(r), !0).forEach(function (n) {
					bs(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: Qp(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function Lo(e, t) {
	if (e == null) return {};
	var r = GR(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function GR(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function HR(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function eh(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Py(n.key), n);
	}
}
function KR(e, t, r) {
	return (
		t && eh(e.prototype, t),
		r && eh(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function VR(e, t, r) {
	return (
		(t = ma(t)),
		XR(
			e,
			Ay() ? Reflect.construct(t, r || [], ma(e).constructor) : t.apply(e, r),
		)
	);
}
function XR(e, t) {
	if (t && (Cr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return YR(e);
}
function YR(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Ay() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Ay = function () {
		return !!e;
	})();
}
function ma(e) {
	return (
		(ma = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ma(e)
	);
}
function ZR(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && rc(e, t);
}
function rc(e, t) {
	return (
		(rc = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		rc(e, t)
	);
}
function bs(e, t, r) {
	return (
		(t = Py(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Py(e) {
	var t = JR(e, 'string');
	return Cr(t) == 'symbol' ? t : t + '';
}
function JR(e, t) {
	if (Cr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Cr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var Yr = (function (e) {
	function t(r) {
		var n;
		return (
			HR(this, t),
			(n = VR(this, t, [r])),
			(n.state = { fontSize: '', letterSpacing: '' }),
			n
		);
	}
	return (
		ZR(t, e),
		KR(
			t,
			[
				{
					key: 'shouldComponentUpdate',
					value: function (n, i) {
						var a = n.viewBox,
							o = Lo(n, UR),
							u = this.props,
							c = u.viewBox,
							s = Lo(u, WR);
						return !pr(a, c) || !pr(o, s) || !pr(i, this.state);
					},
				},
				{
					key: 'componentDidMount',
					value: function () {
						var n = this.layerReference;
						if (n) {
							var i = n.getElementsByClassName(
								'recharts-cartesian-axis-tick-value',
							)[0];
							i &&
								this.setState({
									fontSize: window.getComputedStyle(i).fontSize,
									letterSpacing: window.getComputedStyle(i).letterSpacing,
								});
						}
					},
				},
				{
					key: 'getTickLineCoord',
					value: function (n) {
						var i = this.props,
							a = i.x,
							o = i.y,
							u = i.width,
							c = i.height,
							s = i.orientation,
							f = i.tickSize,
							l = i.mirror,
							p = i.tickMargin,
							h,
							d,
							v,
							y,
							b,
							w,
							x = l ? -1 : 1,
							S = n.tickSize || f,
							m = R(n.tickCoord) ? n.tickCoord : n.coordinate;
						switch (s) {
							case 'top':
								(h = d = n.coordinate),
									(y = o + +!l * c),
									(v = y - x * S),
									(w = v - x * p),
									(b = m);
								break;
							case 'left':
								(v = y = n.coordinate),
									(d = a + +!l * u),
									(h = d - x * S),
									(b = h - x * p),
									(w = m);
								break;
							case 'right':
								(v = y = n.coordinate),
									(d = a + +l * u),
									(h = d + x * S),
									(b = h + x * p),
									(w = m);
								break;
							default:
								(h = d = n.coordinate),
									(y = o + +l * c),
									(v = y + x * S),
									(w = v + x * p),
									(b = m);
								break;
						}
						return {
							line: { x1: h, y1: v, x2: d, y2: y },
							tick: { x: b, y: w },
						};
					},
				},
				{
					key: 'getTickTextAnchor',
					value: function () {
						var n = this.props,
							i = n.orientation,
							a = n.mirror,
							o;
						switch (i) {
							case 'left':
								o = a ? 'start' : 'end';
								break;
							case 'right':
								o = a ? 'end' : 'start';
								break;
							default:
								o = 'middle';
								break;
						}
						return o;
					},
				},
				{
					key: 'getTickVerticalAnchor',
					value: function () {
						var n = this.props,
							i = n.orientation,
							a = n.mirror,
							o = 'end';
						switch (i) {
							case 'left':
							case 'right':
								o = 'middle';
								break;
							case 'top':
								o = a ? 'start' : 'end';
								break;
							default:
								o = a ? 'end' : 'start';
								break;
						}
						return o;
					},
				},
				{
					key: 'renderAxisLine',
					value: function () {
						var n = this.props,
							i = n.x,
							a = n.y,
							o = n.width,
							u = n.height,
							c = n.orientation,
							s = n.mirror,
							f = n.axisLine,
							l = Me(
								Me(Me({}, ee(this.props, !1)), ee(f, !1)),
								{},
								{ fill: 'none' },
							);
						if (c === 'top' || c === 'bottom') {
							var p = +((c === 'top' && !s) || (c === 'bottom' && s));
							l = Me(
								Me({}, l),
								{},
								{ x1: i, y1: a + p * u, x2: i + o, y2: a + p * u },
							);
						} else {
							var h = +((c === 'left' && !s) || (c === 'right' && s));
							l = Me(
								Me({}, l),
								{},
								{ x1: i + h * o, y1: a, x2: i + h * o, y2: a + u },
							);
						}
						return $.createElement(
							'line',
							lr({}, l, {
								className: ne(
									'recharts-cartesian-axis-line',
									Ke(f, 'className'),
								),
							}),
						);
					},
				},
				{
					key: 'renderTicks',
					value: function (n, i, a) {
						var o = this,
							u = this.props,
							c = u.tickLine,
							s = u.stroke,
							f = u.tick,
							l = u.tickFormatter,
							p = u.unit,
							h = gs(Me(Me({}, this.props), {}, { ticks: n }), i, a),
							d = this.getTickTextAnchor(),
							v = this.getTickVerticalAnchor(),
							y = ee(this.props, !1),
							b = ee(f, !1),
							w = Me(Me({}, y), {}, { fill: 'none' }, ee(c, !1)),
							x = h.map(function (S, m) {
								var g = o.getTickLineCoord(S),
									O = g.line,
									_ = g.tick,
									A = Me(
										Me(
											Me(
												Me({ textAnchor: d, verticalAnchor: v }, y),
												{},
												{ stroke: 'none', fill: s },
												b,
											),
											_,
										),
										{},
										{
											index: m,
											payload: S,
											visibleTicksCount: h.length,
											tickFormatter: l,
										},
									);
								return $.createElement(
									ve,
									lr(
										{
											className: 'recharts-cartesian-axis-tick',
											key: 'tick-'
												.concat(S.value, '-')
												.concat(S.coordinate, '-')
												.concat(S.tickCoord),
										},
										Ai(o.props, S, m),
									),
									c &&
										$.createElement(
											'line',
											lr({}, w, O, {
												className: ne(
													'recharts-cartesian-axis-tick-line',
													Ke(c, 'className'),
												),
											}),
										),
									f &&
										t.renderTickItem(
											f,
											A,
											''.concat(J(l) ? l(S.value, m) : S.value).concat(p || ''),
										),
								);
							});
						return $.createElement(
							'g',
							{ className: 'recharts-cartesian-axis-ticks' },
							x,
						);
					},
				},
				{
					key: 'render',
					value: function () {
						var n = this,
							i = this.props,
							a = i.axisLine,
							o = i.width,
							u = i.height,
							c = i.ticksGenerator,
							s = i.className,
							f = i.hide;
						if (f) return null;
						var l = this.props,
							p = l.ticks,
							h = Lo(l, qR),
							d = p;
						return (
							J(c) && (d = p && p.length > 0 ? c(this.props) : c(h)),
							o <= 0 || u <= 0 || !d || !d.length
								? null
								: $.createElement(
										ve,
										{
											className: ne('recharts-cartesian-axis', s),
											ref: function (y) {
												n.layerReference = y;
											},
										},
										a && this.renderAxisLine(),
										this.renderTicks(
											d,
											this.state.fontSize,
											this.state.letterSpacing,
										),
										Ee.renderCallByParent(this.props),
								  )
						);
					},
				},
			],
			[
				{
					key: 'renderTickItem',
					value: function (n, i, a) {
						var o;
						return (
							$.isValidElement(n)
								? (o = $.cloneElement(n, i))
								: J(n)
								? (o = n(i))
								: (o = $.createElement(
										Ri,
										lr({}, i, {
											className: 'recharts-cartesian-axis-tick-value',
										}),
										a,
								  )),
							o
						);
					},
				},
			],
		)
	);
})(L.Component);
bs(Yr, 'displayName', 'CartesianAxis');
bs(Yr, 'defaultProps', {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	viewBox: { x: 0, y: 0, width: 0, height: 0 },
	orientation: 'bottom',
	ticks: [],
	stroke: '#666',
	tickLine: !0,
	axisLine: !0,
	tick: !0,
	mirror: !1,
	minTickGap: 5,
	tickSize: 6,
	tickMargin: 2,
	interval: 'preserveEnd',
});
var QR = ['x1', 'y1', 'x2', 'y2', 'key'],
	eF = ['offset'];
function Qt(e) {
	'@babel/helpers - typeof';
	return (
		(Qt =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Qt(e)
	);
}
function th(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function je(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? th(Object(r), !0).forEach(function (n) {
					tF(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: th(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function tF(e, t, r) {
	return (
		(t = rF(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function rF(e) {
	var t = nF(e, 'string');
	return Qt(t) == 'symbol' ? t : t + '';
}
function nF(e, t) {
	if (Qt(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Qt(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function Ht() {
	return (
		(Ht = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		Ht.apply(this, arguments)
	);
}
function rh(e, t) {
	if (e == null) return {};
	var r = iF(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function iF(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
var aF = function (t) {
	var r = t.fill;
	if (!r || r === 'none') return null;
	var n = t.fillOpacity,
		i = t.x,
		a = t.y,
		o = t.width,
		u = t.height,
		c = t.ry;
	return $.createElement('rect', {
		x: i,
		y: a,
		ry: c,
		width: o,
		height: u,
		stroke: 'none',
		fill: r,
		fillOpacity: n,
		className: 'recharts-cartesian-grid-bg',
	});
};
function $y(e, t) {
	var r;
	if ($.isValidElement(e)) r = $.cloneElement(e, t);
	else if (J(e)) r = e(t);
	else {
		var n = t.x1,
			i = t.y1,
			a = t.x2,
			o = t.y2,
			u = t.key,
			c = rh(t, QR),
			s = ee(c, !1);
		s.offset;
		var f = rh(s, eF);
		r = $.createElement(
			'line',
			Ht({}, f, { x1: n, y1: i, x2: a, y2: o, fill: 'none', key: u }),
		);
	}
	return r;
}
function oF(e) {
	var t = e.x,
		r = e.width,
		n = e.horizontal,
		i = n === void 0 ? !0 : n,
		a = e.horizontalPoints;
	if (!i || !a || !a.length) return null;
	var o = a.map(function (u, c) {
		var s = je(
			je({}, e),
			{},
			{ x1: t, y1: u, x2: t + r, y2: u, key: 'line-'.concat(c), index: c },
		);
		return $y(i, s);
	});
	return $.createElement(
		'g',
		{ className: 'recharts-cartesian-grid-horizontal' },
		o,
	);
}
function uF(e) {
	var t = e.y,
		r = e.height,
		n = e.vertical,
		i = n === void 0 ? !0 : n,
		a = e.verticalPoints;
	if (!i || !a || !a.length) return null;
	var o = a.map(function (u, c) {
		var s = je(
			je({}, e),
			{},
			{ x1: u, y1: t, x2: u, y2: t + r, key: 'line-'.concat(c), index: c },
		);
		return $y(i, s);
	});
	return $.createElement(
		'g',
		{ className: 'recharts-cartesian-grid-vertical' },
		o,
	);
}
function cF(e) {
	var t = e.horizontalFill,
		r = e.fillOpacity,
		n = e.x,
		i = e.y,
		a = e.width,
		o = e.height,
		u = e.horizontalPoints,
		c = e.horizontal,
		s = c === void 0 ? !0 : c;
	if (!s || !t || !t.length) return null;
	var f = u
		.map(function (p) {
			return Math.round(p + i - i);
		})
		.sort(function (p, h) {
			return p - h;
		});
	i !== f[0] && f.unshift(0);
	var l = f.map(function (p, h) {
		var d = !f[h + 1],
			v = d ? i + o - p : f[h + 1] - p;
		if (v <= 0) return null;
		var y = h % t.length;
		return $.createElement('rect', {
			key: 'react-'.concat(h),
			y: p,
			x: n,
			height: v,
			width: a,
			stroke: 'none',
			fill: t[y],
			fillOpacity: r,
			className: 'recharts-cartesian-grid-bg',
		});
	});
	return $.createElement(
		'g',
		{ className: 'recharts-cartesian-gridstripes-horizontal' },
		l,
	);
}
function sF(e) {
	var t = e.vertical,
		r = t === void 0 ? !0 : t,
		n = e.verticalFill,
		i = e.fillOpacity,
		a = e.x,
		o = e.y,
		u = e.width,
		c = e.height,
		s = e.verticalPoints;
	if (!r || !n || !n.length) return null;
	var f = s
		.map(function (p) {
			return Math.round(p + a - a);
		})
		.sort(function (p, h) {
			return p - h;
		});
	a !== f[0] && f.unshift(0);
	var l = f.map(function (p, h) {
		var d = !f[h + 1],
			v = d ? a + u - p : f[h + 1] - p;
		if (v <= 0) return null;
		var y = h % n.length;
		return $.createElement('rect', {
			key: 'react-'.concat(h),
			x: p,
			y: o,
			width: v,
			height: c,
			stroke: 'none',
			fill: n[y],
			fillOpacity: i,
			className: 'recharts-cartesian-grid-bg',
		});
	});
	return $.createElement(
		'g',
		{ className: 'recharts-cartesian-gridstripes-vertical' },
		l,
	);
}
var lF = function (t, r) {
		var n = t.xAxis,
			i = t.width,
			a = t.height,
			o = t.offset;
		return Rv(
			gs(
				je(
					je(je({}, Yr.defaultProps), n),
					{},
					{ ticks: dt(n, !0), viewBox: { x: 0, y: 0, width: i, height: a } },
				),
			),
			o.left,
			o.left + o.width,
			r,
		);
	},
	fF = function (t, r) {
		var n = t.yAxis,
			i = t.width,
			a = t.height,
			o = t.offset;
		return Rv(
			gs(
				je(
					je(je({}, Yr.defaultProps), n),
					{},
					{ ticks: dt(n, !0), viewBox: { x: 0, y: 0, width: i, height: a } },
				),
			),
			o.top,
			o.top + o.height,
			r,
		);
	},
	or = {
		horizontal: !0,
		vertical: !0,
		horizontalPoints: [],
		verticalPoints: [],
		stroke: '#ccc',
		fill: 'none',
		verticalFill: [],
		horizontalFill: [],
	};
function Ty(e) {
	var t,
		r,
		n,
		i,
		a,
		o,
		u = vs(),
		c = ys(),
		s = JB(),
		f = je(
			je({}, e),
			{},
			{
				stroke: (t = e.stroke) !== null && t !== void 0 ? t : or.stroke,
				fill: (r = e.fill) !== null && r !== void 0 ? r : or.fill,
				horizontal:
					(n = e.horizontal) !== null && n !== void 0 ? n : or.horizontal,
				horizontalFill:
					(i = e.horizontalFill) !== null && i !== void 0
						? i
						: or.horizontalFill,
				vertical: (a = e.vertical) !== null && a !== void 0 ? a : or.vertical,
				verticalFill:
					(o = e.verticalFill) !== null && o !== void 0 ? o : or.verticalFill,
				x: R(e.x) ? e.x : s.left,
				y: R(e.y) ? e.y : s.top,
				width: R(e.width) ? e.width : s.width,
				height: R(e.height) ? e.height : s.height,
			},
		),
		l = f.x,
		p = f.y,
		h = f.width,
		d = f.height,
		v = f.syncWithTicks,
		y = f.horizontalValues,
		b = f.verticalValues,
		w = XB(),
		x = YB();
	if (
		!R(h) ||
		h <= 0 ||
		!R(d) ||
		d <= 0 ||
		!R(l) ||
		l !== +l ||
		!R(p) ||
		p !== +p
	)
		return null;
	var S = f.verticalCoordinatesGenerator || lF,
		m = f.horizontalCoordinatesGenerator || fF,
		g = f.horizontalPoints,
		O = f.verticalPoints;
	if ((!g || !g.length) && J(m)) {
		var _ = y && y.length,
			A = m(
				{
					yAxis: x ? je(je({}, x), {}, { ticks: _ ? y : x.ticks }) : void 0,
					width: u,
					height: c,
					offset: s,
				},
				_ ? !0 : v,
			);
		vr(
			Array.isArray(A),
			'horizontalCoordinatesGenerator should return Array but instead it returned ['.concat(
				Qt(A),
				']',
			),
		),
			Array.isArray(A) && (g = A);
	}
	if ((!O || !O.length) && J(S)) {
		var E = b && b.length,
			P = S(
				{
					xAxis: w ? je(je({}, w), {}, { ticks: E ? b : w.ticks }) : void 0,
					width: u,
					height: c,
					offset: s,
				},
				E ? !0 : v,
			);
		vr(
			Array.isArray(P),
			'verticalCoordinatesGenerator should return Array but instead it returned ['.concat(
				Qt(P),
				']',
			),
		),
			Array.isArray(P) && (O = P);
	}
	return $.createElement(
		'g',
		{ className: 'recharts-cartesian-grid' },
		$.createElement(aF, {
			fill: f.fill,
			fillOpacity: f.fillOpacity,
			x: f.x,
			y: f.y,
			width: f.width,
			height: f.height,
			ry: f.ry,
		}),
		$.createElement(
			oF,
			Ht({}, f, { offset: s, horizontalPoints: g, xAxis: w, yAxis: x }),
		),
		$.createElement(
			uF,
			Ht({}, f, { offset: s, verticalPoints: O, xAxis: w, yAxis: x }),
		),
		$.createElement(cF, Ht({}, f, { horizontalPoints: g })),
		$.createElement(sF, Ht({}, f, { verticalPoints: O })),
	);
}
Ty.displayName = 'CartesianGrid';
var pF = ['type', 'layout', 'connectNulls', 'ref'],
	hF = ['key'];
function Ir(e) {
	'@babel/helpers - typeof';
	return (
		(Ir =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Ir(e)
	);
}
function nh(e, t) {
	if (e == null) return {};
	var r = dF(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function dF(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function dn() {
	return (
		(dn = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		dn.apply(this, arguments)
	);
}
function ih(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function Be(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? ih(Object(r), !0).forEach(function (n) {
					et(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: ih(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function ur(e) {
	return gF(e) || mF(e) || yF(e) || vF();
}
function vF() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function yF(e, t) {
	if (e) {
		if (typeof e == 'string') return nc(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return nc(e, t);
	}
}
function mF(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function gF(e) {
	if (Array.isArray(e)) return nc(e);
}
function nc(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function bF(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function ah(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, jy(n.key), n);
	}
}
function xF(e, t, r) {
	return (
		t && ah(e.prototype, t),
		r && ah(e, r),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function wF(e, t, r) {
	return (
		(t = ga(t)),
		OF(
			e,
			Ey() ? Reflect.construct(t, r || [], ga(e).constructor) : t.apply(e, r),
		)
	);
}
function OF(e, t) {
	if (t && (Ir(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return SF(e);
}
function SF(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Ey() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Ey = function () {
		return !!e;
	})();
}
function ga(e) {
	return (
		(ga = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ga(e)
	);
}
function _F(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && ic(e, t);
}
function ic(e, t) {
	return (
		(ic = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		ic(e, t)
	);
}
function et(e, t, r) {
	return (
		(t = jy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function jy(e) {
	var t = AF(e, 'string');
	return Ir(t) == 'symbol' ? t : t + '';
}
function AF(e, t) {
	if (Ir(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Ir(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var oi = (function (e) {
	function t() {
		var r;
		bF(this, t);
		for (var n = arguments.length, i = new Array(n), a = 0; a < n; a++)
			i[a] = arguments[a];
		return (
			(r = wF(this, t, [].concat(i))),
			et(r, 'state', { isAnimationFinished: !0, totalLength: 0 }),
			et(r, 'generateSimpleStrokeDasharray', function (o, u) {
				return ''.concat(u, 'px ').concat(o - u, 'px');
			}),
			et(r, 'getStrokeDasharray', function (o, u, c) {
				var s = c.reduce(function (b, w) {
					return b + w;
				});
				if (!s) return r.generateSimpleStrokeDasharray(u, o);
				for (
					var f = Math.floor(o / s), l = o % s, p = u - o, h = [], d = 0, v = 0;
					d < c.length;
					v += c[d], ++d
				)
					if (v + c[d] > l) {
						h = [].concat(ur(c.slice(0, d)), [l - v]);
						break;
					}
				var y = h.length % 2 === 0 ? [0, p] : [p];
				return []
					.concat(ur(t.repeat(c, f)), ur(h), y)
					.map(function (b) {
						return ''.concat(b, 'px');
					})
					.join(', ');
			}),
			et(r, 'id', Jn('recharts-line-')),
			et(r, 'pathRef', function (o) {
				r.mainCurve = o;
			}),
			et(r, 'handleAnimationEnd', function () {
				r.setState({ isAnimationFinished: !0 }),
					r.props.onAnimationEnd && r.props.onAnimationEnd();
			}),
			et(r, 'handleAnimationStart', function () {
				r.setState({ isAnimationFinished: !1 }),
					r.props.onAnimationStart && r.props.onAnimationStart();
			}),
			r
		);
	}
	return (
		_F(t, e),
		xF(
			t,
			[
				{
					key: 'componentDidMount',
					value: function () {
						if (this.props.isAnimationActive) {
							var n = this.getTotalLength();
							this.setState({ totalLength: n });
						}
					},
				},
				{
					key: 'componentDidUpdate',
					value: function () {
						if (this.props.isAnimationActive) {
							var n = this.getTotalLength();
							n !== this.state.totalLength && this.setState({ totalLength: n });
						}
					},
				},
				{
					key: 'getTotalLength',
					value: function () {
						var n = this.mainCurve;
						try {
							return (n && n.getTotalLength && n.getTotalLength()) || 0;
						} catch {
							return 0;
						}
					},
				},
				{
					key: 'renderErrorBar',
					value: function (n, i) {
						if (this.props.isAnimationActive && !this.state.isAnimationFinished)
							return null;
						var a = this.props,
							o = a.points,
							u = a.xAxis,
							c = a.yAxis,
							s = a.layout,
							f = a.children,
							l = Ve(f, ii);
						if (!l) return null;
						var p = function (v, y) {
								return {
									x: v.x,
									y: v.y,
									value: v.value,
									errorVal: Ue(v.payload, y),
								};
							},
							h = { clipPath: n ? 'url(#clipPath-'.concat(i, ')') : null };
						return $.createElement(
							ve,
							h,
							l.map(function (d) {
								return $.cloneElement(d, {
									key: 'bar-'.concat(d.props.dataKey),
									data: o,
									xAxis: u,
									yAxis: c,
									layout: s,
									dataPointFormatter: p,
								});
							}),
						);
					},
				},
				{
					key: 'renderDots',
					value: function (n, i, a) {
						var o = this.props.isAnimationActive;
						if (o && !this.state.isAnimationFinished) return null;
						var u = this.props,
							c = u.dot,
							s = u.points,
							f = u.dataKey,
							l = ee(this.props, !1),
							p = ee(c, !0),
							h = s.map(function (v, y) {
								var b = Be(
									Be(Be({ key: 'dot-'.concat(y), r: 3 }, l), p),
									{},
									{
										value: v.value,
										dataKey: f,
										cx: v.x,
										cy: v.y,
										index: y,
										payload: v.payload,
									},
								);
								return t.renderDotItem(c, b);
							}),
							d = {
								clipPath: n
									? 'url(#clipPath-'.concat(i ? '' : 'dots-').concat(a, ')')
									: null,
							};
						return $.createElement(
							ve,
							dn({ className: 'recharts-line-dots', key: 'dots' }, d),
							h,
						);
					},
				},
				{
					key: 'renderCurveStatically',
					value: function (n, i, a, o) {
						var u = this.props,
							c = u.type,
							s = u.layout,
							f = u.connectNulls;
						u.ref;
						var l = nh(u, pF),
							p = Be(
								Be(
									Be({}, ee(l, !0)),
									{},
									{
										fill: 'none',
										className: 'recharts-line-curve',
										clipPath: i ? 'url(#clipPath-'.concat(a, ')') : null,
										points: n,
									},
									o,
								),
								{},
								{ type: c, layout: s, connectNulls: f },
							);
						return $.createElement(ku, dn({}, p, { pathRef: this.pathRef }));
					},
				},
				{
					key: 'renderCurveWithAnimation',
					value: function (n, i) {
						var a = this,
							o = this.props,
							u = o.points,
							c = o.strokeDasharray,
							s = o.isAnimationActive,
							f = o.animationBegin,
							l = o.animationDuration,
							p = o.animationEasing,
							h = o.animationId,
							d = o.animateNewValues,
							v = o.width,
							y = o.height,
							b = this.state,
							w = b.prevPoints,
							x = b.totalLength;
						return $.createElement(
							xt,
							{
								begin: f,
								duration: l,
								isActive: s,
								easing: p,
								from: { t: 0 },
								to: { t: 1 },
								key: 'line-'.concat(h),
								onAnimationEnd: this.handleAnimationEnd,
								onAnimationStart: this.handleAnimationStart,
							},
							function (S) {
								var m = S.t;
								if (w) {
									var g = w.length / u.length,
										O = u.map(function (T, j) {
											var C = Math.floor(j * g);
											if (w[C]) {
												var I = w[C],
													k = tt(I.x, T.x),
													D = tt(I.y, T.y);
												return Be(Be({}, T), {}, { x: k(m), y: D(m) });
											}
											if (d) {
												var B = tt(v * 2, T.x),
													F = tt(y / 2, T.y);
												return Be(Be({}, T), {}, { x: B(m), y: F(m) });
											}
											return Be(Be({}, T), {}, { x: T.x, y: T.y });
										});
									return a.renderCurveStatically(O, n, i);
								}
								var _ = tt(0, x),
									A = _(m),
									E;
								if (c) {
									var P = ''
										.concat(c)
										.split(/[,\s]+/gim)
										.map(function (T) {
											return parseFloat(T);
										});
									E = a.getStrokeDasharray(A, x, P);
								} else E = a.generateSimpleStrokeDasharray(x, A);
								return a.renderCurveStatically(u, n, i, { strokeDasharray: E });
							},
						);
					},
				},
				{
					key: 'renderCurve',
					value: function (n, i) {
						var a = this.props,
							o = a.points,
							u = a.isAnimationActive,
							c = this.state,
							s = c.prevPoints,
							f = c.totalLength;
						return u && o && o.length && ((!s && f > 0) || !Ja(s, o))
							? this.renderCurveWithAnimation(n, i)
							: this.renderCurveStatically(o, n, i);
					},
				},
				{
					key: 'render',
					value: function () {
						var n,
							i = this.props,
							a = i.hide,
							o = i.dot,
							u = i.points,
							c = i.className,
							s = i.xAxis,
							f = i.yAxis,
							l = i.top,
							p = i.left,
							h = i.width,
							d = i.height,
							v = i.isAnimationActive,
							y = i.id;
						if (a || !u || !u.length) return null;
						var b = this.state.isAnimationFinished,
							w = u.length === 1,
							x = ne('recharts-line', c),
							S = s && s.allowDataOverflow,
							m = f && f.allowDataOverflow,
							g = S || m,
							O = Q(y) ? this.id : y,
							_ =
								(n = ee(o, !1)) !== null && n !== void 0
									? n
									: { r: 3, strokeWidth: 2 },
							A = _.r,
							E = A === void 0 ? 3 : A,
							P = _.strokeWidth,
							T = P === void 0 ? 2 : P,
							j = ux(o) ? o : {},
							C = j.clipDot,
							I = C === void 0 ? !0 : C,
							k = E * 2 + T;
						return $.createElement(
							ve,
							{ className: x },
							S || m
								? $.createElement(
										'defs',
										null,
										$.createElement(
											'clipPath',
											{ id: 'clipPath-'.concat(O) },
											$.createElement('rect', {
												x: S ? p : p - h / 2,
												y: m ? l : l - d / 2,
												width: S ? h : h * 2,
												height: m ? d : d * 2,
											}),
										),
										!I &&
											$.createElement(
												'clipPath',
												{ id: 'clipPath-dots-'.concat(O) },
												$.createElement('rect', {
													x: p - k / 2,
													y: l - k / 2,
													width: h + k,
													height: d + k,
												}),
											),
								  )
								: null,
							!w && this.renderCurve(g, O),
							this.renderErrorBar(g, O),
							(w || o) && this.renderDots(g, I, O),
							(!v || b) && Mt.renderCallByParent(this.props, u),
						);
					},
				},
			],
			[
				{
					key: 'getDerivedStateFromProps',
					value: function (n, i) {
						return n.animationId !== i.prevAnimationId
							? {
									prevAnimationId: n.animationId,
									curPoints: n.points,
									prevPoints: i.curPoints,
							  }
							: n.points !== i.curPoints
							? { curPoints: n.points }
							: null;
					},
				},
				{
					key: 'repeat',
					value: function (n, i) {
						for (
							var a = n.length % 2 !== 0 ? [].concat(ur(n), [0]) : n,
								o = [],
								u = 0;
							u < i;
							++u
						)
							o = [].concat(ur(o), ur(a));
						return o;
					},
				},
				{
					key: 'renderDotItem',
					value: function (n, i) {
						var a;
						if ($.isValidElement(n)) a = $.cloneElement(n, i);
						else if (J(n)) a = n(i);
						else {
							var o = i.key,
								u = nh(i, hF),
								c = ne(
									'recharts-line-dot',
									typeof n != 'boolean' ? n.className : '',
								);
							a = $.createElement(fs, dn({ key: o }, u, { className: c }));
						}
						return a;
					},
				},
			],
		)
	);
})(L.PureComponent);
et(oi, 'displayName', 'Line');
et(oi, 'defaultProps', {
	xAxisId: 0,
	yAxisId: 0,
	connectNulls: !1,
	activeDot: !0,
	dot: !0,
	legendType: 'line',
	stroke: '#3182bd',
	strokeWidth: 1,
	fill: '#fff',
	points: [],
	isAnimationActive: !vt.isSsr,
	animateNewValues: !0,
	animationBegin: 0,
	animationDuration: 1500,
	animationEasing: 'ease',
	hide: !1,
	label: !1,
});
et(oi, 'getComposedData', function (e) {
	var t = e.props,
		r = e.xAxis,
		n = e.yAxis,
		i = e.xAxisTicks,
		a = e.yAxisTicks,
		o = e.dataKey,
		u = e.bandSize,
		c = e.displayedData,
		s = e.offset,
		f = t.layout,
		l = c.map(function (p, h) {
			var d = Ue(p, o);
			return f === 'horizontal'
				? {
						x: Rf({ axis: r, ticks: i, bandSize: u, entry: p, index: h }),
						y: Q(d) ? null : n.scale(d),
						value: d,
						payload: p,
				  }
				: {
						x: Q(d) ? null : r.scale(d),
						y: Rf({ axis: n, ticks: a, bandSize: u, entry: p, index: h }),
						value: d,
						payload: p,
				  };
		});
	return Be({ points: l, layout: f }, s);
});
function Nr(e) {
	'@babel/helpers - typeof';
	return (
		(Nr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Nr(e)
	);
}
function PF(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function $F(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Iy(n.key), n);
	}
}
function TF(e, t, r) {
	return (
		t && $F(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function EF(e, t, r) {
	return (
		(t = ba(t)),
		jF(
			e,
			My() ? Reflect.construct(t, r || [], ba(e).constructor) : t.apply(e, r),
		)
	);
}
function jF(e, t) {
	if (t && (Nr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return MF(e);
}
function MF(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function My() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (My = function () {
		return !!e;
	})();
}
function ba(e) {
	return (
		(ba = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		ba(e)
	);
}
function CF(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && ac(e, t);
}
function ac(e, t) {
	return (
		(ac = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		ac(e, t)
	);
}
function Cy(e, t, r) {
	return (
		(t = Iy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Iy(e) {
	var t = IF(e, 'string');
	return Nr(t) == 'symbol' ? t : t + '';
}
function IF(e, t) {
	if (Nr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Nr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function oc() {
	return (
		(oc = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		oc.apply(this, arguments)
	);
}
function NF(e) {
	var t = e.xAxisId,
		r = vs(),
		n = ys(),
		i = yy(t);
	return i == null
		? null
		: $.createElement(
				Yr,
				oc({}, i, {
					className: ne(
						'recharts-'.concat(i.axisType, ' ').concat(i.axisType),
						i.className,
					),
					viewBox: { x: 0, y: 0, width: r, height: n },
					ticksGenerator: function (o) {
						return dt(o, !0);
					},
				}),
		  );
}
var co = (function (e) {
	function t() {
		return PF(this, t), EF(this, t, arguments);
	}
	return (
		CF(t, e),
		TF(t, [
			{
				key: 'render',
				value: function () {
					return $.createElement(NF, this.props);
				},
			},
		])
	);
})($.Component);
Cy(co, 'displayName', 'XAxis');
Cy(co, 'defaultProps', {
	allowDecimals: !0,
	hide: !1,
	orientation: 'bottom',
	width: 0,
	height: 30,
	mirror: !1,
	xAxisId: 0,
	tickCount: 5,
	type: 'category',
	padding: { left: 0, right: 0 },
	allowDataOverflow: !1,
	scale: 'auto',
	reversed: !1,
	allowDuplicatedCategory: !0,
});
function kr(e) {
	'@babel/helpers - typeof';
	return (
		(kr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		kr(e)
	);
}
function kF(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function DF(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Dy(n.key), n);
	}
}
function LF(e, t, r) {
	return (
		t && DF(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function BF(e, t, r) {
	return (
		(t = xa(t)),
		RF(
			e,
			Ny() ? Reflect.construct(t, r || [], xa(e).constructor) : t.apply(e, r),
		)
	);
}
function RF(e, t) {
	if (t && (kr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return FF(e);
}
function FF(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Ny() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Ny = function () {
		return !!e;
	})();
}
function xa(e) {
	return (
		(xa = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		xa(e)
	);
}
function zF(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && uc(e, t);
}
function uc(e, t) {
	return (
		(uc = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		uc(e, t)
	);
}
function ky(e, t, r) {
	return (
		(t = Dy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Dy(e) {
	var t = UF(e, 'string');
	return kr(t) == 'symbol' ? t : t + '';
}
function UF(e, t) {
	if (kr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (kr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function cc() {
	return (
		(cc = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		cc.apply(this, arguments)
	);
}
var WF = function (t) {
		var r = t.yAxisId,
			n = vs(),
			i = ys(),
			a = my(r);
		return a == null
			? null
			: $.createElement(
					Yr,
					cc({}, a, {
						className: ne(
							'recharts-'.concat(a.axisType, ' ').concat(a.axisType),
							a.className,
						),
						viewBox: { x: 0, y: 0, width: n, height: i },
						ticksGenerator: function (u) {
							return dt(u, !0);
						},
					}),
			  );
	},
	so = (function (e) {
		function t() {
			return kF(this, t), BF(this, t, arguments);
		}
		return (
			zF(t, e),
			LF(t, [
				{
					key: 'render',
					value: function () {
						return $.createElement(WF, this.props);
					},
				},
			])
		);
	})($.Component);
ky(so, 'displayName', 'YAxis');
ky(so, 'defaultProps', {
	allowDuplicatedCategory: !0,
	allowDecimals: !0,
	hide: !1,
	orientation: 'left',
	width: 60,
	height: 0,
	mirror: !1,
	yAxisId: 0,
	tickCount: 5,
	type: 'number',
	padding: { top: 0, bottom: 0 },
	allowDataOverflow: !1,
	scale: 'auto',
	reversed: !1,
});
function oh(e) {
	return KF(e) || HF(e) || GF(e) || qF();
}
function qF() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function GF(e, t) {
	if (e) {
		if (typeof e == 'string') return sc(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return sc(e, t);
	}
}
function HF(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function KF(e) {
	if (Array.isArray(e)) return sc(e);
}
function sc(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
var lc = function (t, r, n, i, a) {
		var o = Ve(t, $t),
			u = Ve(t, ao),
			c = [].concat(oh(o), oh(u)),
			s = Ve(t, uo),
			f = ''.concat(i, 'Id'),
			l = i[0],
			p = r;
		if (
			(c.length &&
				(p = c.reduce(function (v, y) {
					if (
						y.props[f] === n &&
						ct(y.props, 'extendDomain') &&
						R(y.props[l])
					) {
						var b = y.props[l];
						return [Math.min(v[0], b), Math.max(v[1], b)];
					}
					return v;
				}, p)),
			s.length)
		) {
			var h = ''.concat(l, '1'),
				d = ''.concat(l, '2');
			p = s.reduce(function (v, y) {
				if (
					y.props[f] === n &&
					ct(y.props, 'extendDomain') &&
					R(y.props[h]) &&
					R(y.props[d])
				) {
					var b = y.props[h],
						w = y.props[d];
					return [Math.min(v[0], b, w), Math.max(v[1], b, w)];
				}
				return v;
			}, p);
		}
		return (
			a &&
				a.length &&
				(p = a.reduce(function (v, y) {
					return R(y) ? [Math.min(v[0], y), Math.max(v[1], y)] : v;
				}, p)),
			p
		);
	},
	Ly = { exports: {} };
(function (e) {
	var t = Object.prototype.hasOwnProperty,
		r = '~';
	function n() {}
	Object.create &&
		((n.prototype = Object.create(null)), new n().__proto__ || (r = !1));
	function i(c, s, f) {
		(this.fn = c), (this.context = s), (this.once = f || !1);
	}
	function a(c, s, f, l, p) {
		if (typeof f != 'function')
			throw new TypeError('The listener must be a function');
		var h = new i(f, l || c, p),
			d = r ? r + s : s;
		return (
			c._events[d]
				? c._events[d].fn
					? (c._events[d] = [c._events[d], h])
					: c._events[d].push(h)
				: ((c._events[d] = h), c._eventsCount++),
			c
		);
	}
	function o(c, s) {
		--c._eventsCount === 0 ? (c._events = new n()) : delete c._events[s];
	}
	function u() {
		(this._events = new n()), (this._eventsCount = 0);
	}
	(u.prototype.eventNames = function () {
		var s = [],
			f,
			l;
		if (this._eventsCount === 0) return s;
		for (l in (f = this._events)) t.call(f, l) && s.push(r ? l.slice(1) : l);
		return Object.getOwnPropertySymbols
			? s.concat(Object.getOwnPropertySymbols(f))
			: s;
	}),
		(u.prototype.listeners = function (s) {
			var f = r ? r + s : s,
				l = this._events[f];
			if (!l) return [];
			if (l.fn) return [l.fn];
			for (var p = 0, h = l.length, d = new Array(h); p < h; p++)
				d[p] = l[p].fn;
			return d;
		}),
		(u.prototype.listenerCount = function (s) {
			var f = r ? r + s : s,
				l = this._events[f];
			return l ? (l.fn ? 1 : l.length) : 0;
		}),
		(u.prototype.emit = function (s, f, l, p, h, d) {
			var v = r ? r + s : s;
			if (!this._events[v]) return !1;
			var y = this._events[v],
				b = arguments.length,
				w,
				x;
			if (y.fn) {
				switch ((y.once && this.removeListener(s, y.fn, void 0, !0), b)) {
					case 1:
						return y.fn.call(y.context), !0;
					case 2:
						return y.fn.call(y.context, f), !0;
					case 3:
						return y.fn.call(y.context, f, l), !0;
					case 4:
						return y.fn.call(y.context, f, l, p), !0;
					case 5:
						return y.fn.call(y.context, f, l, p, h), !0;
					case 6:
						return y.fn.call(y.context, f, l, p, h, d), !0;
				}
				for (x = 1, w = new Array(b - 1); x < b; x++) w[x - 1] = arguments[x];
				y.fn.apply(y.context, w);
			} else {
				var S = y.length,
					m;
				for (x = 0; x < S; x++)
					switch (
						(y[x].once && this.removeListener(s, y[x].fn, void 0, !0), b)
					) {
						case 1:
							y[x].fn.call(y[x].context);
							break;
						case 2:
							y[x].fn.call(y[x].context, f);
							break;
						case 3:
							y[x].fn.call(y[x].context, f, l);
							break;
						case 4:
							y[x].fn.call(y[x].context, f, l, p);
							break;
						default:
							if (!w)
								for (m = 1, w = new Array(b - 1); m < b; m++)
									w[m - 1] = arguments[m];
							y[x].fn.apply(y[x].context, w);
					}
			}
			return !0;
		}),
		(u.prototype.on = function (s, f, l) {
			return a(this, s, f, l, !1);
		}),
		(u.prototype.once = function (s, f, l) {
			return a(this, s, f, l, !0);
		}),
		(u.prototype.removeListener = function (s, f, l, p) {
			var h = r ? r + s : s;
			if (!this._events[h]) return this;
			if (!f) return o(this, h), this;
			var d = this._events[h];
			if (d.fn)
				d.fn === f && (!p || d.once) && (!l || d.context === l) && o(this, h);
			else {
				for (var v = 0, y = [], b = d.length; v < b; v++)
					(d[v].fn !== f || (p && !d[v].once) || (l && d[v].context !== l)) &&
						y.push(d[v]);
				y.length ? (this._events[h] = y.length === 1 ? y[0] : y) : o(this, h);
			}
			return this;
		}),
		(u.prototype.removeAllListeners = function (s) {
			var f;
			return (
				s
					? ((f = r ? r + s : s), this._events[f] && o(this, f))
					: ((this._events = new n()), (this._eventsCount = 0)),
				this
			);
		}),
		(u.prototype.off = u.prototype.removeListener),
		(u.prototype.addListener = u.prototype.on),
		(u.prefixed = r),
		(u.EventEmitter = u),
		(e.exports = u);
})(Ly);
var VF = Ly.exports;
const XF = fe(VF);
var Bo = new XF(),
	Ro = 'recharts.syncMouseEvents';
function Kn(e) {
	'@babel/helpers - typeof';
	return (
		(Kn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Kn(e)
	);
}
function YF(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function ZF(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, By(n.key), n);
	}
}
function JF(e, t, r) {
	return (
		t && ZF(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function Fo(e, t, r) {
	return (
		(t = By(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function By(e) {
	var t = QF(e, 'string');
	return Kn(t) == 'symbol' ? t : t + '';
}
function QF(e, t) {
	if (Kn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t);
		if (Kn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return String(e);
}
var e3 = (function () {
	function e() {
		YF(this, e),
			Fo(this, 'activeIndex', 0),
			Fo(this, 'coordinateList', []),
			Fo(this, 'layout', 'horizontal');
	}
	return JF(e, [
		{
			key: 'setDetails',
			value: function (r) {
				var n,
					i = r.coordinateList,
					a = i === void 0 ? null : i,
					o = r.container,
					u = o === void 0 ? null : o,
					c = r.layout,
					s = c === void 0 ? null : c,
					f = r.offset,
					l = f === void 0 ? null : f,
					p = r.mouseHandlerCallback,
					h = p === void 0 ? null : p;
				(this.coordinateList =
					(n = a ?? this.coordinateList) !== null && n !== void 0 ? n : []),
					(this.container = u ?? this.container),
					(this.layout = s ?? this.layout),
					(this.offset = l ?? this.offset),
					(this.mouseHandlerCallback = h ?? this.mouseHandlerCallback),
					(this.activeIndex = Math.min(
						Math.max(this.activeIndex, 0),
						this.coordinateList.length - 1,
					));
			},
		},
		{
			key: 'focus',
			value: function () {
				this.spoofMouse();
			},
		},
		{
			key: 'keyboardEvent',
			value: function (r) {
				if (this.coordinateList.length !== 0)
					switch (r.key) {
						case 'ArrowRight': {
							if (this.layout !== 'horizontal') return;
							(this.activeIndex = Math.min(
								this.activeIndex + 1,
								this.coordinateList.length - 1,
							)),
								this.spoofMouse();
							break;
						}
						case 'ArrowLeft': {
							if (this.layout !== 'horizontal') return;
							(this.activeIndex = Math.max(this.activeIndex - 1, 0)),
								this.spoofMouse();
							break;
						}
					}
			},
		},
		{
			key: 'setIndex',
			value: function (r) {
				this.activeIndex = r;
			},
		},
		{
			key: 'spoofMouse',
			value: function () {
				var r, n;
				if (this.layout === 'horizontal' && this.coordinateList.length !== 0) {
					var i = this.container.getBoundingClientRect(),
						a = i.x,
						o = i.y,
						u = i.height,
						c = this.coordinateList[this.activeIndex].coordinate,
						s =
							((r = window) === null || r === void 0 ? void 0 : r.scrollX) || 0,
						f =
							((n = window) === null || n === void 0 ? void 0 : n.scrollY) || 0,
						l = a + c + s,
						p = o + this.offset.top + u / 2 + f;
					this.mouseHandlerCallback({ pageX: l, pageY: p });
				}
			},
		},
	]);
})();
function t3(e, t, r) {
	if (r === 'number' && t === !0 && Array.isArray(e)) {
		var n = e == null ? void 0 : e[0],
			i = e == null ? void 0 : e[1];
		if (n && i && R(n) && R(i)) return !0;
	}
	return !1;
}
function r3(e, t, r, n) {
	var i = n / 2;
	return {
		stroke: 'none',
		fill: '#ccc',
		x: e === 'horizontal' ? t.x - i : r.left + 0.5,
		y: e === 'horizontal' ? r.top + 0.5 : t.y - i,
		width: e === 'horizontal' ? n : r.width - 1,
		height: e === 'horizontal' ? r.height - 1 : n,
	};
}
function Ry(e) {
	var t = e.cx,
		r = e.cy,
		n = e.radius,
		i = e.startAngle,
		a = e.endAngle,
		o = $e(t, r, n, i),
		u = $e(t, r, n, a);
	return {
		points: [o, u],
		cx: t,
		cy: r,
		radius: n,
		startAngle: i,
		endAngle: a,
	};
}
function n3(e, t, r) {
	var n, i, a, o;
	if (e === 'horizontal')
		(n = t.x), (a = n), (i = r.top), (o = r.top + r.height);
	else if (e === 'vertical')
		(i = t.y), (o = i), (n = r.left), (a = r.left + r.width);
	else if (t.cx != null && t.cy != null)
		if (e === 'centric') {
			var u = t.cx,
				c = t.cy,
				s = t.innerRadius,
				f = t.outerRadius,
				l = t.angle,
				p = $e(u, c, s, l),
				h = $e(u, c, f, l);
			(n = p.x), (i = p.y), (a = h.x), (o = h.y);
		} else return Ry(t);
	return [
		{ x: n, y: i },
		{ x: a, y: o },
	];
}
function Vn(e) {
	'@babel/helpers - typeof';
	return (
		(Vn =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Vn(e)
	);
}
function uh(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function xi(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? uh(Object(r), !0).forEach(function (n) {
					i3(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: uh(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function i3(e, t, r) {
	return (
		(t = a3(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function a3(e) {
	var t = o3(e, 'string');
	return Vn(t) == 'symbol' ? t : t + '';
}
function o3(e, t) {
	if (Vn(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Vn(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
function u3(e) {
	var t,
		r,
		n = e.element,
		i = e.tooltipEventType,
		a = e.isActive,
		o = e.activeCoordinate,
		u = e.activePayload,
		c = e.offset,
		s = e.activeTooltipIndex,
		f = e.tooltipAxisBandSize,
		l = e.layout,
		p = e.chartName,
		h =
			(t = n.props.cursor) !== null && t !== void 0
				? t
				: (r = n.type.defaultProps) === null || r === void 0
				? void 0
				: r.cursor;
	if (!n || !h || !a || !o || (p !== 'ScatterChart' && i !== 'axis'))
		return null;
	var d,
		v = ku;
	if (p === 'ScatterChart') (d = o), (v = oD);
	else if (p === 'BarChart') (d = r3(l, o, c, f)), (v = ls);
	else if (l === 'radial') {
		var y = Ry(o),
			b = y.cx,
			w = y.cy,
			x = y.radius,
			S = y.startAngle,
			m = y.endAngle;
		(d = {
			cx: b,
			cy: w,
			startAngle: S,
			endAngle: m,
			innerRadius: x,
			outerRadius: x,
		}),
			(v = qv);
	} else (d = { points: n3(l, o, c) }), (v = ku);
	var g = xi(
		xi(xi(xi({ stroke: '#ccc', pointerEvents: 'none' }, c), d), ee(h, !1)),
		{},
		{
			payload: u,
			payloadIndex: s,
			className: ne('recharts-tooltip-cursor', h.className),
		},
	);
	return L.isValidElement(h) ? L.cloneElement(h, g) : L.createElement(v, g);
}
var c3 = ['item'],
	s3 = [
		'children',
		'className',
		'width',
		'height',
		'style',
		'compact',
		'title',
		'desc',
	];
function Dr(e) {
	'@babel/helpers - typeof';
	return (
		(Dr =
			typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
				? function (t) {
						return typeof t;
				  }
				: function (t) {
						return t &&
							typeof Symbol == 'function' &&
							t.constructor === Symbol &&
							t !== Symbol.prototype
							? 'symbol'
							: typeof t;
				  }),
		Dr(e)
	);
}
function fr() {
	return (
		(fr = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var r = arguments[t];
						for (var n in r)
							Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
					}
					return e;
			  }),
		fr.apply(this, arguments)
	);
}
function ch(e, t) {
	return p3(e) || f3(e, t) || zy(e, t) || l3();
}
function l3() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function f3(e, t) {
	var r =
		e == null
			? null
			: (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator'];
	if (r != null) {
		var n,
			i,
			a,
			o,
			u = [],
			c = !0,
			s = !1;
		try {
			if (((a = (r = r.call(e)).next), t !== 0))
				for (
					;
					!(c = (n = a.call(r)).done) && (u.push(n.value), u.length !== t);
					c = !0
				);
		} catch (f) {
			(s = !0), (i = f);
		} finally {
			try {
				if (!c && r.return != null && ((o = r.return()), Object(o) !== o))
					return;
			} finally {
				if (s) throw i;
			}
		}
		return u;
	}
}
function p3(e) {
	if (Array.isArray(e)) return e;
}
function sh(e, t) {
	if (e == null) return {};
	var r = h3(e, t),
		n,
		i;
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (i = 0; i < a.length; i++)
			(n = a[i]),
				!(t.indexOf(n) >= 0) &&
					Object.prototype.propertyIsEnumerable.call(e, n) &&
					(r[n] = e[n]);
	}
	return r;
}
function h3(e, t) {
	if (e == null) return {};
	var r = {};
	for (var n in e)
		if (Object.prototype.hasOwnProperty.call(e, n)) {
			if (t.indexOf(n) >= 0) continue;
			r[n] = e[n];
		}
	return r;
}
function d3(e, t) {
	if (!(e instanceof t))
		throw new TypeError('Cannot call a class as a function');
}
function v3(e, t) {
	for (var r = 0; r < t.length; r++) {
		var n = t[r];
		(n.enumerable = n.enumerable || !1),
			(n.configurable = !0),
			'value' in n && (n.writable = !0),
			Object.defineProperty(e, Uy(n.key), n);
	}
}
function y3(e, t, r) {
	return (
		t && v3(e.prototype, t),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		e
	);
}
function m3(e, t, r) {
	return (
		(t = wa(t)),
		g3(
			e,
			Fy() ? Reflect.construct(t, r || [], wa(e).constructor) : t.apply(e, r),
		)
	);
}
function g3(e, t) {
	if (t && (Dr(t) === 'object' || typeof t == 'function')) return t;
	if (t !== void 0)
		throw new TypeError(
			'Derived constructors may only return object or undefined',
		);
	return b3(e);
}
function b3(e) {
	if (e === void 0)
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called",
		);
	return e;
}
function Fy() {
	try {
		var e = !Boolean.prototype.valueOf.call(
			Reflect.construct(Boolean, [], function () {}),
		);
	} catch { /* Ignore errors */ }
	return (Fy = function () {
		return !!e;
	})();
}
function wa(e) {
	return (
		(wa = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (r) {
					return r.__proto__ || Object.getPrototypeOf(r);
			  }),
		wa(e)
	);
}
function x3(e, t) {
	if (typeof t != 'function' && t !== null)
		throw new TypeError('Super expression must either be null or a function');
	(e.prototype = Object.create(t && t.prototype, {
		constructor: { value: e, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(e, 'prototype', { writable: !1 }),
		t && fc(e, t);
}
function fc(e, t) {
	return (
		(fc = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (n, i) {
					return (n.__proto__ = i), n;
			  }),
		fc(e, t)
	);
}
function Lr(e) {
	return S3(e) || O3(e) || zy(e) || w3();
}
function w3() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function zy(e, t) {
	if (e) {
		if (typeof e == 'string') return pc(e, t);
		var r = Object.prototype.toString.call(e).slice(8, -1);
		if (
			(r === 'Object' && e.constructor && (r = e.constructor.name),
			r === 'Map' || r === 'Set')
		)
			return Array.from(e);
		if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
			return pc(e, t);
	}
}
function O3(e) {
	if (
		(typeof Symbol < 'u' && e[Symbol.iterator] != null) ||
		e['@@iterator'] != null
	)
		return Array.from(e);
}
function S3(e) {
	if (Array.isArray(e)) return pc(e);
}
function pc(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
	return n;
}
function lh(e, t) {
	var r = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		t &&
			(n = n.filter(function (i) {
				return Object.getOwnPropertyDescriptor(e, i).enumerable;
			})),
			r.push.apply(r, n);
	}
	return r;
}
function M(e) {
	for (var t = 1; t < arguments.length; t++) {
		var r = arguments[t] != null ? arguments[t] : {};
		t % 2
			? lh(Object(r), !0).forEach(function (n) {
					K(e, n, r[n]);
			  })
			: Object.getOwnPropertyDescriptors
			? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
			: lh(Object(r)).forEach(function (n) {
					Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
			  });
	}
	return e;
}
function K(e, t, r) {
	return (
		(t = Uy(t)),
		t in e
			? Object.defineProperty(e, t, {
					value: r,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (e[t] = r),
		e
	);
}
function Uy(e) {
	var t = _3(e, 'string');
	return Dr(t) == 'symbol' ? t : t + '';
}
function _3(e, t) {
	if (Dr(e) != 'object' || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var n = r.call(e, t || 'default');
		if (Dr(n) != 'object') return n;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return (t === 'string' ? String : Number)(e);
}
var A3 = { xAxis: ['bottom', 'top'], yAxis: ['left', 'right'] },
	P3 = { width: '100%', height: '100%' },
	Wy = { x: 0, y: 0 };
function wi(e) {
	return e;
}
var $3 = function (t, r) {
		return r === 'horizontal'
			? t.x
			: r === 'vertical'
			? t.y
			: r === 'centric'
			? t.angle
			: t.radius;
	},
	T3 = function (t, r, n, i) {
		var a = r.find(function (f) {
			return f && f.index === n;
		});
		if (a) {
			if (t === 'horizontal') return { x: a.coordinate, y: i.y };
			if (t === 'vertical') return { x: i.x, y: a.coordinate };
			if (t === 'centric') {
				var o = a.coordinate,
					u = i.radius;
				return M(
					M(M({}, i), $e(i.cx, i.cy, u, o)),
					{},
					{ angle: o, radius: u },
				);
			}
			var c = a.coordinate,
				s = i.angle;
			return M(M(M({}, i), $e(i.cx, i.cy, c, s)), {}, { angle: s, radius: c });
		}
		return Wy;
	},
	lo = function (t, r) {
		var n = r.graphicalItems,
			i = r.dataStartIndex,
			a = r.dataEndIndex,
			o = (n ?? []).reduce(function (u, c) {
				var s = c.props.data;
				return s && s.length ? [].concat(Lr(u), Lr(s)) : u;
			}, []);
		return o.length > 0
			? o
			: t && t.length && R(i) && R(a)
			? t.slice(i, a + 1)
			: [];
	};
function qy(e) {
	return e === 'number' ? [0, 'auto'] : void 0;
}
var hc = function (t, r, n, i) {
		var a = t.graphicalItems,
			o = t.tooltipAxis,
			u = lo(r, t);
		return n < 0 || !a || !a.length || n >= u.length
			? null
			: a.reduce(function (c, s) {
					var f,
						l = (f = s.props.data) !== null && f !== void 0 ? f : r;
					l &&
						t.dataStartIndex + t.dataEndIndex !== 0 &&
						t.dataEndIndex - t.dataStartIndex >= n &&
						(l = l.slice(t.dataStartIndex, t.dataEndIndex + 1));
					var p;
					if (o.dataKey && !o.allowDuplicatedCategory) {
						var h = l === void 0 ? u : l;
						p = Si(h, o.dataKey, i);
					} else p = (l && l[n]) || u[n];
					return p ? [].concat(Lr(c), [zv(s, p)]) : c;
			  }, []);
	},
	fh = function (t, r, n, i) {
		var a = i || { x: t.chartX, y: t.chartY },
			o = $3(a, n),
			u = t.orderedTooltipTicks,
			c = t.tooltipAxis,
			s = t.tooltipTicks,
			f = n2(o, u, s, c);
		if (f >= 0 && s) {
			var l = s[f] && s[f].value,
				p = hc(t, r, f, l),
				h = T3(n, u, f, a);
			return {
				activeTooltipIndex: f,
				activeLabel: l,
				activePayload: p,
				activeCoordinate: h,
			};
		}
		return null;
	},
	E3 = function (t, r) {
		var n = r.axes,
			i = r.graphicalItems,
			a = r.axisType,
			o = r.axisIdKey,
			u = r.stackGroups,
			c = r.dataStartIndex,
			s = r.dataEndIndex,
			f = t.layout,
			l = t.children,
			p = t.stackOffset,
			h = Bv(f, a);
		return n.reduce(function (d, v) {
			var y,
				b =
					v.type.defaultProps !== void 0
						? M(M({}, v.type.defaultProps), v.props)
						: v.props,
				w = b.type,
				x = b.dataKey,
				S = b.allowDataOverflow,
				m = b.allowDuplicatedCategory,
				g = b.scale,
				O = b.ticks,
				_ = b.includeHidden,
				A = b[o];
			if (d[A]) return d;
			var E = lo(t.data, {
					graphicalItems: i.filter(function (G) {
						var X,
							ce =
								o in G.props
									? G.props[o]
									: (X = G.type.defaultProps) === null || X === void 0
									? void 0
									: X[o];
						return ce === A;
					}),
					dataStartIndex: c,
					dataEndIndex: s,
				}),
				P = E.length,
				T,
				j,
				C;
			t3(b.domain, S, w) &&
				((T = ju(b.domain, null, S)),
				h && (w === 'number' || g !== 'auto') && (C = pn(E, x, 'category')));
			var I = qy(w);
			if (!T || T.length === 0) {
				var k,
					D = (k = b.domain) !== null && k !== void 0 ? k : I;
				if (x) {
					if (((T = pn(E, x, w)), w === 'category' && h)) {
						var B = J0(T);
						m && B
							? ((j = T), (T = ca(0, P)))
							: m ||
							  (T = Wf(D, T, v).reduce(function (G, X) {
									return G.indexOf(X) >= 0 ? G : [].concat(Lr(G), [X]);
							  }, []));
					} else if (w === 'category')
						m
							? (T = T.filter(function (G) {
									return G !== '' && !Q(G);
							  }))
							: (T = Wf(D, T, v).reduce(function (G, X) {
									return G.indexOf(X) >= 0 || X === '' || Q(X)
										? G
										: [].concat(Lr(G), [X]);
							  }, []));
					else if (w === 'number') {
						var F = c2(
							E,
							i.filter(function (G) {
								var X,
									ce,
									ye =
										o in G.props
											? G.props[o]
											: (X = G.type.defaultProps) === null || X === void 0
											? void 0
											: X[o],
									Le =
										'hide' in G.props
											? G.props.hide
											: (ce = G.type.defaultProps) === null || ce === void 0
											? void 0
											: ce.hide;
								return ye === A && (_ || !Le);
							}),
							x,
							a,
							f,
						);
						F && (T = F);
					}
					h && (w === 'number' || g !== 'auto') && (C = pn(E, x, 'category'));
				} else
					h
						? (T = ca(0, P))
						: u && u[A] && u[A].hasStack && w === 'number'
						? (T = p === 'expand' ? [0, 1] : Fv(u[A].stackGroups, c, s))
						: (T = Lv(
								E,
								i.filter(function (G) {
									var X = o in G.props ? G.props[o] : G.type.defaultProps[o],
										ce =
											'hide' in G.props
												? G.props.hide
												: G.type.defaultProps.hide;
									return X === A && (_ || !ce);
								}),
								w,
								f,
								!0,
						  ));
				if (w === 'number') (T = lc(l, T, A, a, O)), D && (T = ju(D, T, S));
				else if (w === 'category' && D) {
					var H = D,
						V = T.every(function (G) {
							return H.indexOf(G) >= 0;
						});
					V && (T = H);
				}
			}
			return M(
				M({}, d),
				{},
				K(
					{},
					A,
					M(
						M({}, b),
						{},
						{
							axisType: a,
							domain: T,
							categoricalDomain: C,
							duplicateDomain: j,
							originalDomain: (y = b.domain) !== null && y !== void 0 ? y : I,
							isCategorical: h,
							layout: f,
						},
					),
				),
			);
		}, {});
	},
	j3 = function (t, r) {
		var n = r.graphicalItems,
			i = r.Axis,
			a = r.axisType,
			o = r.axisIdKey,
			u = r.stackGroups,
			c = r.dataStartIndex,
			s = r.dataEndIndex,
			f = t.layout,
			l = t.children,
			p = lo(t.data, { graphicalItems: n, dataStartIndex: c, dataEndIndex: s }),
			h = p.length,
			d = Bv(f, a),
			v = -1;
		return n.reduce(function (y, b) {
			var w =
					b.type.defaultProps !== void 0
						? M(M({}, b.type.defaultProps), b.props)
						: b.props,
				x = w[o],
				S = qy('number');
			if (!y[x]) {
				v++;
				var m;
				return (
					d
						? (m = ca(0, h))
						: u && u[x] && u[x].hasStack
						? ((m = Fv(u[x].stackGroups, c, s)), (m = lc(l, m, x, a)))
						: ((m = ju(
								S,
								Lv(
									p,
									n.filter(function (g) {
										var O,
											_,
											A =
												o in g.props
													? g.props[o]
													: (O = g.type.defaultProps) === null || O === void 0
													? void 0
													: O[o],
											E =
												'hide' in g.props
													? g.props.hide
													: (_ = g.type.defaultProps) === null || _ === void 0
													? void 0
													: _.hide;
										return A === x && !E;
									}),
									'number',
									f,
								),
								i.defaultProps.allowDataOverflow,
						  )),
						  (m = lc(l, m, x, a))),
					M(
						M({}, y),
						{},
						K(
							{},
							x,
							M(
								M({ axisType: a }, i.defaultProps),
								{},
								{
									hide: !0,
									orientation: Ke(A3, ''.concat(a, '.').concat(v % 2), null),
									domain: m,
									originalDomain: S,
									isCategorical: d,
									layout: f,
								},
							),
						),
					)
				);
			}
			return y;
		}, {});
	},
	M3 = function (t, r) {
		var n = r.axisType,
			i = n === void 0 ? 'xAxis' : n,
			a = r.AxisComp,
			o = r.graphicalItems,
			u = r.stackGroups,
			c = r.dataStartIndex,
			s = r.dataEndIndex,
			f = t.children,
			l = ''.concat(i, 'Id'),
			p = Ve(f, a),
			h = {};
		return (
			p && p.length
				? (h = E3(t, {
						axes: p,
						graphicalItems: o,
						axisType: i,
						axisIdKey: l,
						stackGroups: u,
						dataStartIndex: c,
						dataEndIndex: s,
				  }))
				: o &&
				  o.length &&
				  (h = j3(t, {
						Axis: a,
						graphicalItems: o,
						axisType: i,
						axisIdKey: l,
						stackGroups: u,
						dataStartIndex: c,
						dataEndIndex: s,
				  })),
			h
		);
	},
	C3 = function (t) {
		var r = Pt(t),
			n = dt(r, !1, !0);
		return {
			tooltipTicks: n,
			orderedTooltipTicks: Lc(n, function (i) {
				return i.coordinate;
			}),
			tooltipAxis: r,
			tooltipAxisBandSize: Qi(r, n),
		};
	},
	ph = function (t) {
		var r = t.children,
			n = t.defaultShowTooltip,
			i = Fe(r, $r),
			a = 0,
			o = 0;
		return (
			t.data && t.data.length !== 0 && (o = t.data.length - 1),
			i &&
				i.props &&
				(i.props.startIndex >= 0 && (a = i.props.startIndex),
				i.props.endIndex >= 0 && (o = i.props.endIndex)),
			{
				chartX: 0,
				chartY: 0,
				dataStartIndex: a,
				dataEndIndex: o,
				activeTooltipIndex: -1,
				isTooltipActive: !!n,
			}
		);
	},
	I3 = function (t) {
		return !t || !t.length
			? !1
			: t.some(function (r) {
					var n = Et(r && r.type);
					return n && n.indexOf('Bar') >= 0;
			  });
	},
	hh = function (t) {
		return t === 'horizontal'
			? { numericAxisName: 'yAxis', cateAxisName: 'xAxis' }
			: t === 'vertical'
			? { numericAxisName: 'xAxis', cateAxisName: 'yAxis' }
			: t === 'centric'
			? { numericAxisName: 'radiusAxis', cateAxisName: 'angleAxis' }
			: { numericAxisName: 'angleAxis', cateAxisName: 'radiusAxis' };
	},
	N3 = function (t, r) {
		var n = t.props,
			i = t.graphicalItems,
			a = t.xAxisMap,
			o = a === void 0 ? {} : a,
			u = t.yAxisMap,
			c = u === void 0 ? {} : u,
			s = n.width,
			f = n.height,
			l = n.children,
			p = n.margin || {},
			h = Fe(l, $r),
			d = Fe(l, Kt),
			v = Object.keys(c).reduce(
				function (m, g) {
					var O = c[g],
						_ = O.orientation;
					return !O.mirror && !O.hide
						? M(M({}, m), {}, K({}, _, m[_] + O.width))
						: m;
				},
				{ left: p.left || 0, right: p.right || 0 },
			),
			y = Object.keys(o).reduce(
				function (m, g) {
					var O = o[g],
						_ = O.orientation;
					return !O.mirror && !O.hide
						? M(M({}, m), {}, K({}, _, Ke(m, ''.concat(_)) + O.height))
						: m;
				},
				{ top: p.top || 0, bottom: p.bottom || 0 },
			),
			b = M(M({}, y), v),
			w = b.bottom;
		h && (b.bottom += h.props.height || $r.defaultProps.height),
			d && r && (b = o2(b, i, n, r));
		var x = s - b.left - b.right,
			S = f - b.top - b.bottom;
		return M(
			M({ brushBottom: w }, b),
			{},
			{ width: Math.max(x, 0), height: Math.max(S, 0) },
		);
	},
	k3 = function (t, r) {
		if (r === 'xAxis') return t[r].width;
		if (r === 'yAxis') return t[r].height;
	},
	D3 = function (t) {
		var r = t.chartName,
			n = t.GraphicalChild,
			i = t.defaultTooltipEventType,
			a = i === void 0 ? 'axis' : i,
			o = t.validateTooltipEventTypes,
			u = o === void 0 ? ['axis'] : o,
			c = t.axisComponents,
			s = t.legendContent,
			f = t.formatAxisMap,
			l = t.defaultProps,
			p = function (b, w) {
				var x = w.graphicalItems,
					S = w.stackGroups,
					m = w.offset,
					g = w.updateId,
					O = w.dataStartIndex,
					_ = w.dataEndIndex,
					A = b.barSize,
					E = b.layout,
					P = b.barGap,
					T = b.barCategoryGap,
					j = b.maxBarSize,
					C = hh(E),
					I = C.numericAxisName,
					k = C.cateAxisName,
					D = I3(x),
					B = [];
				return (
					x.forEach(function (F, H) {
						var V = lo(b.data, {
								graphicalItems: [F],
								dataStartIndex: O,
								dataEndIndex: _,
							}),
							G =
								F.type.defaultProps !== void 0
									? M(M({}, F.type.defaultProps), F.props)
									: F.props,
							X = G.dataKey,
							ce = G.maxBarSize,
							ye = G[''.concat(I, 'Id')],
							Le = G[''.concat(k, 'Id')],
							Lt = {},
							Ie = c.reduce(function (Bt, Rt) {
								var fo = w[''.concat(Rt.axisType, 'Map')],
									ws = G[''.concat(Rt.axisType, 'Id')];
								(fo && fo[ws]) || Rt.axisType === 'zAxis' || Jt();
								var Os = fo[ws];
								return M(
									M({}, Bt),
									{},
									K(
										K({}, Rt.axisType, Os),
										''.concat(Rt.axisType, 'Ticks'),
										dt(Os),
									),
								);
							}, Lt),
							W = Ie[k],
							Y = Ie[''.concat(k, 'Ticks')],
							Z = S && S[ye] && S[ye].hasStack && x2(F, S[ye].stackGroups),
							N = Et(F.type).indexOf('Bar') >= 0,
							he = Qi(W, Y),
							te = [],
							be =
								D && i2({ barSize: A, stackGroups: S, totalSize: k3(Ie, k) });
						if (N) {
							var xe,
								Ne,
								_t = Q(ce) ? j : ce,
								nr =
									(xe =
										(Ne = Qi(W, Y, !0)) !== null && Ne !== void 0 ? Ne : _t) !==
										null && xe !== void 0
										? xe
										: 0;
							(te = a2({
								barGap: P,
								barCategoryGap: T,
								bandSize: nr !== he ? nr : he,
								sizeList: be[Le],
								maxBarSize: _t,
							})),
								nr !== he &&
									(te = te.map(function (Bt) {
										return M(
											M({}, Bt),
											{},
											{
												position: M(
													M({}, Bt.position),
													{},
													{ offset: Bt.position.offset - nr / 2 },
												),
											},
										);
									}));
						}
						var ui = F && F.type && F.type.getComposedData;
						ui &&
							B.push({
								props: M(
									M(
										{},
										ui(
											M(
												M({}, Ie),
												{},
												{
													displayedData: V,
													props: b,
													dataKey: X,
													item: F,
													bandSize: he,
													barPosition: te,
													offset: m,
													stackedData: Z,
													layout: E,
													dataStartIndex: O,
													dataEndIndex: _,
												},
											),
										),
									),
									{},
									K(
										K(
											K({ key: F.key || 'item-'.concat(H) }, I, Ie[I]),
											k,
											Ie[k],
										),
										'animationId',
										g,
									),
								),
								childIndex: lx(F, b.children),
								item: F,
							});
					}),
					B
				);
			},
			h = function (b, w) {
				var x = b.props,
					S = b.dataStartIndex,
					m = b.dataEndIndex,
					g = b.updateId;
				if (!Ls({ props: x })) return null;
				var O = x.children,
					_ = x.layout,
					A = x.stackOffset,
					E = x.data,
					P = x.reverseStackOrder,
					T = hh(_),
					j = T.numericAxisName,
					C = T.cateAxisName,
					I = Ve(O, n),
					k = m2(E, I, ''.concat(j, 'Id'), ''.concat(C, 'Id'), A, P),
					D = c.reduce(function (G, X) {
						var ce = ''.concat(X.axisType, 'Map');
						return M(
							M({}, G),
							{},
							K(
								{},
								ce,
								M3(
									x,
									M(
										M({}, X),
										{},
										{
											graphicalItems: I,
											stackGroups: X.axisType === j && k,
											dataStartIndex: S,
											dataEndIndex: m,
										},
									),
								),
							),
						);
					}, {}),
					B = N3(
						M(M({}, D), {}, { props: x, graphicalItems: I }),
						w == null ? void 0 : w.legendBBox,
					);
				Object.keys(D).forEach(function (G) {
					D[G] = f(x, D[G], B, G.replace('Map', ''), r);
				});
				var F = D[''.concat(C, 'Map')],
					H = C3(F),
					V = p(
						x,
						M(
							M({}, D),
							{},
							{
								dataStartIndex: S,
								dataEndIndex: m,
								updateId: g,
								graphicalItems: I,
								stackGroups: k,
								offset: B,
							},
						),
					);
				return M(
					M(
						{
							formattedGraphicalItems: V,
							graphicalItems: I,
							offset: B,
							stackGroups: k,
						},
						H,
					),
					D,
				);
			},
			d = (function (y) {
				function b(w) {
					var x, S, m;
					return (
						d3(this, b),
						(m = m3(this, b, [w])),
						K(m, 'eventEmitterSymbol', Symbol('rechartsEventEmitter')),
						K(m, 'accessibilityManager', new e3()),
						K(m, 'handleLegendBBoxUpdate', function (g) {
							if (g) {
								var O = m.state,
									_ = O.dataStartIndex,
									A = O.dataEndIndex,
									E = O.updateId;
								m.setState(
									M(
										{ legendBBox: g },
										h(
											{
												props: m.props,
												dataStartIndex: _,
												dataEndIndex: A,
												updateId: E,
											},
											M(M({}, m.state), {}, { legendBBox: g }),
										),
									),
								);
							}
						}),
						K(m, 'handleReceiveSyncEvent', function (g, O, _) {
							if (m.props.syncId === g) {
								if (
									_ === m.eventEmitterSymbol &&
									typeof m.props.syncMethod != 'function'
								)
									return;
								m.applySyncEvent(O);
							}
						}),
						K(m, 'handleBrushChange', function (g) {
							var O = g.startIndex,
								_ = g.endIndex;
							if (O !== m.state.dataStartIndex || _ !== m.state.dataEndIndex) {
								var A = m.state.updateId;
								m.setState(function () {
									return M(
										{ dataStartIndex: O, dataEndIndex: _ },
										h(
											{
												props: m.props,
												dataStartIndex: O,
												dataEndIndex: _,
												updateId: A,
											},
											m.state,
										),
									);
								}),
									m.triggerSyncEvent({ dataStartIndex: O, dataEndIndex: _ });
							}
						}),
						K(m, 'handleMouseEnter', function (g) {
							var O = m.getMouseInfo(g);
							if (O) {
								var _ = M(M({}, O), {}, { isTooltipActive: !0 });
								m.setState(_), m.triggerSyncEvent(_);
								var A = m.props.onMouseEnter;
								J(A) && A(_, g);
							}
						}),
						K(m, 'triggeredAfterMouseMove', function (g) {
							var O = m.getMouseInfo(g),
								_ = O
									? M(M({}, O), {}, { isTooltipActive: !0 })
									: { isTooltipActive: !1 };
							m.setState(_), m.triggerSyncEvent(_);
							var A = m.props.onMouseMove;
							J(A) && A(_, g);
						}),
						K(m, 'handleItemMouseEnter', function (g) {
							m.setState(function () {
								return {
									isTooltipActive: !0,
									activeItem: g,
									activePayload: g.tooltipPayload,
									activeCoordinate: g.tooltipPosition || { x: g.cx, y: g.cy },
								};
							});
						}),
						K(m, 'handleItemMouseLeave', function () {
							m.setState(function () {
								return { isTooltipActive: !1 };
							});
						}),
						K(m, 'handleMouseMove', function (g) {
							g.persist(), m.throttleTriggeredAfterMouseMove(g);
						}),
						K(m, 'handleMouseLeave', function (g) {
							m.throttleTriggeredAfterMouseMove.cancel();
							var O = { isTooltipActive: !1 };
							m.setState(O), m.triggerSyncEvent(O);
							var _ = m.props.onMouseLeave;
							J(_) && _(O, g);
						}),
						K(m, 'handleOuterEvent', function (g) {
							var O = sx(g),
								_ = Ke(m.props, ''.concat(O));
							if (O && J(_)) {
								var A, E;
								/.*touch.*/i.test(O)
									? (E = m.getMouseInfo(g.changedTouches[0]))
									: (E = m.getMouseInfo(g)),
									_((A = E) !== null && A !== void 0 ? A : {}, g);
							}
						}),
						K(m, 'handleClick', function (g) {
							var O = m.getMouseInfo(g);
							if (O) {
								var _ = M(M({}, O), {}, { isTooltipActive: !0 });
								m.setState(_), m.triggerSyncEvent(_);
								var A = m.props.onClick;
								J(A) && A(_, g);
							}
						}),
						K(m, 'handleMouseDown', function (g) {
							var O = m.props.onMouseDown;
							if (J(O)) {
								var _ = m.getMouseInfo(g);
								O(_, g);
							}
						}),
						K(m, 'handleMouseUp', function (g) {
							var O = m.props.onMouseUp;
							if (J(O)) {
								var _ = m.getMouseInfo(g);
								O(_, g);
							}
						}),
						K(m, 'handleTouchMove', function (g) {
							g.changedTouches != null &&
								g.changedTouches.length > 0 &&
								m.throttleTriggeredAfterMouseMove(g.changedTouches[0]);
						}),
						K(m, 'handleTouchStart', function (g) {
							g.changedTouches != null &&
								g.changedTouches.length > 0 &&
								m.handleMouseDown(g.changedTouches[0]);
						}),
						K(m, 'handleTouchEnd', function (g) {
							g.changedTouches != null &&
								g.changedTouches.length > 0 &&
								m.handleMouseUp(g.changedTouches[0]);
						}),
						K(m, 'handleDoubleClick', function (g) {
							var O = m.props.onDoubleClick;
							if (J(O)) {
								var _ = m.getMouseInfo(g);
								O(_, g);
							}
						}),
						K(m, 'handleContextMenu', function (g) {
							var O = m.props.onContextMenu;
							if (J(O)) {
								var _ = m.getMouseInfo(g);
								O(_, g);
							}
						}),
						K(m, 'triggerSyncEvent', function (g) {
							m.props.syncId !== void 0 &&
								Bo.emit(Ro, m.props.syncId, g, m.eventEmitterSymbol);
						}),
						K(m, 'applySyncEvent', function (g) {
							var O = m.props,
								_ = O.layout,
								A = O.syncMethod,
								E = m.state.updateId,
								P = g.dataStartIndex,
								T = g.dataEndIndex;
							if (g.dataStartIndex !== void 0 || g.dataEndIndex !== void 0)
								m.setState(
									M(
										{ dataStartIndex: P, dataEndIndex: T },
										h(
											{
												props: m.props,
												dataStartIndex: P,
												dataEndIndex: T,
												updateId: E,
											},
											m.state,
										),
									),
								);
							else if (g.activeTooltipIndex !== void 0) {
								var j = g.chartX,
									C = g.chartY,
									I = g.activeTooltipIndex,
									k = m.state,
									D = k.offset,
									B = k.tooltipTicks;
								if (!D) return;
								if (typeof A == 'function') I = A(B, g);
								else if (A === 'value') {
									I = -1;
									for (var F = 0; F < B.length; F++)
										if (B[F].value === g.activeLabel) {
											I = F;
											break;
										}
								}
								var H = M(M({}, D), {}, { x: D.left, y: D.top }),
									V = Math.min(j, H.x + H.width),
									G = Math.min(C, H.y + H.height),
									X = B[I] && B[I].value,
									ce = hc(m.state, m.props.data, I),
									ye = B[I]
										? {
												x: _ === 'horizontal' ? B[I].coordinate : V,
												y: _ === 'horizontal' ? G : B[I].coordinate,
										  }
										: Wy;
								m.setState(
									M(
										M({}, g),
										{},
										{
											activeLabel: X,
											activeCoordinate: ye,
											activePayload: ce,
											activeTooltipIndex: I,
										},
									),
								);
							} else m.setState(g);
						}),
						K(m, 'renderCursor', function (g) {
							var O,
								_ = m.state,
								A = _.isTooltipActive,
								E = _.activeCoordinate,
								P = _.activePayload,
								T = _.offset,
								j = _.activeTooltipIndex,
								C = _.tooltipAxisBandSize,
								I = m.getTooltipEventType(),
								k = (O = g.props.active) !== null && O !== void 0 ? O : A,
								D = m.props.layout,
								B = g.key || '_recharts-cursor';
							return $.createElement(u3, {
								key: B,
								activeCoordinate: E,
								activePayload: P,
								activeTooltipIndex: j,
								chartName: r,
								element: g,
								isActive: k,
								layout: D,
								offset: T,
								tooltipAxisBandSize: C,
								tooltipEventType: I,
							});
						}),
						K(m, 'renderPolarAxis', function (g, O, _) {
							var A = Ke(g, 'type.axisType'),
								E = Ke(m.state, ''.concat(A, 'Map')),
								P = g.type.defaultProps,
								T = P !== void 0 ? M(M({}, P), g.props) : g.props,
								j = E && E[T[''.concat(A, 'Id')]];
							return L.cloneElement(
								g,
								M(
									M({}, j),
									{},
									{
										className: ne(A, j.className),
										key: g.key || ''.concat(O, '-').concat(_),
										ticks: dt(j, !0),
									},
								),
							);
						}),
						K(m, 'renderPolarGrid', function (g) {
							var O = g.props,
								_ = O.radialLines,
								A = O.polarAngles,
								E = O.polarRadius,
								P = m.state,
								T = P.radiusAxisMap,
								j = P.angleAxisMap,
								C = Pt(T),
								I = Pt(j),
								k = I.cx,
								D = I.cy,
								B = I.innerRadius,
								F = I.outerRadius;
							return L.cloneElement(g, {
								polarAngles: Array.isArray(A)
									? A
									: dt(I, !0).map(function (H) {
											return H.coordinate;
									  }),
								polarRadius: Array.isArray(E)
									? E
									: dt(C, !0).map(function (H) {
											return H.coordinate;
									  }),
								cx: k,
								cy: D,
								innerRadius: B,
								outerRadius: F,
								key: g.key || 'polar-grid',
								radialLines: _,
							});
						}),
						K(m, 'renderLegend', function () {
							var g = m.state.formattedGraphicalItems,
								O = m.props,
								_ = O.children,
								A = O.width,
								E = O.height,
								P = m.props.margin || {},
								T = A - (P.left || 0) - (P.right || 0),
								j = kv({
									children: _,
									formattedGraphicalItems: g,
									legendWidth: T,
									legendContent: s,
								});
							if (!j) return null;
							var C = j.item,
								I = sh(j, c3);
							return L.cloneElement(
								C,
								M(
									M({}, I),
									{},
									{
										chartWidth: A,
										chartHeight: E,
										margin: P,
										onBBoxUpdate: m.handleLegendBBoxUpdate,
									},
								),
							);
						}),
						K(m, 'renderTooltip', function () {
							var g,
								O = m.props,
								_ = O.children,
								A = O.accessibilityLayer,
								E = Fe(_, at);
							if (!E) return null;
							var P = m.state,
								T = P.isTooltipActive,
								j = P.activeCoordinate,
								C = P.activePayload,
								I = P.activeLabel,
								k = P.offset,
								D = (g = E.props.active) !== null && g !== void 0 ? g : T;
							return L.cloneElement(E, {
								viewBox: M(M({}, k), {}, { x: k.left, y: k.top }),
								active: D,
								label: I,
								payload: D ? C : [],
								coordinate: j,
								accessibilityLayer: A,
							});
						}),
						K(m, 'renderBrush', function (g) {
							var O = m.props,
								_ = O.margin,
								A = O.data,
								E = m.state,
								P = E.offset,
								T = E.dataStartIndex,
								j = E.dataEndIndex,
								C = E.updateId;
							return L.cloneElement(g, {
								key: g.key || '_recharts-brush',
								onChange: yi(m.handleBrushChange, g.props.onChange),
								data: A,
								x: R(g.props.x) ? g.props.x : P.left,
								y: R(g.props.y)
									? g.props.y
									: P.top + P.height + P.brushBottom - (_.bottom || 0),
								width: R(g.props.width) ? g.props.width : P.width,
								startIndex: T,
								endIndex: j,
								updateId: 'brush-'.concat(C),
							});
						}),
						K(m, 'renderReferenceElement', function (g, O, _) {
							if (!g) return null;
							var A = m,
								E = A.clipPathId,
								P = m.state,
								T = P.xAxisMap,
								j = P.yAxisMap,
								C = P.offset,
								I = g.type.defaultProps || {},
								k = g.props,
								D = k.xAxisId,
								B = D === void 0 ? I.xAxisId : D,
								F = k.yAxisId,
								H = F === void 0 ? I.yAxisId : F;
							return L.cloneElement(g, {
								key: g.key || ''.concat(O, '-').concat(_),
								xAxis: T[B],
								yAxis: j[H],
								viewBox: {
									x: C.left,
									y: C.top,
									width: C.width,
									height: C.height,
								},
								clipPathId: E,
							});
						}),
						K(m, 'renderActivePoints', function (g) {
							var O = g.item,
								_ = g.activePoint,
								A = g.basePoint,
								E = g.childIndex,
								P = g.isRange,
								T = [],
								j = O.props.key,
								C =
									O.item.type.defaultProps !== void 0
										? M(M({}, O.item.type.defaultProps), O.item.props)
										: O.item.props,
								I = C.activeDot,
								k = C.dataKey,
								D = M(
									M(
										{
											index: E,
											dataKey: k,
											cx: _.x,
											cy: _.y,
											r: 4,
											fill: ss(O.item),
											strokeWidth: 2,
											stroke: '#fff',
											payload: _.payload,
											value: _.value,
										},
										ee(I, !1),
									),
									_i(I),
								);
							return (
								T.push(
									b.renderActiveDot(
										I,
										D,
										''.concat(j, '-activePoint-').concat(E),
									),
								),
								A
									? T.push(
											b.renderActiveDot(
												I,
												M(M({}, D), {}, { cx: A.x, cy: A.y }),
												''.concat(j, '-basePoint-').concat(E),
											),
									  )
									: P && T.push(null),
								T
							);
						}),
						K(m, 'renderGraphicChild', function (g, O, _) {
							var A = m.filterFormatItem(g, O, _);
							if (!A) return null;
							var E = m.getTooltipEventType(),
								P = m.state,
								T = P.isTooltipActive,
								j = P.tooltipAxis,
								C = P.activeTooltipIndex,
								I = P.activeLabel,
								k = m.props.children,
								D = Fe(k, at),
								B = A.props,
								F = B.points,
								H = B.isRange,
								V = B.baseLine,
								G =
									A.item.type.defaultProps !== void 0
										? M(M({}, A.item.type.defaultProps), A.item.props)
										: A.item.props,
								X = G.activeDot,
								ce = G.hide,
								ye = G.activeBar,
								Le = G.activeShape,
								Lt = !!(!ce && T && D && (X || ye || Le)),
								Ie = {};
							E !== 'axis' && D && D.props.trigger === 'click'
								? (Ie = {
										onClick: yi(m.handleItemMouseEnter, g.props.onClick),
								  })
								: E !== 'axis' &&
								  (Ie = {
										onMouseLeave: yi(
											m.handleItemMouseLeave,
											g.props.onMouseLeave,
										),
										onMouseEnter: yi(
											m.handleItemMouseEnter,
											g.props.onMouseEnter,
										),
								  });
							var W = L.cloneElement(g, M(M({}, A.props), Ie));
							function Y(Rt) {
								return typeof j.dataKey == 'function'
									? j.dataKey(Rt.payload)
									: null;
							}
							if (Lt)
								if (C >= 0) {
									var Z, N;
									if (j.dataKey && !j.allowDuplicatedCategory) {
										var he =
											typeof j.dataKey == 'function'
												? Y
												: 'payload.'.concat(j.dataKey.toString());
										(Z = Si(F, he, I)), (N = H && V && Si(V, he, I));
									} else (Z = F == null ? void 0 : F[C]), (N = H && V && V[C]);
									if (Le || ye) {
										var te =
											g.props.activeIndex !== void 0 ? g.props.activeIndex : C;
										return [
											L.cloneElement(
												g,
												M(M(M({}, A.props), Ie), {}, { activeIndex: te }),
											),
											null,
											null,
										];
									}
									if (!Q(Z))
										return [W].concat(
											Lr(
												m.renderActivePoints({
													item: A,
													activePoint: Z,
													basePoint: N,
													childIndex: C,
													isRange: H,
												}),
											),
										);
								} else {
									var be,
										xe =
											(be = m.getItemByXY(m.state.activeCoordinate)) !== null &&
											be !== void 0
												? be
												: { graphicalItem: W },
										Ne = xe.graphicalItem,
										_t = Ne.item,
										nr = _t === void 0 ? g : _t,
										ui = Ne.childIndex,
										Bt = M(M(M({}, A.props), Ie), {}, { activeIndex: ui });
									return [L.cloneElement(nr, Bt), null, null];
								}
							return H ? [W, null, null] : [W, null];
						}),
						K(m, 'renderCustomized', function (g, O, _) {
							return L.cloneElement(
								g,
								M(
									M({ key: 'recharts-customized-'.concat(_) }, m.props),
									m.state,
								),
							);
						}),
						K(m, 'renderMap', {
							CartesianGrid: { handler: wi, once: !0 },
							ReferenceArea: { handler: m.renderReferenceElement },
							ReferenceLine: { handler: wi },
							ReferenceDot: { handler: m.renderReferenceElement },
							XAxis: { handler: wi },
							YAxis: { handler: wi },
							Brush: { handler: m.renderBrush, once: !0 },
							Bar: { handler: m.renderGraphicChild },
							Line: { handler: m.renderGraphicChild },
							Area: { handler: m.renderGraphicChild },
							Radar: { handler: m.renderGraphicChild },
							RadialBar: { handler: m.renderGraphicChild },
							Scatter: { handler: m.renderGraphicChild },
							Pie: { handler: m.renderGraphicChild },
							Funnel: { handler: m.renderGraphicChild },
							Tooltip: { handler: m.renderCursor, once: !0 },
							PolarGrid: { handler: m.renderPolarGrid, once: !0 },
							PolarAngleAxis: { handler: m.renderPolarAxis },
							PolarRadiusAxis: { handler: m.renderPolarAxis },
							Customized: { handler: m.renderCustomized },
						}),
						(m.clipPathId = ''.concat(
							(x = w.id) !== null && x !== void 0 ? x : Jn('recharts'),
							'-clip',
						)),
						(m.throttleTriggeredAfterMouseMove = OE(
							m.triggeredAfterMouseMove,
							(S = w.throttleDelay) !== null && S !== void 0 ? S : 1e3 / 60,
						)),
						(m.state = {}),
						m
					);
				}
				return (
					x3(b, y),
					y3(b, [
						{
							key: 'componentDidMount',
							value: function () {
								var x, S;
								this.addListener(),
									this.accessibilityManager.setDetails({
										container: this.container,
										offset: {
											left:
												(x = this.props.margin.left) !== null && x !== void 0
													? x
													: 0,
											top:
												(S = this.props.margin.top) !== null && S !== void 0
													? S
													: 0,
										},
										coordinateList: this.state.tooltipTicks,
										mouseHandlerCallback: this.triggeredAfterMouseMove,
										layout: this.props.layout,
									}),
									this.displayDefaultTooltip();
							},
						},
						{
							key: 'displayDefaultTooltip',
							value: function () {
								var x = this.props,
									S = x.children,
									m = x.data,
									g = x.height,
									O = x.layout,
									_ = Fe(S, at);
								if (_) {
									var A = _.props.defaultIndex;
									if (
										!(
											typeof A != 'number' ||
											A < 0 ||
											A > this.state.tooltipTicks.length - 1
										)
									) {
										var E =
												this.state.tooltipTicks[A] &&
												this.state.tooltipTicks[A].value,
											P = hc(this.state, m, A, E),
											T = this.state.tooltipTicks[A].coordinate,
											j = (this.state.offset.top + g) / 2,
											C = O === 'horizontal',
											I = C ? { x: T, y: j } : { y: T, x: j },
											k = this.state.formattedGraphicalItems.find(function (B) {
												var F = B.item;
												return F.type.name === 'Scatter';
											});
										k &&
											((I = M(M({}, I), k.props.points[A].tooltipPosition)),
											(P = k.props.points[A].tooltipPayload));
										var D = {
											activeTooltipIndex: A,
											isTooltipActive: !0,
											activeLabel: E,
											activePayload: P,
											activeCoordinate: I,
										};
										this.setState(D),
											this.renderCursor(_),
											this.accessibilityManager.setIndex(A);
									}
								}
							},
						},
						{
							key: 'getSnapshotBeforeUpdate',
							value: function (x, S) {
								if (!this.props.accessibilityLayer) return null;
								if (
									(this.state.tooltipTicks !== S.tooltipTicks &&
										this.accessibilityManager.setDetails({
											coordinateList: this.state.tooltipTicks,
										}),
									this.props.layout !== x.layout &&
										this.accessibilityManager.setDetails({
											layout: this.props.layout,
										}),
									this.props.margin !== x.margin)
								) {
									var m, g;
									this.accessibilityManager.setDetails({
										offset: {
											left:
												(m = this.props.margin.left) !== null && m !== void 0
													? m
													: 0,
											top:
												(g = this.props.margin.top) !== null && g !== void 0
													? g
													: 0,
										},
									});
								}
								return null;
							},
						},
						{
							key: 'componentDidUpdate',
							value: function (x) {
								Go([Fe(x.children, at)], [Fe(this.props.children, at)]) ||
									this.displayDefaultTooltip();
							},
						},
						{
							key: 'componentWillUnmount',
							value: function () {
								this.removeListener(),
									this.throttleTriggeredAfterMouseMove.cancel();
							},
						},
						{
							key: 'getTooltipEventType',
							value: function () {
								var x = Fe(this.props.children, at);
								if (x && typeof x.props.shared == 'boolean') {
									var S = x.props.shared ? 'axis' : 'item';
									return u.indexOf(S) >= 0 ? S : a;
								}
								return a;
							},
						},
						{
							key: 'getMouseInfo',
							value: function (x) {
								if (!this.container) return null;
								var S = this.container,
									m = S.getBoundingClientRect(),
									g = EE(m),
									O = {
										chartX: Math.round(x.pageX - g.left),
										chartY: Math.round(x.pageY - g.top),
									},
									_ = m.width / S.offsetWidth || 1,
									A = this.inRange(O.chartX, O.chartY, _);
								if (!A) return null;
								var E = this.state,
									P = E.xAxisMap,
									T = E.yAxisMap,
									j = this.getTooltipEventType();
								if (j !== 'axis' && P && T) {
									var C = Pt(P).scale,
										I = Pt(T).scale,
										k = C && C.invert ? C.invert(O.chartX) : null,
										D = I && I.invert ? I.invert(O.chartY) : null;
									return M(M({}, O), {}, { xValue: k, yValue: D });
								}
								var B = fh(this.state, this.props.data, this.props.layout, A);
								return B ? M(M({}, O), B) : null;
							},
						},
						{
							key: 'inRange',
							value: function (x, S) {
								var m =
										arguments.length > 2 && arguments[2] !== void 0
											? arguments[2]
											: 1,
									g = this.props.layout,
									O = x / m,
									_ = S / m;
								if (g === 'horizontal' || g === 'vertical') {
									var A = this.state.offset,
										E =
											O >= A.left &&
											O <= A.left + A.width &&
											_ >= A.top &&
											_ <= A.top + A.height;
									return E ? { x: O, y: _ } : null;
								}
								var P = this.state,
									T = P.angleAxisMap,
									j = P.radiusAxisMap;
								if (T && j) {
									var C = Pt(T);
									return Hf({ x: O, y: _ }, C);
								}
								return null;
							},
						},
						{
							key: 'parseEventsOfWrapper',
							value: function () {
								var x = this.props.children,
									S = this.getTooltipEventType(),
									m = Fe(x, at),
									g = {};
								m &&
									S === 'axis' &&
									(m.props.trigger === 'click'
										? (g = { onClick: this.handleClick })
										: (g = {
												onMouseEnter: this.handleMouseEnter,
												onDoubleClick: this.handleDoubleClick,
												onMouseMove: this.handleMouseMove,
												onMouseLeave: this.handleMouseLeave,
												onTouchMove: this.handleTouchMove,
												onTouchStart: this.handleTouchStart,
												onTouchEnd: this.handleTouchEnd,
												onContextMenu: this.handleContextMenu,
										  }));
								var O = _i(this.props, this.handleOuterEvent);
								return M(M({}, O), g);
							},
						},
						{
							key: 'addListener',
							value: function () {
								Bo.on(Ro, this.handleReceiveSyncEvent);
							},
						},
						{
							key: 'removeListener',
							value: function () {
								Bo.removeListener(Ro, this.handleReceiveSyncEvent);
							},
						},
						{
							key: 'filterFormatItem',
							value: function (x, S, m) {
								for (
									var g = this.state.formattedGraphicalItems,
										O = 0,
										_ = g.length;
									O < _;
									O++
								) {
									var A = g[O];
									if (
										A.item === x ||
										A.props.key === x.key ||
										(S === Et(A.item.type) && m === A.childIndex)
									)
										return A;
								}
								return null;
							},
						},
						{
							key: 'renderClipPath',
							value: function () {
								var x = this.clipPathId,
									S = this.state.offset,
									m = S.left,
									g = S.top,
									O = S.height,
									_ = S.width;
								return $.createElement(
									'defs',
									null,
									$.createElement(
										'clipPath',
										{ id: x },
										$.createElement('rect', {
											x: m,
											y: g,
											height: O,
											width: _,
										}),
									),
								);
							},
						},
						{
							key: 'getXScales',
							value: function () {
								var x = this.state.xAxisMap;
								return x
									? Object.entries(x).reduce(function (S, m) {
											var g = ch(m, 2),
												O = g[0],
												_ = g[1];
											return M(M({}, S), {}, K({}, O, _.scale));
									  }, {})
									: null;
							},
						},
						{
							key: 'getYScales',
							value: function () {
								var x = this.state.yAxisMap;
								return x
									? Object.entries(x).reduce(function (S, m) {
											var g = ch(m, 2),
												O = g[0],
												_ = g[1];
											return M(M({}, S), {}, K({}, O, _.scale));
									  }, {})
									: null;
							},
						},
						{
							key: 'getXScaleByAxisId',
							value: function (x) {
								var S;
								return (S = this.state.xAxisMap) === null ||
									S === void 0 ||
									(S = S[x]) === null ||
									S === void 0
									? void 0
									: S.scale;
							},
						},
						{
							key: 'getYScaleByAxisId',
							value: function (x) {
								var S;
								return (S = this.state.yAxisMap) === null ||
									S === void 0 ||
									(S = S[x]) === null ||
									S === void 0
									? void 0
									: S.scale;
							},
						},
						{
							key: 'getItemByXY',
							value: function (x) {
								var S = this.state,
									m = S.formattedGraphicalItems,
									g = S.activeItem;
								if (m && m.length)
									for (var O = 0, _ = m.length; O < _; O++) {
										var A = m[O],
											E = A.props,
											P = A.item,
											T =
												P.type.defaultProps !== void 0
													? M(M({}, P.type.defaultProps), P.props)
													: P.props,
											j = Et(P.type);
										if (j === 'Bar') {
											var C = (E.data || []).find(function (B) {
												return Yk(x, B);
											});
											if (C) return { graphicalItem: A, payload: C };
										} else if (j === 'RadialBar') {
											var I = (E.data || []).find(function (B) {
												return Hf(x, B);
											});
											if (I) return { graphicalItem: A, payload: I };
										} else if (to(A, g) || ro(A, g) || Un(A, g)) {
											var k = QD({
													graphicalItem: A,
													activeTooltipItem: g,
													itemData: T.data,
												}),
												D = T.activeIndex === void 0 ? k : T.activeIndex;
											return {
												graphicalItem: M(M({}, A), {}, { childIndex: D }),
												payload: Un(A, g) ? T.data[k] : A.props.data[k],
											};
										}
									}
								return null;
							},
						},
						{
							key: 'render',
							value: function () {
								var x = this;
								if (!Ls(this)) return null;
								var S = this.props,
									m = S.children,
									g = S.className,
									O = S.width,
									_ = S.height,
									A = S.style,
									E = S.compact,
									P = S.title,
									T = S.desc,
									j = sh(S, s3),
									C = ee(j, !1);
								if (E)
									return $.createElement(
										qp,
										{
											state: this.state,
											width: this.props.width,
											height: this.props.height,
											clipPathId: this.clipPathId,
										},
										$.createElement(
											Ko,
											fr({}, C, { width: O, height: _, title: P, desc: T }),
											this.renderClipPath(),
											Rs(m, this.renderMap),
										),
									);
								if (this.props.accessibilityLayer) {
									var I, k;
									(C.tabIndex =
										(I = this.props.tabIndex) !== null && I !== void 0 ? I : 0),
										(C.role =
											(k = this.props.role) !== null && k !== void 0
												? k
												: 'application'),
										(C.onKeyDown = function (B) {
											x.accessibilityManager.keyboardEvent(B);
										}),
										(C.onFocus = function () {
											x.accessibilityManager.focus();
										});
								}
								var D = this.parseEventsOfWrapper();
								return $.createElement(
									qp,
									{
										state: this.state,
										width: this.props.width,
										height: this.props.height,
										clipPathId: this.clipPathId,
									},
									$.createElement(
										'div',
										fr(
											{
												className: ne('recharts-wrapper', g),
												style: M(
													{
														position: 'relative',
														cursor: 'default',
														width: O,
														height: _,
													},
													A,
												),
											},
											D,
											{
												ref: function (F) {
													x.container = F;
												},
											},
										),
										$.createElement(
											Ko,
											fr({}, C, {
												width: O,
												height: _,
												title: P,
												desc: T,
												style: P3,
											}),
											this.renderClipPath(),
											Rs(m, this.renderMap),
										),
										this.renderLegend(),
										this.renderTooltip(),
									),
								);
							},
						},
					])
				);
			})(L.Component);
		K(d, 'displayName', r),
			K(
				d,
				'defaultProps',
				M(
					{
						layout: 'horizontal',
						stackOffset: 'none',
						barCategoryGap: '10%',
						barGap: 4,
						margin: { top: 5, right: 5, bottom: 5, left: 5 },
						reverseStackOrder: !1,
						syncMethod: 'index',
					},
					l,
				),
			),
			K(d, 'getDerivedStateFromProps', function (y, b) {
				var w = y.dataKey,
					x = y.data,
					S = y.children,
					m = y.width,
					g = y.height,
					O = y.layout,
					_ = y.stackOffset,
					A = y.margin,
					E = b.dataStartIndex,
					P = b.dataEndIndex;
				if (b.updateId === void 0) {
					var T = ph(y);
					return M(
						M(
							M({}, T),
							{},
							{ updateId: 0 },
							h(M(M({ props: y }, T), {}, { updateId: 0 }), b),
						),
						{},
						{
							prevDataKey: w,
							prevData: x,
							prevWidth: m,
							prevHeight: g,
							prevLayout: O,
							prevStackOffset: _,
							prevMargin: A,
							prevChildren: S,
						},
					);
				}
				if (
					w !== b.prevDataKey ||
					x !== b.prevData ||
					m !== b.prevWidth ||
					g !== b.prevHeight ||
					O !== b.prevLayout ||
					_ !== b.prevStackOffset ||
					!pr(A, b.prevMargin)
				) {
					var j = ph(y),
						C = {
							chartX: b.chartX,
							chartY: b.chartY,
							isTooltipActive: b.isTooltipActive,
						},
						I = M(M({}, fh(b, x, O)), {}, { updateId: b.updateId + 1 }),
						k = M(M(M({}, j), C), I);
					return M(
						M(M({}, k), h(M({ props: y }, k), b)),
						{},
						{
							prevDataKey: w,
							prevData: x,
							prevWidth: m,
							prevHeight: g,
							prevLayout: O,
							prevStackOffset: _,
							prevMargin: A,
							prevChildren: S,
						},
					);
				}
				if (!Go(S, b.prevChildren)) {
					var D,
						B,
						F,
						H,
						V = Fe(S, $r),
						G =
							V &&
							(D =
								(B = V.props) === null || B === void 0
									? void 0
									: B.startIndex) !== null &&
							D !== void 0
								? D
								: E,
						X =
							V &&
							(F =
								(H = V.props) === null || H === void 0
									? void 0
									: H.endIndex) !== null &&
							F !== void 0
								? F
								: P,
						ce = G !== E || X !== P,
						ye = !Q(x),
						Le = ye && !ce ? b.updateId : b.updateId + 1;
					return M(
						M(
							{ updateId: Le },
							h(
								M(
									M({ props: y }, b),
									{},
									{ updateId: Le, dataStartIndex: G, dataEndIndex: X },
								),
								b,
							),
						),
						{},
						{ prevChildren: S, dataStartIndex: G, dataEndIndex: X },
					);
				}
				return null;
			}),
			K(d, 'renderActiveDot', function (y, b, w) {
				var x;
				return (
					L.isValidElement(y)
						? (x = L.cloneElement(y, b))
						: J(y)
						? (x = y(b))
						: (x = $.createElement(fs, b)),
					$.createElement(ve, { className: 'recharts-active-dot', key: w }, x)
				);
			});
		var v = L.forwardRef(function (b, w) {
			return $.createElement(d, fr({}, b, { ref: w }));
		});
		return (v.displayName = d.displayName), v;
	},
	L3 = D3({
		chartName: 'LineChart',
		GraphicalChild: oi,
		axisComponents: [
			{ axisType: 'xAxis', AxisComp: co },
			{ axisType: 'yAxis', AxisComp: so },
		],
		formatAxisMap: _B,
	});
const Gy = [
		{
			label: 'y1',
			orientation: 'left',
			color: '#ef4444',
			position: 'insideLeft',
		},
		{
			label: 'y2',
			orientation: 'right',
			color: '#3b82f6',
			position: 'insideRight',
		},
	],
	xs = '--';
function Hy(e) {
	return new Date(e * 1e3)
		.toISOString()
		.slice(11, 19)
		.replace(/^(00:)?0?/, '');
}
function Ky(e) {
	const { active: t, payload: r } = e;
	if (!t || !(r != null && r.length)) return null;
	function n(i, a, o, u, c) {
		return U.jsxs(
			'div',
			{
				style: { color: u },
				className: 'flex',
				children: [
					U.jsx('div', { className: 'me-3 grow', children: `${i}:` }),
					U.jsx('div', { children: `${a} ${o}` }),
				],
			},
			`${i}|${c}`,
		);
	}
	return U.jsxs('div', {
		className:
			'custom-tooltip bg-white border border-gray-500 rounded-sm px-2 py-1',
		children: [
			n('time', Hy(r[0].payload.time), '', ''),
			n('timestamp', nm(r[0].payload.timestamp.fieldValue, 'time'), '', ''),
			r.map((i, a) => {
				var l, p;
				const o = i.payload.record[i.name],
					u = ((l = o.field) == null ? void 0 : l.label) || i.name,
					c = i.value.toLocaleString(),
					s = ((p = o.field) == null ? void 0 : p.units) || '',
					f = i.stroke;
				return n(u, c, s, f, a);
			}),
		],
	});
}
Ky.propTypes = { active: z.bool, payload: z.array };
function cr(e) {
	const {
			viewBox: t,
			stroke: r = '#808080',
			textAnchor: n = 'start',
			angle: i,
			value: a,
			dx: o,
			dy: u,
		} = e,
		{ x: c, y: s, height: f } = t,
		l = i && `rotate(${i}, ${c + o}, ${f + s + u})`;
	return U.jsx('text', {
		x: c + o,
		y: f + s + u,
		className: 'recharts-text recharts-label',
		transform: l,
		textAnchor: n,
		fill: r,
		children: a,
	});
}
cr.propTypes = {
	viewBox: z.object,
	stroke: z.string,
	textAnchor: z.string,
	dx: z.number,
	dy: z.number,
	angle: z.number,
	value: z.string.isRequired,
};
function B3(e) {
	return e.toLocaleString();
}
function dh(e, t) {
	return Object.values(e).find((r) => {
		var n;
		return (
			((n = r.fieldDefinition) == null ? void 0 : n.fieldDefinitionNumber) === t
		);
	});
}
function R3(e, t) {
	var l;
	const { laps: r, sessions: n, points: i } = t;
	if (e === xs) return i;
	const [a, o] = e.split(' '),
		c = (a === 'lap' ? r : n)[o],
		s = c.start_time.rawFieldValue - t.tStart;
	if (!((l = c.total_elapsed_time) != null && l.rawFieldValue)) return [];
	const f = Math.ceil(s + c.total_elapsed_time.rawFieldValue / 1e3);
	return i.filter((p) => p.time >= s && p.time <= f);
}
function Vy(e) {
	const {
			data: t,
			lineFields: r,
			refLines: n,
			filter: i,
			singleY: a,
			xType: o,
		} = e,
		{
			tStart: u,
			laps: c,
			events: s,
			lengths: f,
			sessions: l,
			timedMessages: p,
			fields: h,
		} = t;
	function d(_) {
		const A = h.find((j) => j.key === _);
		if (!A) return { legend: _, axis: _, domainStart: 0 };
		const E = gh(A.key),
			P = A.units ? `${E} (${A.units})` : E,
			T = /(altitude|elevation)/.test(E) ? 'auto' : 0;
		return { legend: E, axis: P, domainStart: T };
	}
	const v = r.map(d),
		y = L.useCallback(
			(_, A, E) => {
				var P;
				return ((P = v[E]) == null ? void 0 : P.legend) || _;
			},
			[v],
		),
		[b, { width: w, height: x }] = hm(),
		S = { value: 'Time', position: 'insideBottom', offset: -10 },
		m = R3(i, t);
	let g = -8;
	const O = L.useMemo(() => {
		var _;
		if (!Oi || !n.custom) return null;
		try {
			const { globalMessageNumber: A, labelField: E, conditions: P } = n.custom;
			return (_ = p[A]) == null
				? void 0
				: _.filter((T) =>
						P.every((j) => {
							var C;
							return (
								((C = dh(T, j.field)) == null ? void 0 : C.rawFieldValue) ===
								j.value
							);
						}),
				  ).map((T) => {
						var j;
						return {
							timestamp: T.timestamp,
							label: (j = dh(T, E)) == null ? void 0 : j.rawFieldValue,
						};
				  });
		} catch (A) {
			return console.error(A), null;
		}
	}, [n.custom, p]);
	return U.jsx('div', {
		ref: b,
		className: 'grow m-5 border',
		children: U.jsxs(L3, {
			width: w,
			height: x - 80,
			data: m,
			margin: { bottom: 10 },
			children: [
				U.jsx(Kt, { verticalAlign: 'top', height: 36, formatter: y }),
				U.jsx(Ty, { stroke: '#ccc', strokeDasharray: '5 5' }),
				U.jsx(co, {
					dataKey: 'time',
					type: o,
					label: S,
					domain: ['dataMin', 'dataMax'],
					allowDataOverflow: !1,
					tickFormatter: Hy,
				}),
				U.jsx(at, {
					content: U.jsx(Ky, { tStart: u }),
					animationDuration: 100,
				}),
				Gy.map((_, A) => {
					var D, B;
					const { label: E, orientation: P, color: T, position: j } = _,
						C = r[A],
						I = {
							value: (D = v[A]) == null ? void 0 : D.axis,
							angle: -90,
							position: j,
							offset: 20,
						},
						k = a ? 'y1' : E;
					return (
						!!C &&
						U.jsxs(
							$.Fragment,
							{
								children: [
									U.jsx(oi, {
										yAxisId: k,
										dot: !1,
										dataKey: C,
										stroke: T,
										animationDuration: 100,
										connectNulls: !0,
									}),
									U.jsx(so, {
										yAxisId: E,
										hide: k !== E,
										dataKey: C,
										orientation: P,
										label: I,
										domain: [
											(B = v[A]) == null ? void 0 : B.domainStart,
											'auto',
										],
										tickFormatter: B3,
									}),
								],
							},
							`${T}|${k}|${C}`,
						)
					);
				}),
				n.laps &&
					c.map((_, A) => {
						if (A === 0) return (g = -24), null;
						const E = _.start_time.rawFieldValue - u,
							P = `L${A}`,
							T = U.jsx(cr, { value: P, dx: -8, dy: -8 });
						return U.jsx($t, { x: E, label: T, yAxisId: 'y1' }, P);
					}),
				n.sessions &&
					l.map((_, A) => {
						var j;
						const E = _.start_time.rawFieldValue - u,
							P = `S${A}`,
							T = U.jsx(cr, {
								value: `${P}: ${
									((j = _.sport) == null ? void 0 : j.fieldValue) ?? ''
								}`,
								dx: 14,
								dy: g,
								angle: -90,
								title: 'Session',
							});
						return U.jsx(
							$t,
							{ x: E, stroke: 'gray', label: T, yAxisId: 'y1' },
							P,
						);
					}),
				n.lengths &&
					f.map((_, A) => {
						const E =
								_.start_time.rawFieldValue -
								u +
								_.total_elapsed_time.rawFieldValue / 1e3,
							P = `#${A}`,
							T = '#3b82f6',
							j = `${P}: ${_.total_timer_time.fieldValue.slice(0, -2)}`,
							C = U.jsx(cr, {
								value: j,
								dx: -3,
								dy: g,
								stroke: T,
								angle: -90,
								title: 'Length',
							});
						return U.jsx($t, { x: E, stroke: T, label: C, yAxisId: 'y1' }, P);
					}),
				n.events &&
					s.map((_, A) => {
						var C, I;
						if (!((C = _.timestamp) != null && C.rawFieldValue)) return null;
						const E = _.timestamp.rawFieldValue - u,
							P = `E${A}`,
							T = '#22c55e',
							j = U.jsx(cr, {
								value: `${P}: ${
									(I = _.event_type) == null ? void 0 : I.fieldValue
								}`,
								dx: -3,
								dy: g,
								stroke: T,
								angle: -90,
								title: 'Event',
							});
						return U.jsx($t, { x: E, label: j, stroke: T, yAxisId: 'y1' }, P);
					}),
				Oi &&
					(O == null
						? void 0
						: O.map((_, A) => {
								const { rawFieldValue: E, absoluteValue: P } = _.timestamp,
									T = (P ?? E) - u,
									j = `C${A}`,
									C = '#a855f7',
									I = U.jsx(cr, {
										value: `${j}: ${_.label ?? '-'}`,
										dx: -3,
										dy: g,
										stroke: C,
										angle: -90,
										title: 'Event',
									});
								return U.jsx(
									$t,
									{ x: T, label: I, stroke: C, yAxisId: 'y1' },
									j,
								);
						  })),
			],
		}),
	});
}
Vy.propTypes = {
	data: z.object,
	lineFields: z.array,
	refLines: z.object,
	filter: z.string,
	singleY: z.bool,
	xType: z.string,
};
function Xy(e) {
	const {
		className: t,
		fields: r,
		lineFields: n,
		setLineFields: i,
		singleY: a,
		setSingleY: o,
	} = e;
	if (!r) return null;
	function u(c, s) {
		const f = [...n];
		(f[c] = s), i(f);
	}
	return U.jsxs('div', {
		className: t,
		children: [
			U.jsx('h2', {
				className: 'text-lg font-medium text-slate-500 -mt-0.5 me-3',
				children: 'Select field',
			}),
			U.jsxs('div', {
				className: 'flex flex-col gap-3',
				children: [
					Gy.map((c, s) =>
						U.jsxs(
							'div',
							{
								className: 'flex items-baseline',
								children: [
									U.jsx(vh, {
										htmlFor: `axis_${c.label}`,
										className: 'me-2',
										children: c.label,
									}),
									U.jsxs(bh, {
										id: c.label,
										value: n[s],
										className: 'w-auto',
										onChange: (f) => u(s, f.target.value),
										children: [
											s > 0 && U.jsx(xh, { value: '', children: '--' }),
											r.map((f) =>
												U.jsx(
													'option',
													{ value: f.key, children: gh(f.fieldName ?? f.key) },
													f.key,
												),
											),
										],
									}),
								],
							},
							c.label,
						),
					),
					!!n[1] &&
						U.jsxs('label', {
							className: 'flex items-center ms-6',
							children: [
								U.jsx(yh, { checked: a, onCheckedChange: o }),
								U.jsx('span', { className: 'ps-2', children: 'single y-axis' }),
							],
						}),
				],
			}),
		],
	});
}
Xy.propTypes = {
	fields: z.array,
	lineFields: z.array,
	setLineFields: z.func,
	singleY: z.bool,
	setSingleY: z.func,
	className: z.string,
};
function Yy(e) {
	const { className: t, refLines: r, setRefLines: n } = e,
		i = L.useMemo(() => {
			let s;
			return function (f) {
				clearTimeout(s), (s = setTimeout(() => o(f.target.value), 500));
			};
		}, [o]);
	function a(s, f) {
		const l = { ...r, [s]: f };
		n(l);
	}
	function o(s) {
		const f = s.split('|'),
			l = Number(f[0]),
			p = Number(f[f.length - 1]),
			h = f.slice(1, -1).map((d) => {
				const [v, y] = d.split('=').map(Number);
				return { field: v, value: y };
			});
		a('custom', { globalMessageNumber: l, labelField: p, conditions: h });
	}
	function u(s) {
		s.preventDefault(), o(s.target.custom.value);
	}
	return U.jsxs('div', {
		className: t,
		children: [
			U.jsx('h2', {
				className: 'text-lg font-medium text-slate-500 -mt-1 me-3',
				children: 'Show',
			}),
			U.jsxs('form', {
				className: 'flex flex-col gap-3',
				onSubmit: u,
				children: [
					Object.entries(r)
						.filter(([s]) => s !== 'custom')
						.map(([s, f]) =>
							U.jsxs(
								'label',
								{
									className: 'flex items-center',
									children: [
										U.jsx(yh, { checked: f, onCheckedChange: (l) => a(s, l) }),
										U.jsx('span', { className: 'ps-2', children: s }),
									],
								},
								s,
							),
						),
					Oi &&
						U.jsx('input', {
							type: 'text',
							name: 'custom',
							className: 'border border-gray-300 rounded-md',
							placeholder: 'msg|...cond|label',
							defaultValue: r.custom,
							onChange: i,
						}),
				],
			}),
		],
	});
}
Yy.propTypes = { refLines: z.object, setRefLines: z.func, className: z.string };
function F3(e) {
	const { laps: t, sessions: r } = e,
		n = [xs];
	return (
		(r == null ? void 0 : r.length) > 1 &&
			n.push(...r.map((i, a) => `session ${a}`)),
		(t == null ? void 0 : t.length) > 1 &&
			n.push(...t.map((i, a) => `lap ${a}`)),
		n
	);
}
function Zy(e) {
	const { className: t, filter: r, setFilter: n, data: i } = e,
		a = L.useMemo(() => F3(i), [i]);
	return U.jsxs('div', {
		className: t,
		children: [
			U.jsx('h2', {
				className: 'text-lg font-medium text-slate-500 -mt-1 me-3',
				children: 'Filter',
			}),
			U.jsx(bh, {
				value: r,
				className: 'w-28',
				onChange: (o) => n(o.target.value),
				children: a.map((o) => U.jsx(xh, { value: o, children: o }, o)),
			}),
		],
	});
}
Zy.propTypes = {
	filter: z.string,
	setFilter: z.func,
	data: z.object,
	className: z.string,
};
function Jy(e) {
	const { className: t, type: r, setType: n } = e,
		i = ['number', 'category'];
	return U.jsxs('div', {
		className: t,
		children: [
			U.jsx('h2', {
				className: 'text-lg font-medium text-slate-500 -mt-2 me-3',
				children: 'X axis type',
			}),
			U.jsx(im, {
				value: r,
				onValueChange: n,
				children: i.map((a) =>
					U.jsxs(
						'div',
						{
							className: 'flex items-center space-x-2',
							children: [
								U.jsx(am, { value: a, id: a }),
								U.jsx(vh, { htmlFor: a, children: a }),
							],
						},
						a,
					),
				),
			}),
		],
	});
}
Jy.propTypes = { type: z.string, setType: z.func, className: z.string };
function z3(e) {
	const { timestamp: t, record: r, ...n } = e;
	return { ...n, timestamp: t.fieldValue.toISOString() };
}
function Qy(e) {
	const { data: t } = e,
		{ filename: r } = mh();
	if (!(t != null && t.points)) return null;
	const n = () => JSON.stringify(t.points.map(z3), null, 2),
		i = () => new Blob([n()], { type: 'application/json' }),
		a = r.replace(/\.fit$/i, '-chart-data.json');
	return U.jsx(vm, {
		filename: a,
		getData: i,
		size: 'sm',
		className: 'no-underline',
		category: 'json',
		title: 'Download chart data as json',
		...e,
		children: U.jsx(ym, { className: 'text-red-500 h-4 w-4' }),
	});
}
Qy.propTypes = { data: z.object };
function U3(e) {
	const { events: t, laps: r, sessions: n, lengths: i } = e,
		a = {};
	return (
		(r == null ? void 0 : r.length) > 1 && (a.laps = !1),
		(n == null ? void 0 : n.length) > 1 && (a.sessions = !1),
		(i == null ? void 0 : i.length) > 0 && (a.lengths = !1),
		(t == null ? void 0 : t.length) > 0 && (a.events = !1),
		a
	);
}
function em(e) {
	var d;
	const { data: t } = e,
		{ fields: r, timedMessages: n } = t,
		[i, a] = Ss('lflds', [(d = r[0]) == null ? void 0 : d.key]),
		[o, u] = Ss('sy', !1),
		[c, s] = L.useState(U3(t)),
		[f, l] = L.useState(xs),
		[p, h] = L.useState('number');
	return U.jsxs('div', {
		className: 'h-full flex flex-col items-stretch',
		children: [
			Oi && U.jsx(Qy, { data: t, className: 'absolute top-0 right-12' }),
			U.jsx(Vy, {
				lineFields: i,
				singleY: o,
				data: t,
				refLines: c,
				filter: f,
				xType: p,
			}),
			U.jsxs('div', {
				className: 'flex flex-col md:flex-row  justify-around',
				children: [
					U.jsx(Xy, {
						className: 'flex m-5',
						fields: r,
						lineFields: i,
						setLineFields: a,
						singleY: o,
						setSingleY: u,
					}),
					U.jsx(Yy, {
						className: 'flex m-5',
						data: t,
						refLines: c,
						setRefLines: s,
						timedMessages: n,
					}),
					U.jsxs('div', {
						className: 'flex flex-col m-5',
						children: [
							U.jsx(Zy, {
								className: 'flex mb-8',
								data: t,
								filter: f,
								setFilter: l,
							}),
							U.jsx(Jy, { className: 'flex', type: p, setType: h }),
						],
					}),
				],
			}),
		],
	});
}
em.propTypes = { data: z.object.isRequired };
function W3(e) {
	return e
		? e == null
			? void 0
			: e
					.filter((t) => t.timestamp)
					.reduce(
						(t, r) => (
							(t[r.timestamp.rawFieldValue] = {
								gps_altitude: {
									...r.enhanced_altitude,
									fieldName: 'gps_altitude',
								},
								gps_speed: { ...r.enhanced_speed, fieldName: 'gps_peed' },
							}),
							t
						),
						{},
					)
		: null;
}
function q3(e) {
	const { className: t } = e,
		[r, n] = L.useState(!1),
		{ filename: i, fit: a, devMode: o } = mh(),
		u = fm.mesgNum.record,
		c =
			a == null
				? void 0
				: a.definitions.find((v) => v.globalMessageNumber === u),
		s = a && Zr(a.messages, 'gps_metadata'),
		f = a == null ? void 0 : a.mergedRecords,
		l = L.useCallback(() => {
			n((v) => (v || om('Open Chart'), !v));
		}, [n]);
	function p(v) {
		return v.key === 'timestamp' || v.units === 'semicircles'
			? !1
			: o || pm.includes(v.fieldType);
	}
	const h = L.useMemo(() => {
		var _, A, E;
		if (!f || f.length === 0) return null;
		const v = Zr(a.messages, 'event'),
			y =
				(_ = Zr(a.messages, 'lap')) == null
					? void 0
					: _.filter((P) => P.start_time),
			b =
				(A = Zr(a.messages, 'length')) == null
					? void 0
					: A.filter((P) => P.start_time && P.total_elapsed_time),
			w =
				(E = Zr(a.messages, 'session')) == null
					? void 0
					: E.filter((P) => P.start_time),
			x = f[0].timestamp.rawFieldValue,
			S = dm(f, c, a.developerFields, o).filter(p),
			m = f.map((P) => gm(P, S, o, x)),
			g = s == null ? void 0 : s[0];
		if (g) {
			const P = {
				gps_altitude: g.enhanced_altitude && {
					field: {
						...g.enhanced_altitude.field,
						key: 'gps_altitude',
						fieldName: 'gps_altitude',
					},
				},
				gps_speed: g.enhanced_speed && {
					field: {
						...g.enhanced_speed.field,
						key: 'gps_speed',
						fieldName: 'gps_speed',
					},
				},
			};
			S.push(
				...Object.values(P)
					.map((j) => (j == null ? void 0 : j.field))
					.filter(Boolean),
			);
			const T = W3(s);
			m.forEach((j) => {
				const C = T[j.timestamp.rawFieldValue];
				C &&
					((j.gps_altitude = zo(C.gps_altitude, o)),
					(j.gps_speed = zo(C.gps_speed, o)),
					(j.record = { ...j.record, ...P }));
			});
		}
		const O = {};
		return (
			a.definitions
				.filter((P) => {
					var T;
					return (T = P.fieldDefinitions) == null
						? void 0
						: T.some((j) => j.fieldDefinitionNumber === lm);
				})
				.forEach((P) => {
					O[P.globalMessageNumber] = a.messages[P.globalMessageNumber].filter(
						(T) => T.timestamp,
					);
				}),
			{
				tStart: x,
				points: m,
				fields: S,
				events: v,
				laps: y,
				sessions: w,
				lengths: b,
				timedMessages: O,
			}
		);
	}, [r, o, f]);
	if (!a || !f) return null;
	const d = U.jsx('div', {
		className: 'flex',
		children: U.jsx('h2', { className: 'p-2', children: i }),
	});
	return U.jsxs(U.Fragment, {
		children: [
			U.jsxs(um, {
				variant: 'outline',
				className: t,
				onClick: l,
				title: 'Show records in a chart',
				children: [
					U.jsx(mm, { className: 'text-red-500 h-6 w-6' }),
					U.jsx('span', { className: 'ms-2', children: 'Chart' }),
				],
			}),
			U.jsx(cm, {
				title: d,
				show: r,
				onHide: l,
				children: h && U.jsx(em, { data: h }),
			}),
		],
	});
}
q3.propTypes = { className: z.string };
export { q3 as default };
