"""Diagnostic-only immutable native seed admission. No implicit trust in cache keys."""
import hashlib
import json
import re
import sys
from pathlib import Path

CARGO = Path("product/apps/osu-skin-workbench/src-tauri")
ARTIFACTS = ("environment.tar.zst", "dependencies.tar.zst")
INPUTS = ("Cargo.toml", "Cargo.lock")

def digest(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def write(directory, candidate, image_id):
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", image_id):
        raise ValueError("invalid image identity")
    data = {"schema": 1, "image_id": image_id,
            "cargo": {p: digest(candidate / CARGO / p) for p in INPUTS},
            "artifacts": {p: digest(directory / p) for p in ARTIFACTS}}
    (directory / "manifest.json").write_text(json.dumps(data, sort_keys=True) + "\n")
    return digest(directory / "manifest.json")

def verify(directory, candidate, expected):
    if not re.fullmatch(r"[0-9a-f]{64}", expected):
        raise ValueError("missing trusted manifest digest")
    manifest = directory / "manifest.json"
    if digest(manifest) != expected:
        raise ValueError("manifest digest mismatch")
    data = json.loads(manifest.read_text())
    if data.get("schema") != 1 or not re.fullmatch(r"sha256:[0-9a-f]{64}", data.get("image_id", "")):
        raise ValueError("unsupported seed identity")
    if data.get("cargo") != {p: digest(candidate / CARGO / p) for p in INPUTS}:
        raise ValueError("Cargo input mismatch")
    if data.get("artifacts") != {p: digest(directory / p) for p in ARTIFACTS}:
        raise ValueError("artifact digest mismatch")
    return data["image_id"]

if __name__ == "__main__":
    mode, directory, candidate, value = sys.argv[1:]
    if mode == "write":
        print(write(Path(directory), Path(candidate), value))
    elif mode == "verify":
        print(verify(Path(directory), Path(candidate), value))
    else:
        raise ValueError("unknown mode")
