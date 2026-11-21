> Dynamic upgrade: [DYNAMIC_PRIZES.md](DYNAMIC_PRIZES.md) supersedes the fixed prize/schema-2 portions below. Admin edits quantities, batch sizes, durations and order before starting a session. schema 3 publishes immutable staged prize blocks through one CAS root pointer. Authentication PR #3 still requires login for reads.

> Authentication upgrade candidate: [AUTH_ACCESS.md](AUTH_ACCESS.md). Mandatory server-verified login and protected Firestore reads supersede the former public-viewer/offline-cache behavior below. Release requires owner approval and the coordinated maintenance sequence. Production is unchanged by this branch.

# Cài đặt chương trình — candidate for review

This branch is a review candidate. No production rules deployment, shared-document creation, Pages deployment or merge is part of this change. Emulator verification is not evidence that production is live.

## Admin experience

One section contains Thông tin, Giao diện, Giải thưởng and Âm thanh. Authenticated, authorized Admins edit a local public-settings draft and see the stage preview, then select **Lưu & áp dụng cho tất cả thiết bị**. Viewers read without signing in. The status changes to Đã đồng bộ only after a server-confirmed revision. The other states are Có thay đổi chưa lưu, Đang lưu... and Không thể lưu — kiểm tra kết nối.

The owner approved editing prize names and amounts only. Quantities, batch sizes and durations are read-only: 5×6 + 2×4 + 3×1 + 2×1 + 1×1 = 44 unique winners, 13 manually started batches, 10 seconds each. Seven themes remain; corporate is the default. Preset content does not control the theme. The background supports theme or solid color. Logo supports the embedded original or an already-public HTTPS URL without query strings or fragments; this is not a file-upload service. Music selection is the existing built-in soundtrack; a locally selected music file stays on that device and is never uploaded.

Old JSON configuration controls, source switches, publication requests, refresh actions and GitHub instructions are hidden. The GitHub configuration-publication Action is removed and CLI dispatch is refused. Excel participant import, result Excel export and audit remain. Hidden legacy DOM hooks and schema-1 snapshot readers remain only for recovery compatibility; the new controller never starts the competing JSON publication controller.

## Authoritative data and validation

`sharedEvent/live` is the sole authority after creation:

```
{ schemaVersion: 2, revision: integer, updatedAt: serverTimestamp,
  settings: { event: { id, presetId, content, appearance, details },
              draw: { rulesId, durationMs, prizes }, audio: { ... } } }
```

The EventSettings model and Firestore rules constrain exact public fields, types, lengths, calendar dates, theme/preset IDs, fixed allocation and audio preferences. Unknown fields and unsupported schemas fail closed. Rules reject obvious identifier/credential patterns; administrators must still review prose and public image destinations. Automated pattern checks cannot identify every kind of personal information.

No roster, CCCD, result, pending winner, session state, credential, token or Admin UID is included in the configuration. Private `admins/<uid>.enabled` membership remains provisioned outside client code. Public document get is allowed; collection listing and arbitrary paths are denied. Membership changes and configuration deletes are denied to all browser clients.

Save checks current Firebase Authentication and fresh server-side Admin membership, validates the public draft, then uses a transaction comparing the exact base revision. Revisions increase by one and updatedAt must equal request.time. Server read confirms persistence. A stale Admin gets a conflict rather than a silent overwrite. When another revision arrives with an unsaved draft, the form and preview are preserved; Save is blocked until the Admin explicitly discards changes to accept the latest version. Invalid or regressing revisions are not applied.

## Reviewed migration and release order

1. Review this PR, screenshots, CI and emulator results. Do not merge or deploy before owner review.
2. After release approval, deploy the reviewed rules to the existing `lucky-draw-quyet-thang` project using authenticated tooling, without credentials in Git. Before a sharedEvent document exists, the existing production client can still write its strictly validated sharedTheme document.
3. Deploy the approved site and verify a public unauthenticated read. When sharedEvent is absent, the new client reads the existing immutable JSON publication and valid sharedTheme/live as migration inputs. Existing content, prize amounts, theme and audio settings are retained. Nothing is automatically written.
4. An authorized Admin previews these settings and performs the first Save. Its transaction rechecks the legacy theme to avoid overwriting a concurrent old-client edit, then creates revision 1. Once the new document exists, rules atomically reject writes through the old sharedTheme route. New clients unsubscribe from legacy theme updates and ignore JSON as an authority.
5. Verify real Admin Save, two independent clients, public read, denied unauthorized writes and the public Pages endpoint. Only then report the feature live.

Keep config/published.json and config/versions byte-for-byte as migration archives. Do not restart JSON publication. Recovery from an unwanted edit is a reviewed forward revision through the same transaction path. Do not delete sharedEvent/live or roll back to a client that writes sharedTheme; that would split authorities. Rules must precede a client using the new document. No production backend change has been made by this branch.

## Offline and sessions

Only the last server-confirmed public configuration and a separate public draft are stored locally. Cached settings are labelled unavailable for saving until the remote listener confirms the current server state; Admin Save is disabled offline and does not intentionally queue a write. Reconnect validates the latest revision. This does not create a new offline-installation service: first-ever loading and Firebase SDK loading need network access; an already-loaded page and cached settings can continue locally. No configuration backup download UI remains.

At first real draw, the existing local snapshot freezes event identity/content, prizes/amounts, audio and selection rules. Incoming settings are deferred until an explicit session reset. Only visual theme applies immediately; it does not restart the countdown or mutate pending/committed winners. Switching presets while a session is active requires a warning confirmation and prepares the next configuration without deleting that session. Reset remains an explicit existing action. Runtime/rosters/results remain tab-local and do not synchronize between devices.

## Validation

Run:

```
npm test
python3 -m unittest discover -s tests -p 'test_publication.py'
python3 scripts/preflight.py
# Node 24.12+ / Java 21+, emulator only:
npx firebase-tools@latest emulators:exec --only firestore --project demo-lucky-settings 'npm run test:rules'
git diff --check
```

Tests cover migration, validation, first load/reload, full-config propagation, Admin role revocation, anonymous/non-Admin denial, concurrent writers, legacy cutover, offline cache/reconnect, dirty draft conflicts, active-session freeze and original draw/Excel behavior. Browser smoke uses only synthetic accounts/configuration in a separate demo Firebase Emulator project; screenshots stay outside Git.

Security Rules in this PR are a reviewed-test candidate, not deployed protection. I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for public event settings with Admin-only writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
