import { getState, setState } from "./STATE.js";

export default function drop({ event, dispatch }) {
  event.preventDefault();
  const taskId = parseInt(event.dataTransfer.getData("text"));
  const targetColumn = event.target.closest("[id]").id;

  const board = getState("board");
  let movedTask;

  const updatedBoard = Object.keys(board).reduce((acc, column) => {
    if (column === targetColumn) {
      acc[column] = [...board[column]];
    } else {
      const [task] = board[column].filter(t => t.id === taskId);
      if (task) {
        movedTask = task;
        acc[column] = board[column].filter(t => t.id !== taskId);
      } else {
        acc[column] = board[column];
      }
    }
    return acc;
  }, {});

  if (movedTask) {
    updatedBoard[targetColumn].push(movedTask);
  }

  setState("board", updatedBoard);
  dispatch("update-board", updatedBoard);
}
