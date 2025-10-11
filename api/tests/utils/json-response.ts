import type { injectAuthed } from './inject.js';

/**
 * Helper function to extract JSON response data with proper typing.
 *
 * @param response The response from an API call
 * @returns Object containing status code and typed body
 */
export function getJson<T>(response: Awaited<ReturnType<typeof injectAuthed>>) {
  return {
    statusCode: response.statusCode,
    body: response.json() as T,
  };
}
