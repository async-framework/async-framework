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
    [key: string]: any;
  }
}

export class LetSignal<T> extends HTMLElement {
  static observedAttributes = ["name", "value", "save"];

  signal: null | Signal<T> = null;
  _signalRegistry: Map<string, Signal<any>>;

  attributes!: NamedNodeMap & {
    name: { value: string };
    value: { value: string };
    save: { value: string };
  };
  constructor() {
    super();
    // if the signal registry is not in the window, then we need to create a new one
    // we want to use some form of context here. maybe this.closest('let-signal-registry')?
    this._signalRegistry = window.signalRegistry || signalStore;
  }
  get value(): T | undefined {
    return this.signal?.get();
  }
  set value(value: T) {
    this.signal?.set(value);
  }

  createSignal(value?: any) {
    // Use the value attribute if it exists, otherwise use the innerHTML
    if (value === undefined) {
      const strValue = this.attributes?.["value"]?.value || this.innerHTML ||
        "";
      value = parseAttributeValue(strValue);
    }
    const signal = new Signal(value);
    return signal;
  }

  connectedCallback() {
    const name = this.attributes["name"]?.value;
    if (!name) {
      throw new Error("let-signal must have a name attribute");
    }

    const save = this.attributes["save"]?.value;
    let value = undefined;
    if (save) {
      const key = "signal-" + name;
      const method = "getItem" in window[save] ? "getItem" : "get";
      const savedValue = window[save][method](key);
      if (savedValue) {
        try {
          value = JSON.parse(savedValue);
        } catch (e) {
          console.error(`Error parsing saved value for ${save}: ${savedValue}`);
        }
      }
    }

    this.signal = this.createSignal(value);

    this._signalRegistry.set(name, this.signal);
    if (save) {
      this.signal.subscribe((value) => {
        if (window[save]) {
          try {
            const method = "setItem" in window[save] ? "setItem" : "set";
            const key = "signal-" + name;
            window[save][method](key, JSON.stringify(value));
          } catch (e) {
            console.error(`Error saving value for ${save}: ${value}`);
          }
        }
      });
    }
  }

  // This should never happen, but keeping it for completeness
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }
    if (name === "name") {
      this._signalRegistry.delete(oldValue);
      this.signal = this.createSignal(this.value);
      this._signalRegistry.set(newValue, this.signal);
    } else if (name === "value") {
      this.value = parseAttributeValue(newValue);
    }
  }

  disconnectedCallback() {
    const name = this.attributes["name"].value;
    this._signalRegistry.delete(name);
    (this as any)._signalRegistry = null;
    this.signal?.cleanUp();
  }
}
