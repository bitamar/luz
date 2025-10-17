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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../auth/api';
import { StatusCard } from '../components/StatusCard';
import { queryKeys } from '../lib/queryKeys';
import type { SettingsResponse } from '@contracts/users';
import { extractErrorMessage } from '../lib/notifications';
import { useApiMutation } from '../lib/useApiMutation';

export function Settings() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: ({ signal }: { signal: AbortSignal }) => getSettings({ signal }),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setName(settingsQuery.data.user.name ?? '');
      setPhone(settingsQuery.data.user.phone ?? '');
    }
  }, [settingsQuery.data]);

  const updateSettingsMutation = useApiMutation({
    mutationFn: updateSettings,
    successToast: { message: 'ההגדרות נשמרו בהצלחה' },
    errorToast: { fallbackMessage: 'שמירת ההגדרות נכשלה' },
    onSuccess: (data: SettingsResponse) => {
      queryClient.setQueryData(queryKeys.settings(), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });

  if (settingsQuery.isPending) {
    return (
      <Stack gap="md">
        <StatusCard status="loading" title="טוען הגדרות..." align="start" />
      </Stack>
    );
  }

  if (settingsQuery.error) {
    const message = extractErrorMessage(settingsQuery.error, 'אירעה שגיאה בטעינת ההגדרות');
    return (
      <Stack gap="md">
        <StatusCard
          status="error"
          title="לא ניתן להציג את ההגדרות כעת"
          description={message}
          align="start"
          primaryAction={{ label: 'נסה שוב', onClick: () => void settingsQuery.refetch() }}
        />
      </Stack>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsMutation.mutateAsync({
      name: name.trim() ? name.trim() : null,
      phone: phone.trim(),
    });
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
        <Group justify="flex-end">
          <Button type="submit" loading={updateSettingsMutation.isPending} disabled={!phone.trim()}>
            שמירה
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
