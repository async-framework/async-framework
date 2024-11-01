import { SignalRegistry } from "./registry.ts";
export const signalRegistry = new SignalRegistry();

if (typeof globalThis !== "undefined") {
  globalThis.signalRegistry = signalRegistry;
}
