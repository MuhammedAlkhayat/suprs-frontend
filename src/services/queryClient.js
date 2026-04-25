// src/queryClient.js
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
    mutations: {
      // Avoid aggressive retries for mutations by default; handle retry per-mutation when needed
      retry: 0,
    },
  },
});

export default queryClient;