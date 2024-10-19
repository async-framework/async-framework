import { Signal, signalStore } from './signal-store';

class SignalContent extends HTMLElement {
  static observedAttributes = [
    'data-id',
    'data-transformers',
    'data-dangerous-html',
  ];

  attributes!: NamedNodeMap & {
    'data-id': string;
    'data-transformers': string;
    'data-dangerous-html'?: boolean;
  };

  signal: null | Signal<any> = null;
  transformers: Array<(input: any) => any> = [];

  ready = false;
  mounted = false;

  cleanUp: null | (() => void) = null;

  connectedCallback() {
    this.mounted = true;
    this.signal = signalStore.get(JSON.parse(this.attributes['data-id'])) ??
      null;
    const transformers = JSON.parse(this.attributes['data-transformers']) ??
      null;

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
    }

    this.transformers = transformers;
    if (this.signal == null) {
      return;
    }
    this.cleanUp = this.signal.subscribe(this.updateChildren) ?? null;
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

    if (this.attributes['data-dangerous-html'] != null) {
      this.innerHTML = String(transformedValue);
    } else {
      this.innerText = String(transformedValue);
    }
  };
}
