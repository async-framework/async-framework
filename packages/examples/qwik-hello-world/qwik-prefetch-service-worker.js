(() => {
  const t = Number.MAX_SAFE_INTEGER >>> 1;
  function n(n, i) {
    const [o, s] = c(i), a = n.t.find((t) => o === t.i);
    if (a) {
      return n.o("intercepting", i.pathname),
        e(n, a, [s], t).then(() =>
          function (t, n) {
            const e = t.u.find((t) => t.l.pathname === n.pathname);
            return e
              ? e.$.then((t) => t.clone())
              : (t.o("CACHE HIT", n.pathname), t.h(n));
          }(n, i)
        );
    }
  }
  async function e(n, e, o, c) {
    const a = new Map();
    o.forEach((t) => s(e, a, t, c)),
      await Promise.all(
        Array.from(a.entries()).map(([i, o]) =>
          async function (n, e, i) {
            let o = n.u.find((t) => t.l.pathname === e.pathname);
            const s = i >= t ? "direct" : "prefetch";
            if (o) {
              const t = o.p ? "fetching" : "waiting";
              o.m < i
                ? (n.o("queue update priority", t, e.pathname), o.m = i)
                : n.o("already in queue", s, t, e.pathname);
            } else {await n.h(e) ||
                (n.o("enqueue", s, e.pathname),
                  o = { m: i, l: e, v: null, $: null, p: !1 },
                  o.$ = new Promise((t) => o.v = t),
                  n.u.push(o));}
            return o;
          }(n, new URL(e.i + i, n.l.origin), o)
        ),
      ),
      i(n);
  }
  function i(n) {
    n.u.sort(o);
    let e = 0;
    for (const o of n.u) {
      if (o.p) e++;
      else if (n.C() && (e < n.T || o.m >= t)) {
        o.p = !0, e++;
        const s = o.m >= t ? "FETCH (CACHE MISS)" : "FETCH";
        n.o(s, o.l.pathname),
          n.H(o.l).then(async (t) => {
            o.v(t),
              200 === t.status &&
              (n.o("CACHED", o.l.pathname), await n.R(o.l, t.clone()));
          }).finally(() => {
            n.o("FETCH DONE", o.l.pathname),
              n.u.splice(n.u.indexOf(o), 1),
              i(n);
          });
      }
    }
  }
  function o(t, n) {
    return n.m - t.m;
  }
  function s(t, n, e, i, o = !0) {
    if (!n.has(e)) {
      if (n.set(e, i), !t.U) {
        let n, e;
        t.U = new Map();
        for (let i = 0; i < t.L.length; i++) {
          const o = t.L[i];
          if ("string" == typeof o) n = { S: [], A: [] }, e = !0, t.U.set(o, n);
          else if (-1 === o) e = !1;
          else {
            const i = t.L[o];
            e ? n.S.push(i) : n.A.push(i);
          }
        }
      }
      const c = t.U.get(e);
      if (!c) return n;
      for (const e of c.S) s(t, n, e, i);
      if (o) {
        i--;
        for (const e of c.A) s(t, n, e, i, !1);
      }
    }
    return n;
  }
  function c(t) {
    const n = new URL(t).pathname, e = n.lastIndexOf("/");
    return [n.substring(0, e + 1), n.substring(e + 1)];
  }
  const a = (...t) => {
    console.log("⚙️ Prefetch SW:", ...t);
  };
  async function r(t, n, e, i) {
    const o = t.t.findIndex((t) => t.i === n);
    if (
      -1 !== o && t.t.splice(o, 1),
        t.o("adding base:", n),
        t.t.push({ i: n, L: e, U: void 0 }),
        i
    ) {
      const i = new Set(e.filter((t) => "string" == typeof t)), o = await t.C();
      if (o) {
        for (const e of await o.keys()) {
          const [s, a] = c(new URL(e.url)), r = [];
          s !== n || i.has(a) || (t.o("deleting", e.url), r.push(o.delete(e))),
            await Promise.all(r);
        }
      }
    }
  }
  function u(t, n, i) {
    let o = t.t.find((t) => t.L.includes(i[0].replace("./", "")));
    o || (o = t.t.find((t) => n === t.i)),
      o
        ? e(t, o, i, 0)
        : console.error(`Base path not found: ${n}, ignoring prefetch.`);
  }
  function f(t) {
    if (!t.N && t.B.length) {
      const e = t.B.shift();
      t.N = (async (t, e) => {
        const i = e[0];
        t.o("received message:", i, e[1], e.slice(2)),
          "graph" === i
            ? await r(t, e[1], e.slice(2), !0)
            : "graph-url" === i
            ? await async function (t, e, i) {
              await r(t, e, [], !1);
              const o = await n(t, new URL(e + i, t.l.origin));
              if (o && 200 === o.status) {
                const n = await o.json();
                n.push(i), await r(t, e, n, !0);
              }
            }(t, e[1], e[2])
            : "prefetch" === i
            ? await u(t, e[1], e.slice(2))
            : "prefetch-all" === i
            ? await function (t, n) {
              const e = t.t.find((t) => n === t.i);
              e
                ? u(t, n, e.L.filter((t) => "string" == typeof t))
                : console.error(
                  `Base path not found: ${n}, ignoring prefetch.`,
                );
            }(t, e[1])
            : "ping" === i
            ? a("ping")
            : "verbose" === i
            ? (t.o = a)("mode: verbose")
            : console.error("UNKNOWN MESSAGE:", e);
      })(t, e).then(() => {
        t.N = null, f(t);
      });
    }
  }
  class l {
    constructor(t, n, e = 4, i = null, o = null, s = [], c = [], a = []) {
      this.H = t,
        this.l = n,
        this.T = e,
        this.F = i,
        this.N = o,
        this.u = s,
        this.t = c,
        this.B = a;
    }
    C() {
      return this.F;
    }
    async R(t, n) {
      const e = await this.C();
      return null == e ? void 0 : e.put(t, n);
    }
    async h(t) {
      const n = await this.C();
      return null == n ? void 0 : n.match(t);
    }
    o() {}
  }
  ((t) => {
    const e = (i = t.fetch.bind(t), o = new URL(t.location.href), new l(i, o));
    var i, o;
    e.C = () =>
      e.F ? e.F : (clearTimeout(void 0),
        setTimeout(() => {
          e.F = null;
        }, 5e3),
        t.caches.open("QwikBundles")),
      t.addEventListener("fetch", (t) => {
        const i = t.request;
        if ("GET" === i.method) {
          const o = n(e, new URL(i.url));
          o && t.respondWith(o);
        }
      }),
      t.addEventListener("message", (t) => {
        e.B.push(t.data), f(e);
      }),
      t.addEventListener("install", () => {
        t.skipWaiting();
      }),
      t.addEventListener("activate", (n) => {
        e.C = () =>
          e.F ? e.F : (clearTimeout(void 0),
            setTimeout(() => {
              e.F = null;
            }, 5e3),
            t.caches.open("QwikBundles")), n.waitUntil(t.clients.claim());
      });
  })(globalThis);
})();
