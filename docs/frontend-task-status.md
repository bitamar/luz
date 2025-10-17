# Frontend task status

| Task | Status | Notes |
| --- | --- | --- |
| Add state management library (TanStack Query) | ✅ Done | `QueryClientProvider` configured in `front/src/main.tsx` with shared `queryClient`, and queries/mutations already use TanStack Query across pages. |
| Centralize error handling and toast notifications | ✅ Done | `useApiMutation` wraps TanStack mutations and displays consistent success/error toasts with shared fallbacks. |
| Coordinate loading states | ✅ Done | `GlobalLoadingIndicator` surfaces concurrent query/mutation activity using Mantine portal UI. |
| Support optimistic updates for better UX | ✅ Done | Treatments, customers, and pets mutations update query caches immediately and roll back on failure. |
| Provide proper React error boundaries | ✅ Done | `AppErrorBoundary` now wraps the entire app while preserving the existing route-level boundary. |
| Abort pending requests on navigation | ✅ Done | API helpers accept `AbortSignal` and queries pass the signal parameter, so ongoing fetches are cancelled on unmount. |

Planned next steps:

1. ✅ Introduce a shared mutation helper to centralize success/error notifications and reusable fallback messaging.
2. ✅ Add a global loading indicator component wired to TanStack Query's `useIsFetching`/`useIsMutating` APIs.
3. ✅ Implement optimistic cache updates for treatments, customers, and pets mutations to give instant UI feedback.
4. ✅ Wrap the entire app in a top-level error boundary so unexpected errors render a recoverable fallback.
