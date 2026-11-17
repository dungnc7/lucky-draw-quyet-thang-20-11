#!/usr/bin/env python3
"""Check the exact public-source bundle. Runtime/participant files never belong here."""
from pathlib import Path
from html.parser import HTMLParser
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {
    '.gitignore', '.nojekyll', 'AGENTS.md', 'CODEX_DEPLOY_TASK.md',
    'LICENSE-JSZIP.txt', 'PUBLISH.md', 'README.md', 'index.html',
    'scripts/preflight.py', 'tests/test-v24.cjs',
    'docs/ARCHITECTURE.md', 'docs/QA_V2_4.md',
}
errors = []
for path in ROOT.rglob('*'):
    rel = path.relative_to(ROOT)
    if '.git' in rel.parts or '__pycache__' in rel.parts:
        continue
    if path.is_file() and rel.as_posix() not in ALLOWED:
        errors.append('Unexpected public file: ' + rel.as_posix())
for name in ALLOWED:
    if not (ROOT / name).is_file():
        errors.append('Missing release file: ' + name)
content = (ROOT / 'index.html').read_text(encoding='utf-8')
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.S)
checks = {
    'v2.4 title': '<title>Lucky Draw v2.4' in content,
    'Vietnamese Teachers Day heading': 'CHƯƠNG TRÌNH QUAY THƯỞNG NGÀY NHÀ GIÁO VIỆT NAM 20/11' in content,
    'fixed 10-second engine': bool(re.search(r'const DRAW_MS=10_000', content)),
    'embedded original logo': 'data:image/png;base64,' in content,
    'inline engine and three preserved application/library scripts': len(scripts) == 4,
    'no old draw duration or obsolete headings': not re.search(r'15_?000|5_000|YEAR END PARTY|LỄ TRI ÂN', '\n'.join(scripts[1:]).upper()),
    'no executable network API in app': not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(', '\n'.join(scripts[1:])),
}
for name, passed in checks.items():
    if not passed:
        errors.append('Expected: ' + name)
class Resources(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'poster'):
            if attrs.get(key) and not attrs[key].startswith('data:'):
                errors.append('Non-embedded resource: ' + attrs[key])
        if tag == 'link' and attrs.get('rel') in {'stylesheet', 'preload'}:
            errors.append('External stylesheet/preload not permitted')
Resources().feed(content)
# Scan human-readable application source, excluding embedded media and the unchanged JSZip library.
app_source = re.sub(r'data:[^\s"\']+', '[EMBEDDED]', content)
app_source = re.sub(r'<script>.*?</script>', lambda m: '[JSZIP]' if 'JSZip v3.10.1' in m[0] else m[0], app_source, flags=re.S)
if re.search(r'(?<!\d)\d{12}(?!\d)', app_source):
    errors.append('Unexpected literal 12-digit identifier in application')
for path in ROOT.rglob('*'):
    if path.is_file() and path.relative_to(ROOT).as_posix() in ALLOWED:
        if re.search(r'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', path.read_text()):
            errors.append('Potential credential: ' + path.name)
try:
    with tempfile.TemporaryDirectory(prefix='lucky-syntax-') as tmp:
        for i, script in enumerate(scripts):
            p = Path(tmp) / f'script-{i}.js'
            p.write_text(script)
            result = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
            if result.returncode:
                errors.append(result.stderr)
except FileNotFoundError:
    errors.append('Node.js is required for release syntax validation (not for running the site).')
if errors:
    print('PRE-FLIGHT FAILED:\n' + '\n'.join(' - ' + error for error in errors))
    sys.exit(1)
print('PRE-FLIGHT PASSED: exact public-source allowlist, privacy scan, inline assets, v2.4 configuration and 4 JavaScript syntax checks')
