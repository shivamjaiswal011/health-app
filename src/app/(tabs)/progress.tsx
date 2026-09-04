import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';

export default function ProgressScreen() {
  return (
    <Screen title="Progress">
      <EmptyState
        title="Nothing to chart yet"
        message="Strength and body-weight trends appear here in M5, once there is history to plot."
      />
    </Screen>
  );
}
