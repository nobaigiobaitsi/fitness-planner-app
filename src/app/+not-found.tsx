import { router } from 'expo-router';

import { Button } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  return (
    <Screen contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
      <EmptyState
        icon="info"
        title="Page not found"
        message="This part of FitPlanner does not exist or was moved."
      />
      <Button label="Return home" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
    </Screen>
  );
}
