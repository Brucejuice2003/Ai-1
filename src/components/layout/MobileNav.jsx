import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Music, History, Settings, Crown } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Live', path: '/dashboard', icon: Mic },
  { name: 'Finder', path: '/key-finder', icon: Music, premium: true },
  { name: 'History', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function MobileNav({ isPremium }) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'lg:hidden', // Hide on desktop
        'bg-surface-1/90 backdrop-blur-xl',
        'border-t border-border-default',
        'safe-area-inset-bottom'
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isLocked = item.premium && !isPremium;

          return (
            <NavLink
              key={item.path}
              to={isLocked ? '#' : item.path}
              onClick={(e) => isLocked && e.preventDefault()}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'w-16 h-12 rounded-xl',
                'transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-secondary',
                isLocked && 'opacity-50'
              )}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                {isLocked && (
                  <Crown className="absolute -top-1 -right-1 w-2.5 h-2.5 text-primary" />
                )}
              </div>

              <span
                className={cn(
                  'text-[10px] font-medium mt-1',
                  isActive ? 'text-primary' : 'text-text-muted'
                )}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// Floating dock variant (more premium feel)
export function MobileNavDock({ isPremium }) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'lg:hidden',
        'bg-surface-2/95 backdrop-blur-xl',
        'border border-border-default',
        'rounded-2xl shadow-xl',
        'safe-area-inset-bottom'
      )}
    >
      <div className="flex items-center gap-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isLocked = item.premium && !isPremium;

          return (
            <NavLink
              key={item.path}
              to={isLocked ? '#' : item.path}
              onClick={(e) => isLocked && e.preventDefault()}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'w-14 h-12 rounded-xl',
                'transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-text-muted hover:text-text-secondary',
                isLocked && 'opacity-50'
              )}
            >
              {/* Active background with glow */}
              {isActive && (
                <motion.div
                  layoutId="mobile-dock-indicator"
                  className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_20px_rgba(188,19,254,0.3)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <Icon className="w-5 h-5" />
                {isLocked && (
                  <Crown className="absolute -top-1 -right-2 w-2.5 h-2.5 text-warning" />
                )}
              </div>

              <span
                className={cn(
                  'text-[9px] font-medium mt-0.5 relative z-10',
                  isActive ? 'text-white' : 'text-text-muted'
                )}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
