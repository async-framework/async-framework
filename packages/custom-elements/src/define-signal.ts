import { Signal, signalStore } from "./signal-store";

class DefineSignal<T> extends HTMLElement {
  static observedAttributes = ["data-id"];

  signal: null | Signal<T> = null;

  attributes!: NamedNodeMap & { "data-id": string; "initial-value": string };

  connectedCallback() {
    // This component never renders anything.
    this.innerHTML = "";
    this.signal = new Signal(JSON.parse(this.attributes["initial-value"]));
    signalStore.set(this.attributes["data-id"], this.signal);
  }

  // This should never happen, but keeping it for completeness
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "data-id") {
      signalStore.delete(oldValue);
      this.signal != null && signalStore.set(newValue, this.signal);
    }
  }

  disconnectedCallback() {
    signalStore.delete(this.attributes["data-id"]);
    this.signal?.cleanUp();
  }
}

customElements.define("define-signal", DefineSignal);
