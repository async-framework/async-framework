import { parseAttributeValue } from "./parse-attribute-value";
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class DefineSignal<T> extends HTMLElement {
  static observedAttributes = ["data-id"];

  signal: null | Signal<T> = null;

  attributes!: NamedNodeMap & {
    "data-id": { value: string };
    "initial-value": { value: string };
  };

  connectedCallback() {
    // This component never renders anything.
    this.innerHTML = "";
    const initialValue = this.attributes?.["initial-value"]?.value;
    this.signal = new Signal(
      initialValue ? parseAttributeValue(initialValue) : undefined,
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
