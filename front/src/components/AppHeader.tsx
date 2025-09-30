import { Container, Group, Title } from '@mantine/core';

export function AppHeader() {
  return (
    <Container size="lg" style={{ height: '100%' }}>
      <Group align="center" justify="space-between" style={{ height: '100%' }}>
        <Title order={3}>doltl</Title>
      </Group>
    </Container>
  );
}
