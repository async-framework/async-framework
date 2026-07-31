import {
  createApp as createBaseApp,
  createAppFeatureSet as mergeFeatures,
  defineApp as defineBaseApp,
  readSnapshot
} from "./app.js";
import { attachFlowRegistrations } from "./flow.js";
import { createRouteRegistry, createRouter } from "./router.js";
import { createServerRegistry } from "./server-registry.js";
export { createDeclarationBus, system as asyncSystem } from "./declaration-bus.js";

const serverFeatures = {
  flow: {
    attachRegistrations: attachFlowRegistrations
  },
  router: {
    createRouteRegistry,
    createRouter
  }
};

export function createApp(appOrDefinition = Async, options = {}) {
  return createBaseApp(appOrDefinition, {
    ...options,
    serverFactory: createServerRegistry,
    features: mergeFeatures(serverFeatures, options.features)
  });
}

export function defineApp(initial, options = {}) {
  return defineBaseApp(initial, {
    ...options,
    createRuntime: createApp,
    features: mergeFeatures(serverFeatures, options.features)
  });
}

export const Async = defineApp();
export { readSnapshot };
