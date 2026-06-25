import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Trash2, 
  Save, 
  Sparkles, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { COUNTRIES } from '../types';

export const AccountScreen: React.FC = () => {
  const { user, updateProfile, deleteAccount, logout, error, loading, clearError } = useAuth();
  
  // Local form states
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [community, setCommunity] = useState(user?.community || '🇺🇸 United States');
  
  // Alert/Feedback states
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    clearError();

    if (!username.trim() || !email.trim() || !password.trim()) {
      setFormError("All profile fields are required.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      await updateProfile(username.trim(), email.trim(), password, community);
      setFormSuccess("Profile credentials and country updated successfully in Firestore!");
      setTimeout(() => setFormSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
    } catch (err: any) {
      setFormError("Failed to delete account. Try again.");
      setShowDeleteConfirm(false);
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Header Profile Banner */}
      <div className="bg-[#F4EFE6] text-[#3D3D3D] px-6 py-6 rounded-b-[2.5rem] shadow-sm relative overflow-hidden shrink-0 border-b border-[#E5E0D5]">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-[#EAE4D8] border-2 border-[#DCD6C8] flex items-center justify-center font-serif font-bold text-2xl text-[#5A6B5D] shadow-inner uppercase">
            {user?.username?.substring(0, 2) || "CH"}
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#2C362E]">{user?.username}</h1>
            <p className="text-xs text-[#7A7A7A] flex items-center gap-1 mt-0.5 font-medium">
              <MapPin className="w-3 h-3 text-[#D9835D] fill-[#D9835D]" />
              Country: {user?.community}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-lg mx-auto w-full flex-1">
        {/* Profile Notifications */}
        {formSuccess && (
          <div className="flex items-start gap-2.5 bg-[#F0F5F1] border border-[#EDE9E0] text-[#5A6B5D] p-3.5 rounded-2xl text-xs shadow-sm">
            <CheckCircle className="w-4 h-4 text-[#5A6B5D] shrink-0 mt-0.5" />
            <span className="font-semibold">{formSuccess}</span>
          </div>
        )}

        {(formError || error) && (
          <div className="flex items-start gap-2.5 bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] p-3.5 rounded-2xl text-xs shadow-sm">
            <AlertTriangle className="w-4 h-4 text-[#D9835D] shrink-0 mt-0.5" />
            <span className="font-semibold">{formError || error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#EDE9E0]">
          <h2 className="text-base font-serif font-bold text-[#2C362E] mb-4 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#5A6B5D]" />
            Modify Credentials
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-[9px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-1">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7A7A7A]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#EDE9E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[9px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7A7A7A]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#EDE9E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[9px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7A7A7A]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#EDE9E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] font-medium"
                />
              </div>
            </div>

            {/* Country Select Input */}
            <div>
              <label className="block text-[9px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-1">Country</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7A7A7A]">
                  <MapPin className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#FBF9F6] border border-[#EDE9E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] appearance-none cursor-pointer font-medium"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.name} value={`${country.flag} ${country.name}`}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#5A6B5D]">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5A6B5D] hover:bg-[#4A594D] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-75 shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Metrics Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#EDE9E0]">
          <h2 className="text-base font-serif font-bold text-[#2C362E] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#5A6B5D]" />
            Citizen Contributions
          </h2>
          <div className="space-y-3 text-xs text-[#3D3D3D]">
            <div className="flex justify-between py-2 border-b border-[#FBF9F6]">
              <span>Community Hero Status</span>
              <span className="font-bold text-[#5A6B5D] uppercase tracking-wider">Active</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#FBF9F6]">
              <span>Account ID</span>
              <span className="font-mono text-[10px] font-bold text-[#7A7A7A]">{user?.uid}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Total Points Earned</span>
              <span className="font-bold text-[#3D3D3D]">{user?.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Action Tray */}
        <div className="space-y-3 pt-2">
          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="w-full py-3.5 px-4 bg-white border border-[#EDE9E0] text-[#708271] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#FBF9F6] hover:text-[#5A6B5D] transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4 text-[#7A7A7A]" />
            <span>Sign Out Session</span>
          </button>

          {/* Destructive Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3.5 px-4 border border-[#EDE9E0] text-[#D9835D] bg-[#FFF2ED]/20 hover:bg-[#FFF2ED] hover:text-[#D9835D] transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-[#D9835D]" />
              <span>Delete Hero Account</span>
            </button>
          ) : (
            <div className="bg-[#FFF2ED] border border-[#EDE9E0] rounded-[32px] p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-2.5 text-[#D9835D]">
                <ShieldAlert className="w-5 h-5 text-[#D9835D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif font-bold text-[#2C362E] text-sm">Destructive Action Warning</p>
                  <p className="text-xs text-[#D9835D] mt-1 leading-normal">
                    This will permanently delete your user document profile, including all accumulated experience points from the database. This action is irreversible.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#D9835D] hover:bg-[#C8724D] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-white border border-[#EDE9E0] text-[#708271] hover:bg-[#FBF9F6] font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
