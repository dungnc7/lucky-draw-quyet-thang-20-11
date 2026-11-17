#!/usr/bin/env python3
"""Dependency-free preflight for the public static Lucky Draw deployment bundle."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
html_path = ROOT / 'index.html'
errors = []
if not html_path.exists():
    errors.append('index.html is missing')
else:
    content = html_path.read_text(encoding='utf-8')
    for name, check in (
        ('Vietnamese raffle heading', 'CHƯƠNG TRÌNH QUAY THƯỞNG' in content),
        ('20/11/2026 event', '20/11/2026' in content),
        ('15 second draw', bool(re.search(r'\bDRAW_MS\s*=\s*15_?000\b', content))),
        ('embedded logo', 'data:image/' in content),
        ('embedded app scripts', '<script' in content),
        ('no remaining Lễ tri ân heading', 'LỄ TRI ÂN' not in content.upper()),
    ):
        if not check:
            errors.append(f'Expected: {name}')

# In a PUBLIC repository there must never be local Excel/CSV participant data.
for path in ROOT.rglob('*'):
    if path.is_file():
        if any(part in {'.git', '__pycache__'} for part in path.parts):
            continue
        if path.suffix.lower() in {'.xlsx', '.xls', '.xlsm', '.csv', '.env', '.pem', '.p12', '.key'}:
            errors.append(f'Potentially sensitive or unexpected file: {path.relative_to(ROOT)}')
if errors:
    print('PRE-FLIGHT FAILED:')
    for error in errors:
        print(' -', error)
    sys.exit(1)
print('PRE-FLIGHT PASSED: sanitized site files found, heading/logo/15-second duration verified')
