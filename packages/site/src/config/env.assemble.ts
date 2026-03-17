import { env, isDevelopment } from './env.infra'

export function shouldLoadReactGrabOverlay() {
  return isDevelopment && env.enableReactGrabOverlay
}
