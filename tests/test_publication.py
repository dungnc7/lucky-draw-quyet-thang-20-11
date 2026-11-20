"""Publication safety tests: synthetic public configuration, no private data/credentials."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('publisher', ROOT / 'scripts/publish_config.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / 'config/versions').mkdir(parents=True)
        self.current = json.loads((ROOT / 'config/published.json').read_text())
        (self.root / 'config/published.json').write_text(json.dumps(self.current))
        self.draft = json.loads(json.dumps(self.current))
        self.draft['publication'] = dict(state='draft', revision=0, baseRevision=self.current['publication']['revision'], publishedAt=None)
        self.input = self.root / 'proposal.json'
        self.input.write_text(json.dumps(self.draft))
    def tearDown(self):
        self.temporary.cleanup()
    def prepare(self):
        return publisher.prepare(self.input, self.root, '2026-11-20T12:00:00.000Z')
    def test_preparation_does_not_write_and_increments_once(self):
        before = (self.root / 'config/published.json').read_bytes()
        prepared = self.prepare()
        self.assertEqual(prepared['publication']['revision'], self.current['publication']['revision'] + 1)
        self.assertEqual(before, (self.root / 'config/published.json').read_bytes())
        self.assertEqual([], list((self.root / 'config/versions').iterdir()))
    def test_apply_matches_archive_and_never_overwrites(self):
        prepared = self.prepare()
        archive = publisher.apply(prepared, self.root)
        self.assertEqual(archive.read_bytes(), (self.root / 'config/published.json').read_bytes())
        with self.assertRaisesRegex(ValueError, 'Immutable'):
            publisher.apply(prepared, self.root)
    def test_stale_proposal_is_refused(self):
        self.draft['publication']['baseRevision'] -= 1
        self.input.write_text(json.dumps(self.draft))
        with self.assertRaises(ValueError):
            self.prepare()
    def test_roster_or_results_cannot_be_published(self):
        for field in ['people', 'winners', 'cccd', 'token', 'sessions']:
            self.draft[field] = ['SYNTHETIC PRIVATE DATA']
            self.input.write_text(json.dumps(self.draft))
            with self.assertRaises(ValueError):
                self.prepare()
            del self.draft[field]
    def test_unknown_schema_and_changed_draw_rules_are_refused(self):
        for mutation in [('schemaVersion', 999), ('draw', {**self.draft['draw'], 'durationMs': 5000})]:
            invalid = {**self.draft, mutation[0]: mutation[1]}
            self.input.write_text(json.dumps(invalid))
            with self.assertRaises(ValueError):
                self.prepare()
    def test_cli_dry_run_does_not_write_or_require_github_auth(self):
        before = (ROOT / 'config/published.json').read_bytes()
        result = subprocess.run(['python3', str(ROOT / 'scripts/publish_config.py'), '--input', str(self.input), '--dry-run'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('DRY RUN', result.stdout)
        self.assertEqual(before, (ROOT / 'config/published.json').read_bytes())

if __name__ == '__main__':
    unittest.main()
