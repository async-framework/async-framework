// logger.js

export default function logger({ element, event, value }) {
  console.log("logger:", { element: element.tagName, event: event.type, value });
}
