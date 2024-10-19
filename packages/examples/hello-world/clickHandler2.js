// clickHandler2.js
export default async function clickHandler2({ element, event }) {
  console.log('Button 2 clicked!', { element, event });
  element.textContent = 'Clicked 2!';
}
