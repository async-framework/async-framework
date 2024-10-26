// deno-lint-ignore-file no-explicit-any
import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalText extends HTMLElement {
  static observedAttributes = [
    "name",
    "watch"
  ];

  attributes!: NamedNodeMap & {
    name: { value: string };
    watch?: { value: string };
  };

  signal: null | Signal<any> = null;
  _signalRegistry: Map<string, Signal<any>>;
  _watch: string | null = null;

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
    this._watch = this.attributes["watch"]?.value ?? null;
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
    if (this._watch) {
      newValue = newValue[this._watch];
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
