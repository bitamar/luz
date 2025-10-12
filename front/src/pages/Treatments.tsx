import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
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
import { useListState } from '../hooks/useListState';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';

export function Treatments() {
  const {
    data: treatments,
    loading,
    error,
    refresh,
    isEmpty,
  } = useListState<Treatment[]>({
    fetcher: listTreatments,
    getEmpty: (rows) => rows.length === 0,
    formatError: () => 'אירעה שגיאה בטעינת הטיפולים',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [defaultIntervalMonths, setDefaultIntervalMonths] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');

  useEffect(() => {
    if (treatments === null) {
      void refresh();
    }
  }, [treatments, refresh]);

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

  function openDeleteModal(treatment: Treatment) {
    setTreatmentToDelete(treatment);
    setDeleteModalOpen(true);
  }

  async function onDeleteTreatment() {
    if (!treatmentToDelete) return;
    await deleteTreatment(treatmentToDelete.id);
    setDeleteModalOpen(false);
    setTreatmentToDelete(null);
    await refresh();
  }

  const cards = useMemo(
    () =>
      (treatments ?? []).map((treatment) => {
        const { id, name, price, defaultIntervalMonths } = treatment;
        const hasPrice = typeof price === 'number';

        return (
          <EntityCard
            key={id}
            id={id}
            title={name}
            subtitle={
              typeof defaultIntervalMonths === 'number'
                ? `מרווח ברירת מחדל: ${defaultIntervalMonths} חודשים`
                : 'חד פעמי'
            }
            badge={
              hasPrice && (
                <Badge key="price" variant="light" size="sm" color="blue">
                  {price.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Badge>
              )
            }
            deleteAction={{
              label: 'מחק טיפול',
              onClick: () => openDeleteModal(treatment),
            }}
            editAction={() => openEdit({ id, name, price, defaultIntervalMonths })}
            className="treatment-card"
          />
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

      {loading ? (
        <StatusCard status="loading" title="טוען טיפולים..." />
      ) : error ? (
        <StatusCard
          status="error"
          title="לא ניתן להציג טיפולים כעת"
          description={error}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refresh() }}
        />
      ) : isEmpty ? (
        <StatusCard
          status="empty"
          title="אין עדיין טיפולים"
          description='לחץ על "טיפול חדש" כדי ליצור טיפול ראשון.'
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {cards}
        </SimpleGrid>
      )}

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

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="מחיקת טיפול">
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את הטיפול "{treatmentToDelete?.name}"? פעולה זו אינה ניתנת
            לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button color="red" onClick={onDeleteTreatment}>
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
