// Shared state between drag handlers
export const state = {
  dropPosition: false, // "top" | "bottom" | false
  draggedId: null,
};

export function setState(key, value) {
  state[key] = value;
}

export function getState(key) {
  return state[key];
}
