import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IssuesFeedScreen } from '../screens/IssuesFeedScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { PredictiveScreen } from '../screens/PredictiveScreen';
import { audio } from '../utils/audio';
import { 
  FileText, 
  Trophy, 
  UserCircle,
  HelpCircle,
  AlertTriangle,
  Compass,
  BrainCircuit
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Auth navigation stack state: 'login' | 'signup'
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  
  // Main app tab state: 'report' | 'feed' | 'stats' | 'predictive' | 'profile'
  const [activeTab, setActiveTab] = useState<'report' | 'feed' | 'stats' | 'predictive' | 'profile'>('report');

  // Direct user to report tab on successful sign in / signup
  useEffect(() => {
    if (user) {
      setActiveTab('report');
    }
  }, [user]);

  const handleTabChange = (tab: 'report' | 'feed' | 'stats' | 'predictive' | 'profile') => {
    audio.playClick();
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F9F7F2] items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#5A6B5D] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-serif font-bold text-[#2C362E]">Community Hero</h3>
        <p className="text-xs text-[#7A7A7A] mt-1">Synchronizing profile credentials...</p>
      </div>
    );
  }

  // Phase 1: Unauthenticated Flow (Auth Stack)
  if (!user) {
    if (authScreen === 'signup') {
      return (
        <SignUpScreen 
          onNavigateToLogin={() => setAuthScreen('login')} 
        />
      );
    }
    return (
      <LoginScreen 
        onNavigateToSignUp={() => setAuthScreen('signup')} 
      />
    );
  }

  // Phase 2: Authenticated Flow (Bottom Tab Navigation)
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'report':
        return <HomeScreen />;
      case 'feed':
        return <IssuesFeedScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'predictive':
        return <PredictiveScreen />;
      case 'profile':
        return <AccountScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] relative">
      {/* Active Tab Screen Area */}
      <div className="flex-1 overflow-hidden">
        {renderActiveScreen()}
      </div>

      {/* Bottom Tab Bar (React Navigation BottomTabs Simulation) */}
      <div className="bg-white border-t border-[#EDE9E0] px-4 py-2 flex justify-around items-center shrink-0 shadow-sm rounded-t-[1.75rem] pb-safe">
        {/* Tab 1: Home Screen (Report an Issue) */}
        <button
          onClick={() => handleTabChange('report')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'report' 
              ? 'text-[#5A6B5D] font-bold scale-105 bg-[#F0F5F1]' 
              : 'text-[#7A7A7A] hover:text-[#5A6B5D]'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 mb-0.5 ${activeTab === 'report' ? 'text-[#5A6B5D]' : 'text-[#7A7A7A]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Report</span>
        </button>

        {/* Tab 2: Issues Feed */}
        <button
          onClick={() => handleTabChange('feed')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'feed' 
              ? 'text-[#5A6B5D] font-bold scale-105 bg-[#F0F5F1]' 
              : 'text-[#7A7A7A] hover:text-[#5A6B5D]'
          }`}
        >
          <Compass className={`w-5 h-5 mb-0.5 ${activeTab === 'feed' ? 'text-[#5A6B5D]' : 'text-[#7A7A7A]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Feed</span>
        </button>

        {/* Tab 3: Leaderboard & Stats */}
        <button
          onClick={() => handleTabChange('stats')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'stats' 
              ? 'text-[#5A6B5D] font-bold scale-105 bg-[#F0F5F1]' 
              : 'text-[#7A7A7A] hover:text-[#5A6B5D]'
          }`}
        >
          <Trophy className={`w-5 h-5 mb-0.5 ${activeTab === 'stats' ? 'text-[#5A6B5D]' : 'text-[#7A7A7A]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Stats</span>
        </button>

        {/* Tab 4: AI Predictive Alerts */}
        <button
          onClick={() => handleTabChange('predictive')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'predictive' 
              ? 'text-[#5A6B5D] font-bold scale-105 bg-[#F0F5F1]' 
              : 'text-[#7A7A7A] hover:text-[#5A6B5D]'
          }`}
        >
          <BrainCircuit className={`w-5 h-5 mb-0.5 ${activeTab === 'predictive' ? 'text-[#5A6B5D]' : 'text-[#7A7A7A]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Predictive</span>
        </button>

        {/* Tab 5: Account/Profile */}
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'text-[#5A6B5D] font-bold scale-105 bg-[#F0F5F1]' 
              : 'text-[#7A7A7A] hover:text-[#5A6B5D]'
          }`}
        >
          <UserCircle className={`w-5 h-5 mb-0.5 ${activeTab === 'profile' ? 'text-[#5A6B5D]' : 'text-[#7A7A7A]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Account</span>
        </button>
      </div>
    </div>
  );
};
