import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Check, ShieldCheck, Crown, Sparkles } from 'lucide-react';
import { redirectToCheckout } from '../services/StripeService';
import { cn } from '../lib/utils';
import { DotPattern } from './ui/DotPattern';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge, ProBadge } from './ui/Badge';
import { BlurFade } from './ui/BlurFade';
import { ShimmerButton } from './ui/ShimmerButton';
import { BorderBeam } from './ui/BorderBeam';

export default function PricingScreen() {
  const { updatePlan } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleSelectPlan = async (plan) => {
    setLoading(plan);

    if (plan === 'free') {
      await new Promise(r => setTimeout(r, 1000));
      await updatePlan('free');
    } else {
      redirectToCheckout();
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
      "Vocal Range Histogram",
      "Smart Noise Filtering",
      "Unlimited Analysis Time"
    ]
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-surface-1 overflow-y-auto">
      {/* Background Pattern */}
      <DotPattern
        className="opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
        width={24}
        height={24}
        cr={1.5}
      />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 py-12">
        {/* Header */}
        <BlurFade delay={0}>
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
            >
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                Stage
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-text-secondary max-w-lg mx-auto"
            >
              Unlock the full potential of your voice with professional-grade tools.
            </motion.p>
          </div>
        </BlurFade>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Free Tier */}
          <BlurFade delay={0.1}>
            <Card
              variant="glass"
              padding="lg"
              className="h-full flex flex-col items-center text-center group hover:border-border-strong transition-all duration-300"
            >
              <div className="mb-6 p-4 bg-surface-3 rounded-2xl group-hover:bg-surface-4 transition-colors">
                <ShieldCheck className="w-8 h-8 text-text-secondary group-hover:text-white transition-colors" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Artist Basic</h3>

              <div className="mb-8">
                <span className="text-4xl font-bold text-text-secondary font-mono">$0</span>
                <span className="text-text-muted text-sm ml-1">/month</span>
              </div>

              <ul className="space-y-4 mb-8 text-left w-full">
                {features.free.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <div className="p-1 rounded-full bg-success/10">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleSelectPlan('free')}
                loading={loading === 'free'}
                className="w-full mt-auto"
              >
                {loading === 'free' ? 'Activating...' : 'Continue Free'}
              </Button>
            </Card>
          </BlurFade>

          {/* Premium Tier */}
          <BlurFade delay={0.2}>
            <Card
              variant="glass"
              padding="lg"
              className={cn(
                'h-full flex flex-col items-center text-center relative overflow-hidden',
                'border-primary/40 hover:border-primary/60',
                'transform hover:-translate-y-1 transition-all duration-300',
                'shadow-[0_0_60px_rgba(188,19,254,0.15)]'
              )}
            >
              {/* Border Beam effect */}
              <BorderBeam size={300} duration={10} />

              {/* Best Value Badge */}
              <div className="absolute -top-px -right-px">
                <div className="bg-gradient-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-xl shadow-lg">
                  MOST POPULAR
                </div>
              </div>

              <div className="mb-6 p-4 bg-gradient-primary rounded-2xl shadow-[0_0_30px_rgba(188,19,254,0.4)]">
                <Crown className="w-8 h-8 text-white" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-primary">
                  Pro Producer
                </h3>
                <ProBadge />
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white font-mono">$9.99</span>
                <span className="text-text-muted text-sm ml-1">/month</span>
              </div>

              <ul className="space-y-4 mb-8 text-left w-full">
                {features.premium.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white">
                    <div className="p-1 rounded-full bg-primary/20">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Shimmer Button for Premium CTA */}
              <div className="w-full mt-auto">
                <ShimmerButton
                  onClick={() => handleSelectPlan('premium')}
                  disabled={loading === 'premium'}
                  className="w-full"
                  shimmerColor="rgba(188, 19, 254, 0.5)"
                  shimmerSize="0.1em"
                >
                  <span className="flex items-center justify-center gap-2 text-white font-bold">
                    {loading === 'premium' ? (
                      'Upgrading...'
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Get Full Access
                      </>
                    )}
                  </span>
                </ShimmerButton>
              </div>
            </Card>
          </BlurFade>
        </div>

        {/* Trust indicators */}
        <BlurFade delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-text-dim text-sm">
              Cancel anytime · No hidden fees · Secure payment via Stripe
            </p>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
