const r = async () => {
  const o = {
    spread: 360,
    ticks: 70,
    gravity: 0,
    decay: .95,
    startVelocity: 30,
    colors: ["006ce9", "ac7ff4", "18b6f6", "713fc2", "ffffff"],
    origin: { x: .5, y: .35 },
  };
  function c() {
    return new Promise((n, s) => {
      if (globalThis.confetti) return n(globalThis.confetti);
      const e = document.createElement("script");
      e.src =
        "https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js",
        e.onload = () => n(globalThis.confetti),
        e.onerror = s,
        document.head.appendChild(e),
        e.remove();
    });
  }
  const i = await c();
  function t() {
    i({ ...o, particleCount: 80, scalar: 1.2 }),
      i({ ...o, particleCount: 60, scalar: .75 });
  }
  setTimeout(t, 0),
    setTimeout(t, 100),
    setTimeout(t, 200),
    setTimeout(t, 300),
    setTimeout(t, 400);
};
export { r as s_zwO7CtYmrPQ };
