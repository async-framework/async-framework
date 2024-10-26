// Why: Provides centralized template management for signal components
export const templateRegistry = new Map<string, string>();


export function getTemplate(templateId: string): string | null {
  return templateRegistry.get(templateId) || null;
}

export function setTemplate(templateId: string, template: string): void {
  templateRegistry.set(templateId, template);
}

export function getOrCreateTemplate(
  templateId: string | null
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
    templateElement.remove();
    console.log(`Using template from template-id: ${templateId}`);
    if (template) {
      templateRegistry.set(templateId, template);
      return template;
    }
  }

  return null;
}
