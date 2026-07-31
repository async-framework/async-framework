import { Async, createSignal } from "../../src/index.js";
import { AsyncStream } from "../../src/stream.js";

Async.use({
  signal: {
    streamingDemo: createSignal({
      title: "Streamed Keyboard",
      selected: false
    })
  },
  handler: {
    "streamingDemo.streamProduct"() {
      this.loader.swap(
        "product",
        `
          <article>
            <h1 signal:text="streamingDemo.title"></h1>
            <button type="button" on:click="streamingDemo.select" class:selected="streamingDemo.selected">
              Select
            </button>
          </article>
        `
      );
    },
    "streamingDemo.select"() {
      this.signals.set("streamingDemo.selected", true);
    }
  }
});

const runtime = Async.start({ root: document.body, router: false });

// Platform adapter: replay the wire patches the server emitted as inline JSON
// scripts. Each call resolves the shared per-loader receiver, so sequence
// dedup, reveal buffering, and error settling work across separate scripts —
// no receiver instance needs to be threaded through the page. Reveal metadata
// comes from the DOM (async:reveal / reveal-order / reveal-tail); the patches
// carry only boundary, seq, and html or error.
for (const script of document.querySelectorAll('script[type="application/json"][data-stream-patch]')) {
  await AsyncStream.applyScript(script, { runtime });
}
