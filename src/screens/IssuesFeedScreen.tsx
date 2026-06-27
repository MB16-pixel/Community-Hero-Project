import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { IssueReport, HelpPledge } from '../types';
import { audio } from '../utils/audio';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  User as UserIcon,
  HelpCircle,
  ThumbsUp,
  SlidersHorizontal,
  Sparkles,
  ShieldAlert,
  Heart,
  Undo2,
  Send,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';

export const IssuesFeedScreen: React.FC = () => {
  const { user, gainXP } = useAuth();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filters: 'all' | 'my_issues' | 'nearby'
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_issues' | 'nearby'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');

  // Pledge support states
  const [activePledgeIssueId, setActivePledgeIssueId] = useState<string | null>(null);
  const [pledgeType, setPledgeType] = useState<'labor' | 'material' | 'financial' | 'advocacy'>('labor');
  const [pledgeNote, setPledgeNote] = useState<string>('');

  // Resolution Form states
  const [activeResolveIssueId, setActiveResolveIssueId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  
  const [selectedResolveImage, setSelectedResolveImage] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Handle local image file uploads for resolving issues
  const handleResolveImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audio.playSelect();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedResolveImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleResolveForm = (issueId: string) => {
    audio.playClick();
    if (activeResolveIssueId === issueId) {
      setActiveResolveIssueId(null);
      setResolveNotes('');
      setSelectedResolveImage('');
    } else {
      setActiveResolveIssueId(issueId);
      setResolveNotes('');
      setSelectedResolveImage('');
    }
  };

  // Success toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      audio.playSuccess();
    } else {
      audio.playTick();
    }
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Real-time listener for Firestore issues
  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    const path = 'issues';

    const unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        const list: IssueReport[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ issueId: docSnap.id, ...docSnap.data() } as IssueReport);
        });
        // Sort by timestamp descending
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setIssues(list);
        setLoading(false);
      },
      (err) => {
        const wrappedError = handleFirestoreError(err, OperationType.LIST, path, user?.uid, user?.email);
        setErrorMsg("Failed to sync issues in real-time from Firestore.");
        setLoading(false);
        console.error(wrappedError);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle manual status override (for back-office simulator admin bar)
  const handleUpdateStatus = async (issueId: string, newStatus: 'Pending' | 'Verified' | 'Resolved') => {
    audio.playClick();
    const path = `issues/${issueId}`;
    try {
      const issueRef = doc(db, 'issues', issueId);
      if (newStatus === 'Resolved') {
        // Preset sample resolution fields
        await updateDoc(issueRef, { 
          status: 'Resolved',
          resolvedNotes: "Issue resolved successfully by the neighborhood committee.",
          resolvedMediaUrl: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=800&q=80",
          resolvedBy: user?.username || "Community Action Team",
          resolvedTimestamp: new Date().toISOString()
        });
      } else {
        await updateDoc(issueRef, { 
          status: newStatus,
          resolvedNotes: null,
          resolvedMediaUrl: null,
          resolvedBy: null,
          resolvedTimestamp: null
        });
      }
      showToast(`Status updated to ${newStatus}!`, "success");
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user?.uid, user?.email);
      showToast("Failed to update status: " + (err.message || String(err)), "error");
      console.error(wrappedError);
    }
  };

  // citizen-led Issue Verification (+10 XP)
  const handleVerifyIssue = async (issue: IssueReport) => {
    if (!user) return;
    audio.playClick();

    const verifiedUsersList = issue.verifiedUsers || [];
    if (verifiedUsersList.includes(user.uid)) {
      showToast("You have already verified this report!", "error");
      return;
    }

    const path = `issues/${issue.issueId}`;
    const newVerifiedUsers = [...verifiedUsersList, user.uid];
    const newCount = (issue.verificationsCount || 0) + 1;
    
    // Auto promote to 'Verified' status if reaches 3 verifications
    const shouldPromote = newCount >= 3 && issue.status === 'Pending';
    const newStatus = shouldPromote ? 'Verified' : issue.status;

    try {
      const issueRef = doc(db, 'issues', issue.issueId);
      await updateDoc(issueRef, {
        verificationsCount: newCount,
        verifiedUsers: newVerifiedUsers,
        status: newStatus
      });

      await gainXP(15);
      showToast(`Verification submitted! You earned +15 XP. ${shouldPromote ? "Issue promoted to Verified!" : ""}`, "success");
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user.uid, user.email);
      showToast("Verification failed: " + (err.message || String(err)), "error");
      console.error(wrappedError);
    }
  };

  // Delete Issue (only if owned by current user)
  const handleDeleteIssue = async (issueId: string) => {
    if (!user) return;
    audio.playClick();
    
    if (confirmDeleteId !== issueId) {
      setConfirmDeleteId(issueId);
      // Automatically reset confirmation state after 4 seconds
      setTimeout(() => {
        setConfirmDeleteId(current => current === issueId ? null : current);
      }, 4000);
      return;
    }

    const path = `issues/${issueId}`;
    try {
      await deleteDoc(doc(db, 'issues', issueId));
      showToast("Report deleted successfully.", "success");
      setConfirmDeleteId(null);
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.DELETE, path, user.uid, user.email);
      showToast("Deletion failed: " + (err.message || String(err)), "error");
      console.error(wrappedError);
    }
  };

  // Submit Pledge Support (+20 XP)
  const handleCommitPledge = async (issue: IssueReport) => {
    if (!user) return;
    if (!pledgeNote.trim()) {
      showToast("Please write a quick comment explaining your support.", "error");
      return;
    }

    audio.playClick();
    const path = `issues/${issue.issueId}`;

    const newPledge: HelpPledge = {
      pledgeId: 'pledge_' + Math.random().toString(36).substring(2, 11),
      userId: user.uid,
      username: user.username,
      type: pledgeType,
      notes: pledgeNote.trim(),
      timestamp: new Date().toISOString()
    };

    const currentPledges = issue.pledges || [];
    const updatedPledges = [...currentPledges, newPledge];

    try {
      const issueRef = doc(db, 'issues', issue.issueId);
      await updateDoc(issueRef, {
        pledges: updatedPledges
      });

      await gainXP(25);
      showToast(`Pledge Registered! You earned +25 XP. Thank you!`, "success");
      
      // Reset state
      setActivePledgeIssueId(null);
      setPledgeNote('');
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user.uid, user.email);
      showToast("Failed to record pledge. Please try again.", "error");
      console.error(wrappedError);
    }
  };

  // Submit Resolution Details (+50 XP)
  const handleResolveIssueSubmit = async (issue: IssueReport) => {
    if (!user) return;
    if (!selectedResolveImage) {
      showToast("Please upload a resolution photo as evidence.", "error");
      return;
    }
    if (!resolveNotes.trim()) {
      showToast("Please provide resolution notes describing how it was fixed.", "error");
      return;
    }

    audio.playClick();
    const path = `issues/${issue.issueId}`;

    try {
      const issueRef = doc(db, 'issues', issue.issueId);
      await updateDoc(issueRef, {
        status: 'Resolved',
        resolvedNotes: resolveNotes.trim(),
        resolvedMediaUrl: selectedResolveImage,
        resolvedBy: user.username,
        resolvedTimestamp: new Date().toISOString()
      });

      await gainXP(50);
      showToast(`Resolution verified! You resolved this issue and earned +50 XP. Awesome!`, "success");

      // Reset state
      setActiveResolveIssueId(null);
      setResolveNotes('');
      setSelectedResolveImage('');
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user.uid, user.email);
      showToast("Failed to record resolution.", "error");
      console.error(wrappedError);
    }
  };

  // Filter client-side logic
  const filteredIssues = issues.filter(issue => {
    // 1. Tab filtering
    if (activeFilter === 'my_issues') {
      if (issue.userId !== user?.uid) return false;
    }
    if (activeFilter === 'nearby') {
      const userComm = user?.community || "United States";
      const countryNameOnly = userComm.replace(/[^\w\s]/g, '').trim();
      const inCommunity = issue.address.toLowerCase().includes(countryNameOnly.toLowerCase()) || 
                          issue.address.toLowerCase().includes(userComm.toLowerCase());
      if (!inCommunity) return false;
    }

    // 2. Category filtering
    if (activeCategory !== 'all') {
      if (issue.category !== activeCategory) return false;
    }

    // 3. Status filtering
    if (activeStatus !== 'all') {
      if (issue.status !== activeStatus) return false;
    }

    return true;
  });

  const getStatusBadge = (status: 'Pending' | 'Verified' | 'Resolved') => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#FFF2ED] text-[#D9835D] border border-[#EDE9E0]">
            <AlertCircle className="w-3 h-3 text-[#D9835D]" />
            Pending
          </span>
        );
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F4EFE6] text-[#708271] border border-[#E5E0D5]">
            <ThumbsUp className="w-3 h-3 text-[#708271]" />
            Verified
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F0F5F1] text-[#5A6B5D] border border-[#EDE9E0]">
            <CheckCircle className="w-3 h-3 text-[#5A6B5D]" />
            Resolved
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pothole':
        return 'bg-[#FFF2ED] text-[#D9835D] border-[#EDE9E0]';
      case 'Water Leakage':
        return 'bg-[#EAE4D8] text-[#3D3D3D] border-[#E5E0D5]';
      case 'Waste Management':
        return 'bg-[#F0F5F1] text-[#708271] border-[#EDE9E0]';
      case 'Damaged Streetlight':
        return 'bg-[#F4EFE6] text-[#2C362E] border-[#E5E0D5]';
      default:
        return 'bg-[#FBF9F6] text-[#7A7A7A] border-[#E5E0D5]';
    }
  };

  const getSeverityBadge = (level?: 'Low' | 'Medium' | 'High' | 'Critical') => {
    if (!level) return null;
    switch (level) {
      case 'Low':
        return <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase">Minor</span>;
      case 'Medium':
        return <span className="text-[10px] bg-yellow-100 border border-yellow-200 text-yellow-800 px-2 py-0.5 rounded-md font-bold uppercase">Medium</span>;
      case 'High':
        return <span className="text-[10px] bg-orange-100 border border-orange-200 text-orange-800 px-2 py-0.5 rounded-md font-bold uppercase">High Risk</span>;
      case 'Critical':
        return <span className="text-[10px] bg-red-100 border border-red-200 text-red-800 px-2 py-0.5 rounded-md font-bold uppercase animate-pulse">Critical Danger</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-[#F4EFE6] text-[#3D3D3D] px-6 py-6 rounded-b-[2.5rem] shadow-sm border-b border-[#E5E0D5] relative">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#708271] px-3 py-1 rounded-full uppercase tracking-wider border border-[#DCD6C8]">
              Neighborhood Activity
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#2C362E] tracking-tight mt-1">
              Community Feed
            </h1>
            <p className="text-xs text-[#7A7A7A] mt-1 font-medium">
              Real-time alerts filed by your neighbors
            </p>
          </div>
        </div>
      </div>

      {/* Toast Alert Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce shadow-xl">
          <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-xs leading-normal">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="px-6 mt-5 space-y-4">
        {/* Scope selection as elegant pills / chips */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5A6B5D]" />
            <span>Scope Filter</span>
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => { audio.playClick(); setActiveFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                  : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
              }`}
            >
              {activeFilter === 'all' && <Check className="w-3.5 h-3.5 shrink-0" />}
              All Issues
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeFilter === 'all' ? 'bg-[#455247] text-stone-100' : 'bg-stone-100 text-[#7A7A7A]'
              }`}>
                {issues.length}
              </span>
            </button>
            <button
              onClick={() => { audio.playClick(); setActiveFilter('my_issues'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'my_issues'
                  ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                  : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
              }`}
            >
              {activeFilter === 'my_issues' && <Check className="w-3.5 h-3.5 shrink-0" />}
              My Reports
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeFilter === 'my_issues' ? 'bg-[#455247] text-stone-100' : 'bg-stone-100 text-[#7A7A7A]'
              }`}>
                {issues.filter(i => i.userId === user?.uid).length}
              </span>
            </button>
            <button
              onClick={() => { audio.playClick(); setActiveFilter('nearby'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'nearby'
                  ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                  : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
              }`}
            >
              {activeFilter === 'nearby' && <Check className="w-3.5 h-3.5 shrink-0" />}
              {user?.community || "🇺🇸 United States"}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeFilter === 'nearby' ? 'bg-[#455247] text-stone-100' : 'bg-stone-100 text-[#7A7A7A]'
              }`}>
                {issues.filter(i => {
                  const countryName = (user?.community || "United States").replace(/[^\w\s]/g, '').trim();
                  return i.address.toLowerCase().includes(countryName.toLowerCase());
                }).length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Dropdown Selectors (HTML Selection Tags styled beautifully) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Category Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase font-bold text-[#7A7A7A] tracking-wider">
              Category Filter
            </label>
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => {
                  audio.playClick();
                  setActiveCategory(e.target.value);
                }}
                className="w-full pl-3 pr-8 py-2 bg-white border border-[#EDE9E0] rounded-xl text-xs font-bold text-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-[#5A6B5D] transition-all cursor-pointer appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="Pothole">Potholes</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Damaged Streetlight">Damaged Streetlights</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#708271]">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase font-bold text-[#7A7A7A] tracking-wider">
              Status Filter
            </label>
            <div className="relative">
              <select
                value={activeStatus}
                onChange={(e) => {
                  audio.playClick();
                  setActiveStatus(e.target.value);
                }}
                className="w-full pl-3 pr-8 py-2 bg-white border border-[#EDE9E0] rounded-xl text-xs font-bold text-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-[#5A6B5D] transition-all cursor-pointer appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Resolved">Resolved</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#708271]">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="px-6 py-4 flex-1 space-y-4 max-w-lg mx-auto w-full">
        {errorMsg && (
          <div className="bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] text-xs p-3.5 rounded-2xl">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-9 h-9 border-4 border-[#5A6B5D]/30 border-t-[#5A6B5D] rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#7A7A7A]">Loading live issues database...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-[32px] p-8 text-center border border-[#EDE9E0] shadow-sm">
            <div className="inline-flex p-4 bg-[#F0F5F1] rounded-2xl text-[#5A6B5D] mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-[#2C362E] text-base">No Matching Reports</h3>
            <p className="text-xs text-[#7A7A7A] mt-2 max-w-xs mx-auto">
              {activeFilter === 'my_issues' 
                ? "You haven't reported any issues yet. Click the 'Report' tab to start earning XP!" 
                : "No reports found in the current filter scope."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredIssues.map((issue) => {
              const hasVerified = issue.verifiedUsers?.includes(user?.uid || '');

              return (
                <div 
                  key={issue.issueId}
                  className="bg-white rounded-[32px] overflow-hidden border border-[#EDE9E0] shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Before/After visual split (Feature 5) */}
                  {issue.status === 'Resolved' && issue.resolvedMediaUrl ? (
                    <div className="grid grid-cols-2 h-44 border-b border-[#EDE9E0] relative">
                      {/* Before frame */}
                      <div className="relative h-full overflow-hidden bg-stone-100 group">
                        <img 
                          src={issue.mediaUrl} 
                          alt="Before Community Action" 
                          className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-300"
                        />
                        <span className="absolute top-3 left-3 bg-red-600/90 text-white font-bold text-[8px] uppercase px-1.5 py-0.5 rounded tracking-widest shadow-sm">
                          Before
                        </span>
                      </div>
                      
                      {/* After frame */}
                      <div className="relative h-full overflow-hidden bg-stone-200 group">
                        <img 
                          src={issue.resolvedMediaUrl} 
                          alt="After Community Action" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <span className="absolute top-3 right-3 bg-emerald-600/90 text-white font-bold text-[8px] uppercase px-1.5 py-0.5 rounded tracking-widest shadow-sm flex items-center gap-0.5 animate-pulse">
                          <Check className="w-2.5 h-2.5" /> Fixed
                        </span>
                      </div>

                      {/* Overlaid Category Tag */}
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider backdrop-blur-md shadow-sm bg-white/95 text-stone-800 border-stone-200">
                        {issue.category}
                      </span>
                    </div>
                  ) : (
                    /* Standard Pending/Verified visual image */
                    <div className="w-full h-44 relative bg-[#FBF9F6]">
                      <img 
                        src={issue.mediaUrl} 
                        alt={issue.description} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Category Tag overlay */}
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider backdrop-blur-md shadow-sm ${getCategoryColor(issue.category)}`}>
                        {issue.category}
                      </span>

                      {/* Status Overlay */}
                      <div className="absolute top-3 right-3 shadow-sm">
                        {getStatusBadge(issue.status)}
                      </div>
                    </div>
                  )}

                  {/* Content Panel */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-[#7A7A7A] text-xs">
                          <MapPin className="w-3.5 h-3.5 text-[#D9835D] shrink-0" />
                          <span className="font-semibold line-clamp-1">{issue.address}</span>
                        </div>

                        {/* Severity Level (Feature 1) */}
                        {getSeverityBadge(issue.severity)}
                      </div>

                      {/* Description */}
                      <p className="text-[#3D3D3D] text-sm font-medium leading-relaxed">
                        {issue.description}
                      </p>

                      {/* AI Severity explanation contextual bubble (Feature 1) */}
                      {issue.severityExplanation && (
                        <div className="bg-[#FBF9F6] border border-[#EDE9E0] p-2.5 rounded-xl text-[10px] text-stone-500 italic">
                          <strong>Gemini diagnosis:</strong> {issue.severityExplanation}
                        </div>
                      )}

                      {/* Resolution notes box (Feature 5) */}
                      {issue.status === 'Resolved' && issue.resolvedNotes && (
                        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider text-[9px]">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Neighborhood Resolution Report</span>
                          </div>
                          <p className="text-stone-700 italic">
                            "{issue.resolvedNotes}"
                          </p>
                          <div className="text-[10px] text-stone-400 font-bold">
                            Resolved by {issue.resolvedBy} on {new Date(issue.resolvedTimestamp!).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Community Help Pledges list (Feature 4) */}
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7A7A7A]">
                          Volunteer Pledges ({issue.pledges?.length || 0})
                        </span>
                        
                        {issue.status !== 'Resolved' && (
                          <div className="flex items-center gap-2">
                            {issue.userId === user?.uid && (
                              <span className="text-[9px] bg-[#EBE5D8] text-stone-600 px-1.5 py-0.5 rounded font-bold">
                                My Report
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                audio.playClick();
                                setActivePledgeIssueId(activePledgeIssueId === issue.issueId ? null : issue.issueId);
                              }}
                              className="text-[10px] text-[#5A6B5D] hover:text-[#455247] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Heart className="w-3 h-3 text-[#D9835D] fill-[#D9835D]" />
                              {activePledgeIssueId === issue.issueId ? 'Cancel Pledge' : 'Pledge Support'}
                            </button>
                          </div>
                        )}
                      </div>

                      {issue.pledges && issue.pledges.length > 0 ? (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-none pr-1">
                          {issue.pledges.map((pledge) => (
                            <div key={pledge.pledgeId} className="bg-stone-50 p-2 rounded-xl text-[10px] text-stone-600 flex items-start gap-1.5 border border-stone-100">
                              <span className="bg-[#F4EFE6] text-[#708271] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-[7.5px] shrink-0 mt-0.5">
                                {pledge.type}
                              </span>
                              <div className="leading-tight">
                                <span className="font-bold text-stone-800">{pledge.username}:</span> {pledge.notes}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 italic">No community pledges pledged yet. Offer your help to coordinate fixes!</p>
                      )}

                      {/* Expandable pledge form (Feature 4) */}
                      {activePledgeIssueId === issue.issueId && (
                        <div className="bg-[#FBF9F6] border border-[#E5E0D5] p-3 rounded-2xl space-y-2.5 animate-fadeIn">
                          <p className="text-[10px] font-bold uppercase text-stone-700">Commit Support Offer</p>
                          
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { id: 'labor', label: 'Labor' },
                              { id: 'material', label: 'Materials' },
                              { id: 'financial', label: 'Financial' },
                              { id: 'advocacy', label: 'Advocacy' }
                            ].map((btn) => (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() => { audio.playSelect(); setPledgeType(btn.id as any); }}
                                className={`py-1 text-[9px] font-bold rounded-lg border transition-colors ${
                                  pledgeType === btn.id 
                                    ? 'bg-[#5A6B5D] text-white border-[#5A6B5D]' 
                                    : 'bg-white text-stone-600 border-stone-200'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="e.g. I have a ladder and can help on Saturday..."
                              value={pledgeNote}
                              onChange={(e) => setPledgeNote(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5E0D5] rounded-xl text-[11px] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleCommitPledge(issue)}
                              className="px-3 bg-[#5A6B5D] hover:bg-[#455247] text-white rounded-xl flex items-center justify-center cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expandable Resolution Form (Feature 5) */}
                    {activeResolveIssueId === issue.issueId && (
                      <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-2xl space-y-3 animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Report Resolution Fix</span>
                        </div>

                        {/* Resolution Photo Upload */}
                        <div className="space-y-1.5">
                          <label className="block text-[8px] uppercase tracking-wider font-bold text-stone-500">
                            Upload Resolution Photo Evidence
                          </label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl cursor-pointer transition-all bg-white relative overflow-hidden">
                            {selectedResolveImage ? (
                              <div className="w-full h-full relative p-1.5">
                                <img 
                                  src={selectedResolveImage} 
                                  alt="Resolution Preview" 
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                  <span className="bg-white/90 text-stone-800 text-[9px] px-2 py-1 rounded font-bold shadow-sm flex items-center gap-1">
                                    <Upload className="w-3 h-3 text-emerald-600" />
                                    Change Photo
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-4">
                                <Upload className="w-6 h-6 text-emerald-600/70 mb-1" />
                                <p className="text-[10px] font-bold text-emerald-800">Click to upload resolved photo</p>
                                <p className="text-[8px] text-stone-400">PNG, JPG up to 5MB</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleResolveImageUpload} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* resolution note input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Describe how the community fixed this issue..."
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-[#EDE9E0] rounded-xl text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleResolveIssueSubmit(issue)}
                            className="px-4 bg-[#5A6B5D] hover:bg-[#455247] text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer Stats & Interactions */}
                    <div className="border-t border-[#EDE9E0] pt-3 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-[10px] text-[#7A7A7A]">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-[#5A6B5D]" />
                          <span className="font-bold">By: {issue.reporterName || "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#7A7A7A]" />
                          <span>{new Date(issue.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* MAIN ACTION INTERACTION BAR */}
                      {(issue.status !== 'Resolved' || issue.userId === user?.uid) && (
                        <div className="flex gap-2">
                          {/* Verify Button (Feature 5) */}
                          {issue.status !== 'Resolved' && (
                            <button
                              onClick={() => handleVerifyIssue(issue)}
                              disabled={hasVerified}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 pl-[5px] pr-[9px] rounded-xl text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                hasVerified 
                                  ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed' 
                                  : 'bg-white hover:bg-stone-50 border-[#EDE9E0] text-stone-700'
                              }`}
                            >
                              <CheckCircle className={`w-3.5 h-3.5 ${hasVerified ? 'text-stone-300' : 'text-emerald-600'}`} />
                              <span>
                                {hasVerified ? 'Verified by You' : 'Verify Report'} ({(issue.verificationsCount || 0)})
                              </span>
                            </button>
                          )}

                          {/* Resolve Trigger Button (Feature 5) */}
                          {issue.status !== 'Resolved' && (
                            <button
                              onClick={() => toggleResolveForm(issue.issueId)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-[9px] rounded-xl text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                activeResolveIssueId === issue.issueId
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-[#5A6B5D] hover:bg-[#455247] text-white border-[#5A6B5D]'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white/90" />
                              <span>{activeResolveIssueId === issue.issueId ? 'Cancel Fix' : 'Mark as Fixed'}</span>
                            </button>
                          )}

                          {/* Delete Report Button (User Created Only) */}
                          {issue.userId === user?.uid && (
                            <button
                              onClick={() => handleDeleteIssue(issue.issueId)}
                              className={`px-3.5 py-2 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                                confirmDeleteId === issue.issueId
                                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300'
                              }`}
                              title="Delete Report"
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${confirmDeleteId === issue.issueId ? 'text-white' : 'text-red-500'}`} />
                              <span>{confirmDeleteId === issue.issueId ? 'Confirm?' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      )}


                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
