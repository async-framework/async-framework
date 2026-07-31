# Streaming Example

Shows both halves of the L5 streaming story: handler-driven boundary swaps,
and out-of-order stream patches applied through `AsyncStream.applyScript`
with reveal ordering, an errored patch settling its slot, and a later patch
recovering it.

Key files:

- `index.html` declares a swap boundary, an `async:reveal="streamingFeed"`
  group (`reveal-order="forwards"`, `reveal-tail="collapsed"`), and four
  inline JSON wire patches in deliberately shuffled order.
- `main.js` starts the runtime, then replays each patch script through
  `AsyncStream.applyScript(script, { runtime })`. The shared per-loader
  receiver keeps sequence dedup and reveal buffering working across separate
  scripts, so nothing needs to hold a receiver instance.

What the feed demonstrates:

- The stats patch (index 1) arrives first and buffers because the group
  reveals `forwards`.
- The news patch (index 0) fails; the error settles its slot so stats and
  tips still reveal instead of waiting forever.
- A later news patch recovers the errored slot with real content.
- `reveal-tail="collapsed"` keeps only the next pending fallback visible.
  Tails accept `visible`, `collapsed`, or `hidden` (`visible` means no tail
  treatment).

Start from the repo root:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/streaming/`.

## Imperative DOM exception

The patch-replay loop is a narrow platform adapter standing in for a
streaming server: it selects the inline `data-stream-patch` protocol scripts
once and feeds them to `AsyncStream.applyScript`. Application feature code
stays registry driven — signals, delegated handlers, and boundary updates.

Verify:

```bash
pnpm run examples:check
```
