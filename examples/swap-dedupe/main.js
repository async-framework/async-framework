import { Async, createSignal, html } from "../../src/index.js";

const buildCard = (version) => html`
  <article>
    <h2>Build ${version}</h2>
    <p>
      This card carries a live binding
      (<em signal:text="dedupeDemo.status"></em>) and an inline class binding
      <span signal:class="${{ fresh: true }}">that dedupes too</span>.
    </p>
  </article>
`;

Async.use({
  signal: {
    dedupeDemo: createSignal({
      version: 1,
      status: "idle"
    })
  },
  handler: {
    "dedupeDemo.renderSame"() {
      const version = this.signals.get("dedupeDemo.version");
      this.loader.swap({
        type: "ifChanged",
        boundary: "build-card",
        html: buildCard(version)
      });
      this.signals.set("dedupeDemo.status", `rendered build ${version} (unchanged content is skipped)`);
    },
    "dedupeDemo.renderNext"() {
      const version = this.signals.get("dedupeDemo.version") + 1;
      this.signals.set("dedupeDemo.version", version);
      this.loader.swap({
        type: "ifChanged",
        boundary: "build-card",
        html: buildCard(version)
      });
      this.signals.set("dedupeDemo.status", `swapped to build ${version}`);
    }
  }
});

Async.start({ root: document.body, router: false });
