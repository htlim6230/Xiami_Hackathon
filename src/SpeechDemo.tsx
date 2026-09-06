import { useLocalize } from "./locale";
import { useEffect, useRef, useState } from "react";
import { Sprite } from "./Sprite";
import { Soundwave } from "./Soundwave";
export function SpeechDemo({ onClose }: { onClose: () => void }) {
  const localize = useLocalize();
  const dialog = useRef<HTMLDialogElement>(null);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [target, setTarget] = useState<"Cantonese" | "Hokkien">("Cantonese");
  const [phase, setPhase] = useState<"idle" | "holding" | "translating" | "done">("idle");
  function cancel() { held.current = false; clearTimeout(timer.current); setPhase("idle"); }
  useEffect(() => {
    dialog.current?.showModal();
    window.addEventListener("blur", cancel);
    return () => { clearTimeout(timer.current); window.removeEventListener("blur", cancel); };
  }, []);
  function start() { if (held.current) return; clearTimeout(timer.current); held.current = true; setPhase("holding"); }
  function release() {
    if (!held.current) return;
    held.current = false; setPhase("translating");
    timer.current = setTimeout(() => setPhase("done"), 900);
  }
  return localize(<dialog ref={dialog} className="feedback-dialog speech-dialog" onCancel={onClose} aria-labelledby="speech-title">
    <div className="feedback-heading"><h2 id="speech-title">Talk to me (说什么？)</h2><button aria-label="Close speech demo" onClick={onClose}>×</button></div>
    <p>Hello, I’m Xiami. Hold the button below, then release to translate.</p>
    <p className="feedback-local">Sample speech demo · No microphone is used. This demonstrates the following prepared sentence.</p>
    <label className="speech-target">Speak to me in<select aria-label="Speech target language" value={target} disabled={phase === "holding" || phase === "translating"} onChange={e => { cancel(); setTarget(e.target.value as "Cantonese" | "Hokkien"); }}><option value="Cantonese">Cantonese</option><option value="Hokkien">Hokkien</option></select></label>
    <blockquote>“Please remember to shut off your TV.”</blockquote>
    <div className="speech-bubble speech-invitation">
      <p role="status">{phase === "holding" ? "Listening to the sample… Release to translate." : phase === "translating" ? "Translating the sample…" : phase === "done" ? (target === "Hokkien" ? "Mandarin (fallback)" : "Here’s the sample in Cantonese · 廣東話") : "Press and hold to talk to Xiami. 按住說話"}</p>
      {phase === "done" && <><p className="speech-translation" lang={target === "Hokkien" ? "zh-Hant" : "yue-Hant"}>{target === "Hokkien" ? "請記得關掉電視。" : "請記得熄電視。"}</p>{target === "Hokkien" ? <p className="notice">Sample Mandarin fallback. Hokkien provider is not connected.</p> : <p> Cing2 gei3 dak1 sik1 din6 si6.</p>}</>}
      <Soundwave active={phase === "holding"} sample />
      <button className="record-button hold-record" aria-label="Hold to record sample speech" onPointerDown={e => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); start(); }} onPointerUp={release} onPointerCancel={cancel} onLostPointerCapture={() => { if (held.current) cancel(); }} onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(); } }} onKeyUp={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); release(); } }} onBlur={() => { if (held.current) cancel(); }}>● {phase === "holding" ? "Release to translate · 放開翻譯" : "Hold to record · 按住錄音"}</button>
      <small>Mouse, touch, or hold Space / Enter.</small>
    </div>
    <div className="speech-otter"><Sprite phase={phase === "translating" ? "Translating" : phase === "holding" ? "Reading" : "Idle"} /></div>
  </dialog>);
}
