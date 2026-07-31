# Partials Example

Showcases server-rendered partial fragments and manual boundary replacement.

Key files:

- `index.html` defines a `product` boundary and load button.
- `main.js` registers a server function, async partial, and click handler that
  renders then swaps the partial result.

Start from the repo root:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/partials/`.

Verify:

```bash
pnpm run examples:check
```

## Why the handler captures `runtime`

Delegated handler contexts expose `signals`, `handlers`, `loader`, `server`,
`cache`, and `scheduler` — but not the partial registry. Rendering a partial
from a handler therefore reaches the runtime through the module-scope
`runtime` binding. This is the intended pattern for partial-driven swaps
today.
