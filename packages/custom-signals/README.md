# Custom Signals Package

This package provides a reactive programming model using signals. Signals are values that can change over time and automatically update any computations that depend on them.

## Key Components

1. `Signal`: Represents a value that can change over time.
2. `computed`: Creates a signal that depends on other signals and updates automatically.
3. `SignalRegistry`: Manages all signals and their dependencies.

## How to Use

### Creating a Signal

To create a simple signal:

```
import { createSignal } from './signal';

const countSignal = createSignal('count', 0);

### Reading and Writing to a Signal

// Read the current value
console.log(countSignal.get()); // 0

// Update the value
countSignal.set(1);
console.log(countSignal.get()); // 1

### Creating a Computed Signal

Computed signals automatically update when their dependencies change:

import { computed } from './signal';

const doubleCount = computed('doubleCount', () => countSignal.get() * 2);

console.log(doubleCount.get()); // 2

countSignal.set(2);
console.log(doubleCount.get()); // 4

### Subscribing to Changes

You can subscribe to changes in a signal:

const unsubscribe = countSignal.subscribe((newValue) => {
  console.log(Count changed to ${newValue});
});

// Later, to stop listening:
unsubscribe();

### Using SignalRegistry

The SignalRegistry is used internally to manage signals. You typically don't need to interact with it directly, but it provides methods for advanced use cases:

import { SignalRegistry } from './signalRegistry';

const registry = new SignalRegistry();

// Get or create a signal
const mySignal = registry.getOrCreate('mySignal', 'initial value');

// Create a computed signal
const myComputed = registry.createComputed('myComputed', () => {
  return mySignal.get().toUpperCase();
});

// Check if a signal exists
if (registry.has('mySignal')) {
  console.log('Signal exists');
}

// Remove a signal
registry.remove('mySignal');

// Clear all signals
registry.clear();

## Best Practices

1. Use meaningful IDs for your signals to make debugging easier.
2. Clean up signals that are no longer needed to prevent memory leaks.
3. Avoid circular dependencies in computed signals.
4. Use computed signals for values that depend on other signals, rather than manually updating them.

## Advanced Usage

For more complex scenarios or performance optimization, you can use the SignalRegistry directly. This allows for more fine-grained control over signal creation and management.

Remember that the signal system is designed to be efficient and automatically manage dependencies. In most cases, simply using createSignal, computed, and the signal methods (get, set, subscribe) will be sufficient for building reactive applications.
