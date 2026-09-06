# Validation record

Performed on this Windows host during implementation:

- React/TypeScript production build: PASS (`pnpm build`).
- State/geometry unit tests: PASS, 5 tests (`pnpm test`).
- Python worker contract tests: PASS, 5 tests (`python -m unittest discover -s tests -p test_worker.py`). These mock providers and OCR; they do not establish real translation accuracy or OCR quality.
- Browser interaction: sample English/Cantonese output and Jyutping displayed; Stop removed the result; Hokkien selection produced a clearly marked Mandarin fallback and disabled dialect audio; the text enlargement control remained operable. Inspected a narrow 306px preview, with readable wrapping and vertical scrolling.
- Main translation colors: contrast 12.28:1 (#183b28 on #fffefa). Begin text/background: 9.65:1. Read-aloud colors: 8.67:1. Default control foreground: 11.51:1. Primary translation is 30px (22.5pt), adjustable to 42px. This is not a full WCAG conformance audit.
- Dependency lockfile created. Vite's production build passes using the native config loader; dev dependency optimization is blocked by this host's restricted ancestor-directory access.
- No native Rust build: cargo/rustc and an MSVC C++ toolchain were absent. No native capture, Python child launch, microphone/audio device, screen permissions, multi-DPI placement, package signing or updater E2E success is claimed.
- No cloud/model requests or real documents used in validation. No UAT participants, latency measurements or whole-process memory benchmarks.

Pet validation artifacts are delivered separately with the pet package after its image QA gates pass. Standard rows 0–8 passed extraction and independent motion QA. Gaze rows and final atlas have their own validation reports.

Final asset integration: the validated v2 atlas loads in the browser Canvas renderer as Xiami (no fallback placeholder). Desktop .ico/.icns and PNG icons are included. Native compilation remains unverified.
