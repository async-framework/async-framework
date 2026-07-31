import { isTemplateResult, renderTemplate } from "./html.js";
import { AsyncError, asyncErrorCodes } from "./errors.js";
import { attachRegistryInspection, createRegistryStore, createTypedRegistryMethods } from "./registry-store.js";
import { createLazyInvoker, createLazyRegistry, isLazyDescriptor } from "./lazy-registry.js";

export function createPartialRegistry(initialMap = {}, options = {}) {
  const registryStore = options.registry ?? createRegistryStore();
  const type = options.type ?? "partial";
  const entries = registryStore._map(type);
  const lazyRegistry = options.lazyRegistry ?? createLazyRegistry(options);
  const lazyPartials = new Map();

  const crud = createTypedRegistryMethods({
    label: "Partial",
    entries,
    assertEntryId: assertId,
    validate(id, fn) {
      if (typeof fn !== "function" && !isLazyDescriptor(fn)) {
        throw new TypeError(`Partial "${id}" must be a function.`);
      }
    },
    onUnregister(id) {
      lazyPartials.delete(id);
    },
    result: () => registry
  });

  const registry = attachRegistryInspection({
    ...crud,

    resolve(id) {
      assertId(id);
      const partial = entries.get(id);
      if (!isLazyDescriptor(partial)) {
        return partial;
      }
      if (!lazyPartials.has(id)) {
        lazyPartials.set(id, createLazyInvoker(lazyRegistry, type, id, partial, "Partial"));
      }
      return lazyPartials.get(id);
    },

    async render(id, props = {}, context = {}) {
      assertId(id);
      const fn = registry.resolve(id);
      if (!fn) {
        throw new AsyncError({
          code: asyncErrorCodes.partialNotRegistered,
          message: `Partial "${id}" is not registered.`,
          context: { partial: id }
        });
      }

      const partialContext = {
        ...context,
        id,
        props,
        cache: context.cache,
        partials: registry
      };
      const result = await fn.call(partialContext, props);
      return normalizePartialResult(result, partialContext);
    }
  }, registryStore, type);

  registry.registerMany(initialMap);
  return registry;
}

export function normalizePartialResult(result, context = {}) {
  if (result == null) {
    return {};
  }
  if (isPartialEnvelope(result)) {
    const normalized = {
      ...result
    };
    if (Object.hasOwn(result, "html") && result.html !== undefined) {
      normalized.html = renderPartialValue(result.html, context);
    }
    return {
      ...normalized
    };
  }

  return { html: renderPartialValue(result, context) };
}

function renderPartialValue(value, context) {
  if (value?.nodeType) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  if (isTemplateResult(value)) {
    return renderTemplate(value, templateRenderOptions(context));
  }
  return renderTemplate(value, templateRenderOptions(context));
}

function templateRenderOptions(context) {
  return {
    attributes: context.loader?.attributes,
    signals: context.signals,
    bind: context.loader?._registerBinding?.bind(context.loader)
  };
}

function isPartialEnvelope(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !isTemplateResult(value) &&
      !value.nodeType &&
      !value.tagName &&
      (Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null ||
        Object.hasOwn(value, "html") ||
        Object.hasOwn(value, "signals") ||
        Object.hasOwn(value, "boundary") ||
        Object.hasOwn(value, "redirect") ||
        Object.hasOwn(value, "status") ||
        Object.hasOwn(value, "cache"))
  );
}

function assertId(id) {
  if (typeof id !== "string" || id.length === 0) {
    throw new TypeError("Partial id must be a non-empty string.");
  }
}
