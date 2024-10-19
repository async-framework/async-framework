// clickHandler1.js
export default async function clickHandler1({ element, event }) {
  console.log('Button 1 clicked!', { element, event });
  element.textContent = 'Clicked 1!';
}
