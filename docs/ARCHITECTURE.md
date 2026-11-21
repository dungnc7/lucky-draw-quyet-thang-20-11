# v2.6 architecture

Baseline: v2.3 commit `56758e5b2ba66f7517611b0d81280608a3bd709e`. The existing app is extended; the importer, writer, embedded company logo and synthesized music are preserved.

## Runtime

`index.html` remains the HTML runtime artifact, with six inline script blocks:

1. Unmodified JSZip 3.10.1.
2. Existing ExcelLocal CSV/OOXML reader/writer. Native browser DOMParser reads worksheets and shared strings; exported string cells are inline text, not formulas.
3. BatchEngine: pure transitions and validation; configured batches are immutable. `roundIndex` now means global batch index 0–12; each entry resolves tier, per-tier batch number/total and winner count. No tier indexing by batch index.
4. EventPlatform: first theme/preset registry and metadata model added with explicit owner approval; seven themes and three presets, independent content/appearance.
5. SharedConfiguration: strict public-only JSON schema, revision checks, draft/publication preparation, fetch validation and immutable snapshots.
6. Existing UI/controller, adapted to batch metadata, amount snapshots, recovery, event switching and CSS theme tokens. All application assets are embedded and system fonts are used.

## State transitions

READY → DRAWING → REVEAL → WAITING_NEXT_BATCH → READY (next batch), or COMPLETED after the final reveal. Clicking the preparation button from REVEAL also advances to READY/COMPLETED directly. Only the separate start action enters DRAWING; no timer auto-starts another batch.

Transitions use persist-before-mutate: a proposed snapshot must be written synchronously before state is exposed to UI/timers. Start selects exactly the configured count via crypto.getRandomValues rejection sampling and partial Fisher–Yates. The entire event's previous winners are excluded by identifier. JavaScript synchronous guards reject repeated start/finish/advance actions.

DRAWING snapshots include selected people, amount, timestamp and exact 10,000 ms wall-clock deadline. Finish commits selected winners before revealing them. Amounts lock at the first start, including a refreshed running batch. Each completed batch preserves its own amount; result exports do not re-read mutable prize values.

## Recovery and failures

Version 4 has a separate sessionStorage key. Current snapshots also require configId `v2.4-consolation-5x6`; incompatible older snapshots are retained, block new draws and offer a local JSON backup before explicit reset. They are never reinterpreted or silently migrated. Restore validates schema/version, phase/index consistency, roster identifiers, duplicate codes/CCCD, exact batch counts/order, membership, no repeated winners, amount bounds, pool sizes and deadlines. Selected winner objects are resolved against the imported roster. Malformed snapshots block new draws instead of silently resetting.

In-progress restore retains pending people and deadline; expired batches finish without new selection. REVEAL restores the overlay; WAITING_NEXT_BATCH does not restart. Performance clock handles the active countdown, while the wall clock anchors persisted recovery. System clock changes and background tab scheduling are outside real-time guarantees.

Storage unavailable/quota failure blocks a start before animation. Failed completion/advance keeps the preceding persisted state, prevents alternate selection, and prompts recovery. Old v2.3 sessions remain separate and have a local JSON backup control; no silent migration of 30/8/3/2/1 outcomes into 13 batches.

## Presentation and audio

Default theme: Sắc Màu Quyết Thắng (`quyet-thang-corporate`), primary #2E7BC3, secondary #F2363F, background #0D1B3D. Six other themes share the same token layer. Original book SVG, subtle CSS particles, reduced-motion support. Admin shows batch, remaining batches/eligible people. Presentation hides technical/admin content, centers 1/4/6 cards (six-card reveal is 3 columns × 2 rows on 16:9, 2 columns on mobile), adds gold effects for the first prize, and has a minimal completed screen. Winner cards have exactly code and name, with row-reference aliases for CCCD-only participants.

Web Audio is created after interaction. Countdown voices are tracked and stopped between beats, on toggle and at completion. 10–4 use normal pulses; 3–1 intensify. Music has separate controls and gain/output; custom local tracks are optional and never uploaded. Native fullscreen is requested, with browser fullscreen as fallback when the host denies the API.

## Development and privacy

`tests/test-v24.cjs` extracts the actual bundled engine/controller/library, runs pure engine and controller scenarios in Node VM with an explicitly fake clock/DOM/audio/storage, and validates OOXML ZIP output. It does not impersonate a browser rendering test. Browser smoke evidence is separately recorded in QA_V2_6.md. `scripts/preflight.py` enforces an exact public-file allowlist, asset embedding, privacy/credential checks and JS syntax.

No runtime data or test exports are stored in the source repository. The public frontend does not provide centralized state, authentication or tamper-proof auditing; operators keep local exports confidential.

## Event data and backward compatibility

Baseline for this extension is 696a734. There was no previous v2.6 event/theme registry; the owner authorized the first seven-theme registry on 2026-11-18. JSZip, ExcelLocal, BatchEngine, audio functions and logo payloads remain byte-identical to baseline.

`EventPlatform.createEvent/normalize` fills appearance.themeId only when missing/invalid; a valid saved ID, including lotus, survives. Other event/appearance fields are preserved. Preset content is a separate object; changing preset never chooses a theme. New-event preset selection is separate from editing the current preset.

Catalog metadata (IDs, preset, content, appearance) uses localStorage with sessionStorage fallback. Persist-before-update applies to catalog mutations, including theme changes. A stored-revision check rejects stale catalog edits from another tab; there is no multi-tab synchronization protocol. Corrupt catalogs fail closed and are not overwritten.

Runtime rosters/results and prize settings remain in per-event sessionStorage keys. The first `legacy-event` uses the original v2.4 keys and configuration validator, retaining compatible pending winners and title. New events have distinct runtime/price keys and the same approved rules/default amounts. Event switching is blocked while drawing or while recovery needs attention. It saves the current runtime before activating another event. Theme changes are allowed without calling draw transitions, changing audio flags or restarting timers.

A single CSS token layer controls all four screens; content fields render the title, occasion, kicker, brand label and completion copy independently. Decorative stage-card overflow uses `clip` to prevent internal focus scrolling from hiding the prize title. Audit exports include eventId, presetId and appearance; filenames derive from the current event rather than a fixed Teachers' Day date. No backend, external media or packages are added.

## Shared publication layer

Public settings are served as versioned JSON alongside the HTML. The controller separates published, local draft and explicitly imported offline sources. Anonymous GET is the sole network path. Schema validation and approved rule checks are shared verbatim by browser, CLI and CI; a 6-second abort prevents indefinite startup. Active configuration snapshots are validated and frozen before the first draw persistence, then restored with the original pending selection. Remote updates are deferred until session reset. Public metadata cache provides rollback detection only. Local catalogs remain separate from public settings. See [shared configuration contract](SHARED_CONFIGURATION.md) for failure handling, authenticated deployment and privacy boundaries.

## Firebase visual-only adapter

`cloud-theme-config.js`, `cloud-theme-sync.js` and `cloud-theme.css` are optional static assets. The adapter imports the official modular Firebase Web SDK and subscribes to exactly `sharedTheme/live`. It emits one theme-override event; the existing renderer reads a valid override before the event theme. No draw engine state is exposed to the adapter. The adapter writes only the three-field public schema after Auth and Admin role checks; deployed Firestore rules remain authoritative. Strict client validation prevents invalid remote fields/timestamps from changing presentation. See FIREBASE_SHARED_THEME.md for production/emulator evidence and credential boundaries.
