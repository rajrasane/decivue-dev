export function SiteFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="mt-auto">
            <div className="max-w-6xl mx-auto px-6">
                <div className="border-t border-white/10 py-6 flex items-center justify-between text-xs text-(--text-muted)">
                    <p>&copy; {year} Decivue. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span>v1.0.0-beta</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
