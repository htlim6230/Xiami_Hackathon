import { useEffect, useRef, useState } from "react";
import { useLocalize } from "./locale";
import { Sprite } from "./Sprite";
import { translatePhoto, type PhotoResult, type PhotoScenario, type PhotoTarget } from "./photoService";
import "./photo.css";
const sign = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="630" viewBox="0 0 840 630"><defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#c4caca"/><stop offset="1" stop-color="#eeeee8"/></linearGradient></defs><rect width="840" height="630" fill="url(#wall)"/><path d="M0 110H840M0 540H840M150 0V630M700 0V630" stroke="#a3aaaa" stroke-width="3"/><rect x="49" y="94" width="746" height="458" rx="18" fill="#000" opacity=".15"/><rect x="40" y="80" width="746" height="458" rx="12" fill="#142a32"/><rect x="40" y="80" width="746" height="83" rx="12" fill="#236963"/><g fill="white" font-family="Arial,sans-serif"><text x="76" y="136" font-size="38" font-weight="bold">MRT · WAY OUT</text><text x="76" y="225" font-size="22" fill="#c8ded7">SAMPLE STATION · FICTIONAL DIRECTIONS</text><text x="76" y="304" font-size="34">Exit A → Bus interchange</text><text x="76" y="391" font-size="34">Exit B → City Library</text><text x="76" y="478" font-size="34">Exit C → Riverside Park</text></g></svg>`;
const sampleImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sign)}`;
type Stage = "home" | "camera" | "review" | "processing" | "result" | "error";
export function PhotoDemo() {
 const localize = useLocalize();
 const [stage, setStage] = useState<Stage>("home");
 const [photo, setPhoto] = useState("");
 const [sample, setSample] = useState(true);
 const [target, setTarget] = useState<PhotoTarget>("yue");
 const [scenario, setScenario] = useState<PhotoScenario>("success");
 const [result, setResult] = useState<PhotoResult | null>(null);
 const [error, setError] = useState("");
 const [notice, setNotice] = useState("");
 const [speaking, setSpeaking] = useState(false);
 const task = useRef<AbortController | null>(null);
 const uploadUrl = useRef("");
 const uploadGeneration = useRef(0);
 const file = useRef<HTMLInputElement>(null);
 useEffect(() => () => { task.current?.abort(); ++uploadGeneration.current; if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current); window.speechSynthesis?.cancel(); }, []);
 function reset() { task.current?.abort(); ++uploadGeneration.current; window.speechSynthesis?.cancel(); setSpeaking(false); setResult(null); setError(""); setNotice(""); }
 function home() { reset(); setStage("home"); }
 function camera() { reset(); if (scenario === "denied") { setError("Camera permission denied. Allow camera access or upload a photo instead."); setStage("error"); } else setStage("camera"); }
 function capture() { setPhoto(sampleImage); setSample(true); setStage("review"); }
 async function upload(selected?: File) {
  if (!selected) return;
  reset();
  if (!/^image\/(jpeg|png|webp)$/.test(selected.type) || selected.size > 10 * 1024 * 1024) { setError("Choose a JPG, PNG or WebP image smaller than 10 MB."); setStage("error"); return; }
  const id = uploadGeneration.current;
  const next = URL.createObjectURL(selected);
  const image = new Image(); image.src = next;
  try { await image.decode(); if (id !== uploadGeneration.current) { URL.revokeObjectURL(next); return; } if (image.width * image.height > 24000000) throw new Error("large"); if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current); uploadUrl.current = next; setPhoto(next); setSample(false); setStage("review"); }
  catch { URL.revokeObjectURL(next); if (id === uploadGeneration.current) { setError("This image could not be opened. Choose a readable photo under 24 megapixels."); setStage("error"); } }
 }
 async function translate() {
  reset(); const controller = new AbortController(); task.current = controller; setStage("processing");
  try { const next = await translatePhoto({ sample, target, scenario, signal: controller.signal }); if (!controller.signal.aborted) { setResult(next); setStage("result"); } }
  catch (e) { if (controller.signal.aborted) return; const code = e instanceof Error ? e.message : ""; setError(code === "TIMEOUT" ? "Translation timed out. Check your connection and try again." : code === "UNREADABLE" ? "No readable text found. Retake the photo with clearer lighting." : code === "PROVIDER_REQUIRED" ? "Your photo is ready. Real photo OCR needs a connected backend. Use the sample photo to try translation." : "Translation failed. Please try again."); setStage("error"); }
 }
 async function copy() { try { await navigator.clipboard.writeText(result?.translated || ""); setNotice("Translation copied."); } catch { setNotice("Copy unavailable. Select and copy the translation text manually."); } }
 function play(original = false) {
  if (!result) return;
  if (!window.speechSynthesis) { setNotice("Audio is unavailable in this browser."); return; }
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => original ? v.lang.startsWith("en") : target === "yue" ? /^(yue|zh[-_]HK)/i.test(v.lang) : /^zh[-_](TW|CN)/i.test(v.lang));
  if (!original && !voice) { setNotice("No matching Chinese voice is installed. You can play the original English instead."); return; }
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(original ? result.original : result.translated); utterance.lang = original ? "en-US" : result.speechLanguage; if (voice) utterance.voice = voice; utterance.rate = .85;
  utterance.onend = () => setSpeaking(false); utterance.onerror = () => { setSpeaking(false); setNotice("Audio could not play. Please try again."); }; setSpeaking(true); setNotice(""); speechSynthesis.speak(utterance);
 }
 return localize(<section className="photo-demo"><div className="photo-intro"><h2>LIVE Translate</h2><p>One photo. A little more understanding.</p><p>Still photos only. Review your photo before translating.</p></div><div className="photo-device"><div className="photo-status"><span>9:41</span><span className="photo-island"/><span aria-label="Full battery">▮▮▮ ▰</span></div><div className="photo-viewport"><header className="photo-header"><span>xiami 蝦米</span><span className="photo-pill">PHOTO</span></header>
 <div className="photo-languages"><label>From<select aria-label="Source language" defaultValue="en" disabled><option value="en">English</option></select></label><span>→</span><label>To<select aria-label="Photo target language" value={target} disabled={stage === "processing"} onChange={e => { reset(); setTarget(e.target.value as PhotoTarget); setStage(photo && stage !== "home" && stage !== "camera" ? "review" : stage); }}><option value="yue">Cantonese</option><option value="nan">Hokkien</option><option value="zh">Mandarin</option></select></label></div>
 <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}/>
 {stage === "home" && <div className="photo-home"><div className="photo-home-art"><Sprite phase="Idle" /></div><h3>Let’s read the world together.</h3><p>Signs, menus and everyday moments.</p><button className="photo-primary" onClick={camera}>▣ Camera</button><button className="photo-secondary" onClick={() => file.current?.click()}>Upload a photo</button><small>Demo camera uses a sample MRT sign. Uploaded photos stay on this device.</small></div>}
 {stage === "camera" && <div className="photo-camera"><div className="photo-viewfinder"><img src={sampleImage} alt="Sample MRT sign in camera viewfinder"/><span className="finder-corners"/><span className="finder-hint">Frame the text clearly</span></div><p>Mock camera · no live video</p><div className="photo-capture-actions"><button onClick={home}>Cancel</button><button className="photo-shutter" aria-label="Capture photo" onClick={capture}><span/></button><button onClick={() => file.current?.click()}>Upload</button></div></div>}
 {(["review","processing","result"].includes(stage) || stage === "error" && photo) && <figure className="captured-photo"><img src={photo} alt="Captured still photo for translation"/><figcaption>{sample ? "Sample photo · fictional MRT directions" : "Your uploaded photo · not sent"}</figcaption></figure>}
 {stage === "review" && <div className="photo-bottomcard"><h3>Is the text clear?</h3><p>Confirm this photo to begin translation.</p><button className="photo-primary" onClick={() => void translate()}>Use photo & translate</button><button className="photo-secondary" onClick={camera}>Retake photo</button></div>}
 {stage === "processing" && <div className="photo-bottomcard" role="status" aria-live="polite"><div className="photo-loading"/><h3>Xiami is reading your photo…</h3><p>Finding text, then translating.</p><button className="photo-secondary" onClick={() => { reset(); setStage("review"); }}>Cancel</button></div>}
 {stage === "result" && result && <div className="photo-bottomcard"><span className="photo-pill">SAMPLE TRANSLATION</span><h3>Your translation</h3><p>{result.fallback ? "Mandarin (fallback)" : target === "yue" ? "Cantonese" : "Mandarin"}</p>{result.fallback && <p className="notice" role="status">Sample Mandarin fallback. Hokkien provider is not connected.</p>}<p className="photo-result" lang={result.speechLanguage}>{result.translated}</p><details><summary>Original English</summary><p data-content="source" className="photo-original">{result.original}</p></details><button className="photo-primary" disabled={result.fallback} onClick={() => speaking ? (speechSynthesis.cancel(), setSpeaking(false)) : play()}>{speaking ? "■ Stop audio" : "◖)) Play translation"}</button><button className="photo-secondary" onClick={() => play(true)}>Play original English</button><div className="photo-actions"><button onClick={() => void copy()}>Copy</button><button onClick={() => void translate()}>Re-translate</button></div><small>Audio uses an available device voice.</small></div>}
 {stage === "error" && <div className="photo-bottomcard photo-error" role="alert"><h3>Let’s try again.</h3><p>{error}</p><button className="photo-primary" onClick={() => { reset(); setScenario("success"); if (photo) setStage("review"); else setStage("camera"); }}>Try again</button><button className="photo-secondary" onClick={() => file.current?.click()}>Upload a photo</button><button className="photo-secondary" onClick={() => { reset(); setScenario("success"); setPhoto(sampleImage); setSample(true); setStage("review"); }}>Use sample photo</button></div>}
 {notice && <p className="photo-notice" role="status">{notice}</p>}
 <details className="photo-demo-settings"><summary>Demo error scenarios</summary><label>Next attempt<select value={scenario} disabled={stage === "processing"} onChange={e => setScenario(e.target.value as PhotoScenario)}><option value="success">Success</option><option value="denied">Camera permission denied</option><option value="unreadable">Unreadable text</option><option value="timeout">Network timeout</option></select></label><small>Simulated errors for preview testing.</small></details>
 </div><nav className="photo-nav" aria-label="Photo navigation"><button onClick={home}>⌂ Home</button><button onClick={camera}>▣ Camera</button><button onClick={() => file.current?.click()}>＋ Upload</button></nav><div className="photo-homebar"/></div></section>);
}
