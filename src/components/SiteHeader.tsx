import Link from 'next/link'

export function SiteHeader() {
    return (
        <header className="border-b border-(--bg-secondary)">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {/* Custom Decivue Logo */}
                    <div className="relative w-9 h-9 flex items-center justify-center">
                        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Outer ring with gradient */}
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--accent)" />
                                    <stop offset="100%" stopColor="#60a5fa" />
                                </linearGradient>
                            </defs>
                            <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
                            {/* Decision fork - stylized "D" with branches */}
                            <path
                                d="M14 12 L14 28 M14 20 L22 12 M14 20 L22 28"
                                stroke="url(#logoGradient)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Decision nodes */}
                            <circle cx="22" cy="12" r="3" fill="var(--accent)" />
                            <circle cx="22" cy="28" r="3" fill="#60a5fa" />
                            <circle cx="14" cy="20" r="2.5" fill="var(--accent)" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">Decivue</h1>
                    <span className="text-xs text-(--text-muted) px-2 py-0.5 rounded bg-(--bg-secondary)">
                        Decision Intelligence
                    </span>
                </Link>
            </div>
        </header>
    )
}
