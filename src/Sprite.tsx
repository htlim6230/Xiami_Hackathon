import { useEffect, useRef, useState } from "react";
import type { Phase } from "./protocol";
const rows: Record<string, [number, number[]]> = {
  Idle: [0, [280, 110, 110, 140, 140, 320]],
  Selecting: [6, [150, 150, 150, 150, 150, 260]],
  Reading: [7, [120, 120, 120, 120, 120, 220]],
  Translating: [7, [120, 120, 120, 120, 120, 220]],
  Ready: [8, [150, 150, 150, 150, 150, 280]],
  Speaking: [3, [140, 140, 140, 280]],
  Error: [5, [140, 140, 140, 140, 140, 140, 140, 240]],
  Paused: [6, [150, 150, 150, 150, 150, 260]],
  Sleeping: [0, [1000]],
};
export function Sprite({ phase }: { phase: Phase }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const img = new Image();
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;
    let frame = 0;
    let [row, durations] = rows[phase];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    img.onload = () => {
      if (img.width !== 1536 || ![1872, 2288].includes(img.height)) {
        setMissing(true);
        return;
      }
      setMissing(false);
      const directional = phase === "Selecting" && img.height === 2288;
      if (directional) durations = Array(16).fill(160);
      const draw = () => {
        if (closed) return;
        const ctx = canvas.current?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, 192, 208);
        ctx.drawImage(
          img,
          (directional ? frame % 8 : frame) * 192,
          (directional ? 9 + Math.floor(frame / 8) : row) * 208,
          192,
          208,
          0,
          0,
          192,
          208,
        );
        if (!reduced) {
          const delay = Math.max(
            phase === "Sleeping" ? 200 : 0,
            durations[frame],
          );
          frame = (frame + 1) % durations.length;
          timer = setTimeout(draw, delay);
        }
      };
      draw();
    };
    img.onerror = () => setMissing(true);
    img.src = "/spritesheet.webp";
    return () => {
      closed = true;
      clearTimeout(timer);
    };
  }, [phase]);
  return (
    <>
      {missing && (
        <div className="pet-fallback" aria-label="Xiami artwork unavailable">
          🦦
        </div>
      )}
      <canvas
        ref={canvas}
        width="192"
        height="208"
        style={{ display: missing ? "none" : "block" }}
        aria-label={`Xiami: ${phase}`}
        role="img"
      />
    </>
  );
}
