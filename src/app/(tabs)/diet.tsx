import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';

export default function DietScreen() {
  return (
    <Screen title="Diet">
      <EmptyState
        title="Nothing logged"
        message="Food search and meal logging arrive in M4, once the bundled IFCT and USDA database is built."
      />
    </Screen>
  );
}
