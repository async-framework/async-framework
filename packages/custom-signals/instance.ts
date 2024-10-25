import { SignalRegistry } from "./signalRegistry.ts";
export const signalRegistry = new SignalRegistry();
if (typeof globalThis !== "undefined") {
  globalThis.signalRegistry = signalRegistry;
}
