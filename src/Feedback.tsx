import { useLocalize } from "./locale";
import { useEffect, useRef, useState } from "react";
import { Soundwave } from "./Soundwave";

export function Feedback({ source, language, onClose }: { source: string; language: string; onClose: () => void }) {
  const localize = useLocalize();
  const dialog = useRef<HTMLDialogElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const url = useRef("");
  const [paused, setPaused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [clip, setClip] = useState("");
  const [extension, setExtension] = useState("webm");
  const [error, setError] = useState("");
  useEffect(() => {
    alive.current = true;
    dialog.current?.showModal();
    return () => {
      alive.current = false;
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
      stream.current?.getTracks().forEach(t => t.stop());
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  async function record() {
    setError(""); setWaiting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Voice recording is unavailable in this browser. Try opening this preview in Microsoft Edge or Chrome.");
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { input.getTracks().forEach(t => t.stop()); return; }
      stream.current = input;
      const rec = new MediaRecorder(input);
      recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        input.getTracks().forEach(t => t.stop());
        if (!alive.current) return;
        setRecording(false); setPaused(false);
        if (!chunks.length) { setError("No audio was captured. Please try again."); return; }
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
        setClip(url.current);
        setExtension(rec.mimeType.includes("mp4") ? "m4a" : rec.mimeType.includes("ogg") ? "ogg" : "webm");
      };
      rec.onerror = () => { setError("Recording stopped unexpectedly. Please try again."); input.getTracks().forEach(t => t.stop()); setRecording(false); setPaused(false); };
      rec.start(); setPaused(false); setRecording(true);
    } catch (e) {
      stream.current?.getTracks().forEach(t => t.stop());
      if (alive.current) setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Microphone permission was declined. Allow microphone access in your browser, then try again." : e instanceof Error ? e.message : "Could not access your microphone.");
    } finally { if (alive.current) setWaiting(false); }
  }
  return localize(<dialog className="feedback-dialog" ref={dialog} onCancel={onClose} aria-labelledby="feedback-title">
    <div className="feedback-heading"><h2 id="feedback-title">Help Xiami say it right</h2><button aria-label="Close feedback" onClick={onClose}>×</button></div>
    <p>Selected English text</p><blockquote><mark data-content="source">{source}</mark></blockquote>
    <p>Record the correct translation in <strong>{language}</strong>.</p>
    <Soundwave stream={stream.current} active={recording && !paused} />
    <button className="record-button" disabled={waiting || recording} onClick={() => void record()}>{waiting ? "Waiting for microphone…" : recording ? "Recording correction" : clip ? "● Record again" : "● Record correct translation"}</button>
    <div className="secondary-actions">
      <button disabled={!recording} onClick={() => { if (paused) recorder.current?.resume(); else recorder.current?.pause(); setPaused(!paused); }}>{paused ? "Resume (繼續)" : "Pause (暂停)"}</button>
      <button disabled={!recording} onClick={() => recorder.current?.stop()}>Stop (结束)</button>
    </div>
    <p role="status">{paused ? "Recording paused. Resume when you are ready." : recording ? "Recording… Speak your correction, then press Stop." : clip ? "Recording ready. Listen back before saving." : "Your microphone starts only when you press Record."}</p>
    {error && <p className="error" role="alert">{error}</p>}
    {clip && !recording && <><audio controls src={clip} aria-label="Your recorded correction" /><a className="save-recording" href={clip} download={`xiami-${language.split(" ")[0].toLowerCase()}-correction.${extension}`}>Save voice recording</a></>}
    <p className="feedback-local">Preview feedback stays on this device and is not submitted. Save your recording before closing this window.</p>
  </dialog>);
}

