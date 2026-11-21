# Authentication QA — 2026-11-21

Candidate only. No production account/role/configuration/rules/site changes in this branch.

## Automated validation

- `npm test`: 91 tests passed plus static integration checks; guard, UI state/persistence/reset tests plus existing selection, Excel, themes, configuration and session regressions.
- `python3 scripts/preflight.py`: exact public source allowlist, privacy scan, archives and syntax.
- `python3 -m unittest discover -s tests -p 'test_publication.py'`: six immutable archive regressions.
- Node 24.12+, Java 21+, `npx firebase-tools@latest emulators:exec --only firestore,auth --project demo-lucky-theme-security 'npm run test:rules'`: 29 tests passed: real rules plus actual Auth SDK tests. Requires both emulator host variables and refuses non-demo Auth namespaces.
- `git diff --check` and compare unchanged JSZip/ExcelLocal/BatchEngine/EventPlatform modules to main.

Tests cover loading/no runtime before authorization; unknown/disabled account; role downgrade/revocation; validAfter auth_time cutoff; direct unauthorized gets/writes; self-promotion; invalid schema, bounds and allocation; concurrent Admin writes; dirty drafts; offline/reconnect; duplicate submission; both persistence choices before sign-in; neutral reset and errors; real Auth emulator sign-in/wrong password/reset email; UID-scoped private storage; stale callbacks after logout; private session restore without reselection; original 44/13/10 rules and Excel behavior.

## Browser verification

Used documented Playwright controls through the connected browser and separate local Auth/Firestore emulators, synthetic accounts and synthetic participants only. The repository's real Firebase config was not overridden; emulator injection exists only in an external preview directory.

Observed:

- A fresh unauthenticated tab showed corporate Login, with no Dashboard in the accessibility tree. Mobile 390×844 layout fit without horizontal overflow.
- Admin login and reload restored the role. Enter submitted; standard username/current-password autocomplete attributes remained; the user menu showed email and Admin.
- Admin published ocean theme as revision 2 and corporate as revision 3. A separately signed-in Operator received both revisions with fields disabled and no Save control.
- Operator imported synthetic demo participants, started a 10-second batch, received a theme update while the countdown continued, and revealed six winners with manual next-batch preparation.
- Logout presented the custom warning, locked Dashboard and kept the selected winners. An unapproved account got Access Denied. Returning as the same Operator restored the six committed winners; the separate Admin session remained empty.
- Remember Me unchecked survived reload but a new tab required login. Checked persistence restored the account in a new tab. Logging out returned to a clean Login and cleared account labels/email input.
- Revoking the synthetic Operator document immediately changed the open browser to Access Denied; restoring it required server verification before Dashboard returned.
- Password-reset UI returned a neutral confirmation; the Auth emulator recorded the supported reset request. No production email was sent.
- Browser console inspection showed no application errors. Screenshots remain outside Git and are supplied with the review response.

Not run: actual Chrome process restart, password-manager save/autofill behavior with a real profile, production login/save under final rules, physical speakers/projector, real employee imports, and browser file-picker/download repetitions. These are explicit approved-release checks; VM/SDK tests do not prove them. Legacy unscoped owner attribution requires supervised review before upgrading an active event laptop.
