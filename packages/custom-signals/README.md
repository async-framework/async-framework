# Custom Signals

This package provides a reactive programming model using signals. Signals are values that can change over time and automatically update dependent computations.

## Features

- Simple signals with get/set operations
- Computed signals with automatic dependency tracking
- Global registry of signals with string IDs
- Automatic cleanup and garbage collection

## Usage

### Creating a simple signal

import { createSignal } from './signal.js';

const count = createSignal('count', 0);

console.log(count.get()); // 0

count.set(5);
console.log(count.get()); // 5

// Subscribe to changes
const unsubscribe = count.subscribe((newValue) => {
  console.log('Count changed:', newValue);
});

count.set(10); // Logs: "Count changed: 10"

// Unsubscribe when no longer needed
unsubscribe();

### Creating a computed signal

import { createSignal, computed } from './signal.js';

const width = createSignal('width', 5);
const height = createSignal('height', 10);

const area = computed('area', () => width.get() * height.get());

console.log(area.get()); // 50

width.set(7);
console.log(area.get()); // 70

// Subscribe to computed signal
area.subscribe((newArea) => {
  console.log('Area changed:', newArea);
});

height.set(15); // Logs: "Area changed: 105"

### Using signals with HTML elements

import { createSignal } from './signal.js';

const name = createSignal('name', 'World');

const nameInput = document.getElementById('nameInput');
const greeting = document.getElementById('greeting');

// Update signal when input changes
nameInput.addEventListener('input', (e) => {
  name.set(e.target.value);
});

// Update DOM when signal changes
name.subscribe((newName) => {
  greeting.textContent = `Hello, ${newName}!`;
});

// Initial render
greeting.textContent = `Hello, ${name.get()}!`;

### Retrieving existing signals

import { createSignal } from './signal.js';

// Create a signal
const count = createSignal('count', 0);

// Later, in another part of your code, you can retrieve the same signal
const sameCount = createSignal('count', 100);

console.log(sameCount === count); // true
console.log(sameCount.get()); // 0 (not 100)

## Best Practices

1. Use meaningful IDs for your signals to make them easy to identify and retrieve.
2. Clean up signals when they are no longer needed by calling `signal.cleanUp()`.
3. Use computed signals for values that depend on other signals to ensure automatic updates.
4. Avoid circular dependencies in computed signals.
5. Use the `subscribe` method to react to signal changes instead of polling the value.

## API Reference

- `createSignal(id: string, initialValue: any): Signal`
- `computed(id: string, computeFn: () => any): Signal`
- `Signal.get(): any`
- `Signal.set(newValue: any): void`
- `Signal.subscribe(observer: Function): () => void`
- `Signal.cleanUp(): void`

For more detailed information about the API, please refer to the source code and inline comments in `signal.ts`.
