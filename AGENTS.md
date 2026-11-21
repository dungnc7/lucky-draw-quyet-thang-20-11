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
- Follow docs/SIMPLIFIED_SETTINGS.md. sharedEvent/live schema 2 is the authoritative public configuration after explicit first Admin Save. Existing JSON archives and sharedTheme are migration inputs only before cutover.
- One Cài đặt chương trình UI with four groups and one Save. Remove obsolete publication controls/workflow; retain legacy snapshot readers for private recovery only.
- Prize names/amounts are editable; approved allocation and 10-second duration are fixed. Never upload roster, CCCD, winners, runtime or credentials.
- Admin-only transaction writes, exact monotonic revision, server timestamp and confirmation. Preserve dirty drafts on remote edits, fail safely offline/unsupported schemas, freeze active sessions except CSS theme.
- Keep all seven themes and default corporate; event content remains independent.
- Run npm test, Python legacy archive tests, preflight, real Firestore emulator tests with Node 24.12+/Java 21+, browser smoke and two independent clients.
- This request requires PR + screenshots for owner review BEFORE merge/deploy. Do not deploy production rules, create sharedEvent/live, merge or deploy Pages as part of the implementation task.

## Authentication upgrade contract
- Follow docs/AUTH_ACCESS.md and docs/QA_AUTH.md. Existing Firebase project only; no production resource/account/role changes or billing changes for this implementation task.
- Mandatory server-verified Admin/Operator access; authRoot first, no Dashboard runtime restore before authorization. No public signup or client role editor.
- Keep admins/<uid>; operators/<uid> is trusted-channel provisioned. Protect sharedEvent and legacy sharedTheme reads; Admin-only validated CAS writes. validAfter must invalidate auth_time at/before the cutoff.
- Firebase owns local/session persistence and reset emails. Never manually serialize passwords or tokens. Preserve SDK-restored remembered sessions until a new login explicitly chooses persistence.
- UID-scope local drafts/catalog and private tab-local draw data. Logout/revocation clears rendered/in-memory private state, stops listeners/audio, preserves snapshots. Never auto-assign unowned legacy sessions to the first login.
- Feature branch, tests, screenshots and PR review only. This task does not authorize merging or deploying the Authentication upgrade. A later approved release must resolve active legacy sessions and coordinate final rules/client cutover.
