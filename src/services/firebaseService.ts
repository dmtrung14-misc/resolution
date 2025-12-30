import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Task, AppState, Comment } from '../types';

const COLLECTION_NAME = 'resolutions';
const STATE_DOC_ID = 'appState';

// Convert Firestore timestamp to Date
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  if (data.deadline?.toDate) {
    converted.deadline = data.deadline.toDate();
  }
  if (data.createdAt?.toDate) {
    converted.createdAt = data.createdAt.toDate();
  }
  if (data.comments) {
    converted.comments = data.comments.map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp?.toDate ? comment.timestamp.toDate() : comment.timestamp,
    }));
  }
  
  return converted;
};

// Convert Date to Firestore timestamp
const convertToTimestamps = (data: any): any => {
  const converted = { ...data };
  
  if (data.deadline instanceof Date) {
    converted.deadline = Timestamp.fromDate(data.deadline);
  }
  if (data.createdAt instanceof Date) {
    converted.createdAt = Timestamp.fromDate(data.createdAt);
  }
  if (data.comments) {
    converted.comments = data.comments.map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp instanceof Date 
        ? Timestamp.fromDate(comment.timestamp) 
        : comment.timestamp,
    }));
  }
  
  return converted;
};

export const firebaseService = {
  // Load app state (names and tasks)
  async loadState(): Promise<AppState | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, STATE_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userName: data.userName || '',
          partnerName: data.partnerName || '',
          tasks: (data.tasks || []).map(convertTimestamps),
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading state from Firebase:', error);
      return null;
    }
  },

  // Save app state
  async saveState(state: AppState): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, STATE_DOC_ID);
      const dataToSave = {
        userName: state.userName,
        partnerName: state.partnerName,
        tasks: state.tasks.map(convertToTimestamps),
        updatedAt: Timestamp.now(),
      };
      
      await setDoc(docRef, dataToSave);
    } catch (error) {
      console.error('Error saving state to Firebase:', error);
      throw error;
    }
  },

  // Upload image to Firebase Storage
  async uploadImage(file: File, taskId: string, commentId: string): Promise<string> {
    try {
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `resolutions/${taskId}/${commentId}/${filename}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Upload image from base64 (for existing functionality)
  async uploadImageFromBase64(
    base64Data: string, 
    taskId: string, 
    commentId: string
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `resolutions/${taskId}/${commentId}/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading base64 image:', error);
      throw error;
    }
  },

  // Delete image from Firebase Storage
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - image might already be deleted
    }
  },
};

