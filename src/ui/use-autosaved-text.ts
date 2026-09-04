import { useEffect, useRef, useState } from 'react';

const AUTOSAVE_DELAY_MS = 500;

type AutosavedText = {
  value: string;
  onChangeText: (next: string) => void;
};

/**
 * A text field that saves itself shortly after typing stops, and flushes anything
 * still pending when the screen goes away.
 *
 * The flush is the point: saving only on blur loses the last edit when the user
 * navigates straight from the keyboard, which is exactly how people leave a form.
 */
export function useAutosavedText(initialValue: string, save: (value: string) => void): AutosavedText {
  const [value, setValue] = useState(initialValue);
  const saveRef = useRef(save);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsaved = useRef<string | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(
    () => () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      if (unsaved.current !== null) saveRef.current(unsaved.current);
    },
    [],
  );

  function onChangeText(next: string) {
    setValue(next);
    unsaved.current = next;
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      saveRef.current(next);
      unsaved.current = null;
    }, AUTOSAVE_DELAY_MS);
  }

  return { value, onChangeText };
}
