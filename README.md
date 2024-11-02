# Async Framework

A lightweight, signal-based framework for building reactive web applications with custom elements and async handlers.

## Core Concepts

1. **Signals**: Reactive state management
2. **Custom Elements**: Web components with async capabilities  
3. **Event Handlers**: Async event handling with dynamic imports
4. **JSX Support**: Optional JSX/TSX support for component creation

## Stability Status

| Component       | Status       | Description                                               |
| --------------- | ------------ | --------------------------------------------------------- |
| AsyncLoader     | Stable-ish   | Core async loading functionality for handlers and modules |
| HandlerRegistry | Stable-ish   | Event handler registration and management system          |
| Framework Core  | Unstable     | Core framework features and utilities                     |
| JSX Runtime     | Unstable     | JSX/TSX support and rendering (under development)         |
| Signals         | Experimental | Reactive state management (API may change)                |
| Signal-List     | Experimental | A signal-list primitive to optimize rendering lists       |
| Signal-Table    | Experimental | A signal-table primitive to optimize rendering tables     |
| Custom Elements | Experimental | Web Components integration and lifecycle management       |
| Templates       | Experimental | HTML template handling and instantiation                  |
| QwikLoader      | Experimental | Replace QwikLoader with AsyncLoader                       |

## Basic Usage

### 1. Signals

Signals are reactive state containers that automatically track dependencies and update subscribers:
```tsx
 import { signal, computed } from '@async/framework';

 // Create a basic signal
 const count = signal(0);

 // Read and write to signal
 console.log(count.value); // 0
 count.value = 1;

 // Create a computed signal
 const doubled = computed(() => count.value * 2);
```

### 2. Custom Elements

Create reactive web components using signals:
```tsx
 // counter-element.js
 import { signal } from '@async/framework';

 export class CounterElement extends HTMLElement {
   constructor() {
     super();
     this.count = signal(0);
   }

   connectedCallback() {
     this.innerHTML = /*html*/`
       <button on:click="./handlers/increment.js">Count: ${this.count.value}</button>
     `;
     
     // Auto-update view when signal changes
     const buttonEl = this.querySelector('button');
     this.count.subscribe(newValue => {
       buttonEl.textContent = `Count: ${newValue}`;
     });
   }
 }
// in main
 customElements.define('counter-element', CounterElement);
```

### 3. Async Event Handlers

Event handlers can be loaded asynchronously and chained:

HTML:
```html
 <!-- Multiple handlers separated by commas -->
 <button 
   on:click="./handlers/validate.js, ./handlers/submit.js">
   Submit
 </button>

 <!-- Handler with specific export -->
 <div on:dragover="./handlers/drag.js#onDragover">
   Drag here
 </div>
```

Handler files:
```tsx
 // handlers/validate.js
 export function handler(context) {
   const { event, element } = context;
   if (!element.value) {
     context.break(); // Prevents next handlers from executing
     return false;
   }
 }

 // handlers/submit.js
 export async function handler(context) {
   const { event, element } = context;
   const result = await submitData(element.value);
   return result;
 }
```

### 4. JSX Components

Create components using JSX/TSX:
```tsx
 // Counter.tsx
 import { signal } from '@async/framework';

 export function Counter() {
   const count = signal(0);
   
   return (
     <div>
       <h1>Count: {count}</h1>
       <button on:click={() => count.value++}>
         Increment
       </button>
     </div>
   );
 }
```
## Complete Example

Here's a complete example combining all features:

index.html:
```html
 <!DOCTYPE html>
 <html lang="en">
 <head>
   <title>Async Framework Demo</title>
 </head>
 <body>
   <todo-app>
     <input type="text" on:keyup="./handlers/input.js">
     <button on:click="./handlers/add-todo.js, ./handlers/clear-input.js">
       Add Todo
     </button>
     <ul id="todo-list"></ul>
   </todo-app>

   <script type="module">
     import { TodoApp } from './TodoApp.js';
     customElements.define('todo-app', TodoApp);
   </script>
 </body>
 </html>
```
TodoApp.js:
```tsx
 import { signal } from '@async/framework';

 export class TodoApp extends HTMLElement {
   constructor() {
     super();
     this.todos = signal([]);
     this.inputValue = signal('');
   }

   connectedCallback() {
     this.todos.subscribe(todos => {
       const list = this.querySelector('#todo-list');
       list.innerHTML = todos
         .map(todo => /*html*/`
           <li>
             ${todo}
             <button on:click="./handlers/remove-todo.js">Remove</button>
           </li>
         `)
         .join('');
     });
   }
    }
```

Handlers:
```tsx
 // handlers/input.js
 export function handler(context) {
   const { element, component } = context;
   component.inputValue.value = element.value;
 }

 // handlers/add-todo.js
 export function handler(context) {
   const { component } = context;
   const newTodo = component.inputValue.value.trim();
   if (newTodo) {
     component.todos.value = [...component.todos.value, newTodo];
   }
 }

 // handlers/clear-input.js
 export function handler(context) {
   const { component } = context;
   component.inputValue.value = '';
   context.element.querySelector('input').value = '';
 }
```

## Key Features

- 🔄 Reactive signals for state management
- ⚡ Async event handlers with dynamic imports
- 🧩 Web Components integration
- ⚛️ Optional JSX support
- 🔌 Pluggable architecture
- 📦 No build step required
- 🪶 Lightweight and performant

## Best Practices

1. Keep handlers small and focused
2. Use signals for shared state
3. Leverage async handlers for complex operations
4. Break down components into smaller, reusable pieces
5. Use computed signals for derived state

