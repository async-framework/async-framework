import { getState, setState } from "./STATE.js";

export default function deleteTask({ event, dispatch }) {
  const taskId = parseInt(event.target.dataset.id);
  const board = getState("board");

  const updatedBoard = Object.keys(board).reduce((acc, column) => {
    acc[column] = board[column].filter(task => task.id !== taskId);
    return acc;
  }, {});

  setState("board", updatedBoard);
  dispatch("update-board", updatedBoard);
}
