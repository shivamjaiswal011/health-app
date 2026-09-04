import { useEffect, useState } from 'react';

import { seedExerciseCatalogue } from './seed-exercises';

type SeedState = {
  seeded: boolean;
  error: Error | null;
};

const NOT_STARTED: SeedState = { seeded: false, error: null };

/**
 * Seeds the exercise catalogue once the schema is ready. Gated on `afterMigrations`
 * because seeding writes to tables the migration creates.
 */
export function useCatalogueSeed(afterMigrations: boolean): SeedState {
  const [state, setState] = useState<SeedState>(NOT_STARTED);

  useEffect(() => {
    if (!afterMigrations) return;

    let abandoned = false;
    seedExerciseCatalogue()
      .then(() => {
        if (!abandoned) setState({ seeded: true, error: null });
      })
      .catch((cause: Error) => {
        if (!abandoned) setState({ seeded: false, error: cause });
      });

    return () => {
      abandoned = true;
    };
  }, [afterMigrations]);

  return state;
}
