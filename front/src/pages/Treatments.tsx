import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  listTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  type Treatment,
} from '../api/treatments';
import { IconX } from '@tabler/icons-react';

export function Treatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [defaultIntervalMonths, setDefaultIntervalMonths] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listTreatments();
      setTreatments(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditId(null);
    setName('');
    setDefaultIntervalMonths('');
    setPrice('');
    setModalOpen(true);
  }

  function openEdit({
    id,
    name,
    defaultIntervalMonths,
    price,
  }: Pick<Treatment, 'id' | 'name' | 'defaultIntervalMonths' | 'price'>) {
    setEditId(id);
    setName(name);
    setDefaultIntervalMonths(defaultIntervalMonths ?? '');
    setPrice(price ?? '');
    setModalOpen(true);
  }

  async function onSubmit() {
    if (!name) return;
    const payload = {
      name,
      defaultIntervalMonths:
        typeof defaultIntervalMonths === 'number' ? defaultIntervalMonths : null,
      price: typeof price === 'number' ? price : null,
    };
    if (!editId) {
      await createTreatment(payload);
    } else {
      await updateTreatment(editId, payload);
    }
    setModalOpen(false);
    await refresh();
  }

  async function onDelete(id: string) {
    await deleteTreatment(id);
    await refresh();
  }

  const cards = useMemo(
    () =>
      treatments.map(({ id, name, price, defaultIntervalMonths }) => {
        const hasPrice = typeof price === 'number';

        return (
          <Card
            key={id}
            withBorder
            shadow="sm"
            radius="md"
            padding="md"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Group justify="space-between" align="center" mb="sm">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                aria-label="מחק"
                onClick={() => onDelete(id)}
              >
                <IconX size={16} />
              </ActionIcon>

              {hasPrice && (
                <Badge variant="light" size="sm" color="blue">
                  {price.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Badge>
              )}
            </Group>

            <Stack gap="xs" style={{ flexGrow: 1 }}>
              <Title order={4} style={{ wordBreak: 'break-word' }}>
                {name}
              </Title>
              <Text c="dimmed" size="sm">
                {typeof defaultIntervalMonths === 'number'
                  ? `מרווח ברירת מחדל: ${defaultIntervalMonths} חודשים`
                  : 'חד פעמי'}
              </Text>
            </Stack>

            <Group justify="flex-end" mt="md">
              <Button
                size="xs"
                variant="light"
                onClick={() => openEdit({ id, name, price, defaultIntervalMonths })}
              >
                ערוך
              </Button>
            </Group>
          </Card>
        );
      }),
    [treatments]
  );

  return (
    <Container size="lg" mt="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>סוגי טיפולים</Title>
        <Button onClick={openCreate} disabled={loading}>
          טיפול חדש
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {cards}
      </SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'עריכת טיפול' : 'טיפול חדש'}
      >
        <Stack>
          <TextInput
            label="שם"
            value={name}
            onChange={({ currentTarget }) => setName(currentTarget.value)}
            required
          />
          <NumberInput
            label="מרווח ברירת מחדל (חודשים)"
            value={defaultIntervalMonths}
            onChange={(val) => setDefaultIntervalMonths(typeof val === 'number' ? val : '')}
            min={0}
            clampBehavior="strict"
          />
          <NumberInput
            label="מחיר"
            value={price}
            onChange={(val) => setPrice(typeof val === 'number' ? val : '')}
            min={0}
            clampBehavior="strict"
            leftSection={<Text size="sm">₪</Text>}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={onSubmit}>{editId ? 'שמור' : 'הוסף'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
