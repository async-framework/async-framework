import { HandlerRegistry } from "./handler-registry.ts";
import { AsyncLoader } from "./async-loader.ts";

export interface RenderConfig {
  root?: HTMLElement;
  basePath?: string;
  origin?: string;
  eventPrefix?: string;
  containerAttribute?: string;
  events?: string[];
  context?: Record<string, unknown>;
}

export function render(element: HTMLElement, config: RenderConfig | HTMLElement) {
  // Handle case where config is just the root element
  const domRoot = config instanceof HTMLElement ? config : config.root;
  const renderConfig = config instanceof HTMLElement ? {} : config;
  if (!domRoot) {
    throw new Error("Root element is required for rendering");
  }
  const containerAttribute = renderConfig.containerAttribute ?? "data-container";
  const context = renderConfig.context ?? {};
  const events = renderConfig.events ?? [];
  const basePath = renderConfig.basePath ?? "./handlers/";
  const origin = renderConfig.origin ?? "";
  const eventPrefix = renderConfig.eventPrefix ?? "on:";

  // Set container attribute for event delegation
  if (!domRoot.hasAttribute(containerAttribute)) {
    domRoot.setAttribute(containerAttribute, "root");
  }

  // Create HandlerRegistry with config
  const registry = new HandlerRegistry({
    basePath,
    origin,
    eventPrefix,
  });

  // Create AsyncLoader with config and registry
  const loader = new AsyncLoader({
    events,
    handlerRegistry: registry,
    containerAttribute,
    eventPrefix,
    domRoot,
    context,
  });

  // Append element to root
  domRoot.appendChild(element);

  // Initialize event handling
  loader.init();

  // Return utilities for cleanup and access to loader/registry
  return {
    loader,
    handlers: registry,
    unmount: () => {
      domRoot.removeChild(element);
    },
  };
}

// Example usage:
// Simple:
// render(<App />, document.getElementById('app'));

// With config:
// render(<App />, {
//   root: document.getElementById('app'),
//   basePath: './handlers/',
//   origin: '',
//   eventPrefix: 'on:',
//   context: { someSharedState: {} }
// }); 