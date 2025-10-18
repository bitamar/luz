import { ReactNode } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';

type EntityFormModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  mode: 'create' | 'edit';
  onSubmit: () => void | Promise<unknown>;
  children: ReactNode;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  cancelLabel?: string;
  submitLabel?: string;
};

export function EntityFormModal({
  opened,
  onClose,
  title,
  mode,
  onSubmit,
  children,
  submitDisabled,
  submitLoading,
  cancelLabel = 'ביטול',
  submitLabel,
}: EntityFormModalProps) {
  const resolvedSubmitLabel = submitLabel ?? (mode === 'edit' ? 'שמור' : 'הוסף');

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Stack>
        {children}

        <Group justify="right" mt="sm">
          <Button variant="default" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button onClick={() => void onSubmit()} loading={submitLoading} disabled={submitDisabled}>
            {resolvedSubmitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
