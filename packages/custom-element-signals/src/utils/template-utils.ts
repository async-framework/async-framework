/**
 * Escapes HTML special characters in a string
 * @param value - The value to escape
 * @param escapeHtml - Whether to escape HTML characters (default: true)
 */
export function escapeValue(value: unknown, escapeHtml = true): string {
  // Handle null or undefined
  if (value == null) return '';
  
  // Convert to string if not already
  const str = String(value);
  
  if (!escapeHtml) return str;
  
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Interpolates a template string with values from a context object
 * @param template - The template string containing ${expressions}
 * @param context - Object containing values for interpolation
 * @param options - Configuration options
 */
export function interpolateTemplate(
  template: string, 
  context: Record<string, unknown>,
  options: { escapeHtml?: boolean } = {}
): string {
  const { escapeHtml = true } = options;
  
  return template.replace(/\${([^}]+)}/g, (match, expr) => {
    try {
      // Handle JSON.stringify specifically
      if (expr.includes('JSON.stringify')) {
        const objPath = expr.match(/JSON\.stringify\((.*?)\)/)?.[1];
        if (!objPath) return '';
        
        const value = new Function(...Object.keys(context), `return ${objPath}`)(...Object.values(context));
        return escapeValue(JSON.stringify(value), escapeHtml);
      }
      
      // Regular expression evaluation
      const value = new Function(...Object.keys(context), `return ${expr}`)(...Object.values(context));
      return escapeValue(value, escapeHtml);
    } catch (error) {
      console.error('Error interpolating template:', error);
      return '';
    }
  });
}
