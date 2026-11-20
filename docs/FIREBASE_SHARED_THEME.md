# Shared Theme — Firebase setup for Lucky Draw v2.6

This feature is **not live until the owner configures Firebase and deploys these Firestore rules.**
The website stays on GitHub Pages. Firebase stores **only one public theme ID**, timestamp and schema version. No participants, CCCD, amounts, winners, draw progress, event titles or local drafts are uploaded.

## One-time project-owner setup

1. Visit https://console.firebase.google.com and create/select a Firebase project owned by the organization.
2. Register a **Web app**. Copy its public `apiKey`, `authDomain`, `projectId` and `appId` values into `cloud-theme-config.js`. These are public Firebase web configuration values, **not administrator secrets**.
3. Enable **Authentication → Sign-in method → Email/Password**. Create a dedicated administrator account in Authentication → Users; do not include its credentials in the repository.
4. Enable Cloud Firestore in production mode. Review and publish this repository's `firestore.rules` in Firebase Console → Firestore Database → Rules. **Do not leave permissive test rules enabled.**
5. In Authentication → Users, copy the admin account's UID (not email). Via Firestore Console (or privileged Admin SDK), create document `admins/<UID>` with boolean field `enabled: true`. Never grant that privilege from browser code.
6. Add `dungnc7.github.io` under Authentication → Settings → Authorized domains if required for your sign-in flow.
7. Deploy the website branch to GitHub Pages after code review. For ordinary production, deploy only after validating security rules (e.g. Firebase Emulator: unauthenticated write denied; nonadmin write denied; authorized admin write allowed; extra fields and invalid theme denied).

## Use it

- All devices open the same GitHub Pages URL and subscribe to changes.
- The operator selects a theme in the **GIAO DIỆN CHUNG CHO MỌI MÁY** section to preview it without affecting cloud state.
- The authorized administrator signs in and clicks **Áp dụng cho tất cả thiết bị**.
- Other open browsers automatically display the published theme. Refreshing uses the same shared theme.
- If Firebase isn't set up, the UI explicitly says cloud saving is unavailable and all seven existing theme choices remain available in the app's original Event section.
- Do not enter a password in `cloud-theme-config.js`, do not commit service account JSON, and do not upload employee Excel or result exports.

## Boundary

The cloud feature changes the **visual theme only**. It does not synchronize live draws or employee/winner lists. Existing `config/published.json` event content and draw-session logic remain separate. This avoids modifying participant data or breaking active rounds when the theme changes.

Because the app imports the Firebase Web SDK via the official `gstatic.com` CDN, cloud sync needs internet. The original raffle still works without Firebase.
