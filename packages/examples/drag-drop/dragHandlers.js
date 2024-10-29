import { getState, setState } from "./STATE.js";
import { showAlert } from "../resource-management/show-alert.js";

export function onDragstart({ event, element }) {
  console.log("onDragstart", event, element);
  const id = element.dataset.id;
  setState("draggedId", id);
  event.dataTransfer.setData("note", id);
}

export function onDragover({ event, element }) {
  // console.log("onDragover", event, element);
  event.preventDefault();

  if (!event.dataTransfer?.types.includes("note")) {
    setState("dropPosition", false);
    element.dataset.dropPosition = "";
    return;
  }

  const rect = element.getBoundingClientRect();
  const isTop = event.clientY < rect.top + rect.height / 2;
  setState("dropPosition", isTop ? "top" : "bottom");
  element.dataset.dropPosition = isTop ? "top" : "bottom";
}

export function onDrop({ event, element }) {
  console.log("onDrop", event, element);
  event.preventDefault();

  try {
    if (!event.dataTransfer?.types.includes("note")) {
      return;
    }

    const noteId = event.dataTransfer.getData("note");
    const dropPosition = getState("dropPosition");

    if (!noteId || noteId === element.dataset.id) {
      return;
    }

    if (dropPosition === "top") {
      if (element.previousElementSibling?.dataset.id === noteId) {
        return;
      }
      element.parentNode.insertBefore(
        document.querySelector(`[data-id="${noteId}"]`),
        element,
      );
    }

    if (dropPosition === "bottom") {
      if (element.nextElementSibling?.dataset.id === noteId) {
        return;
      }
      element.parentNode.insertBefore(
        document.querySelector(`[data-id="${noteId}"]`),
        element.nextSibling,
      );
    }

    showAlert("Note moved successfully!", "success");
  } finally {
    setState("dropPosition", false);
    element.dataset.dropPosition = "";
  }
}
