export default function updateTodoList({ event, element }) {
  const todos = event.detail;
  console.log('Update todo list event:', JSON.stringify(todos, null, 2));
  if (todos.length === 0) {
    element.innerHTML = /*html*/`
    <p class="text-center text-gray-500">No todos found</p>
    `;
    return;
  }

  element.innerHTML = todos.map(todo => /*html*/`
    <li class="flex items-center justify-between bg-gray-50 p-2 rounded">
      <span class="${todo.completed ? 'line-through text-gray-500' : ''}">${todo.text}</span>
      <div>
        <button
          class="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded mr-2"
          on:click="toggleTodo.js"
          data-id="${todo.id}"
        >
          ${todo.completed ? 'Undo' : 'Complete'}
        </button>
        <button
          class="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
          on:click="deleteTodo.js"
          data-id="${todo.id}"
        >
          Delete
        </button>
      </div>
    </li>
  `).join('');
}
