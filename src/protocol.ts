import { invoke, isTauri } from "@tauri-apps/api/core";
export type Language = "Cantonese" | "Hokkien";
export type Phase =
  | "Idle"
  | "Selecting"
  | "Reading"
  | "Translating"
  | "Ready"
  | "Speaking"
  | "Paused"
  | "Sleeping"
  | "Error";
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Capture {
  image: string;
  width: number;
  height: number;
  requestId: string;
}
export type PipelineEvent = { requestId: string } & (
  | { type: "state"; state: Phase }
  | { type: "source"; text: string; boxes: Box[] }
  | { type: "chunk"; text: string }
  | { type: "romanization"; text: string }
  | { type: "fallback"; text: string; notice: string }
  | { type: "audio"; data: string; mime: string }
  | { type: "done" }
  | { type: "error"; message: string }
);
export const native = isTauri();
export const bridge = {
  begin: (language: Language) =>
    invoke<string>("begin_selection", { language }),
  capture: () => invoke<Capture>("get_capture"),
  select: (requestId: string, box: Box) =>
    invoke("submit_region", { requestId, box }),
  cancel: () => invoke("cancel"),
  clickThrough: (enabled: boolean) => invoke("set_click_through", { enabled }),
  speak: (text: string, language: Language, requestId: string) =>
    invoke<string>("speak", { text, language, requestId }),
  language: (language: Language) => invoke("set_language", { language }),
};
