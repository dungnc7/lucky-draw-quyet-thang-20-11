# v2.6 validation — 2026-11-18

## Scope

Owner-authorized extension of v2.4 baseline 696a734: first seven-theme registry, three event presets and per-event theme persistence. Corporate default is quyet-thang-corporate (#2E7BC3 / #F2363F / #0D1B3D). The first three inline scripts (JSZip, ExcelLocal, BatchEngine), audio functions and all logo payloads compare byte-for-byte equal to baseline.

## Automated validation

Commands: `python3 scripts/preflight.py`; `node --test tests/test-v24.cjs`; `git diff --check`.

36 Node tests cover the existing 18 draw/import/export/audio/recovery scenarios plus 18 event/theme cases. They execute the real bundled modules/controller with explicitly mocked DOM, audio, storage and clock. All 13 batches still produce 44 unique winners with unchanged counts and 10,000 ms deadlines. New tests cover default corporate for all presets; exact seven registry IDs and branding; missing/invalid fallback; every valid theme including lotus saved/reloaded; appearance/content independence; no cross-event metadata mutation; default-vs-selected label; persistence with no imported people; theme changes during drawing without changing pending winners/deadline/prizes/audio; separate event runtime/prices; Year End Party content through completion; storage rollback, corrupt catalog, stale catalog protection; separate new-event preset selection; compatible v2.4 pending/title migration; and unchanged Excel/completed records after theme switches during reveal.

## Browser validation

Localhost candidate in the in-app Chromium browser; only synthetic demo participants.

- Selected each of seven themes through the UI, reloaded, and observed the same selected ID after each reload.
- Created all three presets through the new-event picker; each started corporate. Choosing a new-event preset did not modify the currently open title.
- An existing Year End Party event with saved lotus restored lotus; its Stage copy and occasion contained no Teachers' Day text.
- Corporate computed tokens matched #2E7BC3, #F2363F and #0D1B3D, and the original logo decoded and displayed.
- Ran all 13 real-timer batches in a Year End Party event. Counts: 6,6,6,6,6,4,4,1,1,1,1,1,1. Total 44 people and 44 distinct codes. Each next batch required prepare and start.
- Reveal occasion remained YEAR END PARTY • 2026. Completed title/message were event-specific and corporate, with no Teachers' Day copy.
- Fixed a discovered internal stage-card scrolling issue by clipping decorative overflow; after the fix scrollTop was 0 and the prize title was inside the visible card.
- Corporate Admin, Stage, Winner Reveal, Completed and selector screenshots are stored outside Git and delivered with the release. Screenshots show synthetic data only.

The browser connector became unavailable/expired while waiting for final Excel download events. Do not claim that final browser download was independently validated. OOXML export is covered by automated tests, and the writer/importer is byte-identical to the approved baseline; the full event itself was observed through completion.

## Limits and production gate

Physical speakers/projector, native fullscreen and direct file-origin operation require event-laptop checks; this embedded browser previously did not support the file:// workflow. Metadata is browser-local and runtime remains tab-local; there is no central sync or signed audit. Same-device concurrent catalog modifications are rejected, not merged. Valid existing theme selections must not be reset as part of deployment. Production requires Pages workflow success for the pushed SHA, anonymous HTTP 200 with the reviewed HTML hash and a deployed UI smoke check.
