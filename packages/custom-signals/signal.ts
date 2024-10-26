// deno-lint-ignore-file no-explicit-any

export class Signal<T = any> {
  private _value: T;
  private _observers = new Set<(value: T, oldValue: T) => void>();

  constructor(initialValue: T) {
    if (initialValue instanceof Signal) {
      throw new Error("Signal initial value cannot be a Signal");
    }
    this._value = initialValue;
  }

  get value(): T {
    return this.get();
  }

  set value(newVal: T) {
    this.set(newVal);
  }
  get(): T {
    return this._value;
  }
  set(newVal: T) {
    if (newVal instanceof Signal) {
      throw new Error("Signal value cannot be a Signal");
    }
    const oldValue = this._value;
    this._value = newVal;
    this._notifyObservers(newVal, oldValue);
  }

  notifyObservers() {
    const value = this._value;
    this._notifyObservers(value, value);
  }

  private _notifyObservers(newValue: T, oldValue: T) {
    for (const observer of this._observers) {
      try {
        observer(newValue, oldValue);
      } catch (error) {
        console.error('Error in signal observer:', error);
      }
    }
  }

  subscribe(observer: (value: T, oldValue: T) => void): () => void {
    this._observers.add(observer);
    return () => {
      this._observers.delete(observer);
    };
  }
}

export function createSignal<T>(initialValue: T): Signal<T> {
  return new Signal<T>(initialValue);
}
