import { useEffect, useMemo, useState } from 'react';
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
import { listCustomers, createCustomer, deleteCustomer, type Customer } from '../api/customers';
import { useListState } from '../hooks/useListState';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';

export function Customers() {
  const navigate = useNavigate();
  const {
    data: customersData,
    loading,
    error,
    refresh,
    isEmpty,
  } = useListState<Customer[]>({
    fetcher: listCustomers,
    getEmpty: (rows) => rows.length === 0,
    formatError: () => 'אירעה שגיאה בטעינת הלקוחות',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  useEffect(() => {
    if (customersData === null) {
      void refresh();
    }
  }, [customersData, refresh]);

  function openCreateCustomer() {
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setModalOpen(true);
  }

  async function onCreateCustomer() {
    if (!newCustomerName) return;
    await createCustomer({
      name: newCustomerName,
      email: newCustomerEmail || null,
      phone: newCustomerPhone || null,
      address: newCustomerAddress || null,
    });
    setModalOpen(false);
    await refresh();
  }

  function openDeleteModal(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  }

  async function onDeleteCustomer() {
    if (!customerToDelete) return;
    await deleteCustomer(customerToDelete.id);
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
    await refresh();
  }

  const customers = customersData ?? [];

  const cards = useMemo(
    () =>
      (customers ?? []).map((c) => {
        const petCount = c.pets?.length ?? 0;

        const contactInfo = (
          <Stack gap={2}>
            {c.email && (
              <Text size="sm" c="dimmed">
                {c.email}
              </Text>
            )}
            {c.phone && (
              <Text size="sm" c="dimmed">
                {c.phone}
              </Text>
            )}
            {c.address && (
              <Text size="sm" c="dimmed">
                {c.address}
              </Text>
            )}
          </Stack>
        );

        const petsSection = petCount > 0 && (
          <Stack gap={4} mt="xs">
            <Text size="sm" fw={600}>
              חיות מחמד
            </Text>
            <Group gap={6}>
              {c.pets.map((p) => (
                <Badge key={p.id} variant="light" color={p.type === 'dog' ? 'teal' : 'grape'}>
                  {p.type === 'dog' ? 'כלב' : 'חתול'} • {p.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        );

        return (
          <EntityCard
            id={c.id}
            title={c.name}
            badge={
              <Badge key="pet-count" variant="light" size="sm" color="blue">
                {petCount} חיות
              </Badge>
            }
            deleteAction={{
              label: 'מחק לקוח',
              onClick: () => openDeleteModal(c),
            }}
            onClick={() => navigate(`/customers/${c.id}`)}
            className="customer-card"
          >
            {contactInfo}
            {petsSection}
          </EntityCard>
        );
      }),
    [customers, navigate]
  );

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
      ) : error ? (
        <StatusCard
          status="error"
          title="לא ניתן להציג לקוחות כעת"
          description={error}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refresh() }}
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
            <Button onClick={onCreateCustomer} disabled={!newCustomerName}>
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
            <Button color="red" onClick={onDeleteCustomer}>
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
