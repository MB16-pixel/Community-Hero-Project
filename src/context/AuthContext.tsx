import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (username: string, email: string, password: string, community?: string) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  gainXP: (points: number) => Promise<void>;
  updateProfile: (username: string, email: string, password: string, community?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore session from localStorage if present
    const storedUser = localStorage.getItem('community_hero_session');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Refresh profile from Firestore in the background
        refreshUserProfile(parsed.uid);
      } catch (e) {
        console.error("Failed to parse stored session", e);
        localStorage.removeItem('community_hero_session');
      }
    }
    setLoading(false);
  }, []);

  const refreshUserProfile = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUser(data);
        localStorage.setItem('community_hero_session', JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to refresh user profile from Firestore:", err);
    }
  };

  const clearError = () => setError(null);

  // Phase 1: SignUp State & Firestore Registration
  const signUp = async (username: string, email: string, password: string, community: string = "Local"): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    const userId = 'user_' + Math.random().toString(36).substring(2, 11);
    const path = `users/${userId}`;

    try {
      // 1. Check if email already exists
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        throw new Error("An account with this email already exists.");
      }

      const newUser: UserProfile = {
        uid: userId,
        username,
        email: email.toLowerCase(),
        password,
        xp: 0,
        community: community || "Local"
      };

      // 2. Write document to users collection
      await setDoc(doc(db, 'users', userId), newUser);

      setUser(newUser);
      localStorage.setItem('community_hero_session', JSON.stringify(newUser));
      return newUser;
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.WRITE, path, userId, email);
      setError(err.message || "Sign up failed");
      throw wrappedError;
    } finally {
      setLoading(false);
    }
  };

  // Phase 1: Login State & Firestore Authentication matching
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    const path = 'users';

    try {
      const q = query(
        collection(db, 'users'), 
        where('email', '==', email.toLowerCase())
      );
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        throw new Error("No user found with this email.");
      }

      let matchedUser: UserProfile | null = null;
      querySnap.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        if (userData.password === password) {
          matchedUser = userData;
        }
      });

      if (!matchedUser) {
        throw new Error("Incorrect password.");
      }

      setUser(matchedUser);
      localStorage.setItem('community_hero_session', JSON.stringify(matchedUser));
      return matchedUser;
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.GET, path, null, email);
      setError(err.message || "Login failed");
      throw wrappedError;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('community_hero_session');
  };

  // Phase 2: Increment User's Firestore Document XP (+50 points)
  const gainXP = async (points: number) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const newXP = user.xp + points;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { xp: newXP });
      
      const updatedUser = { ...user, xp: newXP };
      setUser(updatedUser);
      localStorage.setItem('community_hero_session', JSON.stringify(updatedUser));
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user.uid, user.email);
      setError("Failed to update experience points.");
      throw wrappedError;
    }
  };

  // Phase 2 Tab 4: Update Profile Form Action
  const updateProfile = async (username: string, email: string, password: string, community?: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const path = `users/${user.uid}`;

    try {
      // Check if email belongs to someone else
      if (email.toLowerCase() !== user.email) {
        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          throw new Error("This email is already in use by another user.");
        }
      }

      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        username,
        email: email.toLowerCase(),
        password
      };
      if (community) {
        updateData.community = community;
      }
      await updateDoc(userRef, updateData);

      const updatedUser = { 
        ...user, 
        username, 
        email: email.toLowerCase(), 
        password,
        ...(community ? { community } : {})
      };
      setUser(updatedUser);
      localStorage.setItem('community_hero_session', JSON.stringify(updatedUser));
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.UPDATE, path, user.uid, user.email);
      setError(err.message || "Failed to update profile.");
      throw wrappedError;
    } finally {
      setLoading(false);
    }
  };

  // Phase 2 Tab 4: Delete Account Action
  const deleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const path = `users/${user.uid}`;

    try {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      logout();
    } catch (err: any) {
      const wrappedError = handleFirestoreError(err, OperationType.DELETE, path, user.uid, user.email);
      setError("Failed to delete account from database.");
      throw wrappedError;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signUp,
      login,
      logout,
      gainXP,
      updateProfile,
      deleteAccount,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
