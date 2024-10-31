// Why: Tracks the current computation context for signal dependencies
let currentTracker: (() => void) | null = null;

// Why: Creates a signal with tracking capabilities
export function signal<T>(initialValue: T) {
  const subscribers = new Set<(value: T, oldValue: T) => void>();
  let value = initialValue;

  // Why: To get the value of the signal
  function get() {
    // Track when the signal is read
    if (currentTracker) {
      subscribers.add(currentTracker);
    }
    return value;
  }
  // Why: To set the value of the signal
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
    // Why: Allows subscribing to signal changes
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

// Why: To create a signal with a getter, setter, and signal object
export function createSignal<T>(
  initialValue: T,
): [() => T, (newValue: T) => void, ReturnType<typeof signal<T>>] {
  const sig = signal<T>(initialValue);
  // Why: To return the getter, setter, and signal object
  return [sig.get, sig.set, sig];
}

// Why: Creates a computed signal that tracks its dependencies
export function computed<T>(computation: () => T) {
  const sig = signal<T>(computation());

  // Why: To initial computation with tracking
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
  console.log(`Creating debug signal "${name}"`);
  return {
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
  };
}
