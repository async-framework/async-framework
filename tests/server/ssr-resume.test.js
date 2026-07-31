import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import {
  createApp,
  createSignal,
  defineApp,
  defineCache,
  defineRoute,
  delay,
  html,
  readSnapshot
} from "../../src/index.js";

// Production-shaped resume round trip: a server runtime renders a route, the
// output (HTML + snapshot script) crosses a real JSON/HTML boundary into a
// fresh document, and a browser runtime activates from readSnapshot(document)
// without the partial, the server function, or any re-render.

function sharedDefinition() {
  return {
    signal: {
      resumeDemo: createSignal({
        productId: null,
        selected: false
      })
    },
    cache: {
      browser: {
        "resumeDemo.product": defineCache({ ttl: 60_000 })
      }
    },
    handler: {
      "resumeDemo.selectProduct"() {
        this.signals.set("resumeDemo.selected", true);
      }
    },
    route: {
      "/resume/:id": defineRoute("resumeDemo.product.page")
    }
  };
}

test("server render output resumes in a fresh document without re-running work", async () => {
  let partialRuns = 0;
  const serverApp = defineApp(sharedDefinition());
  serverApp.use({
    server: {
      async "resumeDemo.products.get"(id) {
        return { id, title: "SSR Keyboard" };
      }
    },
    partial: {
      async "resumeDemo.product.page"({ id }) {
        partialRuns += 1;
        const product = await this.server.resumeDemo.products.get(id);
        return {
          __async_server_result__: 1,
          html: html`
            <article>
              <h1>${product.title}</h1>
              <button type="button" on:click="resumeDemo.selectProduct" class:selected="resumeDemo.selected">
                Select
              </button>
            </article>
          `,
          signals: {
            "resumeDemo.productId": id
          },
          cache: {
            browser: {
              [`resumeDemo.product:${id}`]: product
            }
          }
        };
      }
    }
  });

  const serverRuntime = createApp(serverApp, { target: "server" });
  const response = await serverRuntime.render("/resume/sku-9");
  serverRuntime.destroy();
  assert.equal(partialRuns, 1);

  // The wire boundary: the rendered document is plain HTML text; the
  // snapshot travels as an inline JSON script inside it.
  const window = new Window();
  const { document } = window;
  document.body.innerHTML = `<div id="app">${response.html}</div>`;

  // The browser side deliberately lacks the partial and the server function:
  // resume must not need either.
  const browserApp = defineApp(sharedDefinition());
  const runtime = createApp(browserApp, {
    root: document,
    router: false,
    snapshot: readSnapshot(document)
  }).start();

  try {
    assert.equal(document.querySelector("h1").textContent, "SSR Keyboard");
    assert.equal(runtime.signals.get("resumeDemo.productId"), "sku-9");
    assert.deepEqual(runtime.browser.cache.snapshot(), {
      "resumeDemo.product:sku-9": { id: "sku-9", title: "SSR Keyboard" }
    });
    assert.equal(partialRuns, 1);

    // Activation is live: the server-rendered button drives the delegated
    // handler and class binding without any rerender.
    const button = document.querySelector("button");
    assert.equal(button.classList.contains("selected"), false);
    button.dispatchEvent(new window.Event("click", { bubbles: true }));
    await delay(0);
    assert.equal(button.classList.contains("selected"), true);
    assert.equal(runtime.signals.get("resumeDemo.selected"), true);
  } finally {
    runtime.destroy();
  }
});
