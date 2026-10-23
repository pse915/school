//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, D());
			else {
				var t = n(l);
				t !== null && O(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function ee() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function E() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ee());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && O(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? D() : S = !1;
			}
		}
	}
	var D;
	if (typeof y == "function") D = function() {
		y(E);
	};
	else if (typeof MessageChannel < "u") {
		var te = new MessageChannel(), ne = te.port2;
		te.port1.onmessage = E, D = function() {
			ne.postMessage(null);
		};
	} else D = function() {
		_(E, 0);
	};
	function O(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, O(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, D()))), r;
	}, e.unstable_shouldYield = ee, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.for("react.view_transition"), m = Symbol.iterator;
	function h(e) {
		return typeof e != "object" || !e ? null : (e = m && e[m] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var g = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, _ = Object.assign, v = {};
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, y.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function b() {}
	b.prototype = y.prototype;
	function x(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var S = x.prototype = new b();
	S.constructor = x, _(S, y.prototype), S.isPureReactComponent = !0;
	var C = Array.isArray;
	function w() {}
	var T = {
		H: null,
		A: null,
		T: null,
		S: null
	}, ee = Object.prototype.hasOwnProperty;
	function E(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function D(e, t) {
		return E(e.type, t, e.props);
	}
	function te(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ne(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var O = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? ne("" + e.key) : t.toString(36);
	}
	function k(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(w, w) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ie(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ie(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, C(o) ? (i = "", c != null && (i = c.replace(O, "$&/") + "/"), ie(o, r, i, "", function(e) {
			return e;
		})) : o != null && (te(o) && (o = D(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(O, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (C(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += ie(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += ie(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ie(k(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function A(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ie(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function j(e) {
		if (e._status === -1) {
			var t = e._result, n = t();
			n.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t, n.status === void 0 && (n.status = "fulfilled", n.value = t));
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t, n.status === void 0 && (n.status = "rejected", n.reason = t));
			}), e._status === -1 && (e._status = 0, e._result = n);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var ae = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	};
	function oe(e) {
		var t = T.T, n = {};
		n.types = t === null ? null : t.types, T.T = n;
		try {
			var r = e(), i = T.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(w, ae);
		} catch (e) {
			ae(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), T.T = t;
		}
	}
	function se(e) {
		var t = T.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else oe(se.bind(null, e));
	}
	var ce = {
		map: A,
		forEach: function(e, t, n) {
			A(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return A(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return A(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!te(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = ce, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = T, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return T.H.useMemoCache(e);
		}
	}, e.addTransitionType = se, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !ee.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return E(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) ee.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return E(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = te, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: j
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = oe, e.unstable_useCacheRefresh = function() {
		return T.H.useCacheRefresh();
	}, e.use = function(e) {
		return T.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return T.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return T.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return T.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return T.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return T.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return T.H.useEffectEvent(e);
	}, e.useId = function() {
		return T.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return T.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return T.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return T.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return T.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return T.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return T.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return T.H.useRef(e);
	}, e.useState = function(e) {
		return T.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return T.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return T.H.useTransition();
	}, e.version = "19.3.0";
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = f();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal"), o = Symbol.for("react.recoverable"), s = Symbol.for("react.optimistic_key");
	function c(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : r === s ? s : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var l = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function u(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.browser = function(e) {
		return {
			$$typeof: o,
			_reason: e
		};
	}, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return c(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = l.T, n = i.p;
		try {
			if (l.T = null, i.p = 2, e) return e();
		} finally {
			l.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = u(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = u(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0,
						fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = u(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = u(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0,
					fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return l.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return l.H.useHostTransitionStatus();
	}, e.version = "19.3.0";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = u(), n = f(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		for (var t = e, n = t; n && !n.alternate;) t = n, t.flags & 4098 && (e = t.return), n = t.return;
		for (; t.return;) t = t.return;
		return t.tag === 3 ? e : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	function h(e, t, n, r, i, a) {
		for (; e !== null;) {
			if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && n(e, r, i, a) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && h(e.child, t, n, r, i, a)) return !0;
			e = e.sibling;
		}
		return !1;
	}
	function g(e) {
		for (e = e.return; e !== null;) {
			if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
			e = e.return;
		}
		return null;
	}
	function _(e) {
		var t = !1;
		for (e = e.return; e !== null && (e.tag === 4 && (t = !0), e.tag !== 3 && e.tag !== 5 && e.tag !== 27);) e = e.return;
		return t;
	}
	function v(e) {
		var t = [null, null], n = g(e);
		return n === null || y(t, e, n.child, { foundSelf: !1 }), t;
	}
	function y(e, t, n, r) {
		for (; n !== null;) {
			if (n === t) r.foundSelf = !0;
			else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
				if (r.foundSelf) return e[1] = n, !0;
				e[0] = n;
			} else if ((n.tag !== 22 || n.memoizedState === null) && y(e, t, n.child, r)) return !0;
			n = n.sibling;
		}
		return !1;
	}
	function b(e) {
		switch (e.tag) {
			case 5:
			case 27:
			case 6: return e.stateNode;
			case 3: return e.stateNode.containerInfo;
			default: throw Error(i(559));
		}
	}
	var x = null, S = null;
	function C(e, t, n) {
		return e === n || e === t && (x = e, !0);
	}
	function w(e, t, n) {
		return e === n ? (S = e, !1) : e === t && (S !== null && (x = e), !0);
	}
	function T(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function ee(e, t, n) {
		for (var r = 0, i = e; i; i = n(i)) r++;
		i = 0;
		for (var a = t; a; a = n(a)) i++;
		for (; 0 < r - i;) e = n(e), r--;
		for (; 0 < i - r;) t = n(t), i--;
		for (; r--;) {
			if (e === t || t !== null && e === t.alternate) return e;
			e = n(e), t = n(t);
		}
		return null;
	}
	var E = Object.assign, D = Symbol.for("react.element"), te = Symbol.for("react.transitional.element"), ne = Symbol.for("react.portal"), O = Symbol.for("react.fragment"), re = Symbol.for("react.strict_mode"), k = Symbol.for("react.profiler"), ie = Symbol.for("react.consumer"), A = Symbol.for("react.context"), j = Symbol.for("react.forward_ref"), ae = Symbol.for("react.suspense"), oe = Symbol.for("react.suspense_list"), se = Symbol.for("react.memo"), ce = Symbol.for("react.lazy"), le = Symbol.for("react.activity"), M = Symbol.for("react.legacy_hidden"), ue = Symbol.for("react.memo_cache_sentinel"), de = Symbol.for("react.view_transition"), fe = Symbol.for("react.recoverable"), pe = Symbol.iterator;
	function me(e) {
		return typeof e != "object" || !e ? null : (e = pe && e[pe] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var he = Symbol.for("react.client.reference");
	function ge(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === he ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case O: return "Fragment";
			case k: return "Profiler";
			case re: return "StrictMode";
			case ae: return "Suspense";
			case oe: return "SuspenseList";
			case le: return "Activity";
			case de: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case ne: return "Portal";
			case A: return e.displayName || "Context";
			case ie: return (e._context.displayName || "Context") + ".Consumer";
			case j:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case se: return t = e.displayName || null, t === null ? ge(e.type) || "Memo" : t;
			case ce:
				t = e._payload, e = e._init;
				try {
					return ge(e(t));
				} catch {}
		}
		return null;
	}
	var _e = Array.isArray, N = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, P = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ve = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ye = [], be = -1;
	function xe(e) {
		return { current: e };
	}
	function Se(e) {
		0 > be || (e.current = ye[be], ye[be] = null, be--);
	}
	function Ce(e, t) {
		be++, ye[be] = e.current, e.current = t;
	}
	var we = xe(null), Te = xe(null), Ee = xe(null), De = xe(null);
	function Oe(e, t) {
		switch (Ce(Ee, t), Ce(Te, e), Ce(we, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? fp(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = fp(t), e = pp(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		Se(we), Ce(we, e);
	}
	function ke() {
		Se(we), Se(Te), Se(Ee);
	}
	function Ae(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, Ce(De, e)), t = we.current;
		var n = pp(t, e.type);
		t !== n && (Ce(Te, e), Ce(we, n));
	}
	function je(e) {
		Te.current === e && (Se(we), Se(Te)), De.current === e && (Se(De), sh._currentValue = ve);
	}
	var Me, Ne;
	function Pe(e) {
		if (Me === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Me = t && t[1] || "", Ne = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Me + e + Ne;
	}
	var Fe = !1;
	function Ie(e, t) {
		if (!e || Fe) return "";
		Fe = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							n = !1;
							try {
								var i = Object.getOwnPropertyDescriptor(e.prototype, "props");
								Object.defineProperty(e.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								}), n = !0, new e();
							} finally {
								n && (i === void 0 ? delete e.prototype.props : Object.defineProperty(e.prototype, "props", i));
							}
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Fe = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Pe(n) : "";
	}
	function Le(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Pe(e.type);
			case 16: return Pe("Lazy");
			case 13: return e.child !== t && t !== null ? Pe("Suspense Fallback") : Pe("Suspense");
			case 19: return Pe("SuspenseList");
			case 0:
			case 15: return Ie(e.type, !1);
			case 11: return Ie(e.type.render, !1);
			case 1: return Ie(e.type, !0);
			case 31: return Pe("Activity");
			case 30: return Pe("ViewTransition");
			default: return "";
		}
	}
	function Re(e) {
		try {
			var t = "", n = null;
			do
				t += Le(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var ze = Object.prototype.hasOwnProperty, Be = t.unstable_scheduleCallback, Ve = t.unstable_cancelCallback, He = t.unstable_shouldYield, Ue = t.unstable_requestPaint, We = t.unstable_now, Ge = t.unstable_getCurrentPriorityLevel, Ke = t.unstable_ImmediatePriority, qe = t.unstable_UserBlockingPriority, Je = t.unstable_NormalPriority, Ye = t.unstable_LowPriority, Xe = t.unstable_IdlePriority, Ze = t.log, Qe = t.unstable_setDisableYieldValue, $e = null, et = null;
	function tt(e) {
		if (typeof Ze == "function" && Qe(e), et && typeof et.setStrictMode == "function") try {
			et.setStrictMode($e, e);
		} catch {}
	}
	var nt = Math.clz32 ? Math.clz32 : at, rt = Math.log, it = Math.LN2;
	function at(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (rt(e) / it | 0) | 0;
	}
	var ot = 256, st = 262144, ct = 4194304;
	function lt(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & -e;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function ut(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = lt(n))) : i = lt(o) : i = lt(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = lt(n))) : i = lt(o)) : i = lt(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function dt(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function ft(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - nt(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function pt(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
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
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function mt() {
		var e = ct;
		return ct <<= 1, !(ct & 62914560) && (ct = 4194304), e;
	}
	function ht(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function gt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function _t(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - nt(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && vt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function vt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - nt(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function yt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - nt(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function bt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : xt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function xt(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
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
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function St(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function Ct() {
		var e = P.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function wt(e, t) {
		var n = P.p;
		try {
			return P.p = e, t();
		} finally {
			P.p = n;
		}
	}
	var Tt = Math.random().toString(36).slice(2), F = "__reactFiber$" + Tt, Et = "__reactProps$" + Tt, Dt = "__reactContainer$" + Tt, Ot = "__reactEvents$" + Tt, kt = "__reactListeners$" + Tt, At = "__reactHandles$" + Tt, jt = "__reactResources$" + Tt, Mt = "__reactMarker$" + Tt, Nt = "__reactLoad$" + Tt;
	function Pt(e) {
		delete e[F], delete e[Et], delete e[kt], delete e[At];
	}
	function Ft(e) {
		var t;
		if (t = e[F]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Dt] || n[F]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[F]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function It(e) {
		if (e = e[F] || e[Dt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Lt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Rt(e) {
		var t = e[jt];
		return t ||= e[jt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function zt(e) {
		e[Mt] = !0;
	}
	function Bt(e) {
		e[Nt] = void 0;
	}
	var Vt = /* @__PURE__ */ new Set(), Ht = {};
	function Ut(e, t) {
		Wt(e, t), Wt(e + "Capture", t);
	}
	function Wt(e, t) {
		for (Ht[e] = t, e = 0; e < t.length; e++) Vt.add(t[e]);
	}
	var Gt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Kt = {}, qt = {};
	function Jt(e) {
		return ze.call(qt, e) ? !0 : ze.call(Kt, e) ? !1 : Gt.test(e) ? qt[e] = !0 : (Kt[e] = !0, !1);
	}
	var I = !1;
	function Yt() {
		var e = I;
		return I = !1, e;
	}
	function Xt(e, t, n) {
		if (Jt(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, n);
			}
		}
	}
	function Zt(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, n);
		}
	}
	function Qt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, r);
		}
	}
	function $t(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function en(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function tn(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function nn(e) {
		if (!e._valueTracker) {
			var t = en(e) ? "checked" : "value";
			e._valueTracker = tn(e, t, "" + e[t]);
		}
	}
	function rn(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = en(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var an = /[\n"\\]/g;
	function on(e) {
		return e.replace(an, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function sn(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + $t(t)) : e.value !== "" + $t(t) && (e.value = "" + $t(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : ln(e, $t(n)) : o === "number" && e.value == t ? ln(e, $t(e.value)) : ln(e, $t(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + $t(s) : e.removeAttribute("name");
	}
	function cn(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				nn(e);
				return;
			}
			n = n == null ? "" : "" + $t(n), t = t == null ? n : "" + $t(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), nn(e);
	}
	function ln(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function un(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + $t(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function dn(e, t, n) {
		t != null && (t = "" + $t(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + $t(n);
	}
	function fn(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (_e(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = $t(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), nn(e);
	}
	function pn(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var mn = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function hn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || mn.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function gn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", I = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (hn(e, a, r), I = !0);
		} else for (var o in t) t.hasOwnProperty(o) && hn(e, o, t[o]);
	}
	function _n(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var vn = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), yn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function bn(e) {
		return yn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function xn() {}
	var Sn = null;
	function Cn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var wn = null, Tn = null;
	function En(e) {
		var t = It(e);
		if (t && (e = t.stateNode)) {
			var n = e[Et] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (sn(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + on("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[Et] || null;
								if (!a) throw Error(i(90));
								sn(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && rn(r);
					}
					break a;
				case "textarea":
					dn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && un(e, !!n.multiple, t, !1);
			}
		}
	}
	var Dn = !1;
	function On(e, t, n) {
		if (Dn) return e(t, n);
		Dn = !0;
		try {
			return e(t);
		} finally {
			if (Dn = !1, (wn !== null || Tn !== null) && (Ud(), wn && (t = wn, e = Tn, Tn = wn = null, En(t), e))) for (t = 0; t < e.length; t++) En(e[t]);
		}
	}
	function kn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[Et] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
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
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var An = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, jn = !1;
	if (An) try {
		var Mn = {};
		Object.defineProperty(Mn, "passive", { get: function() {
			jn = !0;
		} }), window.addEventListener("test", Mn, Mn), window.removeEventListener("test", Mn, Mn);
	} catch {
		jn = !1;
	}
	var Nn = null, Pn = null, Fn = null;
	function In() {
		if (Fn) return Fn;
		var e, t = Pn, n = t.length, r, i = "value" in Nn ? Nn.value : Nn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Fn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Ln(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Rn() {
		return !0;
	}
	function zn() {
		return !1;
	}
	function Bn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Rn : zn, this.isPropagationStopped = zn, this;
		}
		return E(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Rn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Rn);
			},
			persist: function() {},
			isPersistent: Rn
		}), t;
	}
	var Vn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Hn = Bn(Vn), Un = E({}, Vn, {
		view: 0,
		detail: 0
	}), Wn = Bn(Un), Gn, Kn, qn, Jn = E({}, Un, {
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
		getModifierState: ar,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== qn && (qn && e.type === "mousemove" ? (Gn = e.screenX - qn.screenX, Kn = e.screenY - qn.screenY) : Kn = Gn = 0, qn = e), Gn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Kn;
		}
	}), Yn = Bn(Jn), Xn = Bn(E({}, Jn, { dataTransfer: 0 })), Zn = Bn(E({}, Un, { relatedTarget: 0 })), Qn = Bn(E({}, Vn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), $n = Bn(E({}, Vn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), er = Bn(E({}, Vn, { data: 0 })), tr = {
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
		MozPrintableKey: "Unidentified"
	}, nr = {
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
		224: "Meta"
	}, rr = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function ir(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = rr[e]) ? !!t[e] : !1;
	}
	function ar() {
		return ir;
	}
	var or = Bn(E({}, Un, {
		key: function(e) {
			if (e.key) {
				var t = tr[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Ln(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? nr[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: ar,
		charCode: function(e) {
			return e.type === "keypress" ? Ln(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Ln(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), sr = Bn(E({}, Jn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), cr = Bn(E({}, Vn, { submitter: 0 })), lr = Bn(E({}, Un, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: ar
	})), ur = Bn(E({}, Vn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), dr = Bn(E({}, Jn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), fr = Bn(E({}, Vn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), pr = [
		9,
		13,
		27,
		32
	], mr = An && "CompositionEvent" in window, hr = null;
	An && "documentMode" in document && (hr = document.documentMode);
	var gr = An && "TextEvent" in window && !hr, _r = An && (!mr || hr && 8 < hr && 11 >= hr), vr = " ", yr = !1;
	function br(e, t) {
		switch (e) {
			case "keyup": return pr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function xr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Sr = !1;
	function Cr(e, t) {
		switch (e) {
			case "compositionend": return xr(t);
			case "keypress": return t.which === 32 ? (yr = !0, vr) : null;
			case "textInput": return e = t.data, e === vr && yr ? null : e;
			default: return null;
		}
	}
	function wr(e, t) {
		if (Sr) return e === "compositionend" || !mr && br(e, t) ? (e = In(), Fn = Pn = Nn = null, Sr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return _r && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var Tr = {
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
		week: !0
	};
	function Er(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!Tr[e.type] : t === "textarea";
	}
	function Dr(e, t, n, r) {
		wn ? Tn ? Tn.push(r) : Tn = [r] : wn = r, t = Yf(t, "onChange"), 0 < t.length && (n = new Hn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var Or = null, kr = null;
	function Ar(e) {
		X(e, 0);
	}
	function jr(e) {
		if (rn(Lt(e))) return e;
	}
	function Mr(e, t) {
		if (e === "change") return t;
	}
	var Nr = !1;
	if (An) {
		var Pr;
		if (An) {
			var Fr = "oninput" in document;
			if (!Fr) {
				var Ir = document.createElement("div");
				Ir.setAttribute("oninput", "return;"), Fr = typeof Ir.oninput == "function";
			}
			Pr = Fr;
		} else Pr = !1;
		Nr = Pr && (!document.documentMode || 9 < document.documentMode);
	}
	function Lr() {
		Or && (Or.detachEvent("onpropertychange", Rr), kr = Or = null);
	}
	function Rr(e) {
		if (e.propertyName === "value" && jr(kr)) {
			var t = [];
			Dr(t, kr, e, Cn(e)), On(Ar, t);
		}
	}
	function zr(e, t, n) {
		e === "focusin" ? (Lr(), Or = t, kr = n, Or.attachEvent("onpropertychange", Rr)) : e === "focusout" && Lr();
	}
	function Br(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return jr(kr);
	}
	function Vr(e, t) {
		if (e === "click") return jr(t);
	}
	function Hr(e, t) {
		if (e === "input" || e === "change") return jr(t);
	}
	function Ur(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Wr = typeof Object.is == "function" ? Object.is : Ur;
	function Gr(e, t) {
		if (Wr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!ze.call(t, i) || !Wr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Kr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function qr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Jr(e, t) {
		var n = qr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = qr(n);
		}
	}
	function Yr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Yr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Xr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Kr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Kr(e.document);
		}
		return t;
	}
	function Zr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Qr = An && "documentMode" in document && 11 >= document.documentMode, $r = null, ei = null, ti = null, ni = !1;
	function ri(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		ni || $r == null || $r !== Kr(r) || (r = $r, "selectionStart" in r && Zr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), ti && Gr(ti, r) || (ti = r, r = Yf(ei, "onSelect"), 0 < r.length && (t = new Hn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = $r)));
	}
	function ii(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var ai = {
		animationend: ii("Animation", "AnimationEnd"),
		animationiteration: ii("Animation", "AnimationIteration"),
		animationstart: ii("Animation", "AnimationStart"),
		transitionrun: ii("Transition", "TransitionRun"),
		transitionstart: ii("Transition", "TransitionStart"),
		transitioncancel: ii("Transition", "TransitionCancel"),
		transitionend: ii("Transition", "TransitionEnd")
	}, oi = {}, si = {};
	An && (si = document.createElement("div").style, "AnimationEvent" in window || (delete ai.animationend.animation, delete ai.animationiteration.animation, delete ai.animationstart.animation), "TransitionEvent" in window || delete ai.transitionend.transition);
	function ci(e) {
		if (oi[e]) return oi[e];
		if (!ai[e]) return e;
		var t = ai[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in si) return oi[e] = t[n];
		return e;
	}
	var li = ci("animationend"), ui = ci("animationiteration"), di = ci("animationstart"), fi = ci("transitionrun"), pi = ci("transitionstart"), mi = ci("transitioncancel"), hi = ci("transitionend"), gi = /* @__PURE__ */ new Map(), _i = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	_i.push("scrollEnd");
	function vi(e, t) {
		gi.set(e, t), Ut(t, [e]);
	}
	var yi = 0;
	function bi(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = wd.identifierPrefix;
		var n = yi++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function xi(e) {
		if (e == null || typeof e == "string") return e;
		var t = null, n = Md;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = e[n[r]];
			if (i != null) {
				if (i === "none") return "none";
				t = t == null ? i : t + (" " + i);
			}
		}
		return t ?? e.default;
	}
	function Si(e, t) {
		return e = xi(e), t = xi(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var Ci = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, wi = [], Ti = 0, Ei = 0;
	function Di() {
		for (var e = Ti, t = Ei = Ti = 0; t < e;) {
			var n = wi[t];
			wi[t++] = null;
			var r = wi[t];
			wi[t++] = null;
			var i = wi[t];
			wi[t++] = null;
			var a = wi[t];
			if (wi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ji(n, i, a);
		}
	}
	function Oi(e, t, n, r) {
		wi[Ti++] = e, wi[Ti++] = t, wi[Ti++] = n, wi[Ti++] = r, Ei |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ki(e, t, n, r) {
		return Oi(e, t, n, r), Mi(e);
	}
	function Ai(e, t) {
		return Oi(e, null, null, t), Mi(e);
	}
	function ji(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - nt(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Mi(e) {
		if (50 < Nd) throw Nd = 0, Pd = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Ni = {};
	function Pi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Fi(e, t, n, r) {
		return new Pi(e, t, n, r);
	}
	function Ii(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Li(e, t) {
		var n = e.alternate;
		return n === null ? (n = Fi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Ri(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function zi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") Ii(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, we.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case le: return e = Fi(31, n, t, a), e.elementType = le, e.lanes = o, e;
			case O: return Bi(n.children, a, o, t);
			case re:
				s = 8, a |= 24;
				break;
			case k: return e = Fi(12, n, t, a | 2), e.elementType = k, e.lanes = o, e;
			case ae: return e = Fi(13, n, t, a), e.elementType = ae, e.lanes = o, e;
			case oe: return e = Fi(19, n, t, a), e.elementType = oe, e.lanes = o, e;
			case M:
			case de: return e = a | 32, e = Fi(30, n, t, e), e.elementType = de, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case A:
						s = 10;
						break a;
					case ie:
						s = 9;
						break a;
					case j:
						s = 11;
						break a;
					case se:
						s = 14;
						break a;
					case ce:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = Fi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Bi(e, t, n, r) {
		return e = Fi(7, e, r, t), e.lanes = n, e;
	}
	function Vi(e, t, n) {
		return e = Fi(6, e, null, t), e.lanes = n, e;
	}
	function Hi(e) {
		var t = Fi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Ui(e, t, n) {
		return t = Fi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Wi = /* @__PURE__ */ new WeakMap();
	function Gi(e, t) {
		if (typeof e == "object" && e) {
			var n = Wi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Re(t)
			}, Wi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Re(t)
		};
	}
	var Ki = [], qi = 0, Ji = null, Yi = 0, Xi = [], Zi = 0, Qi = null, $i = 1, ea = "";
	function ta(e, t) {
		Ki[qi++] = Yi, Ki[qi++] = Ji, Ji = e, Yi = t;
	}
	function na(e, t, n) {
		Xi[Zi++] = $i, Xi[Zi++] = ea, Xi[Zi++] = Qi, Qi = e;
		var r = $i;
		e = ea;
		var i = 32 - nt(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - nt(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, $i = 1 << 32 - nt(t) + i | n << i | r, ea = a + e;
		} else $i = 1 << a | n << i | r, ea = e;
	}
	function ra(e) {
		e.return !== null && (ta(e, 1), na(e, 1, 0));
	}
	function ia(e) {
		for (; e === Ji;) Ji = Ki[--qi], Ki[qi] = null, Yi = Ki[--qi], Ki[qi] = null;
		for (; e === Qi;) Qi = Xi[--Zi], Xi[Zi] = null, ea = Xi[--Zi], Xi[Zi] = null, $i = Xi[--Zi], Xi[Zi] = null;
	}
	function aa(e, t) {
		Xi[Zi++] = $i, Xi[Zi++] = ea, Xi[Zi++] = Qi, $i = t.id, ea = t.overflow, Qi = e;
	}
	var oa = null, sa = null, L = !1, ca = null, la = !1, ua = Error(i(519));
	function da(e) {
		throw _a(Gi(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ua;
	}
	function fa(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[F] = e, t[Et] = r, n) {
			case "dialog":
				Z("cancel", t), Z("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Z("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < Vf.length; n++) Z(Vf[n], t);
				break;
			case "source":
				Z("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Z("error", t), Z("load", t);
				break;
			case "details":
				Z("toggle", t);
				break;
			case "input":
				Z("invalid", t), cn(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Z("invalid", t);
				break;
			case "textarea": Z("invalid", t), fn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || tp(t.textContent, n) ? (r.popover != null && (Z("beforetoggle", t), Z("toggle", t)), r.onScroll != null && Z("scroll", t), r.onScrollEnd != null && Z("scrollend", t), r.onClick != null && (t.onclick = xn), t = !0) : t = !1, t || da(e, !0);
	}
	function pa(e) {
		for (oa = e.return; oa;) switch (oa.tag) {
			case 5:
			case 31:
			case 13:
				la = !1;
				return;
			case 27:
			case 3:
				la = !0;
				return;
			default: oa = oa.return;
		}
	}
	function ma(e) {
		if (e !== oa) return !1;
		if (!L) return pa(e), L = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || $(e.type, e.memoizedProps)), n = !n), n && sa && da(e), pa(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			sa = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			sa = dm(e);
		} else t === 27 ? (t = sa, Sp(e.type) ? (e = um, um = null, sa = e) : sa = t) : sa = oa ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ha() {
		sa = oa = null, L = !1;
	}
	function ga() {
		var e = ca;
		return e !== null && (gd === null ? gd = e : gd.push.apply(gd, e), ca = null), e;
	}
	function _a(e) {
		ca === null ? ca = [e] : ca.push(e);
	}
	var va = xe(null), ya = null, ba = null;
	function xa(e, t, n) {
		Ce(va, t._currentValue), t._currentValue = n;
	}
	function Sa(e) {
		e._currentValue = va.current, Se(va);
	}
	function Ca(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function wa(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ca(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ca(s, n, e), s = null;
			} else a.tag === 13 && a.memoizedState !== null && a.memoizedState.dehydrated === null ? (a.lanes |= n, s = a.alternate, s !== null && (s.lanes |= n), Ca(a.return, n, e), s = a.child, s = s === null ? null : s.sibling) : s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Ta(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					Wr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === De.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && wa(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function Ea(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Wr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Da(e) {
		ya = e, ba = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function Oa(e) {
		return Aa(ya, e);
	}
	function ka(e, t) {
		return ya === null && Da(e), Aa(e, t);
	}
	function Aa(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, ba === null) {
			if (e === null) throw Error(i(308));
			ba = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else ba = ba.next = t;
		return n;
	}
	var ja = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, Ma = t.unstable_scheduleCallback, Na = t.unstable_NormalPriority, Pa = {
		$$typeof: A,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Fa() {
		return {
			controller: new ja(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function Ia(e) {
		e.refCount--, e.refCount === 0 && Ma(Na, function() {
			e.controller.abort();
		});
	}
	function La(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Ra = null;
	function za(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Ba = null, Va = 0, Ha = 0, Ua = null;
	function Wa(e, t) {
		if (Ba === null) {
			var n = Ba = [];
			Va = 0, Ha = If(), Ua = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Va++, t.then(Ga, Ga), t;
	}
	function Ga() {
		if (--Va === 0 && (Ra = null, Ba !== null)) {
			Ua !== null && (Ua.status = "fulfilled");
			var e = Ba;
			Ba = null, Ha = 0, Ua = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function Ka(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var qa = N.S;
	N.S = function(e, t) {
		if (yd = We(), typeof t == "object" && t && typeof t.then == "function" && Wa(e, t), Ra !== null) for (var n = wf; n !== null;) La(n, Ra), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = wf; r !== null;) La(r, n), r = r.next;
			if (Ha !== 0) {
				r = Ra, r === null && (r = Ra = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		qa !== null && qa(e, t);
	};
	var Ja = xe(null);
	function Ya() {
		var e = Ja.current;
		return e === null ? id.pooledCache : e;
	}
	function Xa(e, t) {
		t === null ? Ce(Ja, Ja.current) : Ce(Ja, t.pool);
	}
	function Za() {
		var e = Ya();
		return e === null ? null : {
			parent: Pa._currentValue,
			pool: e
		};
	}
	var Qa = Error(i(460)), $a = Error(i(474)), eo = Error(i(542)), to = { then: function() {} };
	function no(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function ro(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(xn, xn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, so(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(xn, xn);
				else {
					if (e = id, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, so(e), e;
				}
				throw ao = t, Qa;
		}
	}
	function io(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (ao = e, Qa) : e;
		}
	}
	var ao = null;
	function oo() {
		if (ao === null) throw Error(i(459));
		var e = ao;
		return ao = null, e;
	}
	function so(e) {
		if (e === Qa || e === eo) throw Error(i(483));
	}
	var co = null, lo = 0;
	function uo(e) {
		var t = lo;
		return lo += 1, co === null && (co = []), ro(co, e, t);
	}
	function fo(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function po(e, t) {
		throw t.$$typeof === D ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function mo(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = Li(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Vi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === O ? (e = d(e, t, n.props.children, r, n.key), fo(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === ce && io(i) === t.type) ? (t = a(t, n.props), fo(t, n), t.return = e, t) : (t = zi(n.type, n.key, n.props, null, e.mode, r), fo(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Ui(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Bi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Vi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case te: return n = zi(t.type, t.key, t.props, null, e.mode, n), fo(n, t), n.return = e, n;
					case ne: return t = Ui(t, e.mode, n), t.return = e, t;
					case ce: return t = io(t), f(e, t, n);
				}
				if (_e(t) || me(t)) return t = Bi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, uo(t), n);
				if (t.$$typeof === A) return f(e, ka(e, t), n);
				po(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case te: return n.key === i ? l(e, t, n, r) : null;
					case ne: return n.key === i ? u(e, t, n, r) : null;
					case ce: return n = io(n), p(e, t, n, r);
				}
				if (_e(n) || me(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, uo(n), r);
				if (n.$$typeof === A) return p(e, t, ka(e, n), r);
				po(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case te: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case ne: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case ce: return r = io(r), m(e, t, n, r, i);
				}
				if (_e(r) || me(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, uo(r), i);
				if (r.$$typeof === A) return m(e, t, n, ka(t, r), i);
				po(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), L && ta(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return L && ta(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), L && ta(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), L && ta(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return L && ta(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), L && ta(a, g), u;
		}
		function _(e, r, o, c) {
			if (typeof o == "object" && o && o.type === O && o.key === null && o.props.ref === void 0 && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case te:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === O) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), fo(c, o), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === ce && io(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), fo(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === O ? (c = Bi(o.props.children, e.mode, c, o.key), fo(c, o), c.return = e, e = c) : (c = zi(o.type, o.key, o.props, null, e.mode, c), fo(c, o), c.return = e, e = c);
						}
						return s(e);
					case ne:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = Ui(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case ce: return o = io(o), _(e, r, o, c);
				}
				if (_e(o)) return h(e, r, o, c);
				if (me(o)) {
					if (l = me(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, uo(o), c);
				if (o.$$typeof === A) return _(e, r, ka(e, o), c);
				po(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Vi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				lo = 0;
				var i = _(e, t, n, r);
				return co = null, i;
			} catch (t) {
				if (t === Qa || t === eo) throw t;
				var a = Fi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var ho = mo(!0), go = mo(!1), _o = !1;
	function vo(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function yo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function bo(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function xo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, H & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Mi(e), ji(e, null, n), t;
		}
		return Oi(e, r, t, n), Mi(e);
	}
	function So(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, yt(e, n);
		}
	}
	function Co(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
		} else e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var wo = !1;
	function To() {
		if (wo) {
			var e = Ua;
			if (e !== null) throw e;
		}
	}
	function Eo(e, t, n, r) {
		wo = !1;
		var i = e.updateQueue;
		_o = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (W & f) === f : (r & f) === f) {
					f !== 0 && f === Ha && (wo = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, h = s;
						f = t;
						var g = n;
						switch (h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(g, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(g, d, f) : m, f == null) break a;
								d = E({}, d, f);
								break a;
							case 2: _o = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), ud |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Do(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Oo(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Do(n[e], t);
	}
	var ko = xe(null), Ao = xe(0);
	function jo(e, t) {
		e = ld, Ce(Ao, e), Ce(ko, t), ld = e | t.baseLanes;
	}
	function Mo() {
		Ce(Ao, ld), Ce(ko, ko.current);
	}
	function No() {
		ld = Ao.current, Se(ko), Se(Ao);
	}
	var Po = xe(null), Fo = null;
	function Io(e) {
		var t = e.alternate;
		Ce(Vo, Vo.current & 1), Ce(Po, e), Fo === null && (t === null || ko.current !== null || t.memoizedState !== null) && (Fo = e);
	}
	function Lo(e) {
		Ce(Vo, Vo.current), Ce(Po, e), Fo === null && (Fo = e);
	}
	function Ro(e) {
		e.tag === 22 ? (Ce(Vo, Vo.current), Ce(Po, e), Fo === null && (Fo = e)) : zo();
	}
	function zo() {
		Ce(Vo, Vo.current), Ce(Po, Po.current);
	}
	function Bo(e) {
		Se(Po), Fo === e && (Fo = null), Se(Vo);
	}
	var Vo = xe(0);
	function Ho(e, t) {
		Ce(Po, Po.current), Ce(Vo, t);
	}
	function Uo(e) {
		Se(Vo), Se(Po), Fo === e && (Fo = null);
	}
	function Wo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || om(n) || sm(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Go = 0, R = null, Ko = null, qo = null, Jo = !1, Yo = !1, Xo = !1, Zo = 0, Qo = 0, $o = null, es = 0;
	function ts() {
		throw Error(i(321));
	}
	function ns(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Wr(e[n], t[n])) return !1;
		return !0;
	}
	function rs(e, t, n, r, i, a) {
		return Go = a, R = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, N.H = e === null || e.memoizedState === null ? bc : xc, Xo = !1, a = n(r, i), Xo = !1, Yo && (a = as(t, n, r, i)), is(e), a;
	}
	function is(e) {
		N.H = yc;
		var t = Ko !== null && Ko.next !== null;
		if (Go = 0, qo = Ko = R = null, Jo = !1, Qo = 0, $o = null, t) throw Error(i(300));
		e === null || Rc || (e = e.dependencies, e !== null && Ea(e) && (Rc = !0));
	}
	function as(e, t, n, r) {
		R = e;
		var a = 0;
		do {
			if (Yo && ($o = null), Qo = 0, Yo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, qo = Ko = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			N.H = Sc, o = t(n, r);
		} while (Yo);
		return o;
	}
	function os() {
		var e = N.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? ps(t) : t, e = e.useState()[0], (Ko === null ? null : Ko.memoizedState) !== e && (R.flags |= 1024), t;
	}
	function ss() {
		var e = Zo !== 0;
		return Zo = 0, e;
	}
	function cs(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function ls(e) {
		if (Jo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Jo = !1;
		}
		Go = 0, qo = Ko = R = null, Yo = !1, Qo = Zo = 0, $o = null;
	}
	function us() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return qo === null ? R.memoizedState = qo = e : qo = qo.next = e, qo;
	}
	function ds() {
		if (Ko === null) {
			var e = R.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = Ko.next;
		var t = qo === null ? R.memoizedState : qo.next;
		if (t !== null) qo = t, Ko = e;
		else {
			if (e === null) throw R.alternate === null ? Error(i(467)) : Error(i(310));
			Ko = e, e = {
				memoizedState: Ko.memoizedState,
				baseState: Ko.baseState,
				baseQueue: Ko.baseQueue,
				queue: Ko.queue,
				next: null
			}, qo === null ? R.memoizedState = qo = e : qo = qo.next = e;
		}
		return qo;
	}
	function fs() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function ps(e) {
		var t = Qo;
		return Qo += 1, $o === null && ($o = []), e = ro($o, e, t), t = R, (qo === null ? t.memoizedState : qo.next) === null && (t = t.alternate, N.H = t === null || t.memoizedState === null ? bc : xc), e;
	}
	function ms(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return ps(e);
			if (e.$$typeof === fe) return;
			if (e.$$typeof === A) return Oa(e);
		}
		throw Error(i(438, String(e)));
	}
	function hs(e) {
		var t = null, n = R.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = R.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = fs(), R.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ue;
		return t.index++, n;
	}
	function gs(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function _s(e) {
		return vs(ds(), Ko, e);
	}
	function vs(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (Go & f) === f : (W & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Ha && (d = !0);
					else if ((Go & p) === p) {
						u = u.next, p === Ha && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, R.lanes |= p, ud |= p;
					f = u.action, Xo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, R.lanes |= f, ud |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Wr(o, e.memoizedState) && (Rc = !0, d && (n = Ua, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function ys(e) {
		var t = ds(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Wr(o, t.memoizedState) || (Rc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function bs(e, t, n) {
		var r = R, a = ds(), o = L;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Wr((Ko || a).memoizedState, n);
		if (s && (a.memoizedState = n, Rc = !0), a = a.queue, Gs(Cs.bind(null, r, a, e), [e]), e = a.getSnapshot !== t || s || qo !== null && !!(qo.memoizedState.tag & 1), Bs(e ? 9 : 8, { destroy: void 0 }, Ss.bind(null, r, a, n, t), null), e) {
			if (r.flags |= 2048, id === null) throw Error(i(349));
			o || Go & 127 || xs(r, t, n);
		}
		return n;
	}
	function xs(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = R.updateQueue, t === null ? (t = fs(), R.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Ss(e, t, n, r) {
		t.value = n, t.getSnapshot = r, ws(t) && Ts(e);
	}
	function Cs(e, t, n) {
		return n(function() {
			ws(t) && Ts(e);
		});
	}
	function ws(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Wr(e, n);
		} catch {
			return !0;
		}
	}
	function Ts(e) {
		var t = Ai(e, 2);
		t !== null && Rd(t, e, 2);
	}
	function Es(e) {
		var t = us();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Xo) {
				tt(!0);
				try {
					n();
				} finally {
					tt(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: gs,
			lastRenderedState: e
		}, t;
	}
	function Ds(e, t, n, r) {
		return e.baseState = n, vs(e, Ko, typeof r == "function" ? r : gs);
	}
	function Os(e, t, n, r, a) {
		if (gc(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			N.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, ks(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function ks(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = N.T, o = {};
			o.types = a === null ? null : a.types, N.T = o;
			try {
				var s = n(i, r), c = N.S;
				c !== null && c(o, s), As(e, t, s);
			} catch (n) {
				Ms(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), N.T = a;
			}
		} else try {
			a = n(i, r), As(e, t, a);
		} catch (n) {
			Ms(e, t, n);
		}
	}
	function As(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			js(e, t, n);
		}, function(n) {
			return Ms(e, t, n);
		}) : js(e, t, n);
	}
	function js(e, t, n) {
		t.status = "fulfilled", t.value = n, Ns(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, ks(e, n)));
	}
	function Ms(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Ns(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Ns(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Ps(e, t) {
		return t;
	}
	function Fs(e, t) {
		if (L) {
			var n = id.formState;
			if (n !== null) {
				a: {
					var r = R;
					if (L) {
						if (sa) {
							b: {
								for (var i = sa, a = la; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								sa = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						da(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = us(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ps,
			lastRenderedState: t
		}, n.queue = r, n = pc.bind(null, R, r), r.dispatch = n, r = Es(!1), a = hc.bind(null, R, !1, r.queue), r = us(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Os.bind(null, R, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Is(e) {
		return Ls(ds(), Ko, e);
	}
	function Ls(e, t, n) {
		if (t = vs(e, t, Ps)[0], e = _s(gs)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = ps(t);
		} catch (e) {
			throw e === Qa ? eo : e;
		}
		else r = t;
		t = ds();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (R.flags |= 2048, Bs(9, { destroy: void 0 }, Rs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Rs(e, t) {
		e.action = t;
	}
	function zs(e) {
		var t = ds(), n = Ko;
		if (n !== null) return Ls(t, n, e);
		ds(), t = t.memoizedState, n = ds();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function Bs(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = R.updateQueue, t === null && (t = fs(), R.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Vs() {
		return ds().memoizedState;
	}
	function Hs(e, t, n, r) {
		var i = us();
		R.flags |= e, i.memoizedState = Bs(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Us(e, t, n, r) {
		var i = ds();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		Ko !== null && r !== null && ns(r, Ko.memoizedState.deps) ? i.memoizedState = Bs(t, a, n, r) : (R.flags |= e, i.memoizedState = Bs(1 | t, a, n, r));
	}
	function Ws(e, t) {
		Hs(8390656, 8, e, t);
	}
	function Gs(e, t) {
		Us(2048, 8, e, t);
	}
	function Ks(e) {
		R.flags |= 4;
		var t = R.updateQueue;
		if (t === null) t = fs(), R.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function qs(e) {
		var t = ds().memoizedState;
		return Ks({
			ref: t,
			nextImpl: e
		}), function() {
			if (H & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Js(e, t) {
		return Us(4, 2, e, t);
	}
	function Ys(e, t) {
		return Us(4, 4, e, t);
	}
	function Xs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function Zs(e, t, n) {
		n = n == null ? null : n.concat([e]), Us(4, 4, Xs.bind(null, t, e), n);
	}
	function Qs() {}
	function $s(e, t) {
		var n = ds();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && ns(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ec(e, t) {
		var n = ds();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && ns(t, r[1])) return r[0];
		if (r = e(), Xo) {
			tt(!0);
			try {
				e();
			} finally {
				tt(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function tc(e, t, n) {
		return n === void 0 || Go & 1073741824 && !(W & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Id(), R.lanes |= e, ud |= e, n);
	}
	function nc(e, t, n, r) {
		return Wr(n, t) ? n : ko.current === null ? !(Go & 106) || Go & 1073741824 && !(W & 261930) ? (Rc = !0, e.memoizedState = n) : (e = Id(), R.lanes |= e, ud |= e, t) : (e = tc(e, n, r), Wr(e, t) || (Rc = !0), e);
	}
	function rc(e, t, n, r, i) {
		var a = P.p;
		P.p = a !== 0 && 8 > a ? a : 8;
		var o = N.T, s = {};
		s.types = o === null ? null : o.types, N.T = s, hc(e, !1, t, n);
		try {
			var c = i(), l = N.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? mc(e, t, Ka(c, r), Fd(e)) : mc(e, t, r, Fd(e));
		} catch (n) {
			mc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, Fd());
		} finally {
			P.p = a, o !== null && s.types !== null && (o.types = s.types), N.T = o;
		}
	}
	function ic() {}
	function ac(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = oc(e).queue;
		rc(e, a, t, ve, n === null ? ic : function() {
			return sc(e), n(r);
		});
	}
	function oc(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: ve,
			baseState: ve,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: gs,
				lastRenderedState: ve
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: gs,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function sc(e) {
		var t = oc(e);
		t.next === null && (t = e.alternate.memoizedState), mc(e, t.next.queue, {}, Fd());
	}
	function cc() {
		return Oa(sh);
	}
	function lc() {
		return ds().memoizedState;
	}
	function uc() {
		return ds().memoizedState;
	}
	function dc(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = Fd();
					e = bo(n);
					var r = xo(t, e, n);
					r !== null && (Rd(r, t, n), So(r, t, n)), t = { cache: Fa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function fc(e, t, n) {
		var r = Fd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, gc(e) ? _c(t, n) : (n = ki(e, t, n, r), n !== null && (Rd(n, e, r), vc(n, t, r)));
	}
	function pc(e, t, n) {
		mc(e, t, n, Fd());
	}
	function mc(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (gc(e)) _c(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Wr(s, o)) return Oi(e, t, i, 0), id === null && Di(), !1;
			} catch {}
			if (n = ki(e, t, i, r), n !== null) return Rd(n, e, r), vc(n, t, r), !0;
		}
		return !1;
	}
	function hc(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: If(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, gc(e)) {
			if (t) throw Error(i(479));
		} else t = ki(e, n, r, 2), t !== null && Rd(t, e, 2);
	}
	function gc(e) {
		var t = e.alternate;
		return e === R || t !== null && t === R;
	}
	function _c(e, t) {
		Yo = Jo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function vc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, yt(e, n);
		}
	}
	var yc = {
		readContext: Oa,
		use: ms,
		useCallback: ts,
		useContext: ts,
		useEffect: ts,
		useImperativeHandle: ts,
		useLayoutEffect: ts,
		useInsertionEffect: ts,
		useMemo: ts,
		useReducer: ts,
		useRef: ts,
		useState: ts,
		useDebugValue: ts,
		useDeferredValue: ts,
		useTransition: ts,
		useSyncExternalStore: ts,
		useId: ts,
		useHostTransitionStatus: ts,
		useFormState: ts,
		useActionState: ts,
		useOptimistic: ts,
		useMemoCache: ts,
		useCacheRefresh: ts,
		useEffectEvent: ts
	}, bc = {
		readContext: Oa,
		use: ms,
		useCallback: function(e, t) {
			return us().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Oa,
		useEffect: Ws,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Hs(4194308, 4, Xs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Hs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Hs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = us();
			t = t === void 0 ? null : t;
			var r = e();
			if (Xo) {
				tt(!0);
				try {
					e();
				} finally {
					tt(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = us();
			if (n !== void 0) {
				var i = n(t);
				if (Xo) {
					tt(!0);
					try {
						n(t);
					} finally {
						tt(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = fc.bind(null, R, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = us();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Es(e);
			var t = e.queue, n = pc.bind(null, R, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Qs,
		useDeferredValue: function(e, t) {
			return tc(us(), e, t);
		},
		useTransition: function() {
			var e = Es(!1);
			return e = rc.bind(null, R, e.queue, !0, !1), us().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = R, a = us();
			if (L) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), id === null) throw Error(i(349));
				W & 127 || xs(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Ws(Cs.bind(null, r, o, e), [e]), r.flags |= 2048, Bs(9, { destroy: void 0 }, Ss.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = us(), t = id.identifierPrefix;
			if (L) {
				var n = ea, r = $i;
				n = (r & ~(1 << 32 - nt(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Zo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = es++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: cc,
		useFormState: Fs,
		useActionState: Fs,
		useOptimistic: function(e) {
			var t = us();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = hc.bind(null, R, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: hs,
		useCacheRefresh: function() {
			return us().memoizedState = dc.bind(null, R);
		},
		useEffectEvent: function(e) {
			var t = us(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (H & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, xc = {
		readContext: Oa,
		use: ms,
		useCallback: $s,
		useContext: Oa,
		useEffect: Gs,
		useImperativeHandle: Zs,
		useInsertionEffect: Js,
		useLayoutEffect: Ys,
		useMemo: ec,
		useReducer: _s,
		useRef: Vs,
		useState: function() {
			return _s(gs);
		},
		useDebugValue: Qs,
		useDeferredValue: function(e, t) {
			return nc(ds(), Ko.memoizedState, e, t);
		},
		useTransition: function() {
			var e = _s(gs)[0], t = ds().memoizedState;
			return [typeof e == "boolean" ? e : ps(e), t];
		},
		useSyncExternalStore: bs,
		useId: lc,
		useHostTransitionStatus: cc,
		useFormState: Is,
		useActionState: Is,
		useOptimistic: function(e, t) {
			return Ds(ds(), Ko, e, t);
		},
		useMemoCache: hs,
		useCacheRefresh: uc,
		useEffectEvent: qs
	}, Sc = {
		readContext: Oa,
		use: ms,
		useCallback: $s,
		useContext: Oa,
		useEffect: Gs,
		useImperativeHandle: Zs,
		useInsertionEffect: Js,
		useLayoutEffect: Ys,
		useMemo: ec,
		useReducer: ys,
		useRef: Vs,
		useState: function() {
			return ys(gs);
		},
		useDebugValue: Qs,
		useDeferredValue: function(e, t) {
			var n = ds();
			return Ko === null ? tc(n, e, t) : nc(n, Ko.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ys(gs)[0], t = ds().memoizedState;
			return [typeof e == "boolean" ? e : ps(e), t];
		},
		useSyncExternalStore: bs,
		useId: lc,
		useHostTransitionStatus: cc,
		useFormState: zs,
		useActionState: zs,
		useOptimistic: function(e, t) {
			var n = ds();
			return Ko === null ? (n.baseState = e, [e, n.queue.dispatch]) : Ds(n, Ko, e, t);
		},
		useMemoCache: hs,
		useCacheRefresh: uc,
		useEffectEvent: qs
	};
	function Cc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : E({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var wc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = Fd(), i = bo(r);
			i.payload = t, n != null && (i.callback = n), t = xo(e, i, r), t !== null && (Rd(t, e, r), So(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = Fd(), i = bo(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = xo(e, i, r), t !== null && (Rd(t, e, r), So(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = Fd(), r = bo(n);
			r.tag = 2, t != null && (r.callback = t), t = xo(e, r, n), t !== null && (Rd(t, e, n), So(t, e, n));
		}
	};
	function Tc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Gr(n, r) || !Gr(i, a) : !0;
	}
	function Ec(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && wc.enqueueReplaceState(t, t.state, null);
	}
	function Dc(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = E({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Oc(e) {
		Ci(e);
	}
	function kc(e) {
		console.error(e);
	}
	function Ac(e) {
		Ci(e);
	}
	function jc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Mc(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Nc(e, t, n) {
		return n = bo(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			jc(e, t);
		}, n;
	}
	function Pc(e) {
		return e = bo(e), e.tag = 3, e;
	}
	function Fc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Mc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Mc(t, n, r), typeof i != "function" && (Sd === null ? Sd = /* @__PURE__ */ new Set([this]) : Sd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Ic(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Ta(t, n, a, !0), n = Po.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return Fo === null ? Xd() : n.alternate === null && K === 0 && (K = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === to ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), vf(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === to ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), vf(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return vf(e, r, a), Xd(), !1;
		}
		if (L) return t = Po.current, t === null ? (r !== ua && (t = Error(i(423), { cause: r }), _a(Gi(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Gi(r, n), a = Nc(e.stateNode, r, a), Co(e, a), K !== 4 && (K = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== ua && (e = Error(i(422), { cause: r }), _a(Gi(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Gi(o, n), hd === null ? hd = [o] : hd.push(o), K !== 4 && (K = 2), t === null) return !0;
		r = Gi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Nc(n.stateNode, r, e), Co(n, e), !1;
				case 1:
					if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (Sd === null || !Sd.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Pc(a), Fc(a, e, n, r), Co(n, a), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Lc = Error(i(461)), Rc = !1;
	function zc(e, t, n, r) {
		t.child = e === null ? go(t, null, n, r) : ho(t, e.child, n, r);
	}
	function Bc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Da(t), r = rs(e, t, n, o, a, i), s = ss(), e !== null && !Rc ? (cs(e, t, i), pl(e, t, i)) : (L && s && ra(t), t.flags |= 1, zc(e, t, r, i), t.child);
	}
	function Vc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Ii(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Hc(e, t, a, r, i)) : (e = zi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !ml(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Gr : n, n(o, r) && e.ref === t.ref) return pl(e, t, i);
		}
		return t.flags |= 1, e = Li(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Hc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Gr(a, r) && e.ref === t.ref) {
				if (Rc = !1, t.pendingProps = r = a, ml(e, i)) e.flags & 131072 && (Rc = !0);
				else return t.lanes = e.lanes, pl(e, t, i);
			}
		}
		return Xc(e, t, n, r, i);
	}
	function Uc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return Gc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Xa(t, a === null ? null : a.cachePool), a === null ? Mo() : jo(t, a), Ro(t);
			else return r = t.lanes = 536870912, Gc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Xa(t, null), Mo(), zo()) : (Xa(t, a.cachePool), jo(t, a), zo(), t.memoizedState = null);
		return zc(e, t, i, n), t.child;
	}
	function Wc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Gc(e, t, n, r, i) {
		var a = Ya();
		return a = a === null ? null : {
			parent: Pa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Xa(t, null), Mo(), Ro(t), e !== null && Ta(e, t, r, !0), t.childLanes = i, null;
	}
	function Kc(e, t) {
		return t = il({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function qc(e, t, n) {
		return ho(t, e.child, null, n), e = Kc(t, t.pendingProps), e.flags |= 2, Bo(t), t.memoizedState = null, e;
	}
	function Jc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (L) {
				if (r.mode === "hidden") return e = Kc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Wc(null, e);
				if (Lo(t), (e = sa) ? (e = am(e, la), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Qi === null ? null : {
						id: $i,
						overflow: ea
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Hi(e), n.return = t, t.child = n, oa = t, sa = null)) : e = null, e === null) throw da(t);
				return t.lanes = 536870912, null;
			}
			return Kc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (Lo(t), a) {
				if (t.flags & 256) t.flags &= -257, t = qc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (Rc || Ta(e, t, n, !1), a = (n & e.childLanes) !== 0, Rc || a) {
				if (ko.current === null) {
					if (r = id, r !== null && (s = bt(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, Ai(e, s), Rd(r, e, s), Lc;
					Xd();
				}
				t = qc(e, t, n);
			} else e = o.treeContext, sa = lm(s.nextSibling), oa = t, L = !0, ca = null, la = !1, e !== null && aa(t, e), t = Kc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Li(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Yc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function Xc(e, t, n, r, i) {
		return Da(t), n = rs(e, t, n, r, void 0, i), r = ss(), e !== null && !Rc ? (cs(e, t, i), pl(e, t, i)) : (L && r && ra(t), t.flags |= 1, zc(e, t, n, i), t.child);
	}
	function Zc(e, t, n, r, i, a) {
		return Da(t), t.updateQueue = null, n = as(t, r, n, i), is(e), r = ss(), e !== null && !Rc ? (cs(e, t, a), pl(e, t, a)) : (L && r && ra(t), t.flags |= 1, zc(e, t, n, a), t.child);
	}
	function Qc(e, t, n, r, i) {
		if (Da(t), t.stateNode === null) {
			var a = Ni, o = n.contextType;
			typeof o == "object" && o && (a = Oa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = wc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, vo(t), o = n.contextType, a.context = typeof o == "object" && o ? Oa(o) : Ni, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Cc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && wc.enqueueReplaceState(a, a.state, null), Eo(t, r, a, i), To(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Dc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Ni, typeof u == "object" && u && (o = Oa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Ec(t, a, r, o), _o = !1;
			var f = t.memoizedState;
			a.state = f, Eo(t, r, a, i), To(), l = t.memoizedState, s || f !== l || _o ? (typeof d == "function" && (Cc(t, n, d, r), l = t.memoizedState), (c = _o || Tc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, yo(e, t), o = t.memoizedProps, u = Dc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Ni, typeof l == "object" && l && (c = Oa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Ec(t, a, r, c), _o = !1, f = t.memoizedState, a.state = f, Eo(t, r, a, i), To();
			var p = t.memoizedState;
			o !== d || f !== p || _o || e !== null && e.dependencies !== null && Ea(e.dependencies) ? (typeof s == "function" && (Cc(t, n, s, r), p = t.memoizedState), (u = _o || Tc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Ea(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Yc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = ho(t, e.child, null, i), t.child = ho(t, null, n, i)) : zc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = pl(e, t, i), e;
	}
	function $c(e, t, n, r) {
		return ha(), t.flags |= 256, zc(e, t, n, r), t.child;
	}
	var el = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function tl(e) {
		return {
			baseLanes: e,
			cachePool: Za()
		};
	}
	function nl(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= pd), e;
	}
	function rl(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(Vo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (L) {
				if (i ? Io(t) : zo(), (e = sa) ? (e = am(e, la), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Qi === null ? null : {
						id: $i,
						overflow: ea
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Hi(e), n.return = t, t.child = n, oa = t, sa = null)) : e = null, e === null) throw da(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (zo(), i = t.mode, a = il({
				mode: "hidden",
				children: a
			}, i), r = Bi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = tl(n), r.childLanes = nl(e, o, n), t.memoizedState = el, Wc(null, r)) : (Io(t), z(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return ol(e, t, a, o, r, c, s, n);
		}
		return i ? (zo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Li(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Bi(i, a, n, null), i.flags |= 2) : i = Li(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Wc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = tl(n) : (a = i.cachePool, a === null ? a = Za() : (s = Pa._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = nl(e, o, n), t.memoizedState = el, Wc(e.child, r)) : (Io(t), n = e.child, e = n.sibling, n = Li(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function z(e, t) {
		return t = il({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function il(e, t) {
		return e = Fi(22, e, null, t), e.lanes = 0, e;
	}
	function al(e, t, n) {
		return ho(t, e.child, null, n), e = z(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function ol(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (Io(t), t.flags &= -257, al(e, t, c)) : t.memoizedState === null ? (zo(), o = a.fallback, s = t.mode, a = il({
			mode: "visible",
			children: a.children
		}, s), o = Bi(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, ho(t, e.child, null, c), a = t.child, a.memoizedState = tl(c), a.childLanes = nl(e, r, c), t.memoizedState = el, Wc(null, a)) : (zo(), t.child = e.child, t.flags |= 128, null);
		if (Io(t), sm(o)) {
			if (r = o.nextSibling && o.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (a = Error(i(419)), a.stack = "", a.digest = r, _a({
				value: a,
				source: null,
				stack: null
			})), al(e, t, c);
		}
		if (Rc || Ta(e, t, c, !1), r = (c & e.childLanes) !== 0, Rc || r) {
			if (ko.current !== null) return al(e, t, c);
			if (r = id, r !== null && (a = bt(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, Ai(e, a), Rd(r, e, a), Lc;
			return om(o) || Xd(), al(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, sa = lm(o.nextSibling), oa = t, L = !0, ca = null, la = !1, e !== null && aa(t, e), t = z(t, a.children), t.flags |= 134221824, t);
	}
	function sl(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ca(e.return, t, n);
	}
	function cl(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && Wo(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function ll(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function ul(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function dl(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = Vo.current;
		if (t.flags & 128) return Ho(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Ho(t, o), i === "backwards" && e !== null ? (ul(e), zc(e, t, r, n), ul(e)) : zc(e, t, r, n), r = L ? Yi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && sl(e, n, t);
			else if (e.tag === 19) sl(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "backwards":
				n = cl(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, ul(t)), ll(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Wo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				ll(t, !0, n, null, a, r);
				break;
			case "together":
				ll(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = cl(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), ll(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function fl(e, t, n) {
		var r = t.pendingProps;
		return xa(t, t.type, r.value), zc(e, t, r.children, n), t.child;
	}
	function pl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), ud |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Ta(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = Li(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Li(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function ml(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Ea(e)));
	}
	function hl(e, t, n) {
		switch (t.tag) {
			case 3:
				Oe(t, t.stateNode.containerInfo), xa(t, Pa, e.memoizedState.cache), ha();
				break;
			case 27:
			case 5:
				Ae(t);
				break;
			case 4:
				Oe(t, t.stateNode.containerInfo);
				break;
			case 10:
				xa(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Lo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return Io(t), t.flags |= 128, null;
					r = Ta(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? rl(e, t, n) : (Io(t), e = pl(e, t, n), e === null ? null : e.sibling);
				}
				Io(t);
				break;
			case 19:
				if (t.flags & 128) return dl(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (Ta(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return dl(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Ho(t, Vo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Uc(e, t, n, t.pendingProps);
			case 24: xa(t, Pa, e.memoizedState.cache);
		}
		return pl(e, t, n);
	}
	function gl(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Rc = !0;
			else {
				if (!ml(e, n) && !(t.flags & 128)) return Rc = !1, hl(e, t, n);
				Rc = !!(e.flags & 131072);
			}
		} else Rc = !1, L && t.flags & 1048576 && na(t, Yi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = io(t.elementType), t.type = e, typeof e == "function") Ii(e) ? (r = Dc(e, r), t.tag = 1, t = Qc(null, t, e, r, n)) : (t.tag = 0, t = Xc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === j) {
								t.tag = 11, t = Bc(null, t, e, r, n);
								break a;
							}
							if (a === se) {
								t.tag = 14, t = Vc(null, t, e, r, n);
								break a;
							}
							if (a === A) {
								t.tag = 10, t.type = e, t = fl(null, t, n);
								break a;
							}
						}
						throw t = ge(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return Xc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Dc(r, t.pendingProps), Qc(e, t, r, a, n);
			case 3:
				a: {
					if (Oe(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, yo(e, t), Eo(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, xa(t, Pa, r), r !== o.cache && wa(t, [Pa], n, !0), To(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = $c(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = Gi(Error(i(424)), t), _a(a), t = $c(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (sa = lm(e.firstChild), oa = t, L = !0, ca = null, la = !0, n = go(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (ha(), r === a) {
							t = pl(e, t, n);
							break a;
						}
						zc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Yc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : L || (t.stateNode = Q(t.type, t.pendingProps, Ee.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return Ae(t), e === null && L && (r = t.stateNode = hm(t.type, t.pendingProps, Ee.current), oa = t, la = !0, a = sa, Sp(t.type) ? (um = a, sa = lm(r.firstChild)) : sa = a), zc(e, t, t.pendingProps.children, n), Yc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && L && ((a = r = sa) && (r = rm(r, t.type, t.pendingProps, la), r === null ? a = !1 : (t.stateNode = r, oa = t, sa = lm(r.firstChild), la = !1, a = !0)), a || da(t)), Ae(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, $(a, o) ? r = null : s !== null && $(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = rs(e, t, os, null, null, n), sh._currentValue = a), Yc(e, t), zc(e, t, r, n), t.child;
			case 6: return e === null && L && ((e = n = sa) && (n = im(n, t.pendingProps, la), n === null ? e = !1 : (t.stateNode = n, oa = t, sa = null, e = !0)), e || da(t)), null;
			case 13: return rl(e, t, n);
			case 4: return Oe(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = ho(t, null, r, n) : zc(e, t, r, n), t.child;
			case 11: return Bc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Yc(e, t), zc(e, t, r, n), t.child;
			case 8: return zc(e, t, t.pendingProps.children, n), t.child;
			case 12: return zc(e, t, t.pendingProps.children, n), t.child;
			case 10: return fl(e, t, n);
			case 9: return a = t.type._context, r = t.pendingProps.children, Da(t), a = Oa(a), r = r(a), t.flags |= 1, zc(e, t, r, n), t.child;
			case 14: return Vc(e, t, t.type, t.pendingProps, n);
			case 15: return Hc(e, t, t.type, t.pendingProps, n);
			case 19: return dl(e, t, n);
			case 31: return Jc(e, t, n);
			case 22: return Uc(e, t, n, t.pendingProps);
			case 24: return Da(t), r = Oa(Pa), e === null ? (a = Ya(), a === null && (a = id, o = Fa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, vo(t), xa(t, Pa, a)) : ((e.lanes & n) !== 0 && (yo(e, t), Eo(t, null, null, n), To()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, xa(t, Pa, r), r !== a.cache && wa(t, [Pa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), xa(t, Pa, r))), zc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : L && ra(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Yc(e, t), zc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function _l(e) {
		e.flags |= 4;
	}
	function vl(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (qd()) e.flags |= 8192;
				else throw ao = to, $a;
			}
		} else e.flags &= -16777217;
	}
	function yl(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (qd()) e.flags |= 8192;
			else throw ao = to, $a;
		}
	}
	function bl(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : mt(), e.lanes |= t, md |= t);
	}
	function xl(e, t) {
		if (!L) switch (e.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var n = e.tail, r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				break;
			default:
				for (t = e.tail, n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
		}
	}
	function Sl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Cl(e, t, n) {
		var r = t.pendingProps;
		switch (ia(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Sl(t), null;
			case 1: return Sl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Sa(Pa), ke(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ma(t) ? _l(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ga())), Sl(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (_l(t), o === null ? (Sl(t), vl(t, a, null, r, n)) : (Sl(t), yl(t, o))) : o ? o === e.memoizedState ? (Sl(t), t.flags &= -16777217) : (_l(t), Sl(t), yl(t, o)) : (e = e.memoizedProps, e !== r && _l(t), Sl(t), vl(t, a, e, r, n)), null;
			case 27:
				if (je(t), n = Ee.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Sl(t), t.subtreeFlags &= -33554433, null;
					}
					e = we.current, ma(t) ? fa(t, e) : (e = hm(a, r, n), t.stateNode = e, _l(t));
				}
				return Sl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (je(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Sl(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = we.current, ma(t)) fa(t, o);
					else {
						var s = dp(Ee.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[F] = t, o[Et] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (ip(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && _l(t);
					}
				}
				return Sl(t), t.subtreeFlags &= -33554433, vl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = Ee.current, ma(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = oa, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[F] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || tp(e.nodeValue, n)), e || da(t, !0);
					} else e = dp(e).createTextNode(r), e[F] = t, t.stateNode = e;
				}
				return Sl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = ma(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[F] = t;
						} else ha(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Sl(t), e = !1;
					} else n = ga(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Sl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = ma(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[F] = t;
						} else ha(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Sl(t), a = !1;
					} else a = ga(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
				}
				return Bo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), bl(t, t.updateQueue), Sl(t), null);
			case 4: return ke(), e === null && Gf(t.stateNode.containerInfo), t.flags |= 67108864, Sl(t), null;
			case 10: return Sa(t.type), Sl(t), null;
			case 19:
				if (Uo(t), r = t.memoizedState, r === null) return Sl(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) xl(r, !1);
					else {
						if (K !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Wo(e), o !== null) {
								for (t.flags |= 128, xl(r, !1), e = o.updateQueue, t.updateQueue = e, bl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Ri(n, e), n = n.sibling;
								return Ho(t, Vo.current & 1 | 2), L && ta(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && We() > bd && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = Wo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, bl(t, e), xl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !L) return Sl(t), null;
						} else 2 * We() - r.renderingStartTime > bd && n !== 536870912 && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				if (r.tail !== null) {
					e = r.tail;
					a: {
						for (n = e; n !== null;) {
							if (n.alternate !== null) {
								n = !1;
								break a;
							}
							n = n.sibling;
						}
						n = !0;
					}
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = We(), e.sibling = null, o = Vo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || L ? Ho(t, o) : (n = o, Ce(Po, t), Ce(Vo, n), Fo === null && (Fo = t)), L && ta(t, r.treeForkCount), e;
				}
				return Sl(t), null;
			case 22:
			case 23: return Bo(t), No(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Sl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Sl(t), n = t.updateQueue, n !== null && bl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && Se(Ja), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Sa(Pa), Sl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, Sl(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function wl(e, t) {
		switch (ia(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Sa(Pa), ke(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return je(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Bo(t), t.alternate === null) throw Error(i(340));
					ha();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Bo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					ha();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Uo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return ke(), null;
			case 10: return Sa(t.type), null;
			case 22:
			case 23: return Bo(t), No(), e !== null && Se(Ja), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Sa(Pa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Tl(e, t) {
		switch (ia(t), t.tag) {
			case 3:
				Sa(Pa), ke();
				break;
			case 26:
			case 27:
			case 5:
				je(t);
				break;
			case 4:
				ke();
				break;
			case 31:
				t.memoizedState !== null && Bo(t);
				break;
			case 13:
				Bo(t);
				break;
			case 19:
				Uo(t);
				break;
			case 10:
				Sa(t.type);
				break;
			case 22:
			case 23:
				Bo(t), No(), e !== null && Se(Ja);
				break;
			case 24: Sa(Pa);
		}
	}
	function El(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function Dl(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								q(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function Ol(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Oo(t, n);
			} catch (t) {
				q(e, e.return, t);
			}
		}
	}
	function kl(e, t, n) {
		n.props = Dc(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			q(e, t, n);
		}
	}
	function Al(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						var i = e.stateNode, a = bi(e.memoizedProps, i);
						(i.ref === null || i.ref.name !== a) && (i.ref = Pp(a)), r = i.ref;
						break;
					case 7:
						if (e.stateNode === null) {
							var o = new Fp(e);
							h(e.child, !1, Qp, o, void 0, void 0), e.stateNode = o;
						}
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			q(e, t, n);
		}
	}
	function jl(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				q(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				q(e, t, n);
			}
			else n.current = null;
		}
	}
	function Ml(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Nl(e) {
		for (var t = e.return; t !== null && (Il(t) && em(e.stateNode, t.stateNode), !Fl(t));) t = t.return;
	}
	function Pl(e) {
		for (var t = e.return; t !== null && (Il(t) && tm(e.stateNode, t.stateNode), !Fl(t));) t = t.return;
	}
	function Fl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Il(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Ll(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			q(e, e.return, t);
		}
	}
	function Rl(e, t, n) {
		try {
			var r = e.stateNode;
			op(r, e.type, n, t), r[Et] = t;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	function zl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function Bl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || zl(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Vl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = xn)), Ml(e, r), I = !0;
		else if (i !== 4 && (i === 27 && (Ml(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Vl(e, t, n, r), e = e.sibling; e !== null;) Vl(e, t, n, r), e = e.sibling;
	}
	function Hl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), Ml(e, r), I = !0;
		else if (i !== 4 && (i === 27 && (Ml(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Hl(e, t, n, r), e = e.sibling; e !== null;) Hl(e, t, n, r), e = e.sibling;
	}
	function Ul(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			ip(t, r, n), t[F] = e, t[Et] = n;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	var Wl = !1, Gl = null;
	function Kl(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Wl = !0);
	}
	var ql = null;
	function Jl() {
		var e = ql;
		return ql = null, e;
	}
	var B = 0;
	function Yl(e, t, n, r, i) {
		return B = 0, Xl(e.child, t, n, r, i);
	}
	function Xl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Wl = !0, Tp(o, B === 0 ? t : t + "_" + B, n), B++;
			} else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && i || Xl(e.child, t, n, r, i) && (a = !0));
			e = e.sibling;
		}
		return a;
	}
	function Zl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && t || Zl(e.child, t)), e = e.sibling;
	}
	function Ql(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Ql(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(i(544));
				var n = t.name;
				t = Si(t.default, t.share), t !== "none" && (Yl(e, n, t, null, !1) || Zl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function $l(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = bi(r, n), a = Si(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Ql(e) : Yl(e, i, a, null, !1) ? (Ql(e), n.paired || t || Ld(e, r.onEnter)) : Zl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) $l(e, t), e = e.sibling;
		else Ql(e);
	}
	function eu(e) {
		if (Gl !== null && Gl.size !== 0) {
			var t = Gl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = Si(n.default, n.share);
								if (a !== "none" && (Yl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, Ld(e, n.onShare)) : Zl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					eu(e);
				}
				e = e.sibling;
			}
		}
	}
	function tu(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = bi(t, e.stateNode), r = Gl === null ? void 0 : Gl.get(n), i = Si(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Yl(e, n, i, null, !1) ? r === void 0 ? Ld(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Gl.delete(n), Ld(e, t.onShare)) : Zl(e.child, !1)), Gl !== null && eu(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) tu(e), e = e.sibling;
		else Gl !== null && eu(e);
	}
	function nu(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = bi(t, e.stateNode);
				t = Si(t.default, t.update), e.flags &= -5, t !== "none" && Yl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && nu(e);
			e = e.sibling;
		}
	}
	function ru(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Zl(e.child, !1));
				}
				ru(e);
			}
			e = e.sibling;
		}
	}
	function iu(e) {
		if (e.tag === 30) e.stateNode.paired = null, Zl(e.child, !1), ru(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) iu(e), e = e.sibling;
		else ru(e);
	}
	function au(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Zl(e.child, !1) : e.subtreeFlags & 33554432 && au(e), e = e.sibling;
	}
	function ou(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && B < a.length) {
					var l = a[B], u = Op(c);
					(l.view || u.view) && (s = !0);
					var d;
					if (d = !(e.flags & 4)) {
						if (u.clip) d = !0;
						else {
							d = l.rect;
							var f = u.rect;
							d = d.y !== f.y || d.x !== f.x || d.height !== f.height || d.width !== f.width;
						}
					}
					d && (e.flags |= 4), u.abs ? u = !l.abs : (l = l.rect, u = u.rect, u = l.height !== u.height || l.width !== u.width), u && (e.flags |= 32);
				} else e.flags |= 32;
				e.flags & 4 && Tp(c, B === 0 ? n : n + "_" + B, i), s && e.flags & 4 || (ql === null && (ql = []), ql.push(c, B === 0 ? r : r + "_" + B, t.memoizedProps)), B++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : ou(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function su(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = bi(n, r), a = Si(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				B = 0, i = ou(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || Ld(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && su(e, t);
			e = e.sibling;
		}
	}
	var cu = !1, lu = !1, uu = !1, du = !1, fu = typeof WeakSet == "function" ? WeakSet : Set, pu = null, mu = !1, hu = !1, gu = !1, _u = !1;
	function vu(e, t, n) {
		if (e = e.containerInfo, lp = gh, e = Xr(e), Zr(e)) {
			if ("selectionStart" in e) var r = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				r = (r = e.ownerDocument) && r.defaultView || window;
				var i = r.getSelection && r.getSelection();
				if (i && i.rangeCount !== 0) {
					r = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						r.nodeType, o.nodeType;
					} catch {
						r = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== r || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === r && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					r = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else r = null;
			}
			r ||= {
				start: 0,
				end: 0
			};
		} else r = null;
		for (up = {
			focusedElem: e,
			selectionRange: r
		}, gh = !1, n = (n & 335544064) === n, pu = t, t = n ? 9270 : 1024; pu !== null;) {
			if (e = pu, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && tu(r[a]);
			if (e.alternate === null && e.flags & 2) n && Kl(e), yu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && tu(r), yu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Kl(e), yu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, pu = r) : (n && nu(e), yu(n));
			}
		}
		Gl = null;
	}
	function yu(e) {
		for (; pu !== null;) {
			var t = pu, n = e, r = t.alternate, a = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (a & 1024 && r !== null) {
						n = void 0, a = r.memoizedProps, r = r.memoizedState;
						var o = t.stateNode;
						try {
							var s = Dc(t.type, a);
							n = o.getSnapshotBeforeUpdate(s, r), o.__reactInternalSnapshotBeforeUpdate = n;
						} catch (e) {
							q(t, t.return, e);
						}
					}
					break;
				case 3:
					if (a & 1024) {
						if (r = t.stateNode.containerInfo, n = r.nodeType, n === 9) nm(r);
						else if (n === 1) switch (r.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								nm(r);
								break;
							default: r.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					n && r !== null && (n = bi(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = Si(a.default, a.update), a !== "none" && Yl(r, n, a, r.memoizedState = [], !0));
					break;
				default: if (a & 1024) throw Error(i(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, pu = r;
				break;
			}
			pu = t.return;
		}
	}
	function bu(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				zu(e, n), r & 4 && El(5, n);
				break;
			case 1:
				if (zu(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						q(n, n.return, e);
					}
					else {
						var i = Dc(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							q(n, n.return, e);
						}
					}
				}
				r & 64 && Ol(n), r & 512 && Al(n, n.return);
				break;
			case 3:
				if (zu(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Oo(e, t);
					} catch (e) {
						q(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Ul(n);
			case 26:
			case 5:
				zu(e, n), t === null && r & 4 && Ll(n), r & 512 && Al(n, n.return);
				break;
			case 12:
				zu(e, n);
				break;
			case 31:
				zu(e, n), r & 4 && Ou(e, n);
				break;
			case 13:
				zu(e, n), r & 4 && ku(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = xf.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || cu, !r) {
					var a = t !== null && t.memoizedState !== null || lu;
					t = cu, i = lu, cu = r, (lu = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Vu(e, n, r)) : zu(e, n), cu = t, lu = i;
				}
				break;
			case 30:
				zu(e, n), r & 512 && Al(n, n.return);
				break;
			case 7: r & 512 && Al(n, n.return);
			default: zu(e, n);
		}
	}
	function xu(e, t) {
		for (e = e.child; e !== null;) Su(e, t), e = e.sibling;
	}
	function Su(e, t) {
		switch (e.tag) {
			case 5:
			case 26:
				try {
					var n = e.stateNode;
					if (t) {
						var r = n.style;
						typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
					} else {
						var i = e.stateNode, a = e.memoizedProps.style, o = a != null && a.hasOwnProperty("display") ? a.display : null;
						i.style.display = o == null || typeof o == "boolean" ? "" : ("" + o).trim();
					}
				} catch (t) {
					q(e, e.return, t);
				}
				Cu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, I = !0;
				} catch (t) {
					q(e, e.return, t);
				}
				break;
			case 18:
				try {
					var s = e.stateNode;
					t ? wp(s, !0) : wp(e.stateNode, !1);
				} catch (t) {
					q(e, e.return, t);
				}
				break;
			case 22:
			case 23:
				e.memoizedState === null && xu(e, t);
				break;
			default: xu(e, t);
		}
	}
	function Cu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						Su(n, r);
						break a;
					case 22:
						n.memoizedState === null && Cu(n, r);
						break a;
					default: Cu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function wu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, wu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Pt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var V = null, Tu = !1;
	function Eu(e, t, n) {
		for (n = n.child; n !== null;) Du(e, t, n), n = n.sibling;
	}
	function Du(e, t, n) {
		if (et && typeof et.onCommitFiberUnmount == "function") try {
			et.onCommitFiberUnmount($e, n);
		} catch {}
		switch (n.tag) {
			case 26:
				lu || jl(n, t), Eu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !lu && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				lu || jl(n, t), Pl(n);
				var r = V, i = Tu;
				Sp(n.type) && (V = n.stateNode, Tu = !1), Eu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), V = r, Tu = i;
				break;
			case 5: lu || jl(n, t), Pl(n);
			case 6:
				if (n.tag === 6 && Pl(n), r = V, i = Tu, V = null, Eu(e, t, n), V = r, Tu = i, V !== null) {
					if (Tu) try {
						(V.nodeType === 9 ? V.body : V.nodeName === "HTML" ? V.ownerDocument.body : V).removeChild(n.stateNode), I = !0;
					} catch (e) {
						q(n, t, e);
					}
					else try {
						V.removeChild(n.stateNode), I = !0;
					} catch (e) {
						q(n, t, e);
					}
				}
				break;
			case 18:
				V !== null && (Tu ? (e = V, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(V, n.stateNode));
				break;
			case 4:
				r = V, i = Tu, V = n.stateNode.containerInfo, Tu = !0, Eu(e, t, n), V = r, Tu = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Dl(2, n, t), lu || Dl(4, n, t), Eu(e, t, n);
				break;
			case 1:
				lu || (jl(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && kl(n, t, r)), Eu(e, t, n);
				break;
			case 21:
				Eu(e, t, n);
				break;
			case 22:
				lu = (r = lu) || n.memoizedState !== null, Eu(e, t, n), lu = r;
				break;
			case 30:
				jl(n, t), Eu(e, t, n);
				break;
			case 7:
				lu || jl(n, t), Eu(e, t, n);
				break;
			default: Eu(e, t, n);
		}
	}
	function Ou(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				q(t, t.return, e);
			}
		}
	}
	function ku(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function Au(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new fu()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new fu()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ju(e, t) {
		var n = Au(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Sf.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function Mu(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var a = 0; a < r.length; a++) {
			var o = r[a], s = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							V = l.stateNode, Tu = !1;
							break a;
						}
						break;
					case 5:
						V = l.stateNode, Tu = !1;
						break a;
					case 3:
					case 4:
						V = l.stateNode.containerInfo, Tu = !0;
						break a;
				}
				l = l.return;
			}
			if (V === null) throw Error(i(160));
			Du(s, c, o), V = null, Tu = !1, s = o.alternate, s !== null && (s.return = null), o.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Pu(t, e, n), t = t.sibling;
	}
	var Nu = null;
	function Pu(e, t, n) {
		var r = e.alternate, a = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (a & 4 && (r = e.updateQueue, r = r === null ? null : r.events, r !== null)) for (var o = 0; o < r.length; o++) {
					var s = r[o];
					s.ref.impl = s.nextImpl;
				}
				Mu(t, e, n), Fu(e), a & 4 && (Dl(3, e, e.return), El(3, e), Dl(5, e, e.return));
				break;
			case 1:
				Mu(t, e, n), Fu(e), a & 512 && (lu || r === null || jl(r, r.return)), a & 64 && cu && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (o = Nu, Mu(t, e, n), Fu(e), a & 512 && (lu || r === null || jl(r, r.return)), a & 4) {
					if (a = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (cu) e.stateNode = Q(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, a = o.ownerDocument || o;
										b: switch (t) {
											case "title":
												r = a.getElementsByTagName("title")[0], (!r || r[Mt] || r[F] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), ip(r, t, n), r[F] = e, zt(r), t = r;
												break a;
											case "link":
												if (o = Gm("link", "href", a).get(t + (n.href || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), ip(r, t, n), a.head.appendChild(r);
												break;
											case "meta":
												if (o = Gm("meta", "content", a).get(t + (n.content || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), ip(r, t, n), a.head.appendChild(r);
												break;
											default: throw Error(i(468, t));
										}
										r[F] = e, zt(r), t = r;
									}
									e.stateNode = t;
								}
							} else cu || Km(o, e.type, e.stateNode);
						} else e.stateNode = Bm(o, n, e.memoizedProps);
					} else a === n ? n === null && e.stateNode !== null && Rl(e, e.memoizedProps, r.memoizedProps) : (a === null ? (t = r.stateNode, t === null || lu || t.parentNode.removeChild(t)) : a.count--, n === null ? cu || Km(o, e.type, e.stateNode) : Bm(o, n, e.memoizedProps));
				}
				break;
			case 27:
				Mu(t, e, n), Fu(e), a & 512 && (lu || r === null || jl(r, r.return)), r !== null && a & 4 && Rl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (o = uu, uu = !1, Mu(t, e, n), uu = o, Fu(e), a & 512 && (lu || r === null || jl(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						pn(t, ""), I = !0;
					} catch (t) {
						q(e, e.return, t);
					}
				}
				a & 4 && e.stateNode != null && (t = e.memoizedProps, Rl(e, t, r === null ? t : r.memoizedProps)), a & 1024 && (du = !0);
				break;
			case 6:
				if (Mu(t, e, n), Fu(e), a & 4) {
					if (e.stateNode === null) throw Error(i(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, I = !0;
					} catch (t) {
						q(e, e.return, t);
					}
				}
				break;
			case 3:
				if (I = !1, Wm = null, o = Nu, Nu = bm(t.containerInfo), Mu(t, e, n), Nu = o, Fu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					q(e, e.return, t);
				}
				du && (du = !1, Iu(e)), I = !1;
				break;
			case 4:
				a = uu, uu = cu, r = Yt(), o = Nu, Nu = bm(e.stateNode.containerInfo), Mu(t, e, n), Fu(e), Nu = o, I && hu && (gu = !0), I = r, uu = a;
				break;
			case 12:
				Mu(t, e, n), Fu(e);
				break;
			case 31:
				Mu(t, e, n), Fu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ju(e, t)));
				break;
			case 13:
				Mu(t, e, n), Fu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (vd = We()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ju(e, t)));
				break;
			case 22:
				o = e.memoizedState !== null, s = r !== null && r.memoizedState !== null;
				var c = cu, l = lu, u = uu;
				cu = c || o, uu = u || o, lu = l || s, Mu(t, e, n), lu = l, uu = u, cu = c, Fu(e), a & 8192 && (t = e.stateNode, t._visibility = o ? t._visibility & -2 : t._visibility | 1, !o || r === null || s || cu || lu || (t = s || lu, n = cu, r = lu, cu = o || cu, lu = t, Bu(e, 2), cu = n, lu = r), !o && uu || xu(e, o)), a & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, ju(e, n))));
				break;
			case 19:
				Mu(t, e, n), Fu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ju(e, t)));
				break;
			case 30:
				a & 512 && (lu || r === null || jl(r, r.return)), a = Yt(), o = hu, s = (n & 335544064) === n, c = e.memoizedProps, hu = s && Si(c.default, c.update) !== "none", Mu(t, e, n), Fu(e), s && r !== null && I && (e.flags |= 4), hu = o, I = a;
				break;
			case 21: break;
			case 7: a & 512 && (lu || r === null || jl(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: Mu(t, e, n), Fu(e);
		}
	}
	function Fu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (zl(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var a = e.return; a !== null;) {
					if (Il(a)) {
						var o = a.stateNode;
						r === null ? r = [o] : r.push(o);
					}
					if (Fl(a)) break;
					a = a.return;
				}
				var s = r;
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Hl(e, Bl(e), c, s);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (pn(l, ""), n.flags &= -33), Hl(e, Bl(e), l, s);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Vl(e, Bl(e), u, s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				q(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Iu(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Iu(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Lu(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Ru(t, e), t = t.sibling;
		else su(t, !1);
	}
	function Ru(e, t) {
		var n = e.alternate;
		if (n === null) $l(e, !1);
		else switch (e.tag) {
			case 3:
				if (_u = mu = !1, Jl(), Lu(t, e), !mu && !gu) {
					if (e = ql, e !== null) for (var r = 0; r < e.length; r += 3) {
						n = e[r];
						var i = e[r + 1];
						Ep(n, e[r + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + i + ")"
						});
					}
					e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), e.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					})), _u = !0;
				}
				ql = null;
				break;
			case 5:
				Lu(t, e);
				break;
			case 4:
				r = mu, mu = !1, Lu(t, e), mu && (gu = !0), mu = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Lu(t, e) : $l(e, !1));
				break;
			case 30:
				r = mu, i = Jl(), mu = !1, Lu(t, e), mu && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = bi(a, o), o = bi(n.memoizedProps, o);
				var s = Si(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, B = 0, t = ou(e, n, t, o, s, a, !0), B !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (Ld(e, e.memoizedProps.onUpdate), ql = i) : i !== null && (i.push.apply(i, ql), ql = i), mu = e.flags & 32 ? !0 : r;
				break;
			default: Lu(t, e);
		}
	}
	function zu(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) bu(e, t.alternate, t), t = t.sibling;
	}
	function Bu(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Dl(4, n, n.return), Bu(n, r);
					break;
				case 1:
					jl(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && kl(n, n.return, i), Bu(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					jl(n, n.return), n.tag !== 5 && n.tag !== 27 || Pl(n), Bu(n, r);
					break;
				case 6:
					Pl(n);
					break;
				case 26:
					jl(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || lu || i.parentNode.removeChild(i), Bu(n, r);
					break;
				case 22:
					n.memoizedState === null && Bu(n, r);
					break;
				case 30:
					jl(n, n.return), Bu(n, r);
					break;
				case 7: jl(n, n.return);
				default: Bu(n, r);
			}
			e = e.sibling;
		}
	}
	function Vu(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Vu(i, a, n), El(4, a);
					break;
				case 1:
					if (Vu(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						q(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) Do(l[i], c);
						} catch (e) {
							q(r, r.return, e);
						}
					}
					s && o & 64 && Ol(a), Al(a, a.return);
					break;
				case 27: n & 2 && Ul(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Nl(a), Vu(i, a, n), s && r === null && o & 4 && Ll(a), Al(a, a.return);
					break;
				case 6:
					Nl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || cu || Km(bm(c.ownerDocument), a.type, c), Vu(i, a, n), s && r === null && o & 4 && Ll(a), Al(a, a.return);
					break;
				case 12:
					Vu(i, a, n);
					break;
				case 31:
					Vu(i, a, n), s && o & 4 && Ou(i, a);
					break;
				case 13:
					Vu(i, a, n), s && o & 4 && ku(i, a);
					break;
				case 22:
					a.memoizedState === null && Vu(i, a, n), Al(a, a.return);
					break;
				case 30:
					Vu(i, a, n), Al(a, a.return);
					break;
				case 7: Al(a, a.return);
				default: Vu(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Hu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Ia(n));
	}
	function Uu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ia(e));
	}
	function Wu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Gu(e, t, n, r), t = t.sibling;
		else i && au(t);
	}
	function Gu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && iu(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Wu(e, t, n, r), a & 2048 && El(9, t);
				break;
			case 1:
				Wu(e, t, n, r);
				break;
			case 3:
				Wu(e, t, n, r), i && _u && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Ia(a)));
				break;
			case 12:
				if (a & 2048) {
					Wu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						q(t, t.return, e);
					}
				} else Wu(e, t, n, r);
				break;
			case 31:
				Wu(e, t, n, r);
				break;
			case 13:
				Wu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && iu(t), o._visibility & 2 ? Wu(e, t, n, r) : (o._visibility |= 2, Ku(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && iu(s), o._visibility & 2 ? Wu(e, t, n, r) : qu(e, t)), a & 2048 && Hu(s, t);
				break;
			case 24:
				Wu(e, t, n, r), a & 2048 && Uu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Zl(a.child, !0), Zl(t.child, !0))), Wu(e, t, n, r);
				break;
			default: Wu(e, t, n, r);
		}
	}
	function Ku(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Ku(a, o, s, c, i), El(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Ku(a, o, s, c, i)) : u._visibility & 2 ? Ku(a, o, s, c, i) : qu(a, o), i && l & 2048 && Hu(o.alternate, o);
					break;
				case 24:
					Ku(a, o, s, c, i), i && l & 2048 && Uu(o.alternate, o);
					break;
				default: Ku(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function qu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					qu(n, r), i & 2048 && Hu(r.alternate, r);
					break;
				case 24:
					qu(n, r), i & 2048 && Uu(r.alternate, r);
					break;
				default: qu(n, r);
			}
			t = t.sibling;
		}
	}
	var Ju = 8192;
	function Yu(e, t, n) {
		if (e.subtreeFlags & Ju) for (e = e.child; e !== null;) Xu(e, t, n), e = e.sibling;
	}
	function Xu(e, t, n) {
		switch (e.tag) {
			case 26:
				Yu(e, t, n), e.flags & Ju && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, Nu, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Yu(e, t, n), e.flags & Ju && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = Nu;
				Nu = bm(e.stateNode.containerInfo), Yu(e, t, n), Nu = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Ju, Ju = 16777216, Yu(e, t, n), Ju = r) : Yu(e, t, n));
				break;
			case 30:
				if ((e.flags & Ju) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Gl === null && (Gl = /* @__PURE__ */ new Map()), Gl.set(r, i);
				}
				Yu(e, t, n);
				break;
			default: Yu(e, t, n);
		}
	}
	function Zu(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Qu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				pu = r, td(r, e);
			}
			Zu(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) $u(e), e = e.sibling;
	}
	function $u(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Qu(e), e.flags & 2048 && Dl(9, e, e.return);
				break;
			case 3:
				Qu(e);
				break;
			case 12:
				Qu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, ed(e)) : Qu(e);
				break;
			default: Qu(e);
		}
	}
	function ed(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				pu = r, td(r, e);
			}
			Zu(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Dl(8, t, t.return), ed(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, ed(t));
					break;
				default: ed(t);
			}
			e = e.sibling;
		}
	}
	function td(e, t) {
		for (; pu !== null;) {
			var n = pu;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Dl(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: Ia(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, pu = r;
			else a: for (n = e; pu !== null;) {
				r = pu;
				var i = r.sibling, a = r.return;
				if (wu(r), r === n) {
					pu = null;
					break a;
				}
				if (i !== null) {
					i.return = a, pu = i;
					break a;
				}
				pu = a;
			}
		}
	}
	var nd = {
		getCacheForType: function(e) {
			var t = Oa(Pa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Oa(Pa).controller.signal;
		}
	}, rd = typeof WeakMap == "function" ? WeakMap : Map, H = 0, id = null, U = null, W = 0, G = 0, ad = null, od = !1, sd = !1, cd = !1, ld = 0, K = 0, ud = 0, dd = 0, fd = 0, pd = 0, md = 0, hd = null, gd = null, _d = !1, vd = 0, yd = 0, bd = Infinity, xd = null, Sd = null, Cd = 0, wd = null, Td = null, Ed = 0, Dd = 0, Od = null, kd = null, Ad = null, jd = null, Md = null, Nd = 0, Pd = null;
	function Fd() {
		return H & 2 && W !== 0 ? W & -W : N.T === null ? Ct() : If();
	}
	function Id() {
		if (pd === 0) {
			if (!(W & 536870912) || L) {
				var e = st;
				st <<= 1, !(st & 3932160) && (st = 262144), pd = e;
			} else pd = 536870912;
		}
		return e = Po.current, e !== null && (e.flags |= 32), pd;
	}
	function Ld(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(bi(e.memoizedProps, n))), jd === null && (jd = []), jd.push(t.bind(null, r));
		}
	}
	function Rd(e, t, n) {
		(e === id && (G === 2 || G === 9) || e.cancelPendingCommit !== null) && (Gd(e, 0), Hd(e, W, pd, !1)), gt(e, n), (!(H & 2) || e !== id) && (e === id && (!(H & 2) && (dd |= n), K === 4 && Hd(e, W, pd, !1)), kf(e));
	}
	function zd(e, t, n) {
		if (H & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || dt(e, t), a = r ? $d(e, t) : Zd(e, t, !0), o = r;
		do {
			if (a === 0) {
				sd && !r && Hd(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !Vd(n)) a = Zd(e, t, !1), o = !1;
			else {
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = hd;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (Gd(c, s).flags |= 256), s = Zd(c, s, !1), s !== 2 && s !== 6) {
								if (cd && !l) {
									c.errorRecoveryDisabledLanes |= o, dd |= o, a = 4;
									break a;
								}
								o = gd, gd = a, o !== null && (gd === null ? gd = o : gd.push.apply(gd, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					Gd(e, 0), Hd(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t && (t & 62914560) !== t) break;
						case 6:
							Hd(r, t, pd, !od);
							break a;
						case 2:
							gd = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = vd + 300 - We(), 10 < a)) {
						if (Hd(r, t, pd, !od), ut(r, 0, !0) !== 0) break a;
						Ed = t, r.timeoutHandle = gp(Bd.bind(null, r, n, gd, xd, _d, t, pd, dd, md, od, o, "Throttled", -0, 0), a);
						break a;
					}
					Bd(r, n, gd, xd, _d, t, pd, dd, md, od, o, null, -0, 0);
				}
				break;
			}
		} while (1);
		kf(e);
	}
	function Bd(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		e.timeoutHandle = -1;
		var m = t.subtreeFlags, h = (a & 335544064) === a;
		d = null, (h || m & 8192 || (m & 16785408) == 16785408) && (d = {
			stylesheets: null,
			count: 0,
			imgCount: 0,
			imgBytes: 0,
			suspenseyImages: [],
			waitingForImages: !0,
			waitingForViewTransition: !1,
			unsuspend: xn
		}, Gl = null, Xu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? vd - We() : (a & 4194048) === a ? yd - We() : 0, m = eh(d, m), m !== null) ? (Ed = a, e.cancelPendingCommit = m(sf.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Hd(e, a, o, !l)) : sf(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Vd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Wr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function Hd(e, t, n, r) {
		t = ft(e, t), t &= ~fd, t &= ~dd, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - nt(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && vt(e, n, t);
	}
	function Ud() {
		return H & 6 ? !0 : (Af(0, !1), !1);
	}
	function Wd() {
		if (U !== null) {
			if (G === 0) var e = U.return;
			else e = U, ba = ya = null, ls(e), co = null, lo = 0, e = U;
			for (; e !== null;) Tl(e.alternate, e), e = e.return;
			U = null;
		}
	}
	function Gd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), Ed = 0, Wd(), id = e, U = n = Li(e.current, null), W = t, G = 0, ad = null, od = !1, sd = dt(e, t), cd = !1, md = pd = fd = dd = ud = K = 0, gd = hd = null, _d = !1, ld = ft(e, t), Di(), n;
	}
	function Kd(e, t) {
		R = null, N.H = yc, t === Qa || t === eo ? (t = oo(), G = 3) : t === $a ? (t = oo(), G = 4) : G = t === Lc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, ad = t, U === null && (K = 1, jc(e, Gi(t, e.current)));
	}
	function qd() {
		var e = Po.current;
		return e === null ? !0 : (W & 4194048) === W ? Fo === null : (W & 62914560) === W || W & 536870912 ? e === Fo : !1;
	}
	function Jd() {
		var e = N.H;
		return N.H = yc, e === null ? yc : e;
	}
	function Yd() {
		var e = N.A;
		return N.A = nd, e;
	}
	function Xd() {
		K = 4, od || (W & 4194048) !== W && Po.current !== null || (sd = !0), !(ud & 134217727) && !(dd & 134217727) || id === null || Hd(id, W, pd, !1);
	}
	function Zd(e, t, n) {
		var r = H;
		H |= 2;
		var i = Jd(), a = Yd();
		(id !== e || W !== t) && (xd = null, Gd(e, t)), t = !1;
		var o = K;
		a: do
			try {
				if (G !== 0 && U !== null) {
					var s = U, c = ad;
					switch (G) {
						case 8:
							Wd(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Po.current === null && (t = !0);
							var l = G;
							if (G = 0, ad = null, rf(e, s, c, l), n && sd) {
								o = 0;
								break a;
							}
							break;
						default: l = G, G = 0, ad = null, rf(e, s, c, l);
					}
				}
				Qd(), o = K;
				break;
			} catch (t) {
				Kd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, ba = ya = null, H = r, N.H = i, N.A = a, U === null && (id = null, W = 0, Di()), o;
	}
	function Qd() {
		for (; U !== null;) tf(U);
	}
	function $d(e, t) {
		var n = H;
		H |= 2;
		var r = Jd(), a = Yd();
		id !== e || W !== t ? (xd = null, bd = We() + 500, Gd(e, t)) : sd = dt(e, t);
		a: do
			try {
				if (G !== 0 && U !== null) {
					t = U;
					var o = ad;
					b: switch (G) {
						case 1:
							G = 0, ad = null, rf(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (no(o)) {
								G = 0, ad = null, nf(t);
								break;
							}
							t = function() {
								G !== 2 && G !== 9 || id !== e || (G = 7), kf(e);
							}, o.then(t, t);
							break a;
						case 3:
							G = 7;
							break a;
						case 4:
							G = 5;
							break a;
						case 7:
							no(o) ? (G = 0, ad = null, nf(t)) : (G = 0, ad = null, rf(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (U.tag) {
								case 26: s = U.memoizedState;
								case 5:
								case 27:
									var c = U;
									if (s ? Ym(s) : c.stateNode.complete) {
										G = 0, ad = null;
										var l = c.sibling;
										if (l !== null) U = l;
										else {
											var u = c.return;
											u === null ? U = null : (U = u, af(u));
										}
										break b;
									}
							}
							G = 0, ad = null, rf(e, t, o, 5);
							break;
						case 6:
							G = 0, ad = null, rf(e, t, o, 6);
							break;
						case 8:
							Wd(), K = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				ef();
				break;
			} catch (t) {
				Kd(e, t);
			}
		while (1);
		return ba = ya = null, N.H = r, N.A = a, H = n, U === null ? (id = null, W = 0, Di(), K) : 0;
	}
	function ef() {
		for (; U !== null && !He();) tf(U);
	}
	function tf(e) {
		var t = gl(e.alternate, e, ld);
		e.memoizedProps = e.pendingProps, t === null ? af(e) : U = t;
	}
	function nf(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Zc(n, t, t.pendingProps, t.type, void 0, W);
				break;
			case 11:
				t = Zc(n, t, t.pendingProps, t.type.render, t.ref, W);
				break;
			case 5:
				ls(t);
				var r = t;
				r === oa && (L ? (pa(r), r.tag === 5 && r.stateNode != null && (sa = r.stateNode)) : (pa(r), L = !0));
			default: Tl(n, t), t = U = Ri(t, ld), t = gl(n, t, ld);
		}
		e.memoizedProps = e.pendingProps, t === null ? af(e) : U = t;
	}
	function rf(e, t, n, r) {
		ba = ya = null, ls(t), co = null, lo = 0;
		var i = t.return;
		try {
			if (Ic(e, i, t, n, W)) {
				K = 1, jc(e, Gi(n, e.current)), U = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw U = i, t;
			K = 1, jc(e, Gi(n, e.current)), U = null;
			return;
		}
		t.flags & 32768 ? (L || r === 1 ? e = !0 : sd || W & 536870912 ? e = !1 : (od = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Po.current, r !== null && r.tag === 13 && (r.flags |= 16384))), of(t, e)) : af(t);
	}
	function af(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				of(t, od);
				return;
			}
			e = t.return;
			var n = Cl(t.alternate, t, ld);
			if (n !== null) {
				U = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				U = t;
				return;
			}
			U = t = e;
		} while (t !== null);
		K === 0 && (K = 5);
	}
	function of(e, t) {
		do {
			var n = wl(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, U = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				U = e;
				return;
			}
			U = e = n;
		} while (e !== null);
		K = 6, U = null;
	}
	function sf(e, t, n, r, a, o, s, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			hf();
		while (Cd !== 0);
		if (H & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			e === id && (U = id = null, W = 0), Td = t, wd = e, Ed = n, Od = a, kd = r, cf(e, t, n, s, c, l, f);
		}
	}
	function cf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (Dd = s, s |= Ei, _t(e, n, s, r, i, a), jd = null, (n & 335544064) === n ? (Md = za(e), r = 10262) : (Md = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, Cf(Je, function() {
			return gf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Wl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = N.T, N.T = null, i = P.p, P.p = 2, a = H, H |= 4;
			try {
				vu(e, t, n);
			} finally {
				H = a, P.p = i, N.T = r;
			}
		}
		Cd = 1, Wl ? Ad = Mp(o, e.containerInfo, Md, df, ff, uf, pf, gf, lf, null, null) : (df(), ff(), pf());
	}
	function lf(e) {
		if (Cd !== 0) {
			var t = wd.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function uf() {
		Cd === 3 && (Cd = 0, Ru(Td, wd), Cd = 4);
	}
	function df() {
		if (Cd === 1) {
			Cd = 0;
			var e = wd, t = Td, n = Ed, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = N.T, N.T = null;
				var i = P.p;
				P.p = 2;
				var a = H;
				H |= 4;
				try {
					hu = gu = !1, Pu(t, e, n), n = up;
					var o = Xr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Yr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Zr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Jr(s, h), v = Jr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					gh = !!lp, up = lp = null;
				} finally {
					H = a, P.p = i, N.T = r;
				}
			}
			e.current = t, Cd = 2;
		}
	}
	function ff() {
		if (Cd === 2) {
			Cd = 0;
			var e = wd, t = Td, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = N.T, N.T = null;
				var r = P.p;
				P.p = 2;
				var i = H;
				H |= 4;
				try {
					bu(e, t.alternate, t);
				} finally {
					H = i, P.p = r, N.T = n;
				}
			}
			Cd = 3;
		}
	}
	function pf() {
		if (Cd === 4 || Cd === 3) {
			Cd = 0;
			var e = Ad;
			Ad = null, Ue();
			var t = wd, n = Td, r = Ed, i = kd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? Cd = 5 : (Cd = 0, Td = wd = null, mf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (Sd = null), St(r), n = n.stateNode, et && typeof et.onCommitFiberRoot == "function") try {
				et.onCommitFiberRoot($e, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = N.T, a = P.p, P.p = 2, N.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					N.T = n, P.p = a;
				}
			}
			if (i = jd, o = Md, Md = null, i !== null && (jd = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			Ed & 3 && hf(), kf(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Pd ? Nd++ : (Nd = 0, Pd = t) : (Nd = 0, Pd = null), Af(0, !1);
		}
	}
	function mf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ia(t)));
	}
	function hf() {
		return Ad !== null && (Ad.skipTransition(), Ad = null), df(), ff(), pf(), gf();
	}
	function gf() {
		if (Cd !== 5) return !1;
		var e = wd, t = Dd;
		Dd = 0;
		var n = St(Ed), r = N.T, a = P.p;
		try {
			P.p = 32 > n ? 32 : n, N.T = null, n = Od, Od = null;
			var o = wd, s = Ed;
			if (Cd = 0, Td = wd = null, Ed = 0, H & 6) throw Error(i(331));
			var c = H;
			if (H |= 4, $u(o.current), Gu(o, o.current, s, n), H = c, Af(0, !1), et && typeof et.onPostCommitFiberRoot == "function") try {
				et.onPostCommitFiberRoot($e, o);
			} catch {}
			return !0;
		} finally {
			P.p = a, N.T = r, mf(e, t);
		}
	}
	function _f(e, t, n) {
		t = Gi(n, t), t = Nc(e.stateNode, t, 2), e = xo(e, t, 2), e !== null && (gt(e, 2), kf(e));
	}
	function q(e, t, n) {
		if (e.tag === 3) _f(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				_f(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (Sd === null || !Sd.has(r))) {
					e = Gi(n, e), n = Pc(2), r = xo(t, n, 2), r !== null && (Fc(n, r, t, e), gt(r, 2), kf(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function vf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new rd();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (cd = !0, i.add(n), e = yf.bind(null, e, t, n), t.then(e, e));
	}
	function yf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, id === e && (W & n) === n && (K === 4 || K === 3 && (W & 62914560) === W && 300 > We() - vd ? H & 2 ? fd |= n : Gd(e, 0) : fd |= n, md === W && (md = 0)), kf(e);
	}
	function bf(e, t) {
		t === 0 && (t = mt()), e = Ai(e, t), e !== null && (gt(e, t), kf(e));
	}
	function xf(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), bf(e, n);
	}
	function Sf(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), bf(e, n);
	}
	function Cf(e, t) {
		return Be(e, t);
	}
	var wf = null, J = null, Tf = !1, Ef = !1, Df = !1, Of = 0;
	function kf(e) {
		e !== J && e.next === null && (J === null ? wf = J = e : J = J.next = e), Ef = !0, Tf || (Tf = !0, Y());
	}
	function Af(e, t) {
		if (!Df && Ef) {
			Df = !0;
			do
				for (var n = !1, r = wf; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - nt(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Ff(r, a));
						} else a = W, a = ut(r, r === id ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || dt(r, a) || (n = !0, Ff(r, a));
					}
					r = r.next;
				}
			while (n);
			Df = !1;
		}
	}
	function jf() {
		Mf();
	}
	function Mf() {
		Ef = Tf = !1;
		var e = 0;
		Of !== 0 && hp() && (e = Of);
		for (var t = We(), n = null, r = wf; r !== null;) {
			var i = r.next, a = Nf(r, t);
			a === 0 ? (r.next = null, n === null ? wf = i : n.next = i, i === null && (J = n)) : (n = r, (e !== 0 || a & 3) && (Ef = !0)), r = i;
		}
		Cd !== 0 && Cd !== 5 || Af(e, !1), Of !== 0 && (Of = 0);
	}
	function Nf(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - nt(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = pt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = id, n = W, n = ut(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (G === 2 || G === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Ve(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || dt(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Ve(r), St(n)) {
				case 2:
				case 8:
					n = qe;
					break;
				case 32:
					n = Je;
					break;
				case 268435456:
					n = Xe;
					break;
				default: n = Je;
			}
			return r = Pf.bind(null, e), n = Be(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Ve(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Pf(e, t) {
		if (Cd !== 0 && Cd !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (hf() && e.callbackNode !== n) return null;
		var r = W;
		return r = ut(e, e === id ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (zd(e, r, t), Nf(e, We()), e.callbackNode != null && e.callbackNode === n ? Pf.bind(null, e) : null);
	}
	function Ff(e, t) {
		if (hf()) return null;
		zd(e, t, !0);
	}
	function Y() {
		bp(function() {
			H & 6 ? Be(Ke, jf) : Mf();
		});
	}
	function If() {
		if (Of === 0) {
			var e = Ha;
			e === 0 && (e = ot, ot <<= 1, !(ot & 261888) && (ot = 256)), Of = e;
		}
		return Of;
	}
	function Lf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : bn(e);
	}
	function Rf(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Lf((i[Et] || null).action), o = r.submitter;
			o && (t = (t = o[Et] || null) ? Lf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Hn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Of !== 0) {
								var e = new FormData(i, o);
								ac(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), ac(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var zf = 0; zf < _i.length; zf++) {
		var Bf = _i[zf];
		vi(Bf.toLowerCase(), "on" + (Bf[0].toUpperCase() + Bf.slice(1)));
	}
	vi(li, "onAnimationEnd"), vi(ui, "onAnimationIteration"), vi(di, "onAnimationStart"), vi("dblclick", "onDoubleClick"), vi("focusin", "onFocus"), vi("focusout", "onBlur"), vi(fi, "onTransitionRun"), vi(pi, "onTransitionStart"), vi(mi, "onTransitionCancel"), vi(hi, "onTransitionEnd"), Wt("onMouseEnter", ["mouseout", "mouseover"]), Wt("onMouseLeave", ["mouseout", "mouseover"]), Wt("onPointerEnter", ["pointerout", "pointerover"]), Wt("onPointerLeave", ["pointerout", "pointerover"]), Ut("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Ut("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Ut("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Ut("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Ut("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Ut("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Vf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Hf = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Vf));
	function X(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Ci(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Ci(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Z(e, t) {
		var n = t[Ot];
		n === void 0 && (n = t[Ot] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Kf(t, e, 2, !1), n.add(r));
	}
	function Uf(e, t, n) {
		var r = 0;
		t && (r |= 4), Kf(n, e, r, t);
	}
	var Wf = "_reactListening" + Math.random().toString(36).slice(2);
	function Gf(e) {
		if (!e[Wf]) {
			e[Wf] = !0, Vt.forEach(function(t) {
				t !== "selectionchange" && (Hf.has(t) || Uf(t, !1, e), Uf(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Wf] || (t[Wf] = !0, Uf("selectionchange", !1, t));
		}
	}
	function Kf(e, t, n, r) {
		switch (Ch(t)) {
			case 2:
				var i = _h;
				break;
			case 8:
				i = vh;
				break;
			default: i = yh;
		}
		n = i.bind(null, t, n, e), i = void 0, !jn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function qf(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = Ft(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		On(function() {
			var r = a, i = Cn(n), s = [];
			a: {
				var c = gi.get(e);
				if (c !== void 0) {
					var l = Hn, u = e;
					switch (e) {
						case "keypress": if (Ln(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = or;
							break;
						case "focusin":
							u = "focus", l = Zn;
							break;
						case "focusout":
							u = "blur", l = Zn;
							break;
						case "beforeblur":
						case "afterblur":
							l = Zn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Yn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Xn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = lr;
							break;
						case li:
						case ui:
						case di:
							l = Qn;
							break;
						case hi:
							l = ur;
							break;
						case "scroll":
						case "scrollend":
							l = Wn;
							break;
						case "wheel":
							l = dr;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = $n;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = sr;
							break;
						case "submit":
							l = cr;
							break;
						case "toggle":
						case "beforetoggle": l = fr;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = kn(m, p), g != null && d.push(Jf(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== Sn && (u = n.relatedTarget || n.fromElement) && (Ft(u) || u[Dt])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Ft(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = Yn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = sr, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : Lt(c), h = l == null ? u : Lt(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, Ft(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? ee(c, l, Xf) : null, c !== null && Zf(s, u, c, d, !1), l !== null && f !== null && Zf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? Lt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = Mr;
					else if (Er(c)) {
						if (Nr) _ = Hr;
						else {
							_ = Br;
							var v = zr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && _n(r.elementType) && (_ = Mr) : _ = Vr;
					if (_ &&= _(e, r)) {
						Dr(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? Lt(r) : window, e) {
					case "focusin":
						(Er(v) || v.contentEditable === "true") && ($r = v, ei = r, ti = null);
						break;
					case "focusout":
						ti = ei = $r = null;
						break;
					case "mousedown":
						ni = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						ni = !1, ri(s, n, i);
						break;
					case "selectionchange": if (Qr) break;
					case "keydown":
					case "keyup": ri(s, n, i);
				}
				var y;
				if (mr) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else Sr ? br(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (_r && n.locale !== "ko" && (Sr || b !== "onCompositionStart" ? b === "onCompositionEnd" && Sr && (y = In()) : (Nn = i, Pn = "value" in Nn ? Nn.value : Nn.textContent, Sr = !0)), v = Yf(r, b), 0 < v.length && (b = new er(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = xr(n), y !== null && (b.data = y)))), (y = gr ? Cr(e, n) : wr(e, n)) && (b = Yf(r, "onBeforeInput"), 0 < b.length && (v = new er("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: v,
					listeners: b
				}), v.data = y)), Rf(s, e, r, n, i);
			}
			X(s, t);
		});
	}
	function Jf(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Yf(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = kn(e, n), i != null && r.unshift(Jf(e, i, a)), i = kn(e, t), i != null && r.push(Jf(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Xf(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Zf(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = kn(n, a), l != null && o.unshift(Jf(n, l, c))) : i || (l = kn(n, a), l != null && o.push(Jf(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Qf = /\r\n?/g, $f = /\u0000|\uFFFD/g;
	function ep(e) {
		return (typeof e == "string" ? e : "" + e).replace(Qf, "\n").replace($f, "");
	}
	function tp(e, t) {
		return t = ep(t), ep(e) === t;
	}
	function np(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || pn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && pn(e, "" + r);
				else return;
				break;
			case "className":
				Zt(e, "class", r);
				break;
			case "tabIndex":
				Zt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Zt(e, n, r);
				break;
			case "style":
				gn(e, r, o);
				return;
			case "data": if (t !== "object") {
				Zt(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = bn(r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && np(e, t, "name", a.name, a, null), np(e, t, "formEncType", a.formEncType, a, null), np(e, t, "formMethod", a.formMethod, a, null), np(e, t, "formTarget", a.formTarget, a, null)) : (np(e, t, "encType", a.encType, a, null), np(e, t, "method", a.method, a, null), np(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = bn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = xn);
				return;
			case "onScroll":
				r != null && Z("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Z("scrollend", e);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = bn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Z("beforetoggle", e), Z("toggle", e), Xt(e, "popover", r);
				break;
			case "xlinkActuate":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Qt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Xt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = vn.get(n) || n, Xt(e, n, r);
			else return;
		}
		I = !0;
	}
	function rp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				gn(e, r, o);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "children":
				if (typeof r == "string") pn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") pn(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Z("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Z("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = xn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Ht.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[Et] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					I = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Xt(e, n, r);
				}
				return;
		}
		I = !0;
	}
	function ip(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Z("error", e), Z("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: np(e, t, o, s, n, null);
					}
				}
				a && np(e, t, "srcSet", n.srcSet, n, null), r && np(e, t, "src", n.src, n, null);
				return;
			case "input":
				Z("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: np(e, t, r, d, n, null);
					}
				}
				cn(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Z("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: np(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && un(e, !!r, n, !0) : un(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Z("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: np(e, t, s, c, n, null);
				}
				fn(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: np(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Z("beforetoggle", e), Z("toggle", e), Z("cancel", e), Z("close", e);
				break;
			case "iframe":
			case "object":
				Z("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < Vf.length; r++) Z(Vf[r], e);
				break;
			case "image":
				Z("error", e), Z("load", e);
				break;
			case "details":
				Z("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Z("error", e), Z("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: np(e, t, u, r, n, null);
				}
				return;
			default: if (_n(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && rp(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && np(e, t, c, r, n, null));
	}
	var ap = {};
	function op(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || np(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							m !== f && (I = !0), o = m;
							break;
						case "name":
							m !== f && (I = !0), a = m;
							break;
						case "checked":
							m !== f && (I = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (I = !0), d = m;
							break;
						case "value":
							m !== f && (I = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (I = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && np(e, t, p, m, r, f);
					}
				}
				sn(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || np(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (I = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (I = !0), c = o;
						break;
					case "multiple": o !== l && (I = !0), s = o;
					default: o !== l && np(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? un(e, !!n, n ? [] : "", !1) : un(e, !!n, t, !0)) : un(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: np(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (I = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (I = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && np(e, t, s, a, r, o);
				}
				dn(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: np(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						p !== m && (I = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: np(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && np(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: np(e, t, u, p, r, m);
				}
				return;
			default: if (_n(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && rp(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || rp(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && np(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || np(e, t, f, p, r, m);
	}
	function sp(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function cp() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && sp(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && sp(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var lp = null, up = null;
	function dp(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function fp(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function pp(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Q(e, t, n, r) {
		return n = dp(n).createElement(e), n[F] = r, n[Et] = t, ip(n, e, t), zt(n), n;
	}
	function $(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var mp = null;
	function hp() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== mp && (mp = e, !0) : (mp = null, !1);
	}
	var gp = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, vp = typeof Promise == "function" ? Promise : void 0, yp = typeof requestAnimationFrame == "function" ? requestAnimationFrame : gp, bp = typeof queueMicrotask == "function" ? queueMicrotask : vp === void 0 ? gp : function(e) {
		return vp.resolve(null).then(e).catch(xp);
	};
	function xp(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Sp(e) {
		return e === "head";
	}
	function Cp(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Hh(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") _m(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, _m(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[Mt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && _m(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Hh(t);
	}
	function wp(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function Tp(e, t, n) {
		if (t = CSS.escape(t) === t ? t : "r-" + btoa(t).replace(/=/g, ""), e.style.viewTransitionName = t, n != null && (e.style.viewTransitionClass = n), n = getComputedStyle(e), n.display === "inline") {
			if (t = e.getClientRects(), t.length === 1) var r = 1;
			else for (var i = r = 0; i < t.length; i++) {
				var a = t[i];
				0 < a.width && 0 < a.height && r++;
			}
			r === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + n.paddingTop, e.marginBottom = "-" + n.paddingBottom);
		}
	}
	function Ep(e, t) {
		e = e.style, t = t.style;
		var n = t == null ? null : t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null;
		e.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = t == null ? null : t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null, e.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (n = t.display, e.display = n == null || typeof n == "boolean" ? "" : n, n = t.margin, n == null ? (n = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = n == null || typeof n == "boolean" ? "" : n, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t) : e.margin = n));
	}
	function Dp(e, t, n) {
		return n = n.ownerDocument.defaultView, {
			rect: e,
			abs: t.position === "absolute" || t.position === "fixed",
			clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
			view: 0 <= e.bottom && 0 <= e.right && e.top <= n.innerHeight && e.left <= n.innerWidth
		};
	}
	function Op(e) {
		return Dp(e.getBoundingClientRect(), getComputedStyle(e), e);
	}
	function kp(e) {
		var t = e.getBoundingClientRect();
		t = new DOMRect(t.x + 2e4, t.y + 2e4, t.width, t.height);
		var n = getComputedStyle(e);
		return Dp(t, n, e);
	}
	function Ap(e) {
		return e.documentElement.clientHeight;
	}
	function jp(e) {
		this.addEventListener("load", e), this.addEventListener("error", e);
	}
	function Mp(e, t, n, r, i, a, o, s, c) {
		var l = t.nodeType === 9 ? t : t.ownerDocument;
		try {
			var u = l.startViewTransition({
				update: function() {
					var t = l.defaultView, n = t.navigation && t.navigation.transition, o = l.fonts.status;
					r();
					var s = [];
					if (o === "loaded" && (Ap(l), l.fonts.status === "loading" && s.push(l.fonts.ready)), o = s.length, e !== null) for (var c = e.suspenseyImages, u = 0, d = 0; d < c.length; d++) {
						var f = c[d];
						if (!f.complete) {
							var p = f.getBoundingClientRect();
							if (0 < p.bottom && 0 < p.right && p.top < t.innerHeight && p.left < t.innerWidth) {
								if (u += Xm(f), u > $m) {
									s.length = o;
									break;
								}
								f = new Promise(jp.bind(f)), s.push(f);
							}
						}
					}
					if (0 < s.length) return t = Promise.race([Promise.all(s), new Promise(function(e) {
						return setTimeout(e, 500);
					})]).then(i, i), (n ? Promise.allSettled([n.finished, t]) : t).then(a, a);
					if (i(), n) return n.finished.then(a, a);
					a();
				},
				types: n
			});
			l.__reactViewTransition = u;
			var d = [];
			return u.ready.then(function() {
				for (var e = l.documentElement.getAnimations({ subtree: !0 }), t = 0; t < e.length; t++) {
					var n = e[t], r = n.effect, i = r.pseudoElement;
					if (i != null && i.startsWith("::view-transition")) {
						d.push(n), n = r.getKeyframes();
						for (var a = i = void 0, s = !0, c = 0; c < n.length; c++) {
							var u = n[c], f = u.width;
							if (i === void 0) i = f;
							else if (i !== f) {
								s = !1;
								break;
							}
							if (f = u.height, a === void 0) a = f;
							else if (a !== f) {
								s = !1;
								break;
							}
							delete u.width, delete u.height, u.transform === "none" && delete u.transform;
						}
						s && i !== void 0 && a !== void 0 && (r.setKeyframes(n), s = getComputedStyle(r.target, r.pseudoElement), s.width !== i || s.height !== a) && (s = n[0], s.width = i, s.height = a, s = n[n.length - 1], s.width = i, s.height = a, r.setKeyframes(n));
					}
				}
				o();
			}, function(e) {
				l.__reactViewTransition === u && (l.__reactViewTransition = null);
				try {
					if (typeof e == "object" && e) switch (e.name) {
						case "InvalidStateError": (e.message === "View transition was skipped because document visibility state is hidden." || e.message === "Skipping view transition because document visibility state has become hidden." || e.message === "Skipping view transition because viewport size changed." || e.message === "Transition was aborted because of invalid state") && (e = null);
					}
					e !== null && c(e);
				} finally {
					r(), i(), o();
				}
			}), u.finished.finally(function() {
				for (var e = 0; e < d.length; e++) d[e].cancel();
				l.__reactViewTransition === u && (l.__reactViewTransition = null), s();
			}), u;
		} catch {
			return r(), i(), o(), null;
		}
	}
	function Np(e, t) {
		this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
	}
	Np.prototype.animate = function(e, t) {
		return t = typeof t == "number" ? { duration: t } : E({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
	}, Np.prototype.getAnimations = function() {
		for (var e = this._scope, t = this._selector, n = e.getAnimations({ subtree: !0 }), r = [], i = 0; i < n.length; i++) {
			var a = n[i].effect;
			a !== null && a.target === e && a.pseudoElement === t && r.push(n[i]);
		}
		return r;
	}, Np.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function Pp(e) {
		return {
			name: e,
			group: new Np("group", e),
			imagePair: new Np("image-pair", e),
			old: new Np("old", e),
			new: new Np("new", e)
		};
	}
	function Fp(e) {
		this._fragmentFiber = e, this._observers = this._eventListeners = null;
	}
	Fp.prototype.addEventListener = function(e, t, n) {
		var r = null, i = null;
		if (!(n != null && typeof n != "boolean" && (r = n.signal || null, r !== null && r.aborted))) {
			this._eventListeners === null && (this._eventListeners = []);
			var a = this._eventListeners;
			if (Bp(a, e, t, n) === -1) {
				var o = this, s = t;
				n != null && typeof n != "boolean" && !0 === n.once && (s = function(r) {
					o.removeEventListener(e, t, n), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
				}), r !== null && (i = o.removeEventListener.bind(o, e, t, n), r.addEventListener("abort", i, { once: !0 }), i = r.removeEventListener.bind(r, "abort", i)), r = Rp(n), a.push({
					type: e,
					listener: t,
					optionsOrUseCapture: n,
					attachedListener: s,
					cleanup: i
				}), h(this._fragmentFiber.child, !1, Ip, e, s, r);
			}
			this._eventListeners = a;
		}
	};
	function Ip(e, t, n, r) {
		return b(e).addEventListener(t, n, r), !1;
	}
	Fp.prototype.removeEventListener = function(e, t, n) {
		var r = this._eventListeners;
		if (r !== null && (t = Bp(r, e, t, n), t !== -1)) {
			var i = r[t];
			n = i.attachedListener;
			var a = i.cleanup;
			i = Rp(i.optionsOrUseCapture), h(this._fragmentFiber.child, !1, Lp, e, n, i), r.splice(t, 1), a !== null && a();
		}
	};
	function Lp(e, t, n, r) {
		return b(e).removeEventListener(t, n, r), !1;
	}
	function Rp(e) {
		return e != null && typeof e != "boolean" && (!0 === e.once || e.signal instanceof AbortSignal) ? {
			capture: e.capture,
			passive: e.passive
		} : e;
	}
	function zp(e) {
		return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
	}
	function Bp(e, t, n, r) {
		if (e.length === 0) return -1;
		r = zp(r);
		for (var i = 0; i < e.length; i++) {
			var a = e[i];
			if (a.type === t && a.listener === n && zp(a.optionsOrUseCapture) === r) return i;
		}
		return -1;
	}
	Fp.prototype.dispatchEvent = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return !0;
		t = b(t);
		var n = this._eventListeners;
		if (n !== null && 0 < n.length || !e.bubbles) {
			var r = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
			if (n) for (var i = 0; i < n.length; i++) {
				var a = n[i];
				r.addEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			}
			if (t.appendChild(r), e = r.dispatchEvent(e), n) for (i = 0; i < n.length; i++) a = n[i], r.removeEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			return t.removeChild(r), e;
		}
		return t.dispatchEvent(e);
	}, Fp.prototype.focus = function(e) {
		h(this._fragmentFiber.child, !0, Vp, e, void 0, void 0);
	};
	function Vp(e, t) {
		return e.tag !== 6 && (e = b(e), pm(e, t));
	}
	Fp.prototype.focusLast = function(e) {
		var t = [];
		h(this._fragmentFiber.child, !0, Hp, t, void 0, void 0);
		for (var n = t.length - 1; 0 <= n && !Vp(t[n], e); n--);
	};
	function Hp(e, t) {
		return t.push(e), !1;
	}
	Fp.prototype.blur = function() {
		var e = g(this._fragmentFiber);
		e !== null && (e = b(e), e = dp(e).activeElement, e !== null && h(this._fragmentFiber.child, !1, Up, e, void 0, void 0));
	};
	function Up(e, t) {
		return e.tag !== 6 && (e = b(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
	}
	Fp.prototype.observeUsing = function(e) {
		this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), h(this._fragmentFiber.child, !1, Wp, e, void 0, void 0);
	};
	function Wp(e, t) {
		return e.tag === 6 || (e = b(e), t.observe(e)), !1;
	}
	Fp.prototype.unobserveUsing = function(e) {
		var t = this._observers;
		if (t !== null && t.has(e)) {
			t.delete(e), h(this._fragmentFiber.child, !1, Gp, e, void 0, void 0);
			for (var n = t = 0; n < Kp.length; n++) {
				var r = Kp[n];
				r.fragmentInstance === this && r.observer === e ? e.unobserve(r.instance) : Kp[t++] = r;
			}
			Kp.length = t;
		}
	};
	function Gp(e, t) {
		return e.tag === 6 || (e = b(e), t.unobserve(e)), !1;
	}
	var Kp = [], qp = !1;
	function Jp(e, t, n) {
		Kp.push({
			fragmentInstance: e,
			observer: t,
			instance: n
		}), qp || (qp = !0, mm(function() {
			qp = !1;
			var e = Kp;
			Kp = [];
			for (var t = 0; t < e.length; t++) {
				var n = e[t];
				n.observer.unobserve(n.instance);
			}
		}));
	}
	Fp.prototype.getClientRects = function() {
		var e = [];
		return h(this._fragmentFiber.child, !1, Yp, e, void 0, void 0), e;
	};
	function Yp(e, t) {
		if (e.tag === 6) {
			e = e.stateNode;
			var n = e.ownerDocument.createRange();
			n.selectNodeContents(e), t.push.apply(t, n.getClientRects());
		} else e = b(e), t.push.apply(t, e.getClientRects());
		return !1;
	}
	Fp.prototype.getRootNode = function(e) {
		var t = g(this._fragmentFiber);
		return t === null ? this : b(t).getRootNode(e);
	}, Fp.prototype.compareDocumentPosition = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var n = [];
		h(this._fragmentFiber.child, !1, Hp, n, void 0, void 0);
		var r = b(t);
		if (n.length === 0) {
			if (n = r, _(this._fragmentFiber)) {
				a: {
					for (t = this._fragmentFiber.return; t !== null;) {
						if (t.tag === 4) {
							t = t.stateNode.containerInfo;
							break a;
						}
						if (t.tag === 3 || t.tag === 5 || t.tag === 27) break;
						t = t.return;
					}
					t = null;
				}
				t != null && (n = t);
			}
			t = this._fragmentFiber;
			var i = r = n.compareDocumentPosition(e);
			return n === e ? i = Node.DOCUMENT_POSITION_CONTAINS : r & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = v(t)[1], n === null ? i = Node.DOCUMENT_POSITION_PRECEDING : (e = b(n).compareDocumentPosition(e), i = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), i |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		t = b(n[0]), i = b(n[n.length - 1]);
		var a = _(this._fragmentFiber) ? t.parentElement : r;
		if (a == null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		r = a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, a = a.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var o = t.compareDocumentPosition(e), s = i.compareDocumentPosition(e), c = o & Node.DOCUMENT_POSITION_CONTAINED_BY || s & Node.DOCUMENT_POSITION_CONTAINED_BY;
		return s = r && a && o & Node.DOCUMENT_POSITION_FOLLOWING && s & Node.DOCUMENT_POSITION_PRECEDING, t = r && t === e || a && i === e || c || s ? Node.DOCUMENT_POSITION_CONTAINED_BY : !r && t === e || !a && i === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : o, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || Xp(t, this._fragmentFiber, n[0], n[n.length - 1], e) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function Xp(e, t, n, r, i) {
		var a = Ft(i);
		if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (n = !!a) a: {
				for (; a !== null;) {
					if (a.tag === 7 && (a === t || a.alternate === t)) {
						n = !0;
						break a;
					}
					a = a.return;
				}
				n = !1;
			}
			return n;
		}
		if (e & Node.DOCUMENT_POSITION_CONTAINS) {
			if (a === null) return a = i.ownerDocument, i === a || i === a.documentElement || i === a.body;
			a: {
				for (a = t, t = g(t); a !== null;) {
					if (!(a.tag !== 5 && a.tag !== 3 && a.tag !== 27 || a !== t && a.alternate !== t)) {
						a = !0;
						break a;
					}
					a = a.return;
				}
				a = !1;
			}
			return a;
		}
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = ee(n, a, T), t === null ? t = !1 : (h(t, !0, C, a, n), a = x, x = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = ee(r, a, T), t === null ? t = !1 : (h(t, !0, w, a, r), a = x, S = x = null, t = a !== null)), t) : !1;
	}
	function Zp(e, t) {
		var n = e.ownerDocument.createRange();
		n.selectNodeContents(e), e = n.getBoundingClientRect(), window.scrollTo(window.scrollX + e.left, t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight);
	}
	Fp.prototype.scrollIntoView = function(e) {
		if (typeof e == "object") throw Error(i(566));
		var t = [];
		h(this._fragmentFiber.child, !1, Hp, t, void 0, void 0);
		var n = !1 !== e;
		if (t.length === 0) {
			var r = v(this._fragmentFiber);
			if (r = n ? r[1] || r[0] || g(this._fragmentFiber) : r[0] || r[1], r === null) return;
			if (r.tag === 6) {
				e = b(r), Zp(e, n);
				return;
			}
			if (r = b(r), r.nodeType !== 9) {
				if (r.nodeType === 11) {
					n = "host" in r ? r.host : null, n !== null && n.scrollIntoView(e);
					return;
				}
				r.scrollIntoView(e);
			}
		}
		for (r = n ? t.length - 1 : 0; r !== (n ? -1 : t.length);) {
			var a = t[r];
			a.tag === 6 ? (a = b(a), Zp(a, n)) : b(a).scrollIntoView(e), r += n ? -1 : 1;
		}
	};
	function Qp(e, t) {
		return e = b(e), $p(e, t), !1;
	}
	function $p(e, t) {
		e.reactFragments ??= /* @__PURE__ */ new Set(), e.reactFragments.add(t);
	}
	function em(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.addEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			for (var r = 0, i = 0; i < Kp.length; i++) {
				var a = Kp[i];
				(a.fragmentInstance !== t || a.observer !== n || a.instance !== e) && (Kp[r++] = a);
			}
			Kp.length = r, n.observe(e);
		}), $p(e, t));
	}
	function tm(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.removeEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			typeof n.rootMargin == "string" ? Jp(t, n, e) : n.unobserve(e);
		}), e.reactFragments != null && e.reactFragments.delete(t));
	}
	function nm(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					nm(n), Pt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function rm(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[Mt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = lm(e.nextSibling), e === null) break;
		}
		return null;
	}
	function im(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function am(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function om(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function sm(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function cm(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function lm(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var um = null;
	function dm(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return lm(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function fm(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function pm(e, t) {
		function n() {
			r = !0;
		}
		if (e.ownerDocument.activeElement === e) return !0;
		var r = !1;
		try {
			e.ownerDocument.addEventListener("focus", n, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
		} finally {
			e.ownerDocument.removeEventListener("focus", n, !0);
		}
		return r;
	}
	function mm(e) {
		yp(function() {
			yp(function(t) {
				return e(t);
			});
		});
	}
	function hm(e, t, n) {
		switch (t = dp(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function gm(e, t, n) {
		for (var r in n) {
			var i = n[r];
			n.hasOwnProperty(r) && i != null && np(e, t, r, null, ap, i);
		}
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === xn && (e.onclick = null), Pt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Pt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = P.d;
	P.d = {
		f: Sm,
		r: Cm,
		D: Em,
		C: Dm,
		L: Om,
		m: km,
		X: jm,
		S: Am,
		M: Mm
	};
	function Sm() {
		var e = xm.f(), t = Ud();
		return e || t;
	}
	function Cm(e) {
		var t = It(e);
		t !== null && t.tag === 5 && t.type === "form" ? sc(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = on(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), ip(t, "link", e), zt(t), r.head.appendChild(t)));
		}
	}
	function Em(e) {
		xm.D(e), Tm("dns-prefetch", e, null);
	}
	function Dm(e, t) {
		xm.C(e, t), Tm("preconnect", e, t);
	}
	function Om(e, t, n) {
		xm.L(e, t, n);
		var r = wm;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + on(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + on(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + on(n.imageSizes) + "\"]")) : i += "[href=\"" + on(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = E({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				ip(o, "link", e), t === "style" && (o[Nt] = !0, o.onload = o.onerror = function() {
					Bt(o);
				}), zt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + on(r) + "\"][href=\"" + on(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = E({
				rel: "modulepreload",
				href: e
			}, t), vm.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(zm(a))) return;
				}
				r = n.createElement("link"), ip(r, "link", e), zt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Rt(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = E({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					zt(c), ip(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Vm(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function jm(e, t) {
		xm.X(e, t);
		var n = wm;
		if (n && e) {
			var r = Rt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), zt(a), ip(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mm(e, t) {
		xm.M(e, t);
		var n = wm;
		if (n && e) {
			var r = Rt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), zt(a), ip(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = Ee.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Rt(a).hoistableStyles, r = t.get(n), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Pm(n.href);
					var o = Rt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(Fm(e))) ? o._p || (s.instance = o, s.state.loading = 5) : (o = vm.get(e), o || (o = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, vm.set(e, o)), Lm(a, e, o, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Rt(a).hoistableScripts, r = t.get(n), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Pm(e) {
		return "href=\"" + on(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return E({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Nt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Nt] = !0, t.onload = t.onerror = Bt.bind(null, t), ip(t, "link", n), zt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + on(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + on(n.href) + "\"]");
				if (r) return t.instance = r, zt(r), r;
				var a = E({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), zt(r), ip(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, zt(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), zt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), ip(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, zt(a), a) : (r = n, (a = vm.get(o)) && (r = E({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), zt(a), ip(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Vm(r, n.precedence, e));
		return t.instance;
	}
	function Vm(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Hm(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function Um(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Wm = null;
	function Gm(e, t, n) {
		if (Wm === null) {
			var r = /* @__PURE__ */ new Map(), i = Wm = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Wm, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[Mt] || a[F] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Km(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function qm(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Jm(e, t) {
		return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
	}
	function Ym(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xm(e) {
		return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * .25;
	}
	function Zm(e, t) {
		typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += Xm(t), e.suspenseyImages.push(t)), e = rh.bind(e), t.decode().then(e, e));
	}
	function Qm(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Pm(r.href), a = t.querySelector(Fm(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, zt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), zt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), ip(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = nh.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var $m = 0;
	function eh(e, t) {
		return e.stylesheets && e.count === 0 && ah(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && ah(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && $m === 0 && ($m = 62500 * cp());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ah(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > $m ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function th(e) {
		if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
			if (e.stylesheets) ah(e, e.stylesheets);
			else if (e.unsuspend) {
				var t = e.unsuspend;
				e.unsuspend = null, t();
			}
		}
	}
	function nh() {
		this.count--, th(this);
	}
	function rh() {
		this.imgCount--, th(this);
	}
	var ih = null;
	function ah(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ih = /* @__PURE__ */ new Map(), t.forEach(oh, e), ih = null, nh.call(e));
	}
	function oh(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ih.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ih.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = nh.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var sh = {
		$$typeof: A,
		Provider: null,
		Consumer: null,
		_currentValue: ve,
		_currentValue2: ve,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = ht(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ht(0), this.hiddenUpdates = ht(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = Fi(3, null, null, t), e.current = a, a.stateNode = e, t = Fa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, vo(a), e;
	}
	function uh(e) {
		return e ? (e = Ni, e) : Ni;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = bo(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = xo(e, r, t), n !== null && (Rd(n, e, t), So(n, e, t));
	}
	function fh(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ph(e, t) {
		fh(e, t), (e = e.alternate) && fh(e, t);
	}
	function mh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Ai(e, 67108864);
			t !== null && Rd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Fd();
			t = xt(t);
			var n = Ai(e, t);
			n !== null && Rd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = N.T;
		N.T = null;
		var a = P.p;
		try {
			P.p = 2, yh(e, t, n, r);
		} finally {
			P.p = a, N.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = N.T;
		N.T = null;
		var a = P.p;
		try {
			P.p = 8, yh(e, t, n, r);
		} finally {
			P.p = a, N.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) qf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = It(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = lt(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - nt(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									kf(a), !(H & 6) && (bd = We() + 500, Af(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = Ai(a, 2), s !== null && Rd(s, a, 2), Ud(), ph(a, 2);
					}
					if (a = bh(r), a === null && qf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else qf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = Cn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Ft(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return xh = e, null;
	}
	function Ch(e) {
		switch (e) {
			case "beforetoggle":
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
			case "seeked":
			case "submit":
			case "toggle":
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
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
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
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (Ge()) {
				case Ke: return 2;
				case qe: return 8;
				case Je:
				case Ye: return 32;
				case Xe: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var wh = !1, Th = null, Eh = null, Dh = null, Oh = /* @__PURE__ */ new Map(), kh = /* @__PURE__ */ new Map(), Ah = [], jh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Mh(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Th = null;
				break;
			case "dragenter":
			case "dragleave":
				Eh = null;
				break;
			case "mouseover":
			case "mouseout":
				Dh = null;
				break;
			case "pointerover":
			case "pointerout":
				Oh.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": kh.delete(t.pointerId);
		}
	}
	function Nh(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = It(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ph(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Th = Nh(Th, e, t, n, r, i), !0;
			case "dragenter": return Eh = Nh(Eh, e, t, n, r, i), !0;
			case "mouseover": return Dh = Nh(Dh, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Oh.set(a, Nh(Oh.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, kh.set(a, Nh(kh.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Fh(e) {
		var t = Ft(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, wt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, wt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Ih(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = bh(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Sn = r, n.target.dispatchEvent(r), Sn = null;
			} else return t = It(n), t !== null && mh(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Lh(e, t, n) {
		Ih(e) && n.delete(t);
	}
	function Rh() {
		wh = !1, Th !== null && Ih(Th) && (Th = null), Eh !== null && Ih(Eh) && (Eh = null), Dh !== null && Ih(Dh) && (Dh = null), Oh.forEach(Lh), kh.forEach(Lh);
	}
	function zh(e, n) {
		e.blockedOn === n && (e.blockedOn = null, wh || (wh = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Rh)));
	}
	var Bh = null;
	function Vh(e) {
		Bh !== e && (Bh = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Bh === e && (Bh = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Sh(r || n) === null) continue;
					break;
				}
				var a = It(n);
				a !== null && (e.splice(t, 3), t -= 3, ac(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Hh(e) {
		function t(t) {
			return zh(t, e);
		}
		Th !== null && zh(Th, e), Eh !== null && zh(Eh, e), Dh !== null && zh(Dh, e), Oh.forEach(t), kh.forEach(t);
		for (var n = 0; n < Ah.length; n++) {
			var r = Ah[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ah.length && (n = Ah[0], n.blockedOn === null);) Fh(n), n.blockedOn === null && Ah.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[Et] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[Et] || null) s = o.formAction;
					else if (Sh(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Vh(n);
			}
		}
	}
	function Uh() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Wh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.render = Wh.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		dh(n, Fd(), e, t, null, null);
	}, Gh.prototype.unmount = Wh.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			dh(e.current, 2, null, e, null, null), Ud(), t[Dt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Ct();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ah.length && t !== 0 && t < Ah[n].priority; n++);
			Ah.splice(n, 0, e), n === 0 && Fh(e);
		}
	};
	var Kh = n.version;
	if (Kh !== "19.3.0") throw Error(i(527, Kh, "19.3.0"));
	P.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.0",
		rendererPackageName: "react-dom",
		currentDispatcherRef: N,
		reconcilerVersion: "19.3.0"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			$e = Jh.inject(qh), et = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Oc, s = kc, c = Ac;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, o, s, c, Uh), e[Dt] = t.current, Gf(e), new Wh(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(f(), 1), v = g(), y = Object.defineProperty, b = (e, t) => y(e, "name", {
	value: t,
	configurable: !0
}), x = !!(typeof window < "u" && window.document && window.document.createElement);
function S(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return /* @__PURE__ */ b(function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	}, "handleEvent");
}
b(S, "composeEventHandlers");
function C(e) {
	if (!x) throw Error("Cannot access window outside of the DOM");
	return e?.ownerDocument?.defaultView ?? window;
}
b(C, "getOwnerWindow");
function w(e) {
	if (!x) throw Error("Cannot access document outside of the DOM");
	return e?.ownerDocument ?? document;
}
b(w, "getOwnerDocument");
function T(e, t = !1) {
	let { activeElement: n } = w(e);
	if (!n?.nodeName) return null;
	if (ee(n) && n.contentDocument) return T(n.contentDocument.body, t);
	if (t) {
		let e = n.getAttribute("aria-activedescendant");
		if (e) {
			let t = w(n).getElementById(e);
			if (t) return t;
		}
	}
	return n;
}
b(T, "getActiveElement");
function ee(e) {
	return e.tagName === "IFRAME";
}
b(ee, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var E = Object.defineProperty, D = (e, t) => E(e, "name", {
	value: t,
	configurable: !0
});
function te(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
D(te, "setRef");
function ne(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = te(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : te(e[t], null);
			}
		};
	};
}
D(ne, "composeRefs");
function O(...e) {
	return _.useCallback(ne(...e), e);
}
D(O, "useComposedRefs");
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var re = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), k = (/* @__PURE__ */ o(((e, t) => {
	t.exports = re();
})))(), ie = Object.defineProperty, A = (e, t) => ie(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function j(e, t) {
	let n = _.createContext(t);
	n.displayName = e + "Context";
	let r = /* @__PURE__ */ A((e) => {
		let { children: t, ...r } = e, i = _.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, k.jsx)(n.Provider, {
			value: i,
			children: t
		});
	}, "Provider");
	r.displayName = e + "Provider";
	function i(r, i = {}) {
		let { optional: a = !1 } = i, o = _.useContext(n);
		if (o) return o;
		if (t !== void 0) return t;
		if (!a) throw Error(`\`${r}\` must be used within \`${e}\``);
	}
	return A(i, "useContext"), [r, i];
}
A(j, "createContext");
// @__NO_SIDE_EFFECTS__
function ae(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = _.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = /* @__PURE__ */ A((t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = _.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, k.jsx)(s.Provider, {
				value: c,
				children: r
			});
		}, "Provider");
		o.displayName = t + "Provider";
		function s(n, o, s = {}) {
			let { optional: c = !1 } = s, l = o?.[e]?.[a] || i, u = _.useContext(l);
			if (u) return u;
			if (r !== void 0) return r;
			if (!c) throw Error(`\`${n}\` must be used within \`${t}\``);
		}
		return A(s, "useContext"), [o, s];
	}
	A(r, "createContext");
	let i = /* @__PURE__ */ A(() => {
		let t = n.map((e) => _.createContext(e));
		return /* @__PURE__ */ A(function(n) {
			let r = n?.[e] || t;
			return _.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		}, "useScope");
	}, "createScope");
	return i.scopeName = e, [r, oe(i, ...t)];
}
A(ae, "createContextScope");
function oe(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = /* @__PURE__ */ A(() => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return /* @__PURE__ */ A(function(e) {
			let r = n.reduce((t, { useScope: n, scopeName: r }) => {
				let i = n(e)[`__scope${r}`];
				return {
					...t,
					...i
				};
			}, {});
			return _.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
		}, "useComposedScopes");
	}, "createScope");
	return n.scopeName = t.scopeName, n;
}
A(oe, "composeContextScopes");
//#endregion
//#region node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var se = globalThis?.document ? _.useLayoutEffect : () => {}, ce = Object.defineProperty, le = (e, t) => ce(e, "name", {
	value: t,
	configurable: !0
}), M = _.useId || (() => void 0), ue = 0;
function de(e) {
	let [t, n] = _.useState(M());
	return se(() => {
		e || n((e) => e ?? String(ue++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
le(de, "useId");
//#endregion
//#region node_modules/@radix-ui/react-use-effect-event/dist/index.mjs
var fe = Object.defineProperty, pe = (e, t) => fe(e, "name", {
	value: t,
	configurable: !0
}), me = _.useEffectEvent, he = _.useInsertionEffect;
function ge(e) {
	if (typeof me == "function") return me(e);
	let t = _.useRef(() => {
		throw Error("Cannot call an event handler while rendering.");
	});
	return typeof he == "function" ? he(() => {
		t.current = e;
	}) : se(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
pe(ge, "useEffectEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var _e = Object.defineProperty, N = (e, t) => _e(e, "name", {
	value: t,
	configurable: !0
}), P = _.useInsertionEffect || se;
function ve({ prop: e, defaultProp: t, onChange: n = /* @__PURE__ */ N(() => {}, "onChange"), caller: r }) {
	let [i, a, o] = ye({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0;
	return [s ? e : i, _.useCallback((t) => {
		if (s) {
			let n = be(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
N(ve, "useControllableState");
function ye({ defaultProp: e, onChange: t }) {
	let [n, r] = _.useState(e), i = _.useRef(n), a = _.useRef(t);
	return P(() => {
		a.current = t;
	}, [t]), _.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
N(ye, "useUncontrolledState");
function be(e) {
	return typeof e == "function";
}
N(be, "isFunction");
var xe = Symbol("RADIX:SYNC_STATE");
function Se(e, t, n, r) {
	let { prop: i, defaultProp: a, onChange: o, caller: s } = t, c = i !== void 0, l = ge(o), u = [{
		...n,
		state: a
	}];
	r && u.push(r);
	let [d, f] = _.useReducer((t, n) => {
		if (n.type === xe) return {
			...t,
			state: n.state
		};
		let r = e(t, n);
		return c && !Object.is(r.state, t.state) && l(r.state), r;
	}, ...u), p = d.state, m = _.useRef(p);
	_.useEffect(() => {
		m.current !== p && (m.current = p, c || l(p));
	}, [
		p,
		m,
		c
	]);
	let h = _.useMemo(() => i === void 0 ? d : {
		...d,
		state: i
	}, [d, i]);
	return _.useEffect(() => {
		c && !Object.is(i, d.state) && f({
			type: xe,
			state: i
		});
	}, [
		i,
		d.state,
		c
	]), [h, f];
}
N(Se, "useControllableStateReducer");
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
var Ce = /* @__PURE__ */ c(m(), 1), we = Object.defineProperty, Te = (e, t) => we(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function Ee(e) {
	let t = _.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		r = Le(r), _.Children.forEach(r, (e) => {
			if (Ne(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				for (; Fe(n) && typeof Ve == "function";) n = Ve(n._payload);
				a = Ae(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = _.cloneElement(a, void 0, s) : !o && _.Children.count(r) === 1 && _.isValidElement(r) && (a = r);
		let c = a ? Me(a) : void 0, l = O(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? Be(e) : ze(e));
			return r;
		}
		let u = je(i, a.props ?? {});
		return a.type !== _.Fragment && (u.ref = n ? l : c), _.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
Te(Ee, "createSlot");
var De = /* @__PURE__ */ Ee("Slot"), Oe = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function ke(e) {
	let t = /* @__PURE__ */ Te((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = Oe, t;
}
Te(ke, "createSlottable");
var Ae = /* @__PURE__ */ Te((e, t) => "child" in e.props ? _.isValidElement(t) ? _.cloneElement(t, void 0, e.props.children(t.props.children)) : null : _.isValidElement(t) ? t : null, "getSlottableElementFromSlottable");
function je(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" ? n[r] = [i, a].filter(Boolean).join(" ") : r === "aria-describedby" && (n[r] = Re(a, i));
	}
	return {
		...e,
		...n
	};
}
Te(je, "mergeProps");
function Me(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Te(Me, "getElementRef");
function Ne(e) {
	return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Oe;
}
Te(Ne, "isSlottable");
var Pe = Symbol.for("react.lazy");
function Fe(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === Pe && "_payload" in e && Ie(e._payload);
}
Te(Fe, "isLazyComponent");
function Ie(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Te(Ie, "isPromiseLike");
function Le(e) {
	let t = e;
	for (; Fe(t) && typeof Ve == "function";) t = Ve(t._payload);
	return t;
}
Te(Le, "useUnwrappedLazy");
function Re(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
Te(Re, "concatAriaDescribedby");
var ze = /* @__PURE__ */ Te((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), Be = /* @__PURE__ */ Te((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), Ve = _.use, He = Object.defineProperty, Ue = (e, t) => He(e, "name", {
	value: t,
	configurable: !0
}), We = [
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
	"select",
	"span",
	"svg",
	"ul"
].reduce((e, t) => {
	let n = /* @__PURE__ */ Ee(`Primitive.${t}`), r = _.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, k.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function Ge(e, t) {
	e && Ce.flushSync(() => e.dispatchEvent(t));
}
Ue(Ge, "dispatchDiscreteCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var Ke = Object.defineProperty, qe = (e, t) => Ke(e, "name", {
	value: t,
	configurable: !0
}), Je = _.useInsertionEffect;
function Ye(e) {
	let t = _.useRef(e);
	return typeof Je == "function" ? Je(() => {
		t.current = e;
	}) : se(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
qe(Ye, "useCallbackRef");
//#endregion
//#region node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var Xe = Object.defineProperty, Ze = (e, t) => Xe(e, "name", {
	value: t,
	configurable: !0
}), Qe = "dismissableLayer.update", $e = "dismissableLayer.pointerDownOutside", et = "dismissableLayer.focusOutside", tt, nt = _.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
}), rt = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Ze(function(e, t) {
	let { disableOutsidePointerEvents: n = !1, deferPointerDownOutside: r = !1, onEscapeKeyDown: i, onPointerDownOutside: a, onFocusOutside: o, onInteractOutside: s, onDismiss: c, ...l } = e, u = _.useContext(nt), [d, f] = _.useState(null), p = d?.ownerDocument ?? globalThis?.document, [, m] = _.useState({}), h = O(t, f), g = Array.from(u.layers), [v] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = v ? g.indexOf(v) : -1, b = d ? g.indexOf(d) : -1, x = u.layersWithOutsidePointerEventsDisabled.size > 0, C = b >= y, w = _.useRef(!1), T = ot((e) => {
		a?.(e), s?.(e), e.defaultPrevented || c?.();
	}, {
		ownerDocument: p,
		deferPointerDownOutside: r,
		isDeferredPointerDownOutsideRef: w,
		dismissableSurfaces: u.dismissableSurfaces,
		shouldHandlePointerDownOutside: _.useCallback((e) => {
			if (!(e instanceof Node)) return !1;
			let t = [...u.branches].some((t) => t.contains(e));
			return C && !t;
		}, [u.branches, C])
	}), ee = st((e) => {
		if (r && w.current) return;
		let t = e.target;
		[...u.branches].some((e) => e.contains(t)) || (o?.(e), s?.(e), e.defaultPrevented || c?.());
	}, p), E = d ? b === g.length - 1 : !1, D = Ye((e) => {
		e.key === "Escape" && (i?.(e), !e.defaultPrevented && c && (e.preventDefault(), c()));
	});
	return _.useEffect(() => {
		if (E) return p.addEventListener("keydown", D, { capture: !0 }), () => p.removeEventListener("keydown", D, { capture: !0 });
	}, [
		p,
		E,
		D
	]), _.useEffect(() => {
		if (d) return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (tt = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), ct(), () => {
			n && (u.layersWithOutsidePointerEventsDisabled.delete(d), u.layersWithOutsidePointerEventsDisabled.size === 0 && (p.body.style.pointerEvents = tt));
		};
	}, [
		d,
		p,
		n,
		u
	]), _.useEffect(() => () => {
		d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), ct());
	}, [d, u]), _.useEffect(() => {
		let e = /* @__PURE__ */ Ze(() => m({}), "handleUpdate");
		return document.addEventListener(Qe, e), () => document.removeEventListener(Qe, e);
	}, []), /* @__PURE__ */ (0, k.jsx)(We.div, {
		...l,
		ref: h,
		style: {
			pointerEvents: x ? C ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: S(e.onFocusCapture, ee.onFocusCapture),
		onBlurCapture: S(e.onBlurCapture, ee.onBlurCapture),
		onPointerDownCapture: S(e.onPointerDownCapture, T.onPointerDownCapture)
	});
}, "DismissableLayer"));
function it() {
	let e = _.useContext(nt), [t, n] = _.useState(null);
	return _.useEffect(() => {
		if (t) return e.dismissableSurfaces.add(t), () => {
			e.dismissableSurfaces.delete(t);
		};
	}, [t, e.dismissableSurfaces]), n;
}
Ze(it, "useDismissableLayerSurface");
var at = /* @__PURE__ */ Ze(() => !0, "IS_TRUE");
function ot(e, t) {
	let { ownerDocument: n = globalThis?.document, deferPointerDownOutside: r = !1, isDeferredPointerDownOutsideRef: i, dismissableSurfaces: a, shouldHandlePointerDownOutside: o = at } = t, s = Ye(e), c = _.useRef(!1), l = _.useRef(!1), u = _.useRef(/* @__PURE__ */ new Map()), d = _.useRef(() => {});
	return _.useEffect(() => {
		function e() {
			l.current = !1, i.current = !1, u.current.clear();
		}
		Ze(e, "resetOutsideInteraction");
		function t() {
			return Array.from(u.current.values()).some(Boolean);
		}
		Ze(t, "isOutsideInteractionIntercepted");
		function f(e) {
			if (!l.current) return;
			let t = e.target;
			t instanceof Node && [...a].some((e) => e.contains(t)) || u.current.set(e.type, !0), e.type === "click" && window.setTimeout(() => {
				l.current && d.current();
			}, 0);
		}
		Ze(f, "handleInteractionCapture");
		function p(e) {
			l.current && u.current.set(e.type, !1);
		}
		Ze(p, "handleInteractionBubble");
		let m = /* @__PURE__ */ Ze((a) => {
			if (a.target && !c.current) {
				let f = function() {
					n.removeEventListener("click", d.current);
					let r = t();
					e(), r || lt($e, s, p, { discrete: !0 });
				};
				if (Ze(f, "handleAndDispatchPointerDownOutsideEvent"), !o(a.target)) {
					n.removeEventListener("click", d.current), e(), c.current = !1;
					return;
				}
				let p = { originalEvent: a };
				l.current = !0, i.current = r && a.button === 0, u.current.clear(), !r || a.button !== 0 ? f() : (n.removeEventListener("click", d.current), d.current = f, n.addEventListener("click", d.current, { once: !0 }));
			} else n.removeEventListener("click", d.current), e();
			c.current = !1;
		}, "handlePointerDown"), h = [
			"pointerup",
			"mousedown",
			"mouseup",
			"touchstart",
			"touchend",
			"click"
		];
		for (let e of h) n.addEventListener(e, f, !0), n.addEventListener(e, p);
		let g = window.setTimeout(() => {
			n.addEventListener("pointerdown", m);
		}, 0);
		return () => {
			window.clearTimeout(g), n.removeEventListener("pointerdown", m), n.removeEventListener("click", d.current);
			for (let e of h) n.removeEventListener(e, f, !0), n.removeEventListener(e, p);
		};
	}, [
		n,
		s,
		r,
		i,
		a,
		o
	]), { onPointerDownCapture: /* @__PURE__ */ Ze(() => c.current = !0, "onPointerDownCapture") };
}
Ze(ot, "usePointerDownOutside");
function st(e, t = globalThis?.document) {
	let n = Ye(e), r = _.useRef(!1);
	return _.useEffect(() => {
		let e = /* @__PURE__ */ Ze((e) => {
			e.target && !r.current && lt(et, n, { originalEvent: e }, { discrete: !1 });
		}, "handleFocus");
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: /* @__PURE__ */ Ze(() => r.current = !0, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ Ze(() => r.current = !1, "onBlurCapture")
	};
}
Ze(st, "useFocusOutside");
function ct() {
	let e = new CustomEvent(Qe);
	document.dispatchEvent(e);
}
Ze(ct, "dispatchUpdate");
function lt(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? Ge(i, a) : i.dispatchEvent(a);
}
Ze(lt, "handleAndDispatchCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var ut = Object.defineProperty, dt = (e, t) => ut(e, "name", {
	value: t,
	configurable: !0
}), ft = "focusScope.autoFocusOnMount", pt = "focusScope.autoFocusOnUnmount", mt = {
	bubbles: !1,
	cancelable: !0
}, ht = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ dt(function(e, t) {
	let { loop: n = !1, trapped: r = !1, branches: i, onMountAutoFocus: a, onUnmountAutoFocus: o, ...s } = e, [c, l] = _.useState(null), u = Ye(a), d = Ye(o), f = _.useRef(null), p = O(t, l), m = _.useRef(i);
	_.useEffect(() => {
		m.current = i;
	});
	let h = _.useCallback((e) => e ? c?.contains(e) ? !0 : !!m.current?.some((t) => t.contains(e)) : !1, [c]), g = _.useRef({
		paused: !1,
		pause() {
			this.paused = !0;
		},
		resume() {
			this.paused = !1;
		}
	}).current;
	_.useEffect(() => {
		if (r) {
			let e = function(e) {
				if (g.paused || !c) return;
				let t = e.target;
				h(t) ? f.current = t : F(f.current, { select: !0 });
			}, t = function(e) {
				if (g.paused || !c) return;
				let t = e.relatedTarget;
				t !== null && (h(t) || F(f.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && F(c);
			};
			dt(e, "handleFocusIn"), dt(t, "handleFocusOut"), dt(n, "handleMutations"), document.addEventListener("focusin", e), document.addEventListener("focusout", t);
			let r = new MutationObserver(n);
			return c && r.observe(c, {
				childList: !0,
				subtree: !0
			}), () => {
				document.removeEventListener("focusin", e), document.removeEventListener("focusout", t), r.disconnect();
			};
		}
	}, [
		r,
		c,
		g.paused,
		h
	]), _.useEffect(() => {
		if (c) {
			Et.add(g);
			let e = document.activeElement;
			if (!c.contains(e)) {
				let t = new CustomEvent(ft, mt);
				c.addEventListener(ft, u), c.dispatchEvent(t), t.defaultPrevented || (bt(kt(St(c)), { select: !0 }), document.activeElement === e && F(c));
			}
			return () => {
				c.removeEventListener(ft, u);
				let t = c.ownerDocument, n = CustomEvent;
				setTimeout(() => {
					let r = new n(pt, mt);
					c.addEventListener(pt, d), c.dispatchEvent(r), r.defaultPrevented || F(e ?? t.body, { select: !0 }), c.removeEventListener(pt, d), Et.remove(g);
				}, 0);
			};
		}
	}, [
		c,
		u,
		d,
		g
	]);
	let v = _.useCallback((e) => {
		if (!n && !r || g.paused) return;
		let t = e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey, i = document.activeElement;
		if (t && i) {
			let t = e.currentTarget, [r, a] = xt(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && F(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && F(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		g.paused
	]);
	return /* @__PURE__ */ (0, k.jsx)(We.div, {
		tabIndex: -1,
		...s,
		ref: p,
		onKeyDown: v
	});
}, "FocusScope")), gt = _.createContext(null);
function _t({ registry: e, children: t }) {
	return e ? /* @__PURE__ */ (0, k.jsx)(gt.Provider, {
		value: e,
		children: t
	}) : t;
}
dt(_t, "FocusScopeBranchProvider");
function vt() {
	let [e, t] = _.useState([]);
	return {
		nodes: e,
		registry: _.useMemo(() => ({
			add: /* @__PURE__ */ dt((e) => t((t) => t.includes(e) ? t : [...t, e]), "add"),
			remove: /* @__PURE__ */ dt((e) => t((t) => t.filter((t) => t !== e)), "remove")
		}), [])
	};
}
dt(vt, "useFocusScopeBranchRegistry");
function yt(e) {
	let t = _.useContext(gt);
	_.useEffect(() => {
		if (e && t) return t.add(e), () => t.remove(e);
	}, [e, t]);
}
dt(yt, "useFocusScopeBranch");
function bt(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (F(r, { select: t }), document.activeElement !== n) return;
}
dt(bt, "focusFirst");
function xt(e) {
	let t = St(e);
	return [Ct(t, e), Ct(t.reverse(), e)];
}
dt(xt, "getTabbableEdges");
function St(e) {
	let t = [], n = e.ownerDocument.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ dt((e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
dt(St, "getTabbableCandidates");
function Ct(e, t) {
	let n = typeof t.checkVisibility == "function" && t.checkVisibility({ checkVisibilityCSS: !0 });
	for (let r of e) if (!(n ? !r.checkVisibility({ checkVisibilityCSS: !0 }) : wt(r, { upTo: t }))) return r;
}
dt(Ct, "findVisible");
function wt(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
dt(wt, "isHidden");
function Tt(e) {
	return e.tagName === "INPUT" && typeof e.select == "function";
}
dt(Tt, "isSelectableInput");
function F(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = (e.ownerDocument ?? document).activeElement;
		e.focus({ preventScroll: !0 }), e !== n && Tt(e) && t && e.select();
	}
}
dt(F, "focus");
var Et = Dt();
function Dt() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Ot(e, t), e.unshift(t);
		},
		remove(t) {
			e = Ot(e, t), e[0]?.resume();
		}
	};
}
dt(Dt, "createFocusScopesStack");
function Ot(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
dt(Ot, "arrayRemove");
function kt(e) {
	return e.filter((e) => e.tagName !== "A");
}
dt(kt, "removeLinks");
//#endregion
//#region node_modules/@radix-ui/react-presence/dist/index.mjs
var At = Object.defineProperty, jt = (e, t) => At(e, "name", {
	value: t,
	configurable: !0
});
function Mt(e, t) {
	return _.useReducer((e, n) => t[e][n] ?? e, e);
}
jt(Mt, "useStateMachine");
var Nt = /* @__PURE__ */ jt((e) => {
	let { present: t, children: n } = e, r = Pt(t), i = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = It(r.ref, Rt(i));
	return typeof n == "function" || r.isPresent ? _.cloneElement(i, { ref: a }) : null;
}, "Presence");
function Pt(e) {
	let [t, n] = _.useState(), r = _.useRef(null), i = _.useRef(e), a = _.useRef("none"), o = _.useRef(void 0), [s, c] = Mt(e ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return _.useEffect(() => {
		s === "mounted" ? (a.current = o.current ?? Lt(r.current), o.current = void 0) : a.current = "none";
	}, [s]), se(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, s = Lt(t);
			e ? (o.current = s, c("MOUNT")) : s === "none" || t?.display === "none" ? c("UNMOUNT") : c(n && r !== s ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, c]), se(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = /* @__PURE__ */ jt((a) => {
				let o = Lt(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (c("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, "handleAnimationEnd"), s = /* @__PURE__ */ jt((e) => {
				e.target === t && (a.current = Lt(r.current));
			}, "handleAnimationStart");
			return t.addEventListener("animationstart", s), t.addEventListener("animationcancel", o), t.addEventListener("animationend", o), () => {
				n.clearTimeout(e), t.removeEventListener("animationstart", s), t.removeEventListener("animationcancel", o), t.removeEventListener("animationend", o);
			};
		}
		c("ANIMATION_END");
	}, [t, c]), {
		isPresent: ["mounted", "unmountSuspended"].includes(s),
		ref: _.useCallback((e) => {
			if (e) {
				let t = getComputedStyle(e);
				r.current = t, o.current = Lt(t);
			} else r.current = null;
			n(e);
		}, [])
	};
}
jt(Pt, "usePresence");
function Ft(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
jt(Ft, "setRef");
function It(...e) {
	let t = _.useRef(e);
	return t.current = e, _.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Ft(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Ft(n[e], null);
			}
		};
	}, []);
}
jt(It, "useStableComposedRefs");
function Lt(e) {
	return e?.animationName || "none";
}
jt(Lt, "getAnimationName");
function Rt(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
jt(Rt, "getElementRef");
//#endregion
//#region node_modules/@radix-ui/react-focus-guards/dist/index.mjs
var zt = Object.defineProperty, Bt = (e, t) => zt(e, "name", {
	value: t,
	configurable: !0
}), Vt = 0, Ht = null;
function Ut(e) {
	return Wt(), e.children;
}
Bt(Ut, "FocusGuards");
function Wt() {
	_.useEffect(() => {
		Ht ||= {
			start: Gt(),
			end: Gt()
		};
		let { start: e, end: t } = Ht;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), Vt++, () => {
			Vt === 1 && (Ht?.start.remove(), Ht?.end.remove(), Ht = null), Vt = Math.max(0, Vt - 1);
		};
	}, []);
}
Bt(Wt, "useFocusGuards");
function Gt() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
Bt(Gt, "createFocusGuard");
//#endregion
//#region node_modules/tslib/tslib.es6.mjs
var Kt = function() {
	return Kt = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Kt.apply(this, arguments);
};
function qt(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Jt(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var I = "right-scroll-bar-position", Yt = "width-before-scroll-bar", Xt = "with-scroll-bars-hidden", Zt = "--removed-body-scroll-bar-size";
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/assignRef.js
function Qt(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/useRef.js
function $t(e, t) {
	var n = (0, _.useState)(function() {
		return {
			value: e,
			callback: t,
			facade: {
				get current() {
					return n.value;
				},
				set current(e) {
					var t = n.value;
					t !== e && (n.value = e, n.callback(e, t));
				}
			}
		};
	})[0];
	return n.callback = t, n.facade;
}
//#endregion
//#region node_modules/use-callback-ref/dist/es2015/useMergeRef.js
var en = typeof window < "u" ? _.useLayoutEffect : _.useEffect, tn = /* @__PURE__ */ new WeakMap();
function nn(e, t) {
	var n = $t(t || null, function(t) {
		return e.forEach(function(e) {
			return Qt(e, t);
		});
	});
	return en(function() {
		var t = tn.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || Qt(e, null);
			}), i.forEach(function(e) {
				r.has(e) || Qt(e, a);
			});
		}
		tn.set(n, e);
	}, [e]), n;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/medium.js
function rn(e) {
	return e;
}
function an(e, t) {
	t === void 0 && (t = rn);
	var n = [], r = !1;
	return {
		read: function() {
			if (r) throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
			return n.length ? n[n.length - 1] : e;
		},
		useMedium: function(e) {
			var i = t(e, r);
			return n.push(i), function() {
				n = n.filter(function(e) {
					return e !== i;
				});
			};
		},
		assignSyncMedium: function(e) {
			for (r = !0; n.length;) {
				var t = n;
				n = [], t.forEach(e);
			}
			n = {
				push: function(t) {
					return e(t);
				},
				filter: function() {
					return n;
				}
			};
		},
		assignMedium: function(e) {
			r = !0;
			var t = [];
			if (n.length) {
				var i = n;
				n = [], i.forEach(e), t = n;
			}
			var a = function() {
				var n = t;
				t = [], n.forEach(e);
			}, o = function() {
				return Promise.resolve().then(a);
			};
			o(), n = {
				push: function(e) {
					t.push(e), o();
				},
				filter: function(e) {
					return t = t.filter(e), n;
				}
			};
		}
	};
}
function on(e) {
	e === void 0 && (e = {});
	var t = an(null);
	return t.options = Kt({
		async: !0,
		ssr: !1
	}, e), t;
}
//#endregion
//#region node_modules/use-sidecar/dist/es2015/exports.js
var sn = function(e) {
	var t = e.sideCar, n = qt(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return _.createElement(r, Kt({}, n));
};
sn.isSideCarExport = !0;
function cn(e, t) {
	return e.useMedium(t), sn;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/medium.js
var ln = on(), un = function() {}, dn = _.forwardRef(function(e, t) {
	var n = _.useRef(null), r = _.useState({
		onScrollCapture: un,
		onWheelCapture: un,
		onTouchMoveCapture: un
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, v = e.as, y = v === void 0 ? "div" : v, b = e.gapMode, x = qt(e, [
		"forwardProps",
		"children",
		"className",
		"removeScrollBar",
		"enabled",
		"shards",
		"sideCar",
		"noRelative",
		"noIsolation",
		"inert",
		"allowPinchZoom",
		"as",
		"gapMode"
	]), S = f, C = nn([n, t]), w = Kt(Kt({}, x), i);
	return _.createElement(_.Fragment, null, u && _.createElement(S, {
		sideCar: ln,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: b
	}), o ? _.cloneElement(_.Children.only(s), Kt(Kt({}, w), { ref: C })) : _.createElement(y, Kt({}, w, {
		className: c,
		ref: C
	}), s));
});
dn.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, dn.classNames = {
	fullWidth: Yt,
	zeroRight: I
};
//#endregion
//#region node_modules/get-nonce/dist/es2015/index.js
var fn = function() {
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
//#endregion
//#region node_modules/react-style-singleton/dist/es2015/singleton.js
function pn() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = fn();
	return t && e.setAttribute("nonce", t), e;
}
function mn(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function hn(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var gn = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = pn()) && (mn(t, n), hn(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, _n = function() {
	var e = gn();
	return function(t, n) {
		_.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, vn = function() {
	var e = _n();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, yn = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, bn = function(e) {
	return parseInt(e || "", 10) || 0;
}, xn = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		bn(n),
		bn(r),
		bn(i)
	];
}, Sn = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return yn;
	var t = xn(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, Cn = vn(), wn = "data-scroll-locked", Tn = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${Xt} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${wn}] {
    overflow: hidden ${r};
    overscroll-behavior: contain;
    ${[
		t && `position: relative ${r};`,
		n === "margin" && `
    padding-left: ${i}px;
    padding-top: ${a}px;
    padding-right: ${o}px;
    margin-left:0;
    margin-top:0;
    margin-right: ${s}px ${r};
    `,
		n === "padding" && `padding-right: ${s}px ${r};`
	].filter(Boolean).join("")}
  }
  
  .${I} {
    right: ${s}px ${r};
  }
  
  .${Yt} {
    margin-right: ${s}px ${r};
  }
  
  .${I} .${I} {
    right: 0 ${r};
  }
  
  .${Yt} .${Yt} {
    margin-right: 0 ${r};
  }
  
  body[${wn}] {
    ${Zt}: ${s}px;
  }
`;
}, En = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, Dn = function() {
	_.useEffect(function() {
		return document.body.setAttribute(wn, (En() + 1).toString()), function() {
			var e = En() - 1;
			e <= 0 ? document.body.removeAttribute(wn) : document.body.setAttribute(wn, e.toString());
		};
	}, []);
}, On = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	Dn();
	var a = _.useMemo(function() {
		return Sn(i);
	}, [i]);
	return _.createElement(Cn, { styles: Tn(a, !t, i, n ? "" : "!important") });
}, kn = !1;
if (typeof window < "u") try {
	var An = Object.defineProperty({}, "passive", { get: function() {
		return kn = !0, !0;
	} });
	window.addEventListener("test", An, An), window.removeEventListener("test", An, An);
} catch {
	kn = !1;
}
var jn = kn ? { passive: !1 } : !1, Mn = function(e) {
	return e.tagName === "TEXTAREA";
}, Nn = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Mn(e) && n[t] === "visible");
}, Pn = function(e) {
	return Nn(e, "overflowY");
}, Fn = function(e) {
	return Nn(e, "overflowX");
}, In = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), zn(e, r)) {
			var i = Bn(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, Ln = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, Rn = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, zn = function(e, t) {
	return e === "v" ? Pn(t) : Fn(t);
}, Bn = function(e, t) {
	return e === "v" ? Ln(t) : Rn(t);
}, Vn = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Hn = function(e, t, n, r, i) {
	var a = Vn(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Bn(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && zn(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, Un = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Wn = function(e) {
	return [e.deltaX, e.deltaY];
}, Gn = function(e) {
	return e && "current" in e ? e.current : e;
}, Kn = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, qn = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, Jn = 0, Yn = [];
function Xn(e) {
	var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), i = _.useState(Jn++)[0], a = _.useState(vn)[0], o = _.useRef(e);
	_.useEffect(function() {
		o.current = e;
	}, [e]), _.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = Jt([e.lockRef.current], (e.shards || []).map(Gn), !0).filter(Boolean);
			return t.forEach(function(e) {
				return e.classList.add(`allow-interactivity-${i}`);
			}), function() {
				document.body.classList.remove(`block-interactivity-${i}`), t.forEach(function(e) {
					return e.classList.remove(`allow-interactivity-${i}`);
				});
			};
		}
	}, [
		e.inert,
		e.lockRef.current,
		e.shards
	]);
	var s = _.useCallback(function(e, t) {
		if ("touches" in e && e.touches.length === 2 || e.type === "wheel" && e.ctrlKey) return !o.current.allowPinchZoom;
		var i = Un(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = In(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = In(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Hn(h, t, e, h === "h" ? s : c, !0);
	}, []), c = _.useCallback(function(e) {
		var n = e;
		if (Yn.length && Yn[Yn.length - 1] === a) {
			var r = "deltaY" in n ? Wn(n) : Un(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && Kn(e.delta, r);
			})[0];
			if (i && i.should) n.cancelable && n.preventDefault();
			else if (!i) {
				var c = (o.current.shards || []).map(Gn).filter(Boolean).filter(function(e) {
					return e.contains(n.target);
				});
				(c.length > 0 ? s(n, c[0]) : !o.current.noIsolation) && n.cancelable && n.preventDefault();
			}
		}
	}, []), l = _.useCallback(function(e, n, r, i) {
		var a = {
			name: e,
			delta: n,
			target: r,
			should: i,
			shadowParent: Zn(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = _.useCallback(function(e) {
		n.current = Un(e), r.current = void 0;
	}, []), d = _.useCallback(function(t) {
		l(t.type, Wn(t), t.target, s(t, e.lockRef.current));
	}, []), f = _.useCallback(function(t) {
		l(t.type, Un(t), t.target, s(t, e.lockRef.current));
	}, []);
	_.useEffect(function() {
		return Yn.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, jn), document.addEventListener("touchmove", c, jn), document.addEventListener("touchstart", u, jn), function() {
			Yn = Yn.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, jn), document.removeEventListener("touchmove", c, jn), document.removeEventListener("touchstart", u, jn);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return _.createElement(_.Fragment, null, m ? _.createElement(a, { styles: qn(i) }) : null, p ? _.createElement(On, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function Zn(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
//#endregion
//#region node_modules/react-remove-scroll/dist/es2015/sidecar.js
var Qn = cn(ln, Xn), $n = _.forwardRef(function(e, t) {
	return _.createElement(dn, Kt({}, e, {
		ref: t,
		sideCar: Qn
	}));
});
$n.classNames = dn.classNames;
//#endregion
//#region node_modules/aria-hidden/dist/es2015/index.js
var er = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, tr = /* @__PURE__ */ new WeakMap(), nr = /* @__PURE__ */ new WeakMap(), rr = {}, ir = 0, ar = function(e) {
	return e && (e.host || ar(e.parentNode));
}, or = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = ar(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, sr = function(e, t, n, r) {
	var i = or(t, Array.isArray(e) ? e : [e]);
	rr[n] || (rr[n] = /* @__PURE__ */ new WeakMap());
	var a = rr[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		e && !s.has(e) && (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		e && !c.has(e) && Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (tr.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				tr.set(e, c), a.set(e, l), o.push(e), c === 1 && i && nr.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), ir++, function() {
		o.forEach(function(e) {
			var t = tr.get(e) - 1, i = a.get(e) - 1;
			tr.set(e, t), a.set(e, i), t || (nr.has(e) || e.removeAttribute(r), nr.delete(e)), i || e.removeAttribute(n);
		}), ir--, ir || (tr = /* @__PURE__ */ new WeakMap(), tr = /* @__PURE__ */ new WeakMap(), nr = /* @__PURE__ */ new WeakMap(), rr = {});
	};
}, cr = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || er(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), sr(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, lr = Object.defineProperty, ur = (e, t) => lr(e, "name", {
	value: t,
	configurable: !0
}), dr = "Dialog", [fr, pr] = /* @__PURE__ */ ae(dr), [mr, hr] = fr(dr), gr = /* @__PURE__ */ ur((e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = _.useRef(null), c = _.useRef(null), { nodes: l, registry: u } = vt(), [d, f] = ve({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: dr
	}), [p, m] = _.useState(0), [h, g] = _.useState(0);
	return /* @__PURE__ */ (0, k.jsx)(mr, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: de(),
		titleId: de(),
		descriptionId: de(),
		titlePresent: p > 0,
		descriptionPresent: h > 0,
		setTitleCount: m,
		setDescriptionCount: g,
		open: d,
		onOpenChange: f,
		onOpenToggle: _.useCallback(() => f((e) => !e), [f]),
		modal: o,
		branchNodes: l,
		branchRegistry: u,
		children: n
	});
}, "Dialog"), [_r, vr] = fr("DialogPortal", { forceMount: void 0 }), yr = "DialogOverlay", br = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let n = vr(yr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = hr(yr, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, k.jsx)(Nt, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, k.jsx)(Sr, {
			...i,
			ref: t
		})
	}) : null;
}, "DialogOverlay")), xr = /* @__PURE__ */ Ee("DialogOverlay.RemoveScroll"), Sr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = hr(yr, n), a = O(t, it());
	return /* @__PURE__ */ (0, k.jsx)($n, {
		as: xr,
		allowPinchZoom: !0,
		shards: _.useMemo(() => [i.contentRef, ...i.branchNodes.map((e) => ({ current: e }))], [i.contentRef, i.branchNodes]),
		children: /* @__PURE__ */ (0, k.jsx)(We.div, {
			"data-state": Nr(i.open),
			...r,
			ref: a,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}, "DialogOverlayImpl")), Cr = "DialogContent", wr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let n = vr(Cr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = hr(Cr, e.__scopeDialog);
	return /* @__PURE__ */ (0, k.jsx)(Nt, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, k.jsx)(Tr, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, k.jsx)(Er, {
			...i,
			ref: t
		})
	});
}, "DialogContent")), Tr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let n = hr(Cr, e.__scopeDialog), r = _.useRef(null), i = O(t, n.contentRef, r);
	return _.useEffect(() => {
		let e = r.current;
		if (e) return cr(e);
	}, []), /* @__PURE__ */ (0, k.jsx)(Dr, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: S(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: S(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: S(e.onFocusOutside, (e) => e.preventDefault())
	});
}, "DialogContentModal")), Er = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let n = hr(Cr, e.__scopeDialog), r = _.useRef(!1), i = _.useRef(!1);
	return /* @__PURE__ */ (0, k.jsx)(Dr, {
		...e,
		ref: t,
		trapFocus: !1,
		disableOutsidePointerEvents: !1,
		onCloseAutoFocus: (t) => {
			e.onCloseAutoFocus?.(t), t.defaultPrevented || (r.current || n.triggerRef.current?.focus(), t.preventDefault()), r.current = !1, i.current = !1;
		},
		onInteractOutside: (t) => {
			e.onInteractOutside?.(t), t.defaultPrevented || (r.current = !0, t.detail.originalEvent.type === "pointerdown" && (i.current = !0));
			let a = t.target;
			n.triggerRef.current?.contains(a) && t.preventDefault(), t.detail.originalEvent.type === "focusin" && i.current && t.preventDefault();
		}
	});
}, "DialogContentNonModal")), Dr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, "aria-describedby": o, children: s, ...c } = e, l = hr(Cr, n);
	return Wt(), /* @__PURE__ */ (0, k.jsx)(_t, {
		registry: l.branchRegistry,
		children: /* @__PURE__ */ (0, k.jsx)(ht, {
			asChild: !0,
			loop: !0,
			trapped: r,
			branches: l.branchNodes,
			onMountAutoFocus: i,
			onUnmountAutoFocus: a,
			children: /* @__PURE__ */ (0, k.jsx)(rt, {
				role: "dialog",
				id: l.contentId,
				"aria-labelledby": l.titlePresent ? l.titleId : void 0,
				"aria-describedby": l.descriptionPresent ? Mr(o, l.descriptionId) : o,
				"data-state": Nr(l.open),
				...c,
				ref: t,
				deferPointerDownOutside: !0,
				onDismiss: () => l.onOpenChange(!1),
				children: s
			})
		})
	});
}, "DialogContentImpl")), Or = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = hr("DialogTitle", n), { setTitleCount: a } = i;
	return se(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, k.jsx)(We.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
}, "DialogTitle")), kr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = hr("DialogDescription", n), { setDescriptionCount: a } = i;
	return se(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, k.jsx)(We.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
}, "DialogDescription")), Ar = "DialogClose", jr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ur(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = hr(Ar, n);
	return /* @__PURE__ */ (0, k.jsx)(We.button, {
		type: "button",
		...r,
		ref: t,
		onClick: S(e.onClick, () => i.onOpenChange(!1))
	});
}, "DialogClose"));
function Mr(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
ur(Mr, "concatAriaDescribedby");
function Nr(e) {
	return e ? "open" : "closed";
}
ur(Nr, "getState");
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var Pr = [
	"top",
	"right",
	"bottom",
	"left"
], Fr = Math.min, Ir = Math.max, Lr = Math.round, Rr = Math.floor, zr = (e) => ({
	x: e,
	y: e
}), Br = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function Vr(e, t, n) {
	return Ir(e, Fr(t, n));
}
function Hr(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Ur(e) {
	return e.split("-")[0];
}
function Wr(e) {
	return e.split("-")[1];
}
function Gr(e) {
	return e === "x" ? "y" : "x";
}
function Kr(e) {
	return e === "y" ? "height" : "width";
}
function qr(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Jr(e) {
	return Gr(qr(e));
}
function Yr(e, t, n) {
	n === void 0 && (n = !1);
	let r = Wr(e), i = Jr(e), a = Kr(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = ii(o)), [o, ii(o)];
}
function Xr(e) {
	let t = ii(e);
	return [
		Zr(e),
		t,
		Zr(t)
	];
}
function Zr(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Qr = ["left", "right"], $r = ["right", "left"], ei = ["top", "bottom"], ti = ["bottom", "top"];
function ni(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? $r : Qr : t ? Qr : $r;
		case "left":
		case "right": return t ? ei : ti;
		default: return [];
	}
}
function ri(e, t, n, r) {
	let i = Wr(e), a = ni(Ur(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Zr)))), a;
}
function ii(e) {
	let t = Ur(e);
	return Br[t] + e.slice(t.length);
}
function ai(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function oi(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : ai(e);
}
function si(e) {
	let { x: t, y: n, width: r, height: i } = e;
	return {
		width: r,
		height: i,
		top: n,
		left: t,
		right: t + r,
		bottom: n + i,
		x: t,
		y: n
	};
}
//#endregion
//#region node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function ci(e, t, n) {
	let { reference: r, floating: i } = e, a = qr(t), o = Jr(t), s = Kr(o), c = Ur(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
	switch (c) {
		case "top":
			p = {
				x: u,
				y: r.y - i.height
			};
			break;
		case "bottom":
			p = {
				x: u,
				y: r.y + r.height
			};
			break;
		case "right":
			p = {
				x: r.x + r.width,
				y: d
			};
			break;
		case "left":
			p = {
				x: r.x - i.width,
				y: d
			};
			break;
		default: p = {
			x: r.x,
			y: r.y
		};
	}
	let m = Wr(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function li(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = Hr(t, e), p = oi(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = si(await i.getClippingRect({
		element: await (i.isElement == null ? void 0 : i.isElement(m)) ?? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
		boundary: c,
		rootBoundary: l,
		strategy: s
	})), g = u === "floating" ? {
		x: n,
		y: r,
		width: a.floating.width,
		height: a.floating.height
	} : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
		x: 1,
		y: 1
	}, y = si(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: o,
		rect: g,
		offsetParent: _,
		strategy: s
	}) : g);
	return {
		top: (h.top - y.top + p.top) / v.y,
		bottom: (y.bottom - h.bottom + p.bottom) / v.y,
		left: (h.left - y.left + p.left) / v.x,
		right: (y.right - h.right + p.right) / v.x
	};
}
var ui = 50, di = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: li
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = ci(l, r, c), f = r, p = 0, m = {};
	for (let n = 0; n < a.length; n++) {
		let h = a[n];
		if (!h) continue;
		let { name: g, fn: _ } = h, { x: v, y, data: b, reset: x } = await _({
			x: u,
			y: d,
			initialPlacement: r,
			placement: f,
			strategy: i,
			middlewareData: m,
			rects: l,
			platform: s,
			elements: {
				reference: e,
				floating: t
			}
		});
		u = v ?? u, d = y ?? d, m[g] = {
			...m[g],
			...b
		}, x && p < ui && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = ci(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, fi = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = Hr(e, t) || {};
		if (l == null) return {};
		let d = oi(u), f = {
			x: n,
			y: r
		}, p = Jr(i), m = Kr(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		(!C || !await (o.isElement == null ? void 0 : o.isElement(S))) && (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, ee = Fr(d[_], T), E = Fr(d[v], T), D = C - h[m] - E, te = C / 2 - h[m] / 2 + w, ne = Vr(ee, te, D), O = !c.arrow && Wr(i) != null && te !== ne && a.reference[m] / 2 - (te < ee ? ee : E) - h[m] / 2 < 0, re = O ? te < ee ? te - ee : te - D : 0;
		return {
			[p]: f[p] + re,
			data: {
				[p]: ne,
				centerOffset: te - ne - re,
				...O && { alignmentOffset: re }
			},
			reset: O
		};
	}
}), pi = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = Hr(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = Ur(r), _ = qr(o), v = Ur(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [ii(o)] : Xr(o)), x = p !== "none";
			!d && x && b.push(...ri(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Yr(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === qr(t) || T.every((e) => qr(e.placement) !== _ || e.overflows[0] > 0))) return {
					data: {
						index: e,
						overflows: T
					},
					reset: { placement: t }
				};
				let n = T.filter((e) => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0]?.placement;
				if (!n) switch (f) {
					case "bestFit": {
						let e = T.filter((e) => {
							if (x) {
								let t = qr(e.placement);
								return t === _ || t === "y";
							}
							return !0;
						}).map((e) => [e.placement, e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0]?.[0];
						e && (n = e);
						break;
					}
					case "initialPlacement": n = o;
				}
				if (r !== n) return { reset: { placement: n } };
			}
			return {};
		}
	};
};
function mi(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function hi(e) {
	return Pr.some((t) => e[t] >= 0);
}
var gi = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = Hr(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = mi(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: hi(e)
					} };
				}
				case "escaped": {
					let e = mi(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: hi(e)
					} };
				}
				default: return {};
			}
		}
	};
}, _i = /*#__PURE__*/ new Set(["left", "top"]);
async function vi(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = Ur(n), s = Wr(n), c = qr(n) === "y", l = _i.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = Hr(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return s && typeof m == "number" && (p = s === "end" ? m * -1 : m), c ? {
		x: p * u,
		y: f * l
	} : {
		x: f * l,
		y: p * u
	};
}
var yi = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await vi(t, e);
			return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
				x: r + s.x,
				y: i + s.y,
				data: {
					...s,
					placement: a
				}
			};
		}
	};
}, bi = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			let { x: n, y: r, placement: i, platform: a } = t, { mainAxis: o = !0, crossAxis: s = !1, limiter: c = { fn: (e) => {
				let { x: t, y: n } = e;
				return {
					x: t,
					y: n
				};
			} }, ...l } = Hr(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = qr(i), p = Gr(f), m = u[p], h = u[f], g = (e, t) => Vr(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
			o && (m = g(p, m)), s && (h = g(f, h));
			let _ = c.fn({
				...t,
				[p]: m,
				[f]: h
			});
			return {
				..._,
				data: {
					x: _.x - n,
					y: _.y - r,
					enabled: {
						[p]: o,
						[f]: s
					}
				}
			};
		}
	};
}, xi = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = Hr(e, t), u = {
				x: n,
				y: r
			}, d = qr(i), f = Gr(d), p = u[f], m = u[d], h = Hr(s, t), g = typeof h == "number" ? {
				mainAxis: h,
				crossAxis: 0
			} : {
				mainAxis: h.mainAxis ?? 0,
				crossAxis: h.crossAxis ?? 0
			};
			if (c) {
				let e = f === "y" ? "height" : "width", t = a.reference[f] - a.floating[e] + g.mainAxis, n = a.reference[f] + a.reference[e] - g.mainAxis;
				p < t ? p = t : p > n && (p = n);
			}
			if (l) {
				let e = f === "y" ? "width" : "height", t = _i.has(Ur(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, Si = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = Hr(e, t), c = await i.detectOverflow(t, s), l = Ur(n), u = Wr(n), d = qr(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = Fr(p - c[m], g), y = Fr(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * Ir(c.left, c.right) : S = p - 2 * Ir(c.top, c.bottom)), await o({
				...t,
				availableWidth: C,
				availableHeight: S
			});
			let w = await i.getDimensions(a.floating);
			return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
		}
	};
};
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function Ci() {
	return typeof window < "u";
}
function wi(e) {
	return Di(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Ti(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Ei(e) {
	return ((Di(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function Di(e) {
	return Ci() ? e instanceof Node || e instanceof Ti(e).Node : !1;
}
function Oi(e) {
	return Ci() ? e instanceof Element || e instanceof Ti(e).Element : !1;
}
function ki(e) {
	return Ci() ? e instanceof HTMLElement || e instanceof Ti(e).HTMLElement : !1;
}
function Ai(e) {
	return !Ci() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Ti(e).ShadowRoot;
}
function ji(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = Hi(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function Mi(e) {
	return /^(table|td|th)$/.test(wi(e));
}
function Ni(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var Pi = /transform|translate|scale|rotate|perspective|filter/, Fi = /paint|layout|strict|content/, Ii = (e) => !!e && e !== "none", Li;
function Ri(e) {
	let t = Oi(e) ? Hi(e) : e;
	return Ii(t.transform) || Ii(t.translate) || Ii(t.scale) || Ii(t.rotate) || Ii(t.perspective) || !Bi() && (Ii(t.backdropFilter) || Ii(t.filter)) || Pi.test(t.willChange || "") || Fi.test(t.contain || "");
}
function zi(e) {
	let t = Wi(e);
	for (; ki(t) && !Vi(t);) {
		if (Ri(t)) return t;
		if (Ni(t)) return null;
		t = Wi(t);
	}
	return null;
}
function Bi() {
	return Li ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), Li;
}
function Vi(e) {
	return /^(html|body|#document)$/.test(wi(e));
}
function Hi(e) {
	return Ti(e).getComputedStyle(e);
}
function Ui(e) {
	return Oi(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Wi(e) {
	if (wi(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || Ai(e) && e.host || Ei(e);
	return Ai(t) ? t.host : t;
}
function Gi(e) {
	let t = Wi(e);
	return Vi(t) ? (e.ownerDocument || e).body : ki(t) && ji(t) ? t : Gi(t);
}
function Ki(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Gi(e), i = r === e.ownerDocument?.body, a = Ti(r);
	if (i) {
		let e = qi(a);
		return t.concat(a, a.visualViewport || [], ji(r) ? r : [], e && n ? Ki(e) : []);
	}
	return t.concat(r, Ki(r, [], n));
}
function qi(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
//#endregion
//#region node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function Ji(e) {
	let t = Hi(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = ki(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = Lr(n) !== a || Lr(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function Yi(e) {
	return Oi(e) ? e : e.contextElement;
}
function Xi(e) {
	let t = Yi(e);
	if (!ki(t)) return zr(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Ji(t), o = (a ? Lr(n.width) : n.width) / r, s = (a ? Lr(n.height) : n.height) / i;
	return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
		x: o,
		y: s
	};
}
var Zi = /*#__PURE__*/ zr(0);
function Qi(e) {
	let t = Ti(e);
	return !Bi() || !t.visualViewport ? Zi : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function $i(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === Ti(e);
}
function ea(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = Yi(e), o = zr(1);
	t && (r ? Oi(r) && (o = Xi(r)) : o = Xi(e));
	let s = $i(a, n, r) ? Qi(a) : zr(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = Ti(a), t = Oi(r) ? Ti(r) : r, n = e, i = qi(n);
		for (; i && t !== n;) {
			let e = Xi(i), t = i.getBoundingClientRect(), r = Hi(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = Ti(i), i = qi(n);
		}
	}
	return si({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function ta(e, t) {
	let n = Ui(e).scrollLeft;
	return t ? t.left + n : ea(Ei(e)).left + n;
}
function na(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - ta(e, n),
		y: n.top + t.scrollTop
	};
}
function ra(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = Ei(r), s = t ? Ni(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = zr(1), u = zr(0), d = ki(r);
	if ((d || !a) && ((wi(r) !== "body" || ji(o)) && (c = Ui(r)), d)) {
		let e = ea(r);
		l = Xi(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? na(o, c) : zr(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function ia(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function aa(e) {
	let t = Ui(e), n = e.ownerDocument.body, r = Ir(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = Ir(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + ta(e), o = -t.scrollTop;
	return Hi(n).direction === "rtl" && (a += Ir(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var oa = 25;
function sa(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = Ti(e), a = Ei(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !Bi() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (ta(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= oa && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function L(e, t) {
	let n = ea(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = Xi(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function ca(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = sa(e, n, t);
	else if (t === "document") r = aa(Ei(e));
	else if (Oi(t)) r = L(t, n);
	else {
		let n = Qi(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return si(r);
}
function la(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = Ki(e, [], !1).filter((e) => Oi(e) && wi(e) !== "body"), i = null, a = Hi(e).position === "fixed", o = a ? Wi(e) : e;
	for (; Oi(o) && !Vi(o);) {
		let e = Hi(o), t = Ri(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = Wi(o);
	}
	return t.set(e, r), r;
}
function ua(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? Ni(t) ? [] : la(t, this._c) : [].concat(n), r], o = ca(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = ca(t, a[e], i);
		s = Ir(n.top, s), c = Fr(n.right, c), l = Fr(n.bottom, l), u = Ir(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function da(e) {
	let { width: t, height: n } = Ji(e);
	return {
		width: t,
		height: n
	};
}
function fa(e, t, n) {
	let r = ki(t), i = Ei(t), a = n === "fixed", o = ea(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = zr(0);
	if ((r || !a) && ((wi(t) !== "body" || ji(i)) && (s = Ui(t)), r)) {
		let e = ea(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = ta(i));
	let l = i && !r && !a ? na(i, s) : zr(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function pa(e) {
	return Hi(e).position === "static";
}
function ma(e, t) {
	if (!ki(e) || Hi(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return Ei(e) === n && (n = n.ownerDocument.body), n;
}
function ha(e, t) {
	let n = Ti(e);
	if (Ni(e)) return n;
	if (!ki(e)) {
		let t = Wi(e);
		for (; t && !Vi(t);) {
			if (Oi(t) && !pa(t)) return t;
			t = Wi(t);
		}
		return n;
	}
	let r = ma(e, t);
	for (; r && Mi(r) && pa(r);) r = ma(r, t);
	return r && Vi(r) && pa(r) && !Ri(r) ? n : r || zi(e) || n;
}
var ga = async function(e) {
	let t = this.getOffsetParent || ha, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: fa(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function _a(e) {
	return Hi(e).direction === "rtl";
}
var va = {
	convertOffsetParentRelativeRectToViewportRelativeRect: ra,
	getDocumentElement: Ei,
	getClippingRect: ua,
	getOffsetParent: ha,
	getElementRects: ga,
	getClientRects: ia,
	getDimensions: da,
	getScale: Xi,
	isElement: Oi,
	isRTL: _a
};
function ya(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function ba(e, t, n) {
	let r = null, i, a = Ei(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = Rr(d), h = Rr(a.clientWidth - (u + f)), g = Rr(a.clientHeight - (d + p)), _ = Rr(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: Ir(0, Fr(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!ya(l, e.getBoundingClientRect())) return s();
			if (n !== c) {
				if (!y) return s();
				n ? s(!1, n) : i = setTimeout(() => {
					s(!1, 1e-7);
				}, 1e3);
			}
			y = !1;
		}
		try {
			r = new IntersectionObserver(b, {
				...v,
				root: a.ownerDocument
			});
		} catch {
			r = new IntersectionObserver(b, v);
		}
		r.observe(e);
	}
	let c = Ti(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function xa(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = Yi(e), u = i || a ? [...l ? Ki(l) : [], ...t ? Ki(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? ba(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? ea(e) : null;
	c && g();
	function g() {
		let t = ea(e);
		h && !ya(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var Sa = yi, Ca = bi, wa = pi, Ta = Si, Ea = gi, Da = fi, Oa = xi, ka = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...va,
		...i.platform,
		_c: r
	};
	return di(e, t, {
		...i,
		platform: a
	});
}, Aa = typeof document < "u" ? _.useLayoutEffect : function() {};
function ja(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (typeof e == "function" && e.toString() === t.toString()) return !0;
	let n, r, i;
	if (e && t && typeof e == "object") {
		if (Array.isArray(e)) {
			if (n = e.length, n !== t.length) return !1;
			for (r = n; r-- !== 0;) if (!ja(e[r], t[r])) return !1;
			return !0;
		}
		if (i = Object.keys(e), n = i.length, n !== Object.keys(t).length) return !1;
		for (r = n; r-- !== 0;) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
		for (r = n; r-- !== 0;) {
			let n = i[r];
			if (!(n === "_owner" && e.$$typeof) && !ja(e[n], t[n])) return !1;
		}
		return !0;
	}
	return e !== e && t !== t;
}
function Ma(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Na(e, t) {
	let n = Ma(e);
	return Math.round(t * n) / n;
}
function Pa(e) {
	let t = _.useRef(e);
	return Aa(() => {
		t.current = e;
	}), t;
}
function Fa(e) {
	e === void 0 && (e = {});
	let { placement: t = "bottom", strategy: n = "absolute", middleware: r = [], platform: i, elements: { reference: a, floating: o } = {}, transform: s = !0, whileElementsMounted: c, open: l } = e, [u, d] = _.useState({
		x: 0,
		y: 0,
		strategy: n,
		placement: t,
		middlewareData: {},
		isPositioned: !1
	}), [f, p] = _.useState(r);
	ja(f, r) || p(r);
	let [m, h] = _.useState(null), [g, v] = _.useState(null), y = _.useCallback((e) => {
		e !== C.current && (C.current = e, h(e));
	}, []), b = _.useCallback((e) => {
		e !== w.current && (w.current = e, v(e));
	}, []), x = a || m, S = o || g, C = _.useRef(null), w = _.useRef(null), T = _.useRef(u), ee = c != null, E = Pa(c), D = Pa(i), te = Pa(l), ne = _.useCallback(() => {
		if (!C.current || !w.current) return;
		let e = {
			placement: t,
			strategy: n,
			middleware: f
		};
		D.current && (e.platform = D.current), ka(C.current, w.current, e).then((e) => {
			let t = {
				...e,
				isPositioned: te.current !== !1
			};
			O.current && !ja(T.current, t) && (T.current = t, Ce.flushSync(() => {
				d(t);
			}));
		});
	}, [
		f,
		t,
		n,
		D,
		te
	]);
	Aa(() => {
		l === !1 && T.current.isPositioned && (T.current.isPositioned = !1, d((e) => ({
			...e,
			isPositioned: !1
		})));
	}, [l]);
	let O = _.useRef(!1);
	Aa(() => (O.current = !0, () => {
		O.current = !1;
	}), []), Aa(() => {
		if (x && (C.current = x), S && (w.current = S), x && S) {
			if (E.current) return E.current(x, S, ne);
			ne();
		}
	}, [
		x,
		S,
		ne,
		E,
		ee
	]);
	let re = _.useMemo(() => ({
		reference: C,
		floating: w,
		setReference: y,
		setFloating: b
	}), [y, b]), k = _.useMemo(() => ({
		reference: x,
		floating: S
	}), [x, S]), ie = _.useMemo(() => {
		let e = {
			position: n,
			left: 0,
			top: 0
		};
		if (!k.floating) return e;
		let t = Na(k.floating, u.x), r = Na(k.floating, u.y);
		return s ? {
			...e,
			transform: "translate(" + t + "px, " + r + "px)",
			...Ma(k.floating) >= 1.5 && { willChange: "transform" }
		} : {
			position: n,
			left: t,
			top: r
		};
	}, [
		n,
		s,
		k.floating,
		u.x,
		u.y
	]);
	return _.useMemo(() => ({
		...u,
		update: ne,
		refs: re,
		elements: k,
		floatingStyles: ie
	}), [
		u,
		ne,
		re,
		k,
		ie
	]);
}
var Ia = (e) => {
	function t(e) {
		return {}.hasOwnProperty.call(e, "current");
	}
	return {
		name: "arrow",
		options: e,
		fn(n) {
			let { element: r, padding: i } = typeof e == "function" ? e(n) : e;
			return r && t(r) ? r.current == null ? {} : Da({
				element: r.current,
				padding: i
			}).fn(n) : r ? Da({
				element: r,
				padding: i
			}).fn(n) : {};
		}
	};
}, La = (e, t) => {
	let n = Sa(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Ra = (e, t) => {
	let n = Ca(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, za = (e, t) => ({
	fn: Oa(e).fn,
	options: [e, t]
}), Ba = (e, t) => {
	let n = wa(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Va = (e, t) => {
	let n = Ta(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Ha = (e, t) => {
	let n = Ea(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Ua = (e, t) => {
	let n = Ia(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Wa = Object.defineProperty, Ga = (e, t) => Wa(e, "name", {
	value: t,
	configurable: !0
});
function Ka(e) {
	let [t, n] = _.useState(void 0);
	return se(() => {
		if (e) {
			n({
				width: e.offsetWidth,
				height: e.offsetHeight
			});
			let t = 0, r = new ResizeObserver((r) => {
				if (!Array.isArray(r) || !r.length) return;
				let i = r[0];
				window.cancelAnimationFrame(t), t = window.requestAnimationFrame(() => {
					let t, r;
					if ("borderBoxSize" in i) {
						let e = i.borderBoxSize, n = Array.isArray(e) ? e[0] : e;
						t = n.inlineSize, r = n.blockSize;
					} else t = e.offsetWidth, r = e.offsetHeight;
					n({
						width: t,
						height: r
					});
				});
			});
			return r.observe(e, { box: "border-box" }), () => {
				window.cancelAnimationFrame(t), r.unobserve(e);
			};
		}
		n(void 0);
	}, [e]), t;
}
Ga(Ka, "useSize");
//#endregion
//#region node_modules/@radix-ui/react-popper/dist/index.mjs
var qa = Object.defineProperty, Ja = (e, t) => qa(e, "name", {
	value: t,
	configurable: !0
}), Ya = {
	Partial: "partial",
	Always: "always"
}, Xa = {
	Optimized: "optimized",
	Always: "always"
}, Za = "Popper", [Qa, $a] = /* @__PURE__ */ ae(Za), [eo, to] = Qa(Za), no = /* @__PURE__ */ Ja((e) => {
	let { __scopePopper: t, children: n } = e, [r, i] = _.useState(null), [a, o] = _.useState(void 0);
	return /* @__PURE__ */ (0, k.jsx)(eo, {
		scope: t,
		anchor: r,
		onAnchorChange: i,
		placementState: a,
		setPlacementState: o,
		children: n
	});
}, "Popper"), ro = "PopperAnchor", io = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Ja(function(e, t) {
	let { __scopePopper: n, virtualRef: r, ...i } = e, a = to(ro, n), o = _.useRef(null), s = a.onAnchorChange, c = O(t, _.useCallback((e) => {
		o.current = e, e && s(e);
	}, [s])), l = _.useRef(null);
	_.useEffect(() => {
		if (!r) return;
		let e = l.current;
		l.current = r.current, e !== l.current && s(l.current);
	});
	let u = a.placementState && fo(a.placementState), d = u?.[0], f = u?.[1];
	return r ? null : /* @__PURE__ */ (0, k.jsx)(We.div, {
		"data-radix-popper-side": d,
		"data-radix-popper-align": f,
		...i,
		ref: c
	});
}, "PopperAnchor")), ao = "PopperContent", [oo, so] = Qa(ao), co = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Ja(function(e, t) {
	let { __scopePopper: n, side: r = "bottom", sideOffset: i = 0, align: a = "center", alignOffset: o = 0, arrowPadding: s = 0, avoidCollisions: c = !0, collisionBoundary: l = [], collisionPadding: u = 0, sticky: d = Ya.Partial, hideWhenDetached: f = !1, updatePositionStrategy: p = Xa.Optimized, onPlaced: m, ...h } = e, g = to(ao, n), [v, y] = _.useState(null), b = O(t, y), [x, S] = _.useState(null), C = Ka(x), w = C?.width ?? 0, T = C?.height ?? 0, ee = r + (a === "center" ? "" : "-" + a), E = typeof u == "number" ? u : {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...u
	}, D = Array.isArray(l) ? l : [l], te = D.length > 0, ne = {
		padding: E,
		boundary: D.filter(lo),
		altBoundary: te
	}, { refs: re, floatingStyles: ie, placement: A, isPositioned: j, middlewareData: ae } = Fa({
		strategy: "fixed",
		placement: ee,
		whileElementsMounted: /* @__PURE__ */ Ja((...e) => xa(...e, { animationFrame: p === Xa.Always }), "whileElementsMounted"),
		elements: { reference: g.anchor },
		middleware: [
			La({
				mainAxis: i + T,
				alignmentAxis: o
			}),
			c && Ra({
				mainAxis: !0,
				crossAxis: !1,
				...d === Ya.Partial ? { limiter: za() } : {},
				...ne
			}),
			c && Ba({ ...ne }),
			Va({
				...ne,
				apply: /* @__PURE__ */ Ja(({ elements: e, rects: t, availableWidth: n, availableHeight: r }) => {
					let { width: i, height: a } = t.reference, o = e.floating.style;
					o.setProperty("--radix-popper-available-width", `${n}px`), o.setProperty("--radix-popper-available-height", `${r}px`), o.setProperty("--radix-popper-anchor-width", `${i}px`), o.setProperty("--radix-popper-anchor-height", `${a}px`);
				}, "apply")
			}),
			x && Ua({
				element: x,
				padding: s
			}),
			uo({
				arrowWidth: w,
				arrowHeight: T
			}),
			f && Ha(te ? {
				strategy: "referenceHidden",
				...ne
			} : {
				strategy: "referenceHidden",
				padding: ne.padding,
				altBoundary: ne.altBoundary
			})
		]
	}), oe = g.setPlacementState;
	se(() => (oe(A), () => {
		oe(void 0);
	}), [A, oe]);
	let [ce, le] = fo(A), M = Ye(m);
	se(() => {
		j && M?.();
	}, [j, M]);
	let ue = ae.arrow?.x, de = ae.arrow?.y, fe = ae.arrow?.centerOffset !== 0, [pe, me] = _.useState();
	return se(() => {
		v && me(window.getComputedStyle(v).zIndex);
	}, [v]), /* @__PURE__ */ (0, k.jsx)("div", {
		ref: re.setFloating,
		"data-radix-popper-content-wrapper": "",
		style: {
			...ie,
			transform: j ? ie.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: pe,
			"--radix-popper-transform-origin": [ae.transformOrigin?.x, ae.transformOrigin?.y].join(" "),
			...ae.hide?.referenceHidden && {
				visibility: "hidden",
				pointerEvents: "none"
			}
		},
		dir: e.dir,
		children: /* @__PURE__ */ (0, k.jsx)(oo, {
			scope: n,
			placedSide: ce,
			placedAlign: le,
			onArrowChange: S,
			arrowX: ue,
			arrowY: de,
			shouldHideArrow: fe,
			children: /* @__PURE__ */ (0, k.jsx)(We.div, {
				"data-side": ce,
				"data-align": le,
				...h,
				ref: b,
				style: {
					...h.style,
					animation: j ? h.style?.animation : "none"
				}
			})
		})
	});
}, "PopperContent"));
function lo(e) {
	return e !== null;
}
Ja(lo, "isNotNull");
var uo = /* @__PURE__ */ Ja((e) => ({
	name: "transformOrigin",
	options: e,
	fn(t) {
		let { placement: n, rects: r, middlewareData: i } = t, a = i.arrow?.centerOffset !== 0, o = a ? 0 : e.arrowWidth, s = a ? 0 : e.arrowHeight, [c, l] = fo(n), u = {
			start: "0%",
			center: "50%",
			end: "100%"
		}[l], d = (i.arrow?.x ?? 0) + o / 2, f = (i.arrow?.y ?? 0) + s / 2, p = "", m = "";
		return c === "bottom" ? (p = a ? u : `${d}px`, m = `${-s}px`) : c === "top" ? (p = a ? u : `${d}px`, m = `${r.floating.height + s}px`) : c === "right" ? (p = `${-s}px`, m = a ? u : `${f}px`) : c === "left" && (p = `${r.floating.width + s}px`, m = a ? u : `${f}px`), { data: {
			x: p,
			y: m
		} };
	}
}), "transformOrigin");
function fo(e) {
	let [t, n = "center"] = e.split("-");
	return [t, n];
}
Ja(fo, "getSideAndAlignFromPlacement");
//#endregion
//#region node_modules/@radix-ui/react-visually-hidden/dist/index.mjs
var po = Object.defineProperty, mo = (e, t) => po(e, "name", {
	value: t,
	configurable: !0
}), ho = Object.freeze({
	position: "absolute",
	border: 0,
	width: 1,
	height: 1,
	padding: 0,
	margin: -1,
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	wordWrap: "normal"
}), go = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ mo(function(e, t) {
	return /* @__PURE__ */ (0, k.jsx)(We.span, {
		...e,
		ref: t,
		style: {
			...ho,
			...e.style
		}
	});
}, "VisuallyHidden")), _o = Object.defineProperty, vo = (e, t) => _o(e, "name", {
	value: t,
	configurable: !0
}), [yo, bo] = /* @__PURE__ */ ae("Tooltip", [$a]), xo = $a(), So = "TooltipProvider", Co = 700, wo = "tooltip.open", [To, Eo] = yo(So), Do = /* @__PURE__ */ vo((e) => {
	let { __scopeTooltip: t, delayDuration: n = Co, skipDelayDuration: r = 300, disableHoverableContent: i = !1, children: a } = e, o = _.useRef(!0), s = _.useRef(!1), c = _.useRef(0);
	return _.useEffect(() => {
		let e = c.current;
		return () => window.clearTimeout(e);
	}, []), /* @__PURE__ */ (0, k.jsx)(To, {
		scope: t,
		isOpenDelayedRef: o,
		delayDuration: n,
		onOpen: _.useCallback(() => {
			r <= 0 || (window.clearTimeout(c.current), o.current = !1);
		}, [r]),
		onClose: _.useCallback(() => {
			r <= 0 || (window.clearTimeout(c.current), c.current = window.setTimeout(() => o.current = !0, r));
		}, [r]),
		isPointerInTransitRef: s,
		onPointerInTransitChange: _.useCallback((e) => {
			s.current = e;
		}, []),
		disableHoverableContent: i,
		children: a
	});
}, "TooltipProvider"), Oo = "Tooltip", [ko, Ao] = yo(Oo), jo = /* @__PURE__ */ vo((e) => {
	let { __scopeTooltip: t, children: n, open: r, defaultOpen: i, onOpenChange: a, disableHoverableContent: o, delayDuration: s } = e, c = Eo(Oo, e.__scopeTooltip), l = xo(t), [u, d] = _.useState(null), [f, p] = _.useState(void 0), m = de(), h = _.useRef(0), g = o ?? c.disableHoverableContent, v = s ?? c.delayDuration, y = _.useRef(!1), [b, x] = ve({
		prop: r,
		defaultProp: i ?? !1,
		onChange: /* @__PURE__ */ vo((e) => {
			e ? (c.onOpen(), document.dispatchEvent(new CustomEvent(wo))) : c.onClose(), a?.(e);
		}, "onChange"),
		caller: Oo
	}), S = _.useMemo(() => b ? y.current ? "delayed-open" : "instant-open" : "closed", [b]), C = _.useCallback(() => {
		window.clearTimeout(h.current), h.current = 0, y.current = !1, x(!0);
	}, [x]), w = _.useCallback(() => {
		window.clearTimeout(h.current), h.current = 0, x(!1);
	}, [x]), T = _.useCallback(() => {
		window.clearTimeout(h.current), h.current = window.setTimeout(() => {
			y.current = !0, x(!0), h.current = 0;
		}, v);
	}, [v, x]);
	_.useEffect(() => () => {
		h.current &&= (window.clearTimeout(h.current), 0);
	}, []);
	let ee = f ?? m;
	return /* @__PURE__ */ (0, k.jsx)(no, {
		...l,
		children: /* @__PURE__ */ (0, k.jsx)(ko, {
			scope: t,
			contentId: ee,
			setContentId: p,
			open: b,
			stateAttribute: S,
			trigger: u,
			onTriggerChange: d,
			onTriggerEnter: _.useCallback(() => {
				c.isOpenDelayedRef.current ? T() : C();
			}, [
				c.isOpenDelayedRef,
				T,
				C
			]),
			onTriggerLeave: _.useCallback(() => {
				g ? w() : (window.clearTimeout(h.current), h.current = 0);
			}, [w, g]),
			onOpen: C,
			onClose: w,
			disableHoverableContent: g,
			children: n
		})
	});
}, "Tooltip"), Mo = "TooltipTrigger", No = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ vo(function(e, t) {
	let { __scopeTooltip: n, "aria-describedby": r, ...i } = e, a = Ao(Mo, n), o = Eo(Mo, n), s = xo(n), c = O(t, _.useRef(null), a.onTriggerChange), l = _.useRef(!1), u = _.useRef(!1), d = _.useCallback(() => l.current = !1, []);
	return _.useEffect(() => () => document.removeEventListener("pointerup", d), [d]), /* @__PURE__ */ (0, k.jsx)(io, {
		asChild: !0,
		...s,
		children: /* @__PURE__ */ (0, k.jsx)(We.button, {
			"aria-describedby": a.open ? Ko(r, a.contentId) : r,
			"data-state": a.stateAttribute,
			...i,
			ref: c,
			onPointerMove: S(e.onPointerMove, (e) => {
				e.pointerType !== "touch" && !u.current && !o.isPointerInTransitRef.current && (a.onTriggerEnter(), u.current = !0);
			}),
			onPointerLeave: S(e.onPointerLeave, () => {
				a.onTriggerLeave(), u.current = !1;
			}),
			onPointerDown: S(e.onPointerDown, () => {
				a.open && a.onClose(), l.current = !0, document.addEventListener("pointerup", d, { once: !0 });
			}),
			onFocus: S(e.onFocus, () => {
				l.current || a.onOpen();
			}),
			onBlur: S(e.onBlur, a.onClose),
			onClick: S(e.onClick, a.onClose)
		})
	});
}, "TooltipTrigger")), [Po, Fo] = yo("TooltipPortal", { forceMount: void 0 }), Io = "TooltipContent", Lo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ vo(function(e, t) {
	let n = Fo(Io, e.__scopeTooltip), { forceMount: r = n.forceMount, side: i = "top", ...a } = e, o = Ao(Io, e.__scopeTooltip);
	return /* @__PURE__ */ (0, k.jsx)(Nt, {
		present: r || o.open,
		children: o.disableHoverableContent ? /* @__PURE__ */ (0, k.jsx)(Bo, {
			side: i,
			...a,
			ref: t
		}) : /* @__PURE__ */ (0, k.jsx)(Ro, {
			side: i,
			...a,
			ref: t
		})
	});
}, "TooltipContent")), Ro = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ vo(function(e, t) {
	let n = Ao(Io, e.__scopeTooltip), r = Eo(Io, e.__scopeTooltip), i = _.useRef(null), a = O(t, i), [o, s] = _.useState(null), { trigger: c, onClose: l } = n, u = i.current, { onPointerInTransitChange: d } = r, f = _.useCallback(() => {
		s(null), d(!1);
	}, [d]), p = _.useCallback((e, t) => {
		let n = e.currentTarget, r = {
			x: e.clientX,
			y: e.clientY
		}, i = Ho(r, Vo(r, n.getBoundingClientRect())), a = Uo(t.getBoundingClientRect()), o = Go([...i, ...a]);
		s(o), d(!0);
	}, [d]);
	return _.useEffect(() => () => f(), [f]), _.useEffect(() => {
		if (c && u) {
			let e = /* @__PURE__ */ vo((e) => p(e, u), "handleTriggerLeave"), t = /* @__PURE__ */ vo((e) => p(e, c), "handleContentLeave");
			return c.addEventListener("pointerleave", e), u.addEventListener("pointerleave", t), () => {
				c.removeEventListener("pointerleave", e), u.removeEventListener("pointerleave", t);
			};
		}
	}, [
		c,
		u,
		p,
		f
	]), _.useEffect(() => {
		if (o) {
			let e = /* @__PURE__ */ vo((e) => {
				let t = e.target, n = {
					x: e.clientX,
					y: e.clientY
				}, r = c?.contains(t) || u?.contains(t), i = !Wo(n, o);
				r ? f() : i && (f(), l());
			}, "handleTrackPointerGrace");
			return document.addEventListener("pointermove", e), () => document.removeEventListener("pointermove", e);
		}
	}, [
		c,
		u,
		o,
		l,
		f
	]), /* @__PURE__ */ (0, k.jsx)(Bo, {
		...e,
		ref: a
	});
}, "TooltipContentHoverable")), zo = /* @__PURE__ */ ke("TooltipContent"), Bo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ vo(function(e, t) {
	let { __scopeTooltip: n, children: r, "aria-label": i, id: a, onEscapeKeyDown: o, onPointerDownOutside: s, ...c } = e, l = Ao(Io, n), u = xo(n), { onClose: d } = l, [f, p] = _.useState(null), m = O(t, p);
	yt(f), _.useEffect(() => (document.addEventListener(wo, d), () => document.removeEventListener(wo, d)), [d]), _.useEffect(() => {
		if (l.trigger) {
			let e = /* @__PURE__ */ vo((e) => {
				e.target instanceof Node && e.target.contains(l.trigger) && d();
			}, "handleScroll");
			return window.addEventListener("scroll", e, { capture: !0 }), () => window.removeEventListener("scroll", e, { capture: !0 });
		}
	}, [l.trigger, d]);
	let { setContentId: h } = l;
	return se(() => (h(a), () => {
		h(void 0);
	}), [a, h]), /* @__PURE__ */ (0, k.jsx)(rt, {
		asChild: !0,
		disableOutsidePointerEvents: !1,
		onEscapeKeyDown: o,
		onPointerDownOutside: s,
		onFocusOutside: (e) => e.preventDefault(),
		onDismiss: d,
		children: /* @__PURE__ */ (0, k.jsxs)(co, {
			"data-state": l.stateAttribute,
			role: i ? void 0 : "tooltip",
			id: i ? void 0 : l.contentId,
			...u,
			...c,
			ref: m,
			style: {
				...c.style,
				"--radix-tooltip-content-transform-origin": "var(--radix-popper-transform-origin)",
				"--radix-tooltip-content-available-width": "var(--radix-popper-available-width)",
				"--radix-tooltip-content-available-height": "var(--radix-popper-available-height)",
				"--radix-tooltip-trigger-width": "var(--radix-popper-anchor-width)",
				"--radix-tooltip-trigger-height": "var(--radix-popper-anchor-height)"
			},
			children: [/* @__PURE__ */ (0, k.jsx)(zo, { children: r }), i ? /* @__PURE__ */ (0, k.jsx)(go, {
				id: l.contentId,
				role: "tooltip",
				children: i
			}) : null]
		})
	});
}, "TooltipContentImpl"));
function Vo(e, t) {
	let n = Math.abs(t.top - e.y), r = Math.abs(t.bottom - e.y), i = Math.abs(t.right - e.x), a = Math.abs(t.left - e.x);
	switch (Math.min(n, r, i, a)) {
		case a: return "left";
		case i: return "right";
		case n: return "top";
		case r: return "bottom";
		default: throw Error("unreachable");
	}
}
vo(Vo, "getExitSideFromRect");
function Ho(e, t, n = 5) {
	let r = [];
	switch (t) {
		case "top":
			r.push({
				x: e.x - n,
				y: e.y + n
			}, {
				x: e.x + n,
				y: e.y + n
			});
			break;
		case "bottom":
			r.push({
				x: e.x - n,
				y: e.y - n
			}, {
				x: e.x + n,
				y: e.y - n
			});
			break;
		case "left":
			r.push({
				x: e.x + n,
				y: e.y - n
			}, {
				x: e.x + n,
				y: e.y + n
			});
			break;
		case "right": r.push({
			x: e.x - n,
			y: e.y - n
		}, {
			x: e.x - n,
			y: e.y + n
		});
	}
	return r;
}
vo(Ho, "getPaddedExitPoints");
function Uo(e) {
	let { top: t, right: n, bottom: r, left: i } = e;
	return [
		{
			x: i,
			y: t
		},
		{
			x: n,
			y: t
		},
		{
			x: n,
			y: r
		},
		{
			x: i,
			y: r
		}
	];
}
vo(Uo, "getPointsFromRect");
function Wo(e, t) {
	let { x: n, y: r } = e, i = !1;
	for (let e = 0, a = t.length - 1; e < t.length; a = e++) {
		let o = t[e], s = t[a], c = o.x, l = o.y, u = s.x, d = s.y;
		l > r != d > r && n < (u - c) * (r - l) / (d - l) + c && (i = !i);
	}
	return i;
}
vo(Wo, "isPointInPolygon");
function Go(e) {
	let t = e.slice();
	return t.sort((e, t) => e.x < t.x ? -1 : e.x > t.x ? 1 : e.y < t.y ? -1 : +(e.y > t.y)), R(t);
}
vo(Go, "getHull");
function R(e) {
	if (e.length <= 1) return e.slice();
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (; t.length >= 2;) {
			let e = t[t.length - 1], n = t[t.length - 2];
			if ((e.x - n.x) * (r.y - n.y) >= (e.y - n.y) * (r.x - n.x)) t.pop();
			else break;
		}
		t.push(r);
	}
	t.pop();
	let n = [];
	for (let t = e.length - 1; t >= 0; t--) {
		let r = e[t];
		for (; n.length >= 2;) {
			let e = n[n.length - 1], t = n[n.length - 2];
			if ((e.x - t.x) * (r.y - t.y) >= (e.y - t.y) * (r.x - t.x)) n.pop();
			else break;
		}
		n.push(r);
	}
	return n.pop(), t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n);
}
vo(R, "getHullPresorted");
function Ko(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
vo(Ko, "concatAriaDescribedby");
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var qo = (e) => e?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
function Jo(e, t, n = []) {
	if (t == null) throw Error("[lucide]: iconNode is required when icon name is used");
	return {
		name: qo(e),
		size: 24,
		node: t,
		...n.length > 0 ? { aliases: n } : {}
	};
}
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var Yo = (e) => {
	let t = "", n = !1;
	for (let r of e) r === "-" || r === "_" || r <= " " ? n = t.length > 0 : (t.length === 0 ? t += r.toLowerCase() : t += n ? r.toUpperCase() : r, n = !1);
	return t;
}, Xo = (e) => {
	let t = Yo(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, Zo = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), Qo = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconNode.mjs
function $o(e) {
	return e != null;
}
function es(e, t = {}) {
	let n = t.attributeNames ?? {}, r = (e) => n[e] ?? e, i = e.size ?? e.width ?? Qo.width, a = e.size ?? e.height ?? Qo.height, o = e.aliases?.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => `lucide-${e}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], l = t.includeDefaultClasses === !1 ? Zo(...c) : Zo("lucide", ...s, ...c), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? Qo["stroke-width"]) * Number(e.size ?? e.width ?? Qo.width) / Number(t.size ?? t.width ?? Qo.width) : t.strokeWidth ?? Qo["stroke-width"];
	return [
		"svg",
		{
			...Object.entries(Qo).reduce((e, [t, n]) => (e[r(t)] = n, e), {}),
			..."color" in t && t.color && { [r("stroke")]: t.color },
			..."size" in t && $o(t.size) && {
				[r("width")]: t.size,
				[r("height")]: t.size
			},
			..."width" in t && $o(t.width) && { [r("width")]: t.width },
			..."height" in t && $o(t.height) && { [r("height")]: t.height },
			[r("stroke-width")]: u,
			...l && { [r("class")]: l },
			[r("viewBox")]: `0 0 ${i} ${a}`,
			...t.hasA11yProp === !1 ? { [r("aria-hidden")]: "true" } : {},
			..."attributes" in t && t.attributes
		},
		e.node.map((e) => {
			let [n, i, a] = e, o = t.nonScalingStroke ? {
				[r("vector-effect")]: "non-scaling-stroke",
				...i
			} : i;
			return a ? [
				n,
				o,
				a
			] : [n, o];
		})
	];
}
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconForReact.mjs
function ts(e, t = {}) {
	return es(e, {
		...t,
		attributeNames: {
			...t.attributeNames,
			class: "className",
			"stroke-width": "strokeWidth",
			"stroke-linecap": "strokeLinecap",
			"stroke-linejoin": "strokeLinejoin",
			"vector-effect": "vectorEffect"
		}
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var ns = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, rs = (0, _.createContext)({}), is = () => (0, _.useContext)(rs), as = (0, _.forwardRef)(({ color: e, size: t, width: n, height: r, strokeWidth: i, absoluteStrokeWidth: a, nonScalingStroke: o, className: s = "", children: c, iconNode: l = [], icon: u = {
	node: l,
	aliases: [],
	size: 24
}, ...d }, f) => {
	let { size: p = 24, strokeWidth: m = 2, absoluteStrokeWidth: h = !1, nonScalingStroke: g = !1, color: v = "currentColor", className: y = "" } = is() ?? {}, b = !!c || ns(d), [x, S, C = []] = ts(u, {
		color: e ?? v,
		width: n ?? t ?? p,
		height: r ?? t ?? p,
		strokeWidth: i ?? m,
		absoluteStrokeWidth: a ?? h,
		nonScalingStroke: o ?? g,
		className: Zo(y, s),
		hasA11yProp: b,
		attributes: d
	});
	return (0, _.createElement)(x, {
		ref: f,
		...S
	}, [...C.map(([e, t]) => (0, _.createElement)(e, t)), ...Array.isArray(c) ? c : [c]]);
});
//#endregion
//#region node_modules/lucide-react/dist/esm/createLucideIcon.mjs
function os(e, t = [], n = []) {
	let r = typeof e == "string" ? Jo(e, t, n) : e, i = (0, _.forwardRef)(({ className: e, ...t }, n) => (0, _.createElement)(as, {
		ref: n,
		icon: r,
		className: e,
		...t
	}));
	return r.name && (i.displayName = Xo(r.name)), i;
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/arrow-left-right.mjs
var ss = {
	name: "arrow-left-right",
	size: 24,
	node: [
		["path", {
			d: "M8 3 4 7l4 4",
			key: "9rb6wj"
		}],
		["path", {
			d: "M4 7h16",
			key: "6tx8e3"
		}],
		["path", {
			d: "m16 21 4-4-4-4",
			key: "siv7j2"
		}],
		["path", {
			d: "M20 17H4",
			key: "h6l3hr"
		}]
	]
};
ss.node;
var cs = os(ss), ls = {
	name: "calendar-days",
	size: 24,
	node: [
		["path", {
			d: "M8 2v3",
			key: "1ioesn"
		}],
		["path", {
			d: "M16 2v3",
			key: "otl347"
		}],
		["rect", {
			x: "3",
			y: "3",
			width: "18",
			height: "18",
			rx: "2",
			key: "h1oib"
		}],
		["path", {
			d: "M3 9h18",
			key: "1pudct"
		}],
		["path", {
			d: "M8 13h.01",
			key: "1sbv64"
		}],
		["path", {
			d: "M12 13h.01",
			key: "y0uutt"
		}],
		["path", {
			d: "M16 13h.01",
			key: "wip0gl"
		}],
		["path", {
			d: "M8 17h.01",
			key: "p3bg7i"
		}],
		["path", {
			d: "M12 17h.01",
			key: "p32p05"
		}],
		["path", {
			d: "M16 17h.01",
			key: "ql8jdd"
		}]
	]
};
ls.node;
var us = os(ls), ds = {
	name: "chart-column",
	size: 24,
	node: [
		["path", {
			d: "M3 3v16a2 2 0 0 0 2 2h16",
			key: "c24i48"
		}],
		["path", {
			d: "M18 17V9",
			key: "2bz60n"
		}],
		["path", {
			d: "M13 17V5",
			key: "1frdt8"
		}],
		["path", {
			d: "M8 17v-3",
			key: "17ska0"
		}]
	],
	aliases: ["bar-chart-3"]
};
ds.node;
var fs = os(ds), ps = {
	name: "chevron-left",
	size: 24,
	node: [["path", {
		d: "m15 18-6-6 6-6",
		key: "1wnfg3"
	}]]
};
ps.node;
var ms = os(ps), hs = {
	name: "chevron-right",
	size: 24,
	node: [["path", {
		d: "m9 18 6-6-6-6",
		key: "mthhwq"
	}]]
};
hs.node;
var gs = os(hs), _s = {
	name: "circle-alert",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["line", {
			x1: "12",
			x2: "12",
			y1: "8",
			y2: "12",
			key: "1pkeuh"
		}],
		["line", {
			x1: "12",
			x2: "12.01",
			y1: "16",
			y2: "16",
			key: "4dfq90"
		}]
	],
	aliases: ["alert-circle"]
};
_s.node;
var vs = os(_s), ys = {
	name: "circle-check",
	size: 24,
	node: [["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}], ["path", {
		d: "m16 9-5.5 5.5L8 12",
		key: "xofnsj"
	}]],
	aliases: ["check-circle-2"]
};
ys.node;
var bs = os(ys), xs = {
	name: "clipboard-check",
	size: 24,
	node: [
		["rect", {
			width: "8",
			height: "4",
			x: "8",
			y: "2",
			rx: "1",
			ry: "1",
			key: "tgr4d6"
		}],
		["path", {
			d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
			key: "116196"
		}],
		["path", {
			d: "m9 14 2 2 4-4",
			key: "df797q"
		}]
	]
};
xs.node;
var Ss = os(xs), Cs = {
	name: "download",
	size: 24,
	node: [
		["path", {
			d: "M12 15V3",
			key: "m9g1x1"
		}],
		["path", {
			d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
			key: "ih7n3h"
		}],
		["path", {
			d: "m7 10 5 5 5-5",
			key: "brsn70"
		}]
	]
};
Cs.node;
var ws = os(Cs), Ts = {
	name: "file-text",
	size: 24,
	node: [
		["path", {
			d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
			key: "1oefj6"
		}],
		["path", {
			d: "M14 2v5a1 1 0 0 0 1 1h5",
			key: "wfsgrz"
		}],
		["path", {
			d: "M10 9H8",
			key: "b1mrlr"
		}],
		["path", {
			d: "M16 13H8",
			key: "t4e002"
		}],
		["path", {
			d: "M16 17H8",
			key: "z1uh3a"
		}]
	]
};
Ts.node;
var Es = os(Ts), Ds = {
	name: "graduation-cap",
	size: 24,
	node: [
		["path", {
			d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
			key: "j76jl0"
		}],
		["path", {
			d: "M22 10v6",
			key: "1lu8f3"
		}],
		["path", {
			d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
			key: "1r8lef"
		}]
	]
};
Ds.node;
var Os = os(Ds), ks = {
	name: "info",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["path", {
			d: "M12 16v-4",
			key: "1dtifu"
		}],
		["path", {
			d: "M12 8h.01",
			key: "e9boi3"
		}]
	]
};
ks.node;
var As = os(ks), js = {
	name: "loader-circle",
	size: 24,
	node: [["path", {
		d: "M21 12a9 9 0 1 1-6.219-8.56",
		key: "13zald"
	}]],
	aliases: ["loader-2"]
};
js.node;
var Ms = os(js), Ns = {
	name: "menu",
	size: 24,
	node: [
		["path", {
			d: "M4 5h16",
			key: "1tepv9"
		}],
		["path", {
			d: "M4 12h16",
			key: "1lakjw"
		}],
		["path", {
			d: "M4 19h16",
			key: "1djgab"
		}]
	]
};
Ns.node;
var Ps = os(Ns), Fs = {
	name: "moon",
	size: 24,
	node: [["path", {
		d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
		key: "kfwtm"
	}]]
};
Fs.node;
var Is = os(Fs), Ls = {
	name: "panel-left-close",
	size: 24,
	node: [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			key: "afitv7"
		}],
		["path", {
			d: "M9 3v18",
			key: "fh3hqa"
		}],
		["path", {
			d: "m16 15-3-3 3-3",
			key: "14y99z"
		}]
	],
	aliases: ["sidebar-close"]
};
Ls.node;
var Rs = os(Ls), zs = {
	name: "plus",
	size: 24,
	node: [["path", {
		d: "M5 12h14",
		key: "1ays0h"
	}], ["path", {
		d: "M12 5v14",
		key: "s699le"
	}]]
};
zs.node;
var Bs = os(zs), Vs = {
	name: "search",
	size: 24,
	node: [["path", {
		d: "m21 21-4.34-4.34",
		key: "14j7rj"
	}], ["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}]]
};
Vs.node;
var Hs = os(Vs), Us = {
	name: "settings-2",
	size: 24,
	node: [
		["path", {
			d: "M14 17H5",
			key: "gfn3mx"
		}],
		["path", {
			d: "M19 7h-9",
			key: "6i9tg"
		}],
		["circle", {
			cx: "17",
			cy: "17",
			r: "3",
			key: "18b49y"
		}],
		["circle", {
			cx: "7",
			cy: "7",
			r: "3",
			key: "dfmy0x"
		}]
	]
};
Us.node;
var Ws = os(Us), Gs = {
	name: "shield-check",
	size: 24,
	node: [["path", {
		d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
		key: "oel41y"
	}], ["path", {
		d: "m9 12 2 2 4-4",
		key: "dzmm74"
	}]]
};
Gs.node;
var Ks = os(Gs), qs = {
	name: "sun",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "4",
			key: "4exip2"
		}],
		["path", {
			d: "M12 2v2",
			key: "tus03m"
		}],
		["path", {
			d: "M12 20v2",
			key: "1lh1kg"
		}],
		["path", {
			d: "m4.93 4.93 1.41 1.41",
			key: "149t6j"
		}],
		["path", {
			d: "m17.66 17.66 1.41 1.41",
			key: "ptbguv"
		}],
		["path", {
			d: "M2 12h2",
			key: "1t8f8n"
		}],
		["path", {
			d: "M20 12h2",
			key: "1q8mjw"
		}],
		["path", {
			d: "m6.34 17.66-1.41 1.41",
			key: "1m8zz5"
		}],
		["path", {
			d: "m19.07 4.93-1.41 1.41",
			key: "1shlcs"
		}]
	]
};
qs.node;
var Js = os(qs), Ys = {
	name: "trash",
	size: 24,
	node: [
		["path", {
			d: "M10 11v6",
			key: "nco0om"
		}],
		["path", {
			d: "M14 11v6",
			key: "outv1u"
		}],
		["path", {
			d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
			key: "miytrc"
		}],
		["path", {
			d: "M3 6h18",
			key: "d0wm0j"
		}],
		["path", {
			d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
			key: "e791ji"
		}]
	],
	aliases: ["trash-2"]
};
Ys.node;
var Xs = os(Ys), Zs = {
	name: "upload",
	size: 24,
	node: [
		["path", {
			d: "M12 3v12",
			key: "1x0j5s"
		}],
		["path", {
			d: "m17 8-5-5-5 5",
			key: "7q97r8"
		}],
		["path", {
			d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
			key: "ih7n3h"
		}]
	]
};
Zs.node;
var Qs = os(Zs), $s = {
	name: "users",
	size: 24,
	node: [
		["path", {
			d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
			key: "1yyitq"
		}],
		["path", {
			d: "M16 3.128a4 4 0 0 1 0 7.744",
			key: "16gr8j"
		}],
		["path", {
			d: "M22 21v-2a4 4 0 0 0-3-3.87",
			key: "kshegd"
		}],
		["circle", {
			cx: "9",
			cy: "7",
			r: "4",
			key: "nufk8"
		}]
	]
};
$s.node;
var ec = os($s), tc = {
	name: "x",
	size: 24,
	node: [["path", {
		d: "M18 6 6 18",
		key: "1bl5f8"
	}], ["path", {
		d: "m6 6 12 12",
		key: "d8bk6v"
	}]]
};
tc.node;
var nc = os(tc);
//#endregion
//#region src/types.ts
function rc(e) {
	return e.flatMap((e) => [e, ...rc(e.children ?? [])]);
}
//#endregion
//#region node_modules/zustand/esm/vanilla.mjs
var ic = (e) => {
	let t, n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = typeof e == "function" ? e(t) : e;
		if (!Object.is(i, t)) {
			let e = t;
			t = r ?? (typeof i != "object" || !i) ? i : Object.assign({}, t, i), n.forEach((n) => n(t, e));
		}
	}, i = () => t, a = {
		setState: r,
		getState: i,
		getInitialState: () => o,
		subscribe: (e) => (n.add(e), () => n.delete(e))
	}, o = t = e(r, i, a);
	return a;
}, ac = ((e) => e ? ic(e) : ic), oc = (e) => e;
function sc(e, t = oc) {
	let n = _.useSyncExternalStore(e.subscribe, _.useCallback(() => t(e.getState()), [e, t]), _.useCallback(() => t(e.getInitialState()), [e, t]));
	return _.useDebugValue(n), n;
}
var cc = (e) => {
	let t = ac(e), n = (e) => sc(t, e);
	return Object.assign(n, t), n;
}, lc = ((e) => e ? cc(e) : cc), uc = lc((e) => ({
	values: {},
	set: (t, n) => e((e) => ({ values: {
		...e.values,
		[t]: n
	} })),
	clear: () => e({ values: {} })
})), dc = lc((e) => ({
	collapsed: typeof window < "u" && window.innerWidth <= 1024,
	search: "",
	settings: !1,
	update: (t) => e(t)
})), fc = lc((e) => ({
	epoch: 0,
	items: {},
	set: (t, n, r) => e((e) => e.epoch === r ? { items: {
		...e.items,
		[t]: {
			...e.items[t],
			...n
		}
	} } : e),
	clear: () => e((e) => ({
		items: {},
		epoch: e.epoch + 1
	}))
}));
//#endregion
//#region node_modules/dompurify/dist/purify.es.mjs
function pc(e, t) {
	this.v = e, this.k = t;
}
function mc(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function hc(e) {
	if (Array.isArray(e)) return e;
}
function gc(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t === 0) {
				if (Object(n) !== n) return;
				c = !1;
			} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function _c() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function vc(e, t) {
	return hc(e) || gc(e, t) || yc(e, t) || _c();
}
function yc(e, t) {
	if (e) {
		if (typeof e == "string") return mc(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? mc(e, t) : void 0;
	}
}
function bc(e) {
	var t, n;
	function r(t, n) {
		try {
			var a = e[t](n), o = a.value, s = o instanceof pc;
			Promise.resolve(s ? o.v : o).then(function(n) {
				if (s) {
					var c = t === "return" && o.k ? t : "next";
					if (!o.k || n.done) return r(c, n);
					n = e[c](n).value;
				}
				i(!!a.done, n);
			}, function(e) {
				r("throw", e);
			});
		} catch (e) {
			i(2, e);
		}
	}
	function i(e, i) {
		e === 2 ? t.reject(i) : t.resolve({
			value: i,
			done: e
		}), (t = t.next) ? r(t.key, t.arg) : n = null;
	}
	this._invoke = function(e, i) {
		return new Promise(function(a, o) {
			var s = {
				key: e,
				arg: i,
				resolve: a,
				reject: o,
				next: null
			};
			n ? n = n.next = s : (t = n = s, r(e, i));
		});
	}, typeof e.return != "function" && (this.return = void 0);
}
bc.prototype[typeof Symbol == "function" && Symbol.asyncIterator || "@@asyncIterator"] = function() {
	return this;
}, bc.prototype.next = function(e) {
	return this._invoke("next", e);
}, bc.prototype.throw = function(e) {
	return this._invoke("throw", e);
}, bc.prototype.return = function(e) {
	return this._invoke("return", e);
};
var xc = Object.entries, Sc = Object.setPrototypeOf, Cc = Object.isFrozen, wc = Object.getPrototypeOf, Tc = Object.getOwnPropertyDescriptor, Ec = Object.freeze, Dc = Object.seal, Oc = Object.create, kc = typeof Reflect < "u" && Reflect, Ac = kc.apply, jc = kc.construct;
Ec ||= function(e) {
	return e;
}, Dc ||= function(e) {
	return e;
}, Ac ||= function(e, t) {
	var n = [...arguments].slice(2);
	return e.apply(t, n);
}, jc ||= function(e) {
	return new e(...[...arguments].slice(1));
};
var Mc = nl(Array.prototype.forEach);
Array.prototype.indexOf;
var Nc = nl(Array.prototype.lastIndexOf), Pc = nl(Array.prototype.pop), Fc = nl(Array.prototype.push), Ic = nl(Array.prototype.slice), Lc = nl(Array.prototype.splice), Rc = Array.isArray, zc = rl(Set), Bc = nl(Set.prototype.add), Vc = nl(Set.prototype.has), Hc = nl(String.prototype.toLowerCase), Uc = nl(String.prototype.toString), Wc = nl(String.prototype.match), Gc = nl(String.prototype.replace), Kc = nl(String.prototype.indexOf), qc = nl(String.prototype.trim), Jc = nl(Number.prototype.toString), Yc = nl(Boolean.prototype.toString), Xc = typeof BigInt > "u" ? null : nl(BigInt.prototype.toString), Zc = typeof Symbol > "u" ? null : nl(Symbol.prototype.toString), Qc = nl(Object.prototype.hasOwnProperty), $c = nl(Object.prototype.toString), el = nl(RegExp.prototype.test), tl = rl(TypeError);
function nl(e) {
	return function(t) {
		t instanceof RegExp && (t.lastIndex = 0);
		var n = [...arguments].slice(1);
		return Ac(e, t, n);
	};
}
function rl(e) {
	return function() {
		return jc(e, [...arguments]);
	};
}
function z(e, t) {
	let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Hc;
	if (Sc && Sc(e, null), !Rc(t)) return e;
	let r = t.length;
	for (; r--;) {
		let i = t[r];
		if (typeof i == "string") {
			let e = n(i);
			e !== i && (Cc(t) || (t[r] = e), i = e);
		}
		e[i] = !0;
	}
	return e;
}
function il(e) {
	for (let t = 0; t < e.length; t++) Qc(e, t) || (e[t] = null);
	return e;
}
function al(e) {
	let t = Oc(null);
	for (let r of xc(e)) {
		var n = vc(r, 2);
		let i = n[0], a = n[1];
		Qc(e, i) && (t[i] = Rc(a) ? il(a) : a && typeof a == "object" && a.constructor === Object ? al(a) : a);
	}
	return t;
}
function ol(e) {
	switch (typeof e) {
		case "string": return e;
		case "number": return Jc(e);
		case "boolean": return Yc(e);
		case "bigint": return Xc ? Xc(e) : "0";
		case "symbol": return Zc ? Zc(e) : "Symbol()";
		case "undefined": return $c(e);
		case "function":
		case "object": {
			if (e === null) return $c(e);
			let t = e, n = sl(t, "toString");
			if (typeof n == "function") {
				let e = n(t);
				return typeof e == "string" ? e : $c(e);
			}
			return $c(e);
		}
		default: return $c(e);
	}
}
function sl(e, t) {
	for (; e !== null;) {
		let n = Tc(e, t);
		if (n) {
			if (n.get) return nl(n.get);
			if (typeof n.value == "function") return nl(n.value);
		}
		e = wc(e);
	}
	function n() {
		return null;
	}
	return n;
}
function cl(e, t) {
	for (; e !== null;) {
		let n = Tc(e, t);
		if (n) return n.get ? nl(n.get) : null;
		e = wc(e);
	}
	return null;
}
function ll(e) {
	try {
		return el(e, ""), !0;
	} catch {
		return !1;
	}
}
var ul = Ec(/* @__PURE__ */ "a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr".split(".")), dl = Ec(/* @__PURE__ */ "svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.enterkeyhint.exportparts.filter.font.g.glyph.glyphref.hkern.image.inputmode.line.lineargradient.marker.mask.metadata.mpath.part.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern".split(".")), fl = Ec([
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence"
]), pl = Ec([
	"animate",
	"color-profile",
	"cursor",
	"discard",
	"font-face",
	"font-face-format",
	"font-face-name",
	"font-face-src",
	"font-face-uri",
	"foreignobject",
	"hatch",
	"hatchpath",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"missing-glyph",
	"script",
	"set",
	"solidcolor",
	"unknown",
	"use"
]), ml = Ec(/* @__PURE__ */ "math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts".split(".")), hl = Ec([
	"maction",
	"maligngroup",
	"malignmark",
	"mlongdiv",
	"mscarries",
	"mscarry",
	"msgroup",
	"mstack",
	"msline",
	"msrow",
	"semantics",
	"annotation",
	"annotation-xml",
	"mprescripts",
	"none"
]), gl = Ec(["#text"]), _l = Ec(/* @__PURE__ */ "accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.command.commandfor.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns".split(".")), vl = Ec(/* @__PURE__ */ "accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dominant-baseline.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.pointer-events.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-orientation.text-rendering.textlength.type.u1.u2.unicode.values.vector-effect.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan".split(".")), yl = Ec(/* @__PURE__ */ "accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns".split(".")), bl = Ec([
	"xlink:href",
	"xml:id",
	"xlink:title",
	"xml:space",
	"xmlns:xlink"
]), xl = Dc(/{{[\w\W]*|^[\w\W]*}}/g), Sl = Dc(/<%[\w\W]*|^[\w\W]*%>/g), Cl = Dc(/\${[\w\W]*/g), wl = Dc(/^data-[\-\w.\u00B7-\uFFFF]+$/), Tl = Dc(/^aria-[\-\w]+$/), El = Dc(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i), Dl = Dc(/^(?:\w+script|data):/i), Ol = Dc(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g), kl = Dc(/^html$/i), Al = Dc(/^[a-z][.\w]*(-[.\w]+)+$/i), jl = Dc(/<[/\w!]/g), Ml = Dc(/<[/\w]/g), Nl = Dc(/<\/no(script|embed|frames)/i), Pl = Dc(/\/>/i), Fl = {
	element: 1,
	attribute: 2,
	text: 3,
	cdataSection: 4,
	entityReference: 5,
	entityNode: 6,
	processingInstruction: 7,
	comment: 8,
	document: 9,
	documentType: 10,
	documentFragment: 11,
	notation: 12
}, Il = Ec(z({}, [
	"style",
	"script",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"plaintext",
	"noscript"
])), Ll = function() {
	return typeof window > "u" ? null : window;
}, Rl = function(e, t) {
	if (typeof e != "object" || typeof e.createPolicy != "function") return null;
	let n = null, r = "data-tt-policy-suffix";
	t && t.hasAttribute(r) && (n = t.getAttribute(r));
	let i = "dompurify" + (n ? "#" + n : "");
	try {
		return e.createPolicy(i, {
			createHTML(e) {
				return e;
			},
			createScriptURL(e) {
				return e;
			}
		});
	} catch {
		return console.warn("TrustedTypes policy " + i + " could not be created."), null;
	}
}, zl = function() {
	return {
		afterSanitizeAttributes: [],
		afterSanitizeElements: [],
		afterSanitizeShadowDOM: [],
		beforeSanitizeAttributes: [],
		beforeSanitizeElements: [],
		beforeSanitizeShadowDOM: [],
		uponSanitizeAttribute: [],
		uponSanitizeElement: [],
		uponSanitizeShadowNode: []
	};
}, Bl = function(e, t, n, r) {
	return Qc(e, t) && Rc(e[t]) ? z(r.base ? al(r.base) : {}, e[t], r.transform) : n;
}, Vl = function(e, t, n) {
	let r = Qc(e, t) ? e[t] : void 0;
	return r && typeof r == "object" ? al(r) : n();
};
function Hl() {
	let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Ll(), t = (e) => Hl(e);
	if (t.version = "3.4.17", t.removed = [], !e || !e.document || e.document.nodeType !== Fl.document || !e.Element) return t.isSupported = !1, t;
	let n = e.document, r = n, i = r.currentScript;
	e.DocumentFragment;
	let a = e.HTMLTemplateElement, o = e.Node, s = e.Element, c = e.NodeFilter;
	e.NamedNodeMap === void 0 && (e.NamedNodeMap || e.MozNamedAttrMap), e.HTMLFormElement;
	let l = e.DOMParser, u = e.trustedTypes, d = s.prototype, f = sl(d, "cloneNode"), p = sl(d, "remove"), m = sl(d, "removeAttributeNode"), h = sl(d, "nextSibling"), g = sl(d, "childNodes"), _ = sl(d, "parentNode"), v = sl(d, "shadowRoot"), y = sl(d, "attributes"), b = o && o.prototype ? sl(o.prototype, "nodeType") : null, x = o && o.prototype ? sl(o.prototype, "nodeName") : null, S = o && o.prototype ? sl(o.prototype, "ownerDocument") : null, C = function(e) {
		return b ? b(e) : e.nodeType;
	}, w = function(e) {
		return x ? x(e) : e.nodeName;
	}, T = cl(d, "namespaceURI"), ee = function(e) {
		return T ? T(e) : e.namespaceURI;
	};
	if (typeof a == "function") {
		let e = n.createElement("template");
		e.content && e.content.ownerDocument && (n = e.content.ownerDocument);
	}
	let E, D = "", te, ne = !1, O = 0, re = function() {
		if (O > 0) throw tl("A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the \"DOMPurify and Trusted Types\" section of the README.");
	}, k = function(e) {
		re(), O++;
		try {
			return E.createHTML(e);
		} finally {
			O--;
		}
	}, ie = function(e) {
		re(), O++;
		try {
			return E.createScriptURL(e);
		} finally {
			O--;
		}
	}, A = function() {
		return ne ||= (te = Rl(u, i), !0), te;
	}, j = n, ae = j.implementation, oe = j.createNodeIterator, se = j.createDocumentFragment, ce = j.getElementsByTagName, le = r.importNode, M = zl();
	t.isSupported = typeof xc == "function" && typeof _ == "function" && ae && ae.createHTMLDocument !== void 0;
	let ue = xl, de = Sl, fe = Cl, pe = wl, me = Tl, he = Dl, ge = Ol, _e = Al, N = El, P = null, ve = z({}, [
		...ul,
		...dl,
		...fl,
		...ml,
		...gl
	]), ye = null, be = z({}, [
		..._l,
		...vl,
		...yl,
		...bl
	]), xe = Object.seal(Oc(null, {
		tagNameCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		attributeNameCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		allowCustomizedBuiltInElements: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: !1
		}
	})), Se = null, Ce = null, we = Object.seal(Oc(null, {
		tagCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		attributeCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		}
	})), Te = !0, Ee = !0, De = !1, Oe = !0, ke = !1, Ae = !0, je = !1, Me = !1, Ne = null, Pe = null, Fe = !1, Ie = !1, Le = !1, Re = !1, ze = !0, Be = !1, Ve = "user-content-", He = !0, Ue = !1, We = null, Ge = {}, Ke = null, qe = z({}, /* @__PURE__ */ "annotation-xml.audio.colgroup.desc.foreignobject.head.iframe.math.mi.mn.mo.ms.mtext.noembed.noframes.noscript.plaintext.script.selectedcontent.style.svg.template.thead.title.video.xmp".split(".")), Je = null, Ye = z({}, [
		"audio",
		"video",
		"img",
		"source",
		"image",
		"track"
	]), Xe = null, Ze = z({}, [
		"alt",
		"class",
		"for",
		"id",
		"label",
		"name",
		"pattern",
		"placeholder",
		"role",
		"summary",
		"title",
		"value",
		"style",
		"xmlns"
	]), Qe = "http://www.w3.org/1998/Math/MathML", $e = "http://www.w3.org/2000/svg", et = "http://www.w3.org/1999/xhtml", tt = et, nt = !1, rt = null, it = z({}, [
		Qe,
		$e,
		et
	], Uc), at = Ec([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext"
	]), ot = z({}, at), st = Ec(["annotation-xml"]), ct = z({}, st), lt = z({}, [
		"title",
		"style",
		"font",
		"a",
		"script"
	]), ut = null, dt = ["application/xhtml+xml", "text/html"], ft = null, pt = null, mt = n.createElement("form"), ht = function(e) {
		return e instanceof RegExp || e instanceof Function;
	}, gt = function() {
		let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		if (pt && pt === e) return;
		(!e || typeof e != "object") && (e = {}), e = al(e), ut = dt.indexOf(e.PARSER_MEDIA_TYPE) === -1 ? "text/html" : e.PARSER_MEDIA_TYPE, ft = ut === "application/xhtml+xml" ? Uc : Hc, P = Bl(e, "ALLOWED_TAGS", ve, { transform: ft }), ye = Bl(e, "ALLOWED_ATTR", be, { transform: ft }), rt = Bl(e, "ALLOWED_NAMESPACES", it, { transform: Uc }), Xe = Bl(e, "ADD_URI_SAFE_ATTR", Ze, {
			transform: ft,
			base: Ze
		}), Je = Bl(e, "ADD_DATA_URI_TAGS", Ye, {
			transform: ft,
			base: Ye
		}), Ke = Bl(e, "FORBID_CONTENTS", qe, { transform: ft }), Se = Bl(e, "FORBID_TAGS", al({}), { transform: ft }), Ce = Bl(e, "FORBID_ATTR", al({}), { transform: ft }), Ge = Qc(e, "USE_PROFILES") ? e.USE_PROFILES && typeof e.USE_PROFILES == "object" ? al(e.USE_PROFILES) : e.USE_PROFILES : !1, Te = e.ALLOW_ARIA_ATTR !== !1, Ee = e.ALLOW_DATA_ATTR !== !1, De = e.ALLOW_UNKNOWN_PROTOCOLS || !1, Oe = e.ALLOW_SELF_CLOSE_IN_ATTR !== !1, ke = e.SAFE_FOR_TEMPLATES || !1, Ae = e.SAFE_FOR_XML !== !1, je = e.WHOLE_DOCUMENT || !1, Ie = e.RETURN_DOM || !1, Le = e.RETURN_DOM_FRAGMENT || !1, Re = e.RETURN_TRUSTED_TYPE || !1, Fe = e.FORCE_BODY || !1, ze = e.SANITIZE_DOM !== !1, Be = e.SANITIZE_NAMED_PROPS || !1, He = e.KEEP_CONTENT !== !1, Ue = e.IN_PLACE || !1, N = ll(e.ALLOWED_URI_REGEXP) ? e.ALLOWED_URI_REGEXP : El, tt = typeof e.NAMESPACE == "string" ? e.NAMESPACE : et, ot = Vl(e, "MATHML_TEXT_INTEGRATION_POINTS", () => z({}, at)), ct = Vl(e, "HTML_INTEGRATION_POINTS", () => z({}, st));
		let t = Vl(e, "CUSTOM_ELEMENT_HANDLING", () => Oc(null));
		if (xe = Oc(null), Qc(t, "tagNameCheck") && ht(t.tagNameCheck) && (xe.tagNameCheck = t.tagNameCheck), Qc(t, "attributeNameCheck") && ht(t.attributeNameCheck) && (xe.attributeNameCheck = t.attributeNameCheck), Qc(t, "allowCustomizedBuiltInElements") && typeof t.allowCustomizedBuiltInElements == "boolean" && (xe.allowCustomizedBuiltInElements = t.allowCustomizedBuiltInElements), Dc(xe), ke && (Ee = !1), Le && (Ie = !0), Ge && (P = z({}, gl), ye = Oc(null), Ge.html === !0 && (z(P, ul), z(ye, _l)), Ge.svg === !0 && (z(P, dl), z(ye, vl), z(ye, bl)), Ge.svgFilters === !0 && (z(P, fl), z(ye, vl), z(ye, bl)), Ge.mathMl === !0 && (z(P, ml), z(ye, yl), z(ye, bl))), we.tagCheck = null, we.attributeCheck = null, Qc(e, "ADD_TAGS") && (typeof e.ADD_TAGS == "function" ? we.tagCheck = e.ADD_TAGS : Rc(e.ADD_TAGS) && (P === ve && (P = al(P)), z(P, e.ADD_TAGS, ft))), Qc(e, "ADD_ATTR") && (typeof e.ADD_ATTR == "function" ? we.attributeCheck = e.ADD_ATTR : Rc(e.ADD_ATTR) && (ye === be && (ye = al(ye)), z(ye, e.ADD_ATTR, ft))), Qc(e, "ADD_FORBID_CONTENTS") && Rc(e.ADD_FORBID_CONTENTS) && (Ke === qe && (Ke = al(Ke)), z(Ke, e.ADD_FORBID_CONTENTS, ft)), He && (P["#text"] = !0), je && z(P, [
			"html",
			"head",
			"body"
		]), P.table && (z(P, ["tbody"]), delete Se.tbody), e.TRUSTED_TYPES_POLICY) {
			if (typeof e.TRUSTED_TYPES_POLICY.createHTML != "function") throw tl("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
			if (typeof e.TRUSTED_TYPES_POLICY.createScriptURL != "function") throw tl("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
			let t = E;
			E = e.TRUSTED_TYPES_POLICY;
			try {
				D = k("");
			} catch (e) {
				throw E = t, e;
			}
		} else e.TRUSTED_TYPES_POLICY === null ? (E = void 0, D = "") : (E === void 0 && (E = A()), E && typeof D == "string" && (D = k("")));
		Ec && Ec(e), pt = e;
	}, _t = z({}, [
		...dl,
		...fl,
		...pl
	]), vt = z({}, [...ml, ...hl]), yt = function(e, t, n) {
		return t.namespaceURI === et ? e === "svg" : t.namespaceURI === Qe ? e === "svg" && (n === "annotation-xml" || ot[n]) : !!_t[e];
	}, bt = function(e, t, n) {
		return t.namespaceURI === et ? e === "math" : t.namespaceURI === $e ? e === "math" && ct[n] : !!vt[e];
	}, xt = function(e, t, n) {
		return t.namespaceURI === $e && !ct[n] || t.namespaceURI === Qe && !ot[n] ? !1 : !vt[e] && (lt[e] || !_t[e]);
	}, St = function(e) {
		let t = ee(e), n = Hc(w(e)), r = _(e), i, a;
		return r && C(r) === Fl.element ? (i = { namespaceURI: ee(r) }, a = Hc(w(r))) : (i = { namespaceURI: tt }, a = "template"), rt[t] ? t === $e ? yt(n, i, a) : t === Qe ? bt(n, i, a) : t === et ? xt(n, i, a) : !!(ut === "application/xhtml+xml" && rt[t]) : !1;
	}, Ct = function(e) {
		Fc(t.removed, { element: e });
		try {
			_(e).removeChild(e);
		} catch {
			if (p(e), !_(e)) throw tl("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
		}
	}, wt = function(e, t, n) {
		try {
			m(e, t);
		} catch {
			try {
				e.removeAttribute(n);
			} catch {}
		}
	}, Tt = function(e) {
		Ot(e);
		let t = g(e);
		t && Mc(Ic(t), (e) => {
			try {
				p(e);
			} catch {}
		});
		let n = C(e) === Fl.element ? y(e) : null;
		if (n) for (let t = n.length - 1; t >= 0; --t) {
			let r = n[t], i = r && r.name;
			typeof i == "string" && wt(e, r, i);
		}
	}, F = function(e, n, r) {
		if (!r) try {
			r = n.getAttributeNode(e);
		} catch {
			r = null;
		}
		Fc(t.removed, {
			attribute: r || null,
			from: n
		});
		try {
			r ? m(n, r) : n.removeAttribute(e);
		} catch {
			try {
				n.removeAttribute(e);
			} catch {}
		}
		if (e === "is") {
			if (Ie || Le) try {
				Ct(n);
			} catch {}
			else try {
				n.setAttribute(e, "");
			} catch {}
		}
	}, Et = function(e) {
		let t = y(e);
		if (t) for (let n = t.length - 1; n >= 0; --n) {
			let r = t[n], i = r && r.name;
			typeof i != "string" || ye[ft(i)] || wt(e, r, i);
		}
	}, Dt = function(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 && arguments[2], r = [e];
		for (; r.length > 0;) {
			let e = r.pop();
			if (t(e) === !1) continue;
			if (n && C(e) === Fl.element) {
				let t = v(e);
				Ut(t) && r.push(t);
			}
			let i = g(e);
			if (i) for (let e = i.length - 1; e >= 0; --e) r.push(i[e]);
		}
	}, Ot = function(e) {
		Dt(e, (e) => {
			C(e) === Fl.element && Et(e);
		});
	}, kt = function(e) {
		let t = [];
		return Dt(e, (e) => {
			t.push(e);
		}, !0), t;
	}, At = function(e, t) {
		let n = zc();
		Mc(kt(e), (e) => {
			C(e) === Fl.element && Bc(n, e);
		}), Mc(t, (e) => {
			C(e) === Fl.element && !Vc(n, e) && Et(e);
		});
	}, jt = function(e, n) {
		let r = !1;
		return Mc(t.removed, (t) => {
			t.element && (r ||= t.element === e, Ot(t.element));
		}), At(e, n), r;
	}, Mt = function(e, t) {
		let n = We, r = null, i = () => (r || (r = zc(), Mc(t, (e) => {
			Bc(r, e);
		})), r);
		for (let t = 0;; t++) {
			let r = kt(e), a = [e], o = !1;
			if (Mc(r, (e) => {
				C(e) === Fl.documentFragment ? Fc(a, e) : !o && !Vc(n, e) && (o = Vc(i(), e));
			}), !o) return;
			if (t >= 8) throw tl("the tree kept changing during in-place sanitization; refusing to return it");
			Mc(a, (t, n) => {
				Nt(t, n > 0, e, i());
			});
		}
	}, Nt = function(e, t, n, r) {
		let i = Rt(e), a;
		for (; a = i.nextNode();) Vc(r, a) && !Vc(We, a) && (t && Gt(M.uponSanitizeShadowNode, a, null), Xt(a, n), rn(a, n), Ut(a.content) && an(a.content));
	}, Pt = function(e) {
		We && Bc(We, e);
	}, Ft = function(e, t) {
		return Ae ? e === "patchsrc" || e === "for" && t !== "label" && t !== "output" : !1;
	}, It = function(e) {
		Ae && Dt(e, (e) => {
			let t = C(e);
			if (t === Fl.processingInstruction || t === Fl.comment && el(Ml, e.data)) {
				try {
					p(e);
				} catch {}
				return !1;
			}
			if (t === Fl.element) {
				let t = e, n = ft(w(e));
				try {
					t.hasAttribute && t.hasAttribute("patchsrc") && t.removeAttribute("patchsrc"), t.hasAttribute && t.hasAttribute("for") && Ft("for", n) && t.removeAttribute("for");
				} catch {}
			}
			return !0;
		});
	}, Lt = function(e) {
		let t = null, r = null;
		if (Fe) e = "<remove></remove>" + e;
		else {
			let t = Wc(e, /^[\r\n\t ]+/);
			r = t && t[0];
		}
		ut === "application/xhtml+xml" && tt === et && (e = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + e + "</body></html>");
		let i = E ? k(e) : e;
		if (tt === et) try {
			t = new l().parseFromString(i, ut);
		} catch {}
		if (!t || !t.documentElement) {
			t = ae.createDocument(tt, "template", null);
			try {
				t.documentElement.innerHTML = nt ? D : i;
			} catch {}
		}
		let a = t.body || t.documentElement;
		return e && r && a.insertBefore(n.createTextNode(r), a.childNodes[0] || null), tt === et ? ce.call(t, je ? "html" : "body")[0] : je ? t.documentElement : a;
	}, Rt = function(e) {
		let t = S ? S(e) : e.ownerDocument;
		return oe.call(t || e, e, c.SHOW_ELEMENT | c.SHOW_COMMENT | c.SHOW_TEXT | c.SHOW_PROCESSING_INSTRUCTION | c.SHOW_CDATA_SECTION, null);
	}, zt = function(e) {
		return e = Gc(e, ue, " "), e = Gc(e, de, " "), e = Gc(e, fe, " "), e;
	}, Bt = function(e) {
		Vt(e);
		let t = e.querySelectorAll?.call(e, "template");
		t && Mc(t, (e) => {
			Ut(e.content) && Bt(e.content);
		});
	}, Vt = function(e) {
		e.normalize();
		let t = S ? S(e) : e.ownerDocument, n = oe.call(t || e, e, c.SHOW_TEXT | c.SHOW_COMMENT | c.SHOW_CDATA_SECTION | c.SHOW_PROCESSING_INSTRUCTION, null), r = n.nextNode();
		for (; r;) r.data = zt(r.data), r = n.nextNode();
	}, Ht = function(e) {
		let t = x ? x(e) : null;
		return typeof t != "string" || ft(t) !== "form" ? !1 : typeof e.nodeName != "string" || typeof e.textContent != "string" || typeof e.removeChild != "function" || e.attributes !== y(e) || typeof e.removeAttribute != "function" || typeof e.removeAttributeNode != "function" || typeof e.getAttributeNode != "function" || typeof e.setAttribute != "function" || typeof e.namespaceURI != "string" || typeof e.insertBefore != "function" || typeof e.hasChildNodes != "function" || e.nodeType !== b(e) || e.childNodes !== g(e);
	}, Ut = function(e) {
		if (!b || typeof e != "object" || !e) return !1;
		try {
			return b(e) === Fl.documentFragment;
		} catch {
			return !1;
		}
	}, Wt = function(e) {
		if (!b || typeof e != "object" || !e) return !1;
		try {
			return typeof b(e) == "number";
		} catch {
			return !1;
		}
	};
	function Gt(e, n, r) {
		e.length !== 0 && Mc(e, (e) => {
			e.call(t, n, r, pt);
		});
	}
	let Kt = function(e, t) {
		return !!(Ae && e.hasChildNodes() && !Wt(e.firstElementChild) && el(jl, e.textContent) && el(jl, e.innerHTML) || Ae && Il[t] && C(e) === Fl.element && ee(e) === et && (Wt(e.firstElementChild) || typeof e.textContent == "string" && el(jl, e.textContent)) || e.nodeType === Fl.processingInstruction || Ae && e.nodeType === Fl.comment && el(Ml, e.data));
	}, qt = function(e, t) {
		return e instanceof RegExp ? el(e, t) : e instanceof Function && !!e(t, ...[...arguments].slice(2));
	}, Jt = function(e, t, n) {
		if (!Se[t] && $t(t) && qt(xe.tagNameCheck, t)) return !1;
		if (He && !Ke[t] && !Ke[Hc(t)]) {
			let t = _(e), r = g(e);
			if (r && t) {
				let i = r.length;
				for (let a = i - 1; a >= 0; --a) {
					let i = e === n ? f(r[a], !0) : r[a];
					t.insertBefore(i, h(e));
				}
			}
		}
		return Ct(e), !0;
	}, I = function(e, t, n, r) {
		return e.length === 0 ? t : t === n || t === r ? al(t) : t;
	}, Yt = function(e, t) {
		return e === t || _(e) !== null ? !1 : (Ue && Ot(e), !0);
	}, Xt = function(e, n) {
		if (Pt(e), Gt(M.beforeSanitizeElements, e, null), Yt(e, n)) return !0;
		if (Ht(e)) return Ct(e), !0;
		let r = ft(w(e));
		if (P = I(M.uponSanitizeElement, P, ve, Ne), Gt(M.uponSanitizeElement, e, {
			tagName: r,
			allowedTags: P
		}), Yt(e, n)) return !0;
		if (Kt(e, r)) return Ct(e), !0;
		if (Se[r] || !(we.tagCheck instanceof Function && we.tagCheck(r)) && !P[r]) {
			let t = Jt(e, r, n);
			return t === !1 && (Gt(M.afterSanitizeElements, e, null), Yt(e, n)) ? !0 : t;
		}
		if (C(e) === Fl.element && !St(e) || (r === "noscript" || r === "noembed" || r === "noframes") && el(Nl, e.innerHTML)) return Ct(e), !0;
		if (ke && e.nodeType === Fl.text) {
			let n = zt(e.textContent);
			e.textContent !== n && (Fc(t.removed, { element: e.cloneNode() }), e.textContent = n);
		}
		return Gt(M.afterSanitizeElements, e, null), Yt(e, n);
	}, Zt = function(e, t, r) {
		if (Ce[t] || Ft(t, e) || ze && (t === "id" || t === "name") && (r in n || r in mt)) return !1;
		let i = ye[t] || we.attributeCheck instanceof Function && we.attributeCheck(t, e);
		return Ee && el(pe, t) || Te && el(me, t) ? !0 : i ? Xe[t] || el(N, Gc(r, ge, "")) || (t === "src" || t === "xlink:href" || t === "href") && e !== "script" && Kc(r, "data:") === 0 && Je[e] || De && !el(he, Gc(r, ge, "")) ? !0 : !r : $t(e) && qt(xe.tagNameCheck, e) && qt(xe.attributeNameCheck, t, e) || t === "is" && xe.allowCustomizedBuiltInElements && qt(xe.tagNameCheck, r);
	}, Qt = z({}, [
		"annotation-xml",
		"color-profile",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"missing-glyph"
	]), $t = function(e) {
		return !Qt[Hc(e)] && el(_e, e);
	}, en = function(e, t, n, r) {
		if (E && typeof u == "object" && typeof u.getAttributeType == "function" && !n) switch (u.getAttributeType(e, t)) {
			case "TrustedHTML": return k(r);
			case "TrustedScriptURL": return ie(r);
		}
		return r;
	}, tn = function(e, t, n, r) {
		try {
			return n ? e.setAttributeNS(n, t, r) : e.setAttribute(t, r), !Ht(e) || (Ct(e), !1);
		} catch {
			return F(t, e), !1;
		}
	}, nn = function(e, t) {
		return Ae && el(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, t) ? !0 : Hc(e) === "attributename" && Wc(t, "href") !== null;
	}, rn = function(e, n) {
		if (Gt(M.beforeSanitizeAttributes, e, null), Yt(e, n)) return;
		let r = e.attributes;
		if (!r || Ht(e)) return;
		ye = I(M.uponSanitizeAttribute, ye, be, Pe);
		let i = {
			attrName: "",
			attrValue: "",
			keepAttr: !0,
			allowedAttributes: ye,
			forceKeepAttr: void 0
		}, a = r.length, o = ft(e.nodeName);
		for (; a--;) {
			let n = r[a], s = n.name, c = n.namespaceURI, l = n.value, u = ft(s), d = l, f = s === "value" ? d : qc(d), p = !1;
			i.attrName = u, i.attrValue = f, i.keepAttr = !0, i.forceKeepAttr = void 0, Gt(M.uponSanitizeAttribute, e, i), f = i.attrValue, Be && (u === "id" || u === "name") && Kc(f, Ve) !== 0 && (F(s, e, n), f = Ve + f, p = !0), nn(s, f) ? F(s, e, n) : i.forceKeepAttr || (i.keepAttr ? !Oe && el(Pl, f) ? F(s, e, n) : (ke && (f = zt(f)), Zt(o, u, f) ? (f = en(o, u, c, f), f !== d && tn(e, s, c, f) && p && Pc(t.removed)) : F(s, e, n)) : F(s, e, n));
		}
		Gt(M.afterSanitizeAttributes, e, null), Yt(e, n);
	}, an = function(e) {
		let t = null, n = Rt(e);
		for (Gt(M.beforeSanitizeShadowDOM, e, null); t = n.nextNode();) if (Gt(M.uponSanitizeShadowNode, t, null), Xt(t, e), rn(t, e), Ut(t.content) && an(t.content), C(t) === Fl.element) {
			let e = v(t);
			Ut(e) && (on(e), an(e));
		}
		ke && Vt(e), Gt(M.afterSanitizeShadowDOM, e, null);
	}, on = function(e) {
		let t = [{
			node: e,
			shadow: null
		}];
		for (; t.length > 0;) {
			let e = t.pop();
			if (e.shadow) {
				an(e.shadow);
				continue;
			}
			let n = e.node, r = C(n) === Fl.element, i = g(n);
			if (i) for (let e = i.length - 1; e >= 0; --e) t.push({
				node: i[e],
				shadow: null
			});
			if (r) {
				let e = x ? x(n) : null;
				if (typeof e == "string" && ft(e) === "template") {
					let e = n.content;
					Ut(e) && t.push({
						node: e,
						shadow: null
					});
				}
			}
			if (r) {
				let e = v(n);
				Ut(e) && t.push({
					node: null,
					shadow: e
				}, {
					node: e,
					shadow: null
				});
			}
		}
	};
	return t.sanitize = function(e) {
		let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, i = null, a = null, o = null, s = null;
		if (nt = !e, nt && (e = "<!-->"), typeof e != "string" && !Wt(e) && (e = ol(e), typeof e != "string")) throw tl("dirty is not a string, aborting");
		if (!t.isSupported) return e;
		Me ? (P = Ne, ye = Pe) : gt(n), (M.uponSanitizeElement.length > 0 || M.uponSanitizeAttribute.length > 0) && (P = al(P)), M.uponSanitizeAttribute.length > 0 && (ye = al(ye)), t.removed = [];
		let c = Ue && typeof e != "string" && Wt(e), l = [], u = We;
		if (c) {
			It(e);
			let t = w(e);
			if (typeof t == "string") {
				let n = ft(t);
				if (!P[n] || Se[n]) throw Tt(e), tl("root node is forbidden and cannot be sanitized in-place");
			}
			if (Ht(e)) throw Tt(e), tl("root node is clobbered and cannot be sanitized in-place");
			l = kt(e), We = zc();
		} else if (Wt(e)) i = Lt("<!---->"), a = i.ownerDocument.importNode(e, !0), a.nodeType === Fl.element && a.nodeName === "BODY" || a.nodeName === "HTML" ? i = a : i.appendChild(a), on(i);
		else {
			if (!Ie && !ke && !je && e.indexOf("<") === -1) return E && Re ? k(e) : e;
			if (i = Lt(e), !i) return Ie ? null : Re ? D : "";
		}
		i && Fe && Ct(i.firstChild);
		let d = c ? e : i;
		try {
			c && on(e);
			let t = Rt(d);
			for (; o = t.nextNode();) Xt(o, d), rn(o, d), Ut(o.content) && an(o.content);
			c && Mt(e, l);
		} catch (t) {
			throw c && (Tt(e), jt(e, l)), t;
		} finally {
			We = u;
		}
		if (c) {
			if (jt(e, l)) throw tl("a node selected for removal could not be safely returned; refusing to sanitize in place");
			return ke && Bt(e), e;
		}
		if (Ie) {
			if (ke && Bt(i), Le) for (s = se.call(i.ownerDocument); i.firstChild;) s.appendChild(i.firstChild);
			else s = i;
			return (ye.shadowroot || ye.shadowrootmode) && (s = le.call(r, s, !0)), s;
		}
		let f = je ? i.outerHTML : i.innerHTML;
		return je && P["!doctype"] && i.ownerDocument && i.ownerDocument.doctype && i.ownerDocument.doctype.name && el(kl, i.ownerDocument.doctype.name) && (f = "<!DOCTYPE " + i.ownerDocument.doctype.name + ">\n" + f), ke && (f = zt(f)), E && Re ? k(f) : f;
	}, t.setConfig = function() {
		let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		gt(e), Me = !0, Ne = P, Pe = ye;
	}, t.clearConfig = function() {
		pt = null, Me = !1, Ne = null, Pe = null, E = te, D = "";
	}, t.isValidAttribute = function(e, t, n) {
		pt || gt({});
		let r = ft(e), i = ft(t);
		return typeof n == "string" && (nn(t, n) || !Oe && el(Pl, n)) ? !1 : Zt(r, i, n);
	}, t.addHook = function(e, t) {
		typeof t == "function" && Qc(M, e) && Fc(M[e], t);
	}, t.removeHook = function(e, t) {
		if (Qc(M, e)) {
			if (t !== void 0) {
				let n = Nc(M[e], t);
				return n === -1 ? void 0 : Lc(M[e], n, 1)[0];
			}
			return Pc(M[e]);
		}
	}, t.removeHooks = function(e) {
		Qc(M, e) && (M[e] = []);
	}, t.removeAllHooks = function() {
		M = zl();
	}, t;
}
var Ul = Hl();
//#endregion
//#region node_modules/marked/lib/marked.esm.js
function Wl() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var Gl = Wl();
function Kl(e) {
	Gl = e;
}
var ql = { exec: () => null };
function Jl(e) {
	let t = [];
	return (n) => {
		let r = Math.max(0, Math.min(3, n - 1)), i = t[r];
		return i || (i = e(r), t[r] = i), i;
	};
}
function B(e, t = "") {
	let n = typeof e == "string" ? e : e.source, r = {
		replace: (e, t) => {
			let i = typeof t == "string" ? t : t.source;
			return i = i.replace(Xl.caret, "$1"), n = n.replace(e, i), r;
		},
		getRegex: () => new RegExp(n, t)
	};
	return r;
}
var Yl = ((e = "") => {
	try {
		return !!RegExp("(?<=1)(?<!1)" + e);
	} catch {
		return !1;
	}
})(), Xl = {
	codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	endingSpaceTabChar: /[ \t]$/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	leadingSpaceTab: /^[ \t]+/,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/,
	numericCharacterReferenceOrAmpersand: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: Jl((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: Jl((e) => RegExp(`^ {0,${e}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),
	fencesBeginRegex: Jl((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: Jl((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: Jl((e) => RegExp(`^ {0,${e}}(?:</?(?:${du})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`, "i")),
	blockquoteBeginRegex: Jl((e) => RegExp(`^ {0,${e}}>`))
}, Zl = /^(?:[ \t]*(?:\n|$))+/, Ql = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, $l = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, eu = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, tu = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, nu = / {0,3}(?:[*+-]|\d{1,9}[.)])/, ru = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, iu = B(ru).replace(/bull/g, nu).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), au = B(ru).replace(/bull/g, nu).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), ou = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/, su = /^[^\n]+/, cu = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, lu = B(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", cu).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), uu = B(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, nu).getRegex(), du = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", fu = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, pu = B("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", fu).replace("tag", du).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), mu = (e) => B(ou).replace("hr", eu).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", e).replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", du).getRegex(), hu = mu(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/), gu = mu(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/), _u = {
	blockquote: B(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", gu).getRegex(),
	code: Ql,
	def: lu,
	fences: $l,
	heading: tu,
	hr: eu,
	html: pu,
	lheading: iu,
	list: uu,
	newline: Zl,
	paragraph: hu,
	table: ql,
	text: su
}, vu = B("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", eu).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", du).getRegex(), yu = {
	..._u,
	lheading: au,
	table: vu,
	paragraph: B(ou).replace("hr", eu).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", vu).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", du).getRegex()
}, bu = {
	..._u,
	html: B("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", fu).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: ql,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: B(ou).replace("hr", eu).replace("heading", " *#{1,6} *[^\n]").replace("lheading", iu).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, xu = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Su = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Cu = /^( {2,}|\\)\n(?!\s*$)[ \t]*/, wu = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, V = /[\p{P}\p{S}]/u, Tu = /[\s\p{P}\p{S}]/u, Eu = /[^\s\p{P}\p{S}]/u, Du = B(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Tu).getRegex(), Ou = /[\p{Pi}\p{Ps}"']/u, ku = /(?!~)[\p{P}\p{S}]/u, Au = /(?!~)[\s\p{P}\p{S}]/u, ju = /(?:[^\s\p{P}\p{S}]|~)/u, Mu = B(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Yl ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), Nu = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, Pu = B(Nu, "u").replace(/punct/g, V).getRegex(), Fu = B(Nu, "u").replace(/punct/g, ku).getRegex(), Iu = B(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/, "u").replace(/openQuote/g, Ou).replace(/punct/g, V).getRegex(), Lu = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Ru = B(Lu, "gu").replace(/notPunctSpace/g, Eu).replace(/punctSpace/g, Tu).replace(/punct/g, V).getRegex(), zu = B(Lu, "gu").replace(/notPunctSpace/g, ju).replace(/punctSpace/g, Au).replace(/punct/g, ku).getRegex(), Bu = B("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Eu).replace(/punctSpace/g, Tu).replace(/punct/g, V).getRegex(), Vu = B("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Eu).replace(/punctSpace/g, Tu).replace(/punct/g, V).getRegex(), Hu = B("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Eu).replace(/punctSpace/g, Tu).replace(/punct/g, V).getRegex(), Uu = B(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, V).getRegex(), Wu = B("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Eu).replace(/punctSpace/g, Tu).replace(/punct/g, V).getRegex(), Gu = B(/\\(punct)/, "gu").replace(/punct/g, V).getRegex(), Ku = B(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/, "gu").replace(/punct/g, V).getRegex(), qu = B(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ju = B(fu).replace("(?:-->|$)", "-->").getRegex(), Yu = B("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ju).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Xu = /\[(?:\\[\s\S]|[^\[\]\\])*\]/, Zu = B(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets", Xu).getRegex(), Qu = B(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace("label", Zu).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), $u = B(/^!?\[(label)\]\[(ref)\]/).replace("label", Zu).replace("ref", cu).getRegex(), ed = B(/^!?\[(ref)\](?:\[\])?/).replace("ref", cu).getRegex(), td = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/, nd = B(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets", Xu).getRegex(), rd = B("reflink|nolink(?!\\()", "g").replace("reflink", B(/^!?\[(label)\]\[(ref)\]/).replace("label", nd).replace("ref", td).getRegex()).replace("nolink", B(/^!?\[(ref)\](?:\[\])?/).replace("ref", td).getRegex()).getRegex(), H = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, id = B(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g, /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(), U = {
	_backpedal: ql,
	anyPunctuation: Gu,
	anyPunctuationOutsideCode: Ku,
	autolink: qu,
	blockSkip: Mu,
	br: Cu,
	code: Su,
	del: ql,
	delLDelim: ql,
	delRDelim: ql,
	emStrongLDelim: Pu,
	emStrongRDelimAst: Ru,
	emStrongRDelimUnd: Vu,
	escape: xu,
	link: Qu,
	nolink: ed,
	punctuation: Du,
	reflink: $u,
	reflinkSearch: rd,
	tag: Yu,
	text: wu,
	url: ql
}, W = {
	...U,
	emStrongLDelim: Iu,
	emStrongRDelimAst: Bu,
	emStrongRDelimUnd: Hu,
	link: B(/^!?\[(label)\]\((.*?)\)/).replace("label", Zu).getRegex(),
	reflink: B(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Zu).getRegex()
}, G = {
	...U,
	emStrongRDelimAst: zu,
	emStrongLDelim: Fu,
	delLDelim: Uu,
	delRDelim: Wu,
	url: B(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol", id).replace("protocol", H).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: B(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol", H).replace(/emailProtocol/g, /(?:mailto|xmpp):/).getRegex()
}, ad = {
	...G,
	br: B(Cu).replace("{2,}", "*").getRegex(),
	text: B(G.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, od = {
	normal: _u,
	gfm: yu,
	pedantic: bu
}, sd = {
	normal: U,
	gfm: G,
	breaks: ad,
	pedantic: W
}, cd = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, ld = (e) => cd[e];
function K(e, t) {
	if (t) {
		if (Xl.escapeTest.test(e)) return e.replace(Xl.escapeReplace, ld);
	} else if (Xl.escapeTestNoEncode.test(e)) return e.replace(Xl.escapeReplaceNoEncode, ld);
	return e;
}
function ud(e) {
	return Xl.numericCharacterReference.test(e) ? e.replace(Xl.numericCharacterReferenceOrAmpersand, (e, t, n) => {
		if (t === void 0 && n === void 0) return "&amp;";
		let r = t === void 0 ? Number.parseInt(n, 16) : Number.parseInt(t, 10);
		return r === 0 || r > 1114111 || r >= 55296 && r <= 57343 ? "�" : r === 38 ? "&amp;" : String.fromCodePoint(r);
	}) : e;
}
function dd(e) {
	try {
		e = encodeURI(e).replace(Xl.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function fd(e, t) {
	let n = e.replace(Xl.findPipe, (e, t, n) => {
		let r = !1, i = t;
		for (; --i >= 0 && n[i] === "\\";) r = !r;
		return r ? "|" : " |";
	}).split(Xl.splitPipe), r = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t) {
		if (n.length > t) n.splice(t);
		else for (; n.length < t;) n.push("");
	}
	for (; r < n.length; r++) n[r] = n[r].trim().replace(Xl.slashPipe, "|");
	return n;
}
function pd(e, t, n) {
	let r = e.length;
	if (r === 0) return "";
	let i = 0;
	for (; i < r;) {
		let a = e.charAt(r - i - 1);
		if (a === t && !n) i++;
		else if (a !== t && n) i++;
		else break;
	}
	return e.slice(0, r - i);
}
function md(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && Xl.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function hd(e) {
	return e.trim().toLowerCase().toUpperCase().toLowerCase();
}
function gd(e, t) {
	if (e.indexOf(t[0]) === -1 && e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function _d(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function vd(e, t, n, r, i) {
	let a = t.href, o = t.title || null, s = e[1].replace(i.other.outputLinkReplace, "$1"), c = e[0].charAt(0) === "!", l = r.state.inLink, u = r.state.linkEmitted, d = r.state.inRawBlock;
	r.state.inLink = !0, r.state.linkEmitted = !1;
	let f = r.inlineTokens(s), p = r.state.linkEmitted;
	if (r.state.linkEmitted = u, r.state.inLink = l, !c) {
		if (p) {
			r.state.inRawBlock = d;
			return;
		}
		r.state.linkEmitted = !0;
	}
	return {
		type: c ? "image" : "link",
		raw: n,
		href: a,
		title: o,
		text: s,
		tokens: f
	};
}
function yd(e, t, n) {
	let r = e.match(n.other.indentCodeCompensation);
	if (r === null) return t;
	let i = r[1];
	return t.split("\n").map((e) => {
		let t = e.match(n.other.beginningSpace);
		if (t === null) return e;
		let [r] = t;
		return e.slice(Math.min(r.length, i.length));
	}).join("\n");
}
function bd(e, t, n, r) {
	if (!t.includes("<")) return !1;
	for (let i = 0; i < t.length; i++) {
		if (t[i] === "\\") {
			i++;
			continue;
		}
		if (t[i] === "`") {
			let e = r.inline.code.exec(t.slice(i));
			if (e) {
				i += e[0].length - 1;
				continue;
			}
		}
		if (t[i] !== "<") continue;
		let a = e.slice(n + i), o = r.inline.tag.exec(a) || r.inline.autolink.exec(a);
		if (o) {
			if (o[0].length > t.length - i) return !0;
			i += o[0].length - 1;
		}
	}
	return !1;
}
var xd = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || Gl;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let e = this.options.pedantic ? t[0] : md(t[0]);
			return {
				type: "code",
				raw: e,
				codeBlockStyle: "indented",
				text: e.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let e = t[0], n = yd(e, t[3] || "", this.rules);
			return {
				type: "code",
				raw: e,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: n
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let e = t[2].trim();
			if (this.rules.other.endingHash.test(e)) {
				let t = pd(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceTabChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: pd(t[0], "\n"),
				depth: t[1].length,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: pd(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = pd(t[0], "\n").split("\n"), n = "", r = "", i = [];
			for (; e.length > 0;) {
				let t = !1, a = [], o = 0;
				for (; o < e.length; o++) if (this.rules.other.blockquoteStart.test(e[o])) a.push(e[o]), t = !0;
				else if (!t) a.push(e[o]);
				else break;
				e = e.slice(o);
				let s = a.join("\n"), c = s.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
				n = n ? `${n}
${s}` : s, r = r ? `${r}
${c}` : c;
				let l = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = l, e.length === 0) break;
				let u = i.at(-1);
				if (u?.type === "code" || u?.type === "heading" || u?.type === "hr" || u?.type === "html") break;
				if (u?.type === "blockquote") {
					let t = u, a = e.join("\n"), o = t.raw + "\n" + a.replace(this.rules.other.blockquoteSetextReplace2, ""), s = this.blockquote(o);
					i[i.length - 1] = s;
					let c = o.substring(s.raw.length).replace(/^\n/, ""), l = c ? c.split("\n").length : 0, d = l ? e.slice(0, -l) : e;
					d.length > 0 && (n = `${n}
${d.join("\n")}`), r = r.substring(0, r.length - t.text.length) + s.text;
					break;
				}
				if (u?.type === "list") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.list(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - u.raw.length) + o.raw, r = r.substring(0, r.length - t.raw.length) + o.raw, e = a.substring(i.at(-1).raw.length).split("\n");
				}
			}
			return {
				type: "blockquote",
				raw: n,
				tokens: i,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = e, r = () => n.length - e.length, i = t[1].trim(), a = i.length > 1, o = {
				type: "list",
				raw: "",
				ordered: a,
				start: a ? +i.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			i = a ? `\\d{1,9}\\${i.slice(-1)}` : `\\${i}`, this.options.pedantic && (i = a ? i : "[*+-]");
			let s = this.rules.other.listItemRegex(i), c = !1;
			for (; e;) {
				let i = !1, a = "";
				if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
				let l = r();
				e = e.substring(t[0].length);
				let u = t[2].split("\n", 1)[0], d = t[1].length, f = this.options.pedantic ? _d(u, d) : u.replace(this.rules.other.leadingSpaceTab, (e) => _d(e, d)), p = e.split("\n", 1)[0], m = !f.trim(), h = 0;
				if (this.options.pedantic ? (h = 2, a = f.trimStart()) : m ? h = d + 1 : (h = f.search(this.rules.other.nonSpaceChar), h = h > 4 ? 1 : h, a = f.slice(h), h += d), m && this.rules.other.blankLine.test(p) && (e = e.substring(p.length + 1), i = !0), !i) {
					let t = this.rules.other.nextBulletRegex(h), n = this.rules.other.hrRegex(h), r = this.rules.other.fencesBeginRegex(h), i = this.rules.other.headingBeginRegex(h), o = this.rules.other.htmlBeginRegex(h), s = this.rules.other.blockquoteBeginRegex(h);
					for (; e;) {
						let c = e.split("\n", 1)[0], l;
						if (p = c, this.options.pedantic ? (p = p.replace(this.rules.other.listReplaceNesting, "  "), l = p) : l = p.replace(this.rules.other.leadingSpaceTab, (e) => _d(e)), r.test(p) || i.test(p) || o.test(p) || s.test(p) || t.test(p) || n.test(p)) break;
						if (l.search(this.rules.other.nonSpaceChar) >= h || !p.trim()) a += "\n" + l.slice(h);
						else {
							if (m || f.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || r.test(f) || i.test(f) || n.test(f)) break;
							a += "\n" + p;
						}
						m = !p.trim(), e = e.substring(c.length + 1), f = l.slice(h);
					}
				}
				let g = n.slice(l, r());
				o.loose || (c ? o.loose = !0 : this.rules.other.doubleBlankLine.test(g) && (c = !0)), o.items.push({
					type: "list_item",
					raw: g,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(a),
					loose: !1,
					text: a,
					tokens: []
				});
			}
			let l = o.items.at(-1);
			if (l) l.raw = l.raw.trimEnd(), l.text = l.text.trimEnd();
			else return;
			o.raw = n.slice(0, r()).trimEnd();
			for (let e of o.items) if (this.lexer.state.top = !1, e.tokens = this.lexer.blockTokens(e.text, []), !o.loose) {
				let t = e.tokens.filter((e) => e.type === "space");
				o.loose = t.length > 0 && t.some((e) => this.rules.other.anyLine.test(e.raw));
			}
			for (let e of o.items) {
				let t = e.tokens[0];
				if (e.task && (t?.type === "text" || t?.type === "paragraph")) {
					e.text = e.text.replace(this.rules.other.listReplaceTask, ""), t.raw = t.raw.replace(this.rules.other.listReplaceTask, ""), t.text = t.text.replace(this.rules.other.listReplaceTask, "");
					for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)) {
						this.lexer.inlineQueue[e].src = this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask, "");
						break;
					}
					let n = this.rules.other.listTaskCheckbox.exec(e.raw);
					if (n) {
						let t = {
							type: "checkbox",
							raw: n[0] + " ",
							checked: n[0] !== "[ ]"
						};
						e.checked = t.checked, o.loose ? e.tokens[0] && ["paragraph", "text"].includes(e.tokens[0].type) && "tokens" in e.tokens[0] && e.tokens[0].tokens ? (e.tokens[0].raw = t.raw + e.tokens[0].raw, e.tokens[0].text = t.raw + e.tokens[0].text, e.tokens[0].tokens.unshift(t)) : e.tokens.unshift({
							type: "paragraph",
							raw: t.raw,
							text: t.raw,
							tokens: [t]
						}) : e.tokens.unshift(t);
					}
				} else e.task &&= !1;
			}
			if (o.loose) for (let e of o.items) {
				e.loose = !0;
				for (let t of e.tokens) t.type === "text" && (t.type = "paragraph");
			}
			return o;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) {
			let e = md(t[0]);
			return {
				type: "html",
				block: !0,
				raw: e,
				pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
				text: e
			};
		}
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			if (!this.rules.other.startAngleBracket.test(t[2]) && gd(t[2], "()") !== -1) return;
			let e = hd(t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), n = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: e,
				raw: pd(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = fd(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: pd(t[0], "\n"),
			header: [],
			align: [],
			rows: []
		};
		if (n.length === r.length) {
			for (let e of r) this.rules.other.tableAlignRight.test(e) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(e) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(e) ? a.align.push("left") : a.align.push(null);
			for (let e = 0; e < n.length; e++) a.header.push({
				text: n[e],
				tokens: this.lexer.inline(n[e]),
				header: !0,
				align: a.align[e]
			});
			for (let e of i) a.rows.push(fd(e, a.header.length).map((e, t) => ({
				text: e,
				tokens: this.lexer.inline(e),
				header: !1,
				align: a.align[t]
			})));
			return a;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) {
			let e = t[1].trim();
			return {
				type: "heading",
				raw: pd(t[0], "\n"),
				depth: t[2].charAt(0) === "=" ? 1 : 2,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let e = t[1].charAt(t[1].length - 1) === "\n" ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		if (this.lexer.state.linkParenPossible === !1) return;
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let n = t[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && bd(e, t[1], n, this.rules)) return;
			let r = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(r)) {
				if (!this.rules.other.endAngleBracket.test(r)) return;
				let e = pd(r.slice(0, -1), "\\");
				if ((r.length - e.length) % 2 == 0) return;
			} else {
				let e = gd(t[2], "()");
				if (e === -2) return;
				if (e > -1) {
					let n = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + e;
					t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "";
				}
			}
			let i = t[2], a = "";
			if (this.options.pedantic) {
				let e = this.rules.other.pedanticHrefTitle.exec(i);
				e && (i = e[1], a = e[3]);
			} else a = t[3] ? t[3].slice(1, -1) : "";
			return i = i.trim(), this.rules.other.startAngleBracket.test(i) && (i = this.options.pedantic && !this.rules.other.endAngleBracket.test(r) ? i.slice(1) : i.slice(1, -1)), vd(t, {
				href: i && i.replace(this.rules.inline.anyPunctuation, "$1"),
				title: a && a.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let r = n[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && bd(e, n[1], r, this.rules)) return;
			let i = t[hd((n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "))];
			if (!i) {
				let e = n[0].charAt(0);
				return {
					type: "text",
					raw: e,
					text: e
				};
			}
			return vd(n, i, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let r = this.rules.inline.emStrongLDelim.exec(e);
		if (!(!r || !r[1] && !r[2] && !r[3] && !r[4] || r[4] && n.match(this.rules.other.unicodeAlphaNumeric)) && (!(r[1] || r[3]) || !n || this.rules.inline.punctuation.exec(n))) {
			let i = [...r[0]].length - 1, a, o, s = i, c = 0, l = r[0][0], u = n === l, d = l === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (d.lastIndex = 0, t = t.slice(-1 * e.length + i); (r = d.exec(t)) !== null;) {
				if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
				if (o = [...a].length, r[3] || r[4]) {
					s += o;
					continue;
				}
				if (r[5] || r[6]) {
					if (i % 3 && !((i + o) % 3)) {
						c += o;
						continue;
					}
					if (u) break;
				}
				if (s -= o, s > 0) continue;
				o = Math.min(o, o + s + c);
				let t = [...r[0]][0].length, n = e.slice(0, i + r.index + t + o);
				if (Math.min(i, o) % 2) {
					let e = n.slice(1, -1);
					return {
						type: "em",
						raw: n,
						text: e,
						tokens: this.lexer.inlineTokens(e)
					};
				}
				let l = n.slice(2, -2);
				return {
					type: "strong",
					raw: n,
					text: l,
					tokens: this.lexer.inlineTokens(l)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let e = t[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(e), r = this.rules.other.startingSpaceChar.test(e) && this.rules.other.endingSpaceChar.test(e);
			return n && r && (e = e.substring(1, e.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: e
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e, t, n = "") {
		let r = this.rules.inline.delLDelim.exec(e);
		if (r && (!r[1] || !n || this.rules.inline.punctuation.exec(n))) {
			let n = [...r[0]].length - 1, i, a, o = n, s = this.rules.inline.delRDelim;
			for (s.lastIndex = 0, t = t.slice(-1 * e.length + n); (r = s.exec(t)) !== null;) {
				if (i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !i || (a = [...i].length, a !== n)) continue;
				if (r[3] || r[4]) {
					o += a;
					continue;
				}
				if (o -= a, o > 0) continue;
				a = Math.min(a, a + o);
				let t = [...r[0]][0].length, s = e.slice(0, n + r.index + t + a), c = s.slice(n, -n);
				return {
					type: "del",
					raw: s,
					text: c,
					tokens: this.lexer.inlineTokens(c)
				};
			}
		}
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let e, n;
			return t[2] === "@" ? (e = t[1], n = "mailto:" + e) : (e = t[1], n = e), {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let e, n;
			if (t[2] === "@") e = t[0], n = "mailto:" + e;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				e = t[0], n = t[1] === "www." ? "http://" + t[0] : t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let e = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: e ? t[0] : ud(t[0]),
				escaped: e
			};
		}
	}
}, Sd = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || Gl, this.options.tokenizer = this.options.tokenizer || new xd(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			linkEmitted: !1,
			linkParenPossible: !0,
			top: !0
		};
		let t = {
			other: Xl,
			block: od.normal,
			inline: sd.normal
		};
		this.options.pedantic ? (t.block = od.pedantic, t.inline = sd.pedantic) : this.options.gfm && (t.block = od.gfm, t.inline = this.options.breaks ? sd.breaks : sd.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: od,
			inline: sd
		};
	}
	static lex(t, n) {
		return new e(n).lex(t);
	}
	static lexInline(t, n) {
		return new e(n).inlineTokens(t);
	}
	lex(e) {
		e = e.replace(Xl.carriageReturn, "\n"), this.blockTokens(e, this.tokens);
		for (let e = 0; e < this.inlineQueue.length; e++) {
			let t = this.inlineQueue[e];
			this.inlineTokens(t.src, t.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(Xl.tabCharGlobal, "    ").replace(Xl.spaceLine, ""));
		let r = 1 / 0;
		for (; e;) {
			if (e.length < r) r = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			let i;
			if (this.options.extensions?.block?.some((n) => (i = n.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), !0) : !1)) continue;
			if (i = this.tokenizer.space(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				i.raw.length === 1 && n !== void 0 ? n.raw += "\n" : t.push(i);
				continue;
			}
			if (i = this.tokenizer.code(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.at(-1).src = n.text) : t.push(i);
				continue;
			}
			if ((i = this.tokenizer.fences(e)) || (i = this.tokenizer.heading(e)) || (i = this.tokenizer.hr(e)) || (i = this.tokenizer.blockquote(e)) || (i = this.tokenizer.list(e)) || (i = this.tokenizer.html(e))) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.def(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.raw, this.inlineQueue.at(-1).src = n.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = {
					href: i.href,
					title: i.title
				}, t.push(i));
				continue;
			}
			if ((i = this.tokenizer.table(e)) || (i = this.tokenizer.lheading(e))) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			let a = e;
			if (this.options.extensions?.startBlock) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startBlock.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (a = e.substring(0, t + 1));
			}
			if (this.state.top && (i = this.tokenizer.paragraph(a))) {
				let r = t.at(-1);
				n && r?.type === "paragraph" ? (r.raw += (r.raw.endsWith("\n") ? "" : "\n") + i.raw, r.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = r.text) : t.push(i), n = a.length !== e.length, e = e.substring(i.raw.length);
			} else if (i = this.tokenizer.text(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n.text) : t.push(i);
			} else if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	linkInText(e) {
		if (!e.includes("[")) return !1;
		let t = this.tokenizer.rules.inline.link;
		for (let n of e.matchAll(this.tokenizer.rules.inline.blockSkip)) if (t.test(n[0]) && e.charAt(n.index - 1) !== "!") return !0;
		for (let t of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
			let e = t[0], n = e.lastIndexOf("[");
			if (e.charAt(0) !== "!" && Object.hasOwn(this.tokens.links, hd(e.slice(n + 1, -1))) && !(n > 1 && this.linkInText(e.slice(1, n - 1)))) return !0;
		}
		return !1;
	}
	inlineTokens(e, t = []) {
		this.tokenizer.lexer = this;
		let n = this.state.linkParenPossible;
		this.state.linkParenPossible = n && e.includes(")");
		try {
			return this.#e(e, t);
		} finally {
			this.state.linkParenPossible = n;
		}
	}
	#e(e, t) {
		let n = e;
		if (this.tokens.links && e.includes("[")) {
			let e = this.tokenizer.rules.inline.reflinkSearch, t = (n) => {
				let r = n.lastIndexOf("[");
				if (!Object.hasOwn(this.tokens.links, hd(n.slice(r + 1, -1)))) return n;
				if (r > 1 && n.charAt(0) !== "!") {
					let i = n.slice(1, r - 1);
					if (this.linkInText(i)) return "[" + i.replace(e, t) + "][" + "a".repeat(n.length - r - 2) + "]";
				}
				return "[" + "a".repeat(n.length - 2) + "]";
			};
			n = n.replace(e, t);
		}
		n = n.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode, (e, t, n) => n ? "+".repeat(e.length) : t ? t + e.slice(t.length, -t.length).replace(/`/g, "+") + t : e), n = n.replace(this.tokenizer.rules.inline.blockSkip, (e, t, n) => {
			let r = n ? n.length : 0;
			return e.slice(0, r) + "[" + "a".repeat(e.length - r - 2) + "]";
		}), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let r = !1, i = "", a = 1 / 0;
		for (; e;) {
			if (e.length < a) a = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			r || (i = ""), r = !1;
			let o;
			if (this.options.extensions?.inline?.some((n) => (o = n.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
			if ((o = this.tokenizer.escape(e)) || (o = this.tokenizer.tag(e)) || (o = this.tokenizer.link(e))) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(o.raw.length);
				let n = t.at(-1);
				o.type === "text" && n?.type === "text" ? (n.raw += o.raw, n.text += o.text) : t.push(o);
				continue;
			}
			if ((o = this.tokenizer.emStrong(e, n, i)) || (o = this.tokenizer.codespan(e)) || (o = this.tokenizer.br(e)) || (o = this.tokenizer.del(e, n, i)) || (o = this.tokenizer.autolink(e)) || !this.state.inLink && (o = this.tokenizer.url(e))) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			let s = e;
			if (this.options.extensions?.startInline) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startInline.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (s = e.substring(0, t + 1));
			}
			if (o = this.tokenizer.inlineText(s)) {
				e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (i = o.raw.slice(-1)), r = !0;
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += o.raw, n.text += o.text) : t.push(o);
			} else if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(e) {
		let t = "Infinite loop on byte: " + e;
		if (this.options.silent) console.error(t);
		else throw Error(t);
	}
}, Cd = class {
	options;
	parser;
	constructor(e) {
		this.options = e || Gl;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(Xl.notSpaceStart)?.[0], i = e ? e.replace(Xl.endingNewline, "") + "\n" : "";
		return r ? "<pre><code class=\"language-" + K(r) + "\">" + (n ? i : K(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : K(i, !0)) + "</code></pre>\n";
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return "<hr>\n";
	}
	list(e) {
		let t = e.ordered, n = e.start, r = "";
		for (let t = 0; t < e.items.length; t++) {
			let n = e.items[t];
			r += this.listitem(n);
		}
		let i = t ? "ol" : "ul", a = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + i + a + ">\n" + r + "</" + i + ">\n";
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let t = 0; t < e.header.length; t++) n += this.tablecell(e.header[t]);
		t += this.tablerow({ text: n });
		let r = "";
		for (let t = 0; t < e.rows.length; t++) {
			let i = e.rows[t];
			n = "";
			for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
			r += this.tablerow({ text: n });
		}
		return r &&= `<tbody>${r}</tbody>`, "<table>\n<thead>\n" + t + "</thead>\n" + r + "</table>\n";
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${K(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, text: n, tokens: r, autolink: i }) {
		let a = i ? K(n, !0) : this.parser.parseInline(r), o = dd(e);
		if (o === null) return a;
		e = K(o, i);
		let s = "<a href=\"" + e + "\"";
		return t && (s += " title=\"" + K(t) + "\""), s += ">" + a + "</a>", s;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = dd(e);
		if (i === null) return K(n);
		e = i;
		let a = `<img src="${K(e)}" alt="${K(n)}"`;
		return t && (a += ` title="${K(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : K(e.text);
	}
}, wd = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
}, Td = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || Gl, this.options.renderer = this.options.renderer || new Cd(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new wd();
	}
	static parse(t, n) {
		return new e(n).parse(t);
	}
	static parseInline(t, n) {
		return new e(n).parseInline(t);
	}
	parse(e) {
		this.renderer.parser = this;
		let t = "";
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (this.options.extensions?.renderers?.[r.type]) {
				let e = r, n = this.options.extensions.renderers[e.type].call({ parser: this }, e);
				if (n !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"checkbox",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(e.type)) {
					t += n || "";
					continue;
				}
			}
			let i = r;
			switch (i.type) {
				case "space":
					t += this.renderer.space(i);
					break;
				case "hr":
					t += this.renderer.hr(i);
					break;
				case "heading":
					t += this.renderer.heading(i);
					break;
				case "code":
					t += this.renderer.code(i);
					break;
				case "table":
					t += this.renderer.table(i);
					break;
				case "blockquote":
					t += this.renderer.blockquote(i);
					break;
				case "list":
					t += this.renderer.list(i);
					break;
				case "checkbox":
					t += this.renderer.checkbox(i);
					break;
				case "html":
					t += this.renderer.html(i);
					break;
				case "def":
					t += this.renderer.def(i);
					break;
				case "paragraph":
					t += this.renderer.paragraph(i);
					break;
				case "text":
					t += this.renderer.text(i);
					break;
				default: {
					let e = "Token with \"" + i.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return t;
	}
	parseInline(e, t = this.renderer) {
		this.renderer.parser = this;
		let n = "";
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.options.extensions?.renderers?.[i.type]) {
				let e = this.options.extensions.renderers[i.type].call({ parser: this }, i);
				if (e !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"checkbox",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(i.type)) {
					n += e || "";
					continue;
				}
			}
			let a = i;
			switch (a.type) {
				case "escape":
					n += t.text(a);
					break;
				case "html":
					n += t.html(a);
					break;
				case "link":
					n += t.link(a);
					break;
				case "image":
					n += t.image(a);
					break;
				case "checkbox":
					n += t.checkbox(a);
					break;
				case "strong":
					n += t.strong(a);
					break;
				case "em":
					n += t.em(a);
					break;
				case "codespan":
					n += t.codespan(a);
					break;
				case "br":
					n += t.br(a);
					break;
				case "del":
					n += t.del(a);
					break;
				case "text":
					n += t.text(a);
					break;
				default: {
					let e = "Token with \"" + a.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return n;
	}
}, Ed = class {
	options;
	block;
	constructor(e) {
		this.options = e || Gl;
	}
	static passThroughHooks = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? Sd.lex : Sd.lexInline;
	}
	provideParser(e = this.block) {
		return e ? Td.parse : Td.parseInline;
	}
};
function Dd(e, t) {
	if (Array.isArray(t)) for (let n = 0; n < t.length; n++) e.push(t[n]);
	else e.push(t);
}
var Od = new class {
	defaults = Wl();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = Td;
	Renderer = Cd;
	TextRenderer = wd;
	Lexer = Sd;
	Tokenizer = xd;
	Hooks = Ed;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let r of e) switch (Dd(n, t.call(this, r)), r.type) {
			case "table": {
				let e = r;
				for (let r of e.header) Dd(n, this.walkTokens(r.tokens, t));
				for (let r of e.rows) for (let e of r) Dd(n, this.walkTokens(e.tokens, t));
				break;
			}
			case "list": {
				let e = r;
				Dd(n, this.walkTokens(e.items, t));
				break;
			}
			default: {
				let e = r;
				this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
					let i = e[r].flat(1 / 0);
					Dd(n, this.walkTokens(i, t));
				}) : e.tokens && Dd(n, this.walkTokens(e.tokens, t));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((e) => {
			let n = { ...e };
			if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e) => {
				if (!e.name) throw Error("extension name required");
				if ("renderer" in e) {
					let n = t.renderers[e.name];
					n ? t.renderers[e.name] = function(...t) {
						let r = e.renderer.apply(this, t);
						return r === !1 && (r = n.apply(this, t)), r;
					} : t.renderers[e.name] = e.renderer;
				}
				if ("tokenizer" in e) {
					if (!e.level || e.level !== "block" && e.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
					let n = t[e.level];
					n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && (e.level === "block" ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : e.level === "inline" && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start]));
				}
				"childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens);
			}), n.extensions = t), e.renderer) {
				let t = this.defaults.renderer || new Cd(this.defaults);
				for (let n in e.renderer) {
					if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
					if (["options", "parser"].includes(n)) continue;
					let r = n, i = e.renderer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n || "";
					};
				}
				n.renderer = t;
			}
			if (e.tokenizer) {
				let t = this.defaults.tokenizer || new xd(this.defaults);
				for (let n in e.tokenizer) {
					if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(n)) continue;
					let r = n, i = e.tokenizer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.tokenizer = t;
			}
			if (e.hooks) {
				let t = this.defaults.hooks || new Ed();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					t[r] = Ed.passThroughHooks.has(n) ? (e) => {
						if (this.defaults.async && Ed.passThroughHooksRespectAsync.has(n)) return (async () => {
							let n = await i.call(t, e);
							return a.call(t, n);
						})();
						let r = i.call(t, e);
						return a.call(t, r);
					} : (...e) => {
						if (this.defaults.async) return (async () => {
							let n = await i.apply(t, e);
							return n === !1 && (n = await a.apply(t, e)), n;
						})();
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.hooks = t;
			}
			if (e.walkTokens) {
				let t = this.defaults.walkTokens, r = e.walkTokens;
				n.walkTokens = function(e) {
					let n = [];
					return n.push(r.call(this, e)), t && Dd(n, t.call(this, e)), n;
				};
			}
			this.defaults = {
				...this.defaults,
				...n
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return Sd.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return Td.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (t, n) => {
			let r = { ...n }, i = {
				...this.defaults,
				...r
			}, a = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && r.async === !1) return a(/* @__PURE__ */ Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof t > "u" || t === null) return a(/* @__PURE__ */ Error("marked(): input parameter is undefined or null"));
			if (typeof t != "string") return a(/* @__PURE__ */ Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? Sd.lex : Sd.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? Td.parse : Td.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? Sd.lex : Sd.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? Td.parse : Td.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + K(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}();
function kd(e, t) {
	return Od.parse(e, t);
}
kd.options = kd.setOptions = function(e) {
	return Od.setOptions(e), kd.defaults = Od.defaults, Kl(kd.defaults), kd;
}, kd.getDefaults = Wl, kd.defaults = Gl;
function Ad(...e) {
	return Od.use(...e), kd.defaults = Od.defaults, Kl(kd.defaults), kd;
}
kd.use = Ad, kd.walkTokens = function(e, t) {
	return Od.walkTokens(e, t);
}, kd.parseInline = Od.parseInline, kd.Parser = Td, kd.parser = Td.parse, kd.Renderer = Cd, kd.TextRenderer = wd, kd.Lexer = Sd, kd.lexer = Sd.lex, kd.Tokenizer = xd, kd.Hooks = Ed, kd.parse = kd, kd.options, kd.setOptions, kd.walkTokens, kd.parseInline, Td.parse, Sd.lex;
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function jd(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = jd(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function Md() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = jd(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/class-variance-authority/dist/index.mjs
var Nd = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, Pd = Md, Fd = (e, t) => (n) => {
	if (t?.variants == null) return Pd(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = Nd(t) || Nd(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return Pd(e, a, t?.compoundVariants?.reduce((e, t) => {
		let { class: n, className: r, ...a } = t;
		return Object.entries(a).every((e) => {
			let [t, n] = e;
			return Array.isArray(n) ? n.includes({
				...i,
				...o
			}[t]) : {
				...i,
				...o
			}[t] === n;
		}) ? [
			...e,
			n,
			r
		] : e;
	}, []), n?.class, n?.className);
}, Id = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, Ld = (e, t) => ({
	classGroupId: e,
	validator: t
}), Rd = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), zd = "-", Bd = [], Vd = "arbitrary..", Hd = (e) => {
	let t = Gd(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return Wd(e);
			let n = e.split(zd);
			return Ud(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? Id(i, t) : t : i || Bd;
			}
			return n[e] || Bd;
		}
	};
}, Ud = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = Ud(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(zd) : e.slice(t).join(zd), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, Wd = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? Vd + r : void 0;
})(), Gd = (e) => {
	let { theme: t, classGroups: n } = e;
	return Kd(n, t);
}, Kd = (e, t) => {
	let n = Rd();
	for (let r in e) {
		let i = e[r];
		qd(i, n, r, t);
	}
	return n;
}, qd = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		Jd(i, t, n, r);
	}
}, Jd = (e, t, n, r) => {
	typeof e == "string" ? Yd(e, t, n) : typeof e == "function" ? Xd(e, t, n, r) : Zd(e, t, n, r);
}, Yd = (e, t, n) => {
	let r = e === "" ? t : Qd(t, e);
	r.classGroupId = n;
}, Xd = (e, t, n, r) => {
	$d(e) ? qd(e(r), t, n, r) : (t.validators === null && (t.validators = []), t.validators.push(Ld(n, e)));
}, Zd = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		qd(o, Qd(t, a), n, r);
	}
}, Qd = (e, t) => {
	let n = e, r = t.split(zd), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = Rd(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, $d = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, ef = (e) => {
	if (e < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let t = 0, n = Object.create(null), r = Object.create(null), i = (i, a) => {
		n[i] = a, t++, t > e && (t = 0, r = n, n = Object.create(null));
	};
	return {
		get(e) {
			let t = n[e];
			if (t !== void 0) return t;
			if ((t = r[e]) !== void 0) return i(e, t), t;
		},
		set(e, t) {
			e in n ? n[e] = t : i(e, t);
		}
	};
}, tf = "!", nf = ":", rf = [], af = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), of = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === nf) {
					t.push(e.slice(i, s)), i = s + 1;
					continue;
				}
				if (o === "/") {
					a = s;
					continue;
				}
			}
			o === "[" ? n++ : o === "]" ? n-- : o === "(" ? r++ : o === ")" && r--;
		}
		let s = t.length === 0 ? e : e.slice(i), c = s, l = !1;
		s.endsWith(tf) ? (c = s.slice(0, -1), l = !0) : s.startsWith(tf) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return af(t, l, c, u);
	};
	if (t) {
		let e = t + nf, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : af(rf, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, sf = (e) => {
	let t = /* @__PURE__ */ new Map();
	return e.orderSensitiveModifiers.forEach((e, n) => {
		t.set(e, 1e6 + n);
	}), (e) => {
		let n = [], r = [];
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = a[0] === "[", s = t.has(a);
			o || s ? (r.length > 0 && (r.sort(), n.push(...r), r = []), n.push(a)) : r.push(a);
		}
		return r.length > 0 && (r.sort(), n.push(...r)), n;
	};
}, cf = (e) => ({
	cache: ef(e.cacheSize),
	parseClassName: of(e),
	sortModifiers: sf(e),
	postfixLookupClassGroupIds: lf(e),
	...Hd(e)
}), lf = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, uf = /\s+/, df = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(uf), l = "";
	for (let e = c.length - 1; e >= 0; --e) {
		let t = c[e], { isExternal: u, modifiers: d, hasImportantModifier: f, baseClassName: p, maybePostfixModifierPosition: m } = n(t);
		if (u) {
			l = t + (l.length > 0 ? " " + l : l);
			continue;
		}
		let h = !!m, g;
		if (h) {
			g = r(p.substring(0, m));
			let e = g && o[g] ? r(p) : void 0;
			e && e !== g && (g = e, h = !1);
		} else g = r(p);
		if (!g) {
			if (!h || (g = r(p), !g)) {
				l = t + (l.length > 0 ? " " + l : l);
				continue;
			}
			h = !1;
		}
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + tf : _, y = v + g;
		if (s.indexOf(y) > -1) continue;
		s.push(y);
		let b = i(g, h);
		for (let e = 0; e < b.length; ++e) {
			let t = b[e];
			s.push(v + t);
		}
		l = t + (l.length > 0 ? " " + l : l);
	}
	return l;
}, ff = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = pf(n)) && (i && (i += " "), i += r);
	return i;
}, pf = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = pf(e[r])) && (n && (n += " "), n += t);
	return n;
}, mf = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = cf(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = df(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(ff(...e));
}, hf = [], gf = (e) => {
	let t = (t) => t[e] || hf;
	return t.isThemeGetter = !0, t.themeKey = e, t;
}, _f = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, q = /^\((?:(\w[\w-]*):)?(.+)\)$/i, vf = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, yf = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, bf = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, xf = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/, Sf = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Cf = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, wf = (e) => vf.test(e), J = (e) => !!e && !Number.isNaN(Number(e)), Tf = (e) => !!e && Number.isInteger(Number(e)), Ef = (e) => e.endsWith("%") && J(e.slice(0, -1)), Df = (e) => yf.test(e), Of = () => !0, kf = (e) => bf.test(e) && !xf.test(e), Af = () => !1, jf = (e) => Sf.test(e), Mf = (e) => Cf.test(e), Nf = (e) => !Y(e) && !X(e), Pf = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), Ff = (e) => Yf(e, $f, Af), Y = (e) => _f.test(e), If = (e) => Yf(e, ep, kf), Lf = (e) => Yf(e, tp, J), Rf = (e) => Yf(e, rp, Of), zf = (e) => Yf(e, np, Af), Bf = (e) => Yf(e, Zf, Af), Vf = (e) => Yf(e, Qf, Mf), Hf = (e) => Yf(e, ip, jf), X = (e) => q.test(e), Z = (e) => Xf(e, ep), Uf = (e) => Xf(e, np), Wf = (e) => Xf(e, Zf), Gf = (e) => Xf(e, $f), Kf = (e) => Xf(e, Qf), qf = (e) => Xf(e, ip, !0), Jf = (e) => Xf(e, rp, !0), Yf = (e, t, n) => {
	let r = _f.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, Xf = (e, t, n = !1) => {
	let r = q.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, Zf = (e) => e === "position" || e === "percentage", Qf = (e) => e === "image" || e === "url", $f = (e) => e === "length" || e === "size" || e === "bg-size", ep = (e) => e === "length", tp = (e) => e === "number", np = (e) => e === "family-name", rp = (e) => e === "number" || e === "weight", ip = (e) => e === "shadow", ap = /*#__PURE__*/ mf(() => {
	let e = gf("color"), t = gf("font"), n = gf("text"), r = gf("font-weight"), i = gf("tracking"), a = gf("leading"), o = gf("breakpoint"), s = gf("container"), c = gf("spacing"), l = gf("radius"), u = gf("shadow"), d = gf("inset-shadow"), f = gf("text-shadow"), p = gf("drop-shadow"), m = gf("blur"), h = gf("perspective"), g = gf("aspect"), _ = gf("ease"), v = gf("animate"), y = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	], b = () => [
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top-left",
		"left-top",
		"top-right",
		"right-top",
		"bottom-right",
		"right-bottom",
		"bottom-left",
		"left-bottom"
	], x = () => [
		...b(),
		X,
		Y
	], S = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], C = () => [
		"auto",
		"contain",
		"none"
	], w = () => [
		X,
		Y,
		c
	], T = () => [
		wf,
		"full",
		"auto",
		...w()
	], ee = () => [
		Tf,
		"none",
		"subgrid",
		X,
		Y
	], E = () => [
		"auto",
		{ span: [
			"full",
			Tf,
			X,
			Y
		] },
		Tf,
		X,
		Y
	], D = () => [
		Tf,
		"auto",
		X,
		Y
	], te = () => [
		"auto",
		"min",
		"max",
		"fr",
		X,
		Y
	], ne = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch",
		"baseline",
		"center-safe",
		"end-safe"
	], O = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], re = () => ["auto", ...w()], k = () => [
		wf,
		"auto",
		"full",
		"dvw",
		"dvh",
		"lvw",
		"lvh",
		"svw",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], ie = () => [
		s,
		wf,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...w()
	], A = () => [
		wf,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], j = () => [
		e,
		X,
		Y
	], ae = () => [
		...b(),
		Wf,
		Bf,
		{ position: [X, Y] }
	], oe = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], se = () => [
		"auto",
		"cover",
		"contain",
		Gf,
		Ff,
		{ size: [X, Y] }
	], ce = () => [
		Ef,
		Z,
		If
	], le = () => [
		"",
		"none",
		"full",
		l,
		X,
		Y
	], M = () => [
		"",
		J,
		Z,
		If
	], ue = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], de = () => [
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
		"luminosity"
	], fe = () => [
		J,
		Ef,
		Wf,
		Bf
	], pe = () => [
		"",
		"none",
		m,
		X,
		Y
	], me = () => [
		"none",
		J,
		X,
		Y
	], he = () => [
		"none",
		J,
		X,
		Y
	], ge = () => [
		J,
		X,
		Y
	], _e = () => [
		wf,
		"full",
		...w()
	];
	return {
		cacheSize: 500,
		theme: {
			animate: [
				"spin",
				"ping",
				"pulse",
				"bounce"
			],
			aspect: ["video"],
			blur: [Df],
			breakpoint: [Df],
			color: [Of],
			container: [Df],
			"drop-shadow": [Df],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [Nf],
			"font-weight": [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black"
			],
			"inset-shadow": [Df],
			leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose"
			],
			perspective: [
				"dramatic",
				"near",
				"normal",
				"midrange",
				"distant",
				"none"
			],
			radius: [Df],
			shadow: [Df],
			spacing: ["px", J],
			text: [Df],
			"text-shadow": [Df],
			tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest"
			]
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				wf,
				Y,
				X,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				X,
				Y
			] }],
			"container-named": [Pf],
			columns: [{ columns: [
				J,
				"auto",
				Y,
				X,
				s
			] }],
			"break-after": [{ "break-after": y() }],
			"break-before": [{ "break-before": y() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
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
				"hidden"
			],
			sr: ["sr-only", "not-sr-only"],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: x() }],
			overflow: [{ overflow: S() }],
			"overflow-x": [{ "overflow-x": S() }],
			"overflow-y": [{ "overflow-y": S() }],
			overscroll: [{ overscroll: C() }],
			"overscroll-x": [{ "overscroll-x": C() }],
			"overscroll-y": [{ "overscroll-y": C() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: T() }],
			"inset-x": [{ "inset-x": T() }],
			"inset-y": [{ "inset-y": T() }],
			start: [{
				"inset-s": T(),
				start: T()
			}],
			end: [{
				"inset-e": T(),
				end: T()
			}],
			"inset-bs": [{ "inset-bs": T() }],
			"inset-be": [{ "inset-be": T() }],
			top: [{ top: T() }],
			right: [{ right: T() }],
			bottom: [{ bottom: T() }],
			left: [{ left: T() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				Tf,
				"auto",
				X,
				Y
			] }],
			basis: [{ basis: [
				wf,
				"full",
				"auto",
				s,
				...w()
			] }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"nowrap",
				"wrap",
				"wrap-reverse"
			] }],
			flex: [{ flex: [
				J,
				wf,
				"auto",
				"initial",
				"none",
				Y
			] }],
			grow: [{ grow: [
				"",
				J,
				X,
				Y
			] }],
			shrink: [{ shrink: [
				"",
				J,
				X,
				Y
			] }],
			order: [{ order: [
				Tf,
				"first",
				"last",
				"none",
				X,
				Y
			] }],
			"grid-cols": [{ "grid-cols": ee() }],
			"col-start-end": [{ col: E() }],
			"col-start": [{ "col-start": D() }],
			"col-end": [{ "col-end": D() }],
			"grid-rows": [{ "grid-rows": ee() }],
			"row-start-end": [{ row: E() }],
			"row-start": [{ "row-start": D() }],
			"row-end": [{ "row-end": D() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": te() }],
			"auto-rows": [{ "auto-rows": te() }],
			gap: [{ gap: w() }],
			"gap-x": [{ "gap-x": w() }],
			"gap-y": [{ "gap-y": w() }],
			"justify-content": [{ justify: [...ne(), "normal"] }],
			"justify-items": [{ "justify-items": [...O(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...O()] }],
			"align-content": [{ content: ["normal", ...ne()] }],
			"align-items": [{ items: [...O(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...O(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": ne() }],
			"place-items": [{ "place-items": [...O(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...O()] }],
			p: [{ p: w() }],
			px: [{ px: w() }],
			py: [{ py: w() }],
			ps: [{ ps: w() }],
			pe: [{ pe: w() }],
			pbs: [{ pbs: w() }],
			pbe: [{ pbe: w() }],
			pt: [{ pt: w() }],
			pr: [{ pr: w() }],
			pb: [{ pb: w() }],
			pl: [{ pl: w() }],
			m: [{ m: re() }],
			mx: [{ mx: re() }],
			my: [{ my: re() }],
			ms: [{ ms: re() }],
			me: [{ me: re() }],
			mbs: [{ mbs: re() }],
			mbe: [{ mbe: re() }],
			mt: [{ mt: re() }],
			mr: [{ mr: re() }],
			mb: [{ mb: re() }],
			ml: [{ ml: re() }],
			"space-x": [{ "space-x": w() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": w() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: k() }],
			"inline-size": [{ inline: ["auto", ...ie()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...ie()] }],
			"max-inline-size": [{ "max-inline": ["none", ...ie()] }],
			"block-size": [{ block: ["auto", ...A()] }],
			"min-block-size": [{ "min-block": ["auto", ...A()] }],
			"max-block-size": [{ "max-block": ["none", ...A()] }],
			w: [{ w: [
				s,
				"screen",
				...k()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...k()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...k()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...k()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...k()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				"none",
				...k()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				Z,
				If
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				Jf,
				Rf
			] }],
			"font-stretch": [{ "font-stretch": [
				"ultra-condensed",
				"extra-condensed",
				"condensed",
				"semi-condensed",
				"normal",
				"semi-expanded",
				"expanded",
				"extra-expanded",
				"ultra-expanded",
				Ef,
				Y
			] }],
			"font-family": [{ font: [
				Uf,
				zf,
				t
			] }],
			"font-features": [{ "font-features": [Y] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				X,
				Y
			] }],
			"line-clamp": [{ "line-clamp": [
				J,
				"none",
				X,
				Lf
			] }],
			leading: [{ leading: [
				"none",
				a,
				...w()
			] }],
			"list-image": [{ "list-image": [
				"none",
				X,
				Y
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				X,
				Y
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: j() }],
			"text-color": [{ text: j() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...ue(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				J,
				"from-font",
				"auto",
				X,
				If
			] }],
			"text-decoration-color": [{ decoration: j() }],
			"underline-offset": [{ "underline-offset": [
				J,
				"auto",
				X,
				Y
			] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: w() }],
			"tab-size": [{ tab: [
				Tf,
				X,
				Y
			] }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				X,
				Y
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			wrap: [{ wrap: [
				"break-word",
				"anywhere",
				"normal"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: [
				"none",
				X,
				Y
			] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: ae() }],
			"bg-repeat": [{ bg: oe() }],
			"bg-size": [{ bg: se() }],
			"bg-image": [{ bg: [
				"none",
				{
					linear: [
						{ to: [
							"t",
							"tr",
							"r",
							"br",
							"b",
							"bl",
							"l",
							"tl"
						] },
						Tf,
						X,
						Y
					],
					radial: [
						"",
						X,
						Y
					],
					conic: [
						"",
						Tf,
						X,
						Y
					]
				},
				Kf,
				Vf
			] }],
			"bg-color": [{ bg: j() }],
			"gradient-from-pos": [{ from: ce() }],
			"gradient-via-pos": [{ via: ce() }],
			"gradient-to-pos": [{ to: ce() }],
			"gradient-from": [{ from: j() }],
			"gradient-via": [{ via: j() }],
			"gradient-to": [{ to: j() }],
			rounded: [{ rounded: le() }],
			"rounded-s": [{ "rounded-s": le() }],
			"rounded-e": [{ "rounded-e": le() }],
			"rounded-t": [{ "rounded-t": le() }],
			"rounded-r": [{ "rounded-r": le() }],
			"rounded-b": [{ "rounded-b": le() }],
			"rounded-l": [{ "rounded-l": le() }],
			"rounded-ss": [{ "rounded-ss": le() }],
			"rounded-se": [{ "rounded-se": le() }],
			"rounded-ee": [{ "rounded-ee": le() }],
			"rounded-es": [{ "rounded-es": le() }],
			"rounded-tl": [{ "rounded-tl": le() }],
			"rounded-tr": [{ "rounded-tr": le() }],
			"rounded-br": [{ "rounded-br": le() }],
			"rounded-bl": [{ "rounded-bl": le() }],
			"border-w": [{ border: M() }],
			"border-w-x": [{ "border-x": M() }],
			"border-w-y": [{ "border-y": M() }],
			"border-w-s": [{ "border-s": M() }],
			"border-w-e": [{ "border-e": M() }],
			"border-w-bs": [{ "border-bs": M() }],
			"border-w-be": [{ "border-be": M() }],
			"border-w-t": [{ "border-t": M() }],
			"border-w-r": [{ "border-r": M() }],
			"border-w-b": [{ "border-b": M() }],
			"border-w-l": [{ "border-l": M() }],
			"divide-x": [{ "divide-x": M() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": M() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...ue(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...ue(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: j() }],
			"border-color-x": [{ "border-x": j() }],
			"border-color-y": [{ "border-y": j() }],
			"border-color-s": [{ "border-s": j() }],
			"border-color-e": [{ "border-e": j() }],
			"border-color-bs": [{ "border-bs": j() }],
			"border-color-be": [{ "border-be": j() }],
			"border-color-t": [{ "border-t": j() }],
			"border-color-r": [{ "border-r": j() }],
			"border-color-b": [{ "border-b": j() }],
			"border-color-l": [{ "border-l": j() }],
			"divide-color": [{ divide: j() }],
			"outline-style": [{ outline: [
				...ue(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				J,
				X,
				Y
			] }],
			"outline-w": [{ outline: [
				"",
				J,
				Z,
				If
			] }],
			"outline-color": [{ outline: j() }],
			shadow: [{ shadow: [
				"",
				"inner",
				"none",
				u,
				qf,
				Hf
			] }],
			"shadow-color": [{ shadow: j() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				qf,
				Hf
			] }],
			"inset-shadow-color": [{ "inset-shadow": j() }],
			"ring-w": [{ ring: M() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: j() }],
			"ring-offset-w": [{ "ring-offset": [J, If] }],
			"ring-offset-color": [{ "ring-offset": j() }],
			"inset-ring-w": [{ "inset-ring": M() }],
			"inset-ring-color": [{ "inset-ring": j() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				qf,
				Hf
			] }],
			"text-shadow-color": [{ "text-shadow": j() }],
			opacity: [{ opacity: [
				J,
				X,
				Y
			] }],
			"mix-blend": [{ "mix-blend": [
				...de(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": de() }],
			"mask-clip": [{ "mask-clip": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }, "mask-no-clip"],
			"mask-composite": [{ mask: [
				"add",
				"subtract",
				"intersect",
				"exclude"
			] }],
			"mask-image-linear-pos": [{ "mask-linear": [J] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": fe() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": fe() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": j() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": j() }],
			"mask-image-t-from-pos": [{ "mask-t-from": fe() }],
			"mask-image-t-to-pos": [{ "mask-t-to": fe() }],
			"mask-image-t-from-color": [{ "mask-t-from": j() }],
			"mask-image-t-to-color": [{ "mask-t-to": j() }],
			"mask-image-r-from-pos": [{ "mask-r-from": fe() }],
			"mask-image-r-to-pos": [{ "mask-r-to": fe() }],
			"mask-image-r-from-color": [{ "mask-r-from": j() }],
			"mask-image-r-to-color": [{ "mask-r-to": j() }],
			"mask-image-b-from-pos": [{ "mask-b-from": fe() }],
			"mask-image-b-to-pos": [{ "mask-b-to": fe() }],
			"mask-image-b-from-color": [{ "mask-b-from": j() }],
			"mask-image-b-to-color": [{ "mask-b-to": j() }],
			"mask-image-l-from-pos": [{ "mask-l-from": fe() }],
			"mask-image-l-to-pos": [{ "mask-l-to": fe() }],
			"mask-image-l-from-color": [{ "mask-l-from": j() }],
			"mask-image-l-to-color": [{ "mask-l-to": j() }],
			"mask-image-x-from-pos": [{ "mask-x-from": fe() }],
			"mask-image-x-to-pos": [{ "mask-x-to": fe() }],
			"mask-image-x-from-color": [{ "mask-x-from": j() }],
			"mask-image-x-to-color": [{ "mask-x-to": j() }],
			"mask-image-y-from-pos": [{ "mask-y-from": fe() }],
			"mask-image-y-to-pos": [{ "mask-y-to": fe() }],
			"mask-image-y-from-color": [{ "mask-y-from": j() }],
			"mask-image-y-to-color": [{ "mask-y-to": j() }],
			"mask-image-radial": [{ "mask-radial": [X, Y] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": fe() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": fe() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": j() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": j() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [J] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": fe() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": fe() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": j() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": j() }],
			"mask-mode": [{ mask: [
				"alpha",
				"luminance",
				"match"
			] }],
			"mask-origin": [{ "mask-origin": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }],
			"mask-position": [{ mask: ae() }],
			"mask-repeat": [{ mask: oe() }],
			"mask-size": [{ mask: se() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				X,
				Y
			] }],
			filter: [{ filter: [
				"",
				"none",
				X,
				Y
			] }],
			blur: [{ blur: pe() }],
			brightness: [{ brightness: [
				J,
				X,
				Y
			] }],
			contrast: [{ contrast: [
				J,
				X,
				Y
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				qf,
				Hf
			] }],
			"drop-shadow-color": [{ "drop-shadow": j() }],
			grayscale: [{ grayscale: [
				"",
				J,
				X,
				Y
			] }],
			"hue-rotate": [{ "hue-rotate": [
				J,
				X,
				Y
			] }],
			invert: [{ invert: [
				"",
				J,
				X,
				Y
			] }],
			saturate: [{ saturate: [
				J,
				X,
				Y
			] }],
			sepia: [{ sepia: [
				"",
				J,
				X,
				Y
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				X,
				Y
			] }],
			"backdrop-blur": [{ "backdrop-blur": pe() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				J,
				X,
				Y
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				J,
				X,
				Y
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				J,
				X,
				Y
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				J,
				X,
				Y
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				J,
				X,
				Y
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				J,
				X,
				Y
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				J,
				X,
				Y
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				J,
				X,
				Y
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": w() }],
			"border-spacing-x": [{ "border-spacing-x": w() }],
			"border-spacing-y": [{ "border-spacing-y": w() }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"",
				"all",
				"colors",
				"opacity",
				"shadow",
				"transform",
				"none",
				X,
				Y
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				J,
				"initial",
				X,
				Y
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				X,
				Y
			] }],
			delay: [{ delay: [
				J,
				X,
				Y
			] }],
			animate: [{ animate: [
				"none",
				v,
				X,
				Y
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				X,
				Y
			] }],
			"perspective-origin": [{ "perspective-origin": x() }],
			rotate: [{ rotate: me() }],
			"rotate-x": [{ "rotate-x": me() }],
			"rotate-y": [{ "rotate-y": me() }],
			"rotate-z": [{ "rotate-z": me() }],
			scale: [{ scale: he() }],
			"scale-x": [{ "scale-x": he() }],
			"scale-y": [{ "scale-y": he() }],
			"scale-z": [{ "scale-z": he() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: ge() }],
			"skew-x": [{ "skew-x": ge() }],
			"skew-y": [{ "skew-y": ge() }],
			transform: [{ transform: [
				X,
				Y,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: x() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: _e() }],
			"translate-x": [{ "translate-x": _e() }],
			"translate-y": [{ "translate-y": _e() }],
			"translate-z": [{ "translate-z": _e() }],
			"translate-none": ["translate-none"],
			zoom: [{ zoom: [
				Tf,
				X,
				Y
			] }],
			accent: [{ accent: j() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: j() }],
			"color-scheme": [{ scheme: [
				"normal",
				"dark",
				"light",
				"light-dark",
				"only-dark",
				"only-light"
			] }],
			cursor: [{ cursor: [
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
				X,
				Y
			] }],
			"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
			"pointer-events": [{ "pointer-events": ["auto", "none"] }],
			resize: [{ resize: [
				"none",
				"",
				"y",
				"x"
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scrollbar-thumb-color": [{ "scrollbar-thumb": j() }],
			"scrollbar-track-color": [{ "scrollbar-track": j() }],
			"scrollbar-gutter": [{ "scrollbar-gutter": [
				"auto",
				"stable",
				"both"
			] }],
			"scrollbar-w": [{ scrollbar: [
				"auto",
				"thin",
				"none"
			] }],
			"scroll-m": [{ "scroll-m": w() }],
			"scroll-mx": [{ "scroll-mx": w() }],
			"scroll-my": [{ "scroll-my": w() }],
			"scroll-ms": [{ "scroll-ms": w() }],
			"scroll-me": [{ "scroll-me": w() }],
			"scroll-mbs": [{ "scroll-mbs": w() }],
			"scroll-mbe": [{ "scroll-mbe": w() }],
			"scroll-mt": [{ "scroll-mt": w() }],
			"scroll-mr": [{ "scroll-mr": w() }],
			"scroll-mb": [{ "scroll-mb": w() }],
			"scroll-ml": [{ "scroll-ml": w() }],
			"scroll-p": [{ "scroll-p": w() }],
			"scroll-px": [{ "scroll-px": w() }],
			"scroll-py": [{ "scroll-py": w() }],
			"scroll-ps": [{ "scroll-ps": w() }],
			"scroll-pe": [{ "scroll-pe": w() }],
			"scroll-pbs": [{ "scroll-pbs": w() }],
			"scroll-pbe": [{ "scroll-pbe": w() }],
			"scroll-pt": [{ "scroll-pt": w() }],
			"scroll-pr": [{ "scroll-pr": w() }],
			"scroll-pb": [{ "scroll-pb": w() }],
			"scroll-pl": [{ "scroll-pl": w() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				X,
				Y
			] }],
			fill: [{ fill: ["none", ...j()] }],
			"stroke-w": [{ stroke: [
				J,
				Z,
				If,
				Lf
			] }],
			stroke: [{ stroke: ["none", ...j()] }],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			"container-named": ["container-type"],
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"inset-bs",
				"inset-be",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": [
				"start",
				"end",
				"right",
				"left"
			],
			"inset-y": [
				"inset-bs",
				"inset-be",
				"top",
				"bottom"
			],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pbs",
				"pbe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: [
				"ps",
				"pe",
				"pr",
				"pl"
			],
			py: [
				"pbs",
				"pbe",
				"pt",
				"pb"
			],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mbs",
				"mbe",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: [
				"ms",
				"me",
				"mr",
				"ml"
			],
			my: [
				"mbs",
				"mbe",
				"mt",
				"mb"
			],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
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
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-x",
				"border-w-y",
				"border-w-s",
				"border-w-e",
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": [
				"border-w-s",
				"border-w-e",
				"border-w-r",
				"border-w-l"
			],
			"border-w-y": [
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-b"
			],
			"border-color": [
				"border-color-x",
				"border-color-y",
				"border-color-s",
				"border-color-e",
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": [
				"border-color-s",
				"border-color-e",
				"border-color-r",
				"border-color-l"
			],
			"border-color-y": [
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-b"
			],
			translate: [
				"translate-x",
				"translate-y",
				"translate-none"
			],
			"translate-none": [
				"translate",
				"translate-x",
				"translate-y",
				"translate-z"
			],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": [
				"scroll-ms",
				"scroll-me",
				"scroll-mr",
				"scroll-ml"
			],
			"scroll-my": [
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mb"
			],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": [
				"scroll-ps",
				"scroll-pe",
				"scroll-pr",
				"scroll-pl"
			],
			"scroll-py": [
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pb"
			],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] },
		postfixLookupClassGroups: ["container-type"],
		orderSensitiveModifiers: [
			"*",
			"**",
			"after",
			"backdrop",
			"before",
			"details-content",
			"file",
			"first-letter",
			"first-line",
			"marker",
			"placeholder",
			"selection"
		]
	};
}), op = (...e) => ap(Md(e)), sp = Fd("btn", {
	variants: {
		variant: {
			default: "btn-primary",
			outline: "btn-outline",
			ghost: "btn-ghost"
		},
		size: {
			default: "",
			icon: "btn-icon"
		}
	},
	defaultVariants: {
		variant: "outline",
		size: "default"
	}
}), cp = (0, _.forwardRef)(({ variant: e, size: t, className: n, asChild: r = !1, ...i }, a) => /* @__PURE__ */ (0, k.jsx)(r ? De : "button", {
	ref: a,
	className: op(sp({
		variant: e,
		size: t
	}), n),
	...i
}));
cp.displayName = "Button";
//#endregion
//#region node_modules/@tanstack/table-core/build/lib/index.mjs
function lp(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function up(e, t) {
	return (n) => {
		t.setState((t) => ({
			...t,
			[e]: lp(n, t[e])
		}));
	};
}
function dp(e) {
	return e instanceof Function;
}
function fp(e) {
	return Array.isArray(e) && e.every((e) => typeof e == "number");
}
function pp(e, t) {
	let n = [], r = (e) => {
		e.forEach((e) => {
			n.push(e);
			let i = t(e);
			i != null && i.length && r(i);
		});
	};
	return r(e), n;
}
function Q(e, t, n) {
	let r = [], i;
	return (a) => {
		let o;
		n.key && n.debug && (o = Date.now());
		let s = e(a);
		if (!(s.length !== r.length || s.some((e, t) => r[t] !== e))) return i;
		r = s;
		let c;
		if (n.key && n.debug && (c = Date.now()), i = t(...s), n == null || n.onChange == null || n.onChange(i), n.key && n.debug && n != null && n.debug()) {
			let e = Math.round((Date.now() - o) * 100) / 100, t = Math.round((Date.now() - c) * 100) / 100, r = t / 16, i = (e, t) => {
				for (e = String(e); e.length < t;) e = " " + e;
				return e;
			};
			console.info(`%c⏱ ${i(t, 5)} /${i(e, 5)} ms`, `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(0, Math.min(120 - 120 * r, 120))}deg 100% 31%);`, n?.key);
		}
		return i;
	};
}
function $(e, t, n, r) {
	return {
		debug: () => e?.debugAll ?? e[t],
		key: !1,
		onChange: r
	};
}
function mp(e, t, n, r) {
	let i = {
		id: `${t.id}_${n.id}`,
		row: t,
		column: n,
		getValue: () => t.getValue(r),
		renderValue: () => i.getValue() ?? e.options.renderFallbackValue,
		getContext: Q(() => [
			e,
			n,
			t,
			i
		], (e, t, n, r) => ({
			table: e,
			column: t,
			row: n,
			cell: r,
			getValue: r.getValue,
			renderValue: r.renderValue
		}), $(e.options, "debugCells", "cell.getContext"))
	};
	return e._features.forEach((r) => {
		r.createCell == null || r.createCell(i, n, t, e);
	}, {}), i;
}
function hp(e, t, n, r) {
	let i = {
		...e._getDefaultColumnDef(),
		...t
	}, a = i.accessorKey, o = i.id ?? (a ? typeof String.prototype.replaceAll == "function" ? a.replaceAll(".", "_") : a.replace(/\./g, "_") : void 0) ?? (typeof i.header == "string" ? i.header : void 0), s;
	if (i.accessorFn ? s = i.accessorFn : a && (s = a.includes(".") ? (e) => {
		let t = e;
		for (let e of a.split(".")) t = t?.[e];
		return t;
	} : (e) => e[i.accessorKey]), !o) throw Error();
	let c = {
		id: `${String(o)}`,
		accessorFn: s,
		parent: r,
		depth: n,
		columnDef: i,
		columns: [],
		getFlatColumns: Q(() => [!0], () => [c, ...c.columns?.flatMap((e) => e.getFlatColumns())], $(e.options, "debugColumns", "column.getFlatColumns")),
		getLeafColumns: Q(() => [e._getOrderColumnsFn()], (e) => {
			var t;
			return (t = c.columns) != null && t.length ? e(c.columns.flatMap((e) => e.getLeafColumns())) : [c];
		}, $(e.options, "debugColumns", "column.getLeafColumns"))
	};
	for (let t of e._features) t.createColumn == null || t.createColumn(c, e);
	return c;
}
var gp = "debugHeaders";
function _p(e, t, n) {
	let r = {
		id: n.id ?? t.id,
		column: t,
		index: n.index,
		isPlaceholder: !!n.isPlaceholder,
		placeholderId: n.placeholderId,
		depth: n.depth,
		subHeaders: [],
		colSpan: 0,
		rowSpan: 0,
		headerGroup: null,
		getLeafHeaders: () => {
			let e = [], t = (n) => {
				n.subHeaders && n.subHeaders.length && n.subHeaders.map(t), e.push(n);
			};
			return t(r), e;
		},
		getContext: () => ({
			table: e,
			header: r,
			column: t
		})
	};
	return e._features.forEach((t) => {
		t.createHeader == null || t.createHeader(r, e);
	}), r;
}
var vp = { createTable: (e) => {
	e.getHeaderGroups = Q(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => {
		let a = r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], o = i?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], s = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id)));
		return yp(t, [
			...a,
			...s,
			...o
		], e);
	}, $(e.options, gp, "getHeaderGroups")), e.getCenterHeaderGroups = Q(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => (n = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id))), yp(t, n, e, "center")), $(e.options, gp, "getCenterHeaderGroups")), e.getLeftHeaderGroups = Q(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left
	], (t, n, r) => yp(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "left"), $(e.options, gp, "getLeftHeaderGroups")), e.getRightHeaderGroups = Q(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.right
	], (t, n, r) => yp(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "right"), $(e.options, gp, "getRightHeaderGroups")), e.getFooterGroups = Q(() => [e.getHeaderGroups()], (e) => [...e].reverse(), $(e.options, gp, "getFooterGroups")), e.getLeftFooterGroups = Q(() => [e.getLeftHeaderGroups()], (e) => [...e].reverse(), $(e.options, gp, "getLeftFooterGroups")), e.getCenterFooterGroups = Q(() => [e.getCenterHeaderGroups()], (e) => [...e].reverse(), $(e.options, gp, "getCenterFooterGroups")), e.getRightFooterGroups = Q(() => [e.getRightHeaderGroups()], (e) => [...e].reverse(), $(e.options, gp, "getRightFooterGroups")), e.getFlatHeaders = Q(() => [e.getHeaderGroups()], (e) => e.map((e) => e.headers).flat(), $(e.options, gp, "getFlatHeaders")), e.getLeftFlatHeaders = Q(() => [e.getLeftHeaderGroups()], (e) => e.map((e) => e.headers).flat(), $(e.options, gp, "getLeftFlatHeaders")), e.getCenterFlatHeaders = Q(() => [e.getCenterHeaderGroups()], (e) => e.map((e) => e.headers).flat(), $(e.options, gp, "getCenterFlatHeaders")), e.getRightFlatHeaders = Q(() => [e.getRightHeaderGroups()], (e) => e.map((e) => e.headers).flat(), $(e.options, gp, "getRightFlatHeaders")), e.getCenterLeafHeaders = Q(() => [e.getCenterFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), $(e.options, gp, "getCenterLeafHeaders")), e.getLeftLeafHeaders = Q(() => [e.getLeftFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), $(e.options, gp, "getLeftLeafHeaders")), e.getRightLeafHeaders = Q(() => [e.getRightFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), $(e.options, gp, "getRightLeafHeaders")), e.getLeafHeaders = Q(() => [
		e.getLeftHeaderGroups(),
		e.getCenterHeaderGroups(),
		e.getRightHeaderGroups()
	], (e, t, n) => [
		...e[0]?.headers ?? [],
		...t[0]?.headers ?? [],
		...n[0]?.headers ?? []
	].map((e) => e.getLeafHeaders()).flat(), $(e.options, gp, "getLeafHeaders"));
} };
function yp(e, t, n, r) {
	let i = 0, a = function(e, t) {
		t === void 0 && (t = 1), i = Math.max(i, t), e.filter((e) => e.getIsVisible()).forEach((e) => {
			var n;
			(n = e.columns) != null && n.length && a(e.columns, t + 1);
		}, 0);
	};
	a(e);
	let o = [], s = (e, t) => {
		let i = {
			depth: t,
			id: [r, `${t}`].filter(Boolean).join("_"),
			headers: []
		}, a = [];
		e.forEach((e) => {
			let o = [...a].reverse()[0], s = e.column.depth === i.depth, c, l = !1;
			if (s && e.column.parent ? c = e.column.parent : (c = e.column, l = !0), o && o?.column === c) o.subHeaders.push(e);
			else {
				let i = _p(n, c, {
					id: [
						r,
						t,
						c.id,
						e?.id
					].filter(Boolean).join("_"),
					isPlaceholder: l,
					placeholderId: l ? `${a.filter((e) => e.column === c).length}` : void 0,
					depth: t,
					index: a.length
				});
				i.subHeaders.push(e), a.push(i);
			}
			i.headers.push(e), e.headerGroup = i;
		}), o.push(i), t > 0 && s(a, t - 1);
	};
	s(t.map((e, t) => _p(n, e, {
		depth: i,
		index: t
	})), i - 1), o.reverse();
	let c = (e) => e.filter((e) => e.column.getIsVisible()).map((e) => {
		let t = 0, n = 0, r = [0];
		e.subHeaders && e.subHeaders.length ? (r = [], c(e.subHeaders).forEach((e) => {
			let { colSpan: n, rowSpan: i } = e;
			t += n, r.push(i);
		})) : t = 1;
		let i = Math.min(...r);
		return n += i, e.colSpan = t, e.rowSpan = n, {
			colSpan: t,
			rowSpan: n
		};
	});
	return c(o[0]?.headers ?? []), o;
}
var bp = (e, t, n, r, i, a, o) => {
	let s = {
		id: t,
		index: r,
		original: n,
		depth: i,
		parentId: o,
		_valuesCache: {},
		_uniqueValuesCache: {},
		getValue: (t) => {
			if (s._valuesCache.hasOwnProperty(t)) return s._valuesCache[t];
			let n = e.getColumn(t);
			if (n != null && n.accessorFn) return s._valuesCache[t] = n.accessorFn(s.original, r), s._valuesCache[t];
		},
		getUniqueValues: (t) => {
			if (s._uniqueValuesCache.hasOwnProperty(t)) return s._uniqueValuesCache[t];
			let n = e.getColumn(t);
			if (n != null && n.accessorFn) return n.columnDef.getUniqueValues ? (s._uniqueValuesCache[t] = n.columnDef.getUniqueValues(s.original, r), s._uniqueValuesCache[t]) : (s._uniqueValuesCache[t] = [s.getValue(t)], s._uniqueValuesCache[t]);
		},
		renderValue: (t) => s.getValue(t) ?? e.options.renderFallbackValue,
		subRows: a ?? [],
		getLeafRows: () => pp(s.subRows, (e) => e.subRows),
		getParentRow: () => s.parentId ? e.getRow(s.parentId, !0) : void 0,
		getParentRows: () => {
			let e = [], t = s;
			for (;;) {
				let n = t.getParentRow();
				if (!n) break;
				e.push(n), t = n;
			}
			return e.reverse();
		},
		getAllCells: Q(() => [e.getAllLeafColumns()], (t) => t.map((t) => mp(e, s, t, t.id)), $(e.options, "debugRows", "getAllCells")),
		_getAllCellsByColumnId: Q(() => [s.getAllCells()], (e) => e.reduce((e, t) => (e[t.column.id] = t, e), {}), $(e.options, "debugRows", "getAllCellsByColumnId"))
	};
	for (let t = 0; t < e._features.length; t++) {
		let n = e._features[t];
		n == null || n.createRow == null || n.createRow(s, e);
	}
	return s;
}, xp = { createColumn: (e, t) => {
	e._getFacetedRowModel = t.options.getFacetedRowModel && t.options.getFacetedRowModel(t, e.id), e.getFacetedRowModel = () => e._getFacetedRowModel ? e._getFacetedRowModel() : t.getPreFilteredRowModel(), e._getFacetedUniqueValues = t.options.getFacetedUniqueValues && t.options.getFacetedUniqueValues(t, e.id), e.getFacetedUniqueValues = () => e._getFacetedUniqueValues ? e._getFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getFacetedMinMaxValues = t.options.getFacetedMinMaxValues && t.options.getFacetedMinMaxValues(t, e.id), e.getFacetedMinMaxValues = () => {
		if (e._getFacetedMinMaxValues) return e._getFacetedMinMaxValues();
	};
} }, Sp = (e, t, n) => {
	var r, i;
	let a = n == null || (r = n.toString()) == null ? void 0 : r.toLowerCase();
	return !!((i = e.getValue(t)) != null && (i = i.toString()) != null && (i = i.toLowerCase()) != null && i.includes(a));
};
Sp.autoRemove = (e) => Mp(e);
var Cp = (e, t, n) => {
	var r;
	return !!((r = e.getValue(t)) != null && (r = r.toString()) != null && r.includes(n));
};
Cp.autoRemove = (e) => Mp(e);
var wp = (e, t, n) => {
	var r;
	return ((r = e.getValue(t)) == null || (r = r.toString()) == null ? void 0 : r.toLowerCase()) === n?.toLowerCase();
};
wp.autoRemove = (e) => Mp(e);
var Tp = (e, t, n) => e.getValue(t)?.includes(n);
Tp.autoRemove = (e) => Mp(e);
var Ep = (e, t, n) => !n.some((n) => {
	var r;
	return !((r = e.getValue(t)) != null && r.includes(n));
});
Ep.autoRemove = (e) => Mp(e) || !(e != null && e.length);
var Dp = (e, t, n) => n.some((n) => e.getValue(t)?.includes(n));
Dp.autoRemove = (e) => Mp(e) || !(e != null && e.length);
var Op = (e, t, n) => e.getValue(t) === n;
Op.autoRemove = (e) => Mp(e);
var kp = (e, t, n) => e.getValue(t) == n;
kp.autoRemove = (e) => Mp(e);
var Ap = (e, t, n) => {
	let [r, i] = n, a = e.getValue(t);
	return a >= r && a <= i;
};
Ap.resolveFilterValue = (e) => {
	let [t, n] = e, r = typeof t == "number" ? t : parseFloat(t), i = typeof n == "number" ? n : parseFloat(n), a = t === null || Number.isNaN(r) ? -Infinity : r, o = n === null || Number.isNaN(i) ? Infinity : i;
	if (a > o) {
		let e = a;
		a = o, o = e;
	}
	return [a, o];
}, Ap.autoRemove = (e) => Mp(e) || Mp(e[0]) && Mp(e[1]);
var jp = {
	includesString: Sp,
	includesStringSensitive: Cp,
	equalsString: wp,
	arrIncludes: Tp,
	arrIncludesAll: Ep,
	arrIncludesSome: Dp,
	equals: Op,
	weakEquals: kp,
	inNumberRange: Ap
};
function Mp(e) {
	return e == null || e === "";
}
var Np = {
	getDefaultColumnDef: () => ({ filterFn: "auto" }),
	getInitialState: (e) => ({
		columnFilters: [],
		...e
	}),
	getDefaultOptions: (e) => ({
		onColumnFiltersChange: up("columnFilters", e),
		filterFromLeafRows: !1,
		maxLeafRowFilterDepth: 100
	}),
	createColumn: (e, t) => {
		e.getAutoFilterFn = () => {
			let n = t.getCoreRowModel().flatRows[0]?.getValue(e.id);
			return typeof n == "string" ? jp.includesString : typeof n == "number" ? jp.inNumberRange : typeof n == "boolean" || typeof n == "object" && n ? jp.equals : Array.isArray(n) ? jp.arrIncludes : jp.weakEquals;
		}, e.getFilterFn = () => dp(e.columnDef.filterFn) ? e.columnDef.filterFn : e.columnDef.filterFn === "auto" ? e.getAutoFilterFn() : t.options.filterFns?.[e.columnDef.filterFn] ?? jp[e.columnDef.filterFn], e.getCanFilter = () => (e.columnDef.enableColumnFilter ?? !0) && (t.options.enableColumnFilters ?? !0) && (t.options.enableFilters ?? !0) && !!e.accessorFn, e.getIsFiltered = () => e.getFilterIndex() > -1, e.getFilterValue = () => {
			var n;
			return (n = t.getState().columnFilters) == null || (n = n.find((t) => t.id === e.id)) == null ? void 0 : n.value;
		}, e.getFilterIndex = () => t.getState().columnFilters?.findIndex((t) => t.id === e.id) ?? -1, e.setFilterValue = (n) => {
			t.setColumnFilters((t) => {
				let r = e.getFilterFn(), i = t?.find((t) => t.id === e.id), a = lp(n, i ? i.value : void 0);
				if (Pp(r, a, e)) return t?.filter((t) => t.id !== e.id) ?? [];
				let o = {
					id: e.id,
					value: a
				};
				return i ? t?.map((t) => t.id === e.id ? o : t) ?? [] : t != null && t.length ? [...t, o] : [o];
			});
		};
	},
	createRow: (e, t) => {
		e.columnFilters = {}, e.columnFiltersMeta = {};
	},
	createTable: (e) => {
		e.setColumnFilters = (t) => {
			let n = e.getAllLeafColumns();
			e.options.onColumnFiltersChange == null || e.options.onColumnFiltersChange((e) => lp(t, e)?.filter((e) => {
				let t = n.find((t) => t.id === e.id);
				return !(t && Pp(t.getFilterFn(), e.value, t));
			}));
		}, e.resetColumnFilters = (t) => {
			e.setColumnFilters(t ? [] : e.initialState?.columnFilters ?? []);
		}, e.getPreFilteredRowModel = () => e.getCoreRowModel(), e.getFilteredRowModel = () => (!e._getFilteredRowModel && e.options.getFilteredRowModel && (e._getFilteredRowModel = e.options.getFilteredRowModel(e)), e.options.manualFiltering || !e._getFilteredRowModel ? e.getPreFilteredRowModel() : e._getFilteredRowModel());
	}
};
function Pp(e, t, n) {
	return (e && e.autoRemove ? e.autoRemove(t, n) : !1) || t === void 0 || typeof t == "string" && !t;
}
var Fp = {
	sum: (e, t, n) => n.reduce((t, n) => {
		let r = n.getValue(e);
		return t + (typeof r == "number" ? r : 0);
	}, 0),
	min: (e, t, n) => {
		let r;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r > n || r === void 0 && n >= n) && (r = n);
		}), r;
	},
	max: (e, t, n) => {
		let r;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r < n || r === void 0 && n >= n) && (r = n);
		}), r;
	},
	extent: (e, t, n) => {
		let r, i;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r === void 0 ? n >= n && (r = i = n) : (r > n && (r = n), i < n && (i = n)));
		}), [r, i];
	},
	mean: (e, t) => {
		let n = 0, r = 0;
		if (t.forEach((t) => {
			let i = t.getValue(e);
			i != null && (i = +i) >= i && (++n, r += i);
		}), n) return r / n;
	},
	median: (e, t) => {
		if (!t.length) return;
		let n = t.map((t) => t.getValue(e));
		if (!fp(n)) return;
		if (n.length === 1) return n[0];
		let r = Math.floor(n.length / 2), i = n.sort((e, t) => e - t);
		return n.length % 2 == 0 ? (i[r - 1] + i[r]) / 2 : i[r];
	},
	unique: (e, t) => Array.from(new Set(t.map((t) => t.getValue(e))).values()),
	uniqueCount: (e, t) => new Set(t.map((t) => t.getValue(e))).size,
	count: (e, t) => t.length
}, Ip = {
	getDefaultColumnDef: () => ({
		aggregatedCell: (e) => {
			var t;
			return ((t = e.getValue()) == null || t.toString == null ? void 0 : t.toString()) ?? null;
		},
		aggregationFn: "auto"
	}),
	getInitialState: (e) => ({
		grouping: [],
		...e
	}),
	getDefaultOptions: (e) => ({
		onGroupingChange: up("grouping", e),
		groupedColumnMode: "reorder"
	}),
	createColumn: (e, t) => {
		e.toggleGrouping = () => {
			t.setGrouping((t) => t != null && t.includes(e.id) ? t.filter((t) => t !== e.id) : [...t ?? [], e.id]);
		}, e.getCanGroup = () => (e.columnDef.enableGrouping ?? !0) && (t.options.enableGrouping ?? !0) && (!!e.accessorFn || !!e.columnDef.getGroupingValue), e.getIsGrouped = () => t.getState().grouping?.includes(e.id), e.getGroupedIndex = () => t.getState().grouping?.indexOf(e.id), e.getToggleGroupingHandler = () => {
			let t = e.getCanGroup();
			return () => {
				t && e.toggleGrouping();
			};
		}, e.getAutoAggregationFn = () => {
			let n = t.getCoreRowModel().flatRows[0]?.getValue(e.id);
			if (typeof n == "number") return Fp.sum;
			if (Object.prototype.toString.call(n) === "[object Date]") return Fp.extent;
		}, e.getAggregationFn = () => {
			if (!e) throw Error();
			return dp(e.columnDef.aggregationFn) ? e.columnDef.aggregationFn : e.columnDef.aggregationFn === "auto" ? e.getAutoAggregationFn() : t.options.aggregationFns?.[e.columnDef.aggregationFn] ?? Fp[e.columnDef.aggregationFn];
		};
	},
	createTable: (e) => {
		e.setGrouping = (t) => e.options.onGroupingChange == null ? void 0 : e.options.onGroupingChange(t), e.resetGrouping = (t) => {
			e.setGrouping(t ? [] : e.initialState?.grouping ?? []);
		}, e.getPreGroupedRowModel = () => e.getFilteredRowModel(), e.getGroupedRowModel = () => (!e._getGroupedRowModel && e.options.getGroupedRowModel && (e._getGroupedRowModel = e.options.getGroupedRowModel(e)), e.options.manualGrouping || !e._getGroupedRowModel ? e.getPreGroupedRowModel() : e._getGroupedRowModel());
	},
	createRow: (e, t) => {
		e.getIsGrouped = () => !!e.groupingColumnId, e.getGroupingValue = (n) => {
			if (e._groupingValuesCache.hasOwnProperty(n)) return e._groupingValuesCache[n];
			let r = t.getColumn(n);
			return r != null && r.columnDef.getGroupingValue ? (e._groupingValuesCache[n] = r.columnDef.getGroupingValue(e.original), e._groupingValuesCache[n]) : e.getValue(n);
		}, e._groupingValuesCache = {};
	},
	createCell: (e, t, n, r) => {
		e.getIsGrouped = () => t.getIsGrouped() && t.id === n.groupingColumnId, e.getIsPlaceholder = () => !e.getIsGrouped() && t.getIsGrouped(), e.getIsAggregated = () => {
			var t;
			return !e.getIsGrouped() && !e.getIsPlaceholder() && !!((t = n.subRows) != null && t.length);
		};
	}
};
function Lp(e, t, n) {
	if (!(t != null && t.length) || !n) return e;
	let r = e.filter((e) => !t.includes(e.id));
	return n === "remove" ? r : [...t.map((t) => e.find((e) => e.id === t)).filter(Boolean), ...r];
}
var Rp = {
	getInitialState: (e) => ({
		columnOrder: [],
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnOrderChange: up("columnOrder", e) }),
	createColumn: (e, t) => {
		e.getIndex = Q((e) => [Yp(t, e)], (t) => t.findIndex((t) => t.id === e.id), $(t.options, "debugColumns", "getIndex")), e.getIsFirstColumn = (n) => Yp(t, n)[0]?.id === e.id, e.getIsLastColumn = (n) => {
			let r = Yp(t, n);
			return r[r.length - 1]?.id === e.id;
		};
	},
	createTable: (e) => {
		e.setColumnOrder = (t) => e.options.onColumnOrderChange == null ? void 0 : e.options.onColumnOrderChange(t), e.resetColumnOrder = (t) => {
			e.setColumnOrder(t ? [] : e.initialState.columnOrder ?? []);
		}, e._getOrderColumnsFn = Q(() => [
			e.getState().columnOrder,
			e.getState().grouping,
			e.options.groupedColumnMode
		], (e, t, n) => (r) => {
			let i = [];
			if (!(e != null && e.length)) i = r;
			else {
				let t = [...e], n = [...r];
				for (; n.length && t.length;) {
					let e = t.shift(), r = n.findIndex((t) => t.id === e);
					r > -1 && i.push(n.splice(r, 1)[0]);
				}
				i = [...i, ...n];
			}
			return Lp(i, t, n);
		}, $(e.options, "debugTable", "_getOrderColumnsFn"));
	}
}, zp = () => ({
	left: [],
	right: []
}), Bp = {
	getInitialState: (e) => ({
		columnPinning: zp(),
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnPinningChange: up("columnPinning", e) }),
	createColumn: (e, t) => {
		e.pin = (n) => {
			let r = e.getLeafColumns().map((e) => e.id).filter(Boolean);
			t.setColumnPinning((e) => n === "right" ? {
				left: (e?.left ?? []).filter((e) => !(r != null && r.includes(e))),
				right: [...(e?.right ?? []).filter((e) => !(r != null && r.includes(e))), ...r]
			} : n === "left" ? {
				left: [...(e?.left ?? []).filter((e) => !(r != null && r.includes(e))), ...r],
				right: (e?.right ?? []).filter((e) => !(r != null && r.includes(e)))
			} : {
				left: (e?.left ?? []).filter((e) => !(r != null && r.includes(e))),
				right: (e?.right ?? []).filter((e) => !(r != null && r.includes(e)))
			});
		}, e.getCanPin = () => e.getLeafColumns().some((e) => (e.columnDef.enablePinning ?? !0) && (t.options.enableColumnPinning ?? t.options.enablePinning ?? !0)), e.getIsPinned = () => {
			let n = e.getLeafColumns().map((e) => e.id), { left: r, right: i } = t.getState().columnPinning, a = n.some((e) => r?.includes(e)), o = n.some((e) => i?.includes(e));
			return a ? "left" : o ? "right" : !1;
		}, e.getPinnedIndex = () => {
			var n;
			let r = e.getIsPinned();
			return r ? ((n = t.getState().columnPinning) == null || (n = n[r]) == null ? void 0 : n.indexOf(e.id)) ?? -1 : 0;
		};
	},
	createRow: (e, t) => {
		e.getCenterVisibleCells = Q(() => [
			e._getAllVisibleCells(),
			t.getState().columnPinning.left,
			t.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.column.id));
		}, $(t.options, "debugRows", "getCenterVisibleCells")), e.getLeftVisibleCells = Q(() => [e._getAllVisibleCells(), t.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "left"
		})), $(t.options, "debugRows", "getLeftVisibleCells")), e.getRightVisibleCells = Q(() => [e._getAllVisibleCells(), t.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "right"
		})), $(t.options, "debugRows", "getRightVisibleCells"));
	},
	createTable: (e) => {
		e.setColumnPinning = (t) => e.options.onColumnPinningChange == null ? void 0 : e.options.onColumnPinningChange(t), e.resetColumnPinning = (t) => e.setColumnPinning(t ? zp() : e.initialState?.columnPinning ?? zp()), e.getIsSomeColumnsPinned = (t) => {
			let n = e.getState().columnPinning;
			return t ? !!n[t]?.length : !!(n.left?.length || n.right?.length);
		}, e.getLeftLeafColumns = Q(() => [e.getAllLeafColumns(), e.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), $(e.options, "debugColumns", "getLeftLeafColumns")), e.getRightLeafColumns = Q(() => [e.getAllLeafColumns(), e.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), $(e.options, "debugColumns", "getRightLeafColumns")), e.getCenterLeafColumns = Q(() => [
			e.getAllLeafColumns(),
			e.getState().columnPinning.left,
			e.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.id));
		}, $(e.options, "debugColumns", "getCenterLeafColumns"));
	}
};
function Vp(e) {
	return e || (typeof document < "u" ? document : null);
}
var Hp = {
	size: 150,
	minSize: 20,
	maxSize: 2 ** 53 - 1
}, Up = () => ({
	startOffset: null,
	startSize: null,
	deltaOffset: null,
	deltaPercentage: null,
	isResizingColumn: !1,
	columnSizingStart: []
}), Wp = {
	getDefaultColumnDef: () => Hp,
	getInitialState: (e) => ({
		columnSizing: {},
		columnSizingInfo: Up(),
		...e
	}),
	getDefaultOptions: (e) => ({
		columnResizeMode: "onEnd",
		columnResizeDirection: "ltr",
		onColumnSizingChange: up("columnSizing", e),
		onColumnSizingInfoChange: up("columnSizingInfo", e)
	}),
	createColumn: (e, t) => {
		e.getSize = () => {
			let n = t.getState().columnSizing[e.id];
			return Math.min(Math.max(e.columnDef.minSize ?? Hp.minSize, n ?? e.columnDef.size ?? Hp.size), e.columnDef.maxSize ?? Hp.maxSize);
		}, e.getStart = Q((e) => [
			e,
			Yp(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(0, e.getIndex(t)).reduce((e, t) => e + t.getSize(), 0), $(t.options, "debugColumns", "getStart")), e.getAfter = Q((e) => [
			e,
			Yp(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(e.getIndex(t) + 1).reduce((e, t) => e + t.getSize(), 0), $(t.options, "debugColumns", "getAfter")), e.resetSize = () => {
			t.setColumnSizing((t) => {
				let { [e.id]: n, ...r } = t;
				return r;
			});
		}, e.getCanResize = () => (e.columnDef.enableResizing ?? !0) && (t.options.enableColumnResizing ?? !0), e.getIsResizing = () => t.getState().columnSizingInfo.isResizingColumn === e.id;
	},
	createHeader: (e, t) => {
		e.getSize = () => {
			let t = 0, n = (e) => {
				e.subHeaders.length ? e.subHeaders.forEach(n) : t += e.column.getSize() ?? 0;
			};
			return n(e), t;
		}, e.getStart = () => {
			if (e.index > 0) {
				let t = e.headerGroup.headers[e.index - 1];
				return t.getStart() + t.getSize();
			}
			return 0;
		}, e.getResizeHandler = (n) => {
			let r = t.getColumn(e.column.id), i = r?.getCanResize();
			return (a) => {
				if (!r || !i || (a.persist == null || a.persist(), qp(a) && a.touches && a.touches.length > 1)) return;
				let o = e.getSize(), s = e ? e.getLeafHeaders().map((e) => [e.column.id, e.column.getSize()]) : [[r.id, r.getSize()]], c = qp(a) ? Math.round(a.touches[0].clientX) : a.clientX, l = {}, u = (e, n) => {
					typeof n == "number" && (t.setColumnSizingInfo((e) => {
						let r = t.options.columnResizeDirection === "rtl" ? -1 : 1, i = (n - (e?.startOffset ?? 0)) * r, a = Math.max(i / (e?.startSize ?? 0), -.999999);
						return e.columnSizingStart.forEach((e) => {
							let [t, n] = e;
							l[t] = Math.round(Math.max(n + n * a, 0) * 100) / 100;
						}), {
							...e,
							deltaOffset: i,
							deltaPercentage: a
						};
					}), (t.options.columnResizeMode === "onChange" || e === "end") && t.setColumnSizing((e) => ({
						...e,
						...l
					})));
				}, d = (e) => u("move", e), f = (e) => {
					u("end", e), t.setColumnSizingInfo((e) => ({
						...e,
						isResizingColumn: !1,
						startOffset: null,
						startSize: null,
						deltaOffset: null,
						deltaPercentage: null,
						columnSizingStart: []
					}));
				}, p = Vp(n), m = {
					moveHandler: (e) => d(e.clientX),
					upHandler: (e) => {
						p?.removeEventListener("mousemove", m.moveHandler), p?.removeEventListener("mouseup", m.upHandler), f(e.clientX);
					}
				}, h = {
					moveHandler: (e) => (e.cancelable && (e.preventDefault(), e.stopPropagation()), d(e.touches[0].clientX), !1),
					upHandler: (e) => {
						p?.removeEventListener("touchmove", h.moveHandler), p?.removeEventListener("touchend", h.upHandler), e.cancelable && (e.preventDefault(), e.stopPropagation()), f(e.touches[0]?.clientX);
					}
				}, g = Kp() ? { passive: !1 } : !1;
				qp(a) ? (p?.addEventListener("touchmove", h.moveHandler, g), p?.addEventListener("touchend", h.upHandler, g)) : (p?.addEventListener("mousemove", m.moveHandler, g), p?.addEventListener("mouseup", m.upHandler, g)), t.setColumnSizingInfo((e) => ({
					...e,
					startOffset: c,
					startSize: o,
					deltaOffset: 0,
					deltaPercentage: 0,
					columnSizingStart: s,
					isResizingColumn: r.id
				}));
			};
		};
	},
	createTable: (e) => {
		e.setColumnSizing = (t) => e.options.onColumnSizingChange == null ? void 0 : e.options.onColumnSizingChange(t), e.setColumnSizingInfo = (t) => e.options.onColumnSizingInfoChange == null ? void 0 : e.options.onColumnSizingInfoChange(t), e.resetColumnSizing = (t) => {
			e.setColumnSizing(t ? {} : e.initialState.columnSizing ?? {});
		}, e.resetHeaderSizeInfo = (t) => {
			e.setColumnSizingInfo(t ? Up() : e.initialState.columnSizingInfo ?? Up());
		}, e.getTotalSize = () => e.getHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getLeftTotalSize = () => e.getLeftHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getCenterTotalSize = () => e.getCenterHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getRightTotalSize = () => e.getRightHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0;
	}
}, Gp = null;
function Kp() {
	if (typeof Gp == "boolean") return Gp;
	let e = !1;
	try {
		let t = { get passive() {
			return e = !0, !1;
		} }, n = () => {};
		window.addEventListener("test", n, t), window.removeEventListener("test", n);
	} catch {
		e = !1;
	}
	return Gp = e, Gp;
}
function qp(e) {
	return e.type === "touchstart";
}
var Jp = {
	getInitialState: (e) => ({
		columnVisibility: {},
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnVisibilityChange: up("columnVisibility", e) }),
	createColumn: (e, t) => {
		e.toggleVisibility = (n) => {
			e.getCanHide() && t.setColumnVisibility((t) => ({
				...t,
				[e.id]: n ?? !e.getIsVisible()
			}));
		}, e.getIsVisible = () => {
			let n = e.columns;
			return (n.length ? n.some((e) => e.getIsVisible()) : t.getState().columnVisibility?.[e.id]) ?? !0;
		}, e.getCanHide = () => (e.columnDef.enableHiding ?? !0) && (t.options.enableHiding ?? !0), e.getToggleVisibilityHandler = () => (t) => {
			e.toggleVisibility == null || e.toggleVisibility(t.target.checked);
		};
	},
	createRow: (e, t) => {
		e._getAllVisibleCells = Q(() => [e.getAllCells(), t.getState().columnVisibility], (e) => e.filter((e) => e.column.getIsVisible()), $(t.options, "debugRows", "_getAllVisibleCells")), e.getVisibleCells = Q(() => [
			e.getLeftVisibleCells(),
			e.getCenterVisibleCells(),
			e.getRightVisibleCells()
		], (e, t, n) => [
			...e,
			...t,
			...n
		], $(t.options, "debugRows", "getVisibleCells"));
	},
	createTable: (e) => {
		let t = (t, n) => Q(() => [n(), n().filter((e) => e.getIsVisible()).map((e) => e.id).join("_")], (e) => e.filter((e) => e.getIsVisible == null ? void 0 : e.getIsVisible()), $(e.options, "debugColumns", t));
		e.getVisibleFlatColumns = t("getVisibleFlatColumns", () => e.getAllFlatColumns()), e.getVisibleLeafColumns = t("getVisibleLeafColumns", () => e.getAllLeafColumns()), e.getLeftVisibleLeafColumns = t("getLeftVisibleLeafColumns", () => e.getLeftLeafColumns()), e.getRightVisibleLeafColumns = t("getRightVisibleLeafColumns", () => e.getRightLeafColumns()), e.getCenterVisibleLeafColumns = t("getCenterVisibleLeafColumns", () => e.getCenterLeafColumns()), e.setColumnVisibility = (t) => e.options.onColumnVisibilityChange == null ? void 0 : e.options.onColumnVisibilityChange(t), e.resetColumnVisibility = (t) => {
			e.setColumnVisibility(t ? {} : e.initialState.columnVisibility ?? {});
		}, e.toggleAllColumnsVisible = (t) => {
			t ??= !e.getIsAllColumnsVisible(), e.setColumnVisibility(e.getAllLeafColumns().reduce((e, n) => ({
				...e,
				[n.id]: t || !(n.getCanHide != null && n.getCanHide())
			}), {}));
		}, e.getIsAllColumnsVisible = () => !e.getAllLeafColumns().some((e) => !(e.getIsVisible != null && e.getIsVisible())), e.getIsSomeColumnsVisible = () => e.getAllLeafColumns().some((e) => e.getIsVisible == null ? void 0 : e.getIsVisible()), e.getToggleAllColumnsVisibilityHandler = () => (t) => {
			e.toggleAllColumnsVisible(t.target?.checked);
		};
	}
};
function Yp(e, t) {
	return t ? t === "center" ? e.getCenterVisibleLeafColumns() : t === "left" ? e.getLeftVisibleLeafColumns() : e.getRightVisibleLeafColumns() : e.getVisibleLeafColumns();
}
var Xp = { createTable: (e) => {
	e._getGlobalFacetedRowModel = e.options.getFacetedRowModel && e.options.getFacetedRowModel(e, "__global__"), e.getGlobalFacetedRowModel = () => e.options.manualFiltering || !e._getGlobalFacetedRowModel ? e.getPreFilteredRowModel() : e._getGlobalFacetedRowModel(), e._getGlobalFacetedUniqueValues = e.options.getFacetedUniqueValues && e.options.getFacetedUniqueValues(e, "__global__"), e.getGlobalFacetedUniqueValues = () => e._getGlobalFacetedUniqueValues ? e._getGlobalFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getGlobalFacetedMinMaxValues = e.options.getFacetedMinMaxValues && e.options.getFacetedMinMaxValues(e, "__global__"), e.getGlobalFacetedMinMaxValues = () => {
		if (e._getGlobalFacetedMinMaxValues) return e._getGlobalFacetedMinMaxValues();
	};
} }, Zp = {
	getInitialState: (e) => ({
		globalFilter: void 0,
		...e
	}),
	getDefaultOptions: (e) => ({
		onGlobalFilterChange: up("globalFilter", e),
		globalFilterFn: "auto",
		getColumnCanGlobalFilter: (t) => {
			var n;
			let r = (n = e.getCoreRowModel().flatRows[0]) == null || (n = n._getAllCellsByColumnId()[t.id]) == null ? void 0 : n.getValue();
			return typeof r == "string" || typeof r == "number";
		}
	}),
	createColumn: (e, t) => {
		e.getCanGlobalFilter = () => (e.columnDef.enableGlobalFilter ?? !0) && (t.options.enableGlobalFilter ?? !0) && (t.options.enableFilters ?? !0) && ((t.options.getColumnCanGlobalFilter == null ? void 0 : t.options.getColumnCanGlobalFilter(e)) ?? !0) && !!e.accessorFn;
	},
	createTable: (e) => {
		e.getGlobalAutoFilterFn = () => jp.includesString, e.getGlobalFilterFn = () => {
			let { globalFilterFn: t } = e.options;
			return dp(t) ? t : t === "auto" ? e.getGlobalAutoFilterFn() : e.options.filterFns?.[t] ?? jp[t];
		}, e.setGlobalFilter = (t) => {
			e.options.onGlobalFilterChange == null || e.options.onGlobalFilterChange(t);
		}, e.resetGlobalFilter = (t) => {
			e.setGlobalFilter(t ? void 0 : e.initialState.globalFilter);
		};
	}
}, Qp = {
	getInitialState: (e) => ({
		expanded: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onExpandedChange: up("expanded", e),
		paginateExpandedRows: !0
	}),
	createTable: (e) => {
		let t = !1, n = !1;
		e._autoResetExpanded = () => {
			if (!t) e._queue(() => {
				t = !0;
			});
			else if (e.options.autoResetAll ?? e.options.autoResetExpanded ?? !e.options.manualExpanding) {
				if (n) return;
				n = !0, e._queue(() => {
					e.resetExpanded(), n = !1;
				});
			}
		}, e.setExpanded = (t) => e.options.onExpandedChange == null ? void 0 : e.options.onExpandedChange(t), e.toggleAllRowsExpanded = (t) => {
			t ?? !e.getIsAllRowsExpanded() ? e.setExpanded(!0) : e.setExpanded({});
		}, e.resetExpanded = (t) => {
			e.setExpanded(t ? {} : e.initialState?.expanded ?? {});
		}, e.getCanSomeRowsExpand = () => e.getPrePaginationRowModel().flatRows.some((e) => e.getCanExpand()), e.getToggleAllRowsExpandedHandler = () => (t) => {
			t.persist == null || t.persist(), e.toggleAllRowsExpanded();
		}, e.getIsSomeRowsExpanded = () => {
			let t = e.getState().expanded;
			return t === !0 || Object.values(t).some(Boolean);
		}, e.getIsAllRowsExpanded = () => {
			let t = e.getState().expanded;
			return typeof t == "boolean" ? t === !0 : !(!Object.keys(t).length || e.getRowModel().flatRows.some((e) => !e.getIsExpanded()));
		}, e.getExpandedDepth = () => {
			let t = 0;
			return (e.getState().expanded === !0 ? Object.keys(e.getRowModel().rowsById) : Object.keys(e.getState().expanded)).forEach((e) => {
				let n = e.split(".");
				t = Math.max(t, n.length);
			}), t;
		}, e.getPreExpandedRowModel = () => e.getSortedRowModel(), e.getExpandedRowModel = () => (!e._getExpandedRowModel && e.options.getExpandedRowModel && (e._getExpandedRowModel = e.options.getExpandedRowModel(e)), e.options.manualExpanding || !e._getExpandedRowModel ? e.getPreExpandedRowModel() : e._getExpandedRowModel());
	},
	createRow: (e, t) => {
		e.toggleExpanded = (n) => {
			t.setExpanded((r) => {
				let i = r === !0 || !!(r != null && r[e.id]), a = {};
				if (r === !0 ? Object.keys(t.getRowModel().rowsById).forEach((e) => {
					a[e] = !0;
				}) : a = r, n ??= !i, !i && n) return {
					...a,
					[e.id]: !0
				};
				if (i && !n) {
					let { [e.id]: t, ...n } = a;
					return n;
				}
				return r;
			});
		}, e.getIsExpanded = () => {
			let n = t.getState().expanded;
			return !!((t.options.getIsRowExpanded == null ? void 0 : t.options.getIsRowExpanded(e)) ?? (n === !0 || n?.[e.id]));
		}, e.getCanExpand = () => {
			var n;
			return (t.options.getRowCanExpand == null ? void 0 : t.options.getRowCanExpand(e)) ?? ((t.options.enableExpanding ?? !0) && !!((n = e.subRows) != null && n.length));
		}, e.getIsAllParentsExpanded = () => {
			let n = !0, r = e;
			for (; n && r.parentId;) r = t.getRow(r.parentId, !0), n = r.getIsExpanded();
			return n;
		}, e.getToggleExpandedHandler = () => {
			let t = e.getCanExpand();
			return () => {
				t && e.toggleExpanded();
			};
		};
	}
}, $p = 0, em = 10, tm = () => ({
	pageIndex: $p,
	pageSize: em
}), nm = {
	getInitialState: (e) => ({
		...e,
		pagination: {
			...tm(),
			...e?.pagination
		}
	}),
	getDefaultOptions: (e) => ({ onPaginationChange: up("pagination", e) }),
	createTable: (e) => {
		let t = !1, n = !1;
		e._autoResetPageIndex = () => {
			if (!t) e._queue(() => {
				t = !0;
			});
			else if (e.options.autoResetAll ?? e.options.autoResetPageIndex ?? !e.options.manualPagination) {
				if (n) return;
				n = !0, e._queue(() => {
					e.resetPageIndex(), n = !1;
				});
			}
		}, e.setPagination = (t) => e.options.onPaginationChange == null ? void 0 : e.options.onPaginationChange((e) => lp(t, e)), e.resetPagination = (t) => {
			e.setPagination(t ? tm() : e.initialState.pagination ?? tm());
		}, e.setPageIndex = (t) => {
			e.setPagination((n) => {
				let r = lp(t, n.pageIndex), i = e.options.pageCount === void 0 || e.options.pageCount === -1 ? 2 ** 53 - 1 : e.options.pageCount - 1;
				return r = Math.max(0, Math.min(r, i)), {
					...n,
					pageIndex: r
				};
			});
		}, e.resetPageIndex = (t) => {
			var n;
			e.setPageIndex(t ? $p : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageIndex) ?? $p);
		}, e.resetPageSize = (t) => {
			var n;
			e.setPageSize(t ? em : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageSize) ?? em);
		}, e.setPageSize = (t) => {
			e.setPagination((e) => {
				let n = Math.max(1, lp(t, e.pageSize)), r = e.pageSize * e.pageIndex, i = Math.floor(r / n);
				return {
					...e,
					pageIndex: i,
					pageSize: n
				};
			});
		}, e.setPageCount = (t) => e.setPagination((n) => {
			let r = lp(t, e.options.pageCount ?? -1);
			return typeof r == "number" && (r = Math.max(-1, r)), {
				...n,
				pageCount: r
			};
		}), e.getPageOptions = Q(() => [e.getPageCount()], (e) => {
			let t = [];
			return e && e > 0 && (t = [...Array(e)].fill(null).map((e, t) => t)), t;
		}, $(e.options, "debugTable", "getPageOptions")), e.getCanPreviousPage = () => e.getState().pagination.pageIndex > 0, e.getCanNextPage = () => {
			let { pageIndex: t } = e.getState().pagination, n = e.getPageCount();
			return n === -1 || n !== 0 && t < n - 1;
		}, e.previousPage = () => e.setPageIndex((e) => e - 1), e.nextPage = () => e.setPageIndex((e) => e + 1), e.firstPage = () => e.setPageIndex(0), e.lastPage = () => e.setPageIndex(e.getPageCount() - 1), e.getPrePaginationRowModel = () => e.getExpandedRowModel(), e.getPaginationRowModel = () => (!e._getPaginationRowModel && e.options.getPaginationRowModel && (e._getPaginationRowModel = e.options.getPaginationRowModel(e)), e.options.manualPagination || !e._getPaginationRowModel ? e.getPrePaginationRowModel() : e._getPaginationRowModel()), e.getPageCount = () => e.options.pageCount ?? Math.ceil(e.getRowCount() / e.getState().pagination.pageSize), e.getRowCount = () => e.options.rowCount ?? e.getPrePaginationRowModel().rows.length;
	}
}, rm = () => ({
	top: [],
	bottom: []
}), im = {
	getInitialState: (e) => ({
		rowPinning: rm(),
		...e
	}),
	getDefaultOptions: (e) => ({ onRowPinningChange: up("rowPinning", e) }),
	createRow: (e, t) => {
		e.pin = (n, r, i) => {
			let a = r ? e.getLeafRows().map((e) => {
				let { id: t } = e;
				return t;
			}) : [], o = i ? e.getParentRows().map((e) => {
				let { id: t } = e;
				return t;
			}) : [], s = /* @__PURE__ */ new Set([
				...o,
				e.id,
				...a
			]);
			t.setRowPinning((e) => n === "bottom" ? {
				top: (e?.top ?? []).filter((e) => !(s != null && s.has(e))),
				bottom: [...(e?.bottom ?? []).filter((e) => !(s != null && s.has(e))), ...Array.from(s)]
			} : n === "top" ? {
				top: [...(e?.top ?? []).filter((e) => !(s != null && s.has(e))), ...Array.from(s)],
				bottom: (e?.bottom ?? []).filter((e) => !(s != null && s.has(e)))
			} : {
				top: (e?.top ?? []).filter((e) => !(s != null && s.has(e))),
				bottom: (e?.bottom ?? []).filter((e) => !(s != null && s.has(e)))
			});
		}, e.getCanPin = () => {
			let { enableRowPinning: n, enablePinning: r } = t.options;
			return typeof n == "function" ? n(e) : n ?? r ?? !0;
		}, e.getIsPinned = () => {
			let n = [e.id], { top: r, bottom: i } = t.getState().rowPinning, a = n.some((e) => r?.includes(e)), o = n.some((e) => i?.includes(e));
			return a ? "top" : o ? "bottom" : !1;
		}, e.getPinnedIndex = () => {
			let n = e.getIsPinned();
			return n ? ((n === "top" ? t.getTopRows() : t.getBottomRows())?.map((e) => {
				let { id: t } = e;
				return t;
			}))?.indexOf(e.id) ?? -1 : -1;
		};
	},
	createTable: (e) => {
		e.setRowPinning = (t) => e.options.onRowPinningChange == null ? void 0 : e.options.onRowPinningChange(t), e.resetRowPinning = (t) => e.setRowPinning(t ? rm() : e.initialState?.rowPinning ?? rm()), e.getIsSomeRowsPinned = (t) => {
			let n = e.getState().rowPinning;
			return t ? !!n[t]?.length : !!(n.top?.length || n.bottom?.length);
		}, e._getPinnedRows = (t, n, r) => (e.options.keepPinnedRows ?? !0 ? (n ?? []).map((t) => {
			let n = e.getRow(t, !0);
			return n.getIsAllParentsExpanded() ? n : null;
		}) : (n ?? []).map((e) => t.find((t) => t.id === e))).filter(Boolean).map((e) => ({
			...e,
			position: r
		})), e.getTopRows = Q(() => [e.getRowModel().rows, e.getState().rowPinning.top], (t, n) => e._getPinnedRows(t, n, "top"), $(e.options, "debugRows", "getTopRows")), e.getBottomRows = Q(() => [e.getRowModel().rows, e.getState().rowPinning.bottom], (t, n) => e._getPinnedRows(t, n, "bottom"), $(e.options, "debugRows", "getBottomRows")), e.getCenterRows = Q(() => [
			e.getRowModel().rows,
			e.getState().rowPinning.top,
			e.getState().rowPinning.bottom
		], (e, t, n) => {
			let r = /* @__PURE__ */ new Set([...t ?? [], ...n ?? []]);
			return e.filter((e) => !r.has(e.id));
		}, $(e.options, "debugRows", "getCenterRows"));
	}
}, am = {
	getInitialState: (e) => ({
		rowSelection: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onRowSelectionChange: up("rowSelection", e),
		enableRowSelection: !0,
		enableMultiRowSelection: !0,
		enableSubRowSelection: !0
	}),
	createTable: (e) => {
		e.setRowSelection = (t) => e.options.onRowSelectionChange == null ? void 0 : e.options.onRowSelectionChange(t), e.resetRowSelection = (t) => e.setRowSelection(t ? {} : e.initialState.rowSelection ?? {}), e.toggleAllRowsSelected = (t) => {
			e.setRowSelection((n) => {
				t = t === void 0 ? !e.getIsAllRowsSelected() : t;
				let r = { ...n }, i = e.getPreGroupedRowModel().flatRows;
				return t ? i.forEach((e) => {
					e.getCanSelect() && (r[e.id] = !0);
				}) : i.forEach((e) => {
					delete r[e.id];
				}), r;
			});
		}, e.toggleAllPageRowsSelected = (t) => e.setRowSelection((n) => {
			let r = t === void 0 ? !e.getIsAllPageRowsSelected() : t, i = { ...n };
			return e.getRowModel().rows.forEach((t) => {
				om(i, t.id, r, !0, e);
			}), i;
		}), e.getPreSelectedRowModel = () => e.getCoreRowModel(), e.getSelectedRowModel = Q(() => [e.getState().rowSelection, e.getCoreRowModel()], (t, n) => Object.keys(t).length ? sm(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, $(e.options, "debugTable", "getSelectedRowModel")), e.getFilteredSelectedRowModel = Q(() => [e.getState().rowSelection, e.getFilteredRowModel()], (t, n) => Object.keys(t).length ? sm(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, $(e.options, "debugTable", "getFilteredSelectedRowModel")), e.getGroupedSelectedRowModel = Q(() => [e.getState().rowSelection, e.getSortedRowModel()], (t, n) => Object.keys(t).length ? sm(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, $(e.options, "debugTable", "getGroupedSelectedRowModel")), e.getIsAllRowsSelected = () => {
			let t = e.getFilteredRowModel().flatRows, { rowSelection: n } = e.getState(), r = !!(t.length && Object.keys(n).length);
			return r && t.some((e) => e.getCanSelect() && !n[e.id]) && (r = !1), r;
		}, e.getIsAllPageRowsSelected = () => {
			let t = e.getPaginationRowModel().flatRows.filter((e) => e.getCanSelect()), { rowSelection: n } = e.getState(), r = !!t.length;
			return r && t.some((e) => !n[e.id]) && (r = !1), r;
		}, e.getIsSomeRowsSelected = () => {
			let t = Object.keys(e.getState().rowSelection ?? {}).length;
			return t > 0 && t < e.getFilteredRowModel().flatRows.length;
		}, e.getIsSomePageRowsSelected = () => {
			let t = e.getPaginationRowModel().flatRows;
			return !e.getIsAllPageRowsSelected() && t.filter((e) => e.getCanSelect()).some((e) => e.getIsSelected() || e.getIsSomeSelected());
		}, e.getToggleAllRowsSelectedHandler = () => (t) => {
			e.toggleAllRowsSelected(t.target.checked);
		}, e.getToggleAllPageRowsSelectedHandler = () => (t) => {
			e.toggleAllPageRowsSelected(t.target.checked);
		};
	},
	createRow: (e, t) => {
		e.toggleSelected = (n, r) => {
			let i = e.getIsSelected();
			t.setRowSelection((a) => {
				if (n = n === void 0 ? !i : n, e.getCanSelect() && i === n) return a;
				let o = { ...a };
				return om(o, e.id, n, r?.selectChildren ?? !0, t), o;
			});
		}, e.getIsSelected = () => {
			let { rowSelection: n } = t.getState();
			return cm(e, n);
		}, e.getIsSomeSelected = () => {
			let { rowSelection: n } = t.getState();
			return lm(e, n) === "some";
		}, e.getIsAllSubRowsSelected = () => {
			let { rowSelection: n } = t.getState();
			return lm(e, n) === "all";
		}, e.getCanSelect = () => typeof t.options.enableRowSelection == "function" ? t.options.enableRowSelection(e) : t.options.enableRowSelection ?? !0, e.getCanSelectSubRows = () => typeof t.options.enableSubRowSelection == "function" ? t.options.enableSubRowSelection(e) : t.options.enableSubRowSelection ?? !0, e.getCanMultiSelect = () => typeof t.options.enableMultiRowSelection == "function" ? t.options.enableMultiRowSelection(e) : t.options.enableMultiRowSelection ?? !0, e.getToggleSelectedHandler = () => {
			let t = e.getCanSelect();
			return (n) => {
				t && e.toggleSelected(n.target?.checked);
			};
		};
	}
}, om = (e, t, n, r, i) => {
	var a;
	let o = i.getRow(t, !0);
	n ? (o.getCanMultiSelect() || Object.keys(e).forEach((t) => delete e[t]), o.getCanSelect() && (e[t] = !0)) : delete e[t], r && (a = o.subRows) != null && a.length && o.getCanSelectSubRows() && o.subRows.forEach((t) => om(e, t.id, n, r, i));
};
function sm(e, t) {
	let n = e.getState().rowSelection, r = [], i = {}, a = function(e, t) {
		return e.map((e) => {
			var t;
			let o = cm(e, n);
			if (o && (r.push(e), i[e.id] = e), (t = e.subRows) != null && t.length && (e = {
				...e,
				subRows: a(e.subRows)
			}), o) return e;
		}).filter(Boolean);
	};
	return {
		rows: a(t.rows),
		flatRows: r,
		rowsById: i
	};
}
function cm(e, t) {
	return t[e.id] ?? !1;
}
function lm(e, t, n) {
	var r;
	if (!((r = e.subRows) != null && r.length)) return !1;
	let i = !0, a = !1;
	return e.subRows.forEach((e) => {
		if ((!a || i) && (e.getCanSelect() && (cm(e, t) ? a = !0 : i = !1), e.subRows && e.subRows.length)) {
			let n = lm(e, t);
			n === "all" ? a = !0 : (n === "some" && (a = !0), i = !1);
		}
	}), i ? "all" : a ? "some" : !1;
}
var um = /([0-9]+)/gm, dm = (e, t, n) => ym(vm(e.getValue(n)).toLowerCase(), vm(t.getValue(n)).toLowerCase()), fm = (e, t, n) => ym(vm(e.getValue(n)), vm(t.getValue(n))), pm = (e, t, n) => _m(vm(e.getValue(n)).toLowerCase(), vm(t.getValue(n)).toLowerCase()), mm = (e, t, n) => _m(vm(e.getValue(n)), vm(t.getValue(n))), hm = (e, t, n) => {
	let r = e.getValue(n), i = t.getValue(n);
	return r > i ? 1 : r < i ? -1 : 0;
}, gm = (e, t, n) => _m(e.getValue(n), t.getValue(n));
function _m(e, t) {
	return e === t ? 0 : e > t ? 1 : -1;
}
function vm(e) {
	return typeof e == "number" ? isNaN(e) || e === Infinity || e === -Infinity ? "" : String(e) : typeof e == "string" ? e : "";
}
function ym(e, t) {
	let n = e.split(um).filter(Boolean), r = t.split(um).filter(Boolean);
	for (; n.length && r.length;) {
		let e = n.shift(), t = r.shift(), i = parseInt(e, 10), a = parseInt(t, 10), o = [i, a].sort();
		if (isNaN(o[0])) {
			if (e > t) return 1;
			if (t > e) return -1;
		} else {
			if (isNaN(o[1])) return isNaN(i) ? -1 : 1;
			if (i > a) return 1;
			if (a > i) return -1;
		}
	}
	return n.length - r.length;
}
var bm = {
	alphanumeric: dm,
	alphanumericCaseSensitive: fm,
	text: pm,
	textCaseSensitive: mm,
	datetime: hm,
	basic: gm
}, xm = [
	vp,
	Jp,
	Rp,
	Bp,
	xp,
	Np,
	Xp,
	Zp,
	{
		getInitialState: (e) => ({
			sorting: [],
			...e
		}),
		getDefaultColumnDef: () => ({
			sortingFn: "auto",
			sortUndefined: 1
		}),
		getDefaultOptions: (e) => ({
			onSortingChange: up("sorting", e),
			isMultiSortEvent: (e) => e.shiftKey
		}),
		createColumn: (e, t) => {
			e.getAutoSortingFn = () => {
				let n = t.getFilteredRowModel().flatRows.slice(10), r = !1;
				for (let t of n) {
					let n = t?.getValue(e.id);
					if (Object.prototype.toString.call(n) === "[object Date]") return bm.datetime;
					if (typeof n == "string" && (r = !0, n.split(um).length > 1)) return bm.alphanumeric;
				}
				return r ? bm.text : bm.basic;
			}, e.getAutoSortDir = () => typeof t.getFilteredRowModel().flatRows[0]?.getValue(e.id) == "string" ? "asc" : "desc", e.getSortingFn = () => {
				if (!e) throw Error();
				return dp(e.columnDef.sortingFn) ? e.columnDef.sortingFn : e.columnDef.sortingFn === "auto" ? e.getAutoSortingFn() : t.options.sortingFns?.[e.columnDef.sortingFn] ?? bm[e.columnDef.sortingFn];
			}, e.toggleSorting = (n, r) => {
				let i = e.getNextSortingOrder(), a = n != null;
				t.setSorting((o) => {
					let s = o?.find((t) => t.id === e.id), c = o?.findIndex((t) => t.id === e.id), l = [], u, d = a ? n : i === "desc";
					return u = o != null && o.length && e.getCanMultiSort() && r ? s ? "toggle" : "add" : o != null && o.length && c !== o.length - 1 ? "replace" : s ? "toggle" : "replace", u === "toggle" && (a || i || (u = "remove")), u === "add" ? (l = [...o, {
						id: e.id,
						desc: d
					}], l.splice(0, l.length - (t.options.maxMultiSortColCount ?? 2 ** 53 - 1))) : l = u === "toggle" ? o.map((t) => t.id === e.id ? {
						...t,
						desc: d
					} : t) : u === "remove" ? o.filter((t) => t.id !== e.id) : [{
						id: e.id,
						desc: d
					}], l;
				});
			}, e.getFirstSortDir = () => e.columnDef.sortDescFirst ?? t.options.sortDescFirst ?? e.getAutoSortDir() === "desc" ? "desc" : "asc", e.getNextSortingOrder = (n) => {
				let r = e.getFirstSortDir(), i = e.getIsSorted();
				return i ? i !== r && (t.options.enableSortingRemoval ?? !0) && (!n || (t.options.enableMultiRemove ?? !0)) ? !1 : i === "desc" ? "asc" : "desc" : r;
			}, e.getCanSort = () => (e.columnDef.enableSorting ?? !0) && (t.options.enableSorting ?? !0) && !!e.accessorFn, e.getCanMultiSort = () => e.columnDef.enableMultiSort ?? t.options.enableMultiSort ?? !!e.accessorFn, e.getIsSorted = () => {
				let n = t.getState().sorting?.find((t) => t.id === e.id);
				return n ? n.desc ? "desc" : "asc" : !1;
			}, e.getSortIndex = () => t.getState().sorting?.findIndex((t) => t.id === e.id) ?? -1, e.clearSorting = () => {
				t.setSorting((t) => t != null && t.length ? t.filter((t) => t.id !== e.id) : []);
			}, e.getToggleSortingHandler = () => {
				let n = e.getCanSort();
				return (r) => {
					n && (r.persist == null || r.persist(), e.toggleSorting == null || e.toggleSorting(void 0, e.getCanMultiSort() ? t.options.isMultiSortEvent == null ? void 0 : t.options.isMultiSortEvent(r) : !1));
				};
			};
		},
		createTable: (e) => {
			e.setSorting = (t) => e.options.onSortingChange == null ? void 0 : e.options.onSortingChange(t), e.resetSorting = (t) => {
				e.setSorting(t ? [] : e.initialState?.sorting ?? []);
			}, e.getPreSortedRowModel = () => e.getGroupedRowModel(), e.getSortedRowModel = () => (!e._getSortedRowModel && e.options.getSortedRowModel && (e._getSortedRowModel = e.options.getSortedRowModel(e)), e.options.manualSorting || !e._getSortedRowModel ? e.getPreSortedRowModel() : e._getSortedRowModel());
		}
	},
	Ip,
	Qp,
	nm,
	im,
	am,
	Wp
];
function Sm(e) {
	let t = [...xm, ...e._features ?? []], n = { _features: t }, r = n._features.reduce((e, t) => Object.assign(e, t.getDefaultOptions == null ? void 0 : t.getDefaultOptions(n)), {}), i = (e) => n.options.mergeOptions ? n.options.mergeOptions(r, e) : {
		...r,
		...e
	}, a = { ...e.initialState ?? {} };
	n._features.forEach((e) => {
		a = (e.getInitialState == null ? void 0 : e.getInitialState(a)) ?? a;
	});
	let o = [], s = !1, c = {
		_features: t,
		options: {
			...r,
			...e
		},
		initialState: a,
		_queue: (e) => {
			o.push(e), s || (s = !0, Promise.resolve().then(() => {
				for (; o.length;) o.shift()();
				s = !1;
			}).catch((e) => setTimeout(() => {
				throw e;
			})));
		},
		reset: () => {
			n.setState(n.initialState);
		},
		setOptions: (e) => {
			let t = lp(e, n.options);
			n.options = i(t);
		},
		getState: () => n.options.state,
		setState: (e) => {
			n.options.onStateChange == null || n.options.onStateChange(e);
		},
		_getRowId: (e, t, r) => (n.options.getRowId == null ? void 0 : n.options.getRowId(e, t, r)) ?? `${r ? [r.id, t].join(".") : t}`,
		getCoreRowModel: () => (n._getCoreRowModel ||= n.options.getCoreRowModel(n), n._getCoreRowModel()),
		getRowModel: () => n.getPaginationRowModel(),
		getRow: (e, t) => {
			let r = (t ? n.getPrePaginationRowModel() : n.getRowModel()).rowsById[e];
			if (!r && (r = n.getCoreRowModel().rowsById[e], !r)) throw Error();
			return r;
		},
		_getDefaultColumnDef: Q(() => [n.options.defaultColumn], (e) => (e ??= {}, {
			header: (e) => {
				let t = e.header.column.columnDef;
				return t.accessorKey ? t.accessorKey : t.accessorFn ? t.id : null;
			},
			cell: (e) => {
				var t;
				return ((t = e.renderValue()) == null || t.toString == null ? void 0 : t.toString()) ?? null;
			},
			...n._features.reduce((e, t) => Object.assign(e, t.getDefaultColumnDef == null ? void 0 : t.getDefaultColumnDef()), {}),
			...e
		}), $(e, "debugColumns", "_getDefaultColumnDef")),
		_getColumnDefs: () => n.options.columns,
		getAllColumns: Q(() => [n._getColumnDefs()], (e) => {
			let t = function(e, r, i) {
				return i === void 0 && (i = 0), e.map((e) => {
					let a = hp(n, e, i, r), o = e;
					return a.columns = o.columns ? t(o.columns, a, i + 1) : [], a;
				});
			};
			return t(e);
		}, $(e, "debugColumns", "getAllColumns")),
		getAllFlatColumns: Q(() => [n.getAllColumns()], (e) => e.flatMap((e) => e.getFlatColumns()), $(e, "debugColumns", "getAllFlatColumns")),
		_getAllFlatColumnsById: Q(() => [n.getAllFlatColumns()], (e) => e.reduce((e, t) => (e[t.id] = t, e), {}), $(e, "debugColumns", "getAllFlatColumnsById")),
		getAllLeafColumns: Q(() => [n.getAllColumns(), n._getOrderColumnsFn()], (e, t) => t(e.flatMap((e) => e.getLeafColumns())), $(e, "debugColumns", "getAllLeafColumns")),
		getColumn: (e) => n._getAllFlatColumnsById()[e]
	};
	Object.assign(n, c);
	for (let e = 0; e < n._features.length; e++) {
		let t = n._features[e];
		t == null || t.createTable == null || t.createTable(n);
	}
	return n;
}
function Cm() {
	return (e) => Q(() => [e.options.data], (t) => {
		let n = {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, r = function(t, i, a) {
			i === void 0 && (i = 0);
			let o = [];
			for (let c = 0; c < t.length; c++) {
				let l = bp(e, e._getRowId(t[c], c, a), t[c], c, i, void 0, a?.id);
				if (n.flatRows.push(l), n.rowsById[l.id] = l, o.push(l), e.options.getSubRows) {
					var s;
					l.originalSubRows = e.options.getSubRows(t[c], c), (s = l.originalSubRows) != null && s.length && (l.subRows = r(l.originalSubRows, i + 1, l));
				}
			}
			return o;
		};
		return n.rows = r(t), n;
	}, $(e.options, "debugTable", "getRowModel", () => e._autoResetPageIndex()));
}
//#endregion
//#region node_modules/@tanstack/react-table/build/lib/index.mjs
function wm(e, t) {
	return e ? Tm(e) ? /*#__PURE__*/ _.createElement(e, t) : e : null;
}
function Tm(e) {
	return Em(e) || typeof e == "function" || Dm(e);
}
function Em(e) {
	return typeof e == "function" && (() => {
		let t = Object.getPrototypeOf(e);
		return t.prototype && t.prototype.isReactComponent;
	})();
}
function Dm(e) {
	return typeof e == "object" && typeof e.$$typeof == "symbol" && ["react.memo", "react.forward_ref"].includes(e.$$typeof.description);
}
function Om(e) {
	let t = {
		state: {},
		onStateChange: () => {},
		renderFallbackValue: null,
		...e
	}, [n] = _.useState(() => ({ current: Sm(t) })), [r, i] = _.useState(() => n.current.initialState);
	return n.current.setOptions((t) => ({
		...t,
		...e,
		state: {
			...r,
			...e.state
		},
		onStateChange: (t) => {
			i(t), e.onStateChange == null || e.onStateChange(t);
		}
	})), n.current;
}
//#endregion
//#region src/components/DataGrid.tsx
function km({ node: e, send: t, busy: n }) {
	let r = uc((t) => t.values[e.id]), i = uc((e) => e.set), [a, o] = (0, _.useState)(""), s = e.kind === "editor", c = e.selection_mode === "single-cell" && /^(exchange_weekly_matrix|test_week_preview)__/.test(e.id), l = s ? r ?? e.table?.rows ?? [] : e.table?.rows ?? [], u = e.table?.columns ?? [], d = (0, _.useMemo)(() => l.map((e, t) => ({
		...e,
		__index: t
	})).filter((e) => !a || Object.values(e).some((e) => String(e ?? "").includes(a))), [l, a]);
	function f(t, n, r) {
		let a = l.map((e, i) => i === t ? {
			...e,
			[n]: r
		} : e);
		i(e.id, a);
	}
	async function p(r, i) {
		if (n || e.on_select !== "rerun") return;
		let a = e.selection ?? {
			rows: [],
			cells: []
		}, o = String(e.selection_mode).includes("row"), s = [[r, i]];
		e.selection_mode === "multi-cell" && (s = a.cells.some((e) => e[0] === r && e[1] === i) ? a.cells.filter((e) => e[0] !== r || e[1] !== i) : [...a.cells, [r, i]]), await t("control", {
			control: e.id,
			values: { [e.id]: {
				rows: o ? [r] : [],
				cells: o ? [] : s
			} }
		});
	}
	let m = Om({
		data: d,
		columns: u.map((r) => ({
			id: r,
			accessorKey: r,
			header: e.column_config?.[r]?.label ?? r,
			cell: ({ row: i, getValue: a }) => {
				let o = i.original.__index, l = a(), d = e.column_config?.[r] ?? {};
				if (s && e.disabled !== !0 && !e.disabled?.includes?.(r)) {
					let e = `${o + 1}행 ${r}`;
					return d.kind === "CheckboxColumn" || typeof l == "boolean" ? /* @__PURE__ */ (0, k.jsx)("input", {
						"aria-label": e,
						type: "checkbox",
						checked: !!l,
						onChange: (e) => f(o, r, e.target.checked)
					}) : d.kind === "SelectboxColumn" ? /* @__PURE__ */ (0, k.jsxs)("select", {
						"aria-label": e,
						value: String(l ?? ""),
						onChange: (e) => f(o, r, e.target.value),
						children: [/* @__PURE__ */ (0, k.jsx)("option", {
							value: "",
							children: "선택"
						}), d.options?.map((e) => /* @__PURE__ */ (0, k.jsx)("option", { children: e }, e))]
					}) : /* @__PURE__ */ (0, k.jsx)("input", {
						"aria-label": e,
						type: d.kind === "DateColumn" ? "date" : d.kind === "NumberColumn" ? "number" : "text",
						value: l == null ? "" : String(l),
						min: d.min_value,
						max: d.max_value,
						step: d.step,
						onChange: (e) => f(o, r, d.kind === "NumberColumn" ? e.target.value === "" ? null : Number(e.target.value) : e.target.value)
					});
				}
				let m = String(l ?? ""), h = (e.selection?.cells ?? []).some((e) => e[0] === o && e[1] === r) || (e.selection?.rows ?? []).includes(o), g = m.includes("🧪") ? "test" : m.includes("🔄") ? "swap" : m.includes("🟢") ? "sub" : m.includes("🟡") ? "part" : m.includes("[결강]") ? "absence" : "";
				return e.on_select === "rerun" ? /* @__PURE__ */ (0, k.jsx)("button", {
					className: `cell ${g} ${h ? "selected" : ""}`,
					disabled: n,
					draggable: c && !!m && r !== u[0],
					onDragStart: (e) => e.dataTransfer.setData("application/timetable-cell", JSON.stringify([o, r])),
					onDragOver: (e) => {
						c && e.preventDefault();
					},
					onDrop: (n) => {
						if (!c) return;
						n.preventDefault();
						let i = n.dataTransfer.getData("application/timetable-cell");
						i && t("preview_swap", {
							control: e.id,
							source: JSON.parse(i),
							target: [o, r]
						});
					},
					"aria-pressed": h,
					"aria-label": `${i.original[u[0]] ?? o + 1} ${r}: ${m || "공강"}`,
					onClick: () => void p(o, r),
					children: m || /* @__PURE__ */ (0, k.jsx)("span", {
						className: "empty-cell",
						children: "—"
					})
				}) : /* @__PURE__ */ (0, k.jsx)("span", {
					className: `cell-read ${g}`,
					children: m || "—"
				});
			}
		})),
		getCoreRowModel: Cm()
	});
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: `grid-card ${s ? "editable" : ""}`,
		children: [
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "grid-top",
				children: [/* @__PURE__ */ (0, k.jsxs)("span", { children: [l.length, "개 항목"] }), /* @__PURE__ */ (0, k.jsxs)("label", {
					className: "table-search",
					children: [/* @__PURE__ */ (0, k.jsx)(Hs, { size: 14 }), /* @__PURE__ */ (0, k.jsx)("input", {
						"aria-label": "표 검색",
						placeholder: "표에서 찾기",
						value: a,
						onChange: (e) => o(e.target.value)
					})]
				})]
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "table-scroll",
				style: { maxHeight: e.height ?? 680 },
				children: [/* @__PURE__ */ (0, k.jsxs)("table", { children: [/* @__PURE__ */ (0, k.jsx)("thead", { children: m.getHeaderGroups().map((t) => /* @__PURE__ */ (0, k.jsxs)("tr", { children: [t.headers.map((e) => /* @__PURE__ */ (0, k.jsx)("th", { children: wm(e.column.columnDef.header, e.getContext()) }, e.id)), s && e.num_rows === "dynamic" && /* @__PURE__ */ (0, k.jsx)("th", { children: "삭제" })] }, t.id)) }), /* @__PURE__ */ (0, k.jsx)("tbody", { children: m.getRowModel().rows.map((t) => /* @__PURE__ */ (0, k.jsxs)("tr", { children: [t.getVisibleCells().map((e) => /* @__PURE__ */ (0, k.jsx)("td", { children: wm(e.column.columnDef.cell, e.getContext()) }, e.id)), s && e.num_rows === "dynamic" && /* @__PURE__ */ (0, k.jsx)("td", { children: /* @__PURE__ */ (0, k.jsx)(cp, {
					variant: "ghost",
					"aria-label": `${Number(t.original.__index) + 1}행 삭제`,
					onClick: () => i(e.id, l.filter((e, n) => n !== t.original.__index)),
					children: /* @__PURE__ */ (0, k.jsx)(Xs, { size: 14 })
				}) })] }, t.id)) })] }), !d.length && /* @__PURE__ */ (0, k.jsx)("p", {
					className: "empty-state",
					children: a ? "검색 결과가 없습니다." : "표시할 자료가 없습니다."
				})]
			}),
			s && e.num_rows === "dynamic" && /* @__PURE__ */ (0, k.jsxs)(cp, {
				onClick: () => {
					let t = Object.fromEntries(u.map((t) => {
						let n = e.column_config?.[t] ?? {};
						return [t, n.default ?? (n.kind === "CheckboxColumn" ? !1 : n.kind === "NumberColumn" ? 0 : "")];
					}));
					i(e.id, [...l, t]);
				},
				children: [/* @__PURE__ */ (0, k.jsx)(Bs, { size: 15 }), "행 추가"]
			}),
			s && /* @__PURE__ */ (0, k.jsx)("div", {
				className: "grid-note",
				children: "수정 후 해당 화면의 저장 또는 계산 버튼을 눌러 반영하세요."
			})
		]
	});
}
//#endregion
//#region src/components/Calendar.tsx
var Am = (e) => e.toISOString().slice(0, 10);
function jm({ node: e, send: t, busy: n, values: r }) {
	let i = /* @__PURE__ */ new Date(e.value + "T00:00:00Z"), [a, o] = (0, _.useState)(new Date(i.getUTCFullYear(), i.getUTCMonth(), 1)), [s, c] = (0, _.useState)(!1), l = (n) => {
		c(!1), t("control", {
			control: e.id,
			values: {
				...r(),
				[e.id]: Am(n)
			}
		});
	}, u = (t) => {
		let n = new Date(i);
		n.setUTCDate(n.getUTCDate() + t), e.week || (n.getUTCDay() === 6 && n.setUTCDate(n.getUTCDate() + (t > 0 ? 2 : -1)), n.getUTCDay() === 0 && n.setUTCDate(n.getUTCDate() + (t > 0 ? 1 : -2))), l(n);
	}, d = (new Date(Date.UTC(a.getFullYear(), a.getMonth(), 1)).getUTCDay() + 6) % 7, f = new Date(Date.UTC(a.getFullYear(), a.getMonth() + 1, 0)).getUTCDate(), p = [];
	for (let e = 0; e < Math.ceil((d + f) / 7); e++) for (let t = 0; t < 5; t++) {
		let n = e * 7 + t - d + 1;
		p.push(n > 0 && n <= f ? n : null);
	}
	let m = new Date(i);
	return m.setUTCDate(m.getUTCDate() + (e.include_saturday ? 5 : 4)), /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "calendar-control",
		children: [
			/* @__PURE__ */ (0, k.jsx)("span", {
				className: "calendar-label",
				children: e.label
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "date-controls",
				children: [
					/* @__PURE__ */ (0, k.jsx)(cp, {
						"aria-label": `${e.label} 이전 ${e.week ? "주" : "평일"}`,
						disabled: n,
						onClick: () => u(e.week ? -7 : -1),
						children: /* @__PURE__ */ (0, k.jsx)(ms, { size: 15 })
					}),
					/* @__PURE__ */ (0, k.jsxs)(cp, {
						disabled: n,
						"aria-expanded": s,
						onClick: () => c(!s),
						children: [
							/* @__PURE__ */ (0, k.jsx)(us, { size: 16 }),
							e.value,
							e.week ? ` ~ ${Am(m)}` : ""
						]
					}),
					/* @__PURE__ */ (0, k.jsx)(cp, {
						"aria-label": `${e.label} 다음 ${e.week ? "주" : "평일"}`,
						disabled: n,
						onClick: () => u(e.week ? 7 : 1),
						children: /* @__PURE__ */ (0, k.jsx)(gs, { size: 15 })
					})
				]
			}),
			s && /* @__PURE__ */ (0, k.jsxs)("div", {
				className: "calendar-popup card",
				children: [
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "calendar-heading",
						children: [
							/* @__PURE__ */ (0, k.jsx)(cp, {
								"aria-label": "이전 달",
								onClick: () => o(new Date(a.getFullYear(), a.getMonth() - 1, 1)),
								children: /* @__PURE__ */ (0, k.jsx)(ms, { size: 15 })
							}),
							/* @__PURE__ */ (0, k.jsxs)("strong", { children: [
								a.getFullYear(),
								"년 ",
								a.getMonth() + 1,
								"월"
							] }),
							/* @__PURE__ */ (0, k.jsx)(cp, {
								"aria-label": "다음 달",
								onClick: () => o(new Date(a.getFullYear(), a.getMonth() + 1, 1)),
								children: /* @__PURE__ */ (0, k.jsx)(gs, { size: 15 })
							})
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "calendar-days",
						children: [[
							"월",
							"화",
							"수",
							"목",
							"금"
						].map((e) => /* @__PURE__ */ (0, k.jsx)("span", { children: e }, e)), p.map((t, n) => t ? /* @__PURE__ */ (0, k.jsx)(cp, {
							"aria-label": `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, "0")}-${String(t).padStart(2, "0")}`,
							variant: e.value === Am(new Date(Date.UTC(a.getFullYear(), a.getMonth(), t))) ? "default" : "ghost",
							onClick: () => l(new Date(Date.UTC(a.getFullYear(), a.getMonth(), t))),
							children: t
						}, n) : /* @__PURE__ */ (0, k.jsx)("span", {}, n))]
					}),
					/* @__PURE__ */ (0, k.jsxs)("small", { children: ["월~금 기준", e.week ? " · 선택한 주의 월요일부터 조회" : ""] })
				]
			}),
			e.help && /* @__PURE__ */ (0, k.jsx)("small", { children: e.help })
		]
	});
}
//#endregion
//#region src/components/NodeRenderer.tsx
var Mm = {
	info: As,
	success: bs,
	error: vs,
	warning: vs,
	toast: bs
};
function Nm({ node: e, send: t, busy: n, values: r }) {
	let i = uc((t) => t.values[e.id]), a = uc((e) => e.set), o = (0, _.useId)(), s = fc((t) => t.items[e.id]), c = fc((e) => e.epoch), l = s?.progress ?? null, u = s?.message ?? "", d = (t) => fc.getState().set(e.id, { progress: t }, c), f = (t) => fc.getState().set(e.id, { message: t }, c), [p, m] = (0, _.useState)(""), h = i ?? e.value ?? "", g = (e.children ?? []).map((e) => /* @__PURE__ */ (0, k.jsx)(Nm, {
		node: e,
		send: t,
		busy: n,
		values: r
	}, e.id)), v = (n, i = !1) => {
		a(e.id, n), i && t("control", {
			control: e.id,
			values: {
				...r(),
				[e.id]: n
			}
		});
	}, y = n || e.disabled;
	async function b() {
		let n = [], r = 0;
		d(0);
		try {
			for (;;) {
				let i = await t("download_chunk", {
					control: e.id,
					offset: r
				});
				if (!i.success) throw Error(i.error?.message);
				let a = Uint8Array.from(atob(i.result.data), (e) => e.charCodeAt(0));
				if (n.push(a), r = i.result.next, d(Math.round(r / e.size * 100)), i.result.done) break;
			}
			let i = new Blob(n, { type: e.mime }), a = URL.createObjectURL(i), o = document.createElement("a");
			o.href = a, o.download = e.file_name, o.click(), setTimeout(() => URL.revokeObjectURL(a), 1e3);
		} catch (e) {
			f(String(e));
		} finally {
			d(null);
		}
	}
	async function x(n) {
		if (n) {
			if (f(""), n.size > e.maxBytes) f("50MB 이하 파일을 선택하세요.");
			else {
				d(0);
				try {
					let r = await t("upload_start", {
						control: e.id,
						size: n.size,
						name: n.name,
						mime: n.type
					});
					if (!r.success) throw Error(r.error?.message);
					let i = r.result.uploadId, a = r.result.chunkBytes;
					for (let r = 0, o = 0; r < n.size; r += a, o++) {
						let s = new Uint8Array(await n.slice(r, r + a).arrayBuffer()), c = "";
						for (let e of s) c += String.fromCharCode(e);
						let l = await t("upload_chunk", {
							control: e.id,
							uploadId: i,
							index: o,
							data: btoa(c)
						});
						if (!l.success) throw Error(l.error?.message);
						d(Math.round(l.result.received / n.size * 100));
					}
					let o = await crypto.subtle.digest("SHA-256", await n.arrayBuffer()), s = Array.from(new Uint8Array(o), (e) => e.toString(16).padStart(2, "0")).join(""), c = await t("upload_finish", {
						control: e.id,
						uploadId: i,
						sha256: s
					});
					if (!c.success) throw Error(c.error?.message);
					f(`${n.name} · 업로드 완료`);
				} catch (e) {
					f(String(e));
				} finally {
					d(null);
				}
			}
		}
	}
	switch (e.kind) {
		case "navigation": case "exam_meta": return null;
		case "columns": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: `columns ${e.children?.length === 5 || e.children?.length === 7 ? "compact-grid" : ""}`,
			style: { gridTemplateColumns: (e.weights ?? []).map((e) => `${e}fr`).join(" ") },
			children: g
		});
		case "column": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: "column",
			children: g
		});
		case "toolbar": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: "work-toolbar",
			children: g
		});
		case "form": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: "form card",
			children: g
		});
		case "container": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: e.border ? "card" : "region",
			children: g
		});
		case "tabs": return /* @__PURE__ */ (0, k.jsx)("div", { children: g });
		case "tab": return /* @__PURE__ */ (0, k.jsxs)("section", { children: [/* @__PURE__ */ (0, k.jsx)("h3", { children: e.label }), g] });
		case "expander": return /* @__PURE__ */ (0, k.jsxs)("details", {
			className: "card",
			open: e.expanded,
			children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: e.label }), /* @__PURE__ */ (0, k.jsx)("div", {
				className: "expander-body",
				children: g
			})]
		});
		case "dialog": return /* @__PURE__ */ (0, k.jsxs)(gr, {
			open: !0,
			onOpenChange: (e) => {
				!e && !n && t("close_dialog", {});
			},
			children: [/* @__PURE__ */ (0, k.jsx)(br, { className: "modal-overlay" }), /* @__PURE__ */ (0, k.jsxs)(wr, {
				className: "modal",
				onPointerDownOutside: (e) => {
					n && e.preventDefault();
				},
				onEscapeKeyDown: (e) => {
					n && e.preventDefault();
				},
				children: [
					/* @__PURE__ */ (0, k.jsx)(Or, {
						className: "modal-title",
						children: e.label
					}),
					/* @__PURE__ */ (0, k.jsx)(kr, {
						className: "sr-only",
						children: "선택 수업의 정보를 확인하고 작업하세요."
					}),
					/* @__PURE__ */ (0, k.jsx)(jr, {
						asChild: !0,
						children: /* @__PURE__ */ (0, k.jsx)(cp, {
							className: "modal-close",
							variant: "ghost",
							"aria-label": "닫기",
							children: /* @__PURE__ */ (0, k.jsx)(nc, { size: 19 })
						})
					}),
					/* @__PURE__ */ (0, k.jsx)("div", {
						className: "modal-body",
						children: g
					})
				]
			})]
		});
		case "title":
		case "header": return /* @__PURE__ */ (0, k.jsx)("h2", { children: e.label });
		case "subheader": return /* @__PURE__ */ (0, k.jsx)("h3", { children: e.label });
		case "caption": return /* @__PURE__ */ (0, k.jsx)("p", {
			className: "caption",
			children: e.label
		});
		case "divider": return /* @__PURE__ */ (0, k.jsx)("hr", {});
		case "metric": return /* @__PURE__ */ (0, k.jsxs)("div", {
			className: "metric",
			children: [
				/* @__PURE__ */ (0, k.jsx)("span", { children: e.label }),
				/* @__PURE__ */ (0, k.jsx)("strong", { children: String(e.value ?? "") }),
				e.delta && /* @__PURE__ */ (0, k.jsx)("small", { children: String(e.delta) })
			]
		});
		case "html":
		case "markdown": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: "prose",
			dangerouslySetInnerHTML: { __html: Ul.sanitize(e.kind === "html" ? e.label ?? "" : kd.parse(e.label ?? "", { async: !1 }), {
				FORBID_TAGS: [
					"style",
					"script",
					"iframe",
					"link"
				],
				FORBID_ATTR: ["style"]
			}) }
		});
		case "info":
		case "warning":
		case "error":
		case "success":
		case "toast": {
			let t = Mm[e.kind];
			return /* @__PURE__ */ (0, k.jsxs)("div", {
				className: `notice ${e.kind}`,
				role: e.kind === "error" ? "alert" : "status",
				children: [/* @__PURE__ */ (0, k.jsx)(t, { size: 17 }), /* @__PURE__ */ (0, k.jsx)("span", { children: e.label })]
			});
		}
		case "button": return /* @__PURE__ */ (0, k.jsxs)(cp, {
			title: e.help,
			disabled: y,
			variant: e.type === "primary" ? "default" : "outline",
			className: e.width === "stretch" ? "stretch" : "",
			onClick: () => void t("control", {
				control: e.id,
				values: r()
			}),
			children: [n && e.type === "primary" ? /* @__PURE__ */ (0, k.jsx)(Ms, {
				size: 15,
				className: "spin"
			}) : null, e.label]
		});
		case "text_input":
		case "text_area": return /* @__PURE__ */ (0, k.jsxs)("label", {
			className: "field",
			htmlFor: o,
			children: [
				/* @__PURE__ */ (0, k.jsx)("span", { children: e.label }),
				e.kind === "text_area" ? /* @__PURE__ */ (0, k.jsx)("textarea", {
					id: o,
					value: String(h),
					disabled: y,
					onChange: (e) => v(e.target.value)
				}) : /* @__PURE__ */ (0, k.jsx)("input", {
					id: o,
					value: String(h),
					disabled: y,
					placeholder: e.placeholder,
					onChange: (e) => v(e.target.value),
					onKeyDown: (n) => {
						n.key === "Enter" && t("control", {
							control: e.id,
							values: r()
						});
					}
				}),
				e.help && /* @__PURE__ */ (0, k.jsx)("small", { children: e.help })
			]
		});
		case "checkbox": return /* @__PURE__ */ (0, k.jsxs)("label", {
			className: "check",
			children: [/* @__PURE__ */ (0, k.jsx)("input", {
				type: "checkbox",
				disabled: y,
				checked: !!h,
				onChange: (e) => v(e.target.checked, !0)
			}), /* @__PURE__ */ (0, k.jsx)("span", { children: e.label })]
		});
		case "radio": return /* @__PURE__ */ (0, k.jsxs)("fieldset", {
			className: "field",
			children: [/* @__PURE__ */ (0, k.jsx)("legend", { children: e.label_visibility === "collapsed" ? "" : e.label }), /* @__PURE__ */ (0, k.jsx)("div", {
				className: "segments",
				children: e.options?.map((e) => /* @__PURE__ */ (0, k.jsx)(cp, {
					disabled: y,
					"aria-pressed": h === e.value,
					variant: h === e.value ? "default" : "outline",
					onClick: () => v(e.value, !0),
					children: e.label
				}, e.value))
			})]
		});
		case "selectbox": if(e.id==="exam_page")return null;return /* @__PURE__ */ (0, k.jsxs)("div", {
			className: "field",
			children: [
				/* @__PURE__ */ (0, k.jsx)("label", {
					htmlFor: o,
					children: e.label
				}),
				(e.options?.length ?? 0) > 8 && /* @__PURE__ */ (0, k.jsx)("input", {
					"aria-label": `${e.label} 검색`,
					placeholder: "검색하여 선택",
					value: p,
					onChange: (e) => m(e.target.value)
				}),
				/* @__PURE__ */ (0, k.jsx)("select", {
					id: o,
					value: h ?? "",
					disabled: y,
					onChange: (e) => v(Number(e.target.value), !0),
					children: e.options?.filter((e) => e.label.includes(p) || e.value === h).map((e) => /* @__PURE__ */ (0, k.jsx)("option", {
						value: e.value,
						children: e.label
					}, e.value))
				}),
				e.help && /* @__PURE__ */ (0, k.jsx)("small", { children: e.help })
			]
		});
		case "date_input": return /* @__PURE__ */ (0, k.jsxs)("label", {
			className: "field",
			children: [/* @__PURE__ */ (0, k.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, k.jsx)("input", {
				type: "date",
				value: String(h),
				disabled: y,
				onChange: (e) => v(e.target.value, !0)
			})]
		});
		case "calendar": return /* @__PURE__ */ (0, k.jsx)(jm, {
			node: e,
			send: t,
			busy: n,
			values: r
		});
		case "slider": return /* @__PURE__ */ (0, k.jsxs)("label", {
			className: "field",
			children: [/* @__PURE__ */ (0, k.jsxs)("span", { children: [
				e.label,
				" ",
				/* @__PURE__ */ (0, k.jsx)("strong", { children: String(h) })
			] }), /* @__PURE__ */ (0, k.jsx)("input", {
				type: "range",
				min: e.min_value,
				max: e.max_value,
				step: e.step,
				disabled: y,
				value: Number(h),
				onChange: (e) => v(Number(e.target.value)),
				onPointerUp: () => void t("control", {
					control: e.id,
					values: r()
				}),
				onKeyUp: () => void t("control", {
					control: e.id,
					values: r()
				})
			})]
		});
		case "table":
		case "editor": return /* @__PURE__ */ (0, k.jsx)(km, {
			node: e,
			send: t,
			busy: n
		});
		case "download": return /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsxs)(cp, {
			disabled: n || l !== null,
			onClick: () => void b(),
			children: [
				/* @__PURE__ */ (0, k.jsx)(ws, { size: 16 }),
				e.label,
				l === null ? "" : ` ${l}%`
			]
		}), u && /* @__PURE__ */ (0, k.jsx)("p", {
			role: "status",
			children: u
		})] });
		case "upload": return /* @__PURE__ */ (0, k.jsxs)("label", {
			className: "upload-zone",
			children: [
				/* @__PURE__ */ (0, k.jsx)(Qs, { size: 25 }),
				/* @__PURE__ */ (0, k.jsx)("strong", { children: e.label }),
				/* @__PURE__ */ (0, k.jsx)("span", { children: "PDF · PNG · JPG · WEBP / 최대 50MB" }),
				/* @__PURE__ */ (0, k.jsx)("input", {
					"aria-label": e.label,
					type: "file",
					accept: e.types.map((e) => "." + e).join(","),
					disabled: n || l !== null,
					onChange: (e) => void x(e.target.files?.[0])
				}),
				l !== null && /* @__PURE__ */ (0, k.jsx)("progress", {
					value: l,
					max: 100
				}),
				/* @__PURE__ */ (0, k.jsx)("small", {
					role: "status",
					children: u || (e.file_name ? `${e.file_name} · 업로드 완료` : "파일을 선택하여 업로드하세요.")
				})
			]
		});
		case "chart": return /* @__PURE__ */ (0, k.jsx)("div", {
			className: "card chart",
			children: e.table?.rows.map((t, n) => {
				let [r, i] = Object.values(t), a = Math.max(1, ...e.table.rows.map((e) => Number(Object.values(e)[1])));
				return /* @__PURE__ */ (0, k.jsxs)("div", {
					className: "bar-row",
					children: [
						/* @__PURE__ */ (0, k.jsx)("span", { children: String(r) }),
						/* @__PURE__ */ (0, k.jsx)("div", { children: /* @__PURE__ */ (0, k.jsx)("i", { style: { width: `${Number(i) / a * 100}%` } }) }),
						/* @__PURE__ */ (0, k.jsx)("strong", { children: String(i) })
					]
				}, n);
			})
		});
		default: return /* @__PURE__ */ (0, k.jsxs)("div", {
			role: "alert",
			className: "notice error",
			children: [
				/* @__PURE__ */ (0, k.jsx)(Es, { size: 16 }),
				"지원되지 않는 화면 요소: ",
				e.kind
			]
		});
	}
}
//#endregion

//#region exam supervision menu (precompiled dependency-free hotfix)
function Qm({pageNode:e,meta:t,navigate:n,busy:r,dirty:i,children:a}){
 const [o,s]=(0,_.useState)(!1),[d,c]=(0,_.useState)(null);
 const l=(e.options||[]).map(e=>e.label),u=l[Number(e.value)]||l[0]||"";
 const f=["시험일정 설정","교사 명단","수업시간표","자동 배정·직접 수정","공정성 분석"];
 const g=["교사 명단","감독 역할·강사 제외","배정불가 시간","수업시간표","겸임교사 일정","교사감독규칙","최적화 설정"];
 const step=u==="시험일정 설정"?0:["교사 명단","감독 역할·강사 제외","배정불가 시간","최적화 설정"].includes(u)?1:["수업시간표","겸임교사 일정","교사감독규칙"].includes(u)?2:u==="자동 배정·직접 수정"?3:["공정성 분석","배정 기록·인쇄"].includes(u)?4:-1;
 const groups=[["준비 현황",["시험감독 준비 현황"]],["조회",["교사별 감독 조회","전체 감독 시간표"]],["1. 시험일정",["시험일정 설정"]],["2. 교사 명단·조건",["교사 명단","감독 역할·강사 제외","배정불가 시간","최적화 설정"]],["3. 수업·겸임 일정",["수업시간표","겸임교사 일정","교사감독규칙"]],["4. 자동 배정·직접 수정",["자동 배정·직접 수정"]],["5. 공정성 분석·기록",["공정성 분석","배정 기록·인쇄"]],["설정 · 진단",["연결·조회 권한","저장 주체·연결 진단"]]];
 const move=x=>{let y=l.indexOf(x);if(y<0||y===Number(e.value)||r)return;i?c(y):n(y);s(!1)};
 const link=x=>(0,k.jsx)("button",{className:"exam-nav-link "+(g.includes(x)?"subitem ":"")+(u===x?"active":""),disabled:r,"aria-current":u===x?"page":void 0,onClick:()=>move(x),children:x},x);
 const btn=(label,onClick,disabled)=>(0,k.jsx)("button",{className:"btn btn-outline",disabled,onClick,children:label});
 return (0,k.jsxs)("div",{className:"exam-shell",children:[
 (0,k.jsxs)("aside",{className:"exam-navigation",children:[(0,k.jsxs)("div",{className:"exam-side-head",children:[(0,k.jsx)("strong",{children:"▦ 시험감독 업무"}),btn(o?"메뉴 접기":"메뉴 열기",()=>s(!o),!1)]}),
 (0,k.jsx)("nav",{"aria-label":"시험감독 메뉴",className:"exam-menu "+(o?"is-open":""),children:groups.map(([title,items])=>{let found=items.filter(x=>l.includes(x));return found.length?(0,k.jsxs)("div",{className:"exam-nav-section",children:[(0,k.jsx)("p",{children:title}),found.map(link)]},title):null})})]}),
 (0,k.jsxs)("div",{className:"exam-stage-main",children:[t?.admin&&(0,k.jsx)("div",{className:"exam-progress","aria-label":"시험감독 5단계 작업 순서",children:f.map((v,j)=>(0,k.jsxs)("button",{className:"exam-progress-step "+(step===j?"current":""),disabled:r,"aria-current":step===j?"step":void 0,onClick:()=>move(v),children:[(0,k.jsx)("span",{className:"exam-progress-number",children:j+1}),(0,k.jsxs)("span",{children:[(0,k.jsx)("strong",{children:["시험일정","교사 명단·조건","수업·겸임 일정","자동 배정·직접 수정","공정성 분석"][j]}),(0,k.jsx)("small",{children:(step===j?"현재 단계 · ":"")+(t?.steps?.[j]?.state||"확인 필요")})]})]},j))}),
 t?.overview?.sheet&&(0,k.jsxs)("div",{className:"exam-context",children:[(0,k.jsx)("span",{children:"연결 시트: "+t.overview.sheet}),(0,k.jsx)("span",{children:t.overview.writable?"시험감독 저장 가능":"읽기 전용 · "+t.overview.readOnlyReason})]}),a,
 t?.admin&&step>=0&&(0,k.jsxs)("div",{className:"exam-page-steps",children:[btn("← 이전 단계",()=>move(f[Math.max(0,step-1)]),r||step===0),(0,k.jsx)("span",{children:"저장은 각 단계의 해당 저장 버튼으로 수행하세요."}),btn("다음 단계 →",()=>move(f[Math.min(4,step+1)]),r||step===4)]})]}),
 d!==null&&(0,k.jsx)("div",{className:"exam-confirm-overlay",children:(0,k.jsxs)("section",{className:"exam-confirm",role:"alertdialog","aria-modal":!0,"aria-labelledby":"exam-dirty-title",children:[(0,k.jsx)("h3",{id:"exam-dirty-title",children:"저장하지 않은 변경사항"}),(0,k.jsx)("p",{children:"입력값을 유지하고 이동할 수 있지만 Google Sheets에 저장되는 것은 아닙니다. 다시 돌아와 저장하세요."}),(0,k.jsxs)("div",{className:"exam-confirm-buttons",children:[btn("취소하고 저장 작업 계속",()=>c(null),!1),btn("입력 유지하고 이동",()=>{n(d);c(null)},!1)]})]})})]});
}
//#endregion

//#region src/App.tsx
function Pm({ data: e, transport: t, onReady: n }) {
	(0, _.useEffect)(() => {
		n?.();
	}, [n]);
	let [r, i] = (0, _.useState)(!1), [a, o] = (0, _.useState)(""), s = (0, _.useRef)(!1), { collapsed: c, search: l, settings: u, update: d } = dc(), f = (e) => d({ collapsed: e }), p = (e) => d({ search: e }), m = (e) => d({ settings: e }), h = uc((e) => e.values), g = uc((e) => e.clear), v = rc(e.nodes).find((e) => e.kind === "navigation")?.tabs ?? [], y = rc(e.nodes), b = [
		"text_input",
		"text_area",
		"selectbox",
		"radio",
		"checkbox",
		"slider",
		"date_input",
		"editor"
	], x = () => Object.fromEntries(y.filter((e) => b.includes(e.kind) && e.disabled !== true && e.id in h).map((e) => [e.id, h[e.id]])), S = async (n, r) => {
		if (s.current && !n.endsWith("chunk")) return o("이전 작업이 처리 중입니다."), {
			operation: n,
			requestId: "",
			success: !1,
			result: null,
			error: {
				code: "Busy",
				message: "이전 작업이 처리 중입니다."
			},
			dataVersion: e.dataVersion
		};
		s.current = !0, i(!0), o("");
		try {
			let e = await t(n, r);
			return e.success ? !n.startsWith("upload_") && n !== "download_chunk" && (!(n==="control"&&Boolean(ep))||/^(exam_save_|exam_bulk_(classes|schedule)_save|exam_copy_save|exam_job_apply|exam_update|exam_swap|exam_role_swap|exam_repair|exam_handoff)/.test(String(r.control??""))) && g() : o(e.error?.message ?? "작업을 완료하지 못했습니다."), e;
		} catch (t) {
			let r = t instanceof Error ? t.message : String(t);
			return o(r), {
				operation: n,
				requestId: "",
				success: !1,
				result: null,
				error: {
					code: "TransportError",
					message: r
				},
				dataVersion: e.dataVersion
			};
		} finally {
			s.current = !1, i(!1);
		}
	};
	(0, _.useEffect)(() => {
		e.loggedIn || (g(), fc.getState().clear());
	}, [e.loggedIn, g]), (0, _.useEffect)(() => {
		let e = window.matchMedia("(max-width:1024px)"), t = () => dc.getState().update({ collapsed: e.matches });
		return e.addEventListener("change", t), () => e.removeEventListener("change", t);
	}, []);
	function C(e) {
		return e.includes("호봉") ? Os : e.includes("권한") ? Ks : e.includes("맞교환") || e.includes("테스트") ? cs : e.includes("통계") ? fs : e.includes("강사") ? ec : e.includes("복무") || e.includes("출장") ? Ss : us;
	}
	let w = e.theme === "black" ? "dark" : "light", T = String(e.activeTab ?? "로그인").replace(/^[^가-힣A-Za-z]+/, ""), ee = e.nodes.filter((e) => e.kind !== "navigation"&&e.kind!=="exam_meta"&&e.id!=="exam_page"), ep = y.find(e=>e.id==="exam_page"&&e.kind==="selectbox"), em = y.find(e=>e.kind==="exam_meta"), dirty = y.some(e=>e.id in h&&(e.id.startsWith("exam_")||e.id.startsWith("exam_grid_"))&&JSON.stringify(h[e.id])!==JSON.stringify(e.kind==="editor"?e.table?.rows:e.value)), E = (t, n = e.font) => void S("preferences", {
		theme: t,
		font: n
	});
	return /* @__PURE__ */ (0, k.jsx)(Do, { children: /* @__PURE__ */ (0, k.jsxs)("div", {
		className: `timetable-app ${w} ${c ? "sidebar-closed" : ""} ${e.loggedIn ? "" : "login-app"}`,
		style: { fontFamily: e.fontOptions[e.font] },
		children: [
			e.loggedIn && /* @__PURE__ */ (0, k.jsxs)("aside", {
				className: "sidebar",
				children: [
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "brand",
						children: [
							/* @__PURE__ */ (0, k.jsx)("span", {
								className: "brand-mark",
								children: /* @__PURE__ */ (0, k.jsx)(us, { size: 22 })
							}),
							/* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("strong", { children: "Timetable" }), /* @__PURE__ */ (0, k.jsx)("small", { children: e.school })] }),
							/* @__PURE__ */ (0, k.jsx)(cp, {
								"aria-label": "사이드바 접기",
								variant: "ghost",
								onClick: () => f(!0),
								children: /* @__PURE__ */ (0, k.jsx)(Rs, { size: 17 })
							})
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "nav-search",
						children: [/* @__PURE__ */ (0, k.jsx)(Hs, { size: 15 }), /* @__PURE__ */ (0, k.jsx)("input", {
							"aria-label": "메뉴 검색",
							placeholder: "업무 찾기",
							value: l,
							onChange: (e) => p(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, k.jsx)("nav", {
						"aria-label": "업무 메뉴",
						children: [
							"수업 운영",
							"교무 행정",
							"관리"
						].map((t) => {
							let n = v.filter((e) => t === "관리" ? e.includes("권한") : t === "교무 행정" ? e.includes("호봉") || e.includes("복무") || e.includes("출장") : !e.includes("권한") && !e.includes("호봉") && !e.includes("복무") && !e.includes("출장")).filter((e) => e.includes(l));
							return n.length ? /* @__PURE__ */ (0, k.jsxs)("div", {
								className: "nav-group",
								children: [/* @__PURE__ */ (0, k.jsx)("p", { children: t }), n.map((t) => {
									let n = C(t);
									return /* @__PURE__ */ (0, k.jsxs)("button", {
										disabled: r,
										"aria-current": t === e.activeTab ? "page" : void 0,
										className: t === e.activeTab ? "nav-item active" : "nav-item",
										onClick: () => void S("navigate", { tab: t }),
										children: [
											/* @__PURE__ */ (0, k.jsx)(n, { size: 17 }),
											/* @__PURE__ */ (0, k.jsx)("span", { children: t.replace(/^[^가-힣A-Za-z]+/, "") }),
											t === e.activeTab && /* @__PURE__ */ (0, k.jsx)(gs, { size: 14 })
										]
									}, t);
								})]
							}, t) : null;
						})
					}),
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "sidebar-footer",
						children: [/* @__PURE__ */ (0, k.jsx)("span", {
							className: "avatar",
							children: e.user.name.slice(0, 1) || "교"
						}), /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("strong", { children: e.user.name }), /* @__PURE__ */ (0, k.jsx)("small", { children: e.user.role })] })]
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "main-shell",
				children: [
					/* @__PURE__ */ (0, k.jsxs)("header", {
						className: "top-header",
						children: [/* @__PURE__ */ (0, k.jsxs)("div", {
							className: "header-left",
							children: [e.loggedIn && /* @__PURE__ */ (0, k.jsx)(cp, {
								variant: "ghost",
								"aria-label": "메뉴 열기",
								onClick: () => f(!c),
								children: /* @__PURE__ */ (0, k.jsx)(Ps, { size: 20 })
							}), /* @__PURE__ */ (0, k.jsxs)("span", {
								className: "breadcrumb",
								children: [
									e.school,
									/* @__PURE__ */ (0, k.jsx)(gs, { size: 13 }),
									/* @__PURE__ */ (0, k.jsx)("strong", { children: T })
								]
							})]
						}), /* @__PURE__ */ (0, k.jsxs)("div", {
							className: "header-actions",
							children: [
								/* @__PURE__ */ (0, k.jsx)("span", {
									className: `sync-label ${r ? "pending" : ""}`,
									children: r ? /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [/* @__PURE__ */ (0, k.jsx)("span", { className: "loading-dot" }), "처리 중"] }) : /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [/* @__PURE__ */ (0, k.jsx)(bs, { size: 14 }), e.writable ? "연결됨" : "읽기 전용"] })
								}),
								/* @__PURE__ */ (0, k.jsxs)(jo, { children: [/* @__PURE__ */ (0, k.jsx)(No, {
									asChild: !0,
									children: /* @__PURE__ */ (0, k.jsx)(cp, {
										variant: "ghost",
										"aria-label": w === "dark" ? "라이트 테마" : "다크 테마",
										disabled: r,
										onClick: () => E(w === "dark" ? "light" : "black"),
										children: w === "dark" ? /* @__PURE__ */ (0, k.jsx)(Js, { size: 18 }) : /* @__PURE__ */ (0, k.jsx)(Is, { size: 18 })
									})
								}), /* @__PURE__ */ (0, k.jsx)(Lo, {
									className: "tooltip",
									children: "화면 테마"
								})] }),
								/* @__PURE__ */ (0, k.jsx)(cp, {
									variant: "ghost",
									"aria-label": "설정",
									onClick: () => m(!0),
									children: /* @__PURE__ */ (0, k.jsx)(Ws, { size: 18 })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, k.jsxs)("main", {
						"aria-busy": r,
						children: [
							/* @__PURE__ */ (0, k.jsxs)("div", {
								className: "page-heading",
								children: [/* @__PURE__ */ (0, k.jsxs)("div", { children: [
									/* @__PURE__ */ (0, k.jsxs)("span", {
										className: "eyebrow",
										children: ["SCHOOL OPERATIONS · ", e.date]
									}),
									/* @__PURE__ */ (0, k.jsx)("h1", { children: e.loggedIn ? T : "학교 업무의 새로운 흐름" }),
									/* @__PURE__ */ (0, k.jsx)("p", { children: e.loggedIn ? "시간표와 교무 업무를 한 곳에서 관리하세요." : "기존 아이디로 로그인하여 업무를 시작하세요." })
								] }), e.loggedIn && /* @__PURE__ */ (0, k.jsxs)("span", {
									className: "date-chip",
									children: [/* @__PURE__ */ (0, k.jsx)(us, { size: 15 }), e.date]
								})]
							}),
							a && /* @__PURE__ */ (0, k.jsxs)("div", {
								role: "alert",
								className: "notice error",
								children: [
									/* @__PURE__ */ (0, k.jsx)(vs, { size: 18 }),
									a,
									/* @__PURE__ */ (0, k.jsx)(cp, {
										variant: "ghost",
										onClick: () => o(""),
										children: "닫기"
									})
								]
							}),
							/* @__PURE__ */ (0, k.jsx)("div", {
								className: e.loggedIn ? "workspace" : "login-workspace",
								children: ep ? /* @__PURE__ */ (0,k.jsx)(Qm,{pageNode:ep,meta:em,dirty:dirty||Boolean(em?.unsavedForm),busy:r,navigate:i=>void S("control",{control:"exam_page",values:{exam_page:i}}),children:/* @__PURE__ */ (0,k.jsx)("div",{className:"exam-content",children:ee.map(e=>/* @__PURE__ */(0,k.jsx)(Nm,{node:e,send:S,busy:r,values:x},e.id))})}) : ee.map((e) => /* @__PURE__ */ (0, k.jsx)(Nm, {
									node: e,
									send: S,
									busy: r,
									values: x
								}, e.id))
							})
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("footer", {
						className: "app-footer",
						children: [e.school, " · 시간표 및 교무행정"]
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsxs)(gr, {
				open: !!e.swapPreview,
				onOpenChange: (e) => {
					!e && !s.current && S("cancel_swap_preview", {});
				},
				children: [/* @__PURE__ */ (0, k.jsx)(br, { className: "modal-overlay" }), /* @__PURE__ */ (0, k.jsxs)(wr, {
					className: "modal settings-modal",
					onPointerDownOutside: (e) => {
						r && e.preventDefault();
					},
					onEscapeKeyDown: (e) => {
						r && e.preventDefault();
					},
					children: [
						/* @__PURE__ */ (0, k.jsx)(Or, {
							className: "modal-title",
							children: e.swapPreview?.test ? "테스트 교환 미리보기" : "맞교환 적용 전 확인"
						}),
						/* @__PURE__ */ (0, k.jsx)(kr, { children: "Python 검증을 통과한 동일 학급 1:1 맞교환입니다. 적용할 내용을 확인하세요." }),
						e.swapPreview && /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
							/* @__PURE__ */ (0, k.jsxs)("div", {
								className: "card",
								children: [
									/* @__PURE__ */ (0, k.jsxs)("strong", { children: [
										e.swapPreview.a.교사명,
										" ↔ ",
										e.swapPreview.b.교사명
									] }),
									/* @__PURE__ */ (0, k.jsxs)("span", { children: [
										e.swapPreview.a.일자,
										" ",
										e.swapPreview.a.교시,
										"교시 · ",
										e.swapPreview.a.학급,
										" ",
										e.swapPreview.a.과목
									] }),
									/* @__PURE__ */ (0, k.jsxs)("span", { children: [
										e.swapPreview.b.일자,
										" ",
										e.swapPreview.b.교시,
										"교시 · ",
										e.swapPreview.b.학급,
										" ",
										e.swapPreview.b.과목
									] })
								]
							}),
							/* @__PURE__ */ (0, k.jsx)(cp, {
								disabled: r,
								variant: "default",
								onClick: () => void S("apply_swap_preview", { token: e.swapPreview.token }),
								children: e.swapPreview.test ? "테스트에 적용" : "확인 후 저장"
							}),
							/* @__PURE__ */ (0, k.jsx)(cp, {
								disabled: r,
								onClick: () => void S("cancel_swap_preview", {}),
								children: "취소"
							})
						] })
					]
				})]
			}),
			/* @__PURE__ */ (0, k.jsxs)(gr, {
				open: u,
				onOpenChange: m,
				children: [/* @__PURE__ */ (0, k.jsx)(br, { className: "modal-overlay" }), /* @__PURE__ */ (0, k.jsxs)(wr, {
					className: "modal settings-modal",
					children: [
						/* @__PURE__ */ (0, k.jsx)(Or, {
							className: "modal-title",
							children: "화면 설정"
						}),
						/* @__PURE__ */ (0, k.jsx)(kr, { children: "테마와 글꼴은 화면을 이동해도 유지됩니다." }),
						/* @__PURE__ */ (0, k.jsxs)("div", {
							className: "segments",
							children: [/* @__PURE__ */ (0, k.jsx)(cp, {
								onClick: () => E("light"),
								children: "Light"
							}), /* @__PURE__ */ (0, k.jsx)(cp, {
								onClick: () => E("black"),
								children: "Dark"
							})]
						}),
						/* @__PURE__ */ (0, k.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, k.jsx)("span", { children: "글꼴" }), /* @__PURE__ */ (0, k.jsx)("select", {
								value: e.font,
								onChange: (t) => E(e.theme, t.target.value),
								children: Object.keys(e.fontOptions).map((e) => /* @__PURE__ */ (0, k.jsx)("option", { children: e }, e))
							})]
						}),
						/* @__PURE__ */ (0, k.jsx)(jr, {
							asChild: !0,
							children: /* @__PURE__ */ (0, k.jsx)(cp, { children: "닫기" })
						})
					]
				})]
			})
		]
	}) });
}
//#endregion
//#region src/components/AppErrorBoundary.tsx
var Fm = class extends _.Component {
	state = { failed: !1 };
	static getDerivedStateFromError() {
		return { failed: !0 };
	}
	componentDidCatch(e, t) {
		console.error("Timetable UI render failed", e, t.componentStack);
	}
	render() {
		return this.state.failed ? /* @__PURE__ */ (0, k.jsxs)("section", {
			role: "alert",
			className: "timetable-render-error",
			style: {
				padding: "2rem",
				maxWidth: 640,
				margin: "5rem auto",
				fontFamily: "sans-serif"
			},
			children: [
				/* @__PURE__ */ (0, k.jsx)("h1", { children: "시간표 화면을 표시하지 못했습니다." }),
				/* @__PURE__ */ (0, k.jsx)("p", { children: "저장 작업이 진행되었을 수 있습니다. 다시 실행하기 전에 최신 시간표와 작업 이력을 확인해 주세요." }),
				/* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					onClick: () => this.setState({ failed: !1 }),
					children: "화면 다시 표시"
				})
			]
		}) : this.props.children;
	}
}, Im = /* @__PURE__ */ new WeakMap();
function Lm(e) {
	try {
		return Rm(e);
	} catch (t) {
		console.error("Timetable bootstrap failed", t);
		let n = e.parentElement?.querySelector("#timetable-root");
		if (!n) throw t;
		let r = document.createElement("section");
		r.setAttribute("role", "alert"), r.style.cssText = "padding:24px;font-family:system-ui,sans-serif;color:#991b1b;background:#fff";
		let i = document.createElement("h1");
		i.textContent = "시간표 화면 초기화에 실패했습니다.";
		let a = document.createElement("p");
		return a.textContent = "페이지를 새로고침하고 frontend/dist 빌드 파일을 확인하세요. 오류 유형: " + (t instanceof Error ? t.name : "Error"), r.append(i, a), n.replaceChildren(r), () => {};
	}
}
function Rm(e) {
	if (!e.data || !Array.isArray(e.data.nodes) || !e.data.fontOptions) throw Error("Invalid startup snapshot");
	if (!document.getElementById("timetable-host-layout")) {
		let e = document.createElement("style");
		e.id = "timetable-host-layout", e.textContent = "[data-testid=\"stHeader\"]{display:none!important}[data-testid=\"stMainBlockContainer\"]{padding:0!important;max-width:none!important}.block-container{padding:0!important;max-width:none!important}", document.head.appendChild(e);
	}
	let t = {
		Pretendard: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css",
		"Noto Sans KR": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap",
		Inter: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
	}[e.data.font];
	if (t && !document.querySelector(`link[href="${t}"]`)) {
		let e = document.createElement("link");
		e.rel = "stylesheet", e.href = t, document.head.appendChild(e);
	}
	if (!document.getElementById("timetable-github-fonts")) {
		let e = document.createElement("style");
		e.id = "timetable-github-fonts", e.textContent = "@font-face{font-family:\"Pse Noto Sans KR\";font-weight:300 600;src:url(\"https://cdn.jsdelivr.net/gh/pse915/Timetable@main/NotoSansKR-Light.ttf\") format(\"truetype\");font-display:swap}@font-face{font-family:\"Pse Noto Sans KR\";font-weight:700;src:url(\"https://cdn.jsdelivr.net/gh/pse915/Timetable@main/NotoSansKR-Bold.ttf\") format(\"truetype\");font-display:swap}@font-face{font-family:\"Hakgyoansim Wooju R\";src:url(\"https://cdn.jsdelivr.net/gh/pse915/Timetable@main/HakgyoansimWoojuR.ttf\") format(\"truetype\");font-display:swap}", document.head.appendChild(e);
	}
	let n = e.parentElement, r = n.querySelector("#timetable-root");
	if (!r) throw Error("Timetable mount point is missing");
	let i = Im.get(n);
	i ? (i.current = e.data, i.setStateValue = e.setStateValue) : (i = {
		root: (0, v.createRoot)(r),
		current: e.data,
		setStateValue: e.setStateValue,
		pending: /* @__PURE__ */ new Map()
	}, Im.set(n, i));
	let a = i, o = a.current.response;
	if (o) {
		let e = a.pending.get(o.requestId);
		e && (clearTimeout(e.timer), a.pending.delete(o.requestId), e.resolve(o));
	}
	return a.root.render(/* @__PURE__ */ (0, k.jsx)(Fm, { children: /* @__PURE__ */ (0, k.jsx)(Pm, {
		data: a.current,
		transport: (e, t) => new Promise((r, i) => {
			if (Im.get(n) !== a) {
				i(/* @__PURE__ */ Error("시간표 화면이 종료되었습니다."));
				return;
			}
			let o = crypto.randomUUID(), s = {
				operation: e,
				requestId: o,
				payload: t,
				dataVersion: a.current.dataVersion
			}, c = setTimeout(() => {
				a.pending.delete(o), i(/* @__PURE__ */ Error("서버 응답을 확인하지 못했습니다. 저장 작업은 다시 누르기 전에 최신 자료를 확인하세요."));
			}, 12e4);
			a.pending.set(o, {
				resolve: r,
				reject: i,
				timer: c
			});
			try {
				a.setStateValue("request", s);
			} catch (e) {
				clearTimeout(c), a.pending.delete(o), i(e instanceof Error ? e : Error(String(e)));
			}
		}),
		onReady: () => {
			let e = a.current.frontendRelease;
			e && a.readySent !== e && (a.setStateValue("ready", e), a.readySent = e);
		}
	}) })), () => {
		if (Im.get(n) === a) {
			for (let e of a.pending.values()) clearTimeout(e.timer), e.reject(/* @__PURE__ */ Error("화면 연결이 종료되었습니다. 저장 결과를 확인하세요."));
			a.pending.clear(), a.root.unmount(), Im.delete(n);
		}
	};
}
//#endregion
export { Lm as default };
