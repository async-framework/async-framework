import { parseAttributeValue } from "./parse-attribute-value";
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

// its better not to use this but ask the developer to do it
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

export class LetSignal<T> extends HTMLElement {
  static observedAttributes = ["data-id"];

  signal: null | Signal<T> = null;

  attributes!: NamedNodeMap & {
    "data-id": { value: string };
    "initial-value": { value: string };
  };

  connectedCallback() {
    // Use the initial-value attribute if it exists, otherwise use the innerHTML
    const initialValue =
      this.attributes?.["initial-value"]?.value || this.innerHTML || "";

    this.signal = new Signal(
      initialValue ? parseAttributeValue(initialValue) : undefined
    );
    const id = this.attributes["data-id"].value;
    signalStore.set(id, this.signal);
  }

  // This should never happen, but keeping it for completeness
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "data-id") {
      signalStore.delete(oldValue);
      this.signal != null && signalStore.set(newValue, this.signal);
    }
  }

  disconnectedCallback() {
    const id = this.attributes["data-id"].value;
    signalStore.delete(id);
    this.signal?.cleanUp();
  }
}
