#!/usr/bin/env python3
"""Audit/redact JSON evidence without printing values; inspect ZIPs, never alter them.

Usage: python3 repo-ops/renewal/sanitize-evidence.py [--redact] EXTERNAL_ROOT
Exit 1 means findings remain (including ZIPs that must be regenerated/quarantined).
Only JSON files are rewritten. No .env files are opened, and symlinks are skipped.
ZIP findings block all rewrites, preserving source values for the next audit.
Reports contain paths, key names, counts, and hashes only. Use umask 077 when
redirecting stdout to a private report. Other file formats are not certified.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile

MARKER = '[REDACTED]'
SECRET_KEY = re.compile(r'password|secret|token|api[_-]?key|authorization|credential', re.I)


def secret_fields(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if SECRET_KEY.search(key) and child not in ('', None, MARKER):
                yield key, child
            yield from secret_fields(child)
    elif isinstance(value, list):
        for child in value:
            yield from secret_fields(child)


def clean(value, secrets):
    if isinstance(value, dict):
        return {key: MARKER if SECRET_KEY.search(key) and child not in ('', None)
                else clean(child, secrets) for key, child in value.items()}
    if isinstance(value, list):
        return [clean(child, secrets) for child in value]
    if isinstance(value, str):
        for secret in secrets:
            value = value.replace(secret, MARKER)
    return value


def atomic_write(path, data):
    fd, temporary = tempfile.mkstemp(prefix='.redacted-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--redact', action='store_true')
    parser.add_argument('--check-synthetic-sentinel', action='store_true',
                        help='also find the fixed evidence-sentinel-never-store test value')
    parser.add_argument('root', type=Path)
    args = parser.parse_args()
    root = args.root.absolute()
    if root.is_symlink() or not root.exists():
        parser.error('root must exist and must not be a symlink')
    files = []
    if root.is_file():
        files = [root]
    else:
        for directory, dirs, names in os.walk(root, followlinks=False):
            dirs[:] = [name for name in dirs if not (Path(directory) / name).is_symlink()]
            files.extend(Path(directory) / name for name in names
                         if not (Path(directory) / name).is_symlink())
    documents = []
    archives = []
    for path in sorted(files):
        if path.suffix.lower() == '.json':
            raw = path.read_bytes()
            documents.append((path, raw, json.loads(raw)))
        elif path.suffix.lower() == '.zip':
            archives.append(path)
    # Collect first so copies in unrelated JSON string fields are also removed.
    secrets = set()
    if args.check_synthetic_sentinel:
        secrets.add('evidence-sentinel-never-store')
    for _, _, value in documents:
        for _, child in secret_fields(value):
            if isinstance(child, str):
                secrets.add(child)
    secrets = sorted(secrets, key=len, reverse=True)
    remaining = 0
    for path in archives:
        hits = 0
        keys = set()
        with zipfile.ZipFile(path) as archive:
            for entry in archive.infolist():
                if entry.is_dir():
                    continue
                raw = archive.read(entry)
                hits += sum(raw.count(secret.encode()) for secret in secrets)
                # Playwright traces are JSONL, with other metadata in JSON.
                try:
                    text = raw.decode('utf-8')
                except UnicodeDecodeError:
                    continue
                try:
                    values = [json.loads(text)]
                except ValueError:
                    values = []
                    for line in text.splitlines():
                        try:
                            values.append(json.loads(line))
                        except ValueError:
                            continue
                for value in values:
                    fields = list(secret_fields(value))
                    keys.update(key for key, _ in fields)
                    hits += len(fields)
        remaining += int(hits > 0)
        print(json.dumps({'path': str(path), 'secretKeys': sorted(keys),
                          'hitCount': hits, 'archive': 'audit-only'}))
    # Do not erase the source values needed to re-audit contaminated archives.
    # Quarantine/regenerate those ZIPs before rerunning --redact on this root.
    blocked_by_archive = remaining > 0
    for path, raw, value in documents:
        fields = list(secret_fields(value))
        repaired = clean(value, secrets)
        changed = repaired != value
        report = {'path': str(path), 'secretKeys': sorted({key for key, _ in fields}),
                  'keyCount': len(fields), 'changed': changed,
                  'sha256Before': hashlib.sha256(raw).hexdigest()}
        if args.redact and changed and not blocked_by_archive:
            data = (json.dumps(repaired, ensure_ascii=False, indent=2) + '\n').encode()
            atomic_write(path, data)
        else:
            data = raw
            remaining += int(changed)
        report['sha256After'] = hashlib.sha256(data).hexdigest()
        print(json.dumps(report))
    print(json.dumps({'jsonFiles': len(documents), 'zipFiles': len(archives),
                      'remainingFiles': remaining, 'blockedByArchive': blocked_by_archive,
                      'mode': 'redact' if args.redact else 'audit'}))
    return int(remaining > 0)


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception:
        # Parser/IO errors can contain source text; never echo exception bodies.
        print(json.dumps({'error': 'Evidence could not be processed; no values disclosed'}))
        raise SystemExit(2)
