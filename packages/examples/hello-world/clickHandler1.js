// clickHandler1.js
let count = 0;

export default function clickHandler1({ element, event }) {
  count++
  element.textContent = `Clicked Me! ${count}`;
  return count
}
