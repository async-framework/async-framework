export default function drag({ event }) {
  event.dataTransfer.setData("text/plain", event.target.dataset.id);
}
