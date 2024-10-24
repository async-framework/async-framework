import { parseAttributeValue } from "./parse-attribute-value";
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

// its better not to use this but ask the developer to do it otherwise there is a flicker
// const STYLE_ID = 'let-signal-style';
// if (!document.getElementById(STYLE_ID)) {
//   const style = document.createElement('style');
//   style.id = STYLE_ID;
//   style.textContent = `
//     let-signal:not(:defined),
//     let-signal {
//       display: none !important;
//     }
//   `;
//   document.head.appendChild(style);
// }

declare global {
  interface Window {
    signalRegistry?: Map<string, any>;
  }
}

export class LetSignal<T> extends HTMLElement {
  static observedAttributes = ["id", "value"];

  signal: null | Signal<T> = null;
  value: any;
  signalRegistry: Map<string, Signal<any>>;

  attributes!: NamedNodeMap & {
    id: { value: string };
    value: { value: string };
  };

  constructor() {
    super();
    // if the signal registry is not in the window, then we need to create a new one
    // we want to use some form of context here. maybe this.closest('let-signal-registry')?
    this.signalRegistry = window.signalRegistry || signalStore;
  }

  createSignal(value?: any) {
    // Use the value attribute if it exists, otherwise use the innerHTML
    if (value === undefined) {
      const strValue = this.attributes?.["value"]?.value || this.innerHTML || "";
      value = parseAttributeValue(strValue);
    }
    const signal = new Signal(value);
    this.value = value;
    return signal;
  }

  connectedCallback() {
    this.signal = this.createSignal();

    const id = this.attributes["id"].value;
    this.signalRegistry.set(id, this.signal);
  }

  // This should never happen, but keeping it for completeness
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "id" && oldValue !== newValue) {
      this.signalRegistry.delete(oldValue);
      this.signal = this.createSignal(this.value);
      this.signalRegistry.set(newValue, this.signal);
    }
  }

  disconnectedCallback() {
    const id = this.attributes["id"].value;
    this.signalRegistry.delete(id);
    this.value = undefined;
    this.signal?.cleanUp();
  }
}
