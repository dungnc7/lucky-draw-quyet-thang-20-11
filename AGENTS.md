# Lucky Draw Quyết Thắng — engineering rules

## Current owner request
Implement v2.6 from approved v2.4 baseline 696a734. On 2026-11-18 the owner explicitly authorized extending v2.4 and creating a first registry of seven themes because no v2.6 source/registry existed. Preserve the draw engine, importer/writer, original logo, prize amounts and audio code.

## Theme and event contract
- Default `appearance.themeId`: `quyet-thang-corporate` (Sắc Màu Quyết Thắng), blue #2E7BC3 / red #F2363F / navy #0D1B3D.
- Three presets: teachers-day, year-end, custom. Content and appearance remain independent.
- Registry IDs: quyet-thang-corporate, lotus, midnight-gold, emerald, royal-purple, ocean, crimson. All remain selectable; valid saved choices must never be replaced by the default.
- Persist content/theme metadata separately from per-event tab-local runtime/rosters/results. New-event creation must not edit an existing event.
- Corporate styling covers Admin, Stage, Winner Reveal and Completed. No Teachers' Day text in Year End Party event output.

## Release contract
- Repository: `dungnc7/lucky-draw-quyet-thang-20-11`, PUBLIC. Pages: `main`, `/(root)`.
- Exactly 13 manually triggered batches, 10,000 ms each, 44 unique winners: 5×6 encouragement, 2×4 fourth, 3×1 third, 2×1 second, 1×1 first.
- Cryptographic rejection sampling; persist before draw/reveal/progression. Never reselect a pending batch after refresh. Fail closed if persistence is unavailable.
- Lock prize amounts from the first started draw. Snapshot selected monetary value in results and audit exports.
- Winner cards show only employee code and name; never CCCD or department. CCCD-only imports receive a local row reference for presentation.
- Validate the configuration identifier on every restore; back up older incompatible v2.4 sessions locally before reset. Keep old v2.3 sessions separate. Offer a local backup; never silently reinterpret old outcomes as v2.4 batches.
- Never commit real participant data, CCCD, results, runtime storage, Excel/CSV files, credentials or downloaded test exports. Test with synthetic data only; keep fixtures and screenshots outside the repository.
- Do not force push or replace unrelated history/configuration. Do not assume private repositories can host Pages on the current plan.
- Before committing: run `python3 scripts/preflight.py` and `node --test tests/test-v24.cjs`; perform browser smoke testing when available.
- Verify the actual public endpoint and deployment status before claiming a release is live. Document what was tested and any manual validation still required.

## Shared configuration contract
- Versioned public JSON is distinct from local drafts and private sessionStorage. Follow docs/SHARED_CONFIGURATION.md.
- Publish through authenticated CLI/Actions; no client secrets, no private runtime data in JSON or workflow inputs. Review all public prose for sensitive content.
- Strict schema/client/rules validation, monotonic revisions, explicit offline backup and immutable active snapshots must fail safely. Never apply remote settings to a locked session.
- Run Python publication tests in addition to preflight and all Node tests. Never rewrite existing config/versions files; new content needs a new revision.
