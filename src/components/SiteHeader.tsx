import Link from 'next/link'

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    {/* Custom Decivue Logo */}
                    <div className="relative w-11 h-11 flex items-center justify-center">
                        <svg viewBox="0 0 40 40" className="w-11 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Outer ring with gradient */}
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="white" />
                                    <stop offset="100%" stopColor="#a3a3a3" />
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
                            <circle cx="22" cy="12" r="3" fill="white" />
                            <circle cx="22" cy="28" r="3" fill="#a3a3a3" />
                            <circle cx="14" cy="20" r="2.5" fill="white" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center h-11">
                        <h1
                            className="text-2xl font-semibold tracking-tight text-white/90 leading-tight"
                            style={{ fontFamily: 'var(--font-space)' }}
                        >
                            Decivue
                        </h1>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-muted) font-medium">
                            Decision Intelligence
                        </span>
                    </div>
                </Link>
            </div>
        </header>
    )
}
