// Why: Tracks the current computation context for signal dependencies
let currentTracker: (() => void) | null = null;

export const signalSymbol = Symbol("signal");

// Why: Defines a read-only version of a signal
export type ReadSignal<T> =
  & Omit<ReturnType<typeof signal<T>>, "set" | "value">
  & {
    readonly value: T;
  };

export type Signal<T> = ReturnType<typeof signal<T>>;
// Why: Creates a signal with tracking capabilities
export function signal<T>(initialValue: T) {
  const subscribers = new Set<(value: T, oldValue: T) => void>();
  let value = initialValue;

  // Why: To get the value of the signal
  function get() {
    // console.log("signal.get", currentTracker, this);
    // Track when the signal is read
    if (currentTracker) {
      subscribers.add(currentTracker);
    }
    return value;
  }
  // Why: To set the value of the signal
  function set(newValue: T) {
    // console.log("signal.set", currentTracker, this);
    const oldValue = value;
    if (newValue === oldValue) {
      // console.log(
      //   "signal.set: value is the same, skipping",
      //   newValue,
      //   oldValue,
      // );
      return;
    } else {
      // console.log("signal.set: value changed", newValue, oldValue);
    }
    value = newValue;
    // Notify all subscribers of the change
    subscribers.forEach(function signalSet(subscriber) {
      subscriber(newValue, oldValue);
    });
  }

  return {
    type: "signal",
    get value() {
      return get.call(this);
    },
    set value(newValue: T) {
      set.call(this, newValue);
    },
    get,
    set,
    // Why: Allows subscribing to signal changes
    subscribe(callback: (value: T, oldValue: T) => void) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    // Why: Allows tracking signal reads within a computation
    track<R>(computation: () => R): R {
      const prevTracker = currentTracker;
      // console.log("signal.track", prevTracker, this);
      const self = this;
      currentTracker = function signalComputed() {
        return computation.call(self);
      };
      try {
        return computation.call(self);
      } finally {
        currentTracker = prevTracker;
      }
    },
    // toString: () => value.toString(),
    // toJSON: () => value.toJSON(),
    valueOf: () => value,
  };
}

// Why: To create a signal with a getter, setter, and signal object
export function createSignal<T>(
  initialValue: T,
): [() => T, (newValue: T) => void, ReturnType<typeof signal<T>>] {
  const sig = signal<T>(initialValue);
  // Why: To return the getter, setter, and signal object
  // (returned as any)[signalSymbol] = sig;
  return [sig.get, sig.set, sig];
}

// Why: Creates a read-only version of a signal
export function readSignal<T>(
  sig: ReturnType<typeof signal<T>>,
): ReadSignal<T> {
  return {
    type: "read-signal",
    get: sig.get,
    subscribe: sig.subscribe,
    track: sig.track,
    valueOf: sig.valueOf,
    get value() {
      return sig.value;
    },
  };
}

// Why: Creates a computed signal that tracks its dependencies and returns a getter and read-only signal
export function createComputed<T>(
  this: any,
  computation: () => T,
): [() => T, ReadSignal<T>] {
  const self = this;
  // console.log("computed.self", self);
  const sig = signal<T>(computation());

  // Why: To initial computation with tracking
  sig.track(function signalComputed() {
    sig.value = computation.call(self);
  });

  return [sig.get, readSignal(sig)];
}

// Why: Creates a computed signal that tracks its dependencies
export function computed<T>(this: any, computation: () => T): ReadSignal<T> {
  const self = this;
  // console.log("computed.self", self);
  const sig = signal<T>(computation());

  // Why: To initial computation with tracking
  sig.track(function signalComputed() {
    sig.value = computation.call(self);
  });

  return readSignal(sig);
}

// Why: Helps debug signal usage and dependencies
// Usage example:
// const count = debugSignal(createSignal(0), "count");
export function debugSignal<T>(
  sig: ReturnType<typeof signal<T>>,
  name: string,
) {
  let isReadOnlySignal = sig.type === "read-signal";
  let isCreatedSignal = false;
  if (Array.isArray(sig)) {
    // destructure the signal from the array
    [, , sig] = sig;
    isCreatedSignal = true;
  }
  console.log(`Creating debug signal "${name}" type: ${sig.type}`);
  const _signal = isReadOnlySignal
    ? {
      type: "debug-read-signal",
      subscribe: (callback: (value: T, oldValue: T) => void) => {
        console.log(`Subscribing to signal "${name}"`);
        return sig.subscribe(callback);
      },
      track: (computation: () => void) => {
        console.log(`Tracking signal "${name}"`);
        return sig.track(computation);
      },
      get: () => {
        console.log(`Reading signal "${name}"`);
        return sig.get();
      },
      get value() {
        console.log(`Reading signal "${name}"`);
        return sig.value;
      },
      valueOf: sig.valueOf,
    }
    : {
      type: "debug-signal",
      subscribe: (callback: (value: T, oldValue: T) => void) => {
        console.log(`Subscribing to signal "${name}"`);
        return sig.subscribe(callback);
      },
      track: (computation: () => void) => {
        console.log(`Tracking signal "${name}"`);
        return sig.track(computation);
      },
      get: () => {
        console.log(`Reading signal "${name}"`);
        return sig.get();
      },
      set: (newValue: T) => {
        console.log(`Setting signal "${name}" to:`, newValue);
        sig.set(newValue);
      },
      get value() {
        console.log(`Reading signal "${name}"`);
        return sig.value;
      },
      set value(newValue: T) {
        console.log(`Setting signal "${name}" to:`, newValue);
        sig.value = newValue;
      },
      valueOf: () => sig.valueOf(),
    };
  if (isCreatedSignal) {
    if (isReadOnlySignal) {
      return [_signal.get, _signal as ReadSignal<T>];
    }
    return [_signal.get, _signal.set, _signal as ReturnType<typeof signal<T>>];
  }
  return _signal;
}
