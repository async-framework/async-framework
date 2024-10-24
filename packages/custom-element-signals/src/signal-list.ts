import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalList<T> extends HTMLElement {
  static observedAttributes = ["name", "template", "let-item", "let-index"];

  private _signalRegistry: Map<string, Signal<any>>;
  private _template: string | null = null;
  private signal: Signal<any> | null = null;
  private cleanUp: (() => void) | null = null;
  private letItem: string = 'item';
  private letIndex: string = 'index';
  private currentIndex = 0;
  private items: unknown[] = [];
  private itemElements = new Map<unknown, HTMLElement>();

  private templateInfo: {
    hasIndexInAttributes: boolean;
    hasIndexInContent: boolean;
    indexAttributes: string[];
  } = {
    hasIndexInAttributes: false,
    hasIndexInContent: false,
    indexAttributes: []
  };

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

    this.letItem = this.getAttribute("let-item") || 'item';
    this.letIndex = this.getAttribute("let-index") || 'index';

    // Get template
    let templateContent = this.getAttribute("template");
    const templateElement = this.querySelector("template");
    
    if (templateElement) {
      templateContent = templateElement.innerHTML;
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
    this.cleanUp = this.signal.subscribe((newValue, oldValue) => {
      this.handleValue(newValue, oldValue);
    });
    
    // Initial render
    this.handleValue(this.signal.get(), []);
  }

  private async handleValue(newValue: unknown, oldValue: unknown): Promise<void> {
    if (!this._template) return;

    try {
      const newItems: unknown[] = [];
      
      if (newValue != null) {
        if (this.isArrayLike(newValue)) {
          const array = Array.isArray(newValue) ? newValue : Array.from(newValue as ArrayLike<unknown>);
          newItems.push(...array);

          // Early return if arrays are identical
          if (this.areArraysEqual(this.items, newItems)) {
            return;
          }

          // Handle mixed arrays by treating each item according to its type
          this.handleMixedArray(newItems);
        } else {
          // Iterator path remains unchanged
          await this.collectIteratorItems(newValue, newItems);
          this.innerHTML = '';
          this.itemElements.clear();
          this.items = newItems;
          
          newItems.forEach((item, index) => {
            this.currentIndex = index;
            this.appendItem(item);
          });
        }
      } else {
        this.innerHTML = '';
        this.itemElements.clear();
        this.items = [];
      }
    } catch (error) {
      console.error("Error processing signal-list value:", error);
    }
  }

  private handleMixedArray(newItems: unknown[]): void {
    // Create position maps that handle both primitive and object values
    const oldItemPositions = this.items.map((item, index) => ({ 
      item, 
      index,
      isPrimitive: this.isPrimitive(item)
    }));
    
    const newItemPositions = newItems.map((item, index) => ({ 
      item, 
      index,
      isPrimitive: this.isPrimitive(item)
    }));

    const elementUpdates = new Map<number, HTMLElement | null>();
    const usedOldElements = new Set<HTMLElement>();

    // Match elements based on type and value
    newItemPositions.forEach(({ item: newItem, index: newIndex, isPrimitive }) => {
      if (isPrimitive) {
        // Handle primitive values by finding matching unused elements
        const matchingOldPos = oldItemPositions.find(({ item: oldItem, index: oldIndex, isPrimitive: oldIsPrimitive }) => 
          oldIsPrimitive && 
          oldItem === newItem && 
          !usedOldElements.has(this.itemElements.get(oldItem + '_' + oldIndex)!)
        );

        if (matchingOldPos) {
          const oldElement = this.itemElements.get(matchingOldPos.item + '_' + matchingOldPos.index)!;
          usedOldElements.add(oldElement);
          elementUpdates.set(newIndex, oldElement);
          this.updateItemIndex(oldElement, newIndex);
        } else {
          elementUpdates.set(newIndex, null); // Mark for creation
        }
      } else {
        // Handle objects by reference equality
        const existingElement = this.itemElements.get(newItem);
        if (existingElement && !usedOldElements.has(existingElement)) {
          usedOldElements.add(existingElement);
          elementUpdates.set(newIndex, existingElement);
          this.updateItemIndex(existingElement, newIndex);
        } else {
          elementUpdates.set(newIndex, null); // Mark for creation
        }
      }
    });

    // Remove unused elements
    for (const [key, element] of this.itemElements) {
      if (!usedOldElements.has(element)) {
        element.remove();
        this.itemElements.delete(key);
      }
    }

    // Clear for reordering
    this.innerHTML = '';
    this.items = newItems;

    // Add elements in the new order
    newItems.forEach((item, index) => {
      const existingElement = elementUpdates.get(index);
      if (existingElement) {
        this.appendChild(existingElement);
      } else {
        this.currentIndex = index;
        this.appendItem(item);
      }
    });
  }

  private isPrimitive(value: unknown): boolean {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    );
  }

  private async collectIteratorItems(value: unknown, items: unknown[]): Promise<void> {
    // es2018
    if ('asyncIterator' in Symbol && (Symbol as any).asyncIterator in Object(value)) {
      for await (const item of value as AsyncIterable<unknown>) {
        items.push(item);
      }
    } else if (Symbol.iterator in Object(value)) {
      for (const item of value as Iterable<unknown>) {
        items.push(item);
      }
    } else if (typeof (value as Iterator<unknown>).next === 'function') {
      const iterator = value as Iterator<unknown>;
      let result = iterator.next();
      while (!result.done) {
        items.push(result.value);
        result = iterator.next();
      }
    }
  }

  private updateItemIndex(element: HTMLElement, index: number): void {
    // Update index attributes
    this.updateItemIndexAttributes(element, index);
  }

  private updateItemIndexAttributes(element: HTMLElement, index: number): void {
    if (!this.templateInfo.hasIndexInAttributes) return;

    // Restore original attribute patterns and update index
    const originalAttrs = element.dataset.originalIndexAttrs;
    if (originalAttrs) {
      const attrs = JSON.parse(originalAttrs);
      for (const [attr, pattern] of Object.entries(attrs)) {
        if (typeof pattern === 'string') {
          const value = pattern.replace(
            new RegExp(`\\\${${this.letIndex}}`, 'g'),
            String(index)
          );
          element.setAttribute(attr, value);
        }
      }
    }
  }

  private appendItem(item: unknown): void {
    if (!this._template) return;

    // Parse template if not already parsed
    if (!this.templateInfo.hasIndexInAttributes && !this.templateInfo.hasIndexInContent) {
      this.parseTemplate(this._template);
    }

    const temp = document.createElement('template');
    let processedTemplate = this._template;

    // Handle index in content
    if (this.templateInfo.hasIndexInContent) {
      processedTemplate = processedTemplate.replace(
        new RegExp(`\\\${${this.letIndex}}`, 'g'),
        String(this.currentIndex)
      );
    }

    // Replace item placeholders with proper property access
    processedTemplate = processedTemplate
      // Handle direct item references
      .replace(new RegExp(`\\\${${this.letItem}}(?![\.\\[])}`, 'g'), 
        this.escapeHtml(String(item)))
      // Handle property access (e.g., ${item.id}, ${item.name})
      .replace(new RegExp(`\\\${${this.letItem}\\.([^}]+)}`, 'g'), (_, prop) => {
        if (typeof item === 'object' && item !== null) {
          const value = this.getNestedValue(item as Record<string, unknown>, prop);
          return this.escapeHtml(String(value));
        }
        return '';
      })
      // Handle array access (e.g., ${item[0]})
      .replace(new RegExp(`\\\${${this.letItem}\\[([^\\]]+)\\]}`, 'g'), (_, index) => {
        if (Array.isArray(item)) {
          const value = item[Number(index)];
          return this.escapeHtml(String(value));
        }
        return '';
      });

    temp.innerHTML = processedTemplate;
    const element = temp.content.firstElementChild;

    if (element instanceof HTMLElement) {
      // Store original index attributes if needed for updates
      if (this.templateInfo.hasIndexInAttributes) {
        element.dataset.originalIndexAttrs = JSON.stringify(
          Object.fromEntries(
            this.templateInfo.indexAttributes.map(attr => [
              attr,
              element.getAttribute(attr)
            ])
          )
        );
      }
      
      this.appendChild(element);
      const key = this.isPrimitive(item) ? `${item}_${this.currentIndex}` : item;
      this.itemElements.set(key, element);
    }
  }

  // Add this helper method to safely get nested object values
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, part: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  // Get the current items
  getItems(): unknown[] {
    return [...this.items];
  }

  disconnectedCallback() {
    this.cleanUp?.();
    this.items = [];
    this.itemElements.clear();
    (this as any)._signalRegistry = null;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private isArrayLike(value: unknown): boolean {
    return Array.isArray(value) || 
           (typeof value === 'object' && value !== null && 'length' in value);
  }

  // Add this helper method to compare arrays
  private areArraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }

  private parseTemplate(template: string): void {
    // Create a temporary element to parse the template
    const temp = document.createElement('template');
    temp.innerHTML = template;
    const element = temp.content.firstElementChild;

    if (!element) return;

    // Check for index in attributes
    const attributes = Array.from(element.attributes || []);
    this.templateInfo.indexAttributes = attributes
      .filter(attr => attr.value.includes(`\${${this.letIndex}}`))
      .map(attr => attr.name);
    
    this.templateInfo.hasIndexInAttributes = this.templateInfo.indexAttributes.length > 0;
    
    // Check for index in content
    this.templateInfo.hasIndexInContent = template.includes(`\${${this.letIndex}}`);
  }
}
