// deno-lint-ignore-file no-explicit-any
// handlerRegistry.js

/**
 * Checks if a value is a promise.
 * @param {any} value - The value to check.
 * @returns {boolean} - True if the value is a promise, false otherwise.
 */
function isPromise(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}

/**
 * Converts an event string to a title case event name.
 * @param {string} eventString - The event string to convert.
 * @returns {string} - The converted event name.
 */
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

  /**
   * Constructor for the HandlerRegistry class.
   * @param {Object} config - Configuration object.
   */
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

  /**
   * Parses the attribute value into an array of script paths.
   * @param {string} attrValue - The attribute value to parse.
   * @returns {string[]} - The array of script paths.
   */
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

  /**
   * Processes the handlers for an event.
   * @param {string[] | string} attrValue - The attribute value to process.
   * @param {any} context - The context object.
   * @param {any} value - The value to pass to the handlers.
   * @returns {Promise<any>} - The value returned by the handlers.
   */
  async processHandlers(context: any) {
    const attrValue = context.attrValue;
    // let value = context._value;
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
            context.value = returnedValue;
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
    return context;
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
