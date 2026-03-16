import { motion } from 'framer-motion';

export default function HeroSection() {
    return (
        <section className="@container">
            <div className="relative overflow-hidden rounded-xl bg-slate-950 min-h-[500px] flex items-center justify-center text-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Medical Hero"
                        className="w-full h-full object-cover opacity-20"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTMnLfKmr0ZHm4-moeIi61BFM1KbtLgQKRa7MJ0t4abP6ORugUjpxs65ZvUV9JoUGgpIBAT8ppe681L3Bxms3hCrTaESVEz7drO1cqQzGZYfXt8YxxfsjpdS1eqciXMOI2RHEaOf_Huc-gyHbU7q6cex8Wjv6AZDu-OHNCnOR55CEW7a96WPRex1gcKcSnnxy6hulmdjWP-HMWdETDFjrShbnxAdUuGR5oyHtQEce-7x6BAdDxZ0EwrEx_sJrJOCqYWGpi04---48w"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950 to-slate-950" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 md:p-12 w-full max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-white text-5xl md:text-7xl font-black leading-none tracking-tighter mb-6"
                    >
                        Organ Donation <br />
                        <span className="text-primary">Management</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-2xl mx-auto"
                    >
                        Secure, transparent, and immutable organ tracking powered by enterprise blockchain technology.
                        Ensuring every life-saving gift reaches its destination.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-wrap gap-4 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center rounded-lg h-14 px-10 bg-primary text-white font-bold hover:brightness-110 transition-all duration-300"
                        >
                            Get Started
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center rounded-lg h-14 px-10 bg-white/5 text-white font-bold backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                            View Whitepaper
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
