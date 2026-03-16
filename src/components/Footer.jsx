import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-background-dark"
        >
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <p className="text-sm font-medium">Secured by LifeChain Network Protocol v2.4.0</p>
                </div>
                <div className="flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-primary transition-colors" href="#">Contact Support</a>
                </div>
            </div>
        </motion.footer>
    );
}
