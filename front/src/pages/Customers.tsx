import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomer,
  type Customer,
} from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';
import { formatPetsCount } from '../utils/formatPetsCount';
import { extractErrorMessage } from '../lib/notifications';
import { queryKeys } from '../lib/queryKeys';
import { useApiMutation } from '../lib/useApiMutation';

const sortCustomers = (rows: Customer[]) =>
  [...rows].sort((a, b) => a.name.localeCompare(b.name, 'he-IL'));

export function Customers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customersQueryKey = queryKeys.customers();
  const {
    data: customersData = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: customersQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => listCustomers({ signal }),
    select: sortCustomers,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');

  function openCreateCustomer() {
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setModalOpen(true);
  }

  const createCustomerMutation = useApiMutation({
    mutationFn: createCustomer,
    successToast: { message: 'הלקוח נוסף בהצלחה' },
    errorToast: { fallbackMessage: 'הוספת הלקוח נכשלה' },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKey });
      const previousCustomers = queryClient.getQueryData<Customer[]>(customersQueryKey) ?? [];
      const optimisticCustomer: Customer = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        petsCount: 0,
      };
      queryClient.setQueryData<Customer[]>(customersQueryKey, (old = []) =>
        sortCustomers([
          ...old.filter((customer) => customer.id !== optimisticCustomer.id),
          optimisticCustomer,
        ])
      );
      return { previousCustomers, optimisticId: optimisticCustomer.id };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(customersQueryKey, context?.previousCustomers ?? []);
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Customer[]>(customersQueryKey, (old = []) => {
        const withoutOptimistic = context?.optimisticId
          ? old.filter((customer) => customer.id !== context.optimisticId)
          : old;
        return sortCustomers([...withoutOptimistic, data]);
      });
      setModalOpen(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });

  const deleteCustomerMutation = useApiMutation({
    mutationFn: deleteCustomer,
    successToast: { message: 'הלקוח נמחק' },
    errorToast: { fallbackMessage: 'מחיקת הלקוח נכשלה' },
    onMutate: async (customerId: string) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKey });
      const previousCustomers = queryClient.getQueryData<Customer[]>(customersQueryKey) ?? [];
      queryClient.setQueryData<Customer[]>(customersQueryKey, (old = []) =>
        old.filter((customer) => customer.id !== customerId)
      );
      await queryClient.cancelQueries({ queryKey: queryKeys.customer(customerId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pets(customerId) });
      const previousCustomer = queryClient.getQueryData(queryKeys.customer(customerId));
      const previousPets = queryClient.getQueryData(queryKeys.pets(customerId));
      return { previousCustomers, previousCustomer, previousPets, customerId };
    },
    onError: (_error, _customerId, context) => {
      queryClient.setQueryData(customersQueryKey, context?.previousCustomers ?? []);
      if (context?.customerId) {
        queryClient.setQueryData(queryKeys.customer(context.customerId), context?.previousCustomer);
        queryClient.setQueryData(queryKeys.pets(context.customerId), context?.previousPets);
      }
    },
    onSuccess: (_data, _variables, context) => {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      if (context?.customerId) {
        void queryClient.removeQueries({ queryKey: queryKeys.customer(context.customerId) });
        void queryClient.removeQueries({ queryKey: queryKeys.pets(context.customerId) });
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
      if (context?.customerId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.customer(context.customerId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.pets(context.customerId) });
      }
    },
  });

  async function onCreateCustomer() {
    if (!newCustomerName) return;
    await createCustomerMutation.mutateAsync({
      name: newCustomerName,
      email: newCustomerEmail || null,
      phone: newCustomerPhone || null,
      address: newCustomerAddress || null,
    });
  }

  function openDeleteModal(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  }

  const openEditCustomer = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setEditCustomerName(customer.name);
    setEditCustomerEmail(customer.email ?? '');
    setEditCustomerPhone(customer.phone ?? '');
    setEditCustomerAddress(customer.address ?? '');
    setEditModalOpen(true);
  }, []);

  const updateCustomerMutation = useApiMutation({
    mutationFn: ({ customerId, payload }: { customerId: string; payload: Parameters<typeof updateCustomer>[1] }) =>
      updateCustomer(customerId, payload),
    successToast: { message: 'פרטי הלקוח עודכנו' },
    errorToast: { fallbackMessage: 'עדכון הלקוח נכשל' },
    onMutate: async ({ customerId, payload }) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKey });
      await queryClient.cancelQueries({ queryKey: queryKeys.customer(customerId) });
      const previousCustomers = queryClient.getQueryData<Customer[]>(customersQueryKey) ?? [];
      const customerQueryKey = queryKeys.customer(customerId);
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);

      const applyUpdate = (current: Customer | undefined) => {
        if (!current) return current;
        return {
          ...current,
          name: payload.name ?? current.name,
          email: payload.email !== undefined ? payload.email : current.email,
          phone: payload.phone !== undefined ? payload.phone : current.phone,
          address: payload.address !== undefined ? payload.address : current.address,
        };
      };

      queryClient.setQueryData<Customer[]>(customersQueryKey, (old = []) =>
        sortCustomers(
          old.map((customer) => (customer.id === customerId ? (applyUpdate(customer) as Customer) : customer))
        )
      );

      if (previousCustomer) {
        queryClient.setQueryData<Customer | undefined>(customerQueryKey, applyUpdate(previousCustomer));
      }

      return { previousCustomers, previousCustomer };
    },
    onError: (_error, { customerId }, context) => {
      queryClient.setQueryData(customersQueryKey, context?.previousCustomers ?? []);
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customer(customerId), context.previousCustomer);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Customer[]>(customersQueryKey, (old = []) =>
        sortCustomers(old.map((customer) => (customer.id === data.id ? data : customer)))
      );
      queryClient.setQueryData(queryKeys.customer(data.id), data);
      setEditModalOpen(false);
      setEditingCustomer(null);
    },
    onSettled: (_data, _error, { customerId }) => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
      if (customerId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) });
      }
    },
  });

  async function onUpdateCustomer() {
    if (!editingCustomer) return;
    const trimmedName = editCustomerName.trim();
    if (!trimmedName) return;
    const payload = {
      name: trimmedName,
      email: editCustomerEmail.trim() ? editCustomerEmail.trim() : null,
      phone: editCustomerPhone.trim() ? editCustomerPhone.trim() : null,
      address: editCustomerAddress.trim() ? editCustomerAddress.trim() : null,
    } satisfies Parameters<typeof updateCustomer>[1];
    await updateCustomerMutation.mutateAsync({ customerId: editingCustomer.id, payload });
  }

  async function onDeleteCustomer() {
    if (!customerToDelete) return;
    await deleteCustomerMutation.mutateAsync(customerToDelete.id);
  }

  const customers: Customer[] = customersData ?? [];

  const cards = useMemo(
    () =>
      customers.map((customer) => {
        const { email, id, name, phone, address, petsCount } = customer;

        const contactInfo = (
          <Stack gap={2}>
            {email && (
              <Text size="sm" c="dimmed">
                {email}
              </Text>
            )}
            {phone && (
              <Text size="sm" c="dimmed">
                {phone}
              </Text>
            )}
            {address && (
              <Text size="sm" c="dimmed">
                {address}
              </Text>
            )}
          </Stack>
        );

        return (
          <EntityCard
            key={id}
            id={id}
            title={name}
            badge={
              <Badge key="pet-count" variant="light" size="sm" color="blue">
                {formatPetsCount(petsCount)}
              </Badge>
            }
            deleteAction={{
              label: 'מחק לקוח',
              onClick: () => openDeleteModal(customer),
            }}
            editAction={() => openEditCustomer(customer)}
            onClick={() => navigate(`/customers/${id}`)}
            className="customer-card"
          >
            {contactInfo}
          </EntityCard>
        );
      }),
    [customers, navigate, openEditCustomer]
  );

  const loading = isPending;
  const queryError = isError ? extractErrorMessage(error, 'אירעה שגיאה בטעינת הלקוחות') : null;
  const isEmpty = !loading && !queryError && customers.length === 0;
  const isCreating = createCustomerMutation.isPending;
  const isUpdating = updateCustomerMutation.isPending;

  return (
    <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>לקוחות</Title>
        <Button onClick={openCreateCustomer} disabled={loading}>
          לקוח חדש
        </Button>
      </Group>

      {loading ? (
        <StatusCard status="loading" title="טוען לקוחות..." />
      ) : queryError ? (
        <StatusCard
          status="error"
          title="לא ניתן להציג לקוחות כעת"
          description={queryError}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refetch() }}
        />
      ) : isEmpty ? (
        <StatusCard
          status="empty"
          title="אין עדיין לקוחות"
          description='לחץ על "לקוח חדש" כדי להוסיף את הלקוח הראשון שלך.'
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {cards}
        </SimpleGrid>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="לקוח חדש">
        <Stack>
          <TextInput
            label="שם"
            value={newCustomerName}
            onChange={({ currentTarget }) => setNewCustomerName(currentTarget.value)}
            required
          />
          <TextInput
            label="אימייל"
            type="email"
            value={newCustomerEmail}
            onChange={({ currentTarget }) => setNewCustomerEmail(currentTarget.value)}
          />
          <TextInput
            label="טלפון"
            type="tel"
            value={newCustomerPhone}
            onChange={({ currentTarget }) => setNewCustomerPhone(currentTarget.value)}
          />
          <TextInput
            label="כתובת"
            value={newCustomerAddress}
            onChange={({ currentTarget }) => setNewCustomerAddress(currentTarget.value)}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={onCreateCustomer} disabled={!newCustomerName} loading={isCreating}>
              הוסף
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCustomer(null);
        }}
        title="ערוך לקוח"
      >
        <Stack>
          <TextInput
            label="שם"
            value={editCustomerName}
            onChange={({ currentTarget }) => setEditCustomerName(currentTarget.value)}
            required
          />
          <TextInput
            label="אימייל"
            type="email"
            value={editCustomerEmail}
            onChange={({ currentTarget }) => setEditCustomerEmail(currentTarget.value)}
          />
          <TextInput
            label="טלפון"
            type="tel"
            value={editCustomerPhone}
            onChange={({ currentTarget }) => setEditCustomerPhone(currentTarget.value)}
          />
          <TextInput
            label="כתובת"
            value={editCustomerAddress}
            onChange={({ currentTarget }) => setEditCustomerAddress(currentTarget.value)}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setEditModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={onUpdateCustomer} disabled={!editCustomerName.trim()} loading={isUpdating}>
              עדכן
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="מחיקת לקוח">
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את הלקוח "{customerToDelete?.name}"? פעולה זו אינה ניתנת
            לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button
              color="red"
              onClick={onDeleteCustomer}
              loading={deleteCustomerMutation.isPending}
            >
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
