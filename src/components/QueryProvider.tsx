'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
    // Create QueryClient once per component lifecycle (not on every render)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,       // Data stays fresh for 30 seconds
                        gcTime: 5 * 60 * 1000,      // Keep cached data for 5 minutes
                        refetchOnWindowFocus: false, // Don't refetch when user tabs back
                        retry: 1,                    // Retry failed queries once
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
