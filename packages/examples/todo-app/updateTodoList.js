export default function updateTodoList({ event, element }) {
  const todos = event.detail;
  console.log("Update todo list event:", todos.length);

  element.innerHTML = /*html*/ `
    <ul class="divide-y divide-gray-200">
      ${
    todos.length === 0
      ? /*html*/ `
          <li class="py-4 text-center text-gray-500 italic">No todos found</li>
        `
      : todos.map((todo) => /*html*/ `
          <li
            class="py-4 flex items-center justify-between ${
        todo.completed ? "bg-gray-50" : ""
      }"
            data-id="${todo.id}"
          >
            <div
              class="flex items-center flex-1"
              on:click="prevent-default.js, toggleTodo.js"
            >
              <input
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                type="checkbox"
                ${todo.completed ? "checked" : ""}
                on:change="prevent-default.js, toggleTodo.js"
              >
              <label class="ml-3 block text-gray-900 flex-grow ${
        todo.completed ? "line-through text-gray-500" : ""
      }">
                ${todo.text}
              </label>
            </div>
            <button
              class="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
              on:click="deleteTodo.js"
            >
              [X]
            </button>
          </li>
        `).join("")
  }
    </ul>
  `;
}
