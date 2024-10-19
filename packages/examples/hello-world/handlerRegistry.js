// handlerRegistry.js
export class HandlerRegistry {
  constructor() {
    this.registry = new Map();
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
      return this.registry.get(scriptPath);
    }

    try {
      const module = await import(`./${scriptPath}`);
      const handler = module.default;
      if (typeof handler === 'function') {
        this.registry.set(scriptPath, handler);
        return handler;
      } else {
        throw new Error(`Handler at ${scriptPath} is not a function.`);
      }
    } catch (error) {
      console.error(`Failed to load handler at ${scriptPath}:`, error);
      throw error;
    }
  }
}

