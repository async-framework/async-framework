// deno-lint-ignore-file no-explicit-any

export class Signal<T = any> {
  private _value: T;
  private _observers = new Set<(value: T, oldValue: T) => void>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newVal: T) {
    if (this._value !== newVal) {
      const oldValue = this._value;
      this._value = newVal;
      this._notifyObservers(oldValue, newVal);
    }
  }
  get(): T {
    return this._value;
  }
  set(newVal: T) {
    this.value = newVal;
  }

  notifyObservers() {
    this._notifyObservers(this._value, this._value);
  }

  private _notifyObservers(oldValue: T, newValue: T) {
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
