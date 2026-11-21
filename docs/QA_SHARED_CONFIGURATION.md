# Simplified settings verification - 2026-11-21

Status: verified locally as a review candidate. Production rules, documents, Pages and main remain unchanged.

- `npm test`: 75 tests pass plus the shared-settings static integration contract. Includes original Excel/winner selection tests, model migration, server confirmation, draft conflicts and active-session protection.
- `python3 -m unittest discover -s tests -p 'test_publication.py'`: 6 legacy immutable-archive tests pass.
- `python3 scripts/preflight.py`: pass (privacy/source allowlist, archives, 7 inline syntax checks).
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 node --test tests/firestore-rules.cjs tests/settings-firestore.cjs`: 23 pass using Node 24.12.0 and local Firestore Emulator. Unauthorized writes, stale revisions, role escalation/revocation, malformed/private fields, missing nested keys, altered allocation, invalid dates and legacy writes after cutover are rejected. Independent subscribers and offline cache/reconnect pass.
- `git diff --check`: pass.
- Compared first four inline modules to baseline: JSZip, ExcelLocal, BatchEngine and EventPlatform are byte-identical.

Browser smoke used a separate preview directory and demo-only Auth/Firestore emulators. A synthetic Admin edited event name and theme, previewed locally, saved revisions 2-4 and reloaded revision 3 successfully. A second initially unauthenticated browser tab received the title/theme change with Save disabled. After synthetic Admin login in that tab, an unsaved title survived a concurrent saved update: revision advanced, conflict notice appeared and Save was disabled. Browser console had no errors. Screenshots remain outside Git and are supplied in the review conversation.

No production Firebase save, real employee import, physical speaker/projector test, merge, Pages deployment or public-site validation for this new feature was performed. Those require the later approved release procedure. Automated Excel tests use synthetic data; browser file-picker/download tests were not repeated.
