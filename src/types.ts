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
