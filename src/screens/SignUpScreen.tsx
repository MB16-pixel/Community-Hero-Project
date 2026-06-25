import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, User, Mail, Lock, ShieldCheck, MapPin } from 'lucide-react';

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin }) => {
  const { signUp, error, loading, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [community, setCommunity] = useState('Green Valley');
  const [formError, setFormError] = useState<string | null>(null);

  const communities = [
    "Green Valley",
    "Metro Core",
    "South Shore",
    "Sunset Ridge",
    "East District"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!username.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      await signUp(username.trim(), email.trim(), password, community);
    } catch (err: any) {
      // Handled by context state, but we catch to prevent unhandled rejections
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
          <h2 className="text-xl font-serif font-bold text-[#2C362E] mb-6">Create an Account</h2>

          {(formError || error) && (
            <div className="flex items-start gap-2 bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] p-3.5 rounded-2xl text-xs mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. citizen_jane"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
                />
              </div>
            </div>

            {/* Community/District Dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-1.5">Community District</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <MapPin className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] appearance-none cursor-pointer"
                >
                  {communities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                "Join as Community Hero"
              )}
            </button>
          </form>

          {/* Navigation Toggle */}
          <div className="text-center mt-6">
            <p className="text-xs text-[#7A7A7A] font-medium">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#5A6B5D] font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
