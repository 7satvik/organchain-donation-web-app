import { motion } from 'framer-motion';

const activities = [
    {
        icon: 'link',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600',
        title: 'Donor Match Found',
        hash: '0x8f2...a4e2',
        hospital: 'City Hospital',
        time: '2 mins ago',
    },
    {
        icon: 'person_add',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        title: 'New Patient Registered',
        hash: '0x4c1...91d3',
        hospital: 'Hospital A',
        time: '14 mins ago',
    },
    {
        icon: 'verified_user',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600',
        title: 'Hospital Verification Renewed',
        hash: '0x2e8...ff10',
        hospital: 'St. Jude Medical',
        time: '45 mins ago',
    },
    {
        icon: 'medical_services',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600',
        title: 'Organ Procurement Logged',
        hash: '0x7b4...bc91',
        hospital: 'Central General',
        time: '1 hour ago',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1 },
    },
};

const rowVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function RecentActivity() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold">Recent Blockchain Activity</h2>
                <button className="text-primary text-sm font-semibold hover:underline">View Ledger</button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="divide-y divide-slate-100 dark:divide-slate-700"
            >
                {activities.map((activity) => (
                    <motion.div
                        key={activity.hash}
                        variants={rowVariants}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`size-10 rounded ${activity.iconBg} ${activity.iconColor} flex items-center justify-center`}>
                                <span className="material-symbols-outlined">{activity.icon}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                                <p className="text-xs text-slate-500">
                                    Hash: {activity.hash} • {activity.hospital}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-400">{activity.time}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.section>
    );
}
