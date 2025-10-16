import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const { renderMock, createRootMock } = vi.hoisted(() => {
  const renderMock = vi.fn();
  const createRootMock = vi.fn(() => ({ render: renderMock }));
  return { renderMock, createRootMock };
});

vi.mock('react-dom/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom/client')>();
  return {
    ...actual,
    createRoot: createRootMock,
    default: { ...actual.default, createRoot: createRootMock },
  };
});

vi.mock('../../App', () => ({
  default: () => null,
}));

vi.mock('../../components/AppErrorBoundary', () => ({
  AppErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('main entrypoint', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    renderMock.mockReset();
    createRootMock.mockReset();
    createRootMock.mockImplementation(() => ({ render: renderMock }));
  });

  it('creates React root and renders application tree', async () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    await import('../../main');

    expect(createRootMock).toHaveBeenCalledWith(rootElement);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
