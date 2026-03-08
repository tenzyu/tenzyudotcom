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

const readNodeEnv = (): NodeEnv => {
  const value = process.env.NODE_ENV
  if (NODE_ENV_VALUES.includes(value as NodeEnv)) {
    return value as NodeEnv
  }

  return 'development'
}

export const env = {
  nodeEnv: readNodeEnv(),
  reactEditor: readOptionalString('REACT_EDITOR'),
  youtubeDataApiKey: readOptionalString('YOUTUBE_DATA_API_KEY'),
  osuClientId: readOptionalInteger('OSU_CLIENT_ID'),
  osuClientSecret: readOptionalString('OSU_CLIENT_SECRET'),
} as const

export const isDevelopment = env.nodeEnv === 'development'
export const isProduction = env.nodeEnv === 'production'

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
