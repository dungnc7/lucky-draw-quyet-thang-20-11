# Firebase shared theme — Lucky Draw v2.6

## Provisioned backend (2026-11-21)

- Project: `lucky-draw-quyet-thang`, display name **Lucky Draw Quyet Thang** (Google Cloud rejected the accented project display name).
- Web app: `1:366531766878:web:b39dcf12a4ef3839b162cf`.
- Firestore: `(default)`, **STANDARD**, `asia-southeast1`, Native mode, realtime enabled, `freeTier: true` verified from the database API. No billing account was attached or paid feature enabled by this work.
- Firebase Authentication: Email/Password enabled. No public signup UI is added. A newly self-registered account is never an Admin by default.
- `firestore.rules` compiled and deployed successfully; deployed contents were retrieved and checked. The project-owner-confirmed Admin is assigned privately, never hardcoded in source.

GitHub Pages remains the frontend host. `cloud-theme-config.js` contains only public Web App identifiers. SDK 13.4.0 is loaded from the official `www.gstatic.com/firebasejs/13.4.0/` CDN. No password, refresh token, service account key, Admin email/UID allowlist, employee data or draw results belongs in Git. Password input is sent directly to Firebase Auth, cleared after login attempts, and not stored by application code. Firebase Auth uses tab-session persistence; signing in does not grant roles by itself.

## Data and authorization

The sole public document is `sharedTheme/live`:

```text
schemaVersion: 1
 themeId: one of the seven EventPlatform theme IDs
 updatedAt: Firestore server timestamp
```

Clients can get this exact document but cannot list the collection. Only authenticated UIDs with `admins/<uid>.enabled == true` may create/update it. Rules require the exact three fields, approved theme, schema 1 and `updatedAt == request.time`. Even Admin clients cannot delete it, write arbitrary documents, add fields or grant Admin membership. Users may read only their own membership document, never list all Admins. All other document paths are denied. Existing rules from PR #1 are preserved.

Only a trusted project owner using the Console or an authenticated management tool may provision/revoke `admins/<uid>`. Verify the UID belongs to this Firebase project and obtain owner authorization before granting it. Do not put Admin UIDs or credentials into repository configuration. Revocation is enforced on the next write by the deployed rules, even if an old tab still displays a previously confirmed role.

## Theme behavior

All seven themes remain available; `quyet-thang-corporate` (Sắc Màu Quyết Thắng) is the default. A server-confirmed theme overrides only CSS presentation across Admin, Stage, Reveal and Completed. It does not change event text, presets, prizes, amounts, countdown, pending winners or results. `config/published.json` continues to control public event settings; the Firestore theme is a separate visual override. The complete original draw/Excel/event/published-config modules are preserved.

Choose a theme in **GIAO DIỆN CHUNG CHO MỌI MÁY** to preview on the current page. An authenticated Admin must explicitly click **Áp dụng cho tất cả thiết bị** to publish. The payload has no event/session/employee fields. Other connected browsers receive `onSnapshot` updates. A received theme is not proof that every offline device has received it; status text reports only the local server-confirmed subscription.

Pending local snapshots do not acknowledge publication. Cache-only, invalid, unknown-schema or failed responses disable saving. Invalid remote extra fields or timestamps are refused before displaying the theme. If offline or the SDK cannot load, the original raffle remains available with its explicit configuration backup/local-draft workflow. Cloud preview is held only in memory; offline reload cannot guarantee the last cloud theme. There is no employee/winner synchronization and no offline cloud publishing.

## Deployment and validation

Use Node **24.12+** and Java **21+** for the latest Firebase development dependencies. The website itself requires neither Node nor Java. Before merging:

```sh
npm ci --ignore-scripts --no-audit --no-fund
python3 scripts/preflight.py
npm test
python3 -m unittest discover -s tests -p 'test_publication.py'
npx -y firebase-tools@latest emulators:exec --only firestore --project demo-lucky-theme-security 'npm run test:rules'
git diff --check
```

The demo project ID and rules-testing library keep automated security tests isolated from production. Never add production passwords or service keys to CI. The workflow validates the PR with read-only repository permission.

Authenticated backend maintenance, using existing local Firebase CLI authorization:

```sh
npx -y firebase-tools@latest deploy --only firestore:rules,auth --project lucky-draw-quyet-thang --non-interactive
```

The configured database is Standard to match this repository's document SDK and its verified free-tier deployment. Do not create another database/edition, link billing, add Storage/Functions or change existing data as a side effect. Stop for owner authorization if a billing upgrade is required. With the current Email/Password flow no OAuth popup or redirect is used; if a future provider is added, separately configure the exact authorized domains and review its permissions.

## Evidence and remaining gate

- 60 original regression tests plus one cloud-override active-session test pass (including 13 manual batches and 44 unique winners).
- 8 real-controller VM tests pass for preview/publish, default/all themes, authorization gating, offline failure and invalid snapshots.
- Static integration contract and Python publication tests pass.
- 12 Firestore Emulator tests pass: public exact read, no list/private read, unauthenticated/non-admin/disabled-role write denial, all seven Admin writes, self-promotion/batch escalation denied, schema/private-field/type/timestamp rejection, missing fields, deletion/path denial, revoked Admin denial, and two independent public SDK listeners receiving an Admin update.
- Production client probe: unauthenticated read succeeded; unauthenticated write, authenticated non-admin write and self-promotion returned `permission-denied`. The temporary synthetic non-admin account was deleted after testing; no password was logged or saved.
- Final release still requires an actual Admin sign-in/button write and observation on two browsers, followed by PR checks, merge, Pages deployment and anonymous public verification. Emulator/VM evidence alone does not establish those final steps.

Primary technical references: [rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [Firestore quickstart](https://firebase.google.com/docs/firestore/quickstart), [Web setup](https://firebase.google.com/docs/web/setup). Firebase Plugin's official MCP server was used for project/app provisioning, public SDK configuration, rules retrieval and user/role management. The CLI completed backend deployment after independent checks showed the MCP deploy job result alone was insufficient evidence.
