// Define types for JSX elements and children
type Signal<T> = {
  subscribe: (callback: (newValue: T, oldValue: T) => void) => void;
  value: T;
};
function isSignal<T>(value: T): boolean {
  return typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as any).type === "signal";
}
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

function renderValueBasedOnType(
  parent: HTMLElement | DocumentFragment,
  type: string,
  newValue: any,
  oldValue: any,
) {
  // TODO: render based on value type being a DOM element
  switch (type) {
    case "number":
    case "string":
    case "boolean":
      const oldValueString = String(oldValue);
      const newValueString = String(newValue);
      const textNode = document.createTextNode(newValueString);
      if (parent && !parent.firstChild) {
        parent.appendChild(textNode);
        return;
      }
      let replaced = false;
      Array.from(parent.childNodes).forEach((child) => {
        if (child.textContent === oldValueString) {
          // console.log("replaced", oldValueString, newValueString);
          parent.replaceChild(textNode, child);
          replaced = true;
        }
      });
      if (!replaced) {
        // console.log("appendChild", newValueString);
        parent.appendChild(textNode);
      }
      break;
    case "function":
      // handle iif
      // console.log("renderValueBasedOnType function", newValue);
      const result = newValue();
      return renderValueBasedOnType(parent, typeof result, result, oldValue);
    default:
      if (parent.firstElementChild === oldValue && parent.firstElementChild) {
        // console.log("replace child", newValue, oldValue);
        parent.replaceChild(newValue, parent.firstElementChild);
      } else if (parent.firstChild === oldValue && parent.firstChild) {
        // console.log("replace child", newValue, oldValue);
        parent.replaceChild(newValue, parent.firstChild);
      } else if (Array.isArray(newValue)) {
        // console.log("appendChild array", newValue);
        for (const child of newValue) {
          appendChild(parent, child);
        }
      } else if (newValue === null && oldValue) {
        if (Array.isArray(oldValue)) {
          for (const child of oldValue) {
            parent.removeChild(child);
          }
        } else {
          parent.removeChild(oldValue);
        }
      } else if (isSignal(newValue?.type)) {
        // console.log("appendChild signal", newValue);
        const value = newValue.value;
        renderValueBasedOnType(parent, typeof value, value, oldValue);
        return;
      } else {
        // console.log("appendChild", newValue);
        parent.appendChild(newValue);
      }
  }
}

// Why: Provides JSX runtime support for client-side rendering with proper typing
export function jsx(
  this: any,
  type: string | Component,
  props: Record<string, any> | null,
  ...children: JSXChild[]
): JSXElement {
  // if (type === "main" && props?.class?.includes("container")) {
  //   console.log("jsx", this, import.meta.url);
  //   debugger
  // }
  // Handle function components
  if (typeof type === "function") {
    const result = type.call(this, props);
    // Handle case where component returns a signal
    if (isSignal(result)) {
      const signal = result as Signal<any>;
      const value = signal.value;
      // const innerParent = document.createDocumentFragment();
      const parent = document.createElement("div");
      renderValueBasedOnType(parent, typeof value, value, null);
      signal.subscribe((newValue: any) => {
        // console.log("jsx.signal.subscribe", newValue);
        renderValueBasedOnType(parent, typeof newValue, newValue, value);
      });
      return parent as unknown as JSXElement;
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
        const handler = value as EventListener;
        element.addEventListener(eventName, handler);
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
  if (isSignal(child)) {
    const signal = child as Signal<any>;
    let value = signal.value;
    if (value === undefined || value === null) {
      value = "";
    }
    signal.subscribe((newValue: any, oldValue: any) => {
      renderValueBasedOnType(parent, typeof newValue, newValue, oldValue);
    });
    renderValueBasedOnType(parent, typeof value, value, null);
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
  if (isSignal(value)) {
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
