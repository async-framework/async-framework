let state = {
  draggedId: null,
  dropPosition: null,
};

export function getState(key) {
  return state[key];
}

export function setState(key, value) {
  state[key] = value;
}
