// Reveal vocabulary shared by the runtime receiver (boundary-receiver.js) and
// the buildtime optimizer (build-optimizer.js). Both layers must speak the
// same order/tail values; restating them per file is how "visible" became a
// valid buildtime tail while throwing at runtime. This module stays free of
// runtime imports so the optimizer may depend on it (see the banned-imports
// contract in tests/build/build-optimizer-artifacts.test.js).

export const revealOrders = new Set(["as-ready", "forwards", "backwards", "together"]);

// Author vocabulary. "visible" means "no tail treatment" and normalizes to
// undefined before any receiver group bookkeeping.
export const revealTails = new Set(["visible", "collapsed", "hidden"]);

export const defaultRevealOrder = "as-ready";

export function normalizeRevealTail(tail) {
  return tail === "visible" ? undefined : tail;
}
