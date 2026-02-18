'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!fullName.trim()) throw new Error('Name is required')
            if (password !== confirmPassword) throw new Error('Passwords don\u2019t match')

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName.trim() } },
            })
            if (error) throw error
            setSuccess(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${location.origin}/auth/callback` },
            })
            if (error) throw error
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
            setLoading(false)
        }
    }

    const handleMicrosoftSignup = async () => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    scopes: 'email profile openid',
                },
            })
            if (error) throw error
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-1 items-center justify-center px-4 py-6">
                <div className="w-full max-w-[380px] text-center">
                    <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-secondary)] p-6 shadow-2xl">
                        <div className="mb-3 text-3xl">✉️</div>
                        <h2 className="text-lg font-bold text-white">Check your email</h2>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                            We&apos;ve sent a confirmation link to <span className="font-medium text-white">{email}</span>
                        </p>
                    </div>
                    <p className="mt-5 text-sm text-[var(--text-muted)]">
                        Already confirmed?{' '}
                        <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-6">
            <div className="w-full max-w-[380px]">

                {/* Heading */}
                <div className="mb-5 text-center">
                    <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Create your account</h1>
                    <p className="mt-1.5 text-[13px] text-[var(--text-muted)]">Start making better decisions today</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-secondary)] p-5 shadow-2xl sm:p-6">

                    {/* OAuth buttons */}
                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="sgBlue" x1="21.6" y1="5.4" x2="5.4" y2="21.6" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#1A73E8" />
                                        <stop offset="1" stopColor="#0D47A1" />
                                    </linearGradient>
                                    <linearGradient id="sgGreen" x1="9" y1="20" x2="15" y2="10" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#0D652D" />
                                        <stop offset="1" stopColor="#34A853" />
                                    </linearGradient>
                                    <linearGradient id="sgYellow" x1="2" y1="13" x2="10" y2="7" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#E37400" />
                                        <stop offset="1" stopColor="#FBBC04" />
                                    </linearGradient>
                                    <linearGradient id="sgRed" x1="16" y1="4" x2="8" y2="12" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#D93025" />
                                        <stop offset="1" stopColor="#EA4335" />
                                    </linearGradient>
                                </defs>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="url(#sgBlue)" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="url(#sgGreen)" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="url(#sgYellow)" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="url(#sgRed)" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={handleMicrosoftSignup}
                            disabled={loading}
                            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 21 21">
                                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                            </svg>
                            Continue with Microsoft
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                            <span className="bg-[var(--bg-secondary)] px-3 text-[var(--text-muted)]">or</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-3">
                        <div>
                            <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Full name</label>
                            <input
                                id="fullName" type="text" autoComplete="name" placeholder="Raj Rasane"
                                value={fullName} onChange={e => setFullName(e.target.value)} required
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 transition-colors focus:border-white/20 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
                            <input
                                id="email" type="email" autoComplete="email" placeholder="you@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 transition-colors focus:border-white/20 focus:outline-none"
                            />
                        </div>

                        {/* Password fields side by side on sm+ */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="password" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                                    Password <span className="font-normal text-[var(--text-muted)]">(6+)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                                        className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 pr-9 text-sm text-white placeholder:text-white/20 transition-colors focus:border-white/20 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Confirm</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                                        className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 pr-9 text-sm text-white placeholder:text-white/20 transition-colors focus:border-white/20 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">{error}</p>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create account
                        </button>
                    </form>
                </div>

                {/* Switch */}
                <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
