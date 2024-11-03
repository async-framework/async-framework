import {
  getCurrentContext,
  popContext,
  pushContext,
} from "../component/context.ts";
import type { ComponentContext } from "./types.ts";
import { contextRegistry } from "./instance.ts";

export interface ContextWrapper<T extends HTMLElement = HTMLElement> {
  cleanup(): void;
  context: ComponentContext;
  render(fn: () => DocumentFragment): void;
  update(fn: () => DocumentFragment): void;
  mounted: boolean;
}

// Why: Sanitizes element names for context IDs
function sanitizeElementName(element: HTMLElement | null): string {
  if (!element) return "anonymous";
  const name = element.tagName.toLowerCase();
  return `ctx-${name.includes("-") ? name : `el-${name}`}`;
}

export function wrapContext<T extends HTMLElement>(
  element: T,
  fn: (context: ComponentContext) => void,
): ContextWrapper<T> {
  const parentContext = getCurrentContext();
  const context = pushContext(element, parentContext);

  const elementName = sanitizeElementName(element);
  context.id = contextRegistry.generateId(elementName, parentContext?.id);

  try {
    fn(context);
  } finally {
    popContext();
  }

  return {
    cleanup() {
      if (context.cleanup) {
        context.cleanup.forEach((cleanup) => cleanup());
        context.cleanup.clear();
      }
      if (context.signals) {
        context.signals.clear();
      }
    },
    context,
    render(fn: () => DocumentFragment) {
      // Push context before rendering
      pushContext(element, context);
      try {
        const template = fn();
        if (element) {
          element.innerHTML = "";
          element.appendChild(template.cloneNode(true));
          this.mounted = true;
        }
      } finally {
        popContext();
      }
    },
    update(fn: () => DocumentFragment) {
      if (this.mounted) {
        this.render(fn);
      }
    },
    mounted: false,
  };
}