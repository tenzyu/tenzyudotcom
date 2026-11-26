import { createRequire } from 'node:module';

const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
const nextEnv = require('@next/env');
require.cache[require.resolve('@next/env')].exports = {
  ...nextEnv,
  loadEnvConfig: () => ({ combinedEnv: process.env, parsedEnv: {}, loadedEnvFiles: [] }),
};
