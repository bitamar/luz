import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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

    expect(screen.getByRole('heading', { name: 'הגדרות משתמש' })).toBeInTheDocument();
    expect(screen.getByLabelText(/שם/)).toHaveValue('User Test');
    expect(screen.getByLabelText(/טלפון/)).toHaveValue('050-9999999');
  });

  it('submits updated settings', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => expect(getSettingsMock).toHaveBeenCalled());

    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/שם/);
    const phoneInput = screen.getByLabelText(/טלפון/);

    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.clear(phoneInput);
    await user.type(phoneInput, '050-1111111');

    await user.click(screen.getByRole('button', { name: 'שמירה' }));

    await waitFor(() =>
      expect(updateSettingsMock).toHaveBeenCalledWith({ name: 'New Name', phone: '050-1111111' })
    );
  });

  it('displays error message when fetch fails', async () => {
    getSettingsMock.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Settings />);

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });
});
