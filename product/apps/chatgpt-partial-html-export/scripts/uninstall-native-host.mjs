#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const HOST_NAME = 'com.tenzyudotcom.chatgpt_partial_html_export';
const manifestPath = path.join(os.homedir(), '.mozilla', 'native-messaging-hosts', `${HOST_NAME}.json`);

try {
  await fs.rm(manifestPath, { force: true });
  console.log(`Removed Firefox native messaging manifest:\n${manifestPath}`);
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exitCode = 1;
}
