#!/usr/bin/env python3
"""Legacy archive maintenance only; remote publication is retired."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 32768

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
    mode.add_argument('--dispatch', action='store_true', help='Retired: shared settings are saved through Firebase')
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
            raise ValueError('GitHub configuration publication is retired. Use Cài đặt chương trình with Firebase Admin authorization.')
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('Publication refused:', error, file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
