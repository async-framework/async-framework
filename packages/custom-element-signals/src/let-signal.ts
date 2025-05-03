import { parseAttributeValue } from "./utils/parse-attribute-value";
import { Signal } from "./signal-store";
import { SignalStoreInstance, signalStore } from "./signal-store-instance";

// There is no need to do this if everything is SSRd properly./
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
    signalRegistry?: SignalStoreInstance;
    [key: string]: any;
  }
}

export class LetSignal<T> extends HTMLElement {
  static observedAttributes = ["name", "value", "save"];
  ready = false;

  signal: null | Signal<T> = null;
  _signalRegistry: SignalStoreInstance;
  constructor() {
    super();
    // if ((globalThis as any).signalRegistry) {
    //   console.log("let-signal: using global signalRegistry");
    //   this._signalRegistry = (globalThis as any).signalRegistry;
    // } else {
    //   console.log("let-signal: using signalStore");
    //   this._signalRegistry = signalStore;
    // }

    // if the signal registry is not in the window, then we need to create a new one
    // we want to use some form of context here. maybe this.closest('let-signal-registry')?
    this._signalRegistry = window.signalRegistry || signalStore;
  }

  get value(): T | void {
    return this.signal?.get();
  }

  set value(value: T) {
    this.signal?.set(value);
  }

  createSignal(name: string, value?: any) {
    // Use the value attribute if it exists, otherwise use the innerHTML
    if (value === undefined) {
      const strValue = this.getAttribute("value") || this.innerHTML ||
        "";
      value = parseAttributeValue(strValue);
    }
    return this._signalRegistry.getOrCreate(name, value);
  }

  connectedCallback() {
    // attributeChangedCallback fires before connectedCallback
    this.ready = true;

    const name = this.getAttribute("name");
    if (!name) {
      throw new Error("let-signal must have a name attribute");
    }

    this.signal = this.createSignal(name);
  }

  // This should never happen, but keeping it for completeness
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }
    if (!this.ready) {
      return;
    }

    if (name === "name") {
      this._signalRegistry.delete(oldValue);
      this.signal = this.createSignal(newValue, this.signal?.get());
      this._signalRegistry.set(newValue, this.signal);
    } else if (name === "value") {
      const newParsedValue = parseAttributeValue(newValue);
      this.value = newParsedValue;
      this.signal?.set(newParsedValue);
    }
  }

  disconnectedCallback() {
    const name = this.getAttribute("name");
    if (name) {
      this._signalRegistry.delete(name);
    }
    this.ready = false;
    this.signal?.cleanUp();
  }
}
