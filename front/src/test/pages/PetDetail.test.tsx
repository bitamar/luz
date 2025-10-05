import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { PetDetail } from '../../pages/PetDetail';
import * as customersApi from '../../api/customers';
import { renderWithProviders } from '../utils/renderWithProviders';

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
  customer: { id: 'cust-1', name: 'Dana Vet' },
};

describe('PetDetail page', () => {
  const getPetMock = vi.mocked(customersApi.getPet);
  const deletePetMock = vi.mocked(customersApi.deletePet);

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    getPetMock.mockResolvedValue(mockPet);
    deletePetMock.mockResolvedValue();
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

    await waitFor(() => expect(getPetMock).toHaveBeenCalledWith('cust-1', 'pet-1'));

    expect(screen.getByRole('heading', { name: 'Bolt' })).toBeInTheDocument();
    expect(screen.getByText('כלב')).toBeInTheDocument();
    expect(screen.getByText('זכר')).toBeInTheDocument();
    expect(screen.getByText('Border Collie')).toBeInTheDocument();

    const ownerLink = screen
      .getAllByText('Dana Vet')
      .find((node) => node.closest('.mantine-Card-root'));

    expect(ownerLink).toBeTruthy();
  });

  it('navigates to customer page when owner link is clicked', async () => {
    const user = userEvent.setup();
    renderPetDetail();

    await waitFor(() => expect(getPetMock).toHaveBeenCalled());

    const ownerLink = screen
      .getAllByText('Dana Vet')
      .find((node) => node.closest('.mantine-Card-root'));

    if (!ownerLink) throw new Error('Owner link not found');

    await user.click(ownerLink);

    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('allows deleting the pet and returns to customer page', async () => {
    const user = userEvent.setup();
    renderPetDetail();

    await waitFor(() => expect(getPetMock).toHaveBeenCalled());

    const titleGroup = document.querySelector('.pet-title-group');
    if (!titleGroup) throw new Error('Pet title group not found');

    const menuTrigger = Array.from(titleGroup.querySelectorAll('button')).find(
      (btn) => btn.getAttribute('aria-haspopup') === 'menu'
    );

    if (!menuTrigger) throw new Error('Pet menu trigger not found');

    await user.click(menuTrigger);
    await user.click(await screen.findByRole('menuitem', { name: 'מחק חיית מחמד' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deletePetMock).toHaveBeenCalledWith('cust-1', 'pet-1'));
    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });
});
