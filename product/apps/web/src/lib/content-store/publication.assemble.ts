import { cache } from 'react'
import { loadGitHubPublication } from './github-content.infra'

export const loadPublication = cache(loadGitHubPublication)
