"use client";

// Aurelian palette — gold + cream + profit green for celebration
const AURELIAN_COLORS = ["#CD9C20", "#C8AA6F", "#D4AD54", "#3B6C4F", "#F2ECDD"];

const FIREWORK_DURATION_MS = 3200;

function randInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function fireworks(): Promise<void> {
  if (typeof window === "undefined") return;

  const { default: confetti } = await import("canvas-confetti");

  const end = Date.now() + FIREWORK_DURATION_MS;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: randInRange(0.2, 0.55) },
      colors: AURELIAN_COLORS,
      scalar: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: randInRange(0.2, 0.55) },
      colors: AURELIAN_COLORS,
      scalar: 0.9,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();

  // Final burst from center
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: AURELIAN_COLORS,
      scalar: 1.1,
    });
  }, FIREWORK_DURATION_MS / 2);
}

export const FIREWORK_DURATION = FIREWORK_DURATION_MS;
