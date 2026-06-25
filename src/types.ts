export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  password?: string;
  xp: number;
  community: string;
}

export interface IssueReport {
  issueId: string;
  userId: string;
  description: string;
  address: string;
  mediaUrl: string;
  category: string;
  status: 'Pending' | 'Verified' | 'Resolved';
  timestamp: string; // ISO string format for robust client storage
  reporterName?: string; // Cache reporter name for easier lists
}

export interface CommunityLeaderboardItem {
  community: string;
  xp: number;
  membersCount: number;
}

export interface Country {
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Switzerland', flag: '🇨🇭' }
];
