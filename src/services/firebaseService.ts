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

// Recursively convert comment timestamps
const convertCommentTimestamps = (comment: any): any => {
  if (!comment) return comment;
  
  let timestamp = comment.timestamp;
  
  if (comment.timestamp?.toDate) {
    timestamp = comment.timestamp.toDate();
  } else if (comment.timestamp && typeof comment.timestamp === 'string') {
    timestamp = new Date(comment.timestamp);
  } else if (comment.timestamp && !(comment.timestamp instanceof Date)) {
    timestamp = new Date(comment.timestamp);
  }
  
  const converted = {
    ...comment,
    timestamp,
  };
  
  // Recursively process replies
  if (comment.replies && Array.isArray(comment.replies)) {
    converted.replies = comment.replies.map(convertCommentTimestamps);
  }
  
  return converted;
};

// Convert Firestore timestamp to Date
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  console.log('Converting timestamps for task:', data.title, {
    deadlineRaw: data.deadline,
    deadlineType: typeof data.deadline,
    hasToDate: data.deadline?.toDate ? 'yes' : 'no'
  });
  
  if (data.deadline?.toDate) {
    converted.deadline = data.deadline.toDate();
    console.log('Converted deadline using toDate():', converted.deadline);
  } else if (data.deadline && typeof data.deadline === 'string') {
    // Handle string dates
    converted.deadline = new Date(data.deadline);
    console.log('Converted deadline from string:', converted.deadline);
  } else if (data.deadline) {
    // Already a date or something else
    converted.deadline = data.deadline instanceof Date ? data.deadline : new Date(data.deadline);
    console.log('Converted deadline from other:', converted.deadline);
  }
  
  if (data.createdAt?.toDate) {
    converted.createdAt = data.createdAt.toDate();
  } else if (data.createdAt && typeof data.createdAt === 'string') {
    converted.createdAt = new Date(data.createdAt);
  } else if (data.createdAt) {
    converted.createdAt = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
  }
  
  if (data.comments) {
    converted.comments = data.comments.map(convertCommentTimestamps);
  }
  
  console.log('Final converted deadline:', converted.deadline, 'isValid:', converted.deadline instanceof Date && !isNaN(converted.deadline.getTime()));
  
  return converted;
};

// Remove undefined values from object
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  // Don't process Date objects or Timestamps - return them as-is
  if (obj instanceof Date || obj?.toDate) return obj;
  if (typeof obj !== 'object') return obj;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned;
};

// Recursively convert comment dates to timestamps
const convertCommentToTimestamps = (comment: any): any => {
  if (!comment) return comment;
  
  const converted = {
    ...comment,
    timestamp: comment.timestamp instanceof Date 
      ? Timestamp.fromDate(comment.timestamp) 
      : comment.timestamp,
  };
  
  // Recursively process replies
  if (comment.replies && Array.isArray(comment.replies)) {
    converted.replies = comment.replies.map(convertCommentToTimestamps);
  }
  
  // Remove undefined values
  return removeUndefined(converted);
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
    converted.comments = data.comments.map(convertCommentToTimestamps);
  }
  
  // Remove all undefined values before saving
  return removeUndefined(converted);
};

export const firebaseService = {
  // Load app state (names and tasks)
  async loadState(): Promise<AppState | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, STATE_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        console.log('Raw data from Firebase (first task):', data.tasks?.[0]);
        console.log('Raw deadline:', data.tasks?.[0]?.deadline);
        console.log('Deadline structure:', {
          value: data.tasks?.[0]?.deadline,
          hasToDate: typeof data.tasks?.[0]?.deadline?.toDate,
          seconds: data.tasks?.[0]?.deadline?.seconds,
          nanoseconds: data.tasks?.[0]?.deadline?.nanoseconds,
        });
        
        // Convert notification timestamps
        const notifications = (data.notifications || []).map((notif: any) => ({
          ...notif,
          timestamp: notif.timestamp?.toDate?.() || new Date(notif.timestamp),
        }));
        
        const loadedState = {
          userName: data.userName || '',
          partnerName: data.partnerName || '',
          tasks: (data.tasks || []).map(convertTimestamps),
          notifications,
        };
        
        console.log('Loaded state from Firebase:', {
          taskCount: loadedState.tasks.length,
          tasks: loadedState.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            deadlineType: typeof t.deadline,
            deadlineIsDate: t.deadline instanceof Date,
            deadlineValid: t.deadline instanceof Date && !isNaN(t.deadline.getTime()),
            commentCount: t.comments?.length || 0
          }))
        });
        
        return loadedState;
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
      
      // Convert notification timestamps
      const notifications = (state.notifications || []).map((notif) => ({
        ...notif,
        timestamp: notif.timestamp instanceof Date 
          ? Timestamp.fromDate(notif.timestamp)
          : notif.timestamp,
      }));
      
      const dataToSave = {
        userName: state.userName,
        partnerName: state.partnerName,
        tasks: state.tasks.map(convertToTimestamps),
        notifications: removeUndefined(notifications),
        updatedAt: Timestamp.now(),
      };
      
      console.log('Saving state to Firebase:', {
        taskCount: dataToSave.tasks.length,
        tasks: dataToSave.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          commentCount: t.comments?.length || 0
        }))
      });
      
      await setDoc(docRef, dataToSave);
      console.log('State saved successfully');
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

