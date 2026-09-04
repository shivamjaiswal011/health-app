import { useState } from 'react';

import { useDebouncedCallback } from './use-debounced-callback';

const AUTOSAVE_DELAY_MS = 500;

type AutosavedText = {
  value: string;
  onChangeText: (next: string) => void;
};

/** A text field that saves itself shortly after typing stops, and on the way out. */
export function useAutosavedText(
  initialValue: string,
  save: (value: string) => void,
): AutosavedText {
  const [value, setValue] = useState(initialValue);
  const saveSoon = useDebouncedCallback(save, AUTOSAVE_DELAY_MS);

  function onChangeText(next: string) {
    setValue(next);
    saveSoon(next);
  }

  return { value, onChangeText };
}
