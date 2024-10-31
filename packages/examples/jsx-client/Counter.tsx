// deno-lint-ignore no-unused-vars
import { jsx, signal } from "async-framework";

export function Counter() {
  const count = signal(0);
  const theme = signal<"light" | "dark">("light");

  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  return (
    <div
      class={`bg-white rounded-lg shadow-md p-6 ${
        theme.value === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div class="flex justify-between items-center mb-4">
        <h2
          class={`text-2xl font-semibold ${
            theme.value === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Count: {count}
        </h2>
        <button
          onClick={toggleTheme}
          class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Toggle Theme
        </button>
      </div>

      <div class="space-x-4">
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => count.value++}
        >
          Increment
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          onClick={() => count.value--}
        >
          Decrement
        </button>
        <button
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          onClick={() => (count.value = 0)}
        >
          Reset
        </button>
      </div>

      <div
        class={`mt-4 p-4 rounded-md ${
          count.value > 0
            ? "bg-green-100 text-green-800"
            : count.value < 0
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {count.value > 0
          ? "Number is positive!"
          : count.value < 0
          ? "Number is negative!"
          : "Number is zero!"}
      </div>
    </div>
  );
}
