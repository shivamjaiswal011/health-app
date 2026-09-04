import { Alert } from 'react-native';

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * For reads whose failure degrades the screen but does not lose anything — a missing
 * ghost value, an unavailable chart. Logged for diagnosis, not shown to the user.
 */
export function reportFailure(operation: string, cause: unknown): void {
  console.error(`${operation} failed: ${describe(cause)}`);
}

/**
 * For writes. A logged set that silently failed to save is the worst defect this app
 * could ship — the lifter walks away believing the work was recorded. Failures here
 * are always surfaced, never swallowed.
 */
export function announceFailure(operation: string, cause: unknown): void {
  reportFailure(operation, cause);
  Alert.alert('Could not save', `${operation} failed. ${describe(cause)}`);
}
