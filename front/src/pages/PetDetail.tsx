import { useCallback, useEffect, useState } from 'react';
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
import { getPet, deletePet, type Pet } from '../api/customers';
import { useListState } from '../hooks/useListState';
import { StatusCard } from '../components/StatusCard';

export function PetDetail() {
  const { customerId, petId } = useParams<{ customerId: string; petId: string }>();
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchPet = useCallback(async () => {
    if (!customerId || !petId) {
      const error = new Error('Pet not found');
      error.name = 'NOT_FOUND';
      throw error;
    }

    return await getPet(customerId, petId);
  }, [customerId, petId]);

  const {
    data: pet,
    loading,
    error,
    notFound,
    refresh,
  } = useListState<Pet>({
    fetcher: fetchPet,
    isNotFoundError: (err) => err instanceof Error && err.name === 'NOT_FOUND',
    formatError: () => 'אירעה שגיאה בטעינת פרטי חיית המחמד',
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  async function onDeletePet() {
    if (!customerId || !petId) return;
    await deletePet(customerId, petId);
    setDeleteModalOpen(false);
    navigate(`/customers/${customerId}`);
  }

  if (loading) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard status="loading" title="טוען פרטי חיית מחמד..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="error"
          title="לא ניתן להציג את חיית המחמד כעת"
          description={error}
          primaryAction={{ label: 'נסה שוב', onClick: () => void refresh() }}
          secondaryAction={
            <Button variant="subtle" onClick={() => navigate(`/customers/${customerId}`)}>
              חזרה ללקוח
            </Button>
          }
        />
      </Container>
    );
  }

  if (notFound || !pet) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <StatusCard
          status="notFound"
          title="חיית המחמד לא נמצאה"
          description="ייתכן שהחיה נמחקה או שאינך מורשה לצפות בה."
          primaryAction={{
            label: 'חזרה ללקוח',
            onClick: () => navigate(`/customers/${customerId}`),
          }}
        />
      </Container>
    );
  }

  const breadcrumbItems = [
    { title: 'לקוחות', href: '/customers' },
    { title: pet.customer.name, href: `/customers/${pet.customerId}` },
    { title: pet.name, href: '#' },
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
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
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

          <Stack gap="sm">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                מין:
              </Text>
              <Text size="sm" c="dimmed">
                {genderLabel}
              </Text>
            </Group>

            {pet.breed && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  גזע:
                </Text>
                <Text size="sm" c="dimmed">
                  {pet.breed}
                </Text>
              </Group>
            )}

            {pet.dateOfBirth && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  תאריך לידה:
                </Text>
                <Text size="sm" c="dimmed">
                  {new Date(pet.dateOfBirth).toLocaleDateString('he-IL')}
                </Text>
              </Group>
            )}

            {pet.isSterilized !== null && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  מסורס/ת:
                </Text>
                <Text size="sm" c="dimmed">
                  {pet.isSterilized ? 'כן' : 'לא'}
                </Text>
              </Group>
            )}

            {pet.isCastrated !== null && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  מעוקר:
                </Text>
                <Text size="sm" c="dimmed">
                  {pet.isCastrated ? 'כן' : 'לא'}
                </Text>
              </Group>
            )}
          </Stack>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" radius="md" padding="lg">
        <Stack gap="sm">
          <Text size="lg" fw={600}>
            בעל החיה
          </Text>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              לקוח:
            </Text>
            <Anchor
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/customers/${pet.customerId}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              {pet.customer.name}
            </Anchor>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="מחיקת חיית מחמד"
      >
        <Stack>
          <Text>
            האם אתה בטוח שברצונך למחוק את חיית המחמד "{pet?.name}"? פעולה זו אינה ניתנת לביטול.
          </Text>
          <Group justify="right" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
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
