import { motion } from 'framer-motion';

const stats = [
    {
        label: 'Active Donors',
        value: '1,247',
        icon: 'group',
        iconColor: 'text-primary',
        trend: { text: '12% from last month', color: 'text-emerald-500', icon: 'trending_up' },
    },
    {
        label: 'Patients Waiting',
        value: '3,891',
        icon: 'hourglass_empty',
        iconColor: 'text-amber-500',
        trend: { text: 'Stable volume', color: 'text-slate-400', icon: 'remove' },
    },
    {
        label: 'Matches Made',
        value: '842',
        icon: 'handshake',
        iconColor: 'text-emerald-500',
        trend: { text: '+5 this week', color: 'text-emerald-500', icon: 'trending_up' },
    },
    {
        label: 'Verified Hospitals',
        value: '156',
        icon: 'domain',
        iconColor: 'text-blue-500',
        trend: { text: 'Across 14 states', color: 'text-primary', icon: 'verified' },
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function StatsGrid() {
    return (
        <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {stats.map((stat) => (
                <motion.div
                    key={stat.label}
                    variants={cardVariants}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-default"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        <span className={`material-symbols-outlined ${stat.iconColor}`}>{stat.icon}</span>
                    </div>
                    <p className="text-3xl font-black">{stat.value}</p>
                    <div className={`flex items-center gap-1 ${stat.trend.color} text-xs font-bold mt-2`}>
                        <span className="material-symbols-outlined text-sm">{stat.trend.icon}</span>
                        <span>{stat.trend.text}</span>
                    </div>
                </motion.div>
            ))}
        </motion.section>
    );
}
