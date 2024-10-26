import { getOrCreateTemplate } from "./template-registry";

// Why: Provides consistent template handling and warning messages across components
export function getTemplateContent(
  element: HTMLElement,
  templateId: string | null,
  componentName: string
): string | null {
  // Try template registry first if templateId exists
  const registryTemplate = getOrCreateTemplate(templateId, () => {
    const templateElement = element.querySelector("template");
    if (templateElement) {
      const content = templateElement.innerHTML;
      templateElement.remove();
      return content;
    }
    // Use innerHTML if available
    if (element.innerHTML.trim()) {
      return element.innerHTML;
    }
    return '';
  });
  if (registryTemplate) {
    return registryTemplate;
  }

  // Warn if no template found
  console.warn(`${componentName} must have either:
  1. A template element with id="${templateId}"
  2. An inline <template> element
  3. Direct innerHTML content`);

  return null;
}
