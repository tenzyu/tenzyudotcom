import tempfile
import unittest
from pathlib import Path
from seed_identity import ARTIFACTS, CARGO, INPUTS, digest, verify, write

class SeedAdmission(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.bundle = self.root / "bundle"
        self.candidate = self.root / "candidate"
        self.bundle.mkdir()
        (self.candidate / CARGO).mkdir(parents=True)
        for p in ARTIFACTS:
            (self.bundle / p).write_text(p)
        for p in INPUTS:
            (self.candidate / CARGO / p).write_text(p)
        self.image = "sha256:" + "a" * 64
        self.expected = write(self.bundle, self.candidate, self.image)

    def test_exact_identity(self):
        self.assertEqual(verify(self.bundle, self.candidate, self.expected), self.image)

    def test_changed_lock(self):
        (self.candidate / CARGO / "Cargo.lock").write_text("different")
        with self.assertRaisesRegex(ValueError, "Cargo input mismatch"):
            verify(self.bundle, self.candidate, self.expected)

    def test_changed_manifest(self):
        (self.bundle / "manifest.json").write_text("{}")
        with self.assertRaisesRegex(ValueError, "manifest digest mismatch"):
            verify(self.bundle, self.candidate, self.expected)

    def test_changed_image_archive(self):
        (self.bundle / ARTIFACTS[0]).write_text("different")
        with self.assertRaisesRegex(ValueError, "artifact digest mismatch"):
            verify(self.bundle, self.candidate, self.expected)

    def test_changed_dependency_archive(self):
        (self.bundle / ARTIFACTS[1]).write_text("different")
        with self.assertRaisesRegex(ValueError, "artifact digest mismatch"):
            verify(self.bundle, self.candidate, self.expected)

    def test_missing_trusted_digest(self):
        with self.assertRaisesRegex(ValueError, "missing trusted manifest digest"):
            verify(self.bundle, self.candidate, "")

if __name__ == "__main__":
    unittest.main()
