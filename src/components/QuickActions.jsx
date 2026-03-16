import { motion } from 'framer-motion';

const actions = [
    {
        icon: 'person_add',
        title: 'Register Patient',
        desc: 'Onboard transplant candidates',
    },
    {
        icon: 'volunteer_activism',
        title: 'Register Donor',
        desc: 'Record donor medical data',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function QuickActions() {
    return (
        <section className="space-y-6">
            <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black tracking-tight"
            >
                Quick Actions
            </motion.h2>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {actions.map((action) => (
                    <motion.button
                        key={action.title}
                        variants={cardVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative flex items-center justify-between p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 size-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="size-16 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-3xl">{action.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black mb-1">{action.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{action.desc}</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-2 transition-all relative z-10 text-3xl font-light">
                            arrow_forward_ios
                        </span>
                    </motion.button>
                ))}
            </motion.div>
        </section>
    );
}
