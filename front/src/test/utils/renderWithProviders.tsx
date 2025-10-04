import { MantineProvider, DirectionProvider } from '@mantine/core';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

export interface RenderWithProvidersOptions {
  router?: MemoryRouterProps;
  renderOptions?: RenderOptions;
}

export function renderWithProviders(
  ui: ReactElement,
  { router, renderOptions }: RenderWithProvidersOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DirectionProvider>
      <MantineProvider>
        <MemoryRouter {...router}>{children}</MemoryRouter>
      </MantineProvider>
    </DirectionProvider>
  );

  return render(ui, { wrapper: Wrapper, ...(renderOptions ?? {}) });
}
