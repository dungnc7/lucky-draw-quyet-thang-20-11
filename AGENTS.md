# Codex instructions — Lucky Draw Quyết Thắng 20/11

## Mission
Publish this existing static website publicly at GitHub Pages, using the owner's GitHub account `dungnc7`. Repository target: `dungnc7/lucky-draw-quyet-thang-20-11` (public). Prefer preserving the working v2.3 site unchanged.

## Source of truth
- `index.html` is the entire application, including embedded JS, CSS, logo, music and Excel import library. No build step, Node packages, CDN, backend or secrets are required.
- `README.md` explains the application and its privacy limitations.
- `CODEX_DEPLOY_TASK.md` contains the deployment procedure and acceptance criteria.

## Non-negotiable constraints
1. Do not push any real employee/customer rosters, national identity numbers (CCCD), prize results, event logs, environment files, passwords, tokens or other private information. The repository must contain only the sanitized deployment bundle.
2. Do not rewrite the drawing algorithm, UI, prize values, or 15-second timer. Only make narrowly scoped changes if required to deploy.
3. Check for an existing target repository before creating anything. Do not overwrite an unrelated repository, branch or Pages configuration. If a repository exists with unexpected contents, stop and report rather than force push.
4. No `git push --force`; no storing credentials in committed files; use the user's existing GitHub login/authorized `gh` credentials.
5. Verify the actual deployed GitHub Pages URL is reachable and displays the expected Vietnamese event heading. Do not claim deployment success merely because a push succeeded.
6. If GitHub authentication or Pages admin permission is missing, report the exact blocker and minimal required user action.
