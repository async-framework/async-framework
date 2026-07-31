const descriptorTypes = new Set(["handler", "component", "asyncSignal", "partial", "route"]);
const defaultBaseUrl = "_async";

export function defineRegistrySnapshot(snapshot = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("defineRegistrySnapshot(snapshot) requires an object.");
  }
  return snapshot;
}

export function createLazyRegistry(options = {}) {
  const registryAssets = normalizeRegistryAssets(options.registryAssets ?? options.assets);
  const importModule = options.importModule ?? ((url) => import(url));
  const moduleCache = new Map();
  const exportCache = new Map();

  return {
    registryAssets,

    resolveUrl(type, id, descriptor) {
      return resolveDescriptorUrl(type, id, descriptor, registryAssets);
    },

    async resolve(type, id, descriptor) {
      if (!isLazyDescriptor(descriptor)) {
        return descriptor;
      }
      const cacheKey = `${type}:${id}`;
      if (exportCache.has(cacheKey)) {
        return exportCache.get(cacheKey);
      }

      const resolved = resolveDescriptorUrl(type, id, descriptor, registryAssets);
      let modulePromise = moduleCache.get(resolved.moduleUrl);
      if (!modulePromise) {
        modulePromise = Promise.resolve().then(() => importModule(resolved.moduleUrl));
        moduleCache.set(resolved.moduleUrl, modulePromise);
      }
      let module;
      try {
        module = await modulePromise;
      } catch (cause) {
        if (moduleCache.get(resolved.moduleUrl) === modulePromise) {
          moduleCache.delete(resolved.moduleUrl);
        }
        throw new Error(`Lazy ${type} "${id}" failed to import ${resolved.moduleUrl}: ${errorMessage(cause)}`, {
          cause
        });
      }
      const value = resolveExport(module, resolved.exportNames, type, id);
      exportCache.set(cacheKey, value);
      return value;
    },

    inspect() {
      return {
        registryAssets,
        modules: [...moduleCache.keys()],
        exports: [...exportCache.keys()]
      };
    }
  };
}

export function normalizeRegistryAssets(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? defaultBaseUrl);
  const paths = {
    component: "component",
    handler: "handler",
    asyncSignal: "asyncSignal",
    partial: "partial",
    route: "route",
    ...(options.paths ?? {})
  };

  for (const [type, value] of Object.entries(paths)) {
    if (!descriptorTypes.has(type)) {
      continue;
    }
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError(`Registry asset path for "${type}" must be a non-empty string.`);
    }
  }

  return {
    baseUrl,
    paths
  };
}

// Shared lazy-descriptor invocation wrapper. Handlers, partials, components,
// and async signals all wrap descriptors in the same resolve -> typecheck ->
// apply shape; the label only affects the error message.
// Deliberate duplicate of errors.js errorMessage: lazy-registry rides in the
// stream bundle via signals.js, and importing errors.js here would drag
// AsyncError, codes, and diagnostics (~1.7KB gzip) into stream.min.js.
function errorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

export function createLazyInvoker(lazyRegistry, type, id, descriptor, label) {
  async function invokeLazy(...args) {
    const resolved = await lazyRegistry.resolve(type, id, descriptor);
    if (typeof resolved !== "function") {
      throw new TypeError(`${label} "${id}" did not resolve to a function.`);
    }
    return resolved.apply(this, args);
  }
  // The wrapper's function name is observable (e.g. renderComponent error
  // messages read Component.name), so keep the historical Lazy<Label> names.
  Object.defineProperty(invokeLazy, "name", {
    configurable: true,
    value: `Lazy${label.replaceAll(" ", "")}`
  });
  return invokeLazy;
}

export function isLazyDescriptor(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.url === "string"
  );
}

export function sameRegistryValue(left, right) {
  if (left === right) {
    return true;
  }
  if (isLazyDescriptor(left) && isLazyDescriptor(right)) {
    return stableStringify(left) === stableStringify(right);
  }
  return false;
}

export function publicRegistryValue(value, id) {
  if (isLazyDescriptor(value)) {
    return { ...value };
  }
  return { id };
}

function resolveDescriptorUrl(type, id, descriptor, registryAssets) {
  if (!descriptorTypes.has(type)) {
    throw new Error(`Registry type "${type}" does not support lazy descriptors.`);
  }
  if (!isLazyDescriptor(descriptor)) {
    throw new TypeError(`Registry descriptor for "${type}:${id}" requires a url.`);
  }

  const { path, hash } = splitHash(descriptor.url);
  const moduleUrl = resolveModuleUrl(type, path, registryAssets);
  const exportNames = hash
    ? [hash]
    : inferredExportNames(id, path);

  return {
    moduleUrl,
    exportNames,
    url: hash ? `${moduleUrl}#${hash}` : moduleUrl
  };
}

function resolveModuleUrl(type, path, registryAssets) {
  if (isAbsoluteUrl(path) || path.startsWith("/") || path.startsWith("./") || path.startsWith("../")) {
    return path;
  }
  const typePath = registryAssets.paths[type] ?? type;
  return joinUrl(registryAssets.baseUrl, typePath, path);
}

function resolveExport(module, exportNames, type, id) {
  for (const name of exportNames) {
    if (name in module) {
      return module[name];
    }
  }
  throw new Error(`Lazy ${type} "${id}" did not export ${exportNames.map((name) => `"${name}"`).join(", ")}.`);
}

function inferredExportNames(id, path) {
  const names = [];
  const leaf = id.split(".").filter(Boolean).at(-1);
  const basename = path
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.[^.]+$/, "");
  for (const name of [leaf, basename, "default"]) {
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

function splitHash(url) {
  const index = url.indexOf("#");
  if (index === -1) {
    return { path: url, hash: "" };
  }
  return {
    path: url.slice(0, index),
    hash: url.slice(index + 1)
  };
}

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new TypeError("registryAssets.baseUrl must be a non-empty string.");
  }
  if (isAbsoluteUrl(baseUrl) || baseUrl.startsWith("/") || baseUrl.startsWith("./") || baseUrl.startsWith("../")) {
    return stripTrailingSlash(baseUrl);
  }
  return `/${stripSlashes(baseUrl)}`;
}

function joinUrl(...parts) {
  const [first, ...rest] = parts;
  return [stripTrailingSlash(first), ...rest.map(stripSlashes)].filter(Boolean).join("/");
}

function stripSlashes(value) {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/g, "");
}

function isAbsoluteUrl(value) {
  return /^[A-Za-z][A-Za-z\d+.-]*:/.test(value);
}


function stableStringify(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return JSON.stringify(Object.keys(value).sort().map((key) => [key, value[key]]));
}
