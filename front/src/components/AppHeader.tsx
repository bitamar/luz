import { Burger, Container, Drawer, Group, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';

export function AppHeader() {
  const [opened, { close, toggle }] = useDisclosure(false);
  return (
    <Container size="lg" style={{ height: '100%' }}>
      <Group align="center" justify="space-between" style={{ height: '100%' }}>
        <Title order={3}>Luz</Title>
        <Burger opened={opened} onClick={toggle} aria-label="Menu" hiddenFrom="sm" />
        <Group visibleFrom="sm" gap="md">
          <Link to="/">Dashboard</Link>
          <Link to="/treatments">Treatments</Link>
        </Group>
      </Group>
      <Drawer opened={opened} onClose={close} title="Menu" padding="md" size="xs">
        <Stack gap="md">
          <Link to="/" onClick={close}>Dashboard</Link>
          <Link to="/treatments" onClick={close}>Treatments</Link>
        </Stack>
      </Drawer>
    </Container>
  );
}
