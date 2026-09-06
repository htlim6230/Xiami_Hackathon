# Xiami artwork

Visual production used the built-in imagegen tool through the hatch-pet skill. No model API keys were needed and no code-generated poses were substituted.

Canonical prompt concept: a friendly cocoa-brown plush otter, cream muzzle and belly, small rounded ears, expressive eyes, broad tapered tail, holding a small unmarked cream booklet. A calm, patient companion for elderly readers. Soft felt material and clean shapes readable at 192×208 pixels. Flat magenta extraction background; no text, shadows, scenery, or detached effects.

The prompt set generated one canonical base, then separate strips for idle (6), running-right (8), waving (4), jumping (5), failed (8), waiting (6), working/running (6), and review (6). Running-left was derived by per-frame mirroring after the rightward strip passed visual QA; this preserves temporal order and the unmarked booklet. Direction generation uses four cardinal anchors and two coherent eight-pose strips, with image references grounding identity and spacing.

Look mechanics: feet/lower body stay anchored; head yaw, chin pitch and coordinated eyes express attention. The booklet stays between the paws and follows the upper torso subtly. Directions are in viewer coordinates: up, right, down, left. No whole-sprite rotation to fake gaze.

The canonical image and each normal animation strip were generated using imagegen, then extracted and assembled with hatch-pet's deterministic scripts. The final v2 atlas is only packaging-eligible after row/frame, clipping, direction semantics, independent blind direction votes, continuity, chroma cleanup and final visual checks. See the pet QA directory for actual results.
