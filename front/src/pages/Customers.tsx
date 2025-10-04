import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
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
import { listCustomers, createCustomer, type Customer } from '../api/customers';

export function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listCustomers();
      setCustomers(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

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

  const cards = useMemo(
    () =>
      customers.map((c) => {
        const petCount = c.pets?.length ?? 0;
        
        return (
          <Card
            key={c.id}
            withBorder
            shadow="sm"
            radius="md"
            padding="md"
            style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            onClick={() => navigate(`/customers/${c.id}`)}
          >
            <Stack gap="xs" style={{ flexGrow: 1 }}>
              <Group justify="space-between" align="center">
                <Title order={4} style={{ wordBreak: 'break-word' }}>
                  {c.name}
                </Title>
                <Badge variant="light" size="sm" color="blue">
                  {petCount} חיות
                </Badge>
              </Group>

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

              {petCount > 0 && (
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
              )}
            </Stack>
          </Card>
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

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {cards}
      </SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="לקוח חדש"
      >
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
    </Container>
  );
}



