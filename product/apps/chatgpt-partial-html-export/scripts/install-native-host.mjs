#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXTENSION_ID = 'chatgpt-partial-html-export@tenzyudotcom.local';
const HOST_NAME = 'com.tenzyudotcom.chatgpt_partial_html_export';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '..');
const hostPath = path.join(projectRoot, 'native', 'chatgpt-partial-html-export-host');
const manifestDir = path.join(os.homedir(), '.mozilla', 'native-messaging-hosts');
const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`);

const manifest = {
  name: HOST_NAME,
  description: 'Native writer for ChatGPT Partial HTML Export',
  path: hostPath,
  type: 'stdio',
  allowed_extensions: [EXTENSION_ID]
};

await fs.access(hostPath);
await fs.chmod(hostPath, 0o755);
await fs.mkdir(manifestDir, { recursive: true });
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Installed Firefox native messaging manifest:\n${manifestPath}`);
console.log(`Native host path:\n${hostPath}`);
console.log('Reload the temporary extension in about:debugging after installing the host.');
