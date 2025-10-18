import { useEffect, useState } from 'react';
import { Group, Loader, Paper, Portal, Text, Transition } from '@mantine/core';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

const HIDE_DELAY_MS = 300;

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const busy = isFetching + isMutating > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (busy) {
      setVisible(true);
    } else {
      timeout = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [busy]);

  return (
    <Portal>
      <Transition mounted={visible} transition="slide-down" duration={150} timingFunction="ease">
        {(styles) => (
          <Paper
            shadow="lg"
            radius="xl"
            withBorder
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 2000,
              ...styles,
            }}
          >
            <Group gap="xs" p="sm">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                טוען נתונים...
              </Text>
            </Group>
          </Paper>
        )}
      </Transition>
    </Portal>
  );
}
