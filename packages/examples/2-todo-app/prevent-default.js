export default function preventDefault({ event, element }) {
  event.preventDefault();
  event.stopPropagation();
  console.log("Prevent default event:", element.tagName, event.cancelBubble);
}
