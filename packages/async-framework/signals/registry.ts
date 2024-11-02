import type { Signal } from "./signals.ts";

export class SignalRegistry {
  private static instance: SignalRegistry;
  private subscriptions = new Map<
    string,
    Map<string, Set<(value: any, oldValue: any) => void>>
  >();
  private globalId = "global";

  private constructor() {}

  static getInstance(): SignalRegistry {
    if (!SignalRegistry.instance) {
      SignalRegistry.instance = new SignalRegistry();
    }
    return SignalRegistry.instance;
  }

  subscribe<T>(
    signal: Signal<T>,
    callback: (value: T, oldValue: T) => void,
    contextId?: string,
  ): () => void {
    const signalId = signal.id;
    const subId = contextId || this.globalId;

    if (!this.subscriptions.has(signalId)) {
      this.subscriptions.set(signalId, new Map());
    }

    const signalSubs = this.subscriptions.get(signalId)!;
    if (!signalSubs.has(subId)) {
      signalSubs.set(subId, new Set());
    }

    signalSubs.get(subId)!.add(callback);

    return () => this.unsubscribe(signal, callback, contextId);
  }

  unsubscribe<T>(
    signal: Signal<T>,
    callback?: (value: T, oldValue: T) => void,
    contextId?: string,
  ): void {
    const signalId = signal.id;
    const subId = contextId || this.globalId;

    const signalSubs = this.subscriptions.get(signalId);
    if (!signalSubs) return;

    if (callback) {
      // Remove specific callback
      const callbacks = signalSubs.get(subId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          signalSubs.delete(subId);
        }
      }
    } else {
      // Remove all callbacks for context
      signalSubs.delete(subId);
    }

    if (signalSubs.size === 0) {
      this.subscriptions.delete(signalId);
    }
  }

  notify<T>(signal: Signal<T>, newValue: T, oldValue: T): void {
    const signalId = signal.id;
    const signalSubs = this.subscriptions.get(signalId);
    if (!signalSubs) return;

    signalSubs.forEach((callbacks) => {
      callbacks.forEach((callback) => callback(newValue, oldValue));
    });
  }
}

export const signalRegistry = SignalRegistry.getInstance();
