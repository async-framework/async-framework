import { _ as b, B as E, E as x, p as y } from "./q-BjteJSFI.js";
import { _hW as D } from "./q-BjteJSFI.js";
import { G as _, H as j, I as q } from "./q-DwB5CxdB.js";
const k = async function (...s) {
  const [d, p, i, h, a] = y(),
    n = s.length > 0 && s[0] instanceof AbortSignal ? s.shift() : void 0;
  {
    const r = E(),
      w = s.map((t) =>
        t instanceof SubmitEvent && t.target instanceof HTMLFormElement
          ? new FormData(t.target)
          : t instanceof Event || t instanceof Node
          ? null
          : t
      ),
      c = a.getHash();
    let l = "";
    const f = {
        ...d,
        method: i,
        headers: { ...p, "Content-Type": "application/qwik-json", "X-QRL": c },
        signal: n,
      },
      u = await x([a, ...w]);
    i === "GET" ? l += `&${q}=${encodeURIComponent(u)}` : f.body = u;
    const e = await fetch(`${h}?${_}=${c}${l}`, f),
      o = e.headers.get("Content-Type");
    if (e.ok && o === "text/qwik-json-stream" && e.body) {
      return async function* () {
        try {
          for await (const t of j(e.body, r ?? document.documentElement, n)) {
            yield t;
          }
        } finally {
          n != null && n.aborted || await e.body.cancel();
        }
      }();
    }
    if (o === "application/qwik-json") {
      const t = await e.text(), m = await b(t, r ?? document.documentElement);
      if (e.status === 500) throw m;
      return m;
    } else if (o === "application/json") {
      const t = await e.json();
      if (e.status === 500) throw t;
      return t;
    } else if (o === "text/plain" || o === "text/html") {
      const t = await e.text();
      if (e.status === 500) throw t;
      return t;
    }
  }
};
export { D as _hW, k as s_FusI6N08iPY };
