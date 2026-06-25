import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { IssueReport } from '../types';
import { 
  Filter, 
  MapPin, 
  Clock, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  User as UserIcon,
  HelpCircle,
  Database,
  ThumbsUp,
  SlidersHorizontal
} from 'lucide-react';

export const IssuesFeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filters: 'all' | 'my_issues' | 'nearby' (same community district)
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_issues' | 'nearby'>('all');

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

  // Handle status update (e.g. Verify or Resolve)
  const handleUpdateStatus = async (issueId: string, newStatus: 'Pending' | 'Verified' | 'Resolved') => {
    const path = `issues/${issueId}`;
    try {
      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, { status: newStatus });
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user?.uid, user?.email);
      alert("Permission denied or failed to update issue status.");
      console.error(wrappedError);
    }
  };

  // Seeding realistic mock issues to populate the Firestore database on demand
  const seedDemoData = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const sampleIssues: IssueReport[] = [
        {
          issueId: "issue_seed_1",
          userId: "user_seed_99",
          reporterName: "Jane Doe",
          description: "Massive pothole on Main Street in front of the local pharmacy. Cars are swerving to avoid it, creating unsafe traffic flows.",
          address: "420 Main Street, Green Valley",
          mediaUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80",
          category: "Pothole",
          status: "Pending",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hrs ago
        },
        {
          issueId: "issue_seed_2",
          userId: "user_seed_98",
          reporterName: "Tom Jenkins",
          description: "Water hydrant has a small crack and is continuously leaking water into the gutter. Wasting precious gallons of clean drinking water.",
          address: "700 Waterway Lane, South Shore",
          mediaUrl: "https://images.unsplash.com/photo-1542013936693-8848157b13df?auto=format&fit=crop&w=500&q=80",
          category: "Water Leakage",
          status: "Verified",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hrs ago
        },
        {
          issueId: "issue_seed_3",
          userId: "user_seed_97",
          reporterName: "Marcus Vance",
          description: "Streetlight is completely out in this block. The sidewalk is extremely dark and dangerous for evening walkers.",
          address: "12 Pine Street, Metro Core",
          mediaUrl: "https://images.unsplash.com/photo-1509021436665-8f37bc706572?auto=format&fit=crop&w=500&q=80",
          category: "Damaged Streetlight",
          status: "Resolved",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
        }
      ];

      sampleIssues.forEach((issue) => {
        const ref = doc(db, 'issues', issue.issueId);
        batch.set(ref, issue);
      });

      await batch.commit();
    } catch (err: any) {
      console.error("Failed to seed database:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter client-side logic
  const filteredIssues = issues.filter(issue => {
    if (activeFilter === 'my_issues') {
      return issue.userId === user?.uid;
    }
    if (activeFilter === 'nearby') {
      // Find issues belonging to the user's country
      const userComm = user?.community || "United States";
      const countryNameOnly = userComm.replace(/[^\w\s]/g, '').trim();
      return issue.address.toLowerCase().includes(countryNameOnly.toLowerCase()) || 
             issue.address.toLowerCase().includes(userComm.toLowerCase());
    }
    return true; // 'all'
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

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-[#F4EFE6] text-[#3D3D3D] px-6 py-5 rounded-b-[2.5rem] shadow-sm border-b border-[#E5E0D5]">
        <h1 className="text-2xl font-serif font-bold text-[#2C362E] tracking-tight">Community Feed</h1>
        <p className="text-xs text-[#7A7A7A] mt-1 font-medium">Real-time alerts filed by your neighbors</p>
      </div>

      {/* Filter Chips */}
      <div className="px-6 mt-5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#5A6B5D]" />
          <span>Filter Issues</span>
        </div>
        <div className="flex gap-2 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeFilter === 'all'
                ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
            }`}
          >
            All Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveFilter('my_issues')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeFilter === 'my_issues'
                ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
            }`}
          >
            My Reports ({issues.filter(i => i.userId === user?.uid).length})
          </button>
          <button
            onClick={() => setActiveFilter('nearby')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeFilter === 'nearby'
                ? 'bg-[#5A6B5D] text-white border-[#5A6B5D] shadow-sm'
                : 'bg-white text-[#708271] border-[#EDE9E0] hover:bg-[#F4EFE6]'
            }`}
          >
            {user?.community || "🇺🇸 United States"} ({issues.filter(i => {
              const countryName = (user?.community || "United States").replace(/[^\w\s]/g, '').trim();
              return i.address.toLowerCase().includes(countryName.toLowerCase());
            }).length})
          </button>
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
            <h3 className="font-serif font-bold text-[#2C362E] text-base">No Issues Found</h3>
            <p className="text-xs text-[#7A7A7A] mt-2 max-w-xs mx-auto">
              {activeFilter === 'my_issues' 
                ? "You haven't reported any issues yet. Click the 'Report' tab to start earning XP!" 
                : activeFilter === 'nearby' 
                ? `No issues logged in ${user?.community || "United States"} yet. Be the first hero to log one!`
                : "The active database is currently empty of community reports."}
            </p>

            {/* Quick-Seed Button for Empty Databases */}
            {issues.length === 0 && (
              <button
                onClick={seedDemoData}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-[#F4EFE6] border border-[#EDE9E0] text-[#5A6B5D] rounded-xl text-xs font-bold hover:bg-[#EAE4D8] transition-colors"
              >
                <Database className="w-4 h-4" />
                Seed Demo Issues
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div 
                key={issue.issueId}
                className="bg-white rounded-[32px] overflow-hidden border border-[#EDE9E0] shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Media Image */}
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

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-[#7A7A7A] text-xs mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[#D9835D] shrink-0 mt-0.5" />
                      <span className="font-medium line-clamp-1">{issue.address}</span>
                    </div>

                    {/* Description */}
                    <p className="text-[#3D3D3D] text-sm font-medium leading-relaxed mb-3">
                      {issue.description}
                    </p>
                  </div>

                  {/* Footer Stats & Interactions */}
                  <div className="border-t border-[#EDE9E0] pt-3 mt-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[11px] text-[#7A7A7A]">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-[#5A6B5D]" />
                        <span className="font-semibold">By: {issue.reporterName || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#7A7A7A]" />
                        <span>{new Date(issue.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* INTERACTIVE SIMULATOR ADMIN BAR */}
                    <div className="flex items-center justify-between bg-[#FBF9F6] p-2 rounded-xl mt-1.5 border border-[#EDE9E0]">
                      <span className="text-[10px] font-bold text-[#708271] uppercase tracking-wide">
                        Simulate Validation
                      </span>
                      <div className="flex gap-1.5">
                        {issue.status !== 'Verified' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.issueId, 'Verified')}
                            className="bg-[#708271] hover:bg-[#5A6B5D] text-white font-bold text-[9px] uppercase px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5" /> Verify
                          </button>
                        )}
                        {issue.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.issueId, 'Resolved')}
                            className="bg-[#5A6B5D] hover:bg-[#4A594D] text-white font-bold text-[9px] uppercase px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5" /> Resolve
                          </button>
                        )}
                        {issue.status !== 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.issueId, 'Pending')}
                            className="bg-[#EAE4D8] hover:bg-[#DCD6C8] text-[#3D3D3D] font-bold text-[9px] uppercase px-1.5 py-1 rounded-lg transition-colors"
                          >
                            Re-Open
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
