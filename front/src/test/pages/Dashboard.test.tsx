import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Dashboard } from '../../pages/Dashboard';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('Dashboard page', () => {
  it('renders high level summary cards', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('heading', { name: 'דאשבורד' })).toBeInTheDocument();
    expect(screen.getByText('ביקורים היום')).toBeInTheDocument();
    expect(screen.getByText('הזמנות חדשות')).toBeInTheDocument();
    expect(screen.getByText('שיעור המרה')).toBeInTheDocument();
    expect(screen.getByText('12.4k')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText('4.1%')).toBeInTheDocument();
  });

  it('shows events and summary sections', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('heading', { name: 'אירועים קרובים' })).toBeInTheDocument();
    expect(screen.getByText('🗓️ פגישת לקוח — 12:30')).toBeInTheDocument();
    expect(screen.getByText('📦 מעקב משלוח — 15:00')).toBeInTheDocument();
    expect(screen.getByText('💬 שיחת תמיכה — 17:15')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'סיכום היום' })).toBeInTheDocument();
  });
});
