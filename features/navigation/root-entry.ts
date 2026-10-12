export function resolveRootDestination(hasSession: boolean) {
  return hasSession ? '/home' : '/login';
}
