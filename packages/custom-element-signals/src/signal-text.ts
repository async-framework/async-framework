// deno-lint-ignore-file no-explicit-any
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalText extends HTMLElement {
  static observedAttributes = [
    "name",
    "data-dangerous-html",
  ];

  attributes!: NamedNodeMap & {
    name: { value: string };
    "data-dangerous-html"?: { value: false | "false" };
  };

  signal: null | Signal<any> = null;
  _signalRegistry: Map<string, Signal<any>>;

  ready = false;
  mounted = false;

  cleanUp: null | (() => void) = null;

  constructor() {
    super();
    this._signalRegistry = window.signalRegistry || signalStore;
  }

  connectedCallback() {
    this.mounted = true;
    const name = this.attributes["name"]?.value;
    if (!name) {
      throw new Error("signal-text must have a name attribute");
    }
    this.signal = this._signalRegistry.get(name) ?? null;
    this.ready = true;

    if (this.signal == null) {
      return;
    }
    this.cleanUp = this.signal.subscribe((newValue) => {
      return this.updateChildren(newValue);
    }) ?? null;
    this.updateChildren(this.signal.get());
  }

  disconnectedCallback() {
    this.cleanUp?.();
    this.mounted = false;
    // (this as any)._signalRegistry = null;
  }

  updateChildren = (newValue: any): void => {
    if (!this.ready) {
      return;
    }
    const dangerousHtml = this.attributes["data-dangerous-html"]?.value;

    if (dangerousHtml === "false" || dangerousHtml === false) {
      return;
    }
    switch (newValue) {
      case NaN:
      case undefined:
      case null:
        this.innerHTML = "";
        break;
      default:
        this.innerHTML = `${newValue}`;
    }
  };
}
