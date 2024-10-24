type Observer<T> = (newVal: T, oldVal: T) => void;

export class Signal<T> {
  value: T;

  _observers = new Set<Observer<T>>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get() {
    return this.value;
  }

  subscribe(observer: Observer<T>): () => void {
    this._observers.add(observer);
    return () => {
      this._observers.delete(observer);
    };
  }

  set(newVal: T) {
    const oldVal = this.value;
    this.value = newVal;
    this._observers.forEach((obs) => {
      obs(newVal, oldVal);
    });
  }

  cleanUp() {
    this._observers.clear();
  }
}
