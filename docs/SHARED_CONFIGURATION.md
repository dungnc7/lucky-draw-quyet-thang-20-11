# Shared event configuration — v2.6

## Sources and startup

Online startup fetches `config/published.json` using anonymous GET, `cache: no-store`, a cache-busting query and a six-second timeout. The JSON contains a schema/client compatibility ID, monotonic publication revision, base revision and UTC publication timestamp. Immutable copies live at `config/versions/vNNNNNN.json`. Admin displays the latest verified publication, timestamp, current source and frozen session version.

All devices opening the same deployed website use this public source. An open idle page changes only when the operator presses **Kiểm tra bản công bố mới** or reloads; there is no background polling. Deployment propagation may take time: verify the actual public JSON, not merely a successful push.

**Bản nháp trên máy** is explicitly local. Use **Dùng bản nháp trên máy** to edit a saved event, theme, public text, prize amounts, background and audio preferences. Existing drafts remain in the event catalog and are not overwritten by online startup. The public event is read-only. Returning online/reopening selects published settings unless restoring an active session. Draft changes never become public just because they were saved or previewed.

## Public allowlist

The exact schema permits only event ID/preset, six public content fields, selected theme, builtin original Quyết Thắng logo, theme or solid-color background, approved prize allocation/amounts/duration, and builtin music/countdown preferences. New drafts default to `quyet-thang-corporate`; all seven registered themes remain available. Preset content is independent of theme.

This first schema intentionally supports the embedded original logo and synthesized music, with no arbitrary media URLs or custom uploaded media. Local audio files remain local and are not part of a backup. Allocation and duration must match the approved 44 winners / 13 manually triggered 10-second batches; monetary amounts may vary before a session starts.

Unknown keys are rejected rather than silently stripped. Files above 32 KiB, unsupported schema/client/rules, invalid media references, rollback revisions, same revision with different contents, credential patterns and literal 12-digit identifiers are refused. Text is rendered as text, never HTML. This is a structural protection, not a reliable detector of human names or confidential prose: the authenticated publisher must review every public text field before submission. Never insert employee names, CCCD, participant arrays, results, sessions, private file paths or secrets. Published history is public and persists in Git even after later edits.

## Export, import and preview

- **Xem trước cấu hình** displays the exact public configuration as a read-only preview. It does not publish.
- **Tải bản sao cấu hình** downloads the current public-only JSON. For offline operation explicitly download the published backup while online and save `index.html` locally too.
- **Nhập bản nháp / bản sao JSON** validates and previews the selected JSON first. The operator must choose **Dùng bản sao cấu hình** for a published backup, or import a draft as a new local event. Import does not overwrite another draft or publish anything.
- A backup imported explicitly is labelled **Bản sao cấu hình offline**. It is not silently replaced by a subsequent remote response. Choose the published source deliberately to return online.

Without a validated online configuration or an explicitly imported compatible backup, published mode blocks a new draw and explains the error. The advisory last-seen cache detects rollback; it is never silently used as an offline backup. Opening a downloaded HTML file requires importing the backup, or explicitly choosing a local draft. There is no service worker: an uncached website cannot be opened offline without the downloaded HTML. To carry a backup to another device, copy only these public files; no roster/results are transferred.

## Secure publication

The browser contains no GitHub credentials and cannot publish. Repository writers authenticate with GitHub CLI outside the website. From an up-to-date checkout:

```sh
git pull --ff-only
# In Admin, check latest, edit a local draft and export “Xuất yêu cầu xuất bản”.
python3 scripts/publish_config.py --input /path/to/event-publication-draft.json --dry-run
# Review the complete public output, including every text field.
python3 scripts/publish_config.py --input /path/to/event-publication-draft.json --dispatch
```

`--dry-run` validates and prints the next publication without changing files or contacting GitHub. `--dispatch` validates before sending data, checks repository write permission, then requests the **Publish event configuration** workflow. CLI authorization stays in the local credential store; Actions uses its scoped ephemeral `GITHUB_TOKEN`, never a token embedded in JSON or HTML. Workflow input is bounded data, decoded without eval or shell interpolation.

The workflow checks out fresh `main`, rejects stale `baseRevision`, serializes publishers, creates the next immutable version, validates source/configuration/tests, commits only the public configuration paths and pushes without force. It explicitly requests a Pages build because a push made with `GITHUB_TOKEN` does not trigger normal workflow chaining. A concurrent change to main causes push rejection; pull latest and export a new proposal rather than forcing.

`--apply` is a maintenance/CI step that writes reviewed files in the current checkout; it neither pushes nor proves deployment. Normally use `--dispatch`. Treat a dispatched/successful workflow as preparation until the matching Pages build succeeds and anonymous GET returns the expected latest JSON and HTML. Confirm version/time in Admin on another device. To revert content, publish a new increasing revision with the desired settings; never lower the revision or edit an archived version.

## Active sessions and privacy

Before the first countdown, persistence writes a complete validated public configuration snapshot with the existing tab-local runtime. Every later transition uses that frozen snapshot. Incoming revisions are recorded as available, but never change an active session's theme/content, prize amounts, allocation, duration or pending selection. Refresh restores the same snapshot, pending winners and deadline. Invalid/missing/mismatched saved data fails closed. Finish/export/reset the current session before applying a newer publication. Starting another batch always requires manual preparation and a separate start click.

The configuration endpoint contains no roster or winners. Rosters, pending winners, completed results and runtime snapshots remain in the browser's `sessionStorage`; no POST, beacon, WebSocket or backend is introduced. Two devices with identical settings still run independent draws. This feature is not live-session synchronization, access control for the public Admin, tamper-proof auditing, or a secure employee database. Publishing is controlled by GitHub write permissions; local preview/drawing remains available to anyone opening the public app.
