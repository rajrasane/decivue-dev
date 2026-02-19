'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function SiteHeader() {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loaded, setLoaded] = useState(false)
    const supabase = createClient()
    const pathname = usePathname()

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.auth.getUser()
            setUser(data.user)
            setLoaded(true)
        }
        load()
    }, [supabase.auth])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const isAuthPage = pathname === '/login' || pathname === '/signup'

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
    const email = user?.email || ''
    const avatarUrl = user?.user_metadata?.avatar_url || ''
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-backdrop-filter:bg-black/50">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity">
                    {/* Logo */}
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center">
                        <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="white" />
                                    <stop offset="100%" stopColor="#a3a3a3" />
                                </linearGradient>
                            </defs>
                            <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
                            <path
                                d="M14 12 L14 28 M14 20 L22 12 M14 20 L22 28"
                                stroke="url(#logoGradient)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="22" cy="12" r="3" fill="white" />
                            <circle cx="22" cy="28" r="3" fill="#a3a3a3" />
                            <circle cx="14" cy="20" r="2.5" fill="white" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1
                            className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-white/90 leading-tight"
                            style={{ fontFamily: 'var(--font-space)' }}
                        >
                            Decivue
                        </h1>
                        <span className="hidden sm:block text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--text-muted)] font-medium">
                            Decision Intelligence
                        </span>
                    </div>
                </Link>

                {/* Right side — conditional on auth state */}
                {loaded && (
                    <div className="flex items-center gap-2 sm:gap-3">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative flex items-center rounded-full outline-none! focus-visible:ring-0 cursor-pointer">
                                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-white/[0.1] transition-all hover:border-white/[0.25]">
                                            <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                                            <AvatarFallback className="text-[11px] sm:text-xs">{initials}</AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm font-medium text-white/90">{displayName}</p>
                                            <p className="text-xs text-white/40 truncate">{email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                    >
                                        <LogOut size={14} />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : !isAuthPage ? (
                            <>
                                <Link
                                    href="/login"
                                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-white text-xs sm:text-sm font-semibold text-black transition-colors hover:bg-white/90"
                                >
                                    Sign up
                                </Link>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </header>
    )
}

