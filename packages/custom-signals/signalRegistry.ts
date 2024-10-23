import { Signal, computed } from './signal.ts';

export class SignalRegistry {
  private registry: Map<string, Signal>;
  private currentSignal: Signal | null = null;

  constructor() {
    this.registry = new Map<string, Signal>();
  }

  // Why: To get or create a regular signal by its ID
  getOrCreate(id: string, initialValue: any): Signal {
    if (this.registry.has(id)) {
      return this.registry.get(id)!;
    }
    const signal = new Signal(id, initialValue);
    this.registry.set(id, signal);
    return signal;
  }

  // Why: To create a computed signal
  createComputed(id: string, computeFn: () => any): Signal {
    if (this.registry.has(id)) {
      console.warn(`SignalRegistry: Signal with id ${id} already exists. Returning existing signal.`);
      return this.registry.get(id)!;
    }
    const computedSignal = computed(id, computeFn);
    this.registry.set(id, computedSignal);
    return computedSignal;
  }


  // Why: To get any signal (regular or computed) by its ID
  get(id: string): Signal | undefined {
    return this.registry.get(id);
  }

  // Why: To check if a signal with the given ID exists
  has(id: string): boolean {
    return this.registry.has(id);
  }

  // Why: To remove a signal from the registry
  remove(id: string): void {
    const signal = this.registry.get(id);
    if (signal) {
      signal.cleanUp();
      this.registry.delete(id);
    }
  }

  // Why: To clear all signals from the registry
  clear(): void {
    for (const signal of this.registry.values()) {
      signal.cleanUp();
    }
    this.registry.clear();
  }

  // Why: To set the current signal being evaluated
  setCurrentSignal(signal: Signal | null): void {
    this.currentSignal = signal;
  }

  // Why: To get the current signal being evaluated
  getCurrentSignal(): Signal | null {
    return this.currentSignal;
  }

  // Why: To execute a function with a specific current signal context
  withSignal<T>(signal: Signal, fn: () => T): T {
    const prevSignal = this.currentSignal;
    this.currentSignal = signal;
    try {
      return fn();
    } finally {
      this.currentSignal = prevSignal;
    }
  }
}
