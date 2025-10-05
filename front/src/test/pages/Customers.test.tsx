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
    pets: [
      { id: 'pet-1', name: 'Bobby', type: 'dog' },
      { id: 'pet-2', name: 'Mimi', type: 'cat' },
    ],
  },
  {
    id: 'cust-2',
    name: 'Bob',
    email: null,
    phone: null,
    address: null,
    pets: [],
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
  let restoreConsoleError: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    listCustomersMock.mockResolvedValue(mockCustomers);
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

    expect(screen.getByRole('heading', { name: 'לקוחות' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'לקוח חדש' })).toBeInTheDocument();

    const aliceCard = screen.getByText('Alice').closest('.customer-card');
    expect(aliceCard).toBeTruthy();
    if (!aliceCard) return;

    const card = within(aliceCard as HTMLElement);
    expect(card.getByText('Alice')).toBeInTheDocument();
    expect(card.getByText('alice@example.com')).toBeInTheDocument();
    expect(card.getByText('050-1234567')).toBeInTheDocument();
    expect(card.getByText('Tel Aviv')).toBeInTheDocument();
    expect(card.getByText('2 חיות')).toBeInTheDocument();
    expect(card.getByText('כלב • Bobby')).toBeInTheDocument();
    expect(card.getByText('חתול • Mimi')).toBeInTheDocument();
  });

  it('allows creating a customer through the modal', async () => {
    listCustomersMock.mockResolvedValueOnce([]).mockResolvedValueOnce(mockCustomers);

    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'לקוח חדש' }));

    const modal = (await screen.findByRole('dialog')) as HTMLElement;
    const getModalInput = (label: RegExp) =>
      within(modal).getByLabelText(label) as HTMLInputElement;

    await user.clear(getModalInput(/שם/));
    await user.type(getModalInput(/שם/), 'Charlie');
    await user.type(getModalInput(/אימייל/), 'charlie@example.com');
    await user.type(getModalInput(/טלפון/), '050-7654321');
    await user.type(getModalInput(/כתובת/), 'Haifa');

    await user.click(within(modal).getByRole('button', { name: 'הוסף' }));

    await waitFor(() =>
      expect(createCustomerMock).toHaveBeenCalledWith({
        name: 'Charlie',
        email: 'charlie@example.com',
        phone: '050-7654321',
        address: 'Haifa',
      })
    );
    expect(listCustomersMock).toHaveBeenCalledTimes(2);
  });

  it('allows deleting a customer', async () => {
    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const firstCard = screen.getByText('Alice').closest('.customer-card') as HTMLElement | null;
    if (!firstCard) throw new Error('Customer card not found');

    await user.click(within(firstCard).getByRole('button', { hidden: true }));
    await user.click(await screen.findByRole('menuitem', { name: 'מחק לקוח' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deleteCustomerMock).toHaveBeenCalledWith('cust-1'));
  });

  it('navigates to detail page when clicking a card', async () => {
    renderWithProviders(<Customers />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());

    const card = screen.getByText('Alice').closest('.customer-card') as HTMLElement | null;
    card?.click();

    expect(navigateMock).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('shows empty state when there are no customers', async () => {
    listCustomersMock.mockResolvedValue([]);

    renderWithProviders(<Customers />);

    await waitFor(() => expect(screen.getByText('אין עדיין לקוחות')).toBeInTheDocument());
    expect(
      screen.getByText('לחץ על "לקוח חדש" כדי להוסיף את הלקוח הראשון שלך.')
    ).toBeInTheDocument();
  });

  it('shows error state when loading customers fails', async () => {
    listCustomersMock.mockRejectedValue(new Error('Request failed: 500'));
    restoreConsoleError = suppressConsoleError(/Failed to load data/);

    renderWithProviders(<Customers />);

    await screen.findByText('לא ניתן להציג לקוחות כעת');
    expect(screen.getByText('אירעה שגיאה בטעינת הלקוחות')).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
  });
});
