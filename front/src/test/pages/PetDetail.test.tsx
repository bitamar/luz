import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { PetDetail } from '../../pages/PetDetail';
import * as customersApi from '../../api/customers';
import { renderWithProviders } from '../utils/renderWithProviders';
import { suppressConsoleError } from '../utils/suppressConsoleError';
import { HttpError } from '../../lib/http';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../api/customers');

const mockPet: customersApi.Pet = {
  id: 'pet-1',
  customerId: 'cust-1',
  name: 'Bolt',
  type: 'dog',
  gender: 'male',
  dateOfBirth: '2020-06-01',
  breed: 'Border Collie',
  isSterilized: true,
  isCastrated: false,
};

const mockCustomer: customersApi.Customer = {
  id: 'cust-1',
  name: 'Dana Vet',
  email: 'dana@example.com',
  phone: '050-1231234',
  address: 'Tel Aviv',
  petsCount: 1,
};

describe('PetDetail page', () => {
  const getPetMock = vi.mocked(customersApi.getPet);
  const getCustomerMock = vi.mocked(customersApi.getCustomer);
  const deletePetMock = vi.mocked(customersApi.deletePet);
  let restoreConsoleError: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    getPetMock.mockResolvedValue(mockPet);
    getCustomerMock.mockResolvedValue(mockCustomer);
    deletePetMock.mockResolvedValue();
    restoreConsoleError?.();
    restoreConsoleError = null;
  });

  function renderPetDetail() {
    return renderWithProviders(
      <Routes>
        <Route path="/customers/:customerId/pets/:petId" element={<PetDetail />} />
      </Routes>,
      {
        router: {
          initialEntries: ['/customers/cust-1/pets/pet-1'],
        },
      }
    );
  }

  it('renders pet details and owner information', async () => {
    renderPetDetail();

    await waitFor(() => expect(getPetMock).toHaveBeenCalled());
    const [petCustomerId, petId] = getPetMock.mock.calls[0] ?? [];
    expect(petCustomerId).toBe('cust-1');
    expect(petId).toBe('pet-1');

    await waitFor(() => expect(getCustomerMock).toHaveBeenCalled());
    const [customerIdArg] = getCustomerMock.mock.calls[0] ?? [];
    expect(customerIdArg).toBe('cust-1');

    expect(await screen.findByRole('heading', { name: 'Bolt' })).toBeInTheDocument();
    expect(await screen.findByText('כלב')).toBeInTheDocument();
    expect(await screen.findByText('זכר')).toBeInTheDocument();
    expect(await screen.findByText('Border Collie')).toBeInTheDocument();
    expect(await screen.findByText('Dana Vet')).toBeInTheDocument();
  });

  it('navigates to customer page when owner link is clicked', async () => {
    const user = userEvent.setup();
    renderPetDetail();

    await waitFor(() => expect(getPetMock).toHaveBeenCalled());
    await waitFor(() => expect(getCustomerMock).toHaveBeenCalled());

    const ownerLink = await screen.findByText('Dana Vet');

    await user.click(ownerLink);

    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('allows deleting the pet and returns to customer page', async () => {
    const user = userEvent.setup();
    renderPetDetail();

    await waitFor(() => expect(getPetMock).toHaveBeenCalled());

    // Open actions menu
    const menuButton = await screen.findByTestId('pet-actions-trigger');
    await user.click(menuButton);

    // Click delete option
    const deleteOption = await screen.findByTestId('pet-actions-dropdown');
    await user.click(within(deleteOption).getByText('מחק חיית מחמד'));

    // Confirm deletion in modal
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deletePetMock).toHaveBeenCalled());
    const [deleteCustomerId, deletePetId] = deletePetMock.mock.calls[0] ?? [];
    expect(deleteCustomerId).toBe('cust-1');
    expect(deletePetId).toBe('pet-1');
    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('shows error state when loading the pet fails', async () => {
    getPetMock.mockRejectedValueOnce(new Error('Request failed: 500'));
    restoreConsoleError = suppressConsoleError(/Request failed|Failed to load/);
    renderPetDetail();

    await waitFor(() =>
      expect(screen.getByText('לא ניתן להציג את חיית המחמד כעת')).toBeInTheDocument()
    );
    expect(screen.getByText('Request failed: 500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /נסה שוב/ })).toBeInTheDocument();
  });

  it('shows not found state when pet does not exist', async () => {
    getPetMock.mockRejectedValueOnce(new HttpError(404, 'Not found'));
    restoreConsoleError = suppressConsoleError(/Not found|NOT_FOUND/);
    renderPetDetail();

    expect(await screen.findByText('חיית המחמד לא נמצאה')).toBeInTheDocument();
    expect(screen.getByText('ייתכן שהחיה נמחקה או שאינך מורשה לצפות בה.')).toBeInTheDocument();
  });
});
