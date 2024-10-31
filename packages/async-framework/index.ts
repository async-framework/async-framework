export * from "./async-loader.ts";
export * from "./handler-registry.ts";
export * from "./jsx-runtime.ts";

// Why: Provides reactive state management through signals
export function signal<T>(initialValue: T) {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signalObject = {
    get value() {
      return value;
    },
    set value(newValue: T) {
      value = newValue;
      subscribers.forEach(subscriber => subscriber(newValue));
    },
    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      callback(value);
      return () => subscribers.delete(callback);
    }
  };

  return signalObject;
}