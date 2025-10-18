import { vi } from 'vitest';

export function setupScrollIntoViewMock() {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window.HTMLElement.prototype,
    'scrollIntoView'
  );

  const scrollIntoViewMock = vi.fn();

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: scrollIntoViewMock,
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', originalDescriptor);
    } else {
      delete (window.HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    }
  };
}
