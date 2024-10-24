import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalList<T> extends HTMLElement {
  static observedAttributes = ["name", "template"];

  private _signalRegistry: Map<string, Signal<any>>;
  private _template: string | null = null;
  private signal: Signal<any> | null = null;
  private cleanUp: (() => void) | null = null;

  constructor() {
    super();
    this._signalRegistry = window.signalRegistry || signalStore;
  }
  get value(): T | undefined {
    return this.signal?.get();
  }
  set value(value: T) {
    this.signal?.set(value);
  }

  connectedCallback() {
    const name = this.getAttribute("name");
    if (!name) {
      throw new Error("signal-list must have a name attribute");
    }

    // Get template from attribute or child template element
    let templateContent = this.getAttribute("template");
    const templateElement = this.querySelector("template");
    
    if (templateElement) {
      templateContent = templateElement.innerHTML;
      // Remove the template element since we don't want it rendered
      templateElement.remove();
    }

    if (!templateContent) {
      throw new Error("signal-list must have a template attribute or template child element");
    }

    this._template = templateContent;
    this.signal = this._signalRegistry.get(name) ?? null;

    if (!this.signal) {
      console.warn(`No signal found with name: ${name}`);
      return;
    }

    // Subscribe to changes
    this.cleanUp = this.signal.subscribe((newValue) => this.render(newValue));
    
    // Initial render
    this.render(this.signal.get());
  }

  disconnectedCallback() {
    this.cleanUp?.();
    (this as any)._signalRegistry = null
  }

  private render(items: unknown[]): void {
    if (!Array.isArray(items)) {
      console.warn("signal-list value must be an array");
      return;
    }

    if (!this._template) {
      return;
    }

    const html = items.map((item, index) => {
      // Replace template variables with proper escaping for security
      return this._template!
        .replace(/\${item}/g, this.escapeHtml(String(item)))
        .replace(/\${index}/g, String(index))
        // Allow accessing object properties with proper escaping
        .replace(/\${item\.([^}]+)}/g, (_, prop) => {
          const value = typeof item === 'object' && item !== null ? 
            (item as Record<string, unknown>)[prop] : undefined;
          return this.escapeHtml(String(value));
        });
    }).join("");

    this.innerHTML = html;
  }

  // Security: Escape HTML to prevent XSS
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
