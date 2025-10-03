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
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconPawFilled,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import { useAuth } from './auth/AuthContext';
import { Link } from 'react-router-dom';

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
          {/*<ActionIcon variant="subtle">*/}
          {/*  <IconBell size={18} />*/}
          {/*</ActionIcon>*/}
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
              <Menu.Item component={Link} to="/settings" leftSection={<IconSettings size={16} />}>
                הגדרות
              </Menu.Item>

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
