export default function incrementCounter({ signals }) {
  const count = signals.get('count');
  count.value++;
}
