# Xiami static photo translation

## Delivered frontend

The fourth tab, **LIVE Translate / 现时翻译**, is a static-photo feature despite its name. `PhotoDemo.tsx` provides a smartphone shell with an island, status bar, scrolling viewport, and fixed bottom navigation. No camera stream or AR overlay runs. The mock camera shutter freezes the bundled fictional MRT sign; the user must then explicitly confirm it before processing.

Flow: dashboard → mock camera → review → processing → result. Upload → review uses the same flow. The inline result card sits beneath the photo and includes translation, expandable original, audio controls, copy and re-translate. Home, retake, cancellation, unmount and target changes cancel outstanding work. Source is English in this MVP; target is Cantonese or Mandarin. Interface language remains independent and supports English and Traditional Chinese.

## Files

- `src/PhotoDemo.tsx`: UI, static sample artwork, upload validation, recording-free capture, result and recovery controls.
- `src/photoService.ts`: typed asynchronous demo adapter, cancellation and deterministic error simulations.
- `src/photo.css`: responsive phone shell and accessible controls.
- `src/photoLocale.ts`: Chinese interface copy, merged into the existing locale system.
- `src/main.tsx`: fourth-tab integration.
- `tests/photo.test.ts`: pipeline output, unreadable/timeout errors, upload guard and cancellation.

## Current boundaries

The bundled sample works without keys or network requests. Its sign and directions are fictional. Uploaded JPG/PNG/WebP images are validated (10 MB and 24 megapixel limits), decoded and shown for review using an object URL. They are not uploaded to any server. Translating them returns an explicit backend-required notice; the adapter never substitutes the sample translation for a real photograph.

Audio uses browser speech synthesis: Cantonese requires a `yue` or `zh-HK` voice; Mandarin requires a `zh-TW`/`zh-CN` voice. Missing voices are reported instead of using an incorrect dialect. Original English playback is also offered. Browser voices may use a vendor's online service depending on the installed voice. Production should provide a dialect TTS audio URL with explicit provider configuration.

## Production architecture and API contract

Keep the frontend state flow. Replace the demo adapter with an authenticated backend request after photo confirmation:

`POST /api/photo-translations` — multipart: `image`, `sourceLanguage=en`, `targetLanguage=yue|zh`, `requestId`.

Successful response:

```json
{
  "requestId": "uuid",
  "original": "Exit A → Bus interchange",
  "translated": "A 出口 → 巴士轉車站",
  "speechLanguage": "zh-HK",
  "sample": false,
  "boxes": [{ "x": 0.09, "y": 0.44, "width": 0.75, "height": 0.07 }],
  "audioUrl": "/api/photo-translations/uuid/audio"
}
```

Server pipeline: validate/decode image → normalize orientation and remove EXIF → OCR (existing Tesseract worker or configured cloud OCR) → reject empty/low-confidence text → preserve exit letters/arrows and route names → existing Mandarin pivot/dialect adapter → optional dialect TTS. Use normalized image-relative bounding boxes. Keep API keys on the server or native worker; never bundle them in Vite code. Validate response fields before rendering. Treat OCR text as untrusted source content, not model instructions.

Use request IDs and AbortController for stale result protection and a bounded client/server timeout (for example 15 seconds). Map structured errors to recoverable UI states: CAMERA_DENIED (upload alternative), UNREADABLE (retake), TIMEOUT (retry), PROVIDER_UNAVAILABLE (retry later). Real camera capture can use mobile file input capture or a getUserMedia viewfinder; snapshot once to a canvas/blob, stop all tracks, show review, then translate only after confirmation. Camera permission is requested only after tapping Camera. No background translation, video processing, or continuous OCR.

Retain images only as needed for the request and disclose any cloud upload before confirmation. Use short-lived authenticated audio URLs and a documented retention policy. No server, credentials, real camera permission request, or arbitrary-image OCR is included in this frontend demo.

## Preview

From this directory: `pnpm install`, `pnpm build`, `pnpm preview`. Open the printed local address, choose the interface language, and choose the fourth tab.

Test capture → confirm → result, change target → confirm again, copy, device audio, upload review, cancel during processing and each scenario in **Demo error scenarios**. Permission denial is a simulated scenario in this mock camera, not a request to the physical camera. Timeout simulation takes three seconds; retry resets the scenario to success.

Hokkien option update: targetLanguage also accepts nan. The frontend offers Hokkien before translation. Until a Hokkien provider is connected, nan requests return fallback: true with explicitly labelled Mandarin output; translated audio is disabled to avoid presenting Mandarin speech as Hokkien. Original English audio remains available. Speech demo uses the same labelled fallback policy.
