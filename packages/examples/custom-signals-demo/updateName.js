export default function updateName({ signals, element }) {
  const firstName = signals.get('firstName');
  const lastName = signals.get('lastName');

  if (element.id === 'firstName') {
    firstName.value = element.value;
    console.log('firstName', firstName.value);
  } else if (element.id === 'lastName') {
    lastName.value = element.value;
    console.log('lastName', lastName.value);
  }
}
