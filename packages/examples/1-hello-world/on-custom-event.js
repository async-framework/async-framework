export function onMyEvent({ event, element }) {
  console.log("onMyEvent: on custom event triggered", element.tagName);
  console.log("onMyEvent: event detail", event.detail);
  element.innerHTML = event.detail;
}

// export default function onCustomEvent({ event, element }) {
//   console.log("onCustomEvent: on custom event triggered", element.tagName);
//   console.log("onCustomEvent: event detail", event.detail);
//   element.innerHTML = event.detail;
// }
