import { getState, setState } from "./STATE.js";

export default function addTodo({ element, dispatch }) {
  console.log("addTodo: event triggered");
  const input = element.querySelector("input");
  const todoText = input.value.trim();

  if (todoText) {
    console.log("addTodo: adding todo", todoText);
    const todos = getState("todos");
    const newTodos = [...todos, {
      id: Date.now(),
      text: todoText,
      completed: false,
    }];
    setState("todos", newTodos);
    input.value = "";
    dispatch("update-todo-list", newTodos);
  }
}
