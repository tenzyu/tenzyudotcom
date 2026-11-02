export function publicBrowserEnvironment(source = process.env) {
  const env = {};
  for (const key of [
    'PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', '__ETC_PROFILE_DONE',
    'NIX_SSL_CERT_FILE', 'SSL_CERT_FILE', 'LD_LIBRARY_PATH', 'XDG_DATA_DIRS',
  ]) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  return {
    ...env,
    CI: '1', NX_DAEMON: 'false', NX_NO_CLOUD: 'true',
    NEXT_TELEMETRY_DISABLED: '1',
    EDITOR_ADMIN_PASSWORD: '', EDITOR_SESSION_SECRET: '',
    GITHUB_CONTENT_TOKEN: '',
    GITHUB_CONTENT_OWNER: 'tenzyu', GITHUB_CONTENT_REPO: 'tenzyudotcom-content',
    GITHUB_CONTENT_BRANCH: 'main', GITHUB_CONTENT_ROOT: 'storage',
    OSU_CLIENT_ID: '', OSU_CLIENT_SECRET: '',
  };
}
