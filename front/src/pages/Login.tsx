import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { loginWithGoogle, user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container size="xs" mt="xl">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack>
          <Title order={2} ta="center">
            Welcome
          </Title>
          <Text ta="center" c="dimmed">
            Sign in to continue
          </Text>
          <Group justify="center" mt="md">
            <Button
              leftSection={<IconBrandGoogle size={18} />}
              onClick={loginWithGoogle}
              variant="filled"
            >
              Sign in with Google
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
