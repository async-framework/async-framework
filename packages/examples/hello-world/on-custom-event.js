export default function onCustomEvent({ event, element }) {
  console.log('on custom event triggered', element.tagName);
  console.log(event.detail);
  element.innerHTML = event.detail;
}
