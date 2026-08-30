import type { Middleware } from '@reduxjs/toolkit';

export interface LoggedAction {
  readonly id: number;
  readonly type: string;
  readonly at: number;
}

const LIMIT = 30;

/**
 * The log deliberately lives OUTSIDE Redux. Recording actions into a slice would
 * dispatch an action per action and recurse forever, so this is a plain
 * subscribable buffer that React reads with useSyncExternalStore.
 *
 * A factory returning closures -- no class, no `this`.
 */
const createActionLog = () => {
  let entries: readonly LoggedAction[] = [];
  let sequence = 0;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((notify) => notify());

  return {
    record: (type: string) => {
      sequence += 1;
      entries = [{ id: sequence, type, at: Date.now() }, ...entries].slice(0, LIMIT);
      emit();
    },
    clear: () => {
      entries = [];
      emit();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Stable reference between records, which useSyncExternalStore requires.
    getSnapshot: () => entries,
  };
};

export const actionLog = createActionLog();

/** Server render has no history to show, and the reference must stay stable. */
const EMPTY: readonly LoggedAction[] = [];
export const getServerSnapshot = () => EMPTY;

export const actionLogMiddleware: Middleware = () => (next) => (action) => {
  actionLog.record((action as { type?: string }).type ?? 'unknown');
  return next(action);
};
