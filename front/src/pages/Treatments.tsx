import { useEffect, useMemo, useState } from 'react';
import {
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

  function openEdit(t: Treatment) {
    setEditId(t.id);
    setName(t.name);
    setDefaultIntervalMonths(t.defaultIntervalMonths ?? '');
    setPrice(t.price ?? '');
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
      treatments.map((t) => (
        <Card key={t.id} withBorder shadow="sm" padding="lg">
          <Group justify="space-between" mb="xs">
            <Title order={4}>{t.name}</Title>
            {typeof t.price === 'number' && (
              <Badge variant="light">
                {(t.price / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            {typeof t.defaultIntervalMonths === 'number'
              ? `Default interval: ${t.defaultIntervalMonths} months`
              : 'No default interval'}
          </Text>
          <Group justify="right" mt="md">
            <Button size="xs" variant="light" onClick={() => openEdit(t)}>
              Edit
            </Button>
            <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(t.id)}>
              Delete
            </Button>
          </Group>
        </Card>
      )),
    [treatments]
  );

  return (
    <Container size="lg" mt="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Treatments</Title>
        <Button onClick={openCreate} disabled={loading}>
          New treatment
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {cards}
      </SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit treatment' : 'New treatment'}
      >
        <Stack>
          <TextInput
            label="Name"
            value={name}
            onChange={({ currentTarget }) => setName(currentTarget.value)}
            required
          />
          <NumberInput
            label="Default interval (months)"
            value={defaultIntervalMonths}
            onChange={(val) => setDefaultIntervalMonths(typeof val === 'number' ? val : '')}
            min={0}
            clampBehavior="strict"
          />
          <NumberInput
            label="Price (in cents)"
            value={price}
            onChange={(val) => setPrice(typeof val === 'number' ? val : '')}
            min={0}
            clampBehavior="strict"
            leftSection={<Text size="sm">$</Text>}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>{editId ? 'Save' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
