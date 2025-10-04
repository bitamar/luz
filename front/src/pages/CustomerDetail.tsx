import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { listCustomers, addPetToCustomer, type Customer } from '../api/customers';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat' | ''>('');
  const [petGender, setPetGender] = useState<'male' | 'female' | ''>('');
  const [petBreed, setPetBreed] = useState('');

  async function refresh() {
    if (!id) return;
    setLoading(true);
    try {
      const customers = await listCustomers();
      const found = customers.find((c) => c.id === id);
      setCustomer(found ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  function openAddPet() {
    setPetName('');
    setPetType('');
    setPetGender('');
    setPetBreed('');
    setModalOpen(true);
  }

  async function onAddPet() {
    if (!id || !petName || !petType || !petGender) return;
    await addPetToCustomer(id, {
      name: petName,
      type: petType,
      gender: petGender,
      breed: petBreed || null,
    });
    setModalOpen(false);
    await refresh();
  }

  if (!customer) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <Text>טוען...</Text>
      </Container>
    );
  }

  const petCount = customer.pets?.length ?? 0;

  const breadcrumbItems = [
    { title: 'לקוחות', href: '/customers' },
    { title: customer.name, href: '#' },
  ].map((item, index) => {
    const isActive = item.href === '#';
    return (
      <Anchor
        key={index}
        onClick={(e) => {
          e.preventDefault();
          if (!isActive) navigate(item.href);
        }}
        style={{ cursor: isActive ? 'default' : 'pointer' }}
        {...(isActive ? { c: 'dimmed' } : {})}
      >
        {item.title}
      </Anchor>
    );
  });

  return (
    <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
      <Breadcrumbs mb="md">{breadcrumbItems}</Breadcrumbs>
      
      <Title order={2} mb="xl">
        {customer.name}
      </Title>

      <Card withBorder shadow="sm" radius="md" padding="lg" mb="xl">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              פרטי לקוח
            </Text>
            <Badge variant="light" size="lg" color="blue">
              {petCount} חיות מחמד
            </Badge>
          </Group>

          <Stack gap={4}>
            {customer.email && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  אימייל:
                </Text>
                <Text size="sm" c="dimmed">
                  {customer.email}
                </Text>
              </Group>
            )}
            {customer.phone && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  טלפון:
                </Text>
                <Text size="sm" c="dimmed">
                  {customer.phone}
                </Text>
              </Group>
            )}
            {customer.address && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  כתובת:
                </Text>
                <Text size="sm" c="dimmed">
                  {customer.address}
                </Text>
              </Group>
            )}
          </Stack>
        </Stack>
      </Card>

      <Group justify="space-between" mb="md">
        <Title order={3}>חיות מחמד</Title>
        <Button onClick={openAddPet} disabled={loading}>
          + הוסף חיה
        </Button>
      </Group>

      {petCount === 0 ? (
        <Card withBorder padding="xl">
          <Text c="dimmed" ta="center">
            אין עדיין חיות מחמד ללקוח זה
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {customer.pets.map((pet) => (
            <Card
              key={pet.id}
              withBorder
              shadow="sm"
              radius="md"
              padding="md"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/customers/${customer.id}/pets/${pet.id}`)}
            >
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Title order={4}>{pet.name}</Title>
                  <Badge variant="light" color={pet.type === 'dog' ? 'teal' : 'grape'}>
                    {pet.type === 'dog' ? 'כלב' : 'חתול'}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="הוסף חיה חדשה">
        <Stack>
          <TextInput
            label="שם"
            value={petName}
            onChange={({ currentTarget }) => setPetName(currentTarget.value)}
            required
          />
          <Select
            label="סוג"
            placeholder="בחר סוג"
            data={[
              { value: 'dog', label: 'כלב' },
              { value: 'cat', label: 'חתול' },
            ]}
            value={petType}
            onChange={(val) => setPetType((val as 'dog' | 'cat') ?? '')}
            required
          />
          <Select
            label="מין"
            placeholder="בחר מין"
            data={[
              { value: 'male', label: 'זכר' },
              { value: 'female', label: 'נקבה' },
            ]}
            value={petGender}
            onChange={(val) => setPetGender((val as 'male' | 'female') ?? '')}
            required
          />
          <TextInput
            label="גזע"
            value={petBreed}
            onChange={({ currentTarget }) => setPetBreed(currentTarget.value)}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={onAddPet} disabled={!petName || !petType || !petGender}>
              הוסף
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

