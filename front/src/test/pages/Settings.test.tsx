import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Settings } from '../../pages/Settings';
import * as authApi from '../../auth/api';
import { renderWithProviders } from '../utils/renderWithProviders';
import userEvent from '@testing-library/user-event';

vi.mock('../../auth/api');

describe('Settings page', () => {
  const getSettingsMock = vi.mocked(authApi.getSettings);
  const updateSettingsMock = vi.mocked(authApi.updateSettings);

  beforeEach(() => {
    vi.resetAllMocks();
    getSettingsMock.mockResolvedValue({
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: 'User Test',
        avatarUrl: null,
        phone: '050-9999999',
      },
    });
  });

  it('renders user settings form with fetched data', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => expect(getSettingsMock).toHaveBeenCalled());

    expect(await screen.findByRole('heading', { name: 'הגדרות משתמש' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/שם/)).toHaveValue('User Test');
    expect(await screen.findByLabelText(/טלפון/)).toHaveValue('050-9999999');
  });

  it('submits updated settings', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => expect(getSettingsMock).toHaveBeenCalled());

    const nameInput = await screen.findByLabelText(/שם/);
    const phoneInput = await screen.findByLabelText(/טלפון/);

    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(phoneInput, { target: { value: '050-1111111' } });

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'שמירה' }));

    await waitFor(() => expect(updateSettingsMock).toHaveBeenCalled());
    expect(updateSettingsMock.mock.calls[0]?.[0]).toEqual({
      name: 'New Name',
      phone: '050-1111111',
    });
  });

  it('displays error message when fetch fails', async () => {
    getSettingsMock.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Settings />);

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });
});
