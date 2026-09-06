# Xiami v2 pet

`pet.json` and `spritesheet.webp` form the Codex-compatible pet package. Keep both in one folder. The atlas uses 192×208 cells in an 8×11 grid; row 0 includes the v2 neutral slot in column 6 in addition to the six idle animation cells.

The QA folder includes the final contact sheet, directional sheet, animation previews, validator output, three independent blind-review votes, consensus, semantic review, and the final independent visual approval. Intermediate blind-direction ambiguity is documented and accepted by labeled review; all four cardinals pass.

The left-running row is a bit-exact per-frame mirror of the approved, extracted right-running row. Normalizing slots before mirroring removed source-strip boundary fragments. The generated gaze cells were unchanged by that repair; pixel-identical directional QA confirms blind-review reuse. No second chroma cleanup pass was applied.

This pet is visual artwork. Translation functionality comes from the separate Xiami app source; installing the pet in Codex alone does not add screen translation.
