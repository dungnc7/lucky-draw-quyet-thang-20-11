# Lucky Draw Quyết Thắng — engineering rules

## Current owner request
Upgrade the existing v2.3 application to v2.4; the latest explicit v2.4 request supersedes the previous instruction to preserve the 15-second, single-batch UI. Maintain the working importer, exporter, company logo, monetary configuration, independent audio and standalone HTML architecture.

## Release contract
- Repository: `dungnc7/lucky-draw-quyet-thang-20-11`, PUBLIC. Pages: `main`, `/(root)`.
- Exactly 14 manually triggered batches, 10,000 ms each, 44 unique winners: 6×5 encouragement, 2×4 fourth, 3×1 third, 2×1 second, 1×1 first.
- Cryptographic rejection sampling; persist before draw/reveal/progression. Never reselect a pending batch after refresh. Fail closed if persistence is unavailable.
- Lock prize amounts from the first started draw. Snapshot selected monetary value in results and audit exports.
- Winner cards show only employee code and name; never CCCD or department. CCCD-only imports receive a local row reference for presentation.
- Keep old v2.3 sessions separate. Offer a local backup; never silently reinterpret old outcomes as v2.4 batches.
- Never commit real participant data, CCCD, results, runtime storage, Excel/CSV files, credentials or downloaded test exports. Test with synthetic data only; keep fixtures and screenshots outside the repository.
- Do not force push or replace unrelated history/configuration. Do not assume private repositories can host Pages on the current plan.
- Before committing: run `python3 scripts/preflight.py` and `node --test tests/test-v24.cjs`; perform browser smoke testing when available.
- Verify the actual public endpoint and deployment status before claiming a release is live. Document what was tested and any manual validation still required.
