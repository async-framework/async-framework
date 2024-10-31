// Why: Tracks the current computation context for signal dependencies
let currentTracker: (() => void) | null = null;

// Why: Creates a signal with tracking capabilities
export function signal<T>(initialValue: T) {
  const subscribers = new Set<(value: T, oldValue: T) => void>();
  let value = initialValue;

  function get() {
    // Track when the signal is read
    if (currentTracker) {
      subscribers.add(currentTracker);
    }
    return value;
  }
  function set(newValue: T) {
    const oldValue = value;
    value = newValue;
    // Notify all subscribers of the change
    subscribers.forEach((subscriber) => subscriber(value, oldValue));
  }

  return {
    get value() {
      // Track when the signal is read
      if (currentTracker) {
        subscribers.add(currentTracker);
      }
      return value;
    },
    set value(newValue: T) {
      const oldValue = value;
      value = newValue;
      // Notify all subscribers of the change
      subscribers.forEach((subscriber) => subscriber(value, oldValue));
    },
    get,
    set,
    subscribe(callback: (value: T, oldValue: T) => void) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    // Why: Allows tracking signal reads within a computation
    track<R>(computation: () => R): R {
      const prevTracker = currentTracker;
      currentTracker = () => computation();
      try {
        return computation();
      } finally {
        currentTracker = prevTracker;
      }
    },
    // toString: () => value.toString(),
    // toJSON: () => value.toJSON(),
    valueOf: () => value,
  };
}

export function createSignal<T>(
  initialValue: T,
): [() => T, (newValue: T) => void, ReturnType<typeof signal<T>>] {
  const sig = signal<T>(initialValue);
  return [sig.get, sig.set, sig];
}

// Why: Creates a computed signal that tracks its dependencies
export function computed<T>(computation: () => T) {
  const sig = signal<T>(computation());

  // Initial computation with tracking
  sig.track(() => {
    sig.value = computation();
  });

  return sig;
}

// Why: Helps debug signal usage and dependencies
// Usage example:
// const count = debugSignal(createSignal(0), "count");
export function debugSignal<T>(
  sig: ReturnType<typeof signal<T>>,
  name: string,
) {
  return {
    ...sig,
    get value() {
      console.log(`Reading signal "${name}"`);
      return sig.value;
    },
    set value(newValue: T) {
      console.log(`Setting signal "${name}" to:`, newValue);
      sig.value = newValue;
    },
  };
}
