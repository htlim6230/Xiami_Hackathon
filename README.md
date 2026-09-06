# Xiami 蝦米

A record of work created for Sparks @ Pek Kio Community Hackathon.

A Tauri 2 + React/TypeScript desktop translation companion, with a Python OCR/model/audio worker and a browser demonstration. Xiami helps elderly readers select English text and read a Cantonese or Hokkien rendering.

**Status: development prototype, not a production release.** The browser sample is functional; native capture, real dialect quality, and installer behavior need platform validation. No model weights, cloud credentials, signing certificates, or end-user research were supplied.

## Run the preview

Prerequisites: Node 22.12+ and pnpm 11.

```sh
pnpm install
pnpm build
pnpm preview
```

Open http://127.0.0.1:1420, choose English, Chinese, Malay or Tamil, then try Document, Phone SMS, Speech translation or LIVE Translate (static photos only). Hokkien uses a labelled Mandarin fallback until its provider is connected. Feedback supports local voice recording. Photo audio uses available device voices; speech and photo translations are prepared samples. If port 1420 is occupied, use the existing preview or run `pnpm preview --port 1421`.

See [Development record](DEVELOPMENT-RECORD.md) for completed work and limitations.

Normal development: `pnpm dev`. In restrictive Windows sandboxes, esbuild dependency pre-bundling may fail to inspect ancestor directories; the production build and preview above avoid that development-only issue.

## Run the desktop prototype

Install Rust stable, Tauri's OS prerequisites (MSVC C++ build tools and WebView2 on Windows 11, Xcode Command Line Tools on macOS), Python 3.11+, and Tesseract with English data.

```sh
python -m venv .venv
# Activate .venv using your shell's activation command.
python -m pip install -r worker/requirements.txt
pnpm tauri dev
```

Set `XIAMI_PYTHON` to the absolute virtualenv Python executable. Export the variables described in `.env.example` in the launch environment. The app does not automatically load `.env`. Provider secrets remain in the worker environment and are never sent to the webview.

Set `XIAMI_PIVOT_URL` and `XIAMI_PIVOT_MODEL` to an OpenAI-compatible local inference server serving Qwen2.5-7B-Instruct or your evaluated Mandarin model. Configure separate `XIAMI_CANTONESE_*` and `XIAMI_HOKKIEN_*` endpoints and models. These are real streaming HTTP adapters, not bundled/trained dialect models. Tencent Hy-MT is usable only behind a compatible serving adapter. Validate dialect quality with fluent speakers before actual use. Hokkien currently targets Taiwanese vocabulary/POJ; Singapore/Malaysian variants need their own lexicon and evaluation.

On macOS, allow Screen Recording for Xiami and restart if macOS requires it. Accessibility access is not requested because this prototype uses screenshots, not accessibility-tree text extraction. On Windows, xcap is used; a separate Windows Graphics Capture consent flow is not implemented.

## Behavior and architecture

- `src-tauri/src/lib.rs`: transparent, frameless, always-on-top window; global Ctrl/Command+Shift+X; monitor capture on a blocking worker; frozen overlay; validated crop selection; native worker lifecycle and cancellation.
- `src/Selection.tsx`: pointer capture, reverse-direction drags, Escape cancellation, CSS-to-image pixel scaling.
- `src/protocol.ts`: typed IPC entry points and discriminated event union. Python JSONL is relayed through Rust; request IDs reject stale events. Types are manually maintained, not code-generated from Rust.
- `worker/main.py`: local Tesseract via pytesseract (a process wrapper, chosen to avoid native Rust linking), word coordinates, opt-in Azure image OCR, English → Mandarin → dialect, robust SSE completion checks, domain prompts, fallback replacement, Jyutping and optional model POJ.
- `src/state.ts`: state reducer, late-event rejection, partial-translation replacement, selection geometry helpers.
- `src/Sprite.tsx`: 192×208 Canvas animator supporting 8×9 and 8×11 atlas geometry; reads only used cells and per-frame durations. Sleeping caps rendering at 5 FPS or less. Reduced-motion users see a single frame.
- `src/main.tsx`: language controls, Begin/Pause/Stop, large translation, romanization, replay, and a five-minute translation inactivity watchdog.

Only a user-selected crop is sent to OCR. Full monitor screenshots remain in memory until selection completes/cancels; OCR output and crop are not logged or retained in files. Local OCR is default. Cloud OCR requires `XIAMI_CLOUD_OCR_OPT_IN=1`; caregivers must explain that the crop is sent to Azure. Configured remote translation endpoints receive extracted text; Cantonese Edge TTS receives translated text. No webpage/document contents are sent merely by opening the app.

## Current limits

- Native Rust compilation and desktop E2E have not been run on this host: Rust and MSVC build tools were unavailable. CI is supplied for both target platforms; no CI run has been claimed.
- Capture is per monitor; selections cannot span displays. Mixed-DPI, negative-coordinate, Retina, protected windows, and screen permission denial/revocation require native QA.
- OCR bounding boxes are returned in physical desktop coordinates, but persistent per-word highlight rendering is not implemented. The result window is positioned beside the selected region and clamped to its monitor.
- Cantonese audio chunks travel through IPC, then buffer into an MP3 before playback. This is not low-latency incremental audio playback or lip sync. Hokkien TTS model integration remains unavailable and returns an actionable error; FAIR S2UT is not treated as a drop-in text voice.
- The standard pet atlas has no dedicated sleeping or talking row. The prototype uses quiet idle for sleep and waving for speaking; it does not claim lip-synced speech.
- Pause cancels active OCR/translation and retains the current display; Begin restarts. For audio, Pause/Resume preserves the playback position. Stop cancels and clears.
- Hotkey/click-through recovery, native window scrolling, and background power usage require real device tests. No 30 MB memory, 1.5 s translation, or 2 s audio claim is made.
- No end-user usability sessions or medical/legal translation validation have been conducted. Prompts preserve numbers and negations but are not a guarantee of accuracy.
- CI builds/checks app source, but Python, Tesseract and models are external prerequisites. A self-contained sidecar bundle, signed installers, notarization, updater public key/feed, and signed model/lexicon delivery are release work. Auto-update is not activated with a placeholder endpoint or key.

## Verification

```sh
pnpm build
pnpm test
python -m unittest discover -s tests -p test_worker.py
```

Tests exercise stale events, Stop behavior, Mandarin fallback replacing partial dialect text, selection coordinate scaling, domain prompts, endpoint restrictions, UTF-8 SSE and truncated streams. See `VALIDATION.md` for performed checks and `RELEASE.md` for remaining deployment gates.

## Reference documentation

- [Tauri global shortcuts](https://v2.tauri.app/plugin/global-shortcut/)
- [Tauri window configuration](https://v2.tauri.app/reference/config/)
- [xcap monitor implementation](https://github.com/nashaofu/xcap/blob/master/src/monitor.rs)
- [Edge TTS streaming API](https://github.com/rany2/edge-tts/blob/master/src/edge_tts/communicate.py)
- [Azure image OCR](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-ocr)


## Included artwork

`public/spritesheet.webp` is Xiami's validated v2 atlas. The separate `xiami-pet` deliverable contains the Codex manifest and complete QA evidence. Installing the visual pet alone does not install this translation application. The app icons were deterministically exported from its approved idle frame.

