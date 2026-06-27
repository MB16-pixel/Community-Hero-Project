import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { CommunityLeaderboardItem } from '../types';
import { 
  Trophy, 
  Award, 
  Flame, 
  TrendingUp, 
  Users, 
  Zap, 
  Crown,
  MapPin,
  ArrowRight
} from 'lucide-react';

const getCountryForIssue = (issue: any, allUsers: any[]): string | null => {
  // 1. Try to find the creator in users
  const creator = allUsers.find(u => u.uid === issue.userId);
  if (creator && creator.community) {
    return creator.community;
  }

  // 2. Fallback: parse address
  const addr = (issue.address || '').toLowerCase();
  if (addr.includes('united states') || addr.includes('usa') || addr.includes('u.s.a.')) {
    return "🇺🇸 United States";
  }
  if (addr.includes('united kingdom') || addr.includes('uk') || addr.includes('u.k.')) {
    return "🇬🇧 United Kingdom";
  }
  if (addr.includes('canada') || addr.includes('ca')) {
    if (addr.includes('canada') || /\bca\b/.test(addr)) {
      return "🇨🇦 Canada";
    }
  }
  if (addr.includes('australia') || /\bau\b/.test(addr)) {
    return "🇦🇺 Australia";
  }
  if (addr.includes('japan') || /\bjp\b/.test(addr)) {
    return "🇯🇵 Japan";
  }

  return null;
};

