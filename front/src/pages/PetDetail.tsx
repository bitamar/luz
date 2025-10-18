import { useMemo, useState } from 'react';
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
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconDots, IconPencil, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPet, deletePet, getCustomer, updatePet, type Customer, type Pet } from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { queryKeys } from '../lib/queryKeys';
import { extractErrorMessage } from '../lib/notifications';
import { HttpError } from '../lib/http';
import { useApiMutation } from '../lib/useApiMutation';

export function PetDetail() {
  const { customerId, petId } = useParams<{ customerId: string; petId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customersListKey = queryKeys.customers();
  const customerQueryKey = customerId
    ? queryKeys.customer(customerId)
    : (['customer', ''] as const);
  const petsListKey = customerId ? queryKeys.pets(customerId) : (['pets', ''] as const);

  const petQueryKey = useMemo(() => {
    if (!customerId || !petId) return ['pet', ''];
    return [...queryKeys.pets(customerId), petId] as const;
  }, [customerId, petId]);

  const petQuery = useQuery({
    queryKey: petQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => getPet(customerId!, petId!, { signal }),
    enabled: Boolean(customerId && petId),
  });

  const customerQuery = useQuery({
    queryKey: customerQueryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => getCustomer(customerId!, { signal }),
    enabled: Boolean(customerId),
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPetName, setEditPetName] = useState('');
  const [editPetType, setEditPetType] = useState<'dog' | 'cat' | ''>('');
  const [editPetGender, setEditPetGender] = useState<'male' | 'female' | ''>('');
  const [editPetBreed, setEditPetBreed] = useState('');

  const updatePetMutation = useApiMutation({
    mutationFn: (payload: Parameters<typeof updatePet>[2]) => {
      if (!customerId || !petId) throw new Error('Missing pet identifiers');
      return updatePet(customerId, petId, payload);
    },
    successToast: { message: 'פרטי חיית המחמד עודכנו' },
    errorToast: { fallbackMessage: 'עדכון חיית המחמד נכשל' },
    onMutate: async (payload) => {
      if (!customerId || !petId) return;
      await queryClient.cancelQueries({ queryKey: petQueryKey });
      await queryClient.cancelQueries({ queryKey: petsListKey });
      const previousPet = queryClient.getQueryData<Pet | undefined>(petQueryKey);
      const previousPetsList = queryClient.getQueryData<Pet[]>(petsListKey) ?? [];

      const applyUpdate = (current: Pet | undefined) => {
        if (!current) return current;
        return {
          ...current,
          name: payload.name ?? current.name,
          type: payload.type ?? current.type,
          gender: payload.gender ?? current.gender,
          breed: payload.breed !== undefined ? payload.breed : current.breed,
        };
      };

      if (previousPet) {
        queryClient.setQueryData(petQueryKey, applyUpdate(previousPet));
      }

      if (previousPetsList.length > 0) {
        queryClient.setQueryData<Pet[]>(petsListKey, (old = []) =>
          old.map((pet) => (pet.id === petId ? (applyUpdate(pet) as Pet) : pet))
        );
      }

      return { previousPet, previousPetsList };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPet !== undefined) {
        queryClient.setQueryData(petQueryKey, context.previousPet);
      }
      queryClient.setQueryData(petsListKey, context?.previousPetsList ?? []);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(petQueryKey, data);
      queryClient.setQueryData<Pet[]>(petsListKey, (old = []) =>
        old.map((pet) => (pet.id === data.id ? data : pet))
      );
      setEditModalOpen(false);
    },
    onSettled: () => {
      if (!customerId || !petId) return;
      void queryClient.invalidateQueries({ queryKey: petQueryKey });
      void queryClient.invalidateQueries({ queryKey: petsListKey });
    },
  });

  const deletePetMutation = useApiMutation({
    mutationFn: () => deletePet(customerId!, petId!),
    successToast: { message: 'חיית המחמד נמחקה' },
    errorToast: { fallbackMessage: 'מחיקת חיית המחמד נכשלה' },
    onMutate: async () => {
      if (!customerId || !petId) return;
      await queryClient.cancelQueries({ queryKey: petsListKey });
      await queryClient.cancelQueries({ queryKey: petQueryKey });
      await queryClient.cancelQueries({ queryKey: customerQueryKey });
      await queryClient.cancelQueries({ queryKey: customersListKey });
      const previousPet = queryClient.getQueryData(petQueryKey);
      const previousPets = queryClient.getQueryData<Pet[]>(petsListKey) ?? [];
      const previousCustomer = queryClient.getQueryData<Customer | undefined>(customerQueryKey);
      const previousCustomersList = queryClient.getQueryData<Customer[]>(customersListKey) ?? [];
      queryClient.setQueryData(petQueryKey, undefined);
      queryClient.setQueryData<Pet[]>(petsListKey, (old = []) =>
        old.filter((pet) => pet.id !== petId)
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
            customer.id === customerId
              ? { ...customer, petsCount: Math.max(customer.petsCount - 1, 0) }
              : customer
          )
        );
      }
      return { previousPet, previousPets, previousCustomer, previousCustomersList };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPet !== undefined) {
        queryClient.setQueryData(petQueryKey, context.previousPet);
      }
      queryClient.setQueryData(petsListKey, context?.previousPets ?? []);
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerQueryKey, context.previousCustomer);
      }
      if (context?.previousCustomersList) {
        queryClient.setQueryData(customersListKey, context.previousCustomersList);
      }
    },
    onSuccess: () => {
      setDeleteModalOpen(false);
      navigate(`/customers/${customerId}`);
    },
    onSettled: () => {
      if (!customerId || !petId) return;
      void queryClient.invalidateQueries({ queryKey: petsListKey });
      void queryClient.invalidateQueries({ queryKey: petQueryKey });
      void queryClient.invalidateQueries({ queryKey: customerQueryKey });
      void queryClient.invalidateQueries({ queryKey: customersListKey });
    },
  });

  const loading = petQuery.isPending || customerQuery.isPending;
  const petError = petQuery.error;
  const isPetNotFound = petError instanceof HttpError && petError.status === 404;

  const pet = petQuery.data;
  const customer = customerQuery.data;
  const isUpdating = updatePetMutation.isPending;

  function openEditModal() {
    if (!pet) return;
    setEditPetName(pet.name);
    setEditPetType(pet.type);
    setEditPetGender(pet.gender);
    setEditPetBreed(pet.breed ?? '');
    setEditModalOpen(true);
  }

  async function onUpdatePetDetails() {
    if (!customerId || !petId) return;
    const trimmedName = editPetName.trim();
    if (!trimmedName || !editPetType || !editPetGender) return;
    const payload = {
      name: trimmedName,
      type: editPetType as 'dog' | 'cat',
      gender: editPetGender as 'male' | 'female',
      breed: editPetBreed.trim() ? editPetBreed.trim() : null,
    } satisfies Parameters<typeof updatePet>[2];
    await updatePetMutation.mutateAsync(payload);
  }

  const breadcrumbItems = useMemo(() => {
    const items = [{ title: 'לקוחות', href: '/customers' }];

    if (customer) {
      items.push({ title: customer.name, href: `/customers/${customer.id}` });
    }

    if (pet) {
      items.push({ title: pet.name, href: '#' });
    }

    return items.map((item, index) => {
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
  }, [customer, pet, navigate]);

  if (!customerId || !petId || isPetNotFound) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="notFound"
          title="חיית המחמד לא נמצאה"
          description="ייתכן שהחיה נמחקה או שאינך מורשה לצפות בה."
          primaryAction={{
            label: 'חזרה ללקוח',
            onClick: () => navigate(customerId ? `/customers/${customerId}` : '/customers'),
          }}
        />
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard status="loading" title="טוען פרטי חיית מחמד..." />
      </Container>
    );
  }

  if (petQuery.error) {
    const message = extractErrorMessage(petQuery.error, 'אירעה שגיאה בטעינת חיית המחמד');
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="error"
          title="לא ניתן להציג את חיית המחמד כעת"
          description={message}
          primaryAction={{ label: 'נסה שוב', onClick: () => void petQuery.refetch() }}
          secondaryAction={
            <Button
              variant="subtle"
              onClick={() => navigate(customerId ? `/customers/${customerId}` : '/customers')}
            >
              חזרה ללקוח
            </Button>
          }
        />
      </Container>
    );
  }

  if (!pet) {
    return null;
  }

  const typeLabel = pet.type === 'dog' ? 'כלב' : 'חתול';
  const genderLabel = pet.gender === 'male' ? 'זכר' : 'נקבה';

  return (
    <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
      <Breadcrumbs mb="md">{breadcrumbItems}</Breadcrumbs>

      <Group
        mb="xl"
        align="center"
        gap="md"
        className="pet-title-group"
        style={{ position: 'relative' }}
      >
        <Menu shadow="md" width={150} position="bottom-start">
          <Menu.Target>
            <Button
              variant="subtle"
              size="xs"
              aria-label="פתח תפריט פעולות"
              data-testid="pet-actions-trigger"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                padding: '4px',
                width: '24px',
                height: '24px',
              }}
            >
              <IconDots size={14} />
            </Button>
          </Menu.Target>
        <Menu.Dropdown data-testid="pet-actions-dropdown">
          <Menu.Item
            leftSection={<IconPencil size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal();
            }}
          >
            ערוך חיית מחמד
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<IconX size={16} />}
            onClick={(e) => {
                e.stopPropagation();
                setDeleteModalOpen(true);
              }}
            >
              מחק חיית מחמד
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Title order={2}>{pet.name}</Title>
        <Badge variant="light" size="lg" color={pet.type === 'dog' ? 'teal' : 'grape'}>
          {typeLabel}
        </Badge>
      </Group>

      <Card withBorder shadow="sm" radius="md" padding="lg" mb="xl">
        <Stack gap="md">
          <Text size="lg" fw={600}>
            פרטי חיית מחמד
          </Text>
          <Group>
            <Badge variant="light" color="blue">
              {genderLabel}
            </Badge>
            {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
          </Group>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              מזהה חיה: {pet.id}
            </Text>
            <Text size="sm" c="dimmed">
              מזהה לקוח: {pet.customerId}
            </Text>
          </Stack>
        </Stack>
      </Card>

      <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="ערוך חיית מחמד">
        <Stack>
          <TextInput
            label="שם"
            value={editPetName}
            onChange={({ currentTarget }) => setEditPetName(currentTarget.value)}
            required
          />
          <Select
            label="סוג"
            data={[
              { value: 'dog', label: 'כלב' },
              { value: 'cat', label: 'חתול' },
            ]}
            value={editPetType}
            onChange={(val) => setEditPetType((val as 'dog' | 'cat') ?? '')}
            required
          />
          <Select
            label="מין"
            data={[
              { value: 'male', label: 'זכר' },
              { value: 'female', label: 'נקבה' },
            ]}
            value={editPetGender}
            onChange={(val) => setEditPetGender((val as 'male' | 'female') ?? '')}
            required
          />
          <TextInput
            label="גזע"
            value={editPetBreed}
            onChange={({ currentTarget }) => setEditPetBreed(currentTarget.value)}
          />
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setEditModalOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={onUpdatePetDetails}
              disabled={!editPetName.trim() || !editPetType || !editPetGender}
              loading={isUpdating}
            >
              עדכן
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="מחיקת חיית מחמד"
      >
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את חיית המחמד "{pet.name}"? פעולה זו אינה ניתנת לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              ביטול
            </Button>
            <Button
              color="red"
              onClick={() => customerId && petId && deletePetMutation.mutate()}
              loading={deletePetMutation.isPending}
            >
              מחק
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
