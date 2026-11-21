> Authentication upgrade candidate: [docs/AUTH_ACCESS.md](docs/AUTH_ACCESS.md). Mandatory server-verified login and protected Firestore reads supersede the former public-viewer/offline-cache behavior below. Release requires owner approval and the coordinated maintenance sequence. Production is unchanged by this branch.

# Lucky Draw v2.6 - current task boundary

Implement the simplified Firebase Admin configuration on a codex/ branch; create a Pull Request and provide screenshots for owner review. **Do not merge or deploy as part of this task.** Preserve existing remote main and production resources.

Follow AGENTS.md, README.md and docs/SIMPLIFIED_SETTINGS.md. Run npm test, preflight, Python archive tests and actual Firestore emulator rules tests. Keep synthetic fixtures, screenshots and emulator accounts outside the repository. Never publish credentials, employee data, CCCD, winners or runtime sessions.

For a later owner-approved release, follow PUBLISH.md and the staged rules/client/first-save migration. Report exact commit, test evidence and limits. Claim the feature live only after verifying the deployed public website.
