// handlerRegistry.js
export class HandlerRegistry {
  constructor() {
    this.registry = new Map();
    this.splitIndex = ",";
    this.basePath = "./";
    this.origin = "";
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
