// deno-lint-ignore-file no-explicit-any

import { signalRegistry } from './instance.ts';



export class Signal {
  id: string;
  _value: any;
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
      const oldValue = this._value;
      this._value = newVal;
      this._notifyObservers(oldValue, newVal);
    }
  }

  _notifyObservers(oldValue: any, newValue: any) {
    // Store the current signal to restore later
    const prevSignal = signalRegistry.getCurrentSignal();
    
    // Notify observers
    for (const observer of this._observers) {
      signalRegistry.setCurrentSignal(observer instanceof Signal ? observer : null);
      try {
        if (typeof observer === 'function') {
          observer(newValue, oldValue);
        } else if (observer instanceof Signal) {
          observer._recompute();
        }
      } catch (error) {
        console.error('Error in signal observer:', error);
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
      signal._dependencies.forEach((dep: any) => dep._observers.delete(signal));
      signal._dependencies.clear();
      try {
        const newValue = computeFn();
        return newValue;
      } catch (error) {
        console.error('Error in computed signal:', error);
        return undefined;
      }
    });
  };

  signal._recompute = () => {
    const newValue = compute();
    if (signal._value !== newValue) {
      signal._value = newValue;
      const oldValue = signal._value;
      signal._notifyObservers(oldValue, newValue);
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
