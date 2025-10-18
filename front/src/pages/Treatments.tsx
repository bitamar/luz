import { useMemo, useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  type Treatment,
  type UpdateTreatmentBody,
} from '../api/treatments';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';
import { queryKeys } from '../lib/queryKeys';
import { extractErrorMessage } from '../lib/notifications';
import { useApiMutation } from '../lib/useApiMutation';
import type { SettingsResponse } from '@kalimere/types/users';

const sortTreatments = (rows: Treatment[]) =>
  [...rows].sort((a, b) => a.name.localeCompare(b.name, 'he-IL'));

export function Treatments() {
  const queryClient = useQueryClient();
  const treatmentsQueryKey = queryKeys.treatments();
  const {
    data: treatments = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: treatmentsQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => listTreatments({ signal }),
    select: sortTreatments,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [defaultIntervalMonths, setDefaultIntervalMonths] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');

  const applyTreatmentUpdates = (
    treatment: Treatment,
    payload: UpdateTreatmentBody
  ): Treatment => ({
    ...treatment,
    name: payload.name ?? treatment.name,
    defaultIntervalMonths:
      payload.defaultIntervalMonths !== undefined
        ? payload.defaultIntervalMonths
        : treatment.defaultIntervalMonths,
    price: payload.price !== undefined ? payload.price : treatment.price,
  });

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

  const createTreatmentMutation = useApiMutation({
    mutationFn: createTreatment,
    successToast: { message: 'הטיפול נוצר בהצלחה' },
    errorToast: { fallbackMessage: 'יצירת הטיפול נכשלה' },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: treatmentsQueryKey });
      const previousTreatments = queryClient.getQueryData<Treatment[]>(treatmentsQueryKey) ?? [];
      const authData = queryClient.getQueryData<SettingsResponse | null>(queryKeys.me());
      const optimisticTreatment: Treatment = {
        id: `optimistic-${Date.now()}`,
        userId: authData?.user.id ?? 'optimistic-user',
        name: payload.name,
        defaultIntervalMonths: payload.defaultIntervalMonths ?? null,
        price: payload.price ?? null,
      };
      queryClient.setQueryData<Treatment[]>(treatmentsQueryKey, (old = []) =>
        sortTreatments([
          ...old.filter((item) => item.id !== optimisticTreatment.id),
          optimisticTreatment,
        ])
      );
      return { previousTreatments, optimisticId: optimisticTreatment.id };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(treatmentsQueryKey, context?.previousTreatments ?? []);
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Treatment[]>(treatmentsQueryKey, (old = []) => {
        const withoutOptimistic = context?.optimisticId
          ? old.filter((item) => item.id !== context.optimisticId)
          : old;
        return sortTreatments([...withoutOptimistic, data]);
      });
      setModalOpen(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: treatmentsQueryKey });
    },
  });

  const updateTreatmentMutation = useApiMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTreatmentBody }) =>
      updateTreatment(id, payload),
    successToast: { message: 'הטיפול עודכן בהצלחה' },
    errorToast: { fallbackMessage: 'עדכון הטיפול נכשל' },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: treatmentsQueryKey });
      const previousTreatments = queryClient.getQueryData<Treatment[]>(treatmentsQueryKey) ?? [];
      queryClient.setQueryData<Treatment[]>(treatmentsQueryKey, (old = []) =>
        sortTreatments(
          old.map((treatment) =>
            treatment.id === id ? applyTreatmentUpdates(treatment, payload) : treatment
          )
        )
      );
      return { previousTreatments };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(treatmentsQueryKey, context?.previousTreatments ?? []);
    },
    onSuccess: (data, variables) => {
      if (!variables) {
        setModalOpen(false);
        return;
      }
      const { id, payload } = variables;
      queryClient.setQueryData<Treatment[]>(treatmentsQueryKey, (old = []) =>
        sortTreatments(
          old.map((treatment) =>
            treatment.id === (data?.id ?? id)
              ? (data ?? applyTreatmentUpdates(treatment, payload))
              : treatment
          )
        )
      );
      setModalOpen(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: treatmentsQueryKey });
    },
  });

  function openDeleteModal(treatment: Treatment) {
    setTreatmentToDelete(treatment);
    setDeleteModalOpen(true);
  }

  const deleteTreatmentMutation = useApiMutation({
    mutationFn: deleteTreatment,
    successToast: { message: 'הטיפול נמחק' },
    errorToast: { fallbackMessage: 'מחיקת הטיפול נכשלה' },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: treatmentsQueryKey });
      const previousTreatments = queryClient.getQueryData<Treatment[]>(treatmentsQueryKey) ?? [];
      queryClient.setQueryData<Treatment[]>(treatmentsQueryKey, (old = []) =>
        old.filter((treatment) => treatment.id !== id)
      );
      return { previousTreatments };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(treatmentsQueryKey, context?.previousTreatments ?? []);
    },
    onSuccess: () => {
      setDeleteModalOpen(false);
      setTreatmentToDelete(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: treatmentsQueryKey });
    },
  });

  async function onSubmit() {
    if (!name) return;
    const payload = {
      name,
      defaultIntervalMonths:
        typeof defaultIntervalMonths === 'number' ? defaultIntervalMonths : null,
      price: typeof price === 'number' ? price : null,
    };
    if (!editId) {
      await createTreatmentMutation.mutateAsync(payload);
    } else {
      await updateTreatmentMutation.mutateAsync({ id: editId, payload });
    }
  }

  const cards = useMemo(
    () =>
      treatments.map((treatment: Treatment) => {
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

  const loading = isPending;
  const queryError = isError ? extractErrorMessage(error, 'אירעה שגיאה בטעינת הטיפולים') : null;
  const isEmpty = !loading && !queryError && treatments.length === 0;
  const mutationInFlight =
    createTreatmentMutation.isPending ||
    updateTreatmentMutation.isPending ||
    deleteTreatmentMutation.isPending;

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
      ) : queryError ? (
        <StatusCard
          status="error"
          title="לא ניתן להציג טיפולים כעת"
          description={queryError}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refetch() }}
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
            <Button onClick={onSubmit} loading={mutationInFlight} disabled={!name}>
              {editId ? 'שמור' : 'הוסף'}
            </Button>
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
            <Button
              color="red"
              onClick={() =>
                treatmentToDelete && deleteTreatmentMutation.mutate(treatmentToDelete.id)
              }
              loading={deleteTreatmentMutation.isPending}
            >
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
