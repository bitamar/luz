import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
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
  getCustomerPets,
  type Customer,
  type PetSummary,
} from '../api/customers';
import { useListState } from '../hooks/useListState';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      const error = new Error('Customer id missing');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const customers = await listCustomers();
    const found = customers.find((c) => c.id === id);

    if (!found) {
      const error = new Error('Customer not found');
      error.name = 'NOT_FOUND';
      throw error;
    }

    return found;
  }, [id]);

  const {
    data: customer,
    loading: customerLoading,
    error: customerError,
    notFound,
    refresh: refreshCustomer,
  } = useListState<Customer>({
    fetcher: fetchCustomer,
    isNotFoundError: (err) => err instanceof Error && err.name === 'NOT_FOUND',
    formatError: () => 'אירעה שגיאה בטעינת הלקוח',
  });

  // Fetch pets separately using the new API endpoint
  const fetchPets = useCallback(async () => {
    if (!id) return;

    setPetsLoading(true);
    setPetsError(null);

    try {
      const petsList = await getCustomerPets(id);
      const petSummaries: PetSummary[] = petsList.map((pet) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
      }));
      setPets(petSummaries);
    } catch (err) {
      setPetsError('אירעה שגיאה בטעינת חיות המחמד');
      console.error('Failed to load pets:', err);
    } finally {
      setPetsLoading(false);
    }
  }, [id]);

  // Load both customer and pets when component mounts or ID changes
  useEffect(() => {
    if (!id) return;
    void refreshCustomer();
    void fetchPets();
  }, [id, refreshCustomer, fetchPets]);

  function openAddPet() {
    setPetName('');
    setPetType('');
    setPetGender('');
    setPetBreed('');
    setModalOpen(true);
  }

  async function onAddPet() {
    if (!id || !petName || !petType || !petGender) return;

    try {
      const newPet = await addPetToCustomer(id, {
        name: petName,
        type: petType,
        gender: petGender,
        breed: petBreed || null,
      });

      // Add the new pet to our local state
      const newPetSummary: PetSummary = {
        id: newPet.id,
        name: newPet.name,
        type: newPet.type,
      };

      setPets((currentPets) => [...currentPets, newPetSummary]);
      setModalOpen(false);

      // Refresh customer data to ensure consistency with server
      void refreshCustomer();
    } catch (err) {
      console.error('Failed to add pet:', err);
      // TODO: Error message
    }
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
    if (!petToDelete) return;

    try {
      await deletePet(petToDelete.customerId, petToDelete.petId);

      // Update local state by removing the deleted pet
      setPets((currentPets) => currentPets.filter((pet) => pet.id !== petToDelete.petId));

      setPetDeleteModalOpen(false);
      setPetToDelete(null);
    } catch (err) {
      console.error('Failed to delete pet:', err);
      // TODO: show error message
    }
  }

  const loading = customerLoading || petsLoading;
  const error = customerError || petsError;

  if (loading) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard status="loading" title="טוען פרטי לקוח..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="error"
          title="לא ניתן להציג את הלקוח כעת"
          description={error}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refreshCustomer() }}
        />
      </Container>
    );
  }

  if (notFound || !customer) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="notFound"
          title="הלקוח לא נמצא"
          description="ייתכן שהלקוח נמחק או שאינך מורשה לצפות בו."
          primaryAction={{ label: 'חזרה לרשימת הלקוחות', onClick: () => navigate('/customers') }}
        />
      </Container>
    );
  }

  const petCount = pets.length;

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

      <EntityCard
        id={customer.id}
        title="פרטי לקוח"
        badge={
          <Badge key="pet-count" variant="light" size="lg" color="blue">
            {petCount} חיות מחמד
          </Badge>
        }
        className="customer-info-card"
      >
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
      </EntityCard>

      <Group justify="space-between" mb="md">
        <Title order={3}>חיות מחמד</Title>
        <Button onClick={openAddPet} disabled={loading}>
          + הוסף חיה
        </Button>
      </Group>

      {petCount === 0 ? (
        <StatusCard
          status="empty"
          title="אין עדיין חיות מחמד ללקוח זה"
          description='לחץ על "+ הוסף חיה" כדי להוסיף חיית מחמד ראשונה.'
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {pets.map((pet) => (
            <EntityCard
              key={pet.id}
              id={pet.id}
              title={pet.name}
              badge={
                <Badge key="pet-type" variant="light" color={pet.type === 'dog' ? 'teal' : 'grape'}>
                  {pet.type === 'dog' ? 'כלב' : 'חתול'}
                </Badge>
              }
              deleteAction={{
                label: 'מחק חיית מחמד',
                onClick: () => openPetDeleteModal(customer.id, pet.id, pet.name),
              }}
              onClick={() => navigate(`/customers/${customer.id}/pets/${pet.id}`)}
              className="pet-card"
            />
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
