// deno-lint-ignore-file no-explicit-any

import { signalRegistry } from './instance.ts';



export class Signal {
  id: string;
  private _value: any;
  _observers = new Set();
  _dependencies = new Set();

  constructor(id: string, initialValue: any) {
    this.id = id;
    this._value = initialValue;    
  }

  get value(): any {
    const currentSignal = signalRegistry.getCurrentSignal();
    if (currentSignal) {
      this._dependencies.add(currentSignal);
      currentSignal._observers.add(this);
    }
    return this._value;
  }

  set value(newVal: any) {
    if (this._value !== newVal) {
      this._value = newVal;
      this._notifyObservers();
    }
  }

  _notifyObservers() {
    // Store the current signal to restore later
    const prevSignal = signalRegistry.getCurrentSignal();
    
    // Notify observers
    for (const observer of this._observers) {
      signalRegistry.setCurrentSignal(observer instanceof Signal ? observer : null);
      if (typeof observer === 'function') {
        observer(this._value);
      } else if (observer instanceof Signal) {
        observer._recompute();
      }
    }
    
    // Restore the previous current signal
    signalRegistry.setCurrentSignal(prevSignal);
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
    signalRegistry.remove(this.id);
  }

  // Static method to get or create a signal by ID
  static getOrCreate(id: string, initialValue: any): Signal {
    return signalRegistry.getOrCreate(id, initialValue);
  }
}

// Helper function to create a computed signal
export function computed(id: string, computeFn: () => any): Signal {
  const signal = Signal.getOrCreate(id, undefined);
  
  const compute = () => {
    return signalRegistry.withSignal(signal, () => {
      signal._dependencies.forEach((dep: Signal | any) => dep._observers.delete(signal));
      signal._dependencies.clear();
      return computeFn();
    });
  };

  signal._recompute = () => {
    const newValue = compute();
    if (signal.value !== newValue) {
      signal.value = newValue;
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
