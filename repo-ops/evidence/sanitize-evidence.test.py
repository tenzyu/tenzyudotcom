import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).with_name('sanitize-evidence.py')


class EvidenceTests(unittest.TestCase):
    def run_cli(self, root, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args, str(root)],
                              capture_output=True, text=True)

    def test_redacts_keys_and_copies_without_changing_results(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            secret = 'fixture-provider-value-never-print'
            document = {
                'config': {'webServer': {'env': {'PROVIDER_API_KEY': secret,
                                               'PaSsWoRd': 'dummy-password',
                                               'OSU_CLIENT_ID': 'public-id'}}},
                'stats': {'expected': 10, 'unexpected': 0},
                'tests': [{'status': 'passed', 'title': 'token parsing still works'}],
                'copy': 'copied ' + secret,
            }
            path = root / 'results.json'
            path.write_text(json.dumps(document))
            (root / '.env').write_text('not-json-do-not-read')
            audit = self.run_cli(root)
            self.assertEqual(audit.returncode, 1)
            self.assertNotIn(secret, audit.stdout + audit.stderr)
            repair = self.run_cli(root, '--redact')
            self.assertEqual(repair.returncode, 0, repair.stdout)
            self.assertNotIn(secret, repair.stdout + repair.stderr + path.read_text())
            self.assertNotIn('dummy-password', repair.stdout + repair.stderr)
            sanitized = json.loads(path.read_text())
            self.assertEqual(sanitized['stats'], document['stats'])
            self.assertEqual(sanitized['tests'], document['tests'])
            self.assertEqual(sanitized['config']['webServer']['env']['OSU_CLIENT_ID'], 'public-id')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            before = path.read_bytes()
            self.assertEqual(self.run_cli(root, '--redact').returncode, 0)
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(self.run_cli(root).returncode, 0)

    def test_archive_is_audited_not_silently_certified_or_modified(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            secret = 'archive-fixture-private-value'
            (root / 'results.json').write_text(json.dumps({'env': {'API_KEY': secret}}))
            archive = root / 'trace.zip'
            with zipfile.ZipFile(archive, 'w') as stream:
                stream.writestr('test.trace', json.dumps({'copy': secret}) + '\n')
            original = archive.read_bytes()
            result = self.run_cli(root, '--redact')
            self.assertEqual(result.returncode, 1)
            self.assertNotIn(secret, result.stdout + result.stderr)
            self.assertEqual(archive.read_bytes(), original)
            self.assertIn('"hitCount": 1', result.stdout)
            self.assertEqual(json.loads((root / 'results.json').read_text())['env']['API_KEY'], secret)
            self.assertEqual(self.run_cli(root).returncode, 1)

    def test_parse_errors_never_echo_source_values(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'results.json').write_text('invalid-private-source-text')
            result = self.run_cli(root)
            self.assertEqual(result.returncode, 2)
            self.assertNotIn('invalid-private-source-text', result.stdout + result.stderr)

    def test_archive_metadata_is_checked_without_source_json(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with zipfile.ZipFile(root / 'trace.zip', 'w') as stream:
                stream.writestr('metadata.json', json.dumps({
                    'env': {'AUTHORIZATION': 'fixture-pretty-archive-secret'},
                }, indent=2))
            result = self.run_cli(root)
            self.assertEqual(result.returncode, 1)
            self.assertIn('AUTHORIZATION', result.stdout)
            self.assertNotIn('fixture-pretty-archive-secret', result.stdout + result.stderr)

    def test_fixed_sentinel_is_checked_even_without_a_secret_named_field(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'results.json').write_text(json.dumps({'copy': 'evidence-sentinel-never-store'}))
            result = self.run_cli(root, '--check-synthetic-sentinel')
            self.assertEqual(result.returncode, 1)
            self.assertNotIn('evidence-sentinel-never-store', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
