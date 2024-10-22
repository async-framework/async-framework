import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";
import { parseAttributeValue } from "./parse-attribute-value";
export class SignalText extends HTMLElement {
  static observedAttributes = [
    "data-id",
    "data-transformers",
    "data-dangerous-html",
  ];

  attributes!: NamedNodeMap & {
    "data-id": { value: string };
    "data-transformers": { value: string };
    "data-dangerous-html"?: { value: boolean };
  };

  signal: null | Signal<any> = null;
  transformers: Array<(input: any) => any> = [];

  ready = false;
  mounted = false;

  cleanUp: null | (() => void) = null;

  connectedCallback() {
    this.mounted = true;
    const id = parseAttributeValue(this.attributes["data-id"]?.value);
    this.signal = signalStore.get(id) ?? null;

    const transformers =
      parseAttributeValue(this.attributes["data-transformers"]?.value) ?? [];

    if (Array.isArray(transformers)) {
      // We're hoping this completes before any event fires.
      Promise
        .all(transformers.map((id) => import(id)))
        .then((fns) => {
          if (this.mounted) {
            this.transformers = fns.filter(Boolean);
            this.ready = true;
            this.updateChildren(this.signal?.get());
          }
        });
    } else {
      this.ready = true;
    }

    this.transformers = transformers;
    if (this.signal == null) {
      return;
    }
    this.cleanUp = this.signal.subscribe((newValue) => {
      return this.updateChildren(newValue);
    }) ?? null;
  }

  disconnectedCallback() {
    this.cleanUp?.();
    this.mounted = false;
  }

  updateChildren = (newValue: any): void => {
    if (!this.ready) {
      return;
    }
    const transformedValue = this.transformers
      .reduce(
        (valueSoFar: any, fn: (input: any) => any) => fn(valueSoFar),
        newValue,
      );
    // 

    if (this.attributes["data-dangerous-html"]?.value) {
      this.innerHTML = String(transformedValue);
    } else {
      this.innerText = String(transformedValue);
    }
  };
}
