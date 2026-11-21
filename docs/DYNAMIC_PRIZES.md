# Dynamic prize and handover upgrade — audit and design

Baseline: b3136ad (Authentication PR #3, not merged). This feature branch/PR is stacked on codex/auth-roles; both requested tasks stay in one new PR. No merge or deployment is authorized by this task.

## Audit before implementation

- Participant import already supports CSV/XLSX and identity-based de-duplication, but runtime minimum-participant labels and BatchEngine.canStart require 44.
- BatchEngine uses configuration ID v2.4-consolation-5x6, version-4 snapshots, five fixed tiers, 13 generated batches and a global 10,000ms duration. Its batch division assumes every count is divisible by batchSize.
- Runtime captures BATCHES, PRIZES, totalWinners and DRAW_MS once. Stage labels, restore checks, progress and detailed/audit exports depend on those constants. Some normal and completed surfaces still derive a total monetary budget.
- SharedConfiguration schema 1 validates immutable public JSON archives. EventSettings schema 2 adapts that fixed structure to sharedEvent/live and optimistic revision transactions. Rules validate exactly five fixed prize tuples. Old clients cannot safely write a new dynamic document.
- ExcelLocal.makeXlsx emits one minimal, unformatted sheet using inline-string cells (formula injection is already avoided by writing text rather than formulas). It needs a reusable multi-sheet formatted writer, while the existing detailed/audit exports must remain.
- Auth guards and UID-scoped storage from PR #3 must remain. Active sessions freeze their configuration; old unscoped records have no trustworthy owner and remain preserved for supervised recovery.

## Implemented compatibility design

- Keep the Teachers' Day values as editable defaults. Generate ceil(count/batchSize) batches, clipping the final batch to remaining slots. Per-tier duration and stable prize IDs are part of the frozen draw snapshot.
- sharedEvent/live remains the only shared authority. Introduce schema 3 for dynamic settings. Read schema 2 with explicit migration in memory; only an authorized CAS save writes schema 3, revision +1, without replacing existing content/theme/audio. Keep schema-1 archives unchanged.
- Upgrade engine snapshots to version 5 with their exact frozen draw configuration. Validate old fixed version-4 snapshots against their own configuration and preserve original records as local backups before first new-format persistence. Never reinterpret pending/committed winners using a new remote configuration.
- Draw order follows the editable list from top to bottom. Handover priority is the reverse configured order (the final/main prize first), then actual batch order. IDs do not change when cards move or names change.
- Validate practical safety bounds, rather than fixed event totals. Support up to 24 tiers, 5,000 slots/tier, 100 winners/batch, 1–300 whole seconds/batch, and up to 100,000 imported identities. These are resource/schema bounds, not 44/13/5 business rules. Both client and real emulator Rules verify the maximum tier count. These bounds can be revised in a future schema after resource testing.
- Export only committed, non-simulated records. Keep individual frozen amounts. No total money on normal UI or handover workbook. Participant data and all XLSX/results stay local.

## Implementation sequence

1. Dynamic model/schema and server validation.
2. Prize editor, generated schedule and frozen runtime/recovery.
3. Operational counters and removal of total-budget presentation.
4. Shared formatted Excel writer and committed-only two-sheet handover report.
5. Regression/security tests, synthetic workbook and visual verification, documentation and review PR.

Do not deploy incompatible rules before the client migration and release order have been reviewed and tested. Validation evidence and practical limitations follow below.


## Shared schema 3 and publication protocol

The root is `sharedEvent/live`: `{schemaVersion:3, revision, updatedAt, settings:{event,audio,draw:{rulesId,prizeIds,totalSlots,generation}}}`. The wire representation references an ordered list of stable IDs; clients assemble an expanded draw with `prizes` only after all matching blocks arrive and pass exact-key, revision, ordering, allocation and schema validation.

Each generation uses `sharedEvent/live/prizeVersions/<generation>/blocks/<0..5>` with `{schemaVersion:1,revision,createdAt,prizeIds,prizes,slots}`. Blocks contain up to four validated prizes. A separate immutable `metadata/event` document validates public event/audio fields before publication; the root must equal that validated header. Nothing in these documents accepts roster, results, CCCD, session data, credentials or arbitrary extra fields. Use generated IDs, never personal identifiers, in public configuration text.

1. Validate the local draft and freshly verify Admin authorization.
2. Stage the header and blocks with server timestamps, each as a separate acknowledged write. Creation requires the next current revision. Updates/deletes are denied. A 20-second acknowledgement deadline preserves the draft and avoids proceeding to publication after a stalled upload.
3. Run the existing root transaction. Compare the base revision and publish revision +1 with the generation pointer and server timestamp. Rules verify the header, matching block revisions/IDs and exact total slots. Concurrent drafts can stage independently; only one transaction wins a given base revision.
4. Read back from the server, assemble all referenced blocks, validate and then report Đã đồng bộ. Snapshot callbacks use a load ticket so an older asynchronous assembly cannot apply over a newer one. Operators can read only the currently referenced generation. Anonymous/unknown accounts cannot read configuration in this Authentication candidate.

Staging is **not** a second configuration authority. Unpublished/failed/conflicting uploads never change the live root. A disconnect can leave unused immutable staging documents; trusted maintenance tooling may clean those up after confirming they are unreferenced. No automatic client cleanup or new billing resource is introduced. Old published generation blocks must remain available during supervised recovery/release work.

This layout is required by [Firestore Rules limits](https://firebase.google.com/docs/firestore/quotas): 1,000 evaluated expressions and bounded document access calls. Even five inline full prize validators plus the event envelope exceeded the expression budget. A single multi-document write still shared the budget. Separately validated immutable blocks and a final root CAS passed maximum-tier testing. See also [rule evaluation behavior](https://firebase.google.com/docs/rules/rules-behavior).

## Local sessions, migration and operation

- Engine version 5 stores its complete validated `drawConfig`; schedules use `ceil(count/batchSize)` and clipped final batches. Stable IDs and configured order are frozen with counts, durations, names and individual amounts on first draw. A restore uses that snapshot rather than new Firebase settings.
- Active remote updates affect CSS theme only. Other settings wait for explicit reset; pending picks, deadlines and committed winners remain unchanged. Critical editor fields, add/delete and ordering are disabled while the local session is locked, with a second validation guard. Switching event presets warns if a session is active.
- Version-4 fixed sessions migrate only when their original ID/configuration is recognized. Pending and committed identities are validated against their own schedule. The original raw record is backed up locally before the application persists a version-5 snapshot; the local backup button remains. Unrecognized IDs fail closed with an export path. UID-less legacy sessions remain quarantined under the Authentication contract; never auto-assign them to a login.
- Read schema-2 settings by in-memory migration, preserving event content, logo, theme and audio; no automatic remote write. The first reviewed Admin save uses schema 3. Historical schema-1 JSON archives remain byte-identical and are migration/recovery inputs only.
- Limits: 1–24 tiers, 1–5,000 slots/tier, 1–100 people/batch, 1–300 integer seconds/batch, 0–100 billion VND per individual prize, maximum 100,000 slots/identities. No repeat winners. Start requires enough unique imported participants. Extreme maximum-size imports/100,000 rendered batches were not browser load-tested; 1,000 participants and representative allocations are verified.

## Handover workbook

The new AwardHandover model validates the snapshot, selects only committed non-simulated rounds and uses the session's frozen prize labels/amounts. The final configured tier has highest handover priority; actual batch order is retained within each tier. Pending picks and demo results are excluded. The report is completed once all real configured winner slots are committed, even before the optional final manual transition to COMPLETED.

`DANH SÁCH TRAO THƯỞNG` has the ten requested columns, Chưa trao status, blank signature/notes, text employee codes and numeric individual VND amounts. `TỔNG HỢP GIẢI THƯỞNG` shows event name/date, ISO export timestamp, temporary/completed status, planned/confirmed/remaining counts and individual amounts. There are no monetary aggregates. A partial export remains possible while a later batch is drawing, using earlier committed winners only.

Filenames use accent-free event name, **UTC export date** (`YYYY-MM-DD`) and Tam_Thoi/Hoan_Tat. Event date remains separately shown in the workbook. The reusable JSZip writer adds formatted multiple sheets without a runtime dependency, blue headers, alternating rows, editable status cells, signature space, freeze/filter, A4 landscape, fit-to-width and repeating table headers. All employee-controlled strings are OOXML inline text; formulas/external links are never inferred. Employee codes also use the text number format. Auth/UID is checked before starting export and rechecked before download. Detailed Excel/audit exports remain separate and retain their existing privacy notice.

## Verification evidence — 2026-11-21

Commands (Node 24.12.0 for Firebase/emulator execution):

```sh
python3 scripts/preflight.py
npm test
python3 -m unittest discover -s tests -p 'test_publication.py'
# With local Firestore 8088 and Auth 9098 already running:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9098 npm run test:rules
git diff --check
```

- Application: 117 tests; original default 44/13/130s plus 50/100/500/1,000 participants, 10/30/44/80/100 slots, 1/3/7/24 tiers, remainder 13÷5 → 5/5/3, duplicate prevention, bad bounds, exact pending/deadline recovery, legacy-v4 migration, active remote updates, UID/auth regression and integrated dynamic runtime/report export.
- Rules/Auth emulator: 30 tests, including unauthorized reads/writes, role revocation/cutoff, invalid nested/private fields, malformed staged prizes, immutable blocks, incomplete/mismatched generation rejection, CAS collision, two subscriptions, offline/reconnect, all presets, maximum 24 tiers and server timestamps. Additional maximum-schema design runs accepted 1/5/8/16/24 tiers.
- Python archive/publication regression: 6 tests. Historical JSON archive validation stays intact.
- Browser, two isolated origins: synthetic Admin and Operator; schema-2 load; edit counts/batch/duration; add/delete a tier; save and server-confirm schema 3; read-only Operator receives same revision. Imported a fictional 50-person CSV, manually ran a 1-second five-winner batch, downloaded a five-row temporary workbook, then changed Admin count/theme. Operator adopted the theme/revision but kept its 27-slot frozen session and exact five committed IDs; reload preserved them. No console errors observed. Browser CSV path and workbook downloads stayed local.
- Actual app-generated two-sheet synthetic XLSX was imported/recalculated/rendered with the spreadsheet artifact tool; both sheets visually reviewed. XML tests verify numeric currency, text/leading-zero identities, no formula cells, headers, freezes, filters and print settings. The artifact importer normalizes numeric-looking text in its rendered preview; the original XLSX inline text and leading zeros were independently verified in XML and browser output. Native Microsoft Excel printing/editing and maximum-size workbook performance have not been manually tested.

Screenshots and the fictional XLSX are delivered separately in the review chat, outside the repository per AGENTS privacy/artifact policy. No real participant data, credentials, outputs or screenshots are committed. The new Rules are a tested prototype for careful review; these tests do not prove exhaustive security for a large audience.

## Release readiness and remaining gates

Candidate for review only. PR #3 (Authentication) is still open; this PR is stacked on that branch so its diff contains only the two new requested features. No production rules, accounts, roles or Firebase data were changed. Pages/main remain unchanged.

Before an approved release: review both PRs and Rules; archive any active legacy/unowned sessions with their owner; coordinate a maintenance window for compatible client/Rules cutover; reload old tabs so schema-2 writers cannot resume; then explicitly Admin-save the migrated configuration and verify two authorized production devices and the public endpoint. Do not deploy Rules alone to old clients. Rollback must preserve local winner snapshots and the last confirmed remote generation; never rewrite winners to fit a different schedule. Native Excel/A4 print approval remains an organizer review item.
