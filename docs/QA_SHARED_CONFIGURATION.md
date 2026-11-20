# Shared configuration QA — 2026-11-20

Baseline: `6768b0b850860c948121efa644aeb1110431fac7`. Synthetic participants only. Browser checks below were performed against localhost before release; deployment is verified separately after pushing.

## Automated validation

- `node --test tests/test-v24.cjs`: 60 passing tests, comprising the existing 36 regressions and 24 shared-configuration tests. Coverage includes first online load, two independent device fixtures, latest published update on reopening/refresh, local draft preservation, explicit offline import/restore, unavailable/invalid/oversized/incompatible responses, rollback and same-version tampering, late-response race, private/unknown field rejection, authenticated publication preparation and frozen active-session restore/reset. Existing tests cover exactly 44 unique winners in 13 manually started batches, Excel output, music controls and persistence failures.
- `python3 -m unittest discover -s tests -p 'test_publication.py'`: 6 passing tests for dry-run, archive creation, stale drafts, private/unknown keys, schema/rule mismatch and refusal to overwrite a version.
- Preflight checks public-source allowlist, credential/identifier scan, embedded assets, six inline JS syntax checks, approved rules and contiguous version history with matching latest archive.

Node fixtures use a fake DOM, clock, storage and audio context; they do not establish browser rendering or physical audio/projector readiness. Device fixtures prove deterministic loading of the same settings, not network synchronization of people/results. Live rosters/results are never sent to the shared source.

## Operational limits

GitHub Pages/CDN propagation is eventual; an old open tab needs refresh/check latest. The latest JSON and UI revision must be verified after deployment. Offline use requires downloaded HTML and explicitly imported compatible public backup. Local storage can be cleared by browser policies. GitHub permissions control publishing; public Admin/local draw controls have no authentication. Physical speakers, fullscreen/projector and real event laptop checks remain the operator's responsibility. No real employee list or real draw was used for QA.

## Browser verification

Two independent browser tabs loaded the same HTTP source. The first used v1/corporate/200,000 VND encouragement. A temporary, unpublished localhost-only v2 changed theme to ocean and amount to 250,000 VND. A new tab received v2 with no employees/results, while the started v1 demo session showed “Đã công bố: v2” and “Đang dùng: v1 · Đã khóa cho phiên quay”, kept corporate/200,000 VND and preserved its six selected demo winners after reload. No next batch started automatically. The temporary config was restored to the reviewed v1/archive before release.

A local draft switched to lotus; reload selected the corporate publication, and explicitly reopening the draft restored lotus. Public controls were read-only; JSON preview contained only allowlisted public settings. Original logos rendered on Admin/Stage/Reveal. The active-session notice was captured outside Git in `lucky-shared-active-protection.jpg`.

The browser tool's file-chooser flow stalled/expired; native JSON import/download was not verified end-to-end in that browser. The real controller import/preview/apply and offline reload paths are exercised by automated tests. Operators should try “Tải bản sao cấu hình” → “Nhập bản nháp / bản sao JSON” before the event. No real participant data was used or published.
