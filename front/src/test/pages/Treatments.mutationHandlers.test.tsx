import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../utils/renderWithProviders';
import { Treatments } from '../../pages/Treatments';
import { queryKeys } from '../../lib/queryKeys';
import type { Treatment } from '../../api/treatments';
import * as apiMutationModule from '../../lib/useApiMutation';
import type { ApiMutationOptions } from '../../lib/useApiMutation';

const baseTreatments: Treatment[] = [
  {
    id: 'treat-1',
    userId: 'user-1',
    name: 'Vaccination',
    defaultIntervalMonths: 12,
    price: 200,
  },
  {
    id: 'treat-2',
    userId: 'user-1',
    name: 'Dental Care',
    defaultIntervalMonths: null,
    price: 350,
  },
];

const queryDataStore = new Map<string, unknown>();

const queryClientMock = {
  cancelQueries: vi.fn(),
  getQueryData: vi.fn((key: unknown) => queryDataStore.get(JSON.stringify(key))),
  setQueryData: vi.fn((key: unknown, updater: unknown) => {
    const cacheKey = JSON.stringify(key);
    const previous = queryDataStore.get(cacheKey);
    const value =
      typeof updater === 'function'
        ? (updater as (current: unknown) => unknown)(previous)
        : updater;
    queryDataStore.set(cacheKey, value);
    return value;
  }),
  invalidateQueries: vi.fn(),
};

vi.mock('../../api/treatments', () => ({
  listTreatments: vi.fn(),
  createTreatment: vi.fn(),
  updateTreatment: vi.fn(),
  deleteTreatment: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();

  const useQueryMock = vi.fn(({ queryKey }: { queryKey: unknown }) => {
    const cacheKey = JSON.stringify(queryKey);
    if (!queryDataStore.has(cacheKey)) {
      if (Array.isArray(queryKey) && queryKey[0] === 'treatments') {
        queryDataStore.set(cacheKey, baseTreatments);
      } else {
        queryDataStore.set(cacheKey, undefined);
      }
    }

    return {
      data: queryDataStore.get(cacheKey),
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    };
  });

  return {
    ...actual,
    useQuery: useQueryMock,
    useQueryClient: () => queryClientMock,
  };
});

describe('Treatments mutation handlers', () => {
  const capturedMutations: ApiMutationOptions<unknown, unknown, unknown, unknown>[] = [];

  beforeEach(() => {
    queryDataStore.clear();
    queryClientMock.cancelQueries.mockClear();
    queryClientMock.getQueryData.mockClear();
    queryClientMock.setQueryData.mockClear();
    queryClientMock.invalidateQueries.mockClear();
    capturedMutations.length = 0;

    vi.spyOn(apiMutationModule, 'useApiMutation').mockImplementation((options) => {
      capturedMutations.push(options);
      const mutationResult = { mutateAsync: vi.fn(), isPending: false } as const;
      return mutationResult as unknown as ReturnType<typeof apiMutationModule.useApiMutation>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderPage() {
    renderWithProviders(
      <Routes>
        <Route path="/treatments" element={<Treatments />} />
      </Routes>,
      { router: { initialEntries: ['/treatments'] } }
    );
  }

  it('restores cache when create treatment fails', () => {
    renderPage();
    const [createOptions] = capturedMutations;
    if (!createOptions?.onError) throw new Error('createTreatment onError handler missing');

    const context = { previousTreatments: baseTreatments };
    const initialCalls = queryClientMock.setQueryData.mock.calls.length;

    createOptions.onError(new Error('create failed'), undefined, context, undefined as never);

    expect(queryClientMock.setQueryData.mock.calls.length).toBe(initialCalls + 1);
    expect(queryClientMock.setQueryData).toHaveBeenCalledWith(
      queryKeys.treatments(),
      context.previousTreatments
    );
  });

  it('restores cache when update treatment fails', () => {
    renderPage();
    const updateOptions = capturedMutations[1];
    if (!updateOptions?.onError) throw new Error('updateTreatment onError handler missing');

    const context = { previousTreatments: baseTreatments };
    const initialCalls = queryClientMock.setQueryData.mock.calls.length;

    updateOptions.onError(new Error('update failed'), undefined, context, undefined as never);

    expect(queryClientMock.setQueryData.mock.calls.length).toBe(initialCalls + 1);
    expect(queryClientMock.setQueryData).toHaveBeenCalledWith(
      queryKeys.treatments(),
      context.previousTreatments
    );
  });

  it('restores cache when delete treatment fails', () => {
    renderPage();
    const deleteOptions = capturedMutations[2];
    if (!deleteOptions?.onError) throw new Error('deleteTreatment onError handler missing');

    const context = { previousTreatments: baseTreatments };
    const initialCalls = queryClientMock.setQueryData.mock.calls.length;

    deleteOptions.onError(new Error('delete failed'), undefined, context, undefined as never);

    expect(queryClientMock.setQueryData.mock.calls.length).toBe(initialCalls + 1);
    expect(queryClientMock.setQueryData).toHaveBeenCalledWith(
      queryKeys.treatments(),
      context.previousTreatments
    );
  });
});
