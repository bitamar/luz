import { MantineProvider, DirectionProvider } from '@mantine/core';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

export interface RenderWithProvidersOptions {
  router?: MemoryRouterProps;
  renderOptions?: RenderOptions;
  withPortalRoot?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { router, renderOptions, withPortalRoot = true }: RenderWithProvidersOptions = {}
) {
  if (withPortalRoot && !document.getElementById('__mantine-portal')) {
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', '__mantine-portal');
    document.body.appendChild(portalRoot);
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DirectionProvider>
      <MantineProvider>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          {...router}
        >
          {children}
        </MemoryRouter>
      </MantineProvider>
    </DirectionProvider>
  );

  return render(ui, { wrapper: Wrapper, ...(renderOptions ?? {}) });
}
