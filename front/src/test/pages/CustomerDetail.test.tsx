import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { CustomerDetail } from '../../pages/CustomerDetail';
import * as customersApi from '../../api/customers';
import { renderWithProviders } from '../utils/renderWithProviders';
import { suppressConsoleError } from '../utils/suppressConsoleError';

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
  const getCustomerPetsMock = vi.mocked(customersApi.getCustomerPets);
  let restoreConsoleError: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([baseCustomer]);
    // Add mock for getCustomerPets
    getCustomerPetsMock.mockResolvedValue(
      baseCustomer.pets.map((pet) => ({
        ...pet,
        customerId: baseCustomer.id,
        gender: 'male',
        dateOfBirth: null,
        breed: null,
        isSterilized: null,
        isCastrated: null,
      }))
    );
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
    });
    deleteCustomerMock.mockResolvedValue();
    deletePetMock.mockResolvedValue();
    restoreConsoleError?.();
    restoreConsoleError = null;
  });

  afterEach(() => {
    restoreConsoleError?.();
    restoreConsoleError = null;
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

  it('shows empty state when customer has no pets', async () => {
    listCustomersMock.mockResolvedValueOnce([{ ...baseCustomer, pets: [] }]);
    // Also mock getCustomerPets to return an empty array
    getCustomerPetsMock.mockResolvedValueOnce([]);

    renderCustomerDetail();

    await waitFor(() =>
      expect(screen.getByText('אין עדיין חיות מחמד ללקוח זה')).toBeInTheDocument()
    );
    expect(
      screen.getByText('לחץ על "+ הוסף חיה" כדי להוסיף חיית מחמד ראשונה.')
    ).toBeInTheDocument();
  });

  it('shows not found state when customer does not exist', async () => {
    listCustomersMock.mockResolvedValueOnce([]);

    renderCustomerDetail();

    restoreConsoleError = suppressConsoleError(/NOT_FOUND/);

    await waitFor(() => expect(screen.getByText('הלקוח לא נמצא')).toBeInTheDocument());
    expect(screen.getByText('ייתכן שהלקוח נמחק או שאינך מורשה לצפות בו.')).toBeInTheDocument();
  });

  it('shows error state when loading the customer fails', async () => {
    listCustomersMock.mockRejectedValueOnce(new Error('Request failed: 500'));
    restoreConsoleError = suppressConsoleError(/Failed to load data/);

    renderCustomerDetail();

    await waitFor(() => expect(screen.getByText('לא ניתן להציג את הלקוח כעת')).toBeInTheDocument());
    expect(screen.getByText('אירעה שגיאה בטעינת הלקוח')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /נסה שוב/ })).toBeInTheDocument();
  });

  it('allows retry after error', async () => {
    listCustomersMock
      .mockRejectedValueOnce(new Error('Request failed: 500'))
      .mockResolvedValueOnce([baseCustomer]);
    restoreConsoleError = suppressConsoleError(/Failed to load data/);

    renderCustomerDetail();

    await screen.findByText('לא ניתן להציג את הלקוח כעת');

    await userEvent.click(screen.getByRole('button', { name: /נסה שוב/ }));

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalledTimes(2));
    await screen.findByRole('heading', { name: 'Dana Vet' });
  });

  it('allows adding a new pet and shows it after refresh', async () => {
    renderCustomerDetail();

    const user = userEvent.setup();
    await screen.findByText('Bolt');

    const newPet: customersApi.Customer['pets'][number] = {
      id: 'pet-new',
      name: 'New Pet',
      type: 'dog',
    };

    const updatedCustomer: customersApi.Customer = {
      ...baseCustomer,
      pets: [...baseCustomer.pets, newPet],
    };

    // Setup the mock response before clicking any buttons
    listCustomersMock.mockResolvedValueOnce([updatedCustomer]);

    // Open pet form
    await user.click(screen.getByRole('button', { name: '+ הוסף חיה' }));
    const modal = await screen.findByRole('dialog', { name: 'הוסף חיה חדשה' });

    // Fill the form efficiently
    const nameInput = await within(modal).findByLabelText(/שם/);
    await user.type(nameInput, 'New Pet');

    // Select dog option
    await user.click(await within(modal).findByLabelText(/סוג/));
    await user.click(await screen.findByRole('option', { name: 'כלב', hidden: true }));

    // Select male option
    await user.click(await within(modal).findByLabelText(/מין/));
    await user.click(await screen.findByRole('option', { name: 'זכר', hidden: true }));

    // Submit form
    await user.click(await within(modal).findByRole('button', { name: 'הוסף' }));

    // These longer timeouts ensure the test passes in CI environments
    await waitFor(
      () =>
        expect(addPetMock).toHaveBeenCalledWith('cust-1', {
          name: 'New Pet',
          type: 'dog',
          gender: 'male',
          breed: null,
        }),
      { timeout: 7000 }
    );

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalledTimes(2), { timeout: 7000 });
    await waitFor(() => expect(screen.getByText('New Pet')).toBeInTheDocument(), { timeout: 7000 });
  }, 10000); // Keep explicit timeout parameter
});
