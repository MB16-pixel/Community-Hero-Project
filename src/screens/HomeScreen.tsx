import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { IssueReport } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon,
  Flame,
  Award
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { user, gainXP } = useAuth();
  
  // Form states
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string>('');
  
  // Selected category state (manual user input)
  const [category, setCategory] = useState('Pothole');
  
  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Available categories
  const categoriesList = [
    "Pothole",
    "Waste Management",
    "Water Leakage",
    "Damaged Streetlight",
    "Other"
  ];

  // Preset images to facilitate high-fidelity testing in browser
  const presetImages = [
    {
      name: "Pothole",
      url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Waste Management",
      url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Water Leakage",
      url: "https://images.unsplash.com/photo-1542013936693-8848157b13df?auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Damaged Streetlight",
      url: "https://images.unsplash.com/photo-1509021436665-8f37bc706572?auto=format&fit=crop&w=500&q=80"
    }
  ];

  // Handle local image file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg("Please provide an issue description.");
      return;
    }

    if (!address.trim()) {
      setErrorMsg("Please provide the address or location of the issue.");
      return;
    }

    setSubmitting(true);
    const issueId = 'issue_' + Math.random().toString(36).substring(2, 11);
    const path = `issues/${issueId}`;
    const mediaUrl = uploadedFileBase64 || "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80"; // neutral street/community fallback

    try {
      const newIssue: IssueReport = {
        issueId,
        userId: user.uid,
        description: description.trim(),
        address: address.trim(),
        mediaUrl,
        category: category,
        status: 'Pending',
        timestamp: new Date().toISOString(),
        reporterName: user.username
      };

      // 1. Submit Issue to Firestore issues collection
      await setDoc(doc(db, 'issues', issueId), newIssue);

      // 2. Award +50 XP to user's profile
      await gainXP(50);

      // Trigger success flow
      setSuccess(true);
      
      // Reset form
      setDescription('');
      setAddress('');
      setUploadedFileBase64('');

      // Auto-hide success overlay after 4 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 4000);

    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.WRITE, path, user.uid, user.email);
      setErrorMsg(err.message || "Failed to submit issue. Please try again.");
      console.error(wrappedError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#F4EFE6] text-[#3D3D3D] px-6 py-6 rounded-b-[2.5rem] shadow-sm border-b border-[#E5E0D5] relative">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#708271] px-3 py-1 rounded-full uppercase tracking-wider border border-[#DCD6C8]">
              Citizen Reporting
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#2C362E] tracking-tight mt-1">Report An Issue</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[#EAE4D8] px-3.5 py-1.5 rounded-full border border-[#DCD6C8] shadow-sm">
            <Flame className="w-5 h-5 text-[#D9835D] fill-[#D9835D] animate-pulse" />
            <span className="text-sm font-bold text-[#3D3D3D]">{user?.xp} XP</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 bg-[#F0F5F1] border border-[#EDE9E0] text-[#5A6B5D] p-4 rounded-2xl animate-bounce shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-[#5A6B5D] shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#2C362E]">Issue Filed Successfully!</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#EDE9E0]">
          <h2 className="text-lg font-serif font-bold text-[#2C362E] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#5A6B5D]" />
            New Report Form
          </h2>

          {errorMsg && (
            <div className="bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] text-xs p-3.5 rounded-2xl mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Description */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-2">
                What's the issue?
              </label>
              <textarea
                placeholder="Describe the problem (e.g., Deep pothole in front of supermarket making driving hazardous...)"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] resize-none"
              />

            {/* Category Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-2">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D] cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-2">
                Address or Location
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <MapPin className="w-4 h-4 text-[#5A6B5D]" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, United States"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
                />
              </div>
            </div>

            {/* Media Upload (Photo Evidence) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#7A7A7A] tracking-wider mb-2">
                Upload Photo Evidence
              </label>
              
              <div className="flex flex-col gap-3">
                {/* Simulated file selector button */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#EDE9E0] hover:border-[#5A6B5D] hover:bg-[#F4EFE6]/30 rounded-xl cursor-pointer transition-all bg-[#FBF9F6]">
                  {uploadedFileBase64 ? (
                    <div className="w-full h-full relative p-2">
                      <img 
                        src={uploadedFileBase64} 
                        alt="Evidence Preview" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <span className="absolute bottom-2 right-2 bg-[#5A6B5D] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        File Loaded
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-[#7A7A7A]">Click to import evidence photo</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or GIF up to 5MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#5A6B5D] hover:bg-[#4A594D] text-white rounded-xl text-sm font-bold shadow-md shadow-[#5A6B5D]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#EDE9E0] fill-[#EDE9E0]" />
                  <span>Submit Report & Gain +50 XP</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
