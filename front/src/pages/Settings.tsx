import { useEffect, useState } from 'react';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { getSettings, updateSettings } from '../auth/api';

export function Settings() {
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
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
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
        <TextInput
          label="שם"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="טלפון"
          required
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
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
