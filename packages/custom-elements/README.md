Here are some examples of how to use custom-elements:

1. Basic usage of DefineSignal:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Custom Elements Example</title>
    <script src="path/to/your/custom-elements.js"></script>
  </head>
  <body>
    <define-signal data-id="myCounter" initial-value="0"></define-signal>

    <p>Counter: <span id="counterDisplay"></span></p>
    <button id="incrementBtn">Increment</button>

    <script>
      // Get the signal from the store
      const counterSignal = signalStore.get("myCounter");
      const counterDisplay = document.getElementById("counterDisplay");
      const incrementBtn = document.getElementById("incrementBtn");

      // Display initial value
      counterDisplay.textContent = counterSignal.value;

      // Update display when signal changes
      counterSignal.subscribe((value) => {
        counterDisplay.textContent = value;
      });

      // Increment counter when button is clicked
      incrementBtn.addEventListener("click", () => {
        counterSignal.value++;
      });
    </script>
  </body>
</html>
```

1. Using multiple DefineSignal elements:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Multiple Signals Example</title>
    <script src="path/to/your/custom-elements.js"></script>
  </head>
  <body>
    <define-signal data-id="firstName" initial-value="'John'"></define-signal>
    <define-signal data-id="lastName" initial-value="'Doe'"></define-signal>

    <p>Full Name: <span id="fullNameDisplay"></span></p>
    <input id="firstNameInput" placeholder="First Name" />
    <input id="lastNameInput" placeholder="Last Name" />

    <script>
      const firstNameSignal = signalStore.get("firstName");
      const lastNameSignal = signalStore.get("lastName");
      const fullNameDisplay = document.getElementById("fullNameDisplay");
      const firstNameInput = document.getElementById("firstNameInput");
      const lastNameInput = document.getElementById("lastNameInput");

      function updateFullName() {
        fullNameDisplay.textContent =
          `${firstNameSignal.value} ${lastNameSignal.value}`;
      }

      // Initial update
      updateFullName();

      // Subscribe to both signals
      firstNameSignal.subscribe(updateFullName);
      lastNameSignal.subscribe(updateFullName);

      // Update signals when inputs change
      firstNameInput.addEventListener("input", (e) => {
        firstNameSignal.value = e.target.value;
      });
      lastNameInput.addEventListener("input", (e) => {
        lastNameSignal.value = e.target.value;
      });
    </script>
  </body>
</html>
```

1. Using DefineSignal with complex data:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Complex Data Signal Example</title>
    <script src="path/to/your/custom-elements.js"></script>
  </head>
  <body>
    <define-signal
      data-id="user"
      initial-value='{"name": "John Doe", "age": 30, "hobbies": ["reading", "coding"]}'
    ></define-signal>

    <div id="userInfo"></div>
    <button id="addHobbyBtn">Add Hobby</button>

    <script>
      const userSignal = signalStore.get("user");
      const userInfo = document.getElementById("userInfo");
      const addHobbyBtn = document.getElementById("addHobbyBtn");

      function updateUserInfo() {
        const user = userSignal.value;
        userInfo.innerHTML = `
                <h2>${user.name}</h2>
                <p>Age: ${user.age}</p>
                <p>Hobbies: ${user.hobbies.join(", ")}</p>
            `;
      }

      // Initial update
      updateUserInfo();

      // Subscribe to user signal
      userSignal.subscribe(updateUserInfo);

      // Add a hobby when button is clicked
      addHobbyBtn.addEventListener("click", () => {
        const newHobby = prompt("Enter a new hobby:");
        if (newHobby) {
          userSignal.value = {
            ...userSignal.value,
            hobbies: [...userSignal.value.hobbies, newHobby],
          };
        }
      });
    </script>
  </body>
</html>
```
