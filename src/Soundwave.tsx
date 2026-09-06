import { useLocalize } from "./locale";
import { useEffect, useRef, useState } from "react";
export function Soundwave({ stream, active, sample = false }: { stream?: MediaStream | null; active: boolean; sample?: boolean }) {
  const localize = useLocalize();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [detected, setDetected] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    const pen = el?.getContext("2d");
    if (!el || !pen) return;
    let context: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let frame = 0;
    let lastSignal = 0;
    let lastUpdate = 0;
    if (active && stream) {
      context = new AudioContext();
      analyser = context.createAnalyser(); analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      void context.resume().catch(() => {});
    }
    const values = new Uint8Array(256);
    const draw = (time: number) => {
      pen.clearRect(0, 0, 480, 90);
      pen.fillStyle = "#294b37";
      let rms = 0;
      if (analyser) { analyser.getByteTimeDomainData(values); rms = Math.sqrt(values.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / values.length); }
      if (rms > 0.015) lastSignal = time;
      if (time - lastUpdate > 250) { setDetected(active && !!analyser && time - lastSignal < 500 && lastSignal > 0); lastUpdate = time; }
      for (let i = 0; i < 40; i++) {
        const height = !active ? 3 : sample ? 5 + Math.abs(Math.sin(time / 180 + i * .7)) * (18 + 45 * Math.abs(Math.sin(i))) : Math.min(76, 3 + Math.abs((values[i * 6] - 128) / 128) * 280);
        pen.fillRect(i * 12 + 3, (90 - height) / 2, 6, height);
      }
      if (active) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); void context?.close(); };
  }, [stream, active, sample]);
  return localize(<div className="soundwave"><canvas width="480" height="90" ref={canvas} aria-hidden="true" /><p role="status">{!active ? "Microphone inactive" : sample ? "Sample soundwave · demonstration only" : detected ? "Sound detected · 已偵測到聲音" : "Listening… speak to see the soundwave"}</p></div>);
}
