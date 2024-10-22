import { getState, setState } from "./STATE.js";

export default function deleteTodo({ event, dispatch }) {
  const todoId = parseInt(event.target.dataset.id);
  console.log("deleteTodo: todoId", todoId);
  const todos = getState("todos");

  const updatedTodos = todos.filter((todo) => todo.id !== todoId);

  setState("todos", updatedTodos);
  dispatch("update-todo-list", updatedTodos);
}
