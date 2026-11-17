# v2.4 architecture

Baseline: v2.3 commit `56758e5b2ba66f7517611b0d81280608a3bd709e`. The existing app is extended; the importer, writer, embedded company logo and synthesized music are preserved.

## Runtime

`index.html` remains the sole runtime artifact, with four inline script blocks:

1. Unmodified JSZip 3.10.1.
2. Existing ExcelLocal CSV/OOXML reader/writer. Native browser DOMParser reads worksheets and shared strings; exported string cells are inline text, not formulas.
3. BatchEngine: pure transitions and validation; configured batches are immutable. `roundIndex` now means global batch index 0–13; each entry resolves tier, per-tier batch number/total and winner count. No tier indexing by batch index.
4. Existing UI/controller, adapted to batch metadata, amount snapshots, recovery and the new ceremony theme. All application assets are embedded and system fonts are used.

## State transitions

READY → DRAWING → REVEAL → WAITING_NEXT_BATCH → READY (next batch), or COMPLETED after the final reveal. Clicking the preparation button from REVEAL also advances to READY/COMPLETED directly. Only the separate start action enters DRAWING; no timer auto-starts another batch.

Transitions use persist-before-mutate: a proposed snapshot must be written synchronously before state is exposed to UI/timers. Start selects exactly the configured count via crypto.getRandomValues rejection sampling and partial Fisher–Yates. The entire event's previous winners are excluded by identifier. JavaScript synchronous guards reject repeated start/finish/advance actions.

DRAWING snapshots include selected people, amount, timestamp and exact 10,000 ms wall-clock deadline. Finish commits selected winners before revealing them. Amounts lock at the first start, including a refreshed running batch. Each completed batch preserves its own amount; result exports do not re-read mutable prize values.

## Recovery and failures

Version 4 has a separate sessionStorage key. Restore validates schema/version, phase/index consistency, roster identifiers, duplicate codes/CCCD, exact batch counts/order, membership, no repeated winners, amount bounds, pool sizes and deadlines. Selected winner objects are resolved against the imported roster. Malformed snapshots block new draws instead of silently resetting.

In-progress restore retains pending people and deadline; expired batches finish without new selection. REVEAL restores the overlay; WAITING_NEXT_BATCH does not restart. Performance clock handles the active countdown, while the wall clock anchors persisted recovery. System clock changes and background tab scheduling are outside real-time guarantees.

Storage unavailable/quota failure blocks a start before animation. Failed completion/advance keeps the preceding persisted state, prevents alternate selection, and prompts recovery. Old v2.3 sessions remain separate and have a local JSON backup control; no silent migration of 30/8/3/2/1 outcomes into 14 batches.

## Presentation and audio

Theme: burgundy #711E35, champagne #E8BF75, navy #101D39, ivory #FFF7E9. Original book SVG, subtle CSS particles, reduced-motion support. Admin shows batch, remaining batches/eligible people. Presentation hides technical/admin content, centers 1/4/5 cards, adds gold effects for the first prize, and has a minimal completed screen. Winner cards have exactly code and name, with row-reference aliases for CCCD-only participants.

Web Audio is created after interaction. Countdown voices are tracked and stopped between beats, on toggle and at completion. 10–4 use normal pulses; 3–1 intensify. Music has separate controls and gain/output; custom local tracks are optional and never uploaded. Native fullscreen is requested, with browser fullscreen as fallback when the host denies the API.

## Development and privacy

`tests/test-v24.cjs` extracts the actual bundled engine/controller/library, runs pure engine and controller scenarios in Node VM with an explicitly fake clock/DOM/audio/storage, and validates OOXML ZIP output. It does not impersonate a browser rendering test. Browser smoke evidence is separately recorded in QA_V2_4.md. `scripts/preflight.py` enforces an exact public-file allowlist, asset embedding, privacy/credential checks and JS syntax.

No runtime data or test exports are stored in the source repository. The public frontend does not provide centralized state, authentication or tamper-proof auditing; operators keep local exports confidential.
