import type { Phase, PipelineEvent } from "./protocol";
export interface State {
  phase: Phase;
  requestId: string;
  source: string;
  translation: string;
  romanization: string;
  notice: string;
  error: string;
  fallback: boolean;
}
export const initial: State = {
  phase: "Idle",
  requestId: "",
  source: "",
  translation: "",
  romanization: "",
  notice: "",
  error: "",
  fallback: false,
};
export type Action =
  | PipelineEvent
  | { type: "start"; requestId: string }
  | { type: "reset" }
  | { type: "phase"; phase: Phase };
export function reducer(state: State, event: Action): State {
  if (event.type === "reset") return initial;
  if (event.type === "start")
    return { ...initial, requestId: event.requestId, phase: "Selecting" };
  if (event.type === "phase")
    return {
      ...state,
      phase: event.phase,
      requestId: event.phase === "Paused" ? "" : state.requestId,
    };
  if (event.requestId !== state.requestId) return state;
  switch (event.type) {
    case "state":
      return { ...state, phase: event.state };
    case "source":
      return { ...state, source: event.text };
    case "chunk":
      return { ...state, translation: state.translation + event.text };
    case "romanization":
      return { ...state, romanization: event.text };
    case "fallback":
      return {
        ...state,
        translation: event.text,
        romanization: "",
        notice: event.notice,
        fallback: true,
      };
    case "error":
      return { ...state, phase: "Error", error: event.message };
    case "done":
      return { ...state, phase: "Ready" };
    default:
      return state;
  }
}
export function selectionBox(
  start: { x: number; y: number },
  end: { x: number; y: number },
  viewport: { width: number; height: number },
) {
  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));
  const ax = clamp(start.x, viewport.width),
    ay = clamp(start.y, viewport.height);
  const bx = clamp(end.x, viewport.width),
    by = clamp(end.y, viewport.height);
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}
export function imageBox(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  image: { width: number; height: number },
) {
  return {
    x: (box.x / viewport.width) * image.width,
    y: (box.y / viewport.height) * image.height,
    width: (box.width / viewport.width) * image.width,
    height: (box.height / viewport.height) * image.height,
  };
}
