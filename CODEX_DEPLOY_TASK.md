# Codex task: Deploy Lucky Draw 20/11 v2.3 to GitHub Pages

You are the senior deployment engineer for a Vietnamese-language employee lucky-draw web app.

## Goal
Deploy this folder to GitHub Pages as a **public** static website for **Trung tâm Giáo dục Nghề nghiệp Quyết Thắng**. GitHub owner `dungnc7`; preferred new repository `lucky-draw-quyet-thang-20-11`. Expected production URL: https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/

## What is already ready
- `index.html`: self-contained v2.3 website with embedded logo and JSZip; no external build dependencies.
- Vietnamese heading `CHƯƠNG TRÌNH QUAY THƯỞNG`, event 20/11/2026.
- Five rounds, **15 seconds each**, 44 unique prizes (30 + 8 + 3 + 2 + 1).
- Optional music/countdown audio; local Excel import and export; editable prize values before drawing.
- `LICENSE-JSZIP.txt`, `.nojekyll`, `.gitignore`, `README.md`, `PUBLISH.md`.

## Required work
1. Inspect `index.html` and `README.md`. Run `python3 scripts/preflight.py`. Inspect the exact files to be committed and confirm no real employee list, ID data, output spreadsheets or credentials are included.
2. Check `gh auth status`; verify authenticated owner/account has rights to create and configure a public repository. If not authenticated, ask user to perform a normal `gh auth login` (never request or paste tokens in chat).
3. Check whether `dungnc7/lucky-draw-quyet-thang-20-11` already exists. If absent, create it as a **Public** repository. If present, verify its contents and permissions; do not replace unrelated contents or force-push.
4. Initialize the Git repository if needed, set default branch `main`, commit only the sanitized files, and push to `origin/main`.
5. Enable GitHub Pages deploying from branch `main`, directory `/(root)` (using the GitHub API/`gh api` where permitted, or provide the exact manual Settings → Pages sequence if API permissions fail).
6. Wait for/check the associated Pages build/deployment in the current execution and verify that the production URL responds with HTTP 200, contains `CHƯƠNG TRÌNH QUAY THƯỞNG`, and loads the embedded logo. Check that the app starts and that the browser console has no fatal errors, if a browser is available.
7. Report: repository URL, public Pages URL, commit SHA, Pages deployment status, any remaining user-only action. Do not call a proposed URL 'live' before verifying it.

## Important
- Never commit `*.xlsx`, `*.xls`, `*.csv`, CCCD files, real employee names, raffle outcomes, auth tokens, or runtime storage dumps.
- Local Excel files remain processed only in the browser. This public static site is NOT a centralized, multi-device raffle system; separate browsers have separate sessions.
- Preserve functionality; do not refactor or redesign unless absolutely necessary.
- This is public publishing explicitly requested by the website owner. Avoid setting repository private and then mistakenly claiming Pages is public.

## Example CLI flow (adapt carefully to actual repo state)
```bash
python3 scripts/preflight.py
gh auth status
gh repo view dungnc7/lucky-draw-quyet-thang-20-11 --json name,visibility,defaultBranchRef || true
# If missing: git init -b main; git add ...; git commit -m 'Deploy Lucky Draw 20-11 v2.3'
# Create/push with gh repo create ... --public --source=. --remote=origin --push
# If already exists, inspect before adding/changing files.
# For Pages, use GitHub Settings > Pages or an authenticated gh api call.
# Verify both GitHub Actions/Pages status and the real HTTP endpoint.
```

## Acceptance criteria
- Public repository with only sanitized files.
- `main/index.html` is the site entry point.
- GitHub Pages indicates successful deployment (not merely a pushed commit).
- Production page serves expected app heading and logo, timer defaults to 15 seconds.
- No real participant data or credentials have been published.
