import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Treatments } from '../../pages/Treatments';
import * as treatmentsApi from '../../api/treatments';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../api/treatments');

const mockTreatments: treatmentsApi.Treatment[] = [
  {
    id: 'treat-1',
    userId: 'user-1',
    name: 'Vaccination',
    defaultIntervalMonths: 12,
    price: 150,
  },
  {
    id: 'treat-2',
    userId: 'user-1',
    name: 'Dental Cleaning',
    defaultIntervalMonths: null,
    price: null,
  },
];

describe('Treatments page', () => {
  const listTreatmentsMock = vi.mocked(treatmentsApi.listTreatments);
  const createTreatmentMock = vi.mocked(treatmentsApi.createTreatment);
  const updateTreatmentMock = vi.mocked(treatmentsApi.updateTreatment);
  const deleteTreatmentMock = vi.mocked(treatmentsApi.deleteTreatment);

  beforeEach(() => {
    vi.clearAllMocks();
    listTreatmentsMock.mockResolvedValue(mockTreatments);
  });

  it('renders treatment cards with key information', async () => {
    renderWithProviders(<Treatments />);

    await waitFor(() => expect(listTreatmentsMock).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: 'סוגי טיפולים' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'טיפול חדש' })).toBeInTheDocument();

    const firstCard = screen.getByText('Vaccination').closest('.treatment-card');
    expect(firstCard).toBeTruthy();
    if (!firstCard) return;

    const card = within(firstCard as HTMLElement);
    expect(card.getByText('Vaccination')).toBeInTheDocument();
    expect(card.getByText('מרווח ברירת מחדל: 12 חודשים')).toBeInTheDocument();
    expect(card.getByText(/₪/)).toBeInTheDocument();
  });

  it('creates a new treatment via the modal form', async () => {
    listTreatmentsMock.mockResolvedValueOnce([]).mockResolvedValueOnce(mockTreatments);

    renderWithProviders(<Treatments />);

    await waitFor(() => expect(listTreatmentsMock).toHaveBeenCalled());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'טיפול חדש' }));

    const modal = (await screen.findByRole('dialog')) as HTMLElement;
    const nameInput = within(modal).getByLabelText(/שם/) as HTMLInputElement;
    const intervalInput = within(modal).getByLabelText(/מרווח ברירת מחדל/) as HTMLInputElement;
    const priceInput = within(modal).getByLabelText(/מחיר/) as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Examination');

    await user.clear(intervalInput);
    await user.type(intervalInput, '6');

    await user.clear(priceInput);
    await user.type(priceInput, '200');

    await user.click(within(modal).getByRole('button', { name: 'הוסף' }));

    await waitFor(() =>
      expect(createTreatmentMock).toHaveBeenCalledWith({
        name: 'Examination',
        defaultIntervalMonths: 6,
        price: 200,
      })
    );
    expect(listTreatmentsMock).toHaveBeenCalledTimes(2);
  });

  it('edits an existing treatment', async () => {
    renderWithProviders(<Treatments />);

    await waitFor(() => expect(listTreatmentsMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const firstCard = screen
      .getByText('Vaccination')
      .closest('.treatment-card') as HTMLElement | null;
    if (!firstCard) throw new Error('Treatment card not found');

    await user.click(within(firstCard).getByRole('button', { name: 'ערוך' }));

    const modal = (await screen.findByRole('dialog')) as HTMLElement;
    const priceInput = within(modal).getByLabelText(/מחיר/) as HTMLInputElement;

    await user.clear(priceInput);
    await user.type(priceInput, '180');

    await user.click(within(modal).getByRole('button', { name: 'שמור' }));

    await waitFor(() =>
      expect(updateTreatmentMock).toHaveBeenCalledWith('treat-1', {
        name: 'Vaccination',
        defaultIntervalMonths: 12,
        price: 180,
      })
    );
  });

  it('deletes a treatment after confirmation', async () => {
    renderWithProviders(<Treatments />);

    await waitFor(() => expect(listTreatmentsMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const firstCard = screen
      .getByText('Vaccination')
      .closest('.treatment-card') as HTMLElement | null;
    if (!firstCard) throw new Error('Treatment card not found');

    const menuButtons = within(firstCard).getAllByRole('button', { hidden: true });
    const menuTrigger = menuButtons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
    if (!menuTrigger) throw new Error('Menu trigger not found');

    await user.click(menuTrigger);
    await user.click(await screen.findByRole('menuitem', { name: 'מחק טיפול' }));
    await user.click(await screen.findByRole('button', { name: 'מחק' }));

    await waitFor(() => expect(deleteTreatmentMock).toHaveBeenCalledWith('treat-1'));
  });
});
