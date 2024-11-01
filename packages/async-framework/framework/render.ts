// create global signalRegistry
import { signalRegistry } from "../signals/instance.ts";
import { templateRegistry } from "../templates/instance.ts";
import { HandlerRegistry } from "../handlers/index.ts";
import { AsyncLoader } from "../loader/loader.ts";

export interface RenderConfig {
  root?: HTMLElement;
  basePath?: string;
  origin?: string;
  eventPrefix?: string;
  containerAttribute?: string;
  events?: string[];
  context?: Record<string, unknown>;
}

export function render(
  element: HTMLElement,
  config: RenderConfig | HTMLElement,
) {
  if (!config) {
    config = document.querySelector("[data-container='root']") as HTMLElement;
  }
  // Handle case where config is just the root element
  let domRoot = config instanceof HTMLElement ? config : config.root;
  const renderConfig = config instanceof HTMLElement ? {} : config;
  if (!domRoot) {
    domRoot = document.querySelector("[data-container='root']") as HTMLElement;
    if (!domRoot) {
      throw new Error("Root element is required for rendering");
    }
  }
  const currentPath = location.pathname;
  const containerAttribute = renderConfig.containerAttribute ??
    "data-container";
  const context = renderConfig.context ?? {};
  const events = renderConfig.events ?? [];
  // should be /handlers?
  const basePath = renderConfig.basePath ?? currentPath;
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
    signalRegistry,
    templateRegistry,
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
  const asyncFramework = {
    loader,
    handlers: registry,
    unmount: () => {
      domRoot.removeChild(element);
    },
  };
  return asyncFramework;
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
