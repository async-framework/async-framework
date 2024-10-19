# async-framework

async-framework is a lightweight, asynchronous JavaScript framework designed for building responsive and efficient web applications. It leverages modern JavaScript features to provide a simple yet powerful way to handle user interactions and manage application state.

## Key Features

- Asynchronous event handling
- Custom element support
- Signal-based state management
- Modular architecture
- Easy integration with existing projects

## Setup and Development

To get started with async-framework examples, follow these steps:

1. Make sure you have Deno 2.x.x installed on your system.

2. Install the project dependencies by running:
   ```
   deno install
   ```

3. To start the development server, run:
   ```
   deno task dev
   ```

   This will start the dev server on port 3000, which serves the examples located in the `packages/examples` directory.

4. Open your browser and navigate to `http://localhost:3000` to view the examples.

## Project Structure

The main examples can be found in the `packages/examples` directory. Feel free to explore and modify these examples to understand how async-framework works.

- `packages/examples/hello-world`: Contains a simple "Hello World" example showcasing basic usage of the framework.
- `packages/custom-elements`: Includes custom element definitions and implementations.

## Core Concepts

1. **Event Handlers**: Asynchronous functions that respond to user interactions or system events.
2. **Custom Elements**: Reusable, encapsulated HTML elements with their own functionality.
3. **Signal Store**: A reactive state management system for handling application data.
4. **Handler Registry**: A centralized system for registering and managing event handlers.

## Getting Started

To create your first async-framework application, start by exploring the `hello-world` example in the `packages/examples` directory. This will give you a good understanding of how to structure your code and use the framework's core features.

For more advanced usage and API documentation, please refer to the individual package READMEs and source code comments.
