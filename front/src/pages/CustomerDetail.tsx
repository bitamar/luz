import { useMemo, useState } from 'react';
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
} from '@mantine/core';
import { IconDots, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPetToCustomer,
  deleteCustomer,
  deletePet,
  getCustomer,
  getCustomerPets,
  type Customer,
  type Pet,
} from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';
import { formatPetsCount } from '../utils/formatPetsCount';
import { queryKeys } from '../lib/queryKeys';
import { extractErrorMessage } from '../lib/notifications';
import { HttpError } from '../lib/http';
import { useApiMutation } from '../lib/useApiMutation';
import { PageTitle } from '../components/PageTitle';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customerId = id ?? '';
  const customersListKey = queryKeys.customers();
  const customerQueryKey = customerId
    ? queryKeys.customer(customerId)
    : (['customer', ''] as const);
  const petsQueryKey = customerId ? queryKeys.pets(customerId) : (['pets', ''] as const);

  const customerQuery = useQuery({
    queryKey: customerQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => getCustomer(customerId, { signal }),
    enabled: Boolean(customerId),
  });

  const petsQuery = useQuery({
    queryKey: petsQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => getCustomerPets(customerId, { signal }),
    enabled: Boolean(customerId),
  });

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

  const addPetMutation = useApiMutation({
    mutationFn: (payload: Parameters<typeof addPetToCustomer>[1]) =>
      addPetToCustomer(customerId, payload),
    successToast: { message: 'חיית המחמד נוספה בהצלחה' },
    errorToast: { fallbackMessage: 'הוספת חיית המחמד נכשלה' },
    onMutate: async (payload) => {
      if (!customerId) return;
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousCustomersList = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      const optimisticPet: Pet = {
        id: `optimistic-${Date.now()}`,
        customerId,
        name: payload.name,
        type: payload.type,
        gender: payload.gender,
        dateOfBirth: null,
        breed: payload.breed ?? null,
        isSterilized: null,
        isCastrated: null,
      };
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) => [...old, optimisticPet]);
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(customerQueryKey, {
          ...previousCustomer,
          petsCount: previousCustomer.petsCount + 1,
        });
      }
      if (previousCustomersList.length > 0) {
        queryClient.setQueryData<Customer[]>(customersListKey, (old = []) =>
          old.map((customer) =>
            customer.id === customerId
              ? { ...customer, petsCount: customer.petsCount + 1 }
              : customer
          )
        );
      }
      return {
        previousPets,
        previousCustomer,
        previousCustomersList,
        optimisticPetId: optimisticPet.id,
      };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(petsQueryKey, context?.previousPets ?? []);
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerQueryKey, context.previousCustomer);
      }
      if (context?.previousCustomersList) {
        queryClient.setQueryData(customersListKey, context.previousCustomersList);
      }
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) => {
        if (context?.optimisticPetId) {
          return old.map((pet) => (pet.id === context.optimisticPetId ? data : pet));
        }
        return [...old, data];
      });
      setModalOpen(false);
      setPetName('');
      setPetType('');
      setPetGender('');
      setPetBreed('');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: customersListKey });
    },
  });

  const deleteCustomerMutation = useApiMutation({
    mutationFn: () => deleteCustomer(customerId),
    successToast: { message: 'הלקוח נמחק' },
    errorToast: { fallbackMessage: 'מחיקת הלקוח נכשלה' },
    onMutate: async () => {
      if (!customerId) return;
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousCustomers = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      queryClient.setQueryData<Customer[]>(customersListKey, (old = []) =>
        old.filter((customer) => customer.id !== customerId)
      );
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      return { previousCustomers, previousCustomer, previousPets };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(customersListKey, context?.previousCustomers ?? []);
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerQueryKey, context.previousCustomer);
      }
      if (context?.previousPets) {
        queryClient.setQueryData(petsQueryKey, context.previousPets);
      }
    },
    onSuccess: () => {
      setDeleteModalOpen(false);
      navigate('/customers');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: customersListKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
    },
  });

  const deletePetMutation = useApiMutation({
    mutationFn: ({ customerId: cId, petId: pId }: { customerId: string; petId: string }) =>
      deletePet(cId, pId),
    successToast: { message: 'חיית המחמד נמחקה' },
    errorToast: { fallbackMessage: 'מחיקת חיית המחמד נכשלה' },
    onMutate: async ({ customerId: cId, petId: pId }) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousCustomersList = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.filter((pet) => pet.id !== pId)
      );
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(customerQueryKey, {
          ...previousCustomer,
          petsCount: Math.max(previousCustomer.petsCount - 1, 0),
        });
      }
      if (previousCustomersList.length > 0) {
        queryClient.setQueryData<Customer[]>(customersListKey, (old = []) =>
          old.map((customer) =>
            customer.id === cId
              ? { ...customer, petsCount: Math.max(customer.petsCount - 1, 0) }
              : customer
          )
        );
      }
      return { previousPets, previousCustomer, previousCustomersList };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(petsQueryKey, context?.previousPets ?? []);
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerQueryKey, context.previousCustomer);
      }
      if (context?.previousCustomersList) {
        queryClient.setQueryData(customersListKey, context.previousCustomersList);
      }
    },
    onSuccess: () => {
      setPetDeleteModalOpen(false);
      setPetToDelete(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: customersListKey });
    },
  });

  const loading = customerQuery.isPending || petsQuery.isPending;
  const customerError = customerQuery.error;
  const petsError = petsQuery.error;
  const combinedError = customerError ?? petsError;
  const isNotFound =
    customerError instanceof HttpError && customerError.status === 404 && customerQuery.isError;

  const customer = customerQuery.data;
  const pets: Pet[] = petsQuery.data ?? [];
  const petCount = pets.length;

  const breadcrumbItems = useMemo(
    () =>
      [
        { title: 'לקוחות', href: '/customers' },
        { title: customer?.name ?? 'לקוח לא ידוע', href: '#' },
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
      }),
    [customer?.name, navigate]
  );

  if (!customerId || isNotFound) {
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

  if (loading) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard status="loading" title="טוען פרטי לקוח..." />
      </Container>
    );
  }

  if (combinedError) {
    const message = extractErrorMessage(combinedError, 'אירעה שגיאה בטעינת הלקוח');
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="error"
          title="לא ניתן להציג את הלקוח כעת"
          description={message}
          primaryAction={{
            label: 'נסה שוב',
            onClick: () => {
              void customerQuery.refetch();
              void petsQuery.refetch();
            },
          }}
        />
      </Container>
    );
  }

  if (!customer) {
    return null;
  }

  function openAddPet() {
    setPetName('');
    setPetType('');
    setPetGender('');
    setPetBreed('');
    setModalOpen(true);
  }

  async function onAddPet() {
    if (!petName || !petType || !petGender) return;
    await addPetMutation.mutateAsync({
      name: petName,
      type: petType,
      gender: petGender,
      breed: petBreed || null,
    });
  }

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  function openPetDeleteModal(customerIdValue: string, petIdValue: string, petNameValue: string) {
    setPetToDelete({ customerId: customerIdValue, petId: petIdValue, petName: petNameValue });
    setPetDeleteModalOpen(true);
  }

  async function onDeletePet() {
    if (!petToDelete) return;
    await deletePetMutation.mutateAsync({
      customerId: petToDelete.customerId,
      petId: petToDelete.petId,
    });
  }

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
              aria-label="פתח תפריט פעולות לקוח"
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

        <PageTitle order={2}>{customer.name}</PageTitle>
      </Group>

      <EntityCard
        id={customer.id}
        title="פרטי לקוח"
        badge={
          <Badge key="pet-count" variant="light" size="lg" color="blue">
            {formatPetsCount(petCount)}
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
        <PageTitle order={3}>חיות מחמד</PageTitle>
        <Button onClick={openAddPet} disabled={addPetMutation.isPending}>
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
            <Button
              onClick={onAddPet}
              disabled={!petName || !petType || !petGender}
              loading={addPetMutation.isPending}
            >
              הוסף
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="מחיקת לקוח">
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את הלקוח "{customer.name}"? פעולה זו תמחק גם את כל חיות המחמד
            שלו ותהיה בלתי הפיכה.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button
              color="red"
              onClick={() => customerId && deleteCustomerMutation.mutate()}
              loading={deleteCustomerMutation.isPending}
            >
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
            <Button color="red" onClick={onDeletePet} loading={deletePetMutation.isPending}>
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
