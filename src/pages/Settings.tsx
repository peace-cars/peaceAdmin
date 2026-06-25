import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  User, Palette, Globe, Moon, Sun, LogOut, Check,
  Bell, Shield, Smartphone, ChevronRight, Brush,
  LayoutDashboard, Zap, AlertTriangle, Loader2
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import type { CardAccent, BgGradient } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { API_URL, apiFetch } from '../lib/api';

// ─── Small helpers ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <span className="text-primary-main">{icon}</span>
      <h2 className="text-[13px] font-black uppercase tracking-widest text-text-muted">{title}</h2>
    </div>
    <div className="bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
      {children}
    </div>
  </div>
);

const Row: React.FC<{ label: string; sub?: string; children?: React.ReactNode; onClick?: () => void; border?: boolean }> = ({
  label, sub, children, onClick, border = true,
}) => (
  <div
    onClick={onClick}
    className={clsx(
      'flex items-center justify-between gap-4 px-5 py-4 transition-colors',
      border && 'border-b border-white/20 dark:border-white/[0.07] last:border-0',
      onClick && 'cursor-pointer hover:bg-white/30 dark:hover:bg-white/[0.05] active:scale-[0.99]',
    )}
  >
    <div className="min-w-0">
      <p className="text-[14px] font-semibold text-text-main truncate">{label}</p>
      {sub && <p className="text-[12px] text-text-muted mt-0.5 leading-snug">{sub}</p>}
    </div>
    {children}
  </div>
);

// Toggle pill
const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button
    onClick={onChange}
    className={clsx(
      'relative w-11 h-6 rounded-full transition-all shrink-0',
      on ? 'bg-primary-main' : 'bg-black/15 dark:bg-white/20',
    )}
  >
    <span
      className={clsx(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
        on ? 'left-[22px]' : 'left-0.5',
      )}
    />
  </button>
);

// ─── BG gradient options ──────────────────────────────────────────────────────
const BG_OPTIONS: { id: BgGradient; label: string; preview: string }[] = [
  { id: 'default',        label: 'Default',  preview: 'bg-gradient-to-br from-blue-600/40 via-blue-400/10 to-transparent' },
  { id: 'light-blue',     label: 'Sky',      preview: 'bg-gradient-to-b from-sky-300/60 to-transparent' },
  { id: 'light-emerald',  label: 'Emerald',  preview: 'bg-gradient-to-b from-emerald-300/60 to-transparent' },
  { id: 'light-purple',   label: 'Purple',   preview: 'bg-gradient-to-b from-purple-300/60 to-transparent' },
  { id: 'light-coral',    label: 'Coral',    preview: 'bg-gradient-to-b from-rose-300/60 to-transparent' },
  { id: 'solid-white',    label: 'White',    preview: 'bg-white' },
  { id: 'solid-slate',    label: 'Slate',    preview: 'bg-slate-200' },
  { id: 'solid-blue',     label: 'Blue',     preview: 'bg-sky-200' },
];

// ─── Card accent options ──────────────────────────────────────────────────────
const ACCENT_OPTIONS: { id: CardAccent; label: string; dot: string }[] = [
  { id: 'none',         label: 'None',    dot: 'bg-gray-300 dark:bg-gray-600' },
  { id: 'solid-blue',   label: 'Blue',    dot: 'bg-blue-600' },
  { id: 'solid-green',  label: 'Green',   dot: 'bg-emerald-500' },
  { id: 'solid-amber',  label: 'Amber',   dot: 'bg-amber-400' },
  { id: 'solid-rose',   label: 'Rose',    dot: 'bg-rose-500' },
  { id: 'solid-purple', label: 'Purple',  dot: 'bg-purple-600' },
  { id: 'light-blue',   label: 'L.Blue',  dot: 'bg-blue-200 border border-blue-300' },
  { id: 'light-green',  label: 'L.Green', dot: 'bg-emerald-200 border border-emerald-300' },
  { id: 'light-amber',  label: 'L.Amber', dot: 'bg-amber-100 border border-amber-300' },
  { id: 'light-rose',   label: 'L.Rose',  dot: 'bg-rose-100 border border-rose-300' },
  { id: 'light-purple', label: 'L.Purple',dot: 'bg-purple-100 border border-purple-300' },
];

