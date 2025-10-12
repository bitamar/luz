import { ReactNode } from 'react';
import { Card, Stack, Group, Title, Button, Menu, Text } from '@mantine/core';
import { IconDots, IconX } from '@tabler/icons-react';

export type EntityCardProps = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  editAction?: () => void;
  deleteAction?: {
    label: string;
    onClick: () => void;
  };
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
};

export function EntityCard({
  id,
  title,
  subtitle,
  badge,
  editAction,
  deleteAction,
  onClick,
  children,
  className,
}: EntityCardProps) {
  return (
    <Card
      key={id}
      withBorder
      shadow="sm"
      radius="md"
      padding="md"
      {...(className ? { className } : {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : undefined,
        position: 'relative',
      }}
      onClick={(event) => {
        if (!onClick) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, a, input, textarea, select')) return;

        onClick();
      }}
    >
      <Stack gap="xs" style={{ flexGrow: 1 }}>
        <Group justify="space-between" align="start">
          <Title order={4} style={{ wordBreak: 'break-word' }}>
            {title}
          </Title>
          <Group gap="xs" align="center" wrap="nowrap">
            {badge && <div>{badge}</div>}
            {deleteAction && (
              <Menu shadow="md" width={150} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    size="xs"
                    style={{
                      padding: '4px',
                      width: '24px',
                      height: '24px',
                    }}
                    aria-label="פתח תפריט פעולות"
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
                      deleteAction.onClick();
                    }}
                  >
                    {deleteAction.label}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>

        {subtitle && (
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        )}

        {children}
      </Stack>

      {editAction && (
        <Group justify="flex-end" mt="md">
          <Button
            size="xs"
            variant="light"
            onClick={(e) => {
              e.stopPropagation();
              editAction();
            }}
          >
            ערוך
          </Button>
        </Group>
      )}
    </Card>
  );
}
