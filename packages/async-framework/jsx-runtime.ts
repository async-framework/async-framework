// Define types for JSX elements and children
type Signal<T> = {
  subscribe: (callback: (value: T) => void) => void;
  value: T;
};
type JSXChild =
  | string
  | number
  | boolean
  | Node
  | Signal<any>
  | JSXChild[]
  | null
  | undefined;
type JSXElement = HTMLElement | DocumentFragment;
type Component = (props: any) => JSXElement | Signal<any>;

// Why: Provides JSX runtime support for client-side rendering with proper typing
export function jsx(
  this: any,
  type: string | Component,
  props: Record<string, any> | null,
  ...children: JSXChild[]
): JSXElement {
  // Handle function components
  if (typeof type === "function") {
    const result = type.call(this, props);
    // Handle case where component returns a signal
    if ((result as Signal<any>)?.subscribe) {
      const signal = result as Signal<any>;
      const placeholder = document.createTextNode(String(signal.value));
      signal.subscribe((newValue: any) => {
        placeholder.textContent = String(newValue);
      });
      return placeholder as unknown as JSXElement;
    }
    return result as JSXElement;
  }

  const element = document.createElement(type);

  if (!props) {
    if (children.length) {
      for (const child of children) {
        appendChild(element, child);
      }
    }
    return element;
  }

  try {
    const entries = Object.entries(props);
    for (const [key, value] of entries) {
      if (key === "children") {
        const propsChildren = Array.isArray(value) ? value : [value];
        for (const child of propsChildren) {
          appendChild(element, child);
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.toLowerCase().slice(2);
        element.addEventListener(eventName, value as EventListener);
      } else if (value !== null && value !== undefined) {
        handleAttribute(element, key, value);
      }
    }
    if (!props.children && children.length) {
      for (const child of children) {
        appendChild(element, child);
      }
    }
  } catch (error) {
    console.error("Error setting attributes:", error);
    throw error;
  }

  return element;
}

// Helper function to handle different types of children
function appendChild(
  parent: HTMLElement | DocumentFragment,
  child: JSXChild,
): void {
  if (child === null || child === undefined) {
    return;
  }

  // Handle signals
  if ((child as Signal<any>)?.subscribe) {
    const signal = child as Signal<any>;
    const textNode = document.createTextNode(String(signal.value));
    signal.subscribe((newValue: any) => {
      textNode.textContent = String(newValue);
    });
    parent.appendChild(textNode);
    return;
  }

  // Handle primitive values
  if (
    typeof child === "string" || typeof child === "number" ||
    typeof child === "boolean"
  ) {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }

  // Handle DOM nodes
  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  // Handle arrays (e.g., from map operations)
  if (Array.isArray(child)) {
    for (const subChild of child) {
      appendChild(parent, subChild);
    }
    return;
  }

  // Handle any other values
  parent.appendChild(document.createTextNode(String(child)));
}

// Helper function to handle attributes
function handleAttribute(element: HTMLElement, key: string, value: any): void {
  if (value?.subscribe) {
    // Handle signal values in attributes
    if (key === "value" && element instanceof HTMLInputElement) {
      // Special handling for input value
      element.value = String(value.value);
      value.subscribe((newValue: any) => {
        element.value = String(newValue);
      });
    } else {
      // Handle other attributes
      value.subscribe((newValue: any) => {
        if (newValue === null || newValue === undefined) {
          element.removeAttribute(key);
        } else {
          element.setAttribute(key, String(newValue));
        }
      });
      element.setAttribute(key, String(value.value));
    }
  } else {
    // Handle regular attributes
    if (key === "value" && element instanceof HTMLInputElement) {
      element.value = String(value);
    } else {
      element.setAttribute(key, String(value));
    }
  }
}

export const jsxs = jsx;
export const jsxDEV = jsx;

// Why: Provides Fragment support with proper typing
export const Fragment = (
  props: { children: JSXChild | JSXChild[] },
): DocumentFragment => {
  const fragment = document.createDocumentFragment();
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children];

  for (const child of children) {
    appendChild(fragment, child);
  }

  return fragment;
};
