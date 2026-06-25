import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Mail, Lock, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp }) => {
  const { login, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err) {
      // Error handled by Context state, caught locally to prevent rejection warnings
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto px-6 py-8 justify-center text-[#3D3D3D]">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5A6B5D] text-white mb-4 shadow-lg shadow-[#5A6B5D]/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2C362E] tracking-tight">Community Hero</h1>
          <p className="text-sm text-[#7A7A7A] mt-2 font-medium">Empowering citizens to report & resolve local issues</p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#EDE9E0]">
          <h2 className="text-xl font-serif font-bold text-[#2C362E] mb-6">Welcome Back</h2>

          {(formError || error) && (
            <div className="flex items-start gap-2 bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] p-3.5 rounded-2xl text-xs mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#5A6B5D] hover:bg-[#4A594D] text-white rounded-xl text-sm font-bold shadow-md shadow-[#5A6B5D]/10 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Navigation Toggle */}
          <div className="text-center mt-6">
            <p className="text-xs text-[#7A7A7A] font-medium">
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-[#5A6B5D] font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
