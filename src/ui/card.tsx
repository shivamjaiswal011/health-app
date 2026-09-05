import type { ReactNode } from 'react';
import { View } from 'react-native';

import { SectionHeader } from './section-header';

/**
 * Grouping container. The title sits above the card rather than inside it, which keeps
 * the card's own padding uniform and lets a section have a header without the first row
 * being visually different from the rest.
 */
export function Card({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <View>
      {title ? <SectionHeader title={title} action={action} /> : null}
      <View className="rounded-2xl bg-surface-raised px-4">{children}</View>
    </View>
  );
}

/** For content that needs the card's surface but sets its own padding. */
export function BareCard({ children }: { children: ReactNode }) {
  return <View className="overflow-hidden rounded-2xl bg-surface-raised">{children}</View>;
}