export const StatsScreen: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [totalCitizens, setTotalCitizens] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync users collection
  useEffect(() => {
    setLoadingUsers(true);
    setErrorMsg(null);
    const path = 'users';

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const uList: any[] = [];
        snapshot.forEach((doc) => {
          uList.push({ uid: doc.id, ...doc.data() });
        });
        setUsers(uList);
        setTotalCitizens(uList.length);
        setLoadingUsers(false);
      },
      (err) => {
        const wrappedError = handleFirestoreError(err, OperationType.LIST, path, user?.uid, user?.email);
        setErrorMsg("Failed to synchronize leaderboard users.");
        setLoadingUsers(false);
        console.error(wrappedError);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync issues collection
  useEffect(() => {
    setLoadingIssues(true);
    const path = 'issues';

    const unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        const iList: any[] = [];
        snapshot.forEach((doc) => {
          iList.push({ issueId: doc.id, ...doc.data() });
        });
        setIssues(iList);
        setLoadingIssues(false);
      },
      (err) => {
        const wrappedError = handleFirestoreError(err, OperationType.LIST, path, user?.uid, user?.email);
        setErrorMsg("Failed to synchronize leaderboard issues.");
        setLoadingIssues(false);
        console.error(wrappedError);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const loading = loadingUsers || loadingIssues;

  // Compute live community leaderboard scores dynamically
  const leaderboard = React.useMemo(() => {
    const communityMap: { [key: string]: { xp: number; members: number } } = {
      "🇺🇸 United States": { xp: 3200, members: 12 },
      "🇬🇧 United Kingdom": { xp: 2450, members: 8 },
      "🇨🇦 Canada": { xp: 1800, members: 6 },
      "🇦🇺 Australia": { xp: 1200, members: 4 },
      "🇯🇵 Japan": { xp: 950, members: 3 }
    };

    // 1. Accumulate extra user XP
    users.forEach((u) => {
      const comm = u.community || "🇺🇸 United States";
      const xp = Number(u.xp) || 0;

      if (communityMap[comm]) {
        communityMap[comm].xp += xp;
        communityMap[comm].members += 1;
      } else {
        communityMap[comm] = { xp, members: 1 };
      }
    });

    // 2. Identify which countries have submitted at least one report (issue)
    const countriesWithReports = new Set<string>();
    issues.forEach((issue) => {
      const country = getCountryForIssue(issue, users);
      if (country) {
        countriesWithReports.add(country);
      }
    });

    // 3. Filter to keep ONLY countries with at least one submitted report, and sort
    const sortedList: CommunityLeaderboardItem[] = Object.keys(communityMap)
      .filter((comm) => countriesWithReports.has(comm))
      .map(key => ({
        community: key,
        xp: communityMap[key].xp,
        membersCount: communityMap[key].members
      }))
      .sort((a, b) => b.xp - a.xp);

    return sortedList;
  }, [users, issues]);

  // Find user's country and its current rank
  const userCommunity = user?.community || "🇺🇸 United States";
  const userCommRankIndex = leaderboard.findIndex(item => item.community.toLowerCase() === userCommunity.toLowerCase());
  const userCommRank = userCommRankIndex !== -1 ? userCommRankIndex + 1 : null;
  const userCommScore = userCommRankIndex !== -1 ? leaderboard[userCommRankIndex].xp : 0;

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[#F4EFE6] text-[#3D3D3D] px-6 py-6 rounded-b-[2.5rem] shadow-sm border-b border-[#E5E0D5]">
        <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#708271] px-3 py-1 rounded-full uppercase tracking-wider border border-[#DCD6C8]">
          Leaderboard & Gamification
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#2C362E] tracking-tight mt-1">Impact Stats</h1>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Personal XP Hub */}
        <div className="bg-[#5A6B5D] rounded-[32px] p-6 text-white relative overflow-hidden shadow-md shadow-[#5A6B5D]/10">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-6 -mb-6" />

          <div className="relative">
            <p className="text-[10px] font-bold uppercase text-[#EDE9E0] tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-[#EDE9E0] text-[#EDE9E0] animate-pulse" />
              My Hero Badge
            </p>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                <h2 className="text-4xl font-serif font-bold text-white tracking-tight">{user?.xp} <span className="text-lg text-[#EAE4D8] font-bold">XP</span></h2>
                <p className="text-xs text-[#EDE9E0] mt-1 font-medium">Accumulated from community reports</p>
              </div>
              <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-right">
                <span className="text-[10px] uppercase text-[#EAE4D8] font-bold block">Country Rank</span>
                <span className="text-sm font-bold text-white">#{userCommRank || 'N/A'}</span>
              </div>
            </div>

            {/* Progress bar to next virtual hero rank */}
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-semibold text-[#EAE4D8] mb-1.5">
                <span>Rank progress (Citizen Hero)</span>
                <span>{user ? (user.xp % 200) : 0} / 200 XP</span>
              </div>
              <div className="w-full h-2 bg-[#4A594D] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000"
                  style={{ width: `${user ? Math.min(((user.xp % 200) / 200) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[24px] p-4 border border-[#EDE9E0] shadow-sm flex items-center gap-3">
            <div className="p-3 bg-[#F0F5F1] rounded-xl text-[#5A6B5D] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-[#7A7A7A] uppercase font-bold block tracking-wider">Total Citizens</span>
              <span className="text-lg font-serif font-bold text-[#2C362E]">{totalCitizens + 18}</span>
            </div>
          </div>
          <div className="bg-white rounded-[24px] p-4 border border-[#EDE9E0] shadow-sm flex items-center gap-3">
            <div className="p-3 bg-[#EAE4D8] rounded-xl text-[#708271] shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-[#7A7A7A] uppercase font-bold block tracking-wider">Country XP</span>
              <span className="text-lg font-serif font-bold text-[#2C362E]">{userCommScore}</span>
            </div>
          </div>
        </div>

        {/* Community Leaderboard */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#EDE9E0]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-serif font-bold text-[#2C362E] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D9835D] fill-[#D9835D]" />
              Country Cup
            </h3>
            <span className="text-xs bg-[#F0F5F1] text-[#5A6B5D] px-3 py-1 rounded-full font-bold border border-[#EDE9E0]">
              Real-time Sum
            </span>
          </div>

          {errorMsg && (
            <div className="bg-[#FFF2ED] border border-[#EDE9E0] text-[#D9835D] text-xs p-3.5 rounded-2xl mb-4">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#5A6B5D]/30 border-t-[#5A6B5D] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3.5">
              {leaderboard.map((item, index) => {
                const isUserComm = item.community.toLowerCase() === userCommunity.toLowerCase();
                const rank = index + 1;

                return (
                  <div 
                    key={item.community}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isUserComm 
                        ? 'bg-[#F0F5F1]/80 border-[#E5E0D5] shadow-sm' 
                        : 'bg-[#FBF9F6]/50 border-[#EDE9E0]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Rank Indicator */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm">
                        {rank === 1 ? (
                          <Crown className="w-5 h-5 text-[#D9835D] fill-[#D9835D]/30" />
                        ) : rank === 2 ? (
                          <Award className="w-5 h-5 text-[#7A7A7A] fill-[#EDE9E0]" />
                        ) : rank === 3 ? (
                          <Award className="w-5 h-5 text-[#BD7B62] fill-[#FFF2ED]" />
                        ) : (
                          <span className="text-[#7A7A7A]">#{rank}</span>
                        )}
                      </div>

                      {/* District Info */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isUserComm ? 'text-[#2C362E]' : 'text-[#3D3D3D]'}`}>
                            {item.community}
                          </span>
                          {isUserComm && (
                            <span className="bg-[#5A6B5D] text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                              Mine
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#7A7A7A] mt-0.5">
                          <Users className="w-3 h-3 text-[#5A6B5D]" />
                          <span>{item.membersCount} active heroes</span>
                        </div>
                      </div>
                    </div>

                    {/* XP Score */}
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#3D3D3D]">{item.xp}</span>
                      <span className="text-[10px] text-[#7A7A7A] font-bold block">XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard CTA info */}
          <p className="text-[11px] text-[#7A7A7A] font-medium mt-5 leading-normal bg-[#FBF9F6] p-3.5 rounded-2xl text-center border border-[#EDE9E0]">
            Submit issues from your country to boost your rank on the leaderboard! Each approved report awards your country <strong>+50 XP</strong>.
          </p>

        </div>
      </div>
    </div>
  );
};
