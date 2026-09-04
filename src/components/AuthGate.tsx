import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, User, Eye, EyeOff } from 'lucide-react';
import { ThemeMode } from '../types';
import { getThemeTokens } from '../theme';

interface AuthGateProps {
  onLogin: () => void;
  theme?: ThemeMode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLogin, theme = 'dark' }) => {
  const [username, setUsername] = useState('sasha');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const cardBg = tokens.cardBg;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const storedPass = localStorage.getItem('sashas_custom_password') || 'finance2026';
      const storedUser = localStorage.getItem('sashas_custom_username') || 'sasha';

      if (
        username.trim().toLowerCase() === storedUser.toLowerCase() &&
        password === storedPass
      ) {
        onLogin();
      } else {
        setError('Invalid credentials. Pre-defined: sasha / finance2026');
      }
      setIsSubmitting(false);
    }, 250);
  };

  const handleFillDemo = () => {
    setUsername('sasha');
    setPassword('finance2026');
    setError(null);
  };

  return (
    <div className={`min-h-[75vh] flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-xl space-y-6 ${cardBg}`}>
        {/* Security Shield Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-inherit">Sasha’s Finance Access</h2>
          <p className={`text-xs ${labelColor}`}>
            Pre-defined authentication active. Please authenticate to access and edit records.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={`block font-medium mb-1 ${labelColor}`}>Username</label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${labelColor}`}>
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className={`w-full pl-9 pr-3 py-2 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className={`block font-medium mb-1 ${labelColor}`}>Password</label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${labelColor}`}>
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full pl-9 pr-10 py-2 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer ${labelColor} hover:text-inherit`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? 'Authenticating...' : 'Unlock Dashboard'}
          </button>
        </form>

        {/* Quick Demo Credentials Helper */}
        <div className="pt-4 border-t border-inherit text-center">
          <p className={`text-[11px] mb-2 ${labelColor}`}>Default Credentials: sasha / finance2026</p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs text-amber-500 hover:underline font-medium cursor-pointer"
          >
            Auto-fill credentials
          </button>
        </div>
      </div>
    </div>
  );
};
