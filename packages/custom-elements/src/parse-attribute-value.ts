export function parseAttributeValue(value: string) {
  // First, check if it's 'true' or 'false'
  if (value === "true") return true;
  if (value === "false") return false;

  // Then, try to parse it as a number
  const num = Number(value);
  if (!isNaN(num)) return num;

  // Finally, try to parse it as JSON
  try {
    return JSON.parse(value);
  } catch (e) {
    // If it's not valid JSON, return the original string
    return value;
  }
}
