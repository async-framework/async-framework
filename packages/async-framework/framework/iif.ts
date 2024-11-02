import {
  ReadSignal,
  Signal,
  signal as createSignal,
} from "../signals/index.ts";

export function iif<T = any, C = any>(
  condition: Signal<C> | ReadSignal<C>,
  first: (val?: C) => T,
  second: (val?: C) => T | null = () => null,
) {
  const val = condition.value;
  const result = createSignal<T | null>(val ? first(val) : second(val));
  condition.subscribe((newValue) => {
    // console.log("iif", condition.value, first(),  second());
    result.value = newValue ? first(newValue) : second(newValue);
  });
  // Remove old value if it exists
  result.subscribe((newValue, oldValue: any) => {
    // console.log("iif result", newValue, oldValue);
    if (oldValue && oldValue?.remove && oldValue?.isConnected) {
      // TODO: handle dom elements
      oldValue.remove();
    }
  });
  return result;
}
