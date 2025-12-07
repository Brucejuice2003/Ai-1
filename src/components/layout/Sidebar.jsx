import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  Music,
  Settings,
  History,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProBadge } from '../ui/Badge';

const navItems = [
  {
    name: 'Live',
    path: '/dashboard',
    icon: Mic,
    description: 'Real-time pitch analysis',
  },
  {
    name: 'Key Finder',
    path: '/key-finder',
    icon: Music,
    description: 'Find song keys & chords',
    premium: true,
  },
  {
    name: 'History',
    path: '/history',
    icon: History,
    description: 'Past analyses',
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'App preferences',
  },
];

export function Sidebar({
  user,
  isPremium,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40',
        'bg-surface-1/95 backdrop-blur-xl',
        'border-r border-border-default',
        'flex flex-col',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[240px]',
        'hidden lg:flex'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center px-4',
        'border-b border-border-subtle'
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-semibold text-white whitespace-nowrap"
            >
              Singers Dreams
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isLocked = item.premium && !isPremium;

          return (
            <NavLink
              key={item.path}
              to={isLocked ? '#' : item.path}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-white'
                  : 'text-text-secondary hover:text-white hover:bg-surface-3',
                isLocked && 'opacity-60 cursor-not-allowed'
              )}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive && 'text-primary'
                )}
              />

              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-between min-w-0"
                >
                  <span className="font-medium truncate">{item.name}</span>
                  {item.premium && !isPremium && (
                    <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </motion.div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-3 rounded-md text-sm font-medium text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade card */}
      {!isPremium && !collapsed && (
        <div className="px-3 py-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-white">Go Pro</span>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Unlock Key Finder and all premium features
            </p>
            <button className="w-full btn btn-primary btn-sm">
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* User section */}
      <div className={cn(
        'p-4 border-t border-border-subtle',
        'flex items-center gap-3'
      )}>
        <div className="w-9 h-9 rounded-full bg-surface-3 overflow-hidden flex-shrink-0">
          {user?.email && (
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
              alt="Avatar"
              className="w-full h-full"
            />
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {user?.stageName || user?.email?.split('@')[0] || 'User'}
              </p>
              {isPremium && <ProBadge />}
            </div>
            <p className="text-xs text-text-muted truncate">
              {user?.email}
            </p>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-3 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'absolute -right-3 top-20',
          'w-6 h-6 rounded-full',
          'bg-surface-2 border border-border-default',
          'flex items-center justify-center',
          'text-text-muted hover:text-white',
          'transition-colors'
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;
