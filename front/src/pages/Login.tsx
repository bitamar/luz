import { Button, Card, Center, Group, Stack, Text, Title } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { IconBrandGoogle, IconPawFilled } from '@tabler/icons-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { loginWithGoogle, user } = useAuth();

  if (user) return <Navigate to="/" replace />;

  return (
    <Center style={{ minHeight: 'calc(100dvh - 56px)' }}>
      <Card dir="rtl" shadow="sm" padding="lg" radius="md" withBorder w={360}>
        <Stack>
          <Title order={5} ta="center">
            kalimere::vet <IconPawFilled />
          </Title>
          <Text ta="center" c="dimmed">
            בשביל להמשיך צריך להתחבר עם Google
          </Text>
          <Group justify="center" mt="md">
            <Button
              leftSection={<IconBrandGoogle size={18} />}
              onClick={loginWithGoogle}
              variant="filled"
            >
              התחברות באמצעות Google
            </Button>
          </Group>
        </Stack>
      </Card>
    </Center>
  );
}
