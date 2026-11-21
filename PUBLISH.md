> Authentication upgrade candidate: [docs/AUTH_ACCESS.md](docs/AUTH_ACCESS.md). Mandatory server-verified login and protected Firestore reads supersede the former public-viewer/offline-cache behavior below. Release requires owner approval and the coordinated maintenance sequence. Production is unchanged by this branch.

# Release review - Lucky Draw v2.6

Repository: https://github.com/dungnc7/lucky-draw-quyet-thang-20-11

Current Pages URL: https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/

This request ends at a Pull Request with screenshots and tests. **Do not merge, deploy Firestore rules, initialize sharedEvent/live or deploy Pages before owner review.**

After explicit release approval, follow the ordered migration in [SIMPLIFIED_SETTINGS.md](docs/SIMPLIFIED_SETTINGS.md): reviewed rules first, approved client second, explicit first Admin Save third. JSON archives remain immutable migration inputs. Configuration-only edits then use the Firebase Admin screen, not GitHub Actions.

Keep the repository PUBLIC and existing Pages source main / root for the current plan. Keep .nojekyll. No build output or client secrets are required. Run npm test, Python archive tests, preflight and demo-only Firestore rules tests before committing; inspect every staged path. No real participants, results, screenshots, runtime dumps or credentials belong in Git.

For an approved release, wait for successful deployment of the exact reviewed SHA. Verify the public endpoint without authentication, HTML hash, logo, Admin save and independent realtime viewer, unauthorized denial and a synthetic 10-second batch. A push or green CI alone is not evidence that production works. Check projector, speakers and local result exports on the actual event laptop separately.
