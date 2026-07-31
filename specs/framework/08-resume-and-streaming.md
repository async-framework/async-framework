# Resume And Streaming

Reference file for [Async Framework](../framework.md). This file owns snapshot
activation, boundary patch application, sequence handling, redirects, errors,
and out-of-order UI updates.

## Purpose

Async should make already-rendered HTML continue as a live app through protocol
records. Streaming extends that model by applying later boundary patches without
breaking event delegation, signal bindings, cache state, or route ownership.
These are no-compiler protocol capabilities in the
[15-abstraction-layers.md](./15-abstraction-layers.md) layer model: activation is
available from layer L0 up, and streamed boundary patches (including
out-of-order settling) from layer L5. They may use a simple web server and
streamed protocol records, but they must not require a build-required app
compiler.

## Responsibilities

- Read and merge JSON snapshots from active roots or documents.
- Activate existing HTML by applying snapshots and scanning protocol
  attributes.
- Apply boundary patches with signal, cache, HTML, redirect, and error effects.
- Keep out-of-order streaming available to no-build and low-build apps through
  explicit protocol patches.
- Track patch sequence numbers per boundary.
- Serialize same-boundary patch application.
- Ignore stale or destroyed-scope patches.
- Preserve retryability for failed patch application.

## Public Contract

Resume/streaming primitives include:

- `readSnapshot(root, { attributes })`.
- `createBoundaryReceiver({ loader, signals, cache, scheduler, router })`.
- `receiver.apply(patch)`.
- `receiver.inspect()`, `receiver.reset(boundary?)`, and `receiver.destroy()`.

Boundary patch shape:

```js
{
  boundary: "product",
  seq: 1,
  signals: {},
  cache: { browser: {} },
  html: "...",
  redirect: "/next",
  error: undefined,
  scope: "optional-scope",
  parentScope: "optional-parent-scope"
}
```

Only fields needed for a patch must be present.

## Subsystem Boundaries

- Snapshot parsing belongs to the runtime kernel.
- DOM activation belongs to the loader.
- Signal and cache patches belong to their registries.
- HTML replacement belongs to the loader's boundary swap.
- Redirects belong to the router or document navigation fallback.
- Sequence and retry state belongs to the boundary receiver.
- Bootstrap loader queues belong to the app-level loader facade. Future
  streamed fulfillment queues should reuse the same operation-record shape
  without changing concrete loader semantics.

## Protocol Contract

Resume protocol records include:

- JSON scripts marked with the configured snapshot attribute.
- Signal snapshot objects.
- Async-signal snapshot objects with status, version, value, loading, and
  stable error fields.
- Browser cache snapshot objects.
- Boundary patch objects with finite sequence numbers.
- Error patch records that describe failed streamed work.

Patch effects apply in this order:

1. Signal patches.
2. Browser cache restore.
3. Boundary HTML swap scheduled through the commit phase, with rescan.
4. Scheduler flush for affected work, including post-commit completion.
5. Redirect.

## Resume Contract

Resume must preserve document continuity:

- Activation must not erase existing DOM to recreate it from source.
- Snapshot state must be applied before resumed bindings are considered final.
- Boundary swaps must clean removed scopes before inserted HTML is scanned.
- Child patches with destroyed parent scopes are ignored.
- Same-boundary patches are serialized so later sequence numbers cannot commit
  before earlier in-flight patches finish their scheduled DOM commit and
  post-commit flush.

## Invariants

- Sequence numbers are tracked per boundary.
- Independent boundaries may apply out of order.
- A failed patch does not consume its sequence number unless the failure is an
  explicit error patch outcome.
- Stale patches are ignored, not replayed.
- Destroyed receivers reject future patch application.
- Reveal vocabulary (orders `as-ready`, `forwards`, `backwards`, `together`;
  tails `visible`, `collapsed`, `hidden`) is owned by `src/reveal-policy.js`
  and shared verbatim by the receiver and the build optimizer. `visible` is
  author vocabulary for "no tail treatment" and normalizes to an absent tail
  before group bookkeeping.
- An explicit error patch that carries reveal metadata settles its reveal
  index: the boundary keeps its fallback content, the group cursor advances
  past the index, and buffered siblings that became ready commit. Ordered and
  `together` groups never wait forever on content that will not arrive. A
  later content patch for an error-settled index commits as recovery; only
  content-committed indexes reject repeat patches as double commits.
- Receivers resolved from a runtime or loader (rather than passed explicitly)
  are shared per loader so sequence dedup and reveal buffering survive across
  inline stream patch scripts.

## Failure Modes

- Malformed snapshots fail during parsing.
- Invalid patch shapes fail before partial application.
- Missing signal, cache, loader, scheduler, or redirect capability fails at the
  point the patch needs it.
- Explicit error patches produce stable error results or throw when configured.
- Redirect failures do not hide prior HTML application results.

## Acceptance Criteria

- Browser activation restores signal and cache snapshots and binds existing
  DOM.
- A boundary patch applies signal and cache effects before scheduling HTML
  replacement.
- Inserted HTML is rescanned during commit so delegated handlers and signal
  bindings work before the patch reports success.
- Stale same-boundary patches are ignored while independent boundary patches can
  apply out of order.
- Failed DOM, scheduler, redirect, or capability errors can be retried with the
  same sequence number.

## Open Or Deferred Decisions

- Compact patch encodings for production streaming.
- Server transport protocol for delivering patch streams.
- Boundary transaction grouping across multiple regions.
- A partial fulfillment inbox where early HTML/data can be keyed by resource,
  params, boundary, and version so later Suspense or partial work can skip
  duplicate HTML transfer and request only missing data.
- Browser-level resume metrics and diagnostics.
