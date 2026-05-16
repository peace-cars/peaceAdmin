import { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone,
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

import logo from '../assets/logo.png';
import { useTheme } from '../lib/ThemeContext';
import authBg from '../assets/auth-bg.png';

export default function Login() {
  const { login, register } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('GENERAL_MANAGER');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await register(email, password, fullName, role, phoneNumber);
        if (error) {
          setErrorMsg(error);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await login(email, password);
        if (error) {
          setErrorMsg(error);
          setLoading(false);
          return;
        }
      }
      window.location.href = '/';
    } catch (err) {
      setErrorMsg("Unable to connect to the authentication server.");
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              Admin Portal
            </h1>
            <p className="text-sm text-text-muted/60 font-medium">
              Peace Market Enterprise Solutions
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className={cn(
          "rounded-3xl border border-border-subtle/30 p-8 md:p-10 shadow-2xl transition-all duration-300 bg-surface-card"
        )}>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-main">
              {isSignUp ? 'Create Admin Account' : 'Sign In'}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="bg-error-main/10 border border-error-main/20 text-error-main px-4 py-3 rounded-xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Full Name</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                      <input 
                        type="text" 
                        placeholder="Legal Name" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                        required
                      />
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                      <input 
                        type="tel" 
                        placeholder="+251 ..." 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                        required
                      />
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">System Role</label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30 pointer-events-none" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                         className={cn(
                          "w-full border p-4 pl-12 pr-10 rounded-xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                        )}
                      >
                        <option value="GENERAL_MANAGER">General Manager</option>
                        <option value="DISTRICT_MANAGER">District Manager</option>
                         <option value="STAFF">Branch Staff</option>
                      </select>
                      <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/30 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

             <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-text-muted/40">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />
                <input 
                  type="email" 
                  placeholder="admin@peacemarket.com" 
                  value={email}
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
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border p-4 pl-12 rounded-xl outline-none transition-all font-medium text-sm bg-bg-secondary border-border-subtle/30 text-text-main focus:border-primary-main/30"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
               className={cn(
                "w-full h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg bg-primary-main text-bg active:scale-[0.98]"
              )}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

           <div className="mt-8 pt-8 border-t border-border-subtle/30 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-xs font-bold text-primary-main hover:opacity-80 transition-all uppercase tracking-wider"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an admin account? Request Access'}
            </button>
          </div>
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
