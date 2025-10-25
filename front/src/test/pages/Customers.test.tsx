import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Customers } from '../../pages/Customers';
import * as customersApi from '../../api/customers';
import { renderWithProviders } from '../utils/renderWithProviders';
import { suppressConsoleError } from '../utils/suppressConsoleError';

vi.mock('../../api/customers');

const mockCustomers: customersApi.Customer[] = [
  {
    id: 'cust-1',
    name: 'Alice',
    email: 'alice@example.com',
    phone: '050-1234567',
    address: 'Tel Aviv',
    petsCount: 2,
  },
  {
    id: 'cust-2',
    name: 'Bob',
    email: null,
    phone: null,
    address: null,
    petsCount: 0,
  },
];

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Customers page', () => {
  const listCustomersMock = vi.mocked(customersApi.listCustomers);
  const createCustomerMock = vi.mocked(customersApi.createCustomer);
  const deleteCustomerMock = vi.mocked(customersApi.deleteCustomer);
  const updateCustomerMock = vi.mocked(customersApi.updateCustomer);
  let restoreConsoleError: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    listCustomersMock.mockResolvedValue(mockCustomers);
    updateCustomerMock.mockResolvedValue(mockCustomers[0]!);
    restoreConsoleError?.();
    restoreConsoleError = null;
  });

  afterAll(() => {
    restoreConsoleError?.();
    restoreConsoleError = null;
  });

  it('renders customers list with basic info', async () => {
    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    expect(await screen.findByRole('heading', { name: 'לקוחות' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'לקוח חדש' })).toBeInTheDocument();

    const aliceTitle = await screen.findByText('Alice');
    const aliceCard = aliceTitle.closest('.customer-card');
    expect(aliceCard).toBeTruthy();
    if (!aliceCard) return;

    const card = within(aliceCard as HTMLElement);
    expect(card.getByText('Alice')).toBeInTheDocument();
    expect(card.getByText('alice@example.com')).toBeInTheDocument();
    expect(card.getByText('050-1234567')).toBeInTheDocument();
    expect(card.getByText('Tel Aviv')).toBeInTheDocument();
    expect(card.getByText('2 חיות')).toBeInTheDocument();
  });

  it('allows creating a customer through the modal', async () => {
    listCustomersMock.mockResolvedValueOnce([]).mockResolvedValueOnce(mockCustomers);

    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'לקוח חדש' }));

    const modal = (await screen.findByRole('dialog')) as HTMLElement;
    const getModalInput = async (label: RegExp) =>
      (await within(modal).findByLabelText(label)) as HTMLInputElement;

    await user.clear(await getModalInput(/שם/));
    await user.type(await getModalInput(/שם/), 'Charlie');
    await user.type(await getModalInput(/אימייל/), 'charlie@example.com');
    await user.type(await getModalInput(/טלפון/), '050-7654321');
    await user.type(await getModalInput(/כתובת/), 'Haifa');

    await user.click(within(modal).getByRole('button', { name: 'הוסף' }));

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalled());
    expect(createCustomerMock.mock.calls[0]?.[0]).toEqual({
      name: 'Charlie',
      email: 'charlie@example.com',
      phone: '050-7654321',
      address: 'Haifa',
    });
    expect(listCustomersMock).toHaveBeenCalledTimes(2);
  });

  it('allows editing a customer through the modal', async () => {
    const updatedCustomer: customersApi.Customer = {
      ...mockCustomers[0]!,
      name: 'Alice Updated',
      phone: '050-0000000',
    };
    updateCustomerMock.mockResolvedValue(updatedCustomer);

    listCustomersMock
      .mockResolvedValueOnce(mockCustomers)
      .mockResolvedValueOnce([updatedCustomer, mockCustomers[1]!]);

    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const aliceCard = (await screen.findByText('Alice')).closest(
      '.customer-card'
    ) as HTMLElement | null;
    if (!aliceCard) throw new Error('Customer card not found');

    await user.click(within(aliceCard).getByRole('button', { name: 'ערוך' }) as HTMLButtonElement);

    const dialog = await screen.findByRole('dialog', { name: 'עריכת לקוח' });
    const nameInput = within(dialog).getByLabelText(/שם/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Updated');
    const phoneInput = within(dialog).getByLabelText(/טלפון/);
    await user.clear(phoneInput);
    await user.type(phoneInput, '050-0000000');

    await user.click(within(dialog).getByRole('button', { name: 'שמור' }) as HTMLButtonElement);

    await waitFor(() => expect(updateCustomerMock).toHaveBeenCalled());
    expect(updateCustomerMock).toHaveBeenCalledWith('cust-1', {
      name: 'Alice Updated',
      email: 'alice@example.com',
      phone: '050-0000000',
      address: 'Tel Aviv',
    });

    expect(await screen.findByText('Alice Updated')).toBeInTheDocument();
  });

  it('allows deleting a customer', async () => {
    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const firstCard = (await screen.findByText('Alice')).closest(
      '.customer-card'
    ) as HTMLElement | null;
    if (!firstCard) throw new Error('Customer card not found');

    await user.click(
      within(firstCard).getByRole('button', {
        name: 'פתח תפריט פעולות',
        hidden: true,
      }) as HTMLButtonElement
    );
    await user.click(await screen.findByRole('menuitem', { name: 'מחק לקוח' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deleteCustomerMock).toHaveBeenCalled());
    expect(deleteCustomerMock.mock.calls[0]?.[0]).toBe('cust-1');
  });

  it('navigates to detail page when clicking a card', async () => {
    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const card = (await screen.findByText('Alice')).closest('.customer-card') as HTMLElement | null;
    card?.click();

    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('shows empty state when there are no customers', async () => {
    listCustomersMock.mockResolvedValue([]);

    renderWithProviders(<Customers />);

    expect(await screen.findByText('אין עדיין לקוחות')).toBeInTheDocument();
    expect(
      screen.getByText('לחץ על "לקוח חדש" כדי להוסיף את הלקוח הראשון שלך.')
    ).toBeInTheDocument();
  });

  it('shows error state when loading customers fails', async () => {
    listCustomersMock.mockRejectedValue(new Error('Request failed: 500'));
    restoreConsoleError = suppressConsoleError(/Failed to load data/);

    renderWithProviders(<Customers />);

    await screen.findByText('לא ניתן להציג לקוחות כעת');
    expect(screen.getByText('Request failed: 500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'נסה שוב' })).toBeInTheDocument();
  });

  it('retries loading when clicking try again', async () => {
    listCustomersMock
      .mockRejectedValueOnce(new Error('Request failed: 500'))
      .mockResolvedValueOnce(mockCustomers);
    restoreConsoleError = suppressConsoleError(/Failed to load data/);

    renderWithProviders(<Customers />);

    await screen.findByText('לא ניתן להציג לקוחות כעת');

    const retryButton = screen.getByRole('button', { name: /נסה שוב/ });
    await userEvent.click(retryButton);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalledTimes(2));
    await screen.findByText('Alice');
  });
});
