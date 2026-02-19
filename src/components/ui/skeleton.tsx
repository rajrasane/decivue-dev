import { cn } from '@/lib/utils'

/**
 * Animated skeleton placeholder for loading states.
 * Follows the same pattern as other shadcn/ui primitives in this project.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="skeleton"
            className={cn('animate-pulse rounded-md bg-[var(--bg-secondary)]', className)}
            {...props}
        />
    )
}
