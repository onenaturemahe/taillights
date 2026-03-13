export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-[#1a2e1a] dark:bg-[#0f1a0f]">
            <div className="container mx-auto px-4 py-4">
                <p className="text-center text-[14px] text-gray-300/90 tracking-wide">
                    <span className="font-semibold text-white/95">Project Tail Lights</span>
                    <span className="mx-2 text-gray-500">|</span>
                    One Nature, Animal Welfare Club, MAHE, Manipal
                    <span className="mx-2 text-gray-500">|</span>
                    <span className="hidden sm:inline">Contact: </span>
                    <a
                        href="mailto:awc.mahe@manipal.edu"
                        className="text-emerald-300/90 hover:text-emerald-200 transition-colors"
                    >
                        awc.mahe@manipal.edu
                    </a>
                </p>
            </div>
        </footer>
    );
}
