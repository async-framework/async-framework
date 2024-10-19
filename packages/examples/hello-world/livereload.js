// deno-lint-ignore-file no-window
const socket = new WebSocket(`ws://${location.host}/livereload`);

socket.onmessage = (event) => {
  console.log("LiveReload message received:", event.data);
  if (event.data === "reload") {
    console.log("Reloading page...");
    location.reload();
  }
};

socket.onclose = () => {
  console.log("LiveReload connection closed. Reconnecting in 5 seconds...");
  setTimeout(() => {
    window.location.reload();
  }, 5000);
};

socket.onopen = () => {
  console.log("LiveReload script loaded and connected to server.");
};
