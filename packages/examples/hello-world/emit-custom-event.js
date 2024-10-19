let count = 0;
export default function emitCustomEvent({ element, dispatch }) {
  console.log('emit custom event', element.tagName);
  dispatch('my-event', `Hello World ${count++}` );
}
