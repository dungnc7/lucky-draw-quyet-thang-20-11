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
    '.firebaserc', 'firebase.json', 'firestore.rules', 'package.json', 'package-lock.json',
    'cloud-theme-config.js', 'cloud-theme-sync.js', 'cloud-theme.css',
    '.github/workflows/shared-theme-check.yml', 'tests/shared-theme-contract.cjs',
    'tests/firestore-rules.cjs', 'tests/settings-firestore.cjs', 'tests/settings-model.cjs', 'tests/cloud-theme-controller.cjs', 'docs/FIREBASE_SHARED_THEME.md',
    'scripts/preflight.py', 'scripts/publish_config.py', 'scripts/validate_config.cjs',
    'tests/test-v24.cjs', 'tests/test_publication.py',
    'config/published.json', 'config/versions/v000001.json',
    'docs/SIMPLIFIED_SETTINGS.md', 'docs/SHARED_CONFIGURATION.md', 'docs/QA_SHARED_CONFIGURATION.md',
    'docs/ARCHITECTURE.md', 'docs/QA_V2_4.md', 'docs/QA_V2_6.md', 'docs/MASTER_PROMPT_V2_6.md',
}
errors = []
version_paths = sorted((ROOT / 'config/versions').glob('v*.json'))
for path in version_paths:
    if re.fullmatch(r'v[0-9]{6}\.json', path.name):
        ALLOWED.add(path.relative_to(ROOT).as_posix())
for path in ROOT.rglob('*'):
    rel = path.relative_to(ROOT)
    if '.git' in rel.parts or '__pycache__' in rel.parts or 'node_modules' in rel.parts or '.firebase' in rel.parts:
        continue
    if path.is_file() and rel.as_posix() not in ALLOWED:
        errors.append('Unexpected public file: ' + rel.as_posix())
for name in ALLOWED:
    if not (ROOT / name).is_file():
        errors.append('Missing release file: ' + name)
content = (ROOT / 'index.html').read_text(encoding='utf-8')
scripts = [s for s in re.findall(r'<script[^>]*>(.*?)</script>', content, re.S) if s.strip()]
checks = {
    'v2.6 title': '<title>Lucky Draw Event Platform v2.6' in content,
    'Vietnamese Teachers Day heading': 'CHƯƠNG TRÌNH QUAY THƯỞNG NGÀY NHÀ GIÁO VIỆT NAM 20/11' in content,
    'final consolation configuration': "key:'encouragement',count:30,batchSize:6" in content and "configId:CONFIG_ID" in content,
    'no obsolete consolation progress': 'LƯỢT 1/6' not in content and ' / 14`' not in content,
    'corporate default and branding': "DEFAULT_THEME_ID='quyet-thang-corporate'" in content and all(c in content for c in ['#2E7BC3','#F2363F','#0D1B3D']),
    'fixed 10-second engine': bool(re.search(r'const DRAW_MS=10_000', content)),
    'embedded original logo': 'data:image/png;base64,' in content,
    'inline draw/event modules and preserved application/library scripts': len(scripts) == 7,
    'no old draw duration or obsolete headings': not re.search(r'15_?000|5_000|LỄ TRI ÂN', '\n'.join(scripts[1:]).upper()),
    'no direct network APIs or private uploads': not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(', '\n'.join(scripts[1:])),
    'anonymous bounded config GET only': all(part in content for part in ["cache:'no-store',credentials:'omit',redirect:'error',signal", "new URL('./config/published.json'", "SharedConfiguration.fetchPublished(fetcher,url.href"]),
}
for name, passed in checks.items():
    if not passed:
        errors.append('Expected: ' + name)
class Resources(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'poster'):
            if attrs.get(key) and not attrs[key].startswith('data:') and attrs[key] not in {'./cloud-theme-config.js', './cloud-theme-sync.js'}:
                errors.append('Non-embedded resource: ' + attrs[key])
        if tag == 'link' and attrs.get('rel') in {'stylesheet', 'preload'} and attrs.get('href') != './cloud-theme.css':
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
# Version files must form an append-only sequence; latest is byte-identical to its archive.
try:
    import json
    revisions = []
    for path in version_paths:
        result = subprocess.run(['node', str(ROOT / 'scripts/validate_config.cjs'), str(path), '--published'], capture_output=True, text=True)
        if result.returncode:
            errors.append(path.name + ': ' + result.stderr.strip())
        config = json.loads(path.read_text())
        revision = config['publication']['revision']
        revisions.append(revision)
        if path.name != f'v{revision:06d}.json':
            errors.append('Archive filename does not match revision: ' + path.name)
    if not revisions or revisions != list(range(1, len(revisions) + 1)):
        errors.append('Public configuration history must be contiguous from v1')
    elif (ROOT / 'config/published.json').read_bytes() != version_paths[-1].read_bytes():
        errors.append('Published configuration does not match latest immutable archive')
except (OSError, ValueError, KeyError) as error:
    errors.append('Invalid public configuration: ' + str(error))
if errors:
    print('PRE-FLIGHT FAILED:\n' + '\n'.join(' - ' + error for error in errors))
    sys.exit(1)
print('PRE-FLIGHT PASSED: exact public-source allowlist, privacy scan, inline assets, v2.6 themes, approved draw configuration shared version history and 7 JavaScript syntax checks')
