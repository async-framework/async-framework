// deno-lint-ignore-file no-explicit-any
import { Signal } from "./signal-store";

export const signalStore = new Map<string, Signal<any>>();
