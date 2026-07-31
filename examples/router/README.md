# Router Example

Showcases CSR first render and local route boundary swaps backed by registered
partials.

Key files:

- `index.html` defines navigation links and the `route` boundary.
- `main.js` registers route partials and starts the runtime in CSR mode.

Start from the repo root:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/router/`.

Verify:

```bash
pnpm run examples:check
```

## Fallback route

The `"*"` route catches every URL the explicit routes miss (including the
`/examples/router/` URL this demo is served from), so the first render shows
the not-found partial instead of an empty boundary. Splat segments also work
inside patterns: `"/files/*"` (anonymous rest) and `"/files/*rest"` (named
rest param) both match nested paths.
