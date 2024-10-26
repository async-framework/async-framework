// Why: Provides centralized template management for signal components
export const templateRegistry = new Map<string, string>();

export function getOrCreateTemplate(
  templateId: string | null,
  fallbackContent?: () => string
): string | null {
  // If no templateId, return null to let component handle fallback logic
  if (!templateId) return null;

  // Return cached template if exists
  if (templateRegistry.has(templateId)) {
    return templateRegistry.get(templateId) || null;
  }

  // Look for template in document first
  const templateElement = document.getElementById(templateId);
  if (templateElement) {
    const template = templateElement.innerHTML;
    templateRegistry.set(templateId, template);
    templateElement.remove();
    return template;
  }

  // If fallback content provided, use that
  if (fallbackContent) {
    templateRegistry.set(templateId, fallbackContent());
    return templateRegistry.get(templateId) || null;
  }

  return null;
}
