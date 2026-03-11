import { env, isDevelopment } from './env.contract'

export function shouldLoadReactGrabOverlay() {
  return isDevelopment && env.enableReactGrabOverlay
}
