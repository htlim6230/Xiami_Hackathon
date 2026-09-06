import { PhotoDemo } from "./PhotoDemo";
import { useLocalize, LanguageGate, LanguageButton } from "./locale";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { bridge, native, type Language, type PipelineEvent } from "./protocol";
import { reducer, initial } from "./state";
import { Sprite } from "./Sprite";
import { Selection } from "./Selection";
import "./style.css";
import { Feedback } from "./Feedback";
import { SpeechDemo } from "./SpeechDemo";
const examples = { document: {
  source:
    "Your appointment is on Monday at 10:30 am. Please bring your identity card.",
  translation: "您嘅預約係星期一朝早十點半。\n請帶埋您嘅身份證。",
  romanization:
    "Nei5 ge3 jyu6 joek3 hai6 sing1 kei4 jat1 ziu1 zou2 sap6 dim2 bun3.\nCing2 daai3 maai4 nei5 ge3 san1 fan6 zing3.",
  mandarin: "您的預約是星期一上午十點半。請帶上您的身份證。",
}, sms: {
  source: "Please meet me at the bus stop at three o’clock.",
  translation: "請您三點喺巴士站等我。",
  romanization: "Cing2 nei5 saam1 dim2 hai2 baa1 si2 zaam6 dang2 ngo5.",
  mandarin: "請您三點在巴士站等我。",
}};
function App() {
  const localize = useLocalize();
  const [speechOpen, setSpeechOpen] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [demo, setDemo] = useState<"document" | "sms" | "speech" | "photo">("document");
  const [selectionStage, setSelectionStage] = useState<"none" | "sweeping" | "selected">("none");
  const [demoRun, setDemoRun] = useState(0);
  const example = examples[demo === "speech" || demo === "photo" ? "document" : demo];
  const [state, dispatch] = useReducer(reducer, initial);
  const [language, setLanguage] = useState<Language>("Cantonese");
  const [expanded, setExpanded] = useState(!native);
  const [font, setFont] = useState(30);
  const [listening, setListening] = useState(!native);
  const [busy, setBusy] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const audioUrl = useRef("");
  const audioChunks = useRef<Uint8Array[]>([]);
  const speechId = useRef("");
  const last = useRef(Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const op = useRef(0);
  const stopAudio = () => {
    audio.current?.pause();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = "";
    audio.current = undefined;
    audioChunks.current = [];
    speechId.current = "";
    setAudioReady(false);
  };
  const fail = (e: unknown) =>
    dispatch({
      type: "error",
      requestId: currentId.current,
      message: String(e),
    });
  useEffect(() => {
    if (!native) return;
    let off: undefined | (() => void);
    let closed = false;
    listen<PipelineEvent>("xiami:event", ({ payload: e }) => {
      if (e.type === "state" && e.state === "Selecting") {
        dispatch({ type: "start", requestId: e.requestId });
        setExpanded(true);
        last.current = Date.now();
      }
      if (e.requestId === speechId.current) {
        if (e.type === "audio")
          audioChunks.current.push(
            Uint8Array.from(atob(e.data), (c) => c.charCodeAt(0)),
          );
        if (e.type === "error") {
          dispatch({ type: "phase", phase: "Error" });
          dispatch({
            type: "error",
            requestId: currentId.current,
            message: e.message,
          });
        }
        if (e.type === "done" && audioChunks.current.length) {
          const blob = new Blob(audioChunks.current as BlobPart[], {
            type: "audio/mpeg",
          });
          audioUrl.current = URL.createObjectURL(blob);
          audio.current = new Audio(audioUrl.current);
          audio.current.onended = () =>
            dispatch({ type: "phase", phase: "Ready" });
          setAudioReady(true);
          audio.current
            .play()
            .then(() => dispatch({ type: "phase", phase: "Speaking" }))
            .catch(() => dispatch({ type: "phase", phase: "Ready" }));
        }
        return;
      }
      dispatch(e);
    })
      .then((fn) => {
        if (closed) fn();
        else off = fn;
        setListening(true);
      })
      .catch(fail);
    return () => {
      closed = true;
      off?.();
    };
  }, []);
  useEffect(() => {
    if (native) bridge.language(language).catch(fail);
  }, [language]);
  useEffect(() => {
    if (native && listening) bridge.clickThrough(!expanded).catch(fail);
  }, [expanded, listening]);
  const currentId = useRef(state.requestId);
  currentId.current = state.requestId;
  useEffect(() => {
    const id = setInterval(() => {
      if (
        Date.now() - last.current >= 300000 &&
        ["Idle", "Ready"].includes(state.phase)
      ) {
        dispatch({ type: "phase", phase: "Sleeping" });
        if (native && !expanded) bridge.clickThrough(true).catch(fail);
      }
    }, 10000);
    return () => clearInterval(id);
  }, [state.phase, expanded]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audio.current?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );
  async function begin() {
    if (busy || !listening) return;
    const operation = ++op.current;
    setBusy(true);
    last.current = Date.now();
    stopAudio();
    timers.current.forEach(clearTimeout);
    try {
      if (native) {
        await bridge.begin(language);
      } else {
        const requestId = crypto.randomUUID();
        dispatch({ type: "start", requestId });
        setDemoRun((n) => n + 1);
        setSelectionStage("sweeping");
        timers.current.push(setTimeout(() => setSelectionStage("selected"), 2200));
        const events: PipelineEvent[] = [
          { type: "state", state: "Reading", requestId },
          { type: "source", text: example.source, boxes: [], requestId },
          { type: "state", state: "Translating", requestId },
          ...(language === "Cantonese"
            ? example.translation
                .split("")
                .map((text) => ({ type: "chunk" as const, text, requestId }))
            : [
                {
                  type: "fallback" as const,
                  text: example.mandarin,
                  notice:
                    "Sample Mandarin fallback. Hokkien provider is not connected.",
                  requestId,
                },
              ]),
          {
            type: "romanization",
            text: language === "Cantonese" ? example.romanization : "",
            requestId,
          },
          { type: "done", requestId },
        ];
        events.forEach((e, i) =>
          timers.current.push(setTimeout(() => dispatch(e), 2500 + i * 60)),
        );
      }
    } catch (e) {
      fail(e);
    } finally {
      if (operation === op.current) setBusy(false);
    }
  }
  async function stop() {
    ++op.current;
    setBusy(false);
    timers.current.forEach(clearTimeout);
    setSelectionStage("none");
    stopAudio();
    dispatch({ type: "reset" });
    if (native)
      try {
        await bridge.cancel();
      } catch (e) {
        fail(e);
      }
  }
  async function read() {
    last.current = Date.now();
    if (audio.current) {
      try {
        await audio.current.play();
        dispatch({ type: "phase", phase: "Speaking" });
      } catch (e) {
        fail(e);
      }
      return;
    }
    if (!native) {
      dispatch({
        type: "error",
        requestId: state.requestId,
        message:
          "Dialect audio is available in the configured desktop app. This browser preview does not imitate a dialect voice.",
      });
      return;
    }
    if (state.fallback) return;
    stopAudio();
    try {
      speechId.current = crypto.randomUUID();
      await bridge.speak(state.translation, language, speechId.current);
    } catch (e) {
      fail(e);
    }
  }
  async function pause() {
    if (state.phase === "Speaking") {
      audio.current?.pause();
      dispatch({ type: "phase", phase: "Paused" });
    } else if (state.phase === "Paused" && audio.current) {
      await read();
    } else {
      timers.current.forEach(clearTimeout);
      setSelectionStage("none");
      if (native) await bridge.cancel();
      dispatch({ type: "phase", phase: "Paused" });
    }
  }
  const working = ["Selecting", "Reading", "Translating"].includes(state.phase);
  const companionUI = <div className="in-screen-companion">        <div className="companion speech-bubble"><div className="bubble-content">
          {expanded && (
            <details className="menu-settings" open={!state.translation}><summary>Language & controls · 設定</summary><section
              className="control-card"
              aria-label="Xiami translation controls"
            >
              <div
                className="card-title"
                onPointerDown={(e) => {
                  if (native && e.target === e.currentTarget)
                    void getCurrentWindow().startDragging();
                }}
              >
                <div>
                  <h2>Let’s make it clear.</h2>
                  <p>慢慢來，我陪您。</p>
                </div>
                <span className="status-dot" />
              </div>
              <fieldset disabled={working || busy}>
                <legend>
                  Speak to me in <span>／ 目標語言</span>
                </legend>
                <div className="language-options">
                  {(["Cantonese", "Hokkien"] as const).map((l) => (
                    <label key={l} className={language === l ? "chosen" : ""}>
                      <input
                        type="radio"
                        name="language"
                        value={l}
                        checked={language === l}
                        onChange={() => {
                          void stop();
                          setLanguage(l);
                        }}
                      />
                      <span>
                        {l}
                        
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                className="begin"
                disabled={working || busy || !listening}
                onClick={() => void begin()}
              >
                <span>⌖</span>
                {native ? "Translate on-screen" : "Play selection demo"}
                <small>
                  開始閱讀 <span>↗</span>
                </small>
              </button>
              <div className="secondary-actions">
                <button
                  onClick={() => void pause().catch(fail)}
                  disabled={
                    !working && !["Speaking", "Paused"].includes(state.phase)
                  }
                >
                  Ⅱ &nbsp;{" "}
                  {state.phase === "Paused" && audioReady
                    ? "Resume 繼續"
                    : "Pause 暫停"}
                </button>
                <button onClick={() => void stop()}>□ &nbsp; Stop 結束</button>
              </div>
              <div className="shortcut">
                {native
                  ? "Ctrl / ⌘ + Shift + X to select text"
                  : "Highlight → read → translate. Replay anytime."}
              </div>
            </section></details>
          )}
        
        {(state.source || state.error || working) && expanded && (
          <section className="translation-card" aria-label="Translation result">
            <div className="result-heading">
              <span>YOUR TRANSLATION</span>
              <button
                aria-label="Increase translation text size"
                onClick={() => setFont((f) => (f >= 42 ? 30 : f + 4))}
              >
                A＋
              </button>
            </div>
            {state.source && (
              <div className="original">
                <label>Original English</label>
                <p data-content="source">{state.source}</p>
              </div>
            )}
            <div className="translation-label">
              {state.fallback
                ? "Mandarin 普通話"
                : language === "Cantonese"
                  ? "Cantonese 廣東話"
                  : "Hokkien 福建話"}
              {!native && <span>SAMPLE</span>}
            </div>
            <p
              className="translation"
              style={{ fontSize: font }}
              lang={
                state.fallback
                  ? "zh-Hant"
                  : language === "Cantonese"
                    ? "yue-Hant"
                    : "nan-Hant"
              }
            >
              {state.translation || (working ? "Reading your selection…" : "")}
            </p>
            {state.romanization && (
              <div className="romanization">
                <label>
                  {language === "Cantonese"
                    ? "Jyutping · 粵拼"
                    : "POJ · 白話字"}
                </label>
                <p data-content="romanization">{state.romanization}</p>
              </div>
            )}
            <div role="status" aria-live="polite">
              <span className="sr-only">
                {state.phase === "Ready"
                  ? "Translation ready. 譯文已準備好。"
                  : ""}
              </span>
              {working && <p className="notice">{state.phase}…</p>}
              {state.notice && <p className="notice">{state.notice}</p>}
            </div>
            {state.error && (
              <p role="alert" className="error">
                {state.error}
              </p>
            )}
            <button
              className="read-aloud"
              disabled={!state.translation || working || state.fallback}
              onClick={() => void read()}
            >
              ◖)) &nbsp; Read aloud <span>朗讀</span>
            </button>
            <p className="result-footnote">
              {state.phase === "Paused"
                ? "Paused. Begin again to restart reading."
                : "Keep the original nearby to check names, dates and numbers."}
            </p>
          </section>
        )}
        {expanded && <div className="feedback-language-row"><button className="feedback-button" onClick={() => setFeedback(true)}>Feedback · 提供意見</button><LanguageButton /></div>}
        </div></div>
          <div className="pet-stage">
            <div className="pet-message">
              {native && !expanded
                ? "Ctrl / ⌘ + Shift + X to read"
                : state.phase === "Sleeping"
                  ? "Resting until you need me."
                  : working
                    ? "Let’s read this together."
                    : "Hello, I’m Xiami. 你好！"}
            </div>
            <button
              className="pet-button"
              aria-label="Open Xiami controls"
              onClick={() => {
                setExpanded(!expanded);
                last.current = Date.now();
                if (native) bridge.clickThrough(false).catch(fail);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setExpanded(true);
              }}
            >
              <Sprite phase={state.phase} />
            </button>
            <span className="pet-name">
              XIAMI <span>· {state.phase}</span>
            </span>
          </div>

</div>;
  return localize(
    <main className={native ? "native-shell" : "preview-shell"}>
      {!native && (
        <header className="page-header">
          <a className="brand" href="/">
            xiami<span>蝦米</span>
          </a>
          <div className="preview-badge">
            <i /> Interactive preview
          </div>
          <span className="header-note">A little help understanding.</span>
        </header>
      )}
      <section className="companion-layout">
        {!native && (
          <aside className="demo-source">
            <div className="eyebrow">WATCH XIAMI READ WITH YOU</div>
            <h1>A helping paw.</h1>
            <div className="demo-tabs" aria-label="Sample type">
              <button aria-pressed={demo === "document"} onClick={() => { void stop(); setDemo("document"); }}>1. Document</button>
              <button aria-pressed={demo === "sms"} onClick={() => { void stop(); setDemo("sms"); }}>2. Phone SMS</button>
              <button aria-pressed={demo === "speech"} onClick={() => { void stop(); setDemo("speech"); }}>3. Speech translation</button>
              <button aria-pressed={demo === "photo"} onClick={() => { void stop(); setDemo("photo"); }}>4. LIVE Translate</button>
            </div>
            {demo === "photo" ? <PhotoDemo /> : demo === "speech" ? <section className="speech-launch"><h2>A little conversation with Xiami.</h2><p>Hold to speak. Release to see the sample translation.</p><button className="talk-button" onClick={() => setSpeechOpen(true)}>Talk to me (说什么？)</button><Sprite phase="Idle" /><p>Sample: “Please remember to shut off your TV.”</p></section> : <>
            <p className="demo-instruction">{demo === "document" ? "Watch one paragraph being highlighted and translated." : "Watch one sentence in a message being highlighted and translated."}</p>
            <button className="demo-play" disabled={working || busy} onClick={() => void begin()}>▶ Play this demo</button><div className={demo === "document" ? "sample-paper" : "sample-phone"}>
              {demo === "document" ? <><div className="sample-kicker">SAMPLE DOCUMENT · 01</div><h2>Your appointment</h2><p>Dear reader,</p><p>Thank you for arranging your next visit with our community team.</p></> : <><div className="phone-status">9:41 <span>● ▰</span></div><div className="phone-contact">‹ &nbsp; Mei <small>SMS · Sample conversation</small></div><p className="sms-outgoing">See you this afternoon!</p></>}
              <div className={demo === "sms" ? "sms-incoming" : "document-paragraph"}>
                {demo === "sms" && <span>Hello! I’m coming to visit today. </span>}
                <mark key={`${demo}-${demoRun}`} className={`demo-highlight ${selectionStage}`}>{example.source}</mark>
                {demo === "sms" && <span> I’ll bring some fruit for us.</span>}
              </div>
              {demo === "document" ? <p>If you need to change your appointment, please contact our reception team.<br /><br />Kind regards,<br />Community support team</p> : <div className="phone-compose">Text message <span>↑</span></div>}
              {companionUI}
            </div>
            <p className="demo-caption" role="status">{selectionStage === "sweeping" ? "① Highlighting your selection…" : selectionStage === "selected" ? "② Selected text → Xiami’s translation" : "Choose a sample, then press “Play selection demo”."}</p>
            <p className="demo-disclaimer">Illustrated demo with prepared translations. The phone is a sample illustration.</p></>}
          </aside>
        )}
        {native && companionUI}
      </section>
      {speechOpen && <SpeechDemo onClose={() => setSpeechOpen(false)} />}
      {feedback && <Feedback source={state.source || example.source} language={state.fallback ? "Mandarin (fallback)" : language} onClose={() => setFeedback(false)} />}
      {!native && (
        <footer>
          <span>Made for a little more independence.</span>
          <span>廣東話 &nbsp; · &nbsp; 福建話</span>
        </footer>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).has("selection") ? (
      <Selection />
    ) : (
      <LanguageGate><App /></LanguageGate>
    )}
  </React.StrictMode>,
);



