# Swap Dedupe Example

Shows `loader.swap({ type: "ifChanged" })`: re-rendering identical content
skips the swap entirely (the DOM node and its bindings survive), while
changed content swaps as usual. The card template carries a live
`signal:text` binding and an inline `signal:class="${{ fresh: true }}"`
binding — inline bindings serialize to stable comparison tokens, so they
participate in dedupe instead of defeating it.

Related swap forms (see `docs/runtime/streaming.md`): `type: "bind"`
re-renders reactively from signal dependencies with the same dedupe, and
`type: "many"` applies several boundary updates in one commit.

Start from the repo root:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/swap-dedupe/`.

Verify:

```bash
pnpm run examples:check
```
