# Lucky Draw Quyết Thắng v2.6 — release procedure

The owner requested the v2.6 upgrade of the existing application. See README.md and docs/ARCHITECTURE.md for the release behavior and docs/QA_V2_4.md for evidence and limits.

1. Inspect git status, history and current remote main. Preserve changes and GitHub Pages configuration.
2. Run `python3 scripts/preflight.py` and `node --test tests/test-v24.cjs`.
3. Inspect the staged file list; publish source, tests, documentation and strictly validated public event configuration only. No real roster, identifiers, results, downloaded exports, runtime snapshots or credentials.
4. Commit on main with a meaningful message; push without force.
5. Keep the repository PUBLIC and Pages configured to main / root. A private repository on the current account plan previously caused Pages to be removed (HTTP 422 when re-enabling).
6. Wait for the Pages workflow, require successful deployment for the pushed SHA.
7. Fetch the public website without authentication; require HTTP 200, v2.6 title, expected heading and a source hash matching the reviewed index.html.
8. Browser-smoke-test the deployed logo, updated theme and a 10-second batch using demo data only. Clear the demo after testing.
9. Report repository, Pages URL, full SHA, workflow status and remaining operational checks. Never claim a synthetic test proves physical projector/audio readiness.

For configuration releases, follow docs/SHARED_CONFIGURATION.md. Require Python publication tests, latest/archive consistency, anonymous JSON verification and preservation of active-session snapshots.
