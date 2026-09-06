export type PhotoTarget = "yue" | "zh" | "nan";
export type PhotoResult = { original: string; translated: string; speechLanguage: string; sample: boolean; fallback: boolean };
export type PhotoScenario = "success" | "denied" | "unreadable" | "timeout";
export const sampleOriginal = "Exit A → Bus interchange\nExit B → City Library\nExit C → Riverside Park";
export function translatePhoto(input: { sample: boolean; target: PhotoTarget; scenario: PhotoScenario; signal: AbortSignal }): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    if (input.signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
    const cancel = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => {
      input.signal.removeEventListener("abort", cancel);
      if (input.scenario === "timeout") { reject(new Error("TIMEOUT")); return; }
      if (input.scenario === "unreadable") { reject(new Error("UNREADABLE")); return; }
      if (!input.sample) { reject(new Error("PROVIDER_REQUIRED")); return; }
      resolve({ original: sampleOriginal, translated: input.target === "yue" ? "A 出口 → 巴士轉車站\nB 出口 → 市立圖書館\nC 出口 → 河邊公園" : "A 出口 → 公車轉運站\nB 出口 → 市立圖書館\nC 出口 → 河濱公園", speechLanguage: input.target === "yue" ? "zh-HK" : "zh-TW", sample: true, fallback: input.target === "nan" });
    }, input.scenario === "timeout" ? 3000 : 1300);
    input.signal.addEventListener("abort", cancel, { once: true });
  });
}
