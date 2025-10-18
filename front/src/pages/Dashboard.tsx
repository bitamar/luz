import { Badge, Card, Container, Divider, Group, rem, SimpleGrid, Title } from '@mantine/core';
import { PageTitle } from '../components/PageTitle';

export function Dashboard() {
  return (
    <Container size="lg" mt="xl">
      <Group justify="space-between" mb="md">
        <PageTitle order={3}>דאשבורד</PageTitle>
        <Group>
          <Badge variant="dot" size="lg">
            היום
          </Badge>
          <Badge variant="light" size="lg" color="teal">
            פעיל
          </Badge>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <StatCard title="ביקורים היום" value="12.4k" delta="+8%" />
        <StatCard title="הזמנות חדשות" value="312" delta="+3%" />
        <StatCard title="שיעור המרה" value="4.1%" delta="-0.4%" negative />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="md">
        <Card withBorder radius="lg" p="lg">
          <Title order={5} mb="xs">
            אירועים קרובים
          </Title>
          <Divider mb="sm" />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ paddingBlock: rem(6) }}>🗓️ פגישת לקוח — 12:30</li>
            <li style={{ paddingBlock: rem(6) }}>📦 מעקב משלוח — 15:00</li>
            <li style={{ paddingBlock: rem(6) }}>💬 שיחת תמיכה — 17:15</li>
          </ul>
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Title order={5} mb="xs">
            סיכום היום
          </Title>
          <Divider mb="sm" />
          <p style={{ margin: 0, opacity: 0.8 }}>
            זהו תוכן הדגמה להמחשת פריסת הדף במצב כתיבה מימין לשמאל.
          </p>
        </Card>
      </SimpleGrid>
    </Container>
  );
}

function StatCard({
  title,
  value,
  delta,
  negative,
}: {
  title: string;
  value: string;
  delta: string;
  negative?: boolean;
}) {
  return (
    <Card withBorder radius="lg" p="lg">
      <Group justify="space-between" mb="xs">
        <Title order={6} style={{ opacity: 0.8 }}>
          {title}
        </Title>
        <Badge color={negative ? 'red' : 'teal'} variant="light">
          {delta}
        </Badge>
      </Group>
      <Title order={2}>{value}</Title>
    </Card>
  );
}
