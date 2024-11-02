import type { Signal } from "../signals/signals.ts";
import { signalRegistry } from "../signals/registry.ts";
// Why: Manages component context and hook state
export interface ComponentContext {
  id: string;
  hooks: any[];
  hookIndex: number;
  signals: Set<Signal<any>>;
  cleanup: Set<() => void>;
  mounted: boolean;
  element: HTMLElement | null;
}

const contextStack: ComponentContext[] = [];
let currentContext: ComponentContext | null = null;

// Why: Creates unique IDs for components
let nextId = 0;
function generateId(): string {
  return `component-${nextId++}`;
}

// Why: Manages the current component context
export function getCurrentContext(): ComponentContext | null {
  return currentContext;
}

// Why: Creates and pushes a new component context
export function pushContext(
  element: HTMLElement | null = null,
): ComponentContext {
  const context: ComponentContext = {
    id: generateId(),
    hooks: [],
    hookIndex: 0,
    signals: new Set(),
    cleanup: new Set(),
    mounted: false,
    element,
  };

  contextStack.push(context);
  currentContext = context;
  return context;
}

// Why: Pops and cleans up the current context
export function popContext(): void {
  if (currentContext) {
    contextStack.pop();
    currentContext = contextStack[contextStack.length - 1] || null;
  }
}

// Why: Runs cleanup functions for a context
export function cleanupContext(context: ComponentContext): void {
  context.cleanup.forEach((cleanup) => cleanup());
  context.signals.forEach((signal) => {
    signalRegistry.unsubscribe(signal, undefined, context.id);
  });
  context.cleanup.clear();
  context.signals.clear();
}
