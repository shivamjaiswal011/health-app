import { Screen } from '@/ui/screen';
import { EmptyState } from '@/ui/empty-state';

export default function WorkoutsScreen() {
  return (
    <Screen title="Train">
      <EmptyState
        title="No workouts yet"
        message="Routine building and set logging land in M2. The schema behind this screen is already in place."
      />
    </Screen>
  );
}
