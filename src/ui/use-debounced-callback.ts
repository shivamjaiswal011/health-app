import { useEffect, useRef } from 'react';

/**
 * Calls `save` once the caller stops calling for `delayMs`, and flushes anything still
 * pending when the component unmounts.
 *
 * The flush is the part that matters: without it, the last edit is lost whenever the
 * user navigates away immediately after typing, which is how people actually leave a
 * screen.
 */
export function useDebouncedCallback<T>(save: (value: T) => void, delayMs: number) {
  const saveRef = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsaved = useRef<{ value: T } | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (unsaved.current) saveRef.current(unsaved.current.value);
    },
    [],
  );

  return function call(value: T) {
    unsaved.current = { value };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveRef.current(value);
      unsaved.current = null;
    }, delayMs);
  };
}
