import { readAttribute } from "./attributes.js";
import { renderTemplate } from "./html.js";

// Shared DOM helpers for the loader and the boundary receiver. These were
// duplicated with drift: the receiver's element walk missed the TreeWalker
// optimization, and its toFragment cloned inputs while the loader adopted
// them — an undocumented semantic fork now expressed as an explicit option.

export function selectAll(scope, selector, options = {}) {
  const elements = [];
  if (options.includeRoot !== false && scope?.nodeType === 1 && scope.matches?.(selector)) {
    elements.push(scope);
  }
  elements.push(...(scope?.querySelectorAll?.(selector) ?? []));
  return elements;
}

// Enumerate every element under `scope` with a single TreeWalker instead of
// querySelectorAll("*"), which avoids materializing a NodeList per pass and
// lets callers share one walk. Equivalent set to querySelectorAll("*") plus
// the optional root. Falls back to selectAll where TreeWalker is unavailable.
export function walkElements(scope, options = {}) {
  if (!scope) return [];
  const doc = scope.nodeType === 9 ? scope : scope.ownerDocument;
  if (!doc?.createTreeWalker) return selectAll(scope, "*", options);
  const elements = [];
  if (options.includeRoot !== false && scope.nodeType === 1) {
    elements.push(scope);
  }
  const walker = doc.createTreeWalker(scope, 0x1 /* NodeFilter.SHOW_ELEMENT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    elements.push(node);
  }
  return elements;
}

export function elementsIn(scope, options) {
  // A pre-collected list (options.elements) lets one walk serve several passes.
  return options?.elements !== undefined ? options.elements : walkElements(scope, options);
}

export function isAsyncSuspense(element) {
  return element?.tagName === "ASYNC-SUSPENSE";
}

export function boundaryIdFor(element, attributeConfig) {
  if (isAsyncSuspense(element) && element.hasAttribute?.("for")) {
    return element.getAttribute("for");
  }
  return readAttribute(element, attributeConfig, "async", "boundary");
}

export function findBoundaryElement(root, boundaryId, attributeConfig) {
  for (const element of elementsIn(root)) {
    if (boundaryIdFor(element, attributeConfig) === String(boundaryId)) {
      return element;
    }
  }
  return null;
}

// clone: copy node inputs instead of adopting them (the receiver patches from
// reusable sources; the loader moves caller-owned nodes). renderHtml: custom
// serializer for non-node values (the loader threads template render options
// through; default renders template results and passes strings through).
export function toFragment(value, documentRef, options = {}) {
  const { clone = false, renderHtml } = options;
  if (value?.nodeType === 11) {
    return clone ? value.cloneNode(true) : value;
  }
  if (value?.tagName === "TEMPLATE") {
    return value.content.cloneNode(true);
  }
  if (value?.nodeType) {
    const fragment = documentRef.createDocumentFragment();
    fragment.append(clone ? value.cloneNode(true) : value);
    return fragment;
  }
  const template = documentRef.createElement("template");
  if (renderHtml) {
    template.innerHTML = renderHtml(value);
  } else {
    template.innerHTML = typeof value === "string" ? value : renderTemplate(value);
  }
  return template.content.cloneNode(true);
}
