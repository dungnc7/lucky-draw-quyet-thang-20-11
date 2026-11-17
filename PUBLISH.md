# GitHub Pages — Lucky Draw Quyết Thắng v2.4

Repository: https://github.com/dungnc7/lucky-draw-quyet-thang-20-11

Website: https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/

Keep repository **PUBLIC** on the current GitHub plan. Changing it to private previously removed Pages; a private repo needs a supported paid plan or different hosting.

Pages source: **Settings → Pages → Deploy from a branch → main → /(root)**. Keep `.nojekyll`; no build dependencies are required.

Before commit:

```sh
python3 scripts/preflight.py
node --test tests/test-v24.cjs
git diff --check
git diff --stat
```

Inspect every staged path. Only publish the source allowlist; never include Excel/CSV rosters, results, audit JSON, credentials, screenshots containing participant data or runtime session dumps. Preserve existing history; no force pushes.

After push, require the Pages workflow for that SHA to succeed. Check the public URL **without authentication**, HTTP 200 and content hash against reviewed `index.html`. Test logo, new theme and a demo batch in a browser. A successful push alone is not proof of publication.

The same `index.html` can be saved and used locally offline in a supported browser. Check actual projector, fullscreen permissions, speakers and sound volume on the event laptop before live use. Save local result exports after the event.
