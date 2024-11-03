import { computed, signal } from "@async/framework";
import { ContextWrapper, wrapContext } from "@async/framework";
import { each, html, when } from "@async/framework";

export class CounterElement extends HTMLElement {
  private wrapper: ContextWrapper;
  private count;
  private doubled;
  private isPositive;
  private history;

  constructor() {
    super();

    this.wrapper = wrapContext("counter-element", (context) => {
      this.count = signal(0);
      this.doubled = computed(() => this.count.value * 2);
      this.isPositive = computed(() => this.count.value > 0);
      this.history = signal<number[]>([]);
    });
  }

  connectedCallback() {
    const template = html`
      <div class="p-6 bg-white rounded-lg shadow-md">
        <div class="text-center mb-4">
          <div class="text-2xl font-bold">
            Count: ${this.count}
          </div>
          
          ${
      when(this.isPositive, () =>
        html`
            <div class="text-green-600">Number is positive!</div>
          `)
    }
          
          <div class="text-sm text-gray-600">
            Doubled: ${this.doubled}
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded"
            on:click="./handlers/decrement.js"
          >-</button>
          <button 
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded"
            on:click="./handlers/increment.js"
          >+</button>
        </div>

        <div class="mt-4">
          <h3 class="font-bold">History:</h3>
          <ul class="list-disc pl-5">
            ${
      each(this.history, (value) =>
        html`
              <li>${value}</li>
            `)
    }
          </ul>
        </div>
      </div>
    `;

    this.innerHTML = "";
    this.appendChild(template);
  }

  disconnectedCallback() {
    this.wrapper.cleanup();
  }

  increment() {
    this.count.value++;
    this.history.value = [...this.history.value, this.count.value];
  }

  decrement() {
    this.count.value--;
    this.history.value = [...this.history.value, this.count.value];
  }
}
