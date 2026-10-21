let generation = 0
let transitionInProgress = false

export interface RequestSessionSnapshot {
  generation: number
  refreshAllowed: boolean
}

export function getSessionGeneration(): number {
  return generation
}

export function beginSessionTransition(): number {
  generation += 1
  transitionInProgress = true
  return generation
}

export function finishSessionTransition(expectedGeneration: number): void {
  if (generation === expectedGeneration) transitionInProgress = false
}

export function captureRequestSession(): RequestSessionSnapshot {
  return { generation, refreshAllowed: !transitionInProgress }
}

export function isRefreshAllowedForSession(
  requestGeneration: number,
  allowedAtDispatch: boolean,
): boolean {
  return (
    allowedAtDispatch &&
    !transitionInProgress &&
    generation === requestGeneration
  )
}

export function isSessionTransitionInProgress(): boolean {
  return transitionInProgress
}
