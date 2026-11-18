> Historical validation of the v2.4 configuration. Current release evidence is in QA_V2_6.md.

# v2.4 final batch configuration — validation

Baseline: `73d6d60d5728c7bb77c43cb9c4bb9f4cdd23adc7`. This scoped update changes consolation only to 5 batches × 6 people. Other prize counts, amounts, 10-second countdown, audio, Excel importer/writer and ceremony theme are preserved.

## Automated checks

- `python3 scripts/preflight.py`: source allowlist, privacy/resource checks, final configuration and four bundled scripts' syntax.
- `node --test tests/test-v24.cjs`: 18 tests; expected counts are 6,6,6,6,6,4,4,1,1,1,1,1,1, totaling 44 distinct people and 13 × 10,000 ms = 130,000 ms.
- `git diff --check`: no whitespace errors.

The suite executes every batch with the real bundled engine/controller and explicitly fake DOM/clock/audio/storage. It verifies allocations, no duplicates, 9,999/10,000 ms boundaries, manual prepare/start, repeated-click protection, budget editing/locking, per-winner batch/amount export metadata, CSV/drag-drop binding, OOXML output, audio independence and storage failures.

New checks require the exact “Chuẩn bị quay Giải tư” label after consolation batch 5/5. They restore every pending/revealed/ready state through all 13 batch boundaries without reselection. Current snapshots require configId `v2.4-consolation-5x6`; older configuration snapshots are preserved and blocked with a local backup button instead of being silently migrated.

## Browser checks

Synthetic demo participants only; no real roster, CCCD or runtime output is included in Git.

- Consolation progress 1/5 through 5/5; six code/name-only winner cards per batch.
- Six cards form a centered 3-column × 2-row grid at 1920×1080 and 1366×768; at 1366×768 the prepare button bottom is 748 px, within the viewport.
- After consolation 5/5, “Chuẩn bị quay Giải tư” prepares the fourth prize without automatically starting it.
- Ran all 13 batches with the actual browser timer and explicit prepare/start clicks: counts 6,6,6,6,6,4,4,1,1,1,1,1,1; 44 people and 44 unique codes. Downloaded JSON and XLSX were validated: 13 rounds, consolation batch numbers 1–5 with six winners each, and final global batch number 13. Exports remain outside Git.
- Console captured no application errors/warnings during the complete-event smoke test; deployment must separately require Pages success and anonymous HTTP 200 matching the reviewed HTML.

## Operational limits

The host blocks file:// tests and does not grant native fullscreen; verify the standalone HTML, physical speakers and fullscreen on the event laptop. Each tab/device is independent; sessionStorage can disappear when a tab closes. Back up an incompatible existing session locally before explicitly resetting. No real-time scheduling or tamper-proof auditing is claimed.
