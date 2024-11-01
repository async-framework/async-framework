import {
  signal as createSignal,
  type Signal
} from "./signals.ts";

export class SignalRegistry {
  private registry: Map<string, Signal<any>> | {
    get: (id: string) => Signal<any> | undefined;
    set: (id: string, signal: Signal<any>) => void;
    has: (id: string) => boolean;
    size: number;
    delete: (id: string) => void;
    clear: () => void;
  };

  constructor(signalRegistry = new Map<string, Signal<any>>()) {
    // TODO: extend Map
    this.registry = {
      has: (id: string) => {
        return signalRegistry.has(id);
      },
      get: (id: string) => {
        return signalRegistry.get(id);
      },
      get size() {
        return signalRegistry.size;
      },
      set: (id: string, signal: Signal<any>) => {
        signalRegistry.set(id, signal);
      },
      delete: (id: string) => {
        signalRegistry.delete(id);
      },
      clear: () => {
        signalRegistry.clear();
      },
    };
  }

  // Why: To get or create a signal by its ID
  getOrCreate<T>(id: string, initialValue: T): Signal<T> {
    if (this.registry.has(id)) {
      return this.registry.get(id) as Signal<T>;
    }
    if (typeof (initialValue as any).subscribe === 'function') {
      throw new Error("Signal initial value cannot be a Signal");
    }
    const signal = createSignal<T>(initialValue);
    this.registry.set(id, signal);
    return signal;
  }
  updateOrCreate<T>(id: string, initialValue: T): Signal<T> {
    if (this.registry.has(id)) {
      const signal = this.registry.get(id) as Signal<T>;
      signal.set(initialValue);
      return signal;
    }
    if (typeof (initialValue as any).subscribe === 'function') {
      throw new Error("Signal initial value cannot be a Signal");
    }
    const signal = createSignal<T>(initialValue);
    this.registry.set(id, signal);
    return signal;
  }
  get size(): number {
    return typeof this.registry.size === 'function' 
      ? this.registry.size()
      : this.registry.size;
  }

  set<T>(id: string, value: T): Signal<T> {
    return this.updateOrCreate(id, value);
  }

  // Why: To get a signal by its ID
  get<T>(id: string): Signal<T> | undefined {
    return this.registry.get(id) as Signal<T> | undefined;
  }

  // Why: To check if a signal with the given ID exists
  has(id: string): boolean {
    return this.registry.has(id);
  }

  // Why: To remove a signal from the registry
  remove(id: string): void {
    this.registry.delete(id);
  }
  delete(id: string): void {
    this.registry.delete(id);
  }

  // Why: To clear all signals from the registry
  clear(): void {
    this.registry.clear();
  }
}
