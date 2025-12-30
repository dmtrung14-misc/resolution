import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

const AUTH_STORAGE_KEY = 'resolution-auth';
const USERS_COLLECTION = 'users';

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export const authService = {
  // Initialize default users if they don't exist
  async initializeDefaultUsers(): Promise<void> {
    try {
      // Check if doggo exists
      const doggoRef = doc(db, USERS_COLLECTION, 'doggo');
      const doggoDoc = await getDoc(doggoRef);
      
      if (!doggoDoc.exists()) {
        const doggoProfile: UserProfile = {
          username: 'doggo',
          displayName: 'Doggo',
          passwordHash: await hashPassword('ngongongo'),
        };
        await setDoc(doggoRef, doggoProfile);
      }
      
      // Check if ducko exists
      const duckoRef = doc(db, USERS_COLLECTION, 'ducko');
      const duckoDoc = await getDoc(duckoRef);
      
      if (!duckoDoc.exists()) {
        const duckoProfile: UserProfile = {
          username: 'ducko',
          displayName: 'Ducko',
          passwordHash: await hashPassword('dangdangdang'),
        };
        await setDoc(duckoRef, duckoProfile);
      }
    } catch (error) {
      console.error('Error initializing users:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(username: UserRole): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, username);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Login
  async login(username: UserRole, password: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(username);
      
      if (!profile) {
        return false;
      }
      
      const isValid = await verifyPassword(password, profile.passwordHash);
      
      if (isValid) {
        // Store in localStorage to remember login
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          username,
          timestamp: Date.now(),
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  },

  // Check if user is logged in (from localStorage)
  getStoredAuth(): UserRole | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { username } = JSON.parse(stored);
        return username as UserRole;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Update display name
  async updateDisplayName(username: UserRole, newDisplayName: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, username);
      await setDoc(userRef, { displayName: newDisplayName }, { merge: true });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  },

  // Update password
  async updatePassword(username: UserRole, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(username);
      
      if (!profile) {
        return false;
      }
      
      // Verify old password
      const isValid = await verifyPassword(oldPassword, profile.passwordHash);
      
      if (!isValid) {
        return false;
      }
      
      // Update to new password
      const newHash = await hashPassword(newPassword);
      const userRef = doc(db, USERS_COLLECTION, username);
      await setDoc(userRef, { passwordHash: newHash }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  },

  // Get both display names
  async getDisplayNames(): Promise<{ doggo: string; ducko: string }> {
    try {
      const [doggoProfile, duckoProfile] = await Promise.all([
        this.getUserProfile('doggo'),
        this.getUserProfile('ducko'),
      ]);
      
      return {
        doggo: doggoProfile?.displayName || 'Doggo',
        ducko: duckoProfile?.displayName || 'Ducko',
      };
    } catch (error) {
      console.error('Error getting display names:', error);
      return { doggo: 'Doggo', ducko: 'Ducko' };
    }
  },
};

