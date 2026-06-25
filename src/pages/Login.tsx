import { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone,
  ChevronRight,
  Loader2,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';

import logo from '../assets/logo.png';
import { useTheme } from '../lib/ThemeContext';
import authBg from '../assets/auth-bg.png';

type Mode = 'login' | 'bootstrap';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bootstrapSuccess, setBootstrapSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await login(email, password);
      if (error) { setErrorMsg(error); setLoading(false); return; }
      navigate('/');
    } catch {
      setErrorMsg('Unable to connect to the authentication server.');
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/auth/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phoneNumber: phoneNumber || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message || 'Bootstrap failed');
        setLoading(false);
        return;
      }
      setBootstrapSuccess(true);
    } catch {
      setErrorMsg('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => { i18n.changeLanguage(lng); };

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden bg-bg-base"
    )}>
      
      {/* Enterprise Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={authBg} 
          alt="Enterprise Background" 
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000",
            theme === 'dark' ? "opacity-30 brightness-[0.4]" : "opacity-10 grayscale"
          )}
        />
        <div className={cn(
          "absolute inset-0",
          theme === 'dark' 
            ? "bg-gradient-to-br from-bg-base via-bg-base/80 to-primary-main/10" 
            : "bg-gradient-to-br from-bg-base via-bg-base/90 to-border-subtle/20"
        )} />
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-card rounded-2xl shadow-xl p-4 mb-2 border border-border-subtle/30">
            <img src={logo} alt="Peace Cars" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-main">Admin Portal</h1>
            <p className="text-sm text-text-muted/60 font-medium">Peace Market Enterprise Solutions</p>
          </div>
        </div>

        {/* No card — bare form layout */}
        <div className="w-full">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-main">
              {mode === 'login' ? 'Sign In' : 'System Setup'}
            </h2>
            <div className="flex gap-2">
              {['en', 'am'].map((lng) => (
                <button 
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className={cn(
                    "text-[13px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all",
                    i18n.language === lng 
                      ? "bg-primary-main text-bg" 
                      : "text-text-muted/60 hover:text-text-main"
                  )}
                >
                  {lng}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── BOOTSTRAP SUCCESS ── */}
            {mode === 'bootstrap' && bootstrapSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="flex justify-center">
                  <CheckCircle2 size={56} className="text-success" />
                </div>
                <div>
                  <p className="text-text-main font-bold text-lg">System Ready!</p>
                  <p className="text-text-muted text-sm mt-1">
                    General Manager account created. Please check your email to confirm, then sign in.
                  </p>
                </div>
                <button
                  onClick={() => { setMode('login'); setBootstrapSuccess(false); setPassword(''); }}
                  className="w-full h-14 rounded-xl font-bold text-sm bg-primary-main text-bg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {errorMsg && (
                  <div className="bg-error-main/10 border border-error-main/20 text-error-main px-4 py-3 rounded-xl text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="email" placeholder="admin@peacemarket.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg bg-primary-main text-bg active:scale-[0.98]"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : (
                    <><span>Sign In</span><ArrowRight size={18} /></>
                  )}
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle/30"></div>
                  </div>
                  <div className="relative bg-bg-base px-3 text-[10px] font-bold tracking-widest uppercase text-text-muted/50">
                    Or
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="w-full bg-white text-gray-800 border border-gray-200 h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </motion.form>
            )}

            {/* ── BOOTSTRAP FORM ── */}
            {mode === 'bootstrap' && !bootstrapSuccess && (
              <motion.form
                key="bootstrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleBootstrap}
                className="space-y-5"
              >
                <div className="bg-primary-main/10 border border-primary-main/20 rounded-xl p-3 text-xs text-primary-main font-bold text-center">
                  🚀 First-time setup — creates the root General Manager account. Disabled once any user exists.
                </div>

                {errorMsg && (
                  <div className="bg-error-main/10 border border-error-main/20 text-error-main px-4 py-3 rounded-xl text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Full Name</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="text" placeholder="System Administrator" value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Phone (optional)</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="tel" placeholder="+251 ..." value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="email" placeholder="admin@peacecars.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Password (min 8 chars)</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                    <input 
                      type="password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg bg-primary-main text-bg active:scale-[0.98]"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : (
                    <><Rocket size={18} /><span>Initialize System</span></>
                  )}
                </button>
              </motion.form>
            )}

          </AnimatePresence>

          {/* Toggle */}
          {!bootstrapSuccess && (
            <div className="mt-8 pt-8 border-t border-border-subtle/30 text-center space-y-2">
              <button 
                onClick={() => { setMode(mode === 'login' ? 'bootstrap' : 'login'); setErrorMsg(''); }}
                className="text-xs font-bold text-primary-main hover:opacity-80 transition-all uppercase tracking-wider"
              >
                {mode === 'login' 
                  ? '⚡ Fresh install? Set up first admin account' 
                  : '← Back to Sign In'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[13px] font-bold text-text-muted/40 font-medium">
            © 2026 Peace Market Corp. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
