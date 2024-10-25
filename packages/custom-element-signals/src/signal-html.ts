import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalHtml extends HTMLElement {
  static observedAttributes = ["name"];
  
  private signal: Signal<any> | null = null;
  private cleanUp: (() => void) | null = null;
  private template: string | null = null;
  private signalRegistry: typeof signalStore;

  constructor() {
    super();
    // if ((globalThis as any).signalRegistry) {
    //   console.log("signal-html: using global signalRegistry");
    //   this._signalRegistry = (globalThis as any).signalRegistry;
    // } else {
    //   console.log("signal-html: using signalStore");
    //   this._signalRegistry = signalStore;
    this.signalRegistry = window.signalRegistry || signalStore;
  }

  connectedCallback() {
    const name = this.getAttribute("name");
    if (!name) {
      throw new Error("signal-html must have a name attribute");
    }

    // Get template content
    const templateElement = this.querySelector("template");
    if (templateElement) {
      this.template = templateElement.innerHTML;
      templateElement.remove();
    } else {
      this.template = this.innerHTML;
    }

    this.signal = this.signalRegistry.get(name) ?? null;

    if (!this.signal) {
      console.warn(`No signal found with name: ${name}`);
      return;
    }

    // Subscribe to changes
    this.cleanUp = this.signal.subscribe((value) => {
      this.render(value);
    });

    // Initial render
    this.render(this.signal.get());
  }

  private render(value: any) {
    if (!this.template) {
      // If no template, just render the value directly
      this.innerHTML = this.interpolate("${value}", { value });
      return;
    }

    // Use template with value as context
    this.innerHTML = this.interpolate(this.template, { value, signal: this.signal });
  }

  disconnectedCallback() {
    this.cleanUp?.();
    this.signal = null;
  }

  private escapeHtml(value: unknown): string {
    // Don't escape HTML content - that's the point of signal-html
    if (value == null) return '';
    return String(value);
  }

  private interpolate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\${([^}]+)}/g, (match, expr) => {
      try {
        const value = new Function(...Object.keys(context), `return ${expr}`)(...Object.values(context));
        return this.escapeHtml(value);
      } catch (error) {
        console.error('Error interpolating template:', error);
        return '';
      }
    });
  }
}