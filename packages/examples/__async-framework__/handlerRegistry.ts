// deno-lint-ignore-file no-explicit-any
// handlerRegistry.js

export class HandlerRegistry {
  public splitIndex: string;
  private registry: Map<string, any>;
  private basePath: string;
  private origin: string;

  constructor(config: any = {}) {
    this.registry = new Map();
    // The character used to split the script path into its components
    this.splitIndex = config.splitIndex || ",";
    this.basePath = config.basePath || "./";
    this.origin = config.origin || "";

    console.log('HandlerRegistry.constructor: basePath', config.basePath);
  }

  /**
   * Retrieves a handler function by its script path.
   * If the handler is not cached, it dynamically imports the script.
   *
   * @param {string} scriptPath - The relative path to the handler script.
   * @returns {Function} - The handler function.
   */
  async getHandler(scriptPath) {
    if (this.registry.has(scriptPath)) {
      // console.log('HandlerRegistry.getHandler: returning cached handler for', scriptPath);
      return this.registry.get(scriptPath);
    }

    try {
      // console.log('HandlerRegistry.getHandler: loading async handler at', scriptPath);
      const module = await import(
        `${this.origin}${this.basePath}${scriptPath}`
      );
      const handler = module.default;
      if (typeof handler === "function") {
        this.registry.set(scriptPath, handler);
        return handler;
      } else {
        console.error(
          `HandlerRegistry.getHandler: Handler at ${scriptPath} is not a function.`,
        );
        throw new Error(`Handler at ${scriptPath} is not a function.`);
      }
    } catch (error) {
      console.error(
        `HandlerRegistry.getHandler: Failed to load handler at ${scriptPath}:`,
        error,
      );
      throw error;
    }
  }
}
