import { getState, setState } from './STATE.js';

export default function toggleTodo({ event, dispatch }) {
  const todoId = parseInt(event.target.dataset.id);
  console.log('toggleTodo event:', todoId);
  const todos = getState('todos');
  
  const updatedTodos = todos.map(todo => 
    todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
  );
  setState('todos', updatedTodos);
  
  dispatch('update-todo-list', updatedTodos);
}
