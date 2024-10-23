export default function updateName({ signals, element }) {
  const firstName = signals.get("firstName");
  const lastName = signals.get("lastName");
  const fullName = signals.get("fullName");
  console.log("updateName", element.id);

  if (element.id === "firstName") {
    firstName.value = element.value;
    fullName.value = `${firstName.value} ${lastName.value}`.trim();
  } else if (element.id === "lastName") {
    lastName.value = element.value;
    fullName.value = `${firstName.value} ${lastName.value}`.trim();
  }
}
