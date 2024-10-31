import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";
import { interpolateTemplate, transformTemplate, generateTemplateId } from "./utils/template-utils";
import { getOrCreateTemplate } from "./utils/template-registry";
import { getTemplateContent } from "./utils/template-helpers";

export class SignalHtml extends HTMLElement {
  static observedAttributes = ["name", "template-id"];
  private signal: Signal<any> | null = null;
  private cleanUp: (() => void) | null = null;
  private template: string = '';
  private _signalRegistry: typeof signalStore;

  constructor() {
    super();
    if ((globalThis as any).signalRegistry) {
      // console.log("signal-html: using global signalRegistry");
      this._signalRegistry = (globalThis as any).signalRegistry;
    } else {
      // console.log("signal-html: using signalStore");
      this._signalRegistry = signalStore;
    }
    
  }
  
  connectedCallback() {
    if (!this.isConnected) return;
    const name = this.getAttribute("name");
    if (!name) {
      throw new Error("signal-html must have a name attribute");
    }

    const templateId = this.getAttribute("template-id") || generateTemplateId(this);
    const content = getTemplateContent(this, templateId, "signal-html");
    
    if (content) {
      this.template = transformTemplate(content);
    } else {
      return;
    }

    this.signal = this._signalRegistry.get(name) ?? null;

    if (!this.signal) {
      console.warn(`No signal found with name: ${name}`);
      return;
    }

    // Subscribe to changes
    this.cleanUp = this.signal.subscribe((value) => {
      this.render(value);
    });

    // Initial render
    this.render();
  }

  private render(value?: unknown) {
    try {
      const signalValue = value || this.signal?.get() || {};
      const context = { $this: signalValue };
      this.innerHTML = interpolateTemplate(this.template, context, { escapeHtml: false });
    } catch (error) {
      this.innerHTML = ''; // Clear content on error
    }
  }

  disconnectedCallback() {
    this.cleanUp?.();
    this.signal = null;
  }
}
