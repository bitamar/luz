import { describe, it, expect } from 'vitest';
import App from '../../App';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('Main bootstrap', () => {
  it('renders App inside providers without crashing', () => {
    const { container } = renderWithProviders(<App />);
    expect(container.firstChild).toBeTruthy();
  });
});
