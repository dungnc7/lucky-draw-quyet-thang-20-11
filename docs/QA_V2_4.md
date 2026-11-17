# v2.4 validation — 2026-11-17

## Baseline and automated checks

The remote main baseline is v2.3 `56758e5b2ba66f7517611b0d81280608a3bd709e`. Repository history and Pages main/root configuration are preserved. There were no pre-existing unit/browser test suites; v2.3 provided a static Python preflight only.

Commands:

- `python3 scripts/preflight.py`: public-source allowlist, static privacy/credential/resource checks and syntax for four bundled scripts.
- `node --test tests/test-v24.cjs`: 16 automated tests for engine, controller integration, local CSV, drag/drop binding, OOXML export, price/budget locking, audio scheduling/control, recovery/corruption/storage failures and CCCD-safe cards.
- `git diff --check`: whitespace check.

The Node test harness uses a fake DOM/audio/clock explicitly. It executes all 14 batches from the actual bundled code, verifies 44 unique identifiers and 30/8/3/2/1 allocations, checks 9,999 ms does not finish and 10,000 ms does, rejects repeated clicks/completion, restores identical pending winners and recorded amounts, and tests invalid snapshots/out-of-roster/duplicate winners. This is independent from the real browser checks below.

## Real browser smoke tests (local candidate)

Host: localhost static Python server. Browser: Codex in-app Chromium, using UI interactions and synthetic participants only. No real roster or CCCD used.

- Import of a real generated XLSX: 60 valid rows, one duplicate and one invalid code correctly excluded. The fixture is outside the repository.
- Changed encouragement amount from 200,000 to 300,000 VND by keyboard. Budget became 23,000,000 VND. Controls were disabled from the first start and remained locked after reload.
- Ran all 14 batches using the actual 10-second timer, clicking prepare and start explicitly for every batch. Observed counts: 5,5,5,5,5,5,4,4,1,1,1,1,1,1. Total: 44 people, 44 distinct codes. No auto-start occurred.
- Browser-downloaded JSON contained 14 rounds and 44 unique codes. Start-to-reveal durations were 10.015, 10.004, 10.001, 10.002, 10.002, 10.003, 10.002, 10.001, 10.002, 10.001, 10.002, 10.002, 10.001, 10.002 seconds. These are measured scheduling delays after a configured 10,000 ms deadline, not a hard real-time guarantee.
- Browser-downloaded Excel is an actual OOXML ZIP: one header plus 44 winner rows, batch columns and selected amounts. Audit JSON amounts/counts/allocation matched. Both downloads are outside the source repo and were not published.
- Refresh restored the revealed batch and its same winners. An attempted refresh during the countdown was delayed by the browser's unload protection; mid-draw state restoration is verified by automated tests, not claimed as independently observed in this host.
- Checked centered 5-, 4- and 1-card reveals, gold first-prize treatment and code/name-only card markup. No department or CCCD in winner cards.
- Layout reviewed at 1440×900, 1920×1080, 1366×768 and 390×844. The compact 1366×768 stage fits (draw button bottom about 625 px; card bottom about 646 px). Mobile has no horizontal overflow.
- Completed stage hides budget, draw button, result section and counter; retains the congratulatory message.
- Music and countdown toggle independently in the browser. Web Audio scheduling/voice cancellation is covered by mocked audio tests. Physical speaker quality/volume is not certified.
- Browser console captured no errors/warnings during tested application flows.

Local screenshot references (outside Git/source): Admin, Stage, five/four/single reveal, grand prize and completed views. Screenshots show synthetic participants only and are delivered separately in the task report.

## Constraints / event-machine checks

- Direct `file://` browser smoke test was blocked by the tool's URL policy (only HTTP/HTTPS supported). No workaround attempted. The HTML is self-contained, has no external resource/network calls, and the logic runs without a backend; the owner should open the saved file on the event laptop to verify native file-origin storage/Web Crypto/audio behavior.
- Native fullscreen API was not granted by the embedded browser. Presentation layout works; verify fullscreen in Chrome/Edge on the event laptop or use browser fullscreen.
- Actual projector/LED, physical speaker playback, custom music permissions and final event roster should be checked by the operator. Automated tests do not establish those hardware results.
- sessionStorage is per tab and can disappear when a tab closes; separate devices are independent. Export results locally. No centralized synchronization or signed/tamper-proof audit is provided.
- An old v2.3 session is blocked for automatic migration and can be backed up as local JSON before the operator resets it.

## Production verification

The release procedure requires a successful Pages workflow for the pushed v2.4 SHA, anonymous HTTP 200 with byte-identical index.html, and a deployed browser demo-batch smoke test. Record final deployment results in the delivery report; do not equate a local pass with production success.
