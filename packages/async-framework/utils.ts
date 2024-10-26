/**
 * Checks if a value is a promise.
 * @param {any} value - The value to check.
 * @returns {boolean} - True if the value is a promise, false otherwise.
 */
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value === "object" && typeof value.then === "function";
}

// Why: Escapes special characters in selectors to ensure they are treated as literal characters in CSS selectors
export function escapeSelector(selector: string) {
  return selector.replace(/[^\w\s-]/g, (match) => `\\${match}`);
}
