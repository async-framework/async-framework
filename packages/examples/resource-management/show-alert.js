// Queue for managing alerts
const alertQueue = [];
let isProcessing = false;
let processAgain = false;

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

function createStackContainer(message, type) {
  const stackKey = `${type}-${message}`;
  const stackContainer = document.createElement("div");
  stackContainer.className = "relative";
  stackContainer.dataset.stackKey = stackKey;
  return stackContainer;
}

export async function processAlertQueue() {
  if (alertQueue.length === 0) return;
  if (isProcessing) {
    console.log("processAlertQueue: waiting for current alert to finish");
    processAgain = true;
    return;
  }

  isProcessing = true;
  const container = getAlertContainer();

  while (alertQueue.length > 0) {
    const { message, type } = alertQueue.shift();
    const stackKey = `${type}-${message}`;
    
    let stackContainer = container.querySelector(`[data-stack-key="${stackKey}"]`);
    if (!stackContainer) {
      stackContainer = createStackContainer(message, type);
      container.appendChild(stackContainer);
    }

    const alert = document.createElement("div");
    alert.className = `
      mb-4 px-4 py-3 rounded-lg shadow-lg 
      transform transition-all duration-200 
      border-l-4 flex justify-between items-start gap-3
      ${type === "success" ? "bg-white border-green-500" : "bg-white border-red-500"}
      translate-x-full opacity-0
    `;

    // Add stacking effect if there are existing alerts
    const existingAlerts = stackContainer.children;
    if (existingAlerts.length > 0) {
      alert.style.position = "absolute";
      alert.style.top = "-3px";
      alert.style.right = "-3px";
      alert.style.width = "100%";
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `${type === "success" ? "text-green-700" : "text-red-700"}`;
    messageDiv.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.className = `
      text-gray-500 hover:text-gray-700 
      font-bold text-xl leading-none 
      focus:outline-none
    `;
    
    closeButton.onclick = async () => {
      await animateOut(alert);
      if (alert.isConnected) {
        stackContainer.removeChild(alert);
        if (stackContainer.childElementCount === 0) {
          container.removeChild(stackContainer);
        }
        if (container.childElementCount === 0) {
          container.remove();
        }
      }
    };

    alert.appendChild(messageDiv);
    alert.appendChild(closeButton);
    stackContainer.appendChild(alert);

    // Animate in
    await new Promise(resolve => setTimeout(resolve, 100));
    alert.style.transform = "translateX(0)";
    alert.style.opacity = "1";
    alert.style.transition = "all 0.2s ease-out";

    // Auto-removal
    setTimeout(async () => {
      if (alert.isConnected) {
        await animateOut(alert);
        if (alert.isConnected) {
          stackContainer.removeChild(alert);
          if (stackContainer.childElementCount === 0) {
            container.removeChild(stackContainer);
          }
          if (container.childElementCount === 0) {
            container.remove();
          }
        }
      }
    }, 5000);
  }

  isProcessing = false;
  if (processAgain) {
    processAgain = false;
    setTimeout(() => processAlertQueue(), 250);
  }
}

// Helper function for animating alerts out
async function animateOut(alert) {
  alert.style.transform = "translateX(100%)";
  alert.style.opacity = "0";
  await new Promise(resolve => setTimeout(resolve, 200));
}

// TODO: refactor to signals and async-framework
export function showAlert(message, type = "success") {
  const newAlert = { message, type, id: Date.now() };
  alertQueue.push(newAlert);
  console.log(
    "showAlert: queued alert",
    `${type} - ${message}`,
    `(${alertQueue.length} in queue)`
  );
  processAlertQueue();
}
