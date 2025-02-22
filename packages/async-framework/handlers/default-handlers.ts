export function preventDefault({ event }) {
  event.preventDefault();
}

export function stopPropagation({ event }) {
  event.stopPropagation();
}

export function preventAndStop({ event }) {
  preventDefault({ event });
  stopPropagation({ event });
}
