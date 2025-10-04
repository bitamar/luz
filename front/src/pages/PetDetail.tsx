import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getPet, type Pet } from '../api/customers';

export function PetDetail() {
  const { customerId, petId } = useParams<{ customerId: string; petId: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      if (!customerId || !petId) return;
      setLoading(true);
      try {
        const data = await getPet(customerId, petId);
        setPet(data);
      } finally {
        setLoading(false);
      }
    }
    fetchPet();
  }, [customerId, petId]);

  if (loading || !pet) {
    return (
      <Container size="lg" pt={{ base: 'xl', sm: 'xl' }} pb="xl">
        <Center h="50vh">
          <Loader size="md" />
        </Center>
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

      <Group mb="xl" align="center" gap="md">
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
    </Container>
  );
}
