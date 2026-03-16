import { motion } from 'framer-motion';

export default function Header() {
    return (
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-3"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
                        <span className="material-symbols-outlined">account_tree</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">LifeChain</h2>
                </div>

                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <a className="text-primary" href="#">Dashboard</a>
                        <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">Network</a>
                        <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">Analytics</a>
                    </nav>
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-primary/20">
                        <img
                            alt="Profile"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYBTtWuBRW66lalHn2dNjUyx9SAewCLpoTATF6qHSvEJZfssh5RYo9XklQxB3J5BjIJOLt4p_nj6BkHF4imkxXFWqelLqu8L1lJC1RdViFM-9k5jhDW2_IKKD20G_-zf34FWe1L63goB_Y_MoLCHRKFTF1VBs9GUUSXnHkVtAwyoDCPPNw3A98sysJC324p6YeWfSz1xHfTz4vxUd8dFnfgqAPnP_TOHtIKKtrhluY52JCBcGlK4LItMnYIYl3YjsVTrrHnwFxaGso"
                        />
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
