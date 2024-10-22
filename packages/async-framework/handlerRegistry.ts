// deno-lint-ignore-file no-explicit-any
// handlerRegistry.js

function isPromise(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}

// function capitalize(string) {
//   return string.charAt(0).toUpperCase() + string.slice(1);
// }

// function titleCase(string) {
//   return string.split('-').map(capitalize).join(' ');
// }

function convertToEventName(eventString: string) {
  if (!eventString) return '';
  // First, replace any hyphens with spaces
  let processed = eventString.replace(/-/g, ' ');
  
  // Then apply title case
  processed = processed.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // Remove any remaining spaces
  return processed.replace(/\s/g, '');
}


export class HandlerRegistry {
  public splitIndex: string;
  private registry: Map<string, any>;
  private attributeRegistry: Map<string, any>;
  private eventPrefix: string;
  private defaultHandler: string;
  private basePath: string;
  private origin: string;

  constructor(config: any = {}) {
    this.registry = config.registry || new Map();
    this.attributeRegistry = config.attributeRegistry || new Map();
    this.eventPrefix = (config.eventPrefix || "on").toLowerCase().replace(/:|-/g, "");
    this.defaultHandler = config.defaultHandler || "handler";
    // The character used to split the script path into its components
    this.splitIndex = config.splitIndex || ",";
    this.basePath = config.basePath || "./";
    this.origin = config.origin || "";

    console.log("HandlerRegistry.constructor: basePath", config.basePath);
  }
  parseAttribute(attrValue: string) {
    if (!attrValue) return [];
    if (this.attributeRegistry.has(attrValue)) {
      return this.attributeRegistry.get(attrValue);
    }
    const splitIndex = this.splitIndex;
    // console.log('parseElementForEvent: event name', eventName);
    const split = attrValue.split(splitIndex);
    // console.log('parseElementForEvent: event name', split);

    // Handle multiple handlers separated by commas
    const scriptPaths = split.map((path) => path.trim()).filter((path) => path);
    // console.log('parseElementForEvent: script paths', scriptPaths);
    return scriptPaths;
  }

  async processHandlers(attrValue: string[] | string, context: any, value: any) {
    const processedAttrValue = Array.isArray(attrValue) ? attrValue : this.parseAttribute(attrValue);
    for (const scriptPath of processedAttrValue) {
      try {
        // Retrieve the handler from the registry
        let handler = await this.getHandler(scriptPath, context);
        // If we need to grab an async handler, wait for it to resolve
        if (isPromise(handler)) {
          // console.log('handleContainerEvent: waiting for handler to resolve', scriptPath);
          handler = await handler;
        }
        if (typeof handler === "function") {
          let returnedValue = handler(context);
          // if the handler returns a promise, wait for it to resolve
          if (isPromise(returnedValue)) {
            // console.log('handleContainerEvent: waiting for handler to resolve', scriptPath);
            // Execute the handler asynchronously
            returnedValue = await returnedValue;
          }
          // If the handler returns a value, store it
          if (returnedValue !== undefined) {
            value = returnedValue;
            context._value = returnedValue;
          }
          // If the handler sets break to true, stop processing further handlers for this event
          if (context.break) break;
        }
      } catch (error) {
        console.error(
          `HandlerRegistry.processHandlers: Failed to load handler at ${scriptPath}:`,
          error
        );
        throw error;
      }
      // end loop
    }
    return value;
  }

  /**
   * Retrieves a handler function by its script path.
   * If the handler is not cached, it dynamically imports the script.
   *
   * @param {string} scriptPath - The relative path to the handler script.
   * @returns {Function} - The handler function.
   */
  async getHandler(scriptPath, context) {
    if (this.registry.has(scriptPath)) {
      // console.log('HandlerRegistry.getHandler: returning cached handler for', scriptPath);
      return this.registry.get(scriptPath);
    }

    try {
      // console.log('HandlerRegistry.getHandler: loading async handler at', scriptPath);
      const module = await import(
        `${this.origin}${this.basePath}${scriptPath}`
      );
      const eventName = context.eventName;
      const handlerName = eventName ? this.eventPrefix + convertToEventName(eventName) : this.defaultHandler;
      const onHandler = eventName ? module[handlerName] : null;
      const handler = onHandler || module.default || null;
      if (typeof handler === "function") {
        if (onHandler) {
          this.registry.set(scriptPath + '|' + handlerName, handler);
        } else {
          this.registry.set(scriptPath, handler);
        }
        return handler;
      } else {
        console.error(
          `HandlerRegistry.getHandler: Handler at ${scriptPath} is not a function.`
        );
        throw new Error(`Handler at ${scriptPath} is not a function.`);
      }
    } catch (error) {
      console.error(
        `HandlerRegistry.getHandler: Failed to load handler at ${scriptPath}:`,
        error
      );
      throw error;
    }
  }
}
