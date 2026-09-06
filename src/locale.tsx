import { ms, ta } from "./extraLocales";
import { photoZh } from "./photoLocale";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type UiLanguage = "en" | "zh" | "ms" | "ta";
const Locale = createContext<{ language: UiLanguage; setLanguage: (language: UiLanguage) => void }>({ language: "en", setLanguage: () => {} });
const zh: Record<string, string> = { ...photoZh, "Speech target language":"語音翻譯目標語言",
"Sample type":"示範類型", "Xiami translation controls":"蝦米翻譯選單", "Translation result":"翻譯結果",
"Interactive preview":"互動預覽", "A little help understanding.":"陪您輕鬆理解。", "WATCH XIAMI READ WITH YOU":"讓蝦米陪您閱讀", "A helping paw.":"讓蝦米幫您一把。",
"1. Document":"1. 文件", "2. Phone SMS":"2. 手機短訊", "3. Speech translation":"3. 語音翻譯",
"Watch one paragraph being highlighted and translated.":"觀看如何選取並翻譯一段文字。", "Watch one sentence in a message being highlighted and translated.":"觀看如何選取並翻譯短訊中的一句話。", "▶ Play this demo":"▶ 播放示範",
"SAMPLE DOCUMENT · 01":"示範文件 · 01", "SMS · Sample conversation":"短訊 · 對話示範", "Text message":"文字訊息",
"Language & controls · 設定":"語言與操作設定", "Let’s make it clear.":"一起看明白。", "Speak to me in":"翻譯成", "／ 目標語言":"／ 目標語言",
"Cantonese":"廣東話", "Hokkien":"福建話", "Mandarin (fallback)":"普通話（備用翻譯）", "Translate on-screen":"翻譯螢幕文字", "Play selection demo":"播放選取示範", "Resume 繼續":"繼續", "Pause 暫停":"暫停", "□   Stop 結束":"□ 結束", "Feedback · 提供意見":"提供意見",
"YOUR TRANSLATION":"翻譯結果", "Increase translation text size":"放大翻譯文字", "Original English":"英文原文", "Mandarin 普通話":"普通話", "Cantonese 廣東話":"廣東話", "Hokkien 福建話":"福建話", "SAMPLE":"示範", "Reading your selection…":"正在閱讀所選文字…", "Jyutping · 粵拼":"粵拼", "POJ · 白話字":"白話字", "Translation ready. 譯文已準備好。":"譯文已準備好。", "◖))   Read aloud":"◖)) 朗讀", "Keep the original nearby to check names, dates and numbers.":"請對照原文，核對姓名、日期與數字。", "Paused. Begin again to restart reading.":"已暫停。請重新開始閱讀。",
"Ctrl / ⌘ + Shift + X to read":"按 Ctrl / ⌘ + Shift + X 開始閱讀", "Ctrl / ⌘ + Shift + X to select text":"按 Ctrl / ⌘ + Shift + X 選取文字", "Resting until you need me.":"我先休息，隨時為您服務。", "Let’s read this together.":"我們一起慢慢看。", "Hello, I’m Xiami. 你好！":"您好，我是蝦米！", "Open Xiami controls":"開啟蝦米選單",
"① Highlighting your selection…":"① 正在標示所選文字…", "② Selected text → Xiami’s translation":"② 所選文字 → 蝦米的翻譯", "Choose a sample, then press “Play selection demo”.":"選擇示範，再按「播放選取示範」。", "Illustrated demo with prepared translations. The phone is a sample illustration.":"此為預設翻譯示範，手機畫面為示意圖。", "Made for a little more independence.":"陪您更自在地處理日常事務。",
"A little conversation with Xiami.":"和蝦米聊一聊。", "Hold to speak. Release to see the sample translation.":"按住說話，放開即可查看示範翻譯。", "Talk to me (说什么？)":"說什麼？", "Sample: “Please remember to shut off your TV.”":"示範英文：「Please remember to shut off your TV.」",
"Close speech demo":"關閉語音示範", "Hello, I’m Xiami. Hold the button below, then release to translate.":"您好，我是蝦米。請按住下方按鈕，放開後即可翻譯。", "Sample speech demo · No microphone is used. This demonstrates the following prepared sentence.":"語音示範不會使用麥克風，將展示以下預設句子的翻譯。", "Listening to the sample… Release to translate.":"正在聆聽示範…放開即可翻譯。", "Translating the sample…":"正在翻譯示範語句…", "Here’s the sample in Cantonese · 廣東話":"以下是廣東話示範翻譯", "Press and hold to talk to Xiami. 按住說話":"按住按鈕，和蝦米說話。", "Hold to record sample speech":"按住錄製示範語音", "Release to translate · 放開翻譯":"放開翻譯", "Hold to record · 按住錄音":"按住錄音", "Mouse, touch, or hold Space / Enter.":"可使用滑鼠、觸控，或按住空白鍵／Enter 鍵。",
"Microphone inactive":"麥克風未啟用", "Sample soundwave · demonstration only":"示範聲波 · 非實際錄音", "Sound detected · 已偵測到聲音":"已偵測到聲音", "Listening… speak to see the soundwave":"正在聆聽…請說話以查看聲波",
"Help Xiami say it right":"教蝦米說得更準確", "Close feedback":"關閉意見視窗", "Selected English text":"所選英文原文", "Record the correct translation in":"請錄製正確翻譯，使用語言：", "Waiting for microphone…":"正在等候麥克風…", "Recording correction":"正在錄製修正翻譯", "● Record again":"● 重新錄音", "● Record correct translation":"● 錄製正確翻譯", "Resume (繼續)":"繼續", "Pause (暂停)":"暫停", "Stop (结束)":"結束", "Recording paused. Resume when you are ready.":"錄音已暫停。準備好後請按「繼續」。", "Recording… Speak your correction, then press Stop.":"正在錄音…請說出正確翻譯，然後按「結束」。", "Recording ready. Listen back before saving.":"錄音已完成。儲存前可先試聽。", "Your microphone starts only when you press Record.":"只有按下錄音按鈕才會啟用麥克風。", "Your recorded correction":"您錄製的修正翻譯", "Save voice recording":"儲存錄音", "Preview feedback stays on this device and is not submitted. Save your recording before closing this window.":"示範意見只保留在此裝置，不會傳送。關閉視窗前請先儲存錄音。",
"Voice recording is unavailable in this browser. Try opening this preview in Microsoft Edge or Chrome.":"此瀏覽器無法錄音，請使用 Microsoft Edge 或 Chrome 開啟預覽。", "No audio was captured. Please try again.":"未錄到聲音，請重試。", "Recording stopped unexpectedly. Please try again.":"錄音意外中斷，請重試。", "Microphone permission was declined. Allow microphone access in your browser, then try again.":"麥克風權限被拒絕。請在瀏覽器允許使用麥克風後重試。", "Could not access your microphone.":"無法使用麥克風。",
"Sample Mandarin fallback. Hokkien provider is not connected.":"目前顯示普通話備用示範；尚未連接福建話翻譯服務。", "Dialect audio is available in the configured desktop app. This browser preview does not imitate a dialect voice.":"方言語音需在設定完成的桌面程式使用，此瀏覽器預覽不會模擬方言語音。", "Idle":"待命", "Ready":"完成", "Selecting":"選取中", "Reading":"閱讀中", "Translating":"翻譯中", "Speaking":"朗讀中", "Paused":"已暫停", "Sleeping":"休息中", "Error":"發生錯誤"
};
const en: Record<string, string> = {"Language & controls · 設定":"Language & controls", "慢慢來，我陪您。":"Take your time. I’m here to help.", "／ 目標語言":"", "廣東話":"", "福建話":"", "開始閱讀":"Begin reading", "Resume 繼續":"Resume", "Pause 暫停":"Pause", "□   Stop 結束":"□ Stop", "Feedback · 提供意見":"Feedback", "Cantonese 廣東話":"Cantonese", "Hokkien 福建話":"Hokkien", "Mandarin 普通話":"Mandarin", "Jyutping · 粵拼":"Jyutping", "POJ · 白話字":"POJ", "朗讀":"", "Hello, I’m Xiami. 你好！":"Hello, I’m Xiami!", "Translation ready. 譯文已準備好。":"Translation ready.", "Talk to me (说什么？)":"Talk to me", "Here’s the sample in Cantonese · 廣東話":"Here’s the sample in Cantonese", "Press and hold to talk to Xiami. 按住說話":"Press and hold to talk to Xiami.", "Release to translate · 放開翻譯":"Release to translate", "Hold to record · 按住錄音":"Hold to record", "Sound detected · 已偵測到聲音":"Sound detected", "Resume (繼續)":"Resume", "Pause (暂停)":"Pause", "Stop (结束)":"Stop"};
export function translateUi(value: string, language: UiLanguage): string {
  const key = value.trim();
  const replacement = ({ en, zh, ms, ta }[language])[key];
  return replacement === undefined ? value : value.replace(key, replacement);
}
export function useLocalize() {
  const { language } = useContext(Locale);
  function localize(node: ReactNode): ReactNode {
    if (typeof node === "string") return translateUi(node, language);
    if (Array.isArray(node)) return node.map(localize);
    if (!React.isValidElement(node)) return node;
    const element = node as React.ReactElement<Record<string, unknown>>;
    // Translation content is data, not interface copy; never rewrite it.
    if (element.props["data-content"] || element.props.lang) return node;
    if (typeof element.type !== "string" && element.type !== React.Fragment) return node;
    const props: Record<string, unknown> = {};
    for (const name of ["aria-label", "title", "placeholder"]) if (typeof element.props[name] === "string") props[name] = translateUi(element.props[name] as string, language);
    if ("children" in element.props) props.children = localize(element.props.children as ReactNode);
    return React.cloneElement(element, props);
  }
  return localize;
}

