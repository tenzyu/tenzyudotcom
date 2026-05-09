import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type VsaConfig = {
  architecture?: {
    appRoots?: string[]
    featureMarker?: string
    promotionRoots?: string[]
    routeFeatureAllowances?: Record<string, string[]>
    sharedRoots?: string[]
    utilityRoots?: string[]
  }
  forbiddenFiles?: string[]
  serverActionGuards?: {
    authGuardIdentifiers?: string[]
    serverActionExceptions?: string[]
    serverActionRoots?: string[]
  }
  restrictedImportUsage?: {
    nextServerApiAllowedPrefixes?: string[]
    storageOwnerRoots?: string[]
    zodAllowedPrefixes?: string[]
    zodAllowedSuffixes?: string[]
  }
  siteRules?: {
    authGuardIdentifiers?: string[]
    forbiddenFiles?: string[]
    nextServerApiAllowedPrefixes?: string[]
    serverActionExceptions?: string[]
    serverActionRoots?: string[]
    storageOwnerRoots?: string[]
    zodAllowedPrefixes?: string[]
    zodAllowedSuffixes?: string[]
  }
}

export type ResolvedVsaConfig = {
  architecture: {
    appRoots: string[]
    featureMarker: string
    promotionRoots: string[]
    routeFeatureAllowances: Record<string, string[]>
    sharedRoots: string[]
    utilityRoots: string[]
  }
  forbiddenFiles: string[]
  serverActionGuards: {
    authGuardIdentifiers: string[]
    serverActionExceptions: string[]
    serverActionRoots: string[]
  }
  restrictedImportUsage: {
    nextServerApiAllowedPrefixes: string[]
    storageOwnerRoots: string[]
    zodAllowedPrefixes: string[]
    zodAllowedSuffixes: string[]
  }
}

const DEFAULT_CONFIG: ResolvedVsaConfig = {
  architecture: {
    appRoots: ['src/app'],
    featureMarker: '_features',
    promotionRoots: ['src/features', 'src/lib'],
    routeFeatureAllowances: {},
    sharedRoots: ['src/features', 'src/components'],
    utilityRoots: ['src/lib', 'src/config'],
  },
  forbiddenFiles: ['middleware.ts', 'src/middleware.ts'],
  serverActionGuards: {
    authGuardIdentifiers: ['hasEditorAdminSession', 'requireEditorAdminSession'],
    serverActionExceptions: [],
    serverActionRoots: ['src/app'],
  },
  restrictedImportUsage: {
    nextServerApiAllowedPrefixes: ['src/app/'],
    storageOwnerRoots: ['src/lib/content-store/', 'src/lib/editor/'],
    zodAllowedPrefixes: [],
    zodAllowedSuffixes: ['.assemble.ts', '.infra.ts'],
  },
}

export function loadVsaConfig(projectRoot: string): ResolvedVsaConfig {
  const configPath = path.join(projectRoot, 'vsa.config.json')

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG
  }

  const rawConfig = JSON.parse(readFileSync(configPath, 'utf8')) as VsaConfig
  const legacySiteRules = rawConfig.siteRules ?? {}

  return {
    architecture: {
      ...DEFAULT_CONFIG.architecture,
      ...rawConfig.architecture,
      routeFeatureAllowances: {
        ...DEFAULT_CONFIG.architecture.routeFeatureAllowances,
        ...(rawConfig.architecture?.routeFeatureAllowances ?? {}),
      },
    },
    forbiddenFiles:
      rawConfig.forbiddenFiles ??
      legacySiteRules.forbiddenFiles ??
      DEFAULT_CONFIG.forbiddenFiles,
    serverActionGuards: {
      ...DEFAULT_CONFIG.serverActionGuards,
      ...legacySiteRules,
      ...rawConfig.serverActionGuards,
    },
    restrictedImportUsage: {
      ...DEFAULT_CONFIG.restrictedImportUsage,
      ...legacySiteRules,
      ...rawConfig.restrictedImportUsage,
    },
  }
}
