// deno-lint-ignore no-unused-vars
import { jsx, createSignal } from "async-framework";
import { Counter } from "./Counter.tsx";

export function App() {
  const [name, setName] = createSignal("World");

  return (
    <div class="min-h-screen bg-gray-100 py-8 px-4">
      <div class="max-w-3xl mx-auto space-y-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-4">Hello {name()}</h1>
          <input
            type="text"
            value={name()}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
            onInput={(e) => {
              if (e.target instanceof HTMLInputElement) {
                setName(e.target.value);
              }
            }}
          />
        </div>

        <Counter />
      </div>
    </div>
  );
}
