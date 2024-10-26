export function cancelConfirmModal({ signals }) {
  const confirmModalSignal = signals.get("confirmModalState");
  confirmModalSignal.value = {
    isOpen: false,
    message: "",
    onConfirm: null,
  };
}

export function confirmAction({ signals }) {
  const confirmModalSignal = signals.get("confirmModalState");
  const { onConfirm } = confirmModalSignal.value;

  // Execute the stored callback
  if (typeof onConfirm === "function") {
    onConfirm();
  }

  // Close the modal
  cancelConfirmModal({ signals });
}
