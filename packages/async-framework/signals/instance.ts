import { SignalRegistry } from "./registry.ts";

export const signalRegistry = SignalRegistry.getInstance();

if (typeof globalThis !== "undefined") {
  globalThis.signalRegistry = signalRegistry;
}
