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
  updateCustomer,
  updatePet,
  type Customer,
  type Pet,
  type UpdateCustomerBody,
  type UpdatePetBody,
} from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { EntityCard } from '../components/EntityCard';
import { EntityFormModal } from '../components/EntityFormModal';
import { PageTitle } from '../components/PageTitle';
import { formatPetsCount } from '../utils/formatPetsCount';
import { queryKeys } from '../lib/queryKeys';
import { extractErrorMessage } from '../lib/notifications';
import { HttpError } from '../lib/http';
import { useApiMutation } from '../lib/useApiMutation';
import { applyCustomerUpdates, applyPetUpdates } from '../utils/entityUpdates';

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

  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerFormName, setCustomerFormName] = useState('');
  const [customerFormEmail, setCustomerFormEmail] = useState('');
  const [customerFormPhone, setCustomerFormPhone] = useState('');
  const [customerFormAddress, setCustomerFormAddress] = useState('');

  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat' | ''>('');
  const [petGender, setPetGender] = useState<'male' | 'female' | ''>('');
  const [petBreed, setPetBreed] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [petDeleteModalOpen, setPetDeleteModalOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{
    customerId: string;
    petId: string;
    petName: string;
  } | null>(null);

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
      closePetForm();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: customersListKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
    },
  });

  const updateCustomerMutation = useApiMutation({
    mutationFn: (payload: UpdateCustomerBody) => updateCustomer(customerId, payload),
    successToast: { message: 'פרטי הלקוח עודכנו בהצלחה' },
    errorToast: { fallbackMessage: 'עדכון פרטי הלקוח נכשל' },
    onMutate: async (payload) => {
      if (!customerId) return;
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousCustomersList = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(
          customerQueryKey,
          applyCustomerUpdates(previousCustomer, payload)
        );
      }
      if (previousCustomersList.length > 0) {
        queryClient.setQueryData<Customer[]>(customersListKey, (old = []) =>
          old.map((customer) =>
            customer.id === customerId ? applyCustomerUpdates(customer, payload) : customer
          )
        );
      }
      return { previousCustomer, previousCustomersList };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerQueryKey, context.previousCustomer);
      }
      if (context?.previousCustomersList) {
        queryClient.setQueryData(customersListKey, context.previousCustomersList);
      }
    },
    onSuccess: (data, payload) => {
      if (!payload) {
        closeCustomerForm();
        return;
      }
      queryClient.setQueryData<Customer>(
        customerQueryKey,
        (old) => data ?? (old ? applyCustomerUpdates(old, payload) : old)
      );
      queryClient.setQueryData<Customer[]>(customersListKey, (old = []) =>
        old.map((customer) =>
          customer.id === (data?.id ?? customerId)
            ? (data ?? applyCustomerUpdates(customer, payload))
            : customer
        )
      );
      closeCustomerForm();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: customersListKey });
    },
  });

  const updatePetMutation = useApiMutation({
    mutationFn: ({ petId, payload }: { petId: string; payload: UpdatePetBody }) => {
      if (!customerId) {
        throw new Error('Missing customer id');
      }
      return updatePet(customerId, petId, payload);
    },
    successToast: { message: 'חיית המחמד עודכנה בהצלחה' },
    errorToast: { fallbackMessage: 'עדכון חיית המחמד נכשל' },
    onMutate: async ({ petId, payload }) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.map((pet) => (pet.id === petId ? applyPetUpdates(pet, payload) : pet))
      );
      return { previousPets };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(petsQueryKey, context?.previousPets ?? []);
    },
    onSuccess: (data, variables) => {
      if (!variables) {
        closePetForm();
        return;
      }
      const { petId, payload } = variables;
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.map((pet) =>
          pet.id === (data?.id ?? petId) ? (data ?? applyPetUpdates(pet, payload)) : pet
        )
      );
      closePetForm();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
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
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey);
      return { previousCustomers, previousCustomer, previousPets, customerId };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(customersListKey, context?.previousCustomers ?? []);
      const targetCustomerId = context?.customerId ?? customerId;
      if (targetCustomerId) {
        queryClient.setQueryData(queryKeys.customer(targetCustomerId), context?.previousCustomer);
        queryClient.setQueryData(queryKeys.pets(targetCustomerId), context?.previousPets);
      }
    },
    onSuccess: (_data, _variables, context) => {
      setDeleteModalOpen(false);
      if (context?.customerId) {
        void queryClient.removeQueries({ queryKey: queryKeys.customer(context.customerId) });
        void queryClient.removeQueries({ queryKey: queryKeys.pets(context.customerId) });
      }
      navigate('/customers');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: customersListKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
    },
  });

  const deletePetMutation = useApiMutation({
    mutationFn: ({ customerId: customerIdValue, petId }: { customerId: string; petId: string }) =>
      deletePet(customerIdValue, petId),
    successToast: { message: 'חיית המחמד נמחקה' },
    errorToast: { fallbackMessage: 'מחיקת חיית המחמד נכשלה' },
    onMutate: async ({ customerId: customerIdValue, petId }) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousCustomersList = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      const previousPet = previousPets.find((petItem) => petItem.id === petId);
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.filter((petItem) => petItem.id !== petId)
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
            customer.id === customerIdValue
              ? { ...customer, petsCount: Math.max(customer.petsCount - 1, 0) }
              : customer
          )
        );
      }
      return { previousPet, previousPets, previousCustomer, previousCustomersList };
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
  const petMutationInFlight = addPetMutation.isPending || updatePetMutation.isPending;
  const customerMutationInFlight = updateCustomerMutation.isPending;

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

  function resetPetForm() {
    setPetName('');
    setPetType('');
    setPetGender('');
    setPetBreed('');
  }

  function closePetForm() {
    setPetFormOpen(false);
    setEditingPetId(null);
    resetPetForm();
  }

  function openAddPet() {
    setEditingPetId(null);
    resetPetForm();
    setPetFormOpen(true);
  }

  function openEditPet(pet: Pet) {
    setEditingPetId(pet.id);
    setPetName(pet.name);
    setPetType(pet.type);
    setPetGender(pet.gender);
    setPetBreed(pet.breed ?? '');
    setPetFormOpen(true);
  }

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  function closeCustomerForm() {
    setCustomerFormOpen(false);
  }

  function openCustomerForm() {
    if (!customer) return;
    setCustomerFormName(customer.name);
    setCustomerFormEmail(customer.email ?? '');
    setCustomerFormPhone(customer.phone ?? '');
    setCustomerFormAddress(customer.address ?? '');
    setCustomerFormOpen(true);
  }

  function openPetDeleteModal(customerIdValue: string, petIdValue: string, petNameValue: string) {
    setPetToDelete({ customerId: customerIdValue, petId: petIdValue, petName: petNameValue });
    setPetDeleteModalOpen(true);
  }

  async function onSubmitCustomer() {
    const trimmedName = customerFormName.trim();
    if (!trimmedName) return;
    const trimmedEmail = customerFormEmail.trim();
    const trimmedPhone = customerFormPhone.trim();
    const trimmedAddress = customerFormAddress.trim();
    const payload: UpdateCustomerBody = {
      name: trimmedName,
      email: trimmedEmail === '' ? null : trimmedEmail,
      phone: trimmedPhone === '' ? null : trimmedPhone,
      address: trimmedAddress === '' ? null : trimmedAddress,
    };
    await updateCustomerMutation.mutateAsync(payload);
  }

  async function onSubmitPet() {
    const trimmedName = petName.trim();
    if (!trimmedName || !petType || !petGender) return;
    const trimmedBreed = petBreed.trim();
    const breedValue = trimmedBreed === '' ? null : trimmedBreed;

    if (editingPetId) {
      const updatePayload: UpdatePetBody = {
        name: trimmedName,
        type: petType,
        gender: petGender,
        breed: breedValue,
      };
      await updatePetMutation.mutateAsync({ petId: editingPetId, payload: updatePayload });
    } else {
      await addPetMutation.mutateAsync({
        name: trimmedName,
        type: petType,
        gender: petGender,
        breed: breedValue,
      });
    }
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
        editAction={openCustomerForm}
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
        <Button onClick={openAddPet} disabled={petMutationInFlight}>
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
              editAction={() => openEditPet(pet)}
              onClick={() => navigate(`/customers/${customer.id}/pets/${pet.id}`)}
              className="pet-card"
            />
          ))}
        </SimpleGrid>
      )}

      <EntityFormModal
        opened={customerFormOpen}
        onClose={closeCustomerForm}
        title="עריכת לקוח"
        mode="edit"
        onSubmit={onSubmitCustomer}
        submitDisabled={!customerFormName.trim()}
        submitLoading={customerMutationInFlight}
      >
        <TextInput
          label="שם"
          value={customerFormName}
          onChange={({ currentTarget }) => setCustomerFormName(currentTarget.value)}
          required
        />
        <TextInput
          label="אימייל"
          value={customerFormEmail}
          onChange={({ currentTarget }) => setCustomerFormEmail(currentTarget.value)}
        />
        <TextInput
          label="טלפון"
          value={customerFormPhone}
          onChange={({ currentTarget }) => setCustomerFormPhone(currentTarget.value)}
        />
        <TextInput
          label="כתובת"
          value={customerFormAddress}
          onChange={({ currentTarget }) => setCustomerFormAddress(currentTarget.value)}
        />
      </EntityFormModal>

      <EntityFormModal
        opened={petFormOpen}
        onClose={closePetForm}
        title={editingPetId ? 'עריכת חיית מחמד' : 'הוסף חיה חדשה'}
        mode={editingPetId ? 'edit' : 'create'}
        onSubmit={onSubmitPet}
        submitDisabled={!petName.trim() || !petType || !petGender}
        submitLoading={petMutationInFlight}
      >
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
      </EntityFormModal>

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
        onClose={() => {
          setPetDeleteModalOpen(false);
          setPetToDelete(null);
        }}
        title="מחיקת חיית מחמד"
      >
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את חיית המחמד "{petToDelete?.petName}"? פעולה זו אינה ניתנת
            לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button
              variant="default"
              onClick={() => {
                setPetDeleteModalOpen(false);
                setPetToDelete(null);
              }}
            >
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
