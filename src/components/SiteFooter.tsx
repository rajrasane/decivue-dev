export function SiteFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="mt-auto">
            <div className="max-w-6xl mx-auto px-6">
                <div className="border-t border-[var(--border)] py-5 flex items-center justify-center text-xs text-(--text-muted) tracking-wide">
                    <p>&copy; {year} All rights reserved &middot; Decivue</p>
                </div>  
            </div>
        </footer>
    )
}
