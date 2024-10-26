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
    
    const alert = document.createElement("div");
    alert.className = `
      mb-4 px-4 py-3 rounded-lg shadow-lg 
      transform transition-all duration-200 
      border-l-4 flex justify-between items-start gap-3
      ${type === "success" ? "bg-white border-green-500" : "bg-white border-red-500"}
      translate-x-full opacity-0
    `;

    // Create message container
    const messageDiv = document.createElement("div");
    messageDiv.className = `${type === "success" ? "text-green-700" : "text-red-700"}`;
    messageDiv.textContent = message;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.className = `
      text-gray-500 hover:text-gray-700 
      font-bold text-xl leading-none 
      focus:outline-none
    `;
    
    // Add click handler to close button
    closeButton.onclick = async () => {
      await animateOut(alert);
      if (alert.isConnected) {
        container.removeChild(alert);
        if (container.childElementCount === 0) {
          container.remove();
        }
      }
    };

    // Assemble alert
    alert.appendChild(messageDiv);
    alert.appendChild(closeButton);
    container.appendChild(alert);

    // Animate in one at a time
    await new Promise(resolve => setTimeout(resolve, 100)); // Delay between alerts
    alert.style.transform = "translateX(0)";
    alert.style.opacity = "1";
    alert.style.transition = "all 0.2s ease-out";

    // Set up auto-removal after delay
    setTimeout(async () => {
      if (alert.isConnected) {
        await animateOut(alert);
        if (alert.isConnected) {
          container.removeChild(alert);
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
    setTimeout(() => processAlertQueue(), 250); // Delay before processing next batch
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

  // Remove the skip check and always queue the alert
  alertQueue.push(newAlert);
  console.log(
    "showAlert: queued alert",
    `${type} - ${message}`,
    `(${alertQueue.length} in queue)`
  );
  processAlertQueue();
}
