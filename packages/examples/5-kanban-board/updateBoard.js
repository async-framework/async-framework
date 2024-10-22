export default function updateBoard({ event, element }) {
  const board = event.detail;
  console.log("Update board event:", board);

  Object.keys(board).forEach(column => {
    const columnElement = document.getElementById(column);
    columnElement.innerHTML = board[column].map(task => `
      <div
        class="bg-gray-100 p-2 mb-2 rounded shadow cursor-move"
        draggable="true"
        on:dragstart="drag.js"
        data-id="${task.id}"
      >
        ${task.text}
        <button
          class="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
          on:click="deleteTask.js"
        >
          [X]
        </button>
      </div>
    `).join('');
  });
}