// ─── Language options ─────────────────────────────────────────────────────────
const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'Amharic', flag: '🇪🇹' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { theme, toggleTheme, bgGradient, setBgGradient, cardAccent, setCardAccent } = useTheme();
  const { i18n } = useTranslation();
  const { session, logout } = useAuth();

  const role = localStorage.getItem('admin_role') || 'Admin';
  const profile = (session as any)?.profile;
  const email = session?.user?.email || 'admin@peacecars.com';
  const name = profile?.full_name || profile?.name || email.split('@')[0];
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const [notifications, setNotifications] = useState(true);

  // Feature Flags State
  const [flags, setFlags] = useState({
    sell: false,
    source: false,
    community: false,
  });

  // Wipe Data State
  const [wipeConfirmStep, setWipeConfirmStep] = useState(0); // 0=hidden, 1=warning, 2=typing
  const [wipeInput, setWipeInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // Fetch flags on mount
  React.useEffect(() => {
    if (role === 'GENERAL_MANAGER') {
      apiFetch<Record<string, string>>('/settings').then(res => {
        const data = (res as any).data || res;
        setFlags({
          sell: data.feature_sell === 'true',
          source: data.feature_source === 'true',
          community: data.feature_community === 'true',
        });
      }).catch(err => console.error('Failed to fetch flags', err));
    }
  }, [role]);

  // Handle Feature Flag Toggle
  const toggleFlag = async (key: keyof typeof flags, dbKey: string) => {
    const newValue = !flags[key];
    setFlags(prev => ({ ...prev, [key]: newValue }));
    try {
      await apiFetch(`/settings/feature-flags/${dbKey}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: String(newValue) })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      setFlags(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  // Handle Data Wipe
  const handleWipeData = async () => {
    if (wipeInput !== 'WIPE ALL DATA') return;
    setIsWiping(true);
    try {
      await apiFetch('/settings/wipe-all', { method: 'POST' });
      alert('All test data has been completely wiped from the system.');
      setWipeConfirmStep(0);
      setWipeInput('');
    } catch (e: any) {
      alert(`Wipe failed: ${e.message}`);
    } finally {
      setIsWiping(false);
    }
  };

  return (

    <div className="max-w-xl mx-auto space-y-8 pb-8">

      {/* ── Page Title ── */}
      <div className="pt-1">
        <h1 className="text-[26px] font-black tracking-tight text-text-main">Settings</h1>
        <p className="text-[13px] text-text-muted mt-0.5">Manage your profile, appearance & preferences</p>
      </div>

      {/* ── Profile Card ── */}
      <Section title="Profile" icon={<User size={15} />}>
        <div className="p-5 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-main to-primary-main/60 flex items-center justify-center text-white text-[22px] font-black shadow-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-black text-text-main truncate">{name}</p>
            <p className="text-[12px] text-text-muted truncate">{email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-primary-main/10 text-primary-main text-[10px] font-bold uppercase tracking-wider">
              {role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance" icon={<Palette size={15} />}>
        {/* Dark / Light mode */}
        <Row label="Dark Mode" sub={theme === 'dark' ? 'Currently dark' : 'Currently light'}>
          <div className="flex items-center gap-2.5 shrink-0">
            {theme === 'dark' ? (
              <Moon size={16} className="text-indigo-400" />
            ) : (
              <Sun size={16} className="text-amber-400" />
            )}
            <Toggle on={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </Row>

        {/* Background style */}
        <div className="px-5 py-4 border-b border-white/20 dark:border-white/[0.07]">
          <p className="text-[14px] font-semibold text-text-main mb-3">Background Style</p>
          <div className="grid grid-cols-4 gap-2">
            {BG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBgGradient(opt.id)}
                className={clsx(
                  'relative flex flex-col items-center gap-1.5 group',
                )}
              >
                <div className={clsx(
                  'w-full aspect-video rounded-xl overflow-hidden border-2 transition-all',
                  opt.preview,
                  bgGradient === opt.id
                    ? 'border-primary-main shadow-md shadow-primary-main/20 scale-[1.05]'
                    : 'border-white/40 dark:border-white/10 hover:border-primary-main/50',
                )}>
                  {bgGradient === opt.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Check size={12} className="text-primary-main drop-shadow" />
                    </div>
                  )}
                </div>
                <span className={clsx(
                  'text-[10px] font-semibold truncate w-full text-center',
                  bgGradient === opt.id ? 'text-primary-main' : 'text-text-muted',
                )}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Accent */}
        <div className="px-5 py-4">
          <p className="text-[14px] font-semibold text-text-main mb-3">Dashboard Card Accent</p>
          <div className="flex flex-wrap gap-2">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                title={opt.label}
                onClick={() => setCardAccent(opt.id)}
                className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95',
                  opt.dot,
                  cardAccent === opt.id
                    ? 'ring-2 ring-primary-main ring-offset-2 ring-offset-white dark:ring-offset-transparent scale-110'
                    : '',
                )}
              >
                {cardAccent === opt.id && <Check size={11} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Colors the accent stripe on KPI status cards across the dashboard.
          </p>
        </div>
      </Section>

      {/* ── Language ── */}
      <Section title="Language" icon={<Globe size={15} />}>
        {LANGS.map((lang, idx) => (
          <Row
            key={lang.code}
            label={`${lang.flag}  ${lang.label}`}
            border={idx < LANGS.length - 1}
            onClick={() => i18n.changeLanguage(lang.code)}
          >
            {i18n.language === lang.code ? (
              <span className="w-5 h-5 rounded-full bg-primary-main flex items-center justify-center shrink-0">
                <Check size={11} className="text-white" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-border-subtle shrink-0" />
            )}
          </Row>
        ))}
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" icon={<Bell size={15} />}>
        <Row
          label="Push Notifications"
          sub="Receive alerts for activity on your account"
        >
          <Toggle on={notifications} onChange={() => setNotifications(n => !n)} />
        </Row>
      </Section>

      {/* ── Client App Features (GM Only) ── */}
      {role === 'GENERAL_MANAGER' && (
        <Section title="Client App Features" icon={<Smartphone size={15} />}>
          <Row label="Sell Your Car" sub="Show 'Sell' tab and forms in client app">
            <Toggle on={flags.sell} onChange={() => toggleFlag('sell', 'feature_sell')} />
          </Row>
          <Row label="Custom Sourcing" sub="Show 'Source' tab and forms in client app">
            <Toggle on={flags.source} onChange={() => toggleFlag('source', 'feature_source')} />
          </Row>
          <Row label="Community Hub" sub="Show 'Community' tab in client app" border={false}>
            <Toggle on={flags.community} onChange={() => toggleFlag('community', 'feature_community')} />
          </Row>
        </Section>
      )}

      {/* ── Account ── */}
      <Section title="Account" icon={<Shield size={15} />}>
        <Row label="Role" sub="Your access level in the system">
          <span className="text-[12px] font-bold text-primary-main shrink-0">
            {role.replace(/_/g, ' ')}
          </span>
        </Row>
        <Row label="Session" sub="Currently signed in" border={false}>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
            <span className="text-[12px] font-semibold text-emerald-500">Active</span>
          </span>
        </Row>
      </Section>

      {/* ── Sign Out ── */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-3xl border-2 border-rose-400/30 bg-rose-50/50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold text-[15px] hover:bg-rose-100/70 dark:hover:bg-rose-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      {/* ── Danger Zone (GM Only) ── */}
      {role === 'GENERAL_MANAGER' && (
        <div className="pt-8">
          <Section title="Danger Zone" icon={<AlertTriangle size={15} className="text-rose-500" />}>
            {wipeConfirmStep === 0 ? (
              <div className="p-5">
                <p className="text-[13px] text-text-muted mb-4">
                  Delete all testing data to prepare the system for production launch. This action is irreversible.
                </p>
                <button
                  onClick={() => setWipeConfirmStep(1)}
                  className="w-full py-3 rounded-2xl bg-rose-500 text-white font-bold text-[14px] hover:bg-rose-600 active:scale-[0.98] transition-all"
                >
                  Wipe All Test Data
                </button>
              </div>
            ) : (
              <div className="p-5 border-2 border-rose-500 rounded-3xl bg-rose-50/50 dark:bg-rose-900/10">
                <h3 className="text-rose-600 dark:text-rose-400 font-black text-[15px] mb-2">Are you absolutely sure?</h3>
                <p className="text-[13px] text-text-main font-medium mb-4">
                  This will permanently delete all inventory, messages, profiles (except GM/Admin), requests, and transactions.
                </p>
                <p className="text-[12px] text-text-muted mb-2">Type <strong className="text-rose-500">WIPE ALL DATA</strong> to confirm:</p>
                <input
                  type="text"
                  value={wipeInput}
                  onChange={(e) => setWipeInput(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border-2 border-rose-200 dark:border-rose-900/50 rounded-xl px-4 py-2.5 text-[14px] font-bold text-center text-rose-500 placeholder:text-rose-300 outline-none focus:border-rose-500 mb-4 transition-all"
                  placeholder="WIPE ALL DATA"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setWipeConfirmStep(0); setWipeInput(''); }}
                    className="flex-1 py-3 rounded-xl bg-bg-secondary text-text-main font-bold text-[13px] hover:bg-white dark:hover:bg-white/10 transition-all"
                    disabled={isWiping}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWipeData}
                    disabled={wipeInput !== 'WIPE ALL DATA' || isWiping}
                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-[13px] hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isWiping ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Wipe'}
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* App Version */}
      <p className="text-center text-[11px] text-text-muted/40 font-medium pb-4">
        PeaceCars Admin · v2.0
      </p>
    </div>
  );
}
