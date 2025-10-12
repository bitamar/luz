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
import { formatPetsCount } from '../utils/formatPetsCount';

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
