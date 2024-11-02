import { ContextRegistry } from "./registry.ts";
import { ContextStack } from "./stack.ts";
export const contextStack = ContextStack.getInstance();
export const contextRegistry = ContextRegistry.getInstance();
