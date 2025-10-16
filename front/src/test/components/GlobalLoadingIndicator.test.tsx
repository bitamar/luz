import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { GlobalLoadingIndicator } from '../../components/GlobalLoadingIndicator';
import { renderWithProviders } from '../utils/renderWithProviders';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useIsFetching: vi.fn(),
    useIsMutating: vi.fn(),
  };
});

const useIsFetchingMock = vi.mocked(useIsFetching);
const useIsMutatingMock = vi.mocked(useIsMutating);

describe('GlobalLoadingIndicator', () => {
  let timeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    timeoutSpy = vi.spyOn(global, 'setTimeout');
    useIsFetchingMock.mockReset();
    useIsMutatingMock.mockReset();
  });

  afterEach(() => {
    timeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('shows loader while there are active queries or mutations', () => {
    useIsFetchingMock.mockReturnValue(1);
    useIsMutatingMock.mockReturnValue(0);

    renderWithProviders(<GlobalLoadingIndicator />);

    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();
  });

  it('schedules hide timeout when activity stops', () => {
    useIsFetchingMock.mockReturnValueOnce(1).mockReturnValue(0);
    useIsMutatingMock.mockReturnValue(0);

    const { rerender } = renderWithProviders(<GlobalLoadingIndicator />);
    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();

    act(() => {
      rerender(<GlobalLoadingIndicator />);
    });

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });
});