## Project Structure

```
packages/
  examples/                # Example applications
  async-loader/            # Core async loading functionality
  dev/                     # Development server
  custom-element-signals/  # Custom element integration
```

## Getting Started

1. Clone the repository
2. Install Deno if not already installed
3. Run example apps:
   deno task start

Visit http://localhost:8000 to see the examples in action.

# Framework Prompt

Use this prompt to help AI assistants understand how to work with this framework:

I'm using a custom web framework with the following characteristics:

1. It's built for Deno and uses TypeScript/JavaScript
2. Components should preferably be created using JSX/TSX (though Custom Elements are supported)
3. State management uses Signals (reactive state containers)
4. Event handling uses async handlers loaded dynamically

BASIC SETUP:
- Create an index.html with this structure:
```html
<!DOCTYPE html>
<html>
<head>
  <title>App</title>
</head>
<body>

  <div id="app"></div>

  <script type="module">
    import { render } from '@async/framework';
    import { App } from './App.tsx';
    
    // Bootstrap the application
    render(<App />, document.getElementById('app'));
  </script>

</body>
</html>
```
JSX COMPONENTS (Preferred Method):
- Create components in .tsx files
- Use signals for state management

Example App.tsx:
```tsx
import { signal } from '@async/framework';

export function App() {
  const count = signal(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button on:click="./handlers/increment.js">Add</button>
    </div>
  );
}
```

EVENT HANDLING:
- Events are handled using file paths in on: attributes
- Multiple handlers can be chained with commas
- Handlers receive a context object with:
```jsonc
{
  event,           // Original DOM event
  element,         // Target element
  dispatch(),      // Dispatch custom events
  value,           // Passed between chained handlers

  // helpers
  eventName,       // Name of the event
  attrValue,       // Original attribute value
  handlers,        // Handler registry
  signals,         // Signal registry
  templates,       // Tenplate registry
  container,       // Container element
  // TODO: component,       // Component ref
  module,          // Module file instance of the handler
  canceled,        // If we canceled the chained handlers
  break(),         // break out of chained handlers

  //  mimic Event
  preventDefault(),
  stopPropagation(),
  target,
}
```

Handler Patterns:

1. Default Export:
```tsx
 // handlers/submit.js
 // typeof module.default === 'function'
 export default function(context) {
   // Used when no specific method is referenced
 }
```
1. Named Event Handler:
```tsx
 // handlers/form.js
 // "submit" -> "on" + capitalize("submit")
 export function onSubmit(context) {
   // Automatically matched when event name is "submit"
 }
```

1. Hash-Referenced Export:
```jsx
 // handlers/drag.js
 export function myCustomNamedHandler(context) {}
 export function onDragend(context) {}
 
 // Use hash to target specific export
 <div on:drag="./handlers/drag.js#myCustomNamedHandler" />
 // dragend will resolve to onDragend
 <div on:dragend="./handlers/drag.js" /> 
```
<!--
1. Direct Handler Function:
```tsx
 // handlers/click.js
 export function handler(context) {
   // Generic handler function
 }
```
-->
1. Inline Function (JSX):
```tsx
 <button onClick={(context) => {
   console.log('Clicked!', context);
 }}>
```
Examples:
```html
 <!-- Chain multiple handler files -->
 <button on:click="./handlers/validate.js, ./handlers/submit.js">
   Submit
 </button>

 <!-- Target specific export with hash -->
 <div on:dragover="./handlers/drag.js#onDragover">
   Drop Zone
 </div>

 <!-- Use event-named export -->
 <form on:submit="./handlers/form.js">
   <!-- handler will use onSubmit export -->
 </form>
```
Handler Context:
```jsonc
{
  event,           // Original DOM event
  element,         // Target element
  dispatch(),      // Dispatch custom events
  value,           // Passed between chained handlers

  // helpers
  eventName,       // Name of the event
  attrValue,       // Original attribute value
  handlers,        // Handler registry
  signals,         // Signal registry
  templates,       // Tenplate registry
  container,       // Container element
  // TODO: component,       // Component ref
  module,          // Module file instance of the handler
  canceled,        // If we canceled the chained handlers
  break(),         // break out of chained handlers

  //  mimic Event
  preventDefault(),
  stopPropagation(),
  target,
}
```
Control Flow:
- Invoke context.break() to stop handler chain (rarely needed)
- Return values are passed to next handler via context.value

SIGNALS:
- Used for reactive state management
- Created using signal(initialValue)
- Access value with .value
- Can be computed using computed(() => ...)
- Separating get and set using createSignal(initialValue)
- Access value with [get, set] = createSignal()
Example:
```tsx
  const count = signal(0);
  count.value++;  // Updates all subscribers
  const doubled = computed(() => count.value * 2);
// passing around get and set
  const [getCount, setCount] = createSignal(0);
  setCount(getCount() + 1);  // Updates all subscribers
  const doubled = computed(() => getCount * 2);

```
<!--
HANDLER FILES:
- Create in handlers/ directory
- Export a handler function
Example handlers/increment.js:
```tsx
    export function handler(context) {
      const { components } = context;
      component.count.value++;
    }
```
-->
FILE STRUCTURE:
```
project/
  ├── index.html
  ├── App.tsx
  ├── components/
  │   └── Counter.tsx
  └── handlers/
      ├── increment.js
      └── submit.js
```

When working with this framework, please follow these conventions and patterns. The framework emphasizes clean separation of concerns, reactive state management, and async event handling.

END PROMPT