const languageNames: Record<UiLanguage, string> = { en: "English", zh: "中文", ms: "Bahasa Melayu", ta: "தமிழ்" };
const languageLabels: Record<UiLanguage, string> = { en: "Language", zh: "語言", ms: "Bahasa", ta: "மொழி" };
const languageCodes = Object.keys(languageNames) as UiLanguage[];
export function LanguageButton() {
  const { language, setLanguage } = useContext(Locale);
  const [open, setOpen] = useState(false);
  return <div className="quick-language"><button className="feedback-button" aria-expanded={open} onClick={() => setOpen(!open)}>🌐 {languageLabels[language]}</button>{open && <div className="quick-language-options" role="group" aria-label={languageLabels[language]}>{languageCodes.map(code => <button key={code} lang={code === "zh" ? "zh-Hant" : code} aria-pressed={language === code} onClick={() => { setLanguage(code); setOpen(false); }}>{languageNames[code]}</button>)}</div>}</div>;
}
export function LanguageGate({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<UiLanguage | null>(null);
  useEffect(() => { document.documentElement.lang = language === "zh" ? "zh-Hant" : language || "en"; }, [language]);
  const welcome = { en: "Continue in English", zh: "使用中文繼續", ms: "Teruskan dalam Bahasa Melayu", ta: "தமிழில் தொடரவும்" };
  return <Locale.Provider value={{ language: language || "en", setLanguage }}>{language ? <><div className="interface-language"><label htmlFor="ui-language">{translateUi("Interface language", language) === "Interface language" && language === "zh" ? "介面語言" : translateUi("Interface language", language)}</label><select id="ui-language" value={language} onChange={e => setLanguage(e.target.value as UiLanguage)}>{languageCodes.map(code => <option key={code} value={code}>{languageNames[code]}</option>)}</select></div>{children}</> : <main className="language-gate"><div className="language-welcome"><span className="brand">xiami · 蝦米</span><h1>Welcome to Xiami</h1><p>Choose your menu language.<br/><span lang="zh-Hant">請選擇介面語言。</span><br/><span lang="ms">Pilih bahasa menu anda.</span><br/><span lang="ta">உங்கள் பட்டி மொழியைத் தேர்ந்தெடுக்கவும்.</span></p><div className="language-choices">{languageCodes.map(code => <button key={code} onClick={() => setLanguage(code)} lang={code === "zh" ? "zh-Hant" : code}>{languageNames[code]}<span>{welcome[code]}</span></button>)}</div><p className="feedback-local">You can change this later. Translation dialect is chosen separately.</p></div></main>}</Locale.Provider>;
}
