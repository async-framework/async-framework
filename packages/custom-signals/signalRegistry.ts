import { createSignal, Signal } from "./signal.ts";

export class SignalRegistry {
  private registry: Map<string, Signal>;

  constructor() {
    this.registry = new Map<string, Signal>();
  }

  // Why: To get or create a signal by its ID
  getOrCreate<T>(id: string, initialValue: T): Signal<T> {
    if (this.registry.has(id)) {
      return this.registry.get(id) as Signal<T>;
    }
    const signal = createSignal(initialValue);
    this.registry.set(id, signal);
    return signal;
  }
  updateOrCreate<T>(id: string, initialValue: T): Signal<T> {
    if (this.registry.has(id)) {
      const signal = this.registry.get(id) as Signal<T>;
      signal.value = initialValue;
      return signal;
    }
    const signal = createSignal(initialValue);
    this.registry.set(id, signal);
    return signal;
  }
  set<T>(id: string, value: T): Signal<T> {
    return this.getOrCreate(id, value);
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
