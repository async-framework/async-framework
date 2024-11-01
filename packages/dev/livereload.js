// deno-lint-ignore-file no-window
const socket = new WebSocket(`ws://${location.host}/livereload`);

socket.onmessage = (event) => {
  console.log("LiveReload message received:", event.data);
  if (event.data === "reload") {
    console.log("livereload: Reloading page...");
    checkServerReadyAndReload();
  }
};

socket.onclose = () => {
  console.log(
    "livereload: LiveReload connection closed. Reconnecting in 500ms...",
  );
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

socket.onopen = () => {
  console.log("livereload: LiveReload script loaded and connected to server.");
};

// Check if the server is ready before reloading
function checkServerReadyAndReload() {
  console.log("Checking server readiness...");
  fetch(window.location.href, { method: 'HEAD' })
    .then((response) => {
      if (response.ok) {
        console.log("Server is ready. Reloading page...");
        location.reload();
      } else {
        console.log("Server not ready. Retrying...");
        setTimeout(checkServerReadyAndReload, 100);
      }
    })
    .catch(() => {
      console.log("Error checking server readiness. Retrying in 1 second...");
      setTimeout(checkServerReadyAndReload, 100);
    });
}
