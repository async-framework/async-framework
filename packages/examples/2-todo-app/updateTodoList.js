export default function updateTodoList({ event, element }) {
  const todos = event.detail;
  console.log("Update todo list event:", JSON.stringify(todos, null, 2));

  element.innerHTML = /*html*/ `
    <ul class="divide-y divide-gray-200">
      ${
    todos.length === 0
      ? /*html*/ `
          <li class="py-4 text-center text-gray-500 italic">No todos found</li>
        `
      : todos.map((todo) => /*html*/ `
          <li class="py-4 flex items-center justify-between ${
        todo.completed ? "bg-gray-50" : ""
      }">
            <div class="flex items-center flex-1">
              <input
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                type="checkbox"
                ${todo.completed ? "checked" : ""}
                on:change="toggleTodo.js"
                data-id="${todo.id}"
              >
              <label class="ml-3 block text-gray-900 flex-grow ${
        todo.completed ? "line-through text-gray-500" : ""
      }">${todo.text}</label>
            </div>
            <button
              class="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
              on:click="deleteTodo.js"
              data-id="${todo.id}"
            >
              [X]
            </button>
          </li>
        `).join("")
  }
    </ul>
  `;
}
