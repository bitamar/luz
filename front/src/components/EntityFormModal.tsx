import { ReactNode } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';
import type { FormEvent } from 'react';

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <Stack>
          {children}

          <Group justify="right" mt="sm">
            <Button variant="default" type="button" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit" loading={submitLoading ?? false} disabled={submitDisabled ?? false}>
              {resolvedSubmitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
