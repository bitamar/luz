import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Stack,
  Switch,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { getSettings, updateSettings } from '../auth/api';

export function Settings() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSettings();
        if (!cancelled) {
          setName(data.user.name ?? '');
          setPhone(data.user.phone ?? '');
        }
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : 'failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateSettings({ name: name.trim() ? name.trim() : null, phone: phone.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="md">
        <Title order={3}>הגדרות משתמש</Title>
        <Switch
          checked={colorScheme === 'dark'}
          onChange={({ currentTarget }) => setColorScheme(currentTarget.checked ? 'dark' : 'light')}
          onLabel={<IconMoon size={14} />}
          offLabel={<IconSun size={14} />}
        />
        <TextInput
          label="שם"
          required
          value={name}
          onChange={({ currentTarget }) => setName(currentTarget.value)}
        />
        <TextInput
          label="טלפון"
          required
          value={phone}
          onChange={({ currentTarget }) => setPhone(currentTarget.value)}
        />
        {error && <div style={{ color: 'var(--mantine-color-red-6)' }}>{error}</div>}
        <Group justify="flex-end">
          <Button type="submit" loading={loading} disabled={!phone.trim()}>
            שמירה
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
