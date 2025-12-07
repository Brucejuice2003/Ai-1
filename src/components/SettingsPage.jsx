import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Volume2,
  Mic,
  Key,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PageContainer, PageHeader, PageSection } from './layout/PageContainer';
import { Card } from './ui/Card';
import { Input, Label, Select, FormGroup } from './ui/Input';
import { Button } from './ui/Button';
import { Badge, ProBadge } from './ui/Badge';
import { BlurFade } from './ui/BlurFade';

function SettingSection({ icon: Icon, title, description, children, className }) {
  return (
    <Card variant="default" padding="none" className={cn('overflow-hidden', className)}>
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function SettingRow({ label, description, children, className }) {
  return (
    <div className={cn('flex items-center justify-between py-3', className)}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-white">{label}</p>
        {description && (
          <p className="text-sm text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-surface-4'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export default function SettingsPage({ user }) {
  const [settings, setSettings] = useState({
    inputGain: 1.0,
    noiseGate: 0.02,
    autoDetectDevice: true,
    notifications: true,
    darkMode: true,
    youtubeApiKey: '',
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PageContainer maxWidth="4xl" className="py-8">
      <BlurFade delay={0}>
        <PageHeader
          title="Settings"
          description="Manage your account and app preferences"
        />
      </BlurFade>

      <div className="space-y-6">
        {/* Account Section */}
        <BlurFade delay={0.1}>
          <SettingSection
            icon={User}
            title="Account"
            description="Your profile and subscription"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-surface-3 overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'user'}`}
                    alt="Avatar"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">
                      {user?.stageName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <ProBadge />
                  </div>
                  <p className="text-sm text-text-muted truncate">
                    {user?.email || 'dev@test.com'}
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  Edit Profile
                </Button>
              </div>

              <SettingRow
                label="Subscription"
                description="Pro Producer plan"
              >
                <Badge variant="success" dot>Active</Badge>
              </SettingRow>

              <SettingRow
                label="Billing"
                description="Manage payment methods"
              >
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Manage
                </Button>
              </SettingRow>
            </div>
          </SettingSection>
        </BlurFade>

        {/* Audio Settings */}
        <BlurFade delay={0.2}>
          <SettingSection
            icon={Mic}
            title="Audio Settings"
            description="Configure microphone and detection"
          >
            <div className="space-y-4">
              <FormGroup>
                <Label>Input Gain</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.inputGain}
                    onChange={(e) => updateSetting('inputGain', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm text-text-secondary w-12 text-right">
                    {settings.inputGain.toFixed(1)}x
                  </span>
                </div>
              </FormGroup>

              <FormGroup>
                <Label>Noise Gate Threshold</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.005"
                    value={settings.noiseGate}
                    onChange={(e) => updateSetting('noiseGate', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <span className="text-sm text-text-secondary w-12 text-right">
                    {settings.noiseGate.toFixed(3)}
                  </span>
                </div>
              </FormGroup>

              <SettingRow
                label="Auto-detect Input Device"
                description="Automatically select best microphone"
              >
                <Toggle
                  checked={settings.autoDetectDevice}
                  onChange={(val) => updateSetting('autoDetectDevice', val)}
                />
              </SettingRow>
            </div>
          </SettingSection>
        </BlurFade>

        {/* API Keys */}
        <BlurFade delay={0.3}>
          <SettingSection
            icon={Key}
            title="API Keys"
            description="Third-party service integrations"
          >
            <div className="space-y-4">
              <FormGroup>
                <Label>YouTube API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your YouTube API key"
                  value={settings.youtubeApiKey}
                  onChange={(e) => updateSetting('youtubeApiKey', e.target.value)}
                />
                <p className="text-xs text-text-muted mt-1">
                  Optional. Used for fetching song covers and metadata.
                </p>
              </FormGroup>
            </div>
          </SettingSection>
        </BlurFade>

        {/* Preferences */}
        <BlurFade delay={0.4}>
          <SettingSection
            icon={Bell}
            title="Preferences"
            description="Notifications and display"
          >
            <div className="space-y-1">
              <SettingRow
                label="Push Notifications"
                description="Receive analysis completion alerts"
              >
                <Toggle
                  checked={settings.notifications}
                  onChange={(val) => updateSetting('notifications', val)}
                />
              </SettingRow>

              <SettingRow
                label="Dark Mode"
                description="Always enabled for optimal experience"
              >
                <Toggle
                  checked={settings.darkMode}
                  onChange={(val) => updateSetting('darkMode', val)}
                />
              </SettingRow>
            </div>
          </SettingSection>
        </BlurFade>

        {/* Help & Support */}
        <BlurFade delay={0.5}>
          <SettingSection
            icon={HelpCircle}
            title="Help & Support"
          >
            <div className="space-y-1">
              <SettingRow label="Documentation">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  View
                </Button>
              </SettingRow>
              <SettingRow label="Contact Support">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Email
                </Button>
              </SettingRow>
              <SettingRow label="Privacy Policy">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Read
                </Button>
              </SettingRow>
            </div>
          </SettingSection>
        </BlurFade>

        {/* App Info */}
        <BlurFade delay={0.6}>
          <div className="text-center py-8 text-text-muted text-sm">
            <p>Singers Dreams v1.0.0</p>
            <p className="mt-1">&copy; {new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </BlurFade>
      </div>
    </PageContainer>
  );
}
