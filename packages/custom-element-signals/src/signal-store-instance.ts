// deno-lint-ignore-file no-explicit-any
import { Signal } from "./signal-store";

export class SignalStoreInstance extends Map<string, Signal<any>> {
  getOrCreate(name: string, initialValue: any): Signal<any> {
    if (this.has(name)) {
      return this.get(name) as Signal<any>;
    }
    const signal = new Signal(initialValue);
    this.set(name, signal);
    return signal;
  }
}

export const signalStore = new SignalStoreInstance();
