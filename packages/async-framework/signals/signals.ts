import { signalRegistry } from "./registry.ts";
import { generateId, getCurrentContext } from "../component/context.ts";

// Why: Tracks the current computation context for signal dependencies
let currentTracker: (() => void) | null = null;

let nextSignalId = 0;

export interface Signal<T> {
  id: string;
  type: string;
  value: T;
  get: () => T;
  set: (value: T) => void;
  subscribe: (
    callback: (value: T, oldValue: T) => void,
    contextId?: string,
  ) => () => void;
  track: <R>(computation: () => R) => R;
  valueOf: () => T;
}

export interface SignalOptions {
  id?: string;
  context?: string;
}

// Why: Creates a signal with tracking capabilities
export function signal<T>(initialValue: T, options: SignalOptions = {}) {
  const context = getCurrentContext();
  const id = options.id || generateId("signal", context?.id);
  let value = initialValue;

  // Create the signal object first so we can pass it to the registry
  const signalObj = {
    id,
    type: "signal",
    get value() {
      return get.call(signalObj);
    },
    set value(newValue: T) {
      set.call(signalObj, newValue);
    },
    get,
    set,
    subscribe(
      callback: (value: T, oldValue: T) => void,
      subContextId?: string,
    ) {
      return signalRegistry.subscribe(
        signalObj,
        callback,
        subContextId || context?.id,
      );
    },
    track<R>(computation: () => R): R {
      const prevTracker = currentTracker;
      currentTracker = function signalComputed() {
        return computation.call(signalObj);
      };
      try {
        return computation.call(signalObj);
      } finally {
        currentTracker = prevTracker;
      }
    },
    valueOf: () => value,
  };

  function get() {
    if (currentTracker) {
      signalRegistry.subscribe(signalObj, currentTracker, context?.id);
    }
    return value;
  }

  function set(newValue: T) {
    const oldValue = value;
    if (isSignal(oldValue) || isSignal(newValue)) {
      console.log("signal.set: oldValue is a signal", oldValue);
      return;
    }
    if (newValue === oldValue) return;

    value = newValue;
    signalRegistry.notify(signalObj, newValue, oldValue);
  }

  return signalObj;
}

// Why: Type guard for signals
export function isSignal(value: any): value is Signal<any> {
  return value && typeof value === "object" && "type" in value &&
    value.type === "signal";
}

// Why: Creates a read-only version of a signal
export type ReadSignal<T> = Omit<Signal<T>, "set" | "value"> & {
  readonly value: T;
};

// Why: To create a signal with a getter, setter, and signal object
export function createSignal<T>(
  initialValue: T,
  options: SignalOptions = {},
): [() => T, (newValue: T) => void, Signal<T>] {
  const sig = signal<T>(initialValue, options);
  return [sig.get, sig.set, sig];
}

// Why: Creates a read-only version of a signal
export function readSignal<T>(sig: Signal<T>): ReadSignal<T> {
  return {
    id: sig.id,
    type: "read-signal",
    get: sig.get,
    subscribe: (
      callback: (value: T, oldValue: T) => void,
      contextId?: string,
    ) => sig.subscribe(callback, contextId),
    track: sig.track,
    valueOf: sig.valueOf,
    get value() {
      return sig.value;
    },
  };
}

// Why: Creates a computed signal that tracks its dependencies
export function computed<T>(
  computation: () => T,
  options: SignalOptions = {},
): ReadSignal<T> {
  const sig = signal<T>(computation(), {
    id: options.id || `computed-${nextSignalId++}`,
    context: options.context,
  });

  // Why: To initial computation with tracking
  sig.track(function signalComputed() {
    sig.value = computation();
  });

  return readSignal(sig);
}

// Why: Creates a computed signal that returns getter and read-only signal
export function createComputed<T>(
  computation: () => T,
  options: SignalOptions = {},
): [() => T, ReadSignal<T>] {
  const sig = signal<T>(computation(), {
    id: options.id || `computed-${nextSignalId++}`,
    context: options.context,
  });

  sig.track(function signalComputed() {
    sig.value = computation();
  });

  return [sig.get, readSignal(sig)];
}

// Why: Creates a resource signal that handles async data loading
export function createResource<T = any>(
  fetcher: (
    track: <R>(fn: () => R) => R,
  ) => Promise<T | Signal<T> | ReadSignal<T>>,
  options: SignalOptions = {},
): {
  data: Signal<T | undefined>;
  loading: Signal<boolean>;
  error: Signal<Error | undefined>;
  dispose: () => void;
} {
  const baseId = options.id || `resource-${nextSignalId++}`;
  const context = options.context;

  const data = signal<T | undefined>(undefined, {
    id: `${baseId}-data`,
    context,
  });
  const loading = signal(true, {
    id: `${baseId}-loading`,
    context,
  });
  const error = signal<Error | undefined>(undefined, {
    id: `${baseId}-error`,
    context,
  });

  let isDisposed = false;
  let cleanup: (() => void) | undefined;

  function track<R>(fn: () => R): R {
    return data.track(fn);
  }

  async function load() {
    if (isDisposed) return;

    loading.value = true;
    error.value = undefined;

    try {
      const result = await fetcher(track);
      if (!isDisposed) {
        if (isSignal(result)) {
          const signalResult = result as Signal<T>;
          data.value = signalResult.value;
          cleanup = signalResult.subscribe((newValue) => {
            if (!isDisposed) {
              data.value = newValue;
            }
          }, context);
        } else {
          data.value = result as T;
        }
      }
    } catch (err) {
      if (!isDisposed) {
        error.value = err instanceof Error ? err : new Error(String(err));
      }
    } finally {
      if (!isDisposed) {
        loading.value = false;
      }
    }
  }

  // Initial load
  load();

  const dispose = () => {
    isDisposed = true;
    if (cleanup) {
      cleanup();
    }
  };

  return { data, loading, error, dispose };
}

// ... keep existing debugSignal function ...
