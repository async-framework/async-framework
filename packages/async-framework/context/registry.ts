import type { BaseContext } from "./types.ts";

// Why: Manages different types of context IDs and their counters
export class ContextRegistry {
  private static instance: ContextRegistry;
  private counters: Map<string, number> = new Map();
  private contextTypes = new Set<string>();
  private contexts: Map<string, BaseContext> = new Map();

  private constructor() {
    // Register default context types
    this.registerContextType("component");
    this.registerContextType("signal");
    this.registerContextType("computed");
    this.registerContextType("resource");
    this.registerContextType("hook");
    this.registerContextType("global");
  }

  static getInstance(): ContextRegistry {
    if (!ContextRegistry.instance) {
      ContextRegistry.instance = new ContextRegistry();
    }
    return ContextRegistry.instance;
  }

  // Why: Register a new context type
  registerContextType(type: string): void {
    if (!this.contextTypes.has(type)) {
      this.contextTypes.add(type);
      this.counters.set(type, 0);
    }
  }

  // Why: Generate a unique ID for a given context type with full parent chain
  generateId(type: string, parentId?: string): string {
    if (!this.contextTypes.has(type)) {
      throw new Error(`Unknown context type: ${type}`);
    }

    const count = this.counters.get(type) || 0;
    this.counters.set(type, count + 1);

    // Build the full context path
    const parts: string[] = [];
    
    // Add parent path if it exists
    if (parentId) {
      parts.push(parentId);
    }
    
    // Add this context's ID
    parts.push(`${type}-${count}`);

    // Join with dots to create hierarchical ID
    return parts.join('.');
  }

  // Why: Store and retrieve contexts
  setContext(id: string, context: BaseContext): void {
    this.contexts.set(id, context);
  }

  getContext(id: string): BaseContext | undefined {
    return this.contexts.get(id);
  }

  // Why: Reset registry for testing purposes
  reset(): void {
    this.counters.clear();
    this.contexts.clear();
    this.contextTypes.forEach((type) => this.counters.set(type, 0));
  }
}

export const contextRegistry = ContextRegistry.getInstance();
