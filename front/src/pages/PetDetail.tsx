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
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconDots, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPet, deletePet, getCustomer } from '../api/customers';
import { StatusCard } from '../components/StatusCard';
import { queryKeys } from '../lib/queryKeys';
import {
  extractErrorMessage,
  showErrorNotification,
  showSuccessNotification,
} from '../lib/notifications';
import { HttpError } from '../lib/http';

export function PetDetail() {
  const { customerId, petId } = useParams<{ customerId: string; petId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const petQueryKey = useMemo(() => {
    if (!customerId || !petId) return ['pet', ''];
    return [...queryKeys.pets(customerId), petId] as const;
  }, [customerId, petId]);

  const petQuery = useQuery({
    queryKey: petQueryKey,
    queryFn: ({ signal }) => getPet(customerId!, petId!, { signal }),
    enabled: Boolean(customerId && petId),
  });

  const customerQuery = useQuery({
    queryKey: customerId ? queryKeys.customer(customerId) : ['customer', ''],
    queryFn: ({ signal }) => getCustomer(customerId!, { signal }),
    enabled: Boolean(customerId),
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const deletePetMutation = useMutation({
    mutationFn: () => deletePet(customerId!, petId!),
    onSuccess: () => {
      showSuccessNotification('חיית המחמד נמחקה');
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets(customerId!) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId!) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      navigate(`/customers/${customerId}`);
    },
    onError: (err) => {
      showErrorNotification(extractErrorMessage(err, 'מחיקת חיית המחמד נכשלה'));
    },
    onSettled: () => {
      setDeleteModalOpen(false);
    },
  });

  const loading = petQuery.isPending || customerQuery.isPending;
  const petError = petQuery.error;
  const isPetNotFound = petError instanceof HttpError && petError.status === 404;

  const pet = petQuery.data;
  const customer = customerQuery.data;

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
                right: 0,
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
