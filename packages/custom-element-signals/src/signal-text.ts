// deno-lint-ignore-file no-explicit-any
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";
import { parseAttributeValue } from "./parse-attribute-value";
export class SignalText extends HTMLElement {
  static observedAttributes = [
    "data-id",
    "data-dangerous-html",
  ];

  attributes!: NamedNodeMap & {
    "data-id": { value: string };
    "data-dangerous-html"?: { value: boolean | string };
  };

  signal: null | Signal<any> = null;
  transformers: Array<(input: any) => any> = [];

  ready = false;
  mounted = false;

  cleanUp: null | (() => void) = null;

  connectedCallback() {
    this.mounted = true;
    const id = this.attributes["data-id"]?.value;
    this.signal = signalStore.get(id) ?? null;
    this.ready = true;

    if (this.signal == null) {
      return;
    }
    this.cleanUp =
      this.signal.subscribe((newValue) => {
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
    const transformedValue = this.transformers.reduce(
      (valueSoFar: any, fn: (input: any) => any) => fn(valueSoFar),
      newValue
    );
    const dangerousHtml = this.attributes["data-dangerous-html"]?.value;

    if (dangerousHtml === "false" || dangerousHtml === false) {
      return;
    }
    switch (transformedValue) {
      case NaN:
      case undefined:
      case null:
        this.innerHTML = "";
        break;
      default:
        this.innerHTML = `${transformedValue}`;
    }
  };
}
