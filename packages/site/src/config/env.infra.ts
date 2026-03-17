type NodeEnv = 'development' | 'production' | 'test'
const NODE_ENV_VALUES = ['development', 'production', 'test'] as const

const readOptionalString = (name: string) => {
  const value = process.env[name]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const readOptionalInteger = (name: string) => {
  const value = readOptionalString(name)
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return parsed
}

const readBooleanFlag = (name: string) => {
  const value = readOptionalString(name)

  if (!value) {
    return false
  }

  if (value === '1' || value === 'true') {
    return true
  }

  if (value === '0' || value === 'false') {
    return false
  }

  throw new Error(`${name} must be true/false or 1/0`)
}

const readNodeEnv = (): NodeEnv => {
  const value = process.env.NODE_ENV
  if (NODE_ENV_VALUES.includes(value as NodeEnv)) {
    return value as NodeEnv
  }

  return 'development'
}

export const env = {
  nodeEnv: readNodeEnv(),
  siteUrl: readOptionalString('SITE_URL') ?? 'https://tenzyu.com',
  enableReactGrabOverlay: readBooleanFlag('ENABLE_REACT_GRAB_OVERLAY'),
  reactEditor: readOptionalString('REACT_EDITOR'),
  youtubeDataApiKey: readOptionalString('YOUTUBE_DATA_API_KEY'),
  osuClientId: readOptionalInteger('OSU_CLIENT_ID'),
  osuClientSecret: readOptionalString('OSU_CLIENT_SECRET'),
  editorAdminPassword: readOptionalString('EDITOR_ADMIN_PASSWORD'),
  editorSessionSecret: readOptionalString('EDITOR_SESSION_SECRET'),
  githubContentToken: readOptionalString('GITHUB_CONTENT_TOKEN'),
  githubContentOwner: readOptionalString('GITHUB_CONTENT_OWNER'),
  githubContentRepo: readOptionalString('GITHUB_CONTENT_REPO'),
  githubContentBranch: readOptionalString('GITHUB_CONTENT_BRANCH'),
  githubContentRoot: readOptionalString('GITHUB_CONTENT_ROOT'),
} as const

export const isDevelopment = env.nodeEnv === 'development'
export const isProduction = env.nodeEnv === 'production'
export const isEditorGithubStorage =
  !!env.githubContentOwner &&
  !!env.githubContentRepo &&
  !!env.githubContentBranch

export const getRequiredOsuApiCredentials = () => {
  if (!env.osuClientId || !env.osuClientSecret) {
    throw new Error(
      'osu! API credentials are missing. Please set OSU_CLIENT_ID and OSU_CLIENT_SECRET environment variables.',
    )
  }

  return {
    clientId: env.osuClientId,
    clientSecret: env.osuClientSecret,
  }
}

export const getRequiredEditorAdminCredentials = () => {
  if (!env.editorAdminPassword || !env.editorSessionSecret) {
    throw new Error(
      'Editor admin credentials are missing. Please set EDITOR_ADMIN_PASSWORD and EDITOR_SESSION_SECRET.',
    )
  }

  return {
    password: env.editorAdminPassword,
    sessionSecret: env.editorSessionSecret,
  }
}
