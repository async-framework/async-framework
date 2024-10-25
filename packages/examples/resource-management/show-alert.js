// Queue for managing alerts
const alertQueue = [];
let isProcessing = false;

// Create alert container if needed and return it
function getAlertContainer() {
  let container = document.getElementById("alertContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "alertContainer";
    container.className = "fixed top-4 right-4 z-50 flex flex-col gap-2";
    document.body.appendChild(container);
  }
  return container;
}

export async function processAlertQueue() {
  if (isProcessing || alertQueue.length === 0) return;

  isProcessing = true;
  const container = getAlertContainer();

  while (alertQueue.length > 0) {
    const { message, type } = alertQueue.shift();

    const alert = document.createElement("div");
    alert.className = `mb-4 px-4 py-3 rounded shadow-md text-white transform transition-all duration-200 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`;
    alert.textContent = message;

    // Add with animation
    alert.style.opacity = "0";
    alert.style.transform = "translateX(100%)";
    container.appendChild(alert);

    // Trigger animation
    await new Promise((resolve) => setTimeout(resolve, 50));
    alert.style.opacity = "1";
    alert.style.transform = "translateX(0)";

    // Wait and remove
    await new Promise((resolve) => setTimeout(resolve, 3000));
    alert.style.opacity = "0";
    alert.style.transform = "translateX(100%)";

    await new Promise((resolve) => setTimeout(resolve, 200));
    container.removeChild(alert);

    if (container.childElementCount === 0) {
      container.remove();
    }
  }

  isProcessing = false;
}

// TODO: refactor to signals and async-framework
export function showAlert(message, type = "success") {
  const newAlert = { message, type, id: Date.now() };
  
  alertQueue.push(newAlert);
  console.log("showAlert: alerts", alertQueue.map((alert) => alert.message).join(", "));
  processAlertQueue();
}
