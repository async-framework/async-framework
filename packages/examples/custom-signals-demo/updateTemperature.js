export default function updateTemperature({ signals, element }) {
  const celsius = signals.get('celsius');
  const value = parseFloat(element.value) || 0;
  console.log('updateTemperature', value);

  celsius.value = value;
}
