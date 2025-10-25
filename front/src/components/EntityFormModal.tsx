import { ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { ButtonProps, ModalProps } from '@mantine/core';
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
  description?: ReactNode;
  footer?: ReactNode;
  size?: ModalProps['size'];
  modalProps?: Omit<ModalProps, 'opened' | 'onClose' | 'title' | 'size'>;
  submitButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  formId?: string;
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
  description,
  footer,
  size,
  modalProps,
  submitButtonProps,
  cancelButtonProps,
  formId,
}: EntityFormModalProps) {
  const resolvedSubmitLabel = submitLabel ?? (mode === 'edit' ? 'שמור' : 'הוסף');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  const modalSizeProps: Partial<Pick<ModalProps, 'size'>> =
    size === undefined ? {} : { size };

  return (
    <Modal opened={opened} onClose={onClose} title={title} {...modalSizeProps} {...modalProps}>
      <form onSubmit={handleSubmit} id={formId}>
        <Stack>
          {description ? <Text c="dimmed">{description}</Text> : null}

          {children}

          <Group justify="right" mt="sm">
            <Button
              variant="default"
              type="button"
              onClick={onClose}
              {...cancelButtonProps}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              loading={submitLoading ?? false}
              disabled={submitDisabled ?? false}
              {...submitButtonProps}
            >
              {resolvedSubmitLabel}
            </Button>
          </Group>

          {footer}
        </Stack>
      </form>
    </Modal>
  );
}
