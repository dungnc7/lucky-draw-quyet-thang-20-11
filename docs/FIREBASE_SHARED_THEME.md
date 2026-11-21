# Firebase shared configuration (supersedes theme-only)

Reuse project lucky-draw-quyet-thang, its registered Web App, Email/Password Authentication and private owner-provisioned Admin roles. The public SDK configuration contains identifiers, not access secrets. Do not commit UID allowlists, service keys, passwords or tokens.

The earlier sharedTheme/live document contained only a visual theme. It remains readable as a migration input; the new sharedEvent/live schema 2 stores the complete validated public event configuration. Once the new document exists, rules deny legacy theme writes. See [SIMPLIFIED_SETTINGS.md](SIMPLIFIED_SETTINGS.md) for architecture, ordered release/cutover, concurrency, tests and rollback strategy.

Admin authorization is always enforced by Firestore rules, with fresh membership checking before Save. Viewers need no login. No client can create/change roles. Rules tests use demo-only emulators and synthetic identities. Production rules and documents are unchanged by this implementation task; owner review must precede deployment.
