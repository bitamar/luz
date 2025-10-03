import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Group,
  Menu,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconBell,
  IconChevronDown,
  IconInbox,
  IconLogout,
  IconMoon,
  IconPawFilled,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import { useAuth } from './auth/AuthContext';

export default function Header({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const toggleColorScheme = () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  const { logout } = useAuth();

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger
            opened={opened}
            onClick={() => setOpened((open: boolean) => !open)}
            hiddenFrom="sm"
            size="sm"
          />

          <Title order={6}>
            <IconPawFilled /> KALIMERE
          </Title>
        </Group>

        <Group>
          <ActionIcon variant="subtle">
            <IconBell size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={toggleColorScheme}>
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <Button
                variant="subtle"
                leftSection={<Avatar size={20} radius="xl" />}
                rightSection={<IconChevronDown size={16} />}
              >
                איתמר
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={16} />}>הגדרות</Menu.Item>
              <Menu.Item leftSection={<IconInbox size={16} />}>דואר נכנס</Menu.Item>
              <Divider my="xs" />
              <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={logout}>
                התנתקות
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </AppShell.Header>
  );
}
