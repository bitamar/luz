import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { CustomerDetail } from '../../pages/CustomerDetail';
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

const baseCustomer: customersApi.Customer = {
  id: 'cust-1',
  name: 'Dana Vet',
  email: 'dana@example.com',
  phone: '050-1231234',
  address: 'Tel Aviv',
  pets: [
    { id: 'pet-1', name: 'Bolt', type: 'dog' },
    { id: 'pet-2', name: 'Misty', type: 'cat' },
  ],
};

describe('CustomerDetail page', () => {
  const listCustomersMock = vi.mocked(customersApi.listCustomers);
  const addPetMock = vi.mocked(customersApi.addPetToCustomer);
  const deleteCustomerMock = vi.mocked(customersApi.deleteCustomer);
  const deletePetMock = vi.mocked(customersApi.deletePet);

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([baseCustomer]);
    addPetMock.mockResolvedValue({
      id: 'pet-new',
      customerId: 'cust-1',
      name: 'New Pet',
      type: 'dog',
      gender: 'male',
      dateOfBirth: null,
      breed: null,
      isSterilized: null,
      isCastrated: null,
      customer: { id: 'cust-1', name: 'Dana Vet' },
    });
    deleteCustomerMock.mockResolvedValue();
    deletePetMock.mockResolvedValue();
  });

  function renderCustomerDetail() {
    return renderWithProviders(
      <Routes>
        <Route path="/customers/:id" element={<CustomerDetail />} />
      </Routes>,
      { router: { initialEntries: ['/customers/cust-1'] } }
    );
  }

  it('renders customer summary information and pets', async () => {
    renderCustomerDetail();

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: 'Dana Vet' })).toBeInTheDocument();
    expect(screen.getByText('dana@example.com')).toBeInTheDocument();
    expect(screen.getByText('050-1231234')).toBeInTheDocument();
    expect(screen.getByText('Tel Aviv')).toBeInTheDocument();
    expect(screen.getByText('Bolt')).toBeInTheDocument();
    expect(screen.getByText('Misty')).toBeInTheDocument();
  });

  it('allows deleting a pet and updates the list', async () => {
    renderCustomerDetail();
    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const boltCard = screen.getByText('Bolt').closest('.pet-card') as HTMLElement;
    const menuTrigger = within(boltCard)
      .getAllByRole('button', { hidden: true })
      .find((btn) => btn.getAttribute('aria-haspopup') === 'menu');

    if (!menuTrigger) throw new Error('Pet menu trigger not found');

    await user.click(menuTrigger);
    await user.click(await screen.findByRole('menuitem', { name: 'מחק חיית מחמד' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deletePetMock).toHaveBeenCalledWith('cust-1', 'pet-1'));
    await waitFor(() => expect(screen.queryByText('Bolt')).not.toBeInTheDocument());
  });

  it('allows deleting the customer and navigates back to list', async () => {
    renderCustomerDetail();
    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const titleGroup = document.querySelector('.customer-title-group');
    if (!titleGroup) throw new Error('Customer title group not found');

    const menuTrigger = Array.from(titleGroup.querySelectorAll('button')).find(
      (btn) => btn.getAttribute('aria-haspopup') === 'menu'
    ) as HTMLElement | undefined;

    if (!menuTrigger) throw new Error('Customer menu trigger not found');

    await user.click(menuTrigger);
    await user.click(await screen.findByRole('menuitem', { name: 'מחק לקוח' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deleteCustomerMock).toHaveBeenCalledWith('cust-1'));
    expect(navigateMock).toHaveBeenCalledWith('/customers');
  });
});
