import { Signal } from "./signal-store";
import { signalStore } from "./signal-store-instance";

export class SignalList<T> extends HTMLElement {
  static observedAttributes = ["name", "template", "let-item", "let-index"];

  private _signalRegistry: Map<string, Signal<any>>;
  private _template: string | null = null;
  private signal: Signal<any> | null = null;
  private cleanUp: (() => void) | null = null;
  private letItem: string = "item";
  private letIndex: string = "index";
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
    indexAttributes: [],
  };

  private _attributePatterns: Record<string, {
    element: Element;
    attributeName: string;
    pattern: string;
  }> = {};

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

    this.letItem = this.getAttribute("let-item") || "item";
    this.letIndex = this.getAttribute("let-index") || "index";

    // Get template
    let templateContent = this.getAttribute("template");
    const templateElement = this.querySelector("template");

    if (templateElement) {
      templateContent = templateElement.innerHTML;
      templateElement.remove();
    }

    if (!templateContent) {
      throw new Error(
        "signal-list must have a template attribute or template child element",
      );
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

  private async handleValue(
    newValue: unknown,
    oldValue: unknown,
  ): Promise<void> {
    if (!this._template) return;

    try {
      const newItems: unknown[] = [];

      if (newValue != null) {
        if (this.isArrayLike(newValue)) {
          const array = Array.isArray(newValue)
            ? newValue
            : Array.from(newValue as ArrayLike<unknown>);
          newItems.push(...array);

          // Early return if arrays are identical
          if (this.areArraysEqual(this.items, newItems)) {
            return;
          }

          // Fast path for appending items
          if (this.isArrayAppend(this.items, newItems)) {
            // Only handle the new items
            const startIndex = this.items.length;
            newItems.slice(startIndex).forEach((item, i) => {
              this.currentIndex = startIndex + i;
              this.appendItem(item);
            });
            this.items = newItems;
            return;
          }

          // Handle mixed arrays by treating each item according to its type
          this.handleMixedArray(newItems);
        } else {
          // Iterator path remains unchanged
          await this.collectIteratorItems(newValue, newItems);
          this.innerHTML = "";
          this.itemElements.clear();
          this.items = newItems;

          newItems.forEach((item, index) => {
            this.currentIndex = index;
            this.appendItem(item);
          });
        }
      } else {
        this.innerHTML = "";
        this.itemElements.clear();
        this.items = [];
      }
    } catch (error) {
      console.error("Error processing signal-list value:", error);
    }
  }

  // Add helper to check if new array is just appending items
  private isArrayAppend(oldArray: unknown[], newArray: unknown[]): boolean {
    if (newArray.length < oldArray.length) return false;
    
    // Check if all existing items are unchanged and in the same order
    return oldArray.every((item, index) => {
      const oldKey = this.isPrimitive(item) ? `${item}_${index}` : item;
      const newItem = newArray[index];
      const newKey = this.isPrimitive(newItem) ? `${newItem}_${index}` : newItem;
      return oldKey === newKey;
    });
  }

  private handleMixedArray(newItems: unknown[]): void {
    // Create position maps that handle both primitive and object values
    const oldItemPositions = this.items.map((item, index) => ({
      item,
      index,
      isPrimitive: this.isPrimitive(item),
    }));

    const newItemPositions = newItems.map((item, index) => ({
      item,
      index,
      isPrimitive: this.isPrimitive(item),
    }));

    const elementUpdates = new Map<number, HTMLElement | null>();
    const usedOldElements = new Set<HTMLElement>();
    const indexChanges = new Set<number>();

    // Match elements based on type and value
    newItemPositions.forEach(
      ({ item: newItem, index: newIndex, isPrimitive }) => {
        if (isPrimitive) {
          // Handle primitive values by finding matching unused elements
          const matchingOldPos = oldItemPositions.find((
            { item: oldItem, index: oldIndex, isPrimitive: oldIsPrimitive },
          ) =>
            oldIsPrimitive &&
            oldItem === newItem &&
            !usedOldElements.has(
              this.itemElements.get(oldItem + "_" + oldIndex)!,
            )
          );

          if (matchingOldPos) {
            const oldElement = this.itemElements.get(
              matchingOldPos.item + "_" + matchingOldPos.index,
            )!;
            usedOldElements.add(oldElement);
            elementUpdates.set(newIndex, oldElement);
            // Only mark for update if index changed
            if (matchingOldPos.index !== newIndex) {
              indexChanges.add(newIndex);
            }
          } else {
            elementUpdates.set(newIndex, null); // Mark for creation
          }
        } else {
          // Handle objects by reference equality
          const existingElement = this.itemElements.get(newItem);
          if (existingElement && !usedOldElements.has(existingElement)) {
            usedOldElements.add(existingElement);
            elementUpdates.set(newIndex, existingElement);
            // Find old index and check if it changed
            const oldPos = oldItemPositions.find(pos => pos.item === newItem);
            if (oldPos && oldPos.index !== newIndex) {
              indexChanges.add(newIndex);
            }
          } else {
            elementUpdates.set(newIndex, null); // Mark for creation
          }
        }
      },
    );

    // Remove unused elements
    for (const [key, element] of this.itemElements) {
      if (!usedOldElements.has(element)) {
        element.remove();
        this.itemElements.delete(key);
      }
    }

    // Clear for reordering
    this.innerHTML = "";
    this.items = newItems;

    // Add elements in the new order and only update indices that changed
    newItems.forEach((item, index) => {
      const existingElement = elementUpdates.get(index);
      if (existingElement) {
        // Only update index if it changed
        if (indexChanges.has(index)) {
          this.updateItemIndex(existingElement, index);
        }
        this.appendChild(existingElement);

        // Update the key in itemElements map for primitives
        if (this.isPrimitive(item)) {
          // Remove old key
          for (const [key, el] of this.itemElements.entries()) {
            if (el === existingElement) {
              this.itemElements.delete(key);
              break;
            }
          }
          // Add new key with updated index
          this.itemElements.set(`${item}_${index}`, existingElement);
        }
      } else {
        this.currentIndex = index;
        this.appendItem(item);
      }
    });
  }

  private isPrimitive(value: unknown): boolean {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value === undefined
    );
  }

  private async collectIteratorItems(
    value: unknown,
    items: unknown[],
  ): Promise<void> {
    // es2018
    if (
      "asyncIterator" in Symbol &&
      (Symbol as any).asyncIterator in Object(value)
    ) {
      for await (const item of value as AsyncIterable<unknown>) {
        items.push(item);
      }
    } else if (Symbol.iterator in Object(value)) {
      for (const item of value as Iterable<unknown>) {
        items.push(item);
      }
    } else if (typeof (value as Iterator<unknown>).next === "function") {
      const iterator = value as Iterator<unknown>;
      let result = iterator.next();
      while (!result.done) {
        items.push(result.value);
        result = iterator.next();
      }
    }
  }

  private updateItemIndex(element: HTMLElement, index: number): void {
    if (this.templateInfo.hasIndexInAttributes && this._attributePatterns) {
      this.walkElements(element, (el) => {
        Array.from(el.attributes || []).forEach((attr) => {
          const key = this.getAttributeKey(el, attr.name);
          const pattern = this._attributePatterns[key];
          if (pattern) {
            const value = pattern.pattern.replace(
              new RegExp(`\\\${${this.letIndex}}`, "g"),
              String(index),
            );
            el.setAttribute(attr.name, value);
          }
        });
      });
    }
  }

  private appendItem(item: unknown): void {
    if (!this._template) return;

    // Parse template if not already parsed
    if (
      !this.templateInfo.hasIndexInAttributes &&
      !this.templateInfo.hasIndexInContent
    ) {
      this.parseTemplate(this._template);
    }

    const temp = document.createElement("template");
    let processedTemplate = this._template;

    // Handle index in content
    if (this.templateInfo.hasIndexInContent) {
      processedTemplate = processedTemplate.replace(
        new RegExp(`\\\${${this.letIndex}}`, "g"),
        String(this.currentIndex),
      );
    }

    // Replace item placeholders with proper property access
    processedTemplate = processedTemplate
      // Handle property access first (e.g., ${item.id}, ${item.name})
      .replace(
        new RegExp(`\\\${${this.letItem}\\.([^}]+)}`, "g"),
        (_, prop) => {
          if (typeof item === "object" && item !== null) {
            const value = this.getNestedValue(
              item as Record<string, unknown>,
              prop,
            );
            return this.escapeHtml(String(value));
          }
          return "";
        },
      )
      // Handle array access (e.g., ${item[0]})
      .replace(
        new RegExp(`\\\${${this.letItem}\\[([^\\]]+)\\]}`, "g"),
        (_, index) => {
          if (Array.isArray(item)) {
            const value = item[Number(index)];
            return this.escapeHtml(String(value));
          }
          return "";
        },
      )
      // Handle direct item references last (e.g., ${item})
      .replace(
        new RegExp(`\\\${${this.letItem}}`, "g"),
        this.escapeHtml(String(item)),
      );

    temp.innerHTML = processedTemplate;
    const element = temp.content.firstElementChild;

    if (element instanceof HTMLElement) {
      // No need to store patterns in dataset anymore
      this.updateItemIndex(element, this.currentIndex);
      this.appendChild(element);
      const key = this.isPrimitive(item)
        ? `${item}_${this.currentIndex}`
        : item;
      this.itemElements.set(key, element);
    }
  }

  // Add this helper method to safely get nested object values
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: unknown, part: string) => {
      if (current && typeof current === "object") {
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
    // (this as any)._signalRegistry = null;
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
      (typeof value === "object" && value !== null && "length" in value);
  }

  // Add this helper method to compare arrays
  private areArraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }

  // Add this as a class method
  private walkElements(
    element: Element,
    callback: (element: Element) => void,
  ): void {
    // Process current element
    callback(element);

    // Recursively process child elements
    Array.from(element.children).forEach((child) =>
      this.walkElements(child, callback)
    );
  }

  // Update parseTemplate to use walkElements
  private parseTemplate(template: string): void {
    const temp = document.createElement("template");
    temp.innerHTML = template;
    const rootElement = temp.content.firstElementChild;

    if (!rootElement) return;

    // Reset patterns
    this._attributePatterns = {};

    // Walk through all elements and collect patterns
    this.walkElements(rootElement, (element) => {
      const attributes = Array.from(element.attributes || []);
      attributes.forEach((attr) => {
        if (attr.value.includes(`\${${this.letIndex}}`)) {
          const key = this.getAttributeKey(element, attr.name);
          this._attributePatterns[key] = {
            element,
            attributeName: attr.name,
            pattern: attr.value,
          };
        }
      });
    });

    // Update template info
    this.templateInfo.indexAttributes = Object.keys(this._attributePatterns);
    this.templateInfo.hasIndexInAttributes =
      this.templateInfo.indexAttributes.length !== 0;

    // Check for index in content
    this.templateInfo.hasIndexInContent = template.includes(
      `\${${this.letIndex}}`,
    );
  }

  // Helper to generate a unique key for each attribute
  private getAttributeKey(element: Element, attrName: string): string {
    // Create a path to the element
    const path: string[] = [];
    let current = element;
    while (current.parentElement) {
      const index = Array.from(current.parentElement.children).indexOf(current);
      path.unshift(`${current.tagName}:${index}`);
      current = current.parentElement;
    }
    return `${path.join(">")}@${attrName}`;
  }
}
