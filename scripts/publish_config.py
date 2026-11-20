#!/usr/bin/env python3
"""Validate/review public-only proposals; authenticated publication happens in GitHub Actions."""
import argparse
import base64
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 32768
DEFAULT_REPO = 'dungnc7/lucky-draw-quyet-thang-20-11'

def prepare(input_path, root=ROOT, published_at=None):
    path = Path(input_path)
    if path.stat().st_size > MAX_BYTES:
        raise ValueError('Configuration exceeds 32 KiB')
    current = Path(root) / 'config/published.json'
    if not current.is_file():
        raise ValueError('Current published configuration is missing; refuse to reset history')
    stamp = published_at or datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    result = subprocess.run(['node', str(ROOT / 'scripts/validate_config.cjs'), str(path), '--prepare', str(current), stamp], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(result.stderr.strip())
    return json.loads(result.stdout)

def apply(config, root=ROOT):
    root = Path(root)
    version = config['publication']['revision']
    archive = root / 'config/versions' / f'v{version:06d}.json'
    if archive.exists():
        raise ValueError('Immutable version already exists; refusing to overwrite')
    archive.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(config, ensure_ascii=False, indent=2) + '\n'
    archive.write_text(data, encoding='utf-8')
    target = root / 'config/published.json'
    temporary = target.with_name('.published.json.tmp')
    temporary.write_text(data, encoding='utf-8')
    temporary.replace(target)
    return archive

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--dry-run', action='store_true', help='Validate and show exactly the public configuration; write nothing')
    mode.add_argument('--apply', action='store_true', help='Prepare next version in this checkout; does not push or deploy')
    mode.add_argument('--dispatch', action='store_true', help='Submit a locally validated proposal to the authenticated GitHub workflow')
    args = parser.parse_args()
    try:
        config = prepare(args.input)
        if args.dry_run:
            print(json.dumps(config, ensure_ascii=False, indent=2))
            print('DRY RUN: validated; no files changed and nothing sent to GitHub.')
        elif args.apply:
            archive = apply(config)
            print('Prepared public revision', config['publication']['revision'], 'at', archive.relative_to(ROOT))
        else:
            # gh uses existing authorization outside the browser. Never accept tokens from page data.
            permission = subprocess.run(['gh', 'api', f'repos/{DEFAULT_REPO}', '--jq', '.permissions.push'], capture_output=True, text=True, check=True)
            if permission.stdout.strip() != 'true':
                raise ValueError('Current GitHub account needs repository write permission')
            # Send the already validated snapshot, not a second read of a potentially changed file.
            proposal = {**config, 'publication': dict(state='draft', revision=0, baseRevision=config['publication']['baseRevision'], publishedAt=None)}
            original = json.dumps(proposal, ensure_ascii=False).encode('utf-8')
            request = {'ref': 'main', 'inputs': {'configuration_base64': base64.b64encode(original).decode('ascii')}}
            subprocess.run(['gh', 'api', '--method', 'POST', f'repos/{DEFAULT_REPO}/actions/workflows/publish-event-config.yml/dispatches', '--input', '-'], input=json.dumps(request), text=True, check=True)
            print('Publication workflow requested. This is not proof of deployment; verify Actions and the public JSON before announcing it.')
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('Publication refused:', error, file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
