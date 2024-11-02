import { signal } from "../signals/signals.ts";
import { getCurrentContext } from "../component/context.ts";

// Why: Implements useState hook with signal integration
export function useState<T>(initialValue: T): [T, (value: T) => void] {
  const context = getCurrentContext();
  if (!context) throw new Error("useState must be called within a component");

  const hookIndex = context.hookIndex++;

  if (!context.hooks[hookIndex]) {
    const sig = signal(initialValue);
    context.hooks[hookIndex] = sig;
    context.signals.add(sig);
  }

  const sig = context.hooks[hookIndex];
  return [sig.value, (value: T) => sig.set(value)];
}

// Why: Implements useEffect hook with cleanup
export function useEffect(
  effect: () => void | (() => void),
  deps?: any[],
): void {
  const context = getCurrentContext();
  if (!context) throw new Error("useEffect must be called within a component");

  const hookIndex = context.hookIndex++;
  const oldDeps = context.hooks[hookIndex];

  const hasChanged = !oldDeps || !deps ||
    deps.some((dep, i) => !Object.is(dep, oldDeps.deps[i]));

  if (hasChanged) {
    // Cleanup previous effect
    if (oldDeps?.cleanup) {
      oldDeps.cleanup();
      context.cleanup.delete(oldDeps.cleanup);
    }

    // Run new effect
    const cleanup = effect();
    if (typeof cleanup === "function") {
      context.cleanup.add(cleanup);
    }

    context.hooks[hookIndex] = { deps, cleanup };
  }
}

// Why: Implements useRef hook
export function useRef<T>(initialValue: T) {
  const context = getCurrentContext();
  if (!context) throw new Error("useRef must be called within a component");

  const hookIndex = context.hookIndex++;
  if (!context.hooks[hookIndex]) {
    context.hooks[hookIndex] = { current: initialValue };
  }

  return context.hooks[hookIndex];
}

// Why: Implements onMount lifecycle hook
export function onMount(callback: () => void | (() => void)): void {
  useEffect(() => {
    const cleanup = callback();
    return cleanup;
  }, []);
}

// Why: Implements onCleanup lifecycle hook
export function onCleanup(callback: () => void): void {
  const context = getCurrentContext();
  if (!context) throw new Error("onCleanup must be called within a component");
  context.cleanup.add(callback);
}
