import { useEffect, useMemo, useState } from 'react';
import { Select, TextInput } from '@mantine/core';
import { EntityFormModal } from './EntityFormModal';

export type PetFormValues = {
  name: string;
  type: '' | 'dog' | 'cat';
  gender: '' | 'male' | 'female';
  breed: string;
};

export type PetFormSubmitValues = {
  name: string;
  type: 'dog' | 'cat';
  gender: 'male' | 'female';
  breed: string | null;
};

export type PetFormModalInitialValues = Partial<Omit<PetFormValues, 'type' | 'gender'>> & {
  type?: 'dog' | 'cat';
  gender?: 'male' | 'female';
};

const initialFormValues: PetFormValues = {
  name: '',
  type: '',
  gender: '',
  breed: '',
};

const petTypeOptions = [
  { value: 'dog', label: 'כלב' },
  { value: 'cat', label: 'חתול' },
] as const;

const petGenderOptions = [
  { value: 'male', label: 'זכר' },
  { value: 'female', label: 'נקבה' },
] as const;

export type PetFormModalProps = {
  opened: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  submitLoading?: boolean;
  initialValues?: PetFormModalInitialValues | null;
  onSubmit: (values: PetFormSubmitValues) => void | Promise<unknown>;
};

export function PetFormModal({
  opened,
  mode,
  onClose,
  submitLoading,
  initialValues,
  onSubmit,
}: PetFormModalProps) {
  const [values, setValues] = useState<PetFormValues>(initialFormValues);

  useEffect(() => {
    if (!opened) {
      setValues(initialFormValues);
      return;
    }

    setValues({
      name: initialValues?.name ?? '',
      type: initialValues?.type ?? '',
      gender: initialValues?.gender ?? '',
      breed: initialValues?.breed ?? '',
    });
  }, [opened, initialValues?.name, initialValues?.type, initialValues?.gender, initialValues?.breed]);

  const submitDisabled = useMemo(() => {
    return values.name.trim() === '' || values.type === '' || values.gender === '';
  }, [values.gender, values.name, values.type]);

  const handleSubmit = () => {
    const trimmedName = values.name.trim();
    const trimmedBreed = values.breed.trim();
    if (!trimmedName || values.type === '' || values.gender === '') {
      return;
    }

    onSubmit({
      name: trimmedName,
      type: values.type,
      gender: values.gender,
      breed: trimmedBreed === '' ? null : trimmedBreed,
    });
  };

  return (
    <EntityFormModal
      opened={opened}
      onClose={onClose}
      title={mode === 'edit' ? 'עריכת חיית מחמד' : 'הוסף חיה חדשה'}
      mode={mode}
      onSubmit={handleSubmit}
      submitDisabled={submitDisabled}
      submitLoading={submitLoading}
    >
      <TextInput
        label="שם"
        value={values.name}
        onChange={({ currentTarget }) => setValues((prev) => ({ ...prev, name: currentTarget.value }))}
        required
      />
      <Select
        label="סוג"
        placeholder="בחר סוג"
        data={petTypeOptions}
        value={values.type}
        onChange={(val) =>
          setValues((prev) => ({ ...prev, type: (val as PetFormValues['type']) ?? '' }))
        }
        required
      />
      <Select
        label="מין"
        placeholder="בחר מין"
        data={petGenderOptions}
        value={values.gender}
        onChange={(val) =>
          setValues((prev) => ({ ...prev, gender: (val as PetFormValues['gender']) ?? '' }))
        }
        required
      />
      <TextInput
        label="גזע"
        value={values.breed}
        onChange={({ currentTarget }) => setValues((prev) => ({ ...prev, breed: currentTarget.value }))}
      />
    </EntityFormModal>
  );
}
