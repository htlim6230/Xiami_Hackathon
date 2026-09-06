# Development record

Xiami was created for Sparks @ Pek Kio Community Hackathon as an otter reading companion for elderly users.

## Work completed

- Tauri 2 / React / TypeScript desktop prototype with Python OCR, model and audio worker scaffolding.
- Codex-compatible v2 otter sprite package, standard animation rows, directional art, validation and visual QA records in `pet/`.
- Document demo: highlight one paragraph, then show its prepared translation.
- Phone SMS demo: highlight one sentence inside a smartphone illustration.
- Speech demo: hold and release the button above Xiami to translate the prepared TV-reminder sentence.
- Static photo demo: mock camera, capture, review/confirm, loading and result card. Includes upload review, copy, device audio controls and simulated permission/readability/timeout failures.
- Cantonese and Hokkien choices. Unconnected Hokkien uses an explicitly labelled Mandarin fallback.
- Speech-bubble translation menu positioned above the otter inside sample screens.
- Feedback dialog with selected source text, microphone recording, responsive waveform, pause/resume, stop, playback and local saving.
- English, Traditional Chinese, Malay and Tamil interface choices; quick language selection beside Feedback.

## Verification and limitations

Latest completed verification: frontend production build and 15 Vitest tests passed. Browser checks covered the sample flows, interface switching and feedback layout. Native builds, actual microphone/device-voice behavior across platforms, dialect quality review and elderly usability testing remain necessary.

The speech demonstration uses a prepared sentence; it is not live recognition. The photo demonstration translates the bundled fictional MRT sign; arbitrary image OCR requires backend integration. Photo audio uses available device voices. The other dialect audio flows require configured workers. No production installers, signing certificates, provider keys or model weights are included.

See `PHOTO-TRANSLATION.md` for photo architecture/API design, `PET-ART.md` and `pet/qa/` for artwork records, and `RELEASE.md` for distribution prerequisites. Earlier QA reports retain the context of their original validation dates and may show fewer tests than this latest snapshot.
