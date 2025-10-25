import { useQueryClient } from '@tanstack/react-query';
import { updatePet, type Pet, type UpdatePetBody } from '../api/customers';
import { useApiMutation } from '../lib/useApiMutation';
import { queryKeys } from '../lib/queryKeys';
import { applyPetUpdates } from '../utils/entityUpdates';

export type UpdatePetVariables = {
  petId: string;
  payload: UpdatePetBody;
};

type UpdatePetContext = {
  previousPets: Pet[];
  previousPetDetail?: Pet;
};

type UsePetUpdateMutationParams = {
  customerId: string | null | undefined;
  petDetailQueryKey?: readonly unknown[];
  onSuccess?: (
    data: Pet | undefined,
    variables: UpdatePetVariables,
    context: UpdatePetContext | undefined
  ) => void;
};

export function usePetUpdateMutation({
  customerId,
  petDetailQueryKey,
  onSuccess,
}: UsePetUpdateMutationParams) {
  const queryClient = useQueryClient();
  const hasCustomerId = Boolean(customerId);
  const petsQueryKey = hasCustomerId
    ? queryKeys.pets(customerId as string)
    : (['pets', ''] as const);

  return useApiMutation<Pet | undefined, unknown, UpdatePetVariables, UpdatePetContext>({
    mutationFn: ({ petId, payload }) => {
      if (!customerId) {
        throw new Error('Missing customer id');
      }
      return updatePet(customerId, petId, payload);
    },
    successToast: { message: 'חיית המחמד עודכנה בהצלחה' },
    errorToast: { fallbackMessage: 'עדכון חיית המחמד נכשל' },
    onMutate: async ({ petId, payload }) => {
      if (!customerId) {
        return { previousPets: [] };
      }
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      if (petDetailQueryKey) {
        await queryClient.cancelQueries({ queryKey: petDetailQueryKey });
      }
      const previousPets = queryClient.getQueryData<Pet[]>(petsQueryKey) ?? [];
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.map((pet) => (pet.id === petId ? applyPetUpdates(pet, payload) : pet))
      );

      let previousPetDetail: Pet | undefined;
      if (petDetailQueryKey) {
        previousPetDetail = queryClient.getQueryData<Pet | undefined>(petDetailQueryKey);
        if (previousPetDetail) {
          queryClient.setQueryData<Pet>(
            petDetailQueryKey,
            applyPetUpdates(previousPetDetail, payload)
          );
        }
      }

      return { previousPets, previousPetDetail };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(petsQueryKey, context?.previousPets ?? []);
      if (petDetailQueryKey && context?.previousPetDetail) {
        queryClient.setQueryData(petDetailQueryKey, context.previousPetDetail);
      }
    },
    onSuccess: (data, variables, context) => {
      if (!variables) {
        onSuccess?.(data, variables as UpdatePetVariables, context);
        return;
      }
      const { petId, payload } = variables;
      queryClient.setQueryData<Pet[]>(petsQueryKey, (old = []) =>
        old.map((pet) =>
          pet.id === (data?.id ?? petId) ? (data ?? applyPetUpdates(pet, payload)) : pet
        )
      );

      if (petDetailQueryKey) {
        queryClient.setQueryData<Pet | undefined>(
          petDetailQueryKey,
          (old) => data ?? (old ? applyPetUpdates(old, payload) : old)
        );
      }

      onSuccess?.(data, variables, context);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petsQueryKey });
      if (petDetailQueryKey) {
        void queryClient.invalidateQueries({ queryKey: petDetailQueryKey });
      }
    },
  });
}
