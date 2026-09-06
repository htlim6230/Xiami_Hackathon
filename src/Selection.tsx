import { selectionBox, imageBox } from "./state";
import { useEffect, useRef, useState } from "react";
import { bridge, type Capture, type Box } from "./protocol";
export function Selection() {
  const [capture, setCapture] = useState<Capture>();
  const [box, setBox] = useState<Box>();
  const [error, setError] = useState("");
  const anchor = useRef<{ x: number; y: number } | undefined>(undefined);
  const busy = useRef(false);
  const viewport = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    bridge
      .capture()
      .then(setCapture)
      .catch((e) => setError(String(e)));
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        void bridge.cancel().catch((e) => setError(String(e)));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      className="selection"
      onPointerDown={(e) => {
        if (!capture || busy.current || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        anchor.current = { x: e.clientX, y: e.clientY };
        setBox(undefined);
      }}
      onPointerMove={(e) => {
        const p = anchor.current;
        if (!p) return;
        setBox(selectionBox(p, { x: e.clientX, y: e.clientY }, viewport()));
      }}
      onPointerUp={async (e) => {
        const p = anchor.current;
        anchor.current = undefined;
        if (!capture || !p || busy.current) return;
        const b = selectionBox(p, { x: e.clientX, y: e.clientY }, viewport());
        if (b.width < 12 || b.height < 12) return;
        busy.current = true;
        try {
          await bridge.select(
            capture.requestId,
            imageBox(b, viewport(), capture),
          );
        } catch (err) {
          setError(String(err));
          busy.current = false;
        }
      }}
    >
      {capture && (
        <img
          draggable={false}
          src={`data:image/png;base64,${capture.image}`}
          alt="Frozen desktop for text selection"
        />
      )}
      <div className="selection-hint">
        {error || "Drag around the English text · 圈選英文內容"}
        <small>Press Esc to cancel · 按 Esc 取消</small>
      </div>
      {box && (
        <div
          className="selection-box"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
        />
      )}
    </div>
  );
}
