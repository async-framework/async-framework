// clickHandler2.js
let count = 0;

export default function clickHandler2({ element, event }) {
  count++
  element.textContent = `Clicked Me! ${count}`;
  return count
}
