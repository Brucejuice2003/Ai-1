import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Check, Star, Zap, Crown, ShieldCheck } from 'lucide-react';
import { redirectToCheckout } from '../services/StripeService';

export default function PricingScreen() {
    const { updatePlan } = useAuth();
    const [loading, setLoading] = useState(null);

    const handleSelectPlan = async (plan) => {
        setLoading(plan);

        if (plan === 'free') {
            // Free plan activation is instant
            await new Promise(r => setTimeout(r, 1000));
            await updatePlan('free');
        } else {
            // Premium redirects to Stripe
            redirectToCheckout();
            // Redirect happens, so loading state persists until unload
        }
    };

    const features = {
        free: [
            "Real-time Microphone Analysis",
            "Basic Pitch Detection",
            "Simple Vibrato Meter",
            "Standard Support"
        ],
        premium: [
            "Everything in Free",
            "Upload Audio Files (WAV/MP3)",
            "Advanced Key & BPM Finder",
            "Vocal Range Histogram 📊",
            "Smart Noise Filtering",
            "Unlimited Analysis Time"
        ]
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-y-auto overflow-x-hidden z-50">

            {/* Container */}
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

                {/* Header (Span 2 cols on desktop) */}
                <div className="md:col-span-2 text-center mb-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter"
                    >
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">Stage</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-lg mx-auto"
                    >
                        Unlock the full potential of your voice with professional-grade tools.
                    </motion.p>
                </div>

                {/* Free Tier */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-8 flex flex-col items-center text-center border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
                >
                    <div className="mb-4 p-4 bg-white/5 rounded-full">
                        <ShieldCheck className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Artist Basic</h3>
                    <div className="text-3xl font-bold text-gray-300 mb-6 font-mono">$0<span className="text-sm font-sans text-gray-500 font-normal">/mo</span></div>

                    <ul className="space-y-3 mb-8 text-left w-full">
                        {features.free.map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                <Check className="w-4 h-4 text-green-500/50" />
                                {feat}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleSelectPlan('free')}
                        disabled={loading === 'free'}
                        className="mt-auto w-full py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                    >
                        {loading === 'free' ? 'Activating...' : 'Continue Free'}
                    </button>
                </motion.div>

                {/* Premium Tier */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-8 flex flex-col items-center text-center border border-neon-purple/50 relative overflow-hidden transform hover:-translate-y-2 transition-all duration-300 shadow-[0_0_50px_rgba(188,19,254,0.15)]"
                >
                    {/* Best Value Badge */}
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-neon-purple to-neon-pink text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                        MOST POPULAR
                    </div>

                    <div className="mb-4 p-4 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full shadow-[0_0_15px_rgba(188,19,254,0.4)] animate-pulse-slow">
                        <Crown className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink mb-2">Pro Producer</h3>
                    <div className="text-3xl font-bold text-white mb-6 font-mono">$9.99<span className="text-sm font-sans text-gray-400 font-normal">/mo</span></div>

                    <ul className="space-y-3 mb-8 text-left w-full">
                        {features.premium.map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                                <div className="p-0.5 rounded-full bg-neon-purple/20">
                                    <Check className="w-3 h-3 text-neon-purple" />
                                </div>
                                {feat}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleSelectPlan('premium')}
                        disabled={loading === 'premium'}
                        className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all transform active:scale-95"
                    >
                        {loading === 'premium' ? 'Upgrading...' : 'Get Full Access'}
                    </button>
                </motion.div>

            </div>
        </div>
    );
}
