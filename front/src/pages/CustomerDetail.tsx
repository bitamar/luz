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
  Menu,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconDots, IconX } from '@tabler/icons-react';
import {
  listCustomers,
  addPetToCustomer,
  deleteCustomer,
  deletePet,
  type Customer,
} from '../api/customers';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [petDeleteModalOpen, setPetDeleteModalOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{
    customerId: string;
    petId: string;
    petName: string;
  } | null>(null);
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

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  async function onDeleteCustomer() {
    if (!id) return;
    await deleteCustomer(id);
    setDeleteModalOpen(false);
    navigate('/customers');
  }

  function openPetDeleteModal(customerId: string, petId: string, petName: string) {
    setPetToDelete({ customerId, petId, petName });
    setPetDeleteModalOpen(true);
  }

  async function onDeletePet() {
    if (!petToDelete || !customer) return;
    await deletePet(petToDelete.customerId, petToDelete.petId);
    setPetDeleteModalOpen(false);
    setPetToDelete(null);

    // Update the customer state directly to remove the deleted pet
    setCustomer({
      ...customer,
      pets: customer.pets.filter((pet) => pet.id !== petToDelete.petId),
    });
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

      <Group
        mb="xl"
        align="center"
        className="customer-title-group"
        style={{ position: 'relative' }}
      >
        <Menu shadow="md" width={150} position="bottom-start">
          <Menu.Target>
            <Button
              variant="subtle"
              size="xs"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                padding: '4px',
                width: '24px',
                height: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={14} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconX size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal();
              }}
            >
              מחק לקוח
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Title order={2}>{customer.name}</Title>
      </Group>

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
              className="pet-card"
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/customers/${customer.id}/pets/${pet.id}`)}
            >
              <Menu shadow="md" width={150} position="bottom-start">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    size="xs"
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '4px',
                      width: '24px',
                      height: '24px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDots size={14} />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPetDeleteModal(customer.id, pet.id, pet.name);
                    }}
                  >
                    מחק חיית מחמד
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

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

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="מחיקת לקוח">
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את הלקוח "{customer?.name}"? פעולה זו תמחק גם את כל חיות
            המחמד שלו ותהיה בלתי הפיכה.
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

      <Modal
        opened={petDeleteModalOpen}
        onClose={() => setPetDeleteModalOpen(false)}
        title="מחיקת חיית מחמד"
      >
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את חיית המחמד "{petToDelete?.petName}"? פעולה זו אינה ניתנת
            לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setPetDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button color="red" onClick={onDeletePet}>
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
