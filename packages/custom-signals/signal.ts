// deno-lint-ignore-file no-explicit-any

// Global registry to store signals by their IDs
export const signalRegistry = new Map();

// Current signal being evaluated
let currentSignal = null;

export class Signal {
  id: string;
  value: any;
  _observers = new Set();
  _dependencies = new Set();

  constructor(id: string, initialValue: any) {
    this.id = id;
    this.value = initialValue;
    
    // Register the signal in the global registry
    signalRegistry.set(id, this);
  }

  get() {
    // Track dependencies
    if (currentSignal) {
      this._dependencies.add(currentSignal);
      currentSignal._observers.add(this);
    }
    return this.value;
  }

  set(newVal: any) {
    if (this.value !== newVal) {
      this.value = newVal;
      this._notifyObservers();
    }
  }

  _notifyObservers() {
    // Store the current signal to restore later
    const prevSignal = currentSignal;
    
    // Notify observers
    for (const observer of this._observers) {
      currentSignal = observer;
      if (typeof observer === 'function') {
        observer(this.value);
      } else if (observer instanceof Signal) {
        observer._recompute();
      }
    }
    
    // Restore the previous current signal
    currentSignal = prevSignal;
  }

  _recompute() {
    // Implement recomputation logic if needed
  }

  subscribe(observer: (value: any) => void): () => void {
    this._observers.add(observer);
    return () => {
      this._observers.delete(observer);
    };
  }

  cleanUp() {
    this._observers.clear();
    this._dependencies.clear();
    signalRegistry.delete(this.id);
  }

  // Static method to get or create a signal by ID
  static getOrCreate(id: string, initialValue: any): Signal {
    if (signalRegistry.has(id)) {
      return signalRegistry.get(id);
    }
    return new Signal(id, initialValue);
  }
}

// Helper function to create a computed signal
export function computed(id: string, computeFn: () => any): Signal {
  const signal = Signal.getOrCreate(id, undefined);
  
  const compute = () => {
    // Clear previous dependencies
    signal._dependencies.forEach(dep => dep._observers.delete(signal));
    signal._dependencies.clear();

    // Set the current signal for dependency tracking
    const prevSignal = currentSignal;
    currentSignal = signal;

    // Compute the new value
    const newValue = computeFn();

    // Restore the previous current signal
    currentSignal = prevSignal;

    return newValue;
  };

  signal._recompute = () => {
    const newValue = compute();
    if (signal.value !== newValue) {
      signal.value = newValue;
      signal._notifyObservers();
    }
  };

  // Initial computation
  signal._recompute();

  return signal;
}

// Helper function to create a simple signal
export function createSignal(id: string, initialValue: any): Signal {
  return Signal.getOrCreate(id, initialValue);
}
