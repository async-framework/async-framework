export function onMyEvent({ event, element }) {
  console.log("onMyEvent: on custom event triggered", element.tagName);
  console.log("onMyEvent: event detail", event.detail);
  element.innerHTML = event.detail;
}
