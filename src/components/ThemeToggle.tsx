'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        // Render placeholder to avoid layout shift
        return <div className="h-8 w-8 sm:h-9 sm:w-9" />
    }

    const isDark = resolvedTheme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full
                border border-[var(--border)] bg-[var(--bg-secondary)]
                text-[var(--text-secondary)] transition-all duration-200
                hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-muted)]
                cursor-pointer"
        >
            <Sun
                size={16}
                className={`absolute transition-all duration-300 ${isDark
                        ? 'rotate-90 scale-0 opacity-0'
                        : 'rotate-0 scale-100 opacity-100'
                    }`}
            />
            <Moon
                size={16}
                className={`absolute transition-all duration-300 ${isDark
                        ? 'rotate-0 scale-100 opacity-100'
                        : '-rotate-90 scale-0 opacity-0'
                    }`}
            />
        </button>
    )
}
