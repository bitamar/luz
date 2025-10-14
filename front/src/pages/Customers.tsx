import { useMemo, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCustomers, createCustomer, deleteCustomer, type Customer } from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';
import { formatPetsCount } from '../utils/formatPetsCount';
import {
  extractErrorMessage,
  showErrorNotification,
  showSuccessNotification,
} from '../lib/notifications';
import { queryKeys } from '../lib/queryKeys';

export function Customers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: customersData = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.customers(),
    queryFn: ({ signal }) => listCustomers({ signal }),
    select: (rows) => [...rows].sort((a, b) => a.name.localeCompare(b.name, 'he-IL')),
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  function openCreateCustomer() {
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setModalOpen(true);
  }

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      showSuccessNotification('הלקוח נוסף בהצלחה');
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
    },
    onError: (err) => {
      showErrorNotification(extractErrorMessage(err, 'הוספת הלקוח נכשלה'));
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      showSuccessNotification('הלקוח נמחק');
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
    },
    onError: (err) => {
      showErrorNotification(extractErrorMessage(err, 'מחיקת הלקוח נכשלה'));
    },
    onSettled: () => {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
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
    setModalOpen(false);
  }

  function openDeleteModal(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  }

  async function onDeleteCustomer() {
    if (!customerToDelete) return;
    await deleteCustomerMutation.mutateAsync(customerToDelete.id);
  }

  const customers = customersData ?? [];

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
            onClick={() => navigate(`/customers/${id}`)}
            className="customer-card"
          >
            {contactInfo}
          </EntityCard>
        );
      }),
    [customers, navigate]
  );

  const loading = isPending;
  const queryError = isError ? extractErrorMessage(error, 'אירעה שגיאה בטעינת הלקוחות') : null;
  const isEmpty = !loading && !queryError && customers.length === 0;
  const isCreating = createCustomerMutation.isPending;

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
            <Button color="red" onClick={onDeleteCustomer} loading={deleteCustomerMutation.isPending}>
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
