import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../../App';
import { DirectionProvider, MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';

describe('Main bootstrap', () => {
  it('renders App inside providers without crashing', () => {
    const { container } = render(
      <DirectionProvider>
        <MantineProvider>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </MantineProvider>
      </DirectionProvider>
    );

    expect(container.firstChild).toBeTruthy();
  });
});
