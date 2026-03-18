import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { AppState, Task, Notification } from '../types';

const RESOLUTIONS_COLLECTION = 'resolutions';
const DEFAULT_YEAR = '2026';
const TASKS_SUBCOLLECTION = 'tasks';
const NOTIFICATIONS_COLLECTION = 'notifications';

const getTasksCollectionRef = (year: string = DEFAULT_YEAR) =>
  collection(db, `${RESOLUTIONS_COLLECTION}/${year}/${TASKS_SUBCOLLECTION}`);

const getNotificationsCollectionRef = () => collection(db, NOTIFICATIONS_COLLECTION);

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
  async loadState(year: string = DEFAULT_YEAR): Promise<AppState | null> {
    try {
      const yearDocRef = doc(db, RESOLUTIONS_COLLECTION, year);
      const tasksCollectionRef = collection(
        db,
        `${RESOLUTIONS_COLLECTION}/${year}/${TASKS_SUBCOLLECTION}`
      );
      const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);

      const [yearDocSnap, tasksSnap, notificationsSnap] = await Promise.all([
        getDoc(yearDocRef),
        getDocs(tasksCollectionRef),
        getDocs(notificationsCollectionRef),
      ]);

      const loadedTasks = tasksSnap.docs.map((taskDoc) =>
        convertTimestamps({
          id: taskDoc.id,
          ...taskDoc.data(),
        })
      );

      const loadedNotifications = notificationsSnap.docs
        .map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        }))
        // Guard against non-notification docs that might share this collection.
        .filter((notif: any) => notif?.taskId && notif?.message)
        .map((notif: any) => ({
          ...notif,
          timestamp: notif.timestamp?.toDate?.() || new Date(notif.timestamp),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return bTime - aTime;
        });

      console.info('[Firebase Migration] loadState using new paths only', {
        profileDocPath: `${RESOLUTIONS_COLLECTION}/${year}`,
        tasksCollectionPath: `${RESOLUTIONS_COLLECTION}/${year}/${TASKS_SUBCOLLECTION}`,
        notificationsCollectionPath: NOTIFICATIONS_COLLECTION,
        year,
        profileDocExists: yearDocSnap.exists(),
        tasksDocCount: loadedTasks.length,
        notificationsDocCount: loadedNotifications.length,
      });

      if (yearDocSnap.exists() || loadedTasks.length > 0 || loadedNotifications.length > 0) {
        const yearData = yearDocSnap.data() || {};
        const loadedState = {
          userName: yearData.userName || '',
          partnerName: yearData.partnerName || '',
          tasks: loadedTasks,
          notifications: loadedNotifications,
        };

        console.log('Loaded state from new Firebase paths:', {
          taskCount: loadedState.tasks.length,
          notificationCount: loadedState.notifications.length,
        });

        return loadedState;
      }

      return null;
    } catch (error) {
      console.error('Error loading state from Firebase:', error);
      return null;
    }
  },

  async upsertTask(task: Task, year: string = DEFAULT_YEAR): Promise<void> {
    const tasksCollectionRef = getTasksCollectionRef(year);
    const taskDocRef = doc(tasksCollectionRef, String(task.id));
    await setDoc(taskDocRef, convertToTimestamps(task), { merge: true });
  },

  async deleteTask(taskId: string, year: string = DEFAULT_YEAR): Promise<void> {
    const tasksCollectionRef = getTasksCollectionRef(year);
    await deleteDoc(doc(tasksCollectionRef, String(taskId)));
  },

  async upsertNotification(notification: Notification): Promise<void> {
    if (!notification?.id) return;
    const notificationsCollectionRef = getNotificationsCollectionRef();
    await setDoc(
      doc(notificationsCollectionRef, String(notification.id)),
      removeUndefined({
        ...notification,
        timestamp:
          notification.timestamp instanceof Date
            ? Timestamp.fromDate(notification.timestamp)
            : notification.timestamp,
      }),
      { merge: true }
    );
  },

  async upsertNotifications(notifications: Notification[]): Promise<void> {
    if (!notifications?.length) return;
    const notificationsCollectionRef = getNotificationsCollectionRef();
    const batch = writeBatch(db);

    for (const notification of notifications) {
      if (!notification?.id) continue;
      batch.set(
        doc(notificationsCollectionRef, String(notification.id)),
        removeUndefined({
          ...notification,
          timestamp:
            notification.timestamp instanceof Date
              ? Timestamp.fromDate(notification.timestamp)
              : notification.timestamp,
        }),
        { merge: true }
      );
    }

    await batch.commit();
  },

  // Save app state
  async saveState(state: AppState, year: string = DEFAULT_YEAR): Promise<void> {
    try {
      // Safety check: Don't save if state is invalid
      if (!state.userName && !state.partnerName && state.tasks.length === 0) {
        console.warn('Refusing to save empty state to Firebase');
        return;
      }
      
      const yearDocRef = doc(db, RESOLUTIONS_COLLECTION, year);
      const tasksCollectionRef = collection(
        db,
        `${RESOLUTIONS_COLLECTION}/${year}/${TASKS_SUBCOLLECTION}`
      );
      const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);

      // Convert notification timestamps for Firestore
      const notifications = (state.notifications || []).map((notif) => ({
        ...notif,
        timestamp: notif.timestamp instanceof Date 
          ? Timestamp.fromDate(notif.timestamp)
          : notif.timestamp,
      }));

      const yearDataToSave = {
        userName: state.userName,
        partnerName: state.partnerName,
        updatedAt: Timestamp.now(),
      };

      await setDoc(yearDocRef, yearDataToSave, { merge: true });

      // Sync task docs in resolutions/2026/tasks
      const currentTaskDocsSnap = await getDocs(tasksCollectionRef);
      const currentTaskIds = new Set(currentTaskDocsSnap.docs.map((taskDoc) => taskDoc.id));
      const nextTaskIds = new Set(state.tasks.map((task) => String(task.id)));
      const tasksBatch = writeBatch(db);

      for (const task of state.tasks) {
        const taskId = String(task.id);
        const taskDocRef = doc(tasksCollectionRef, taskId);
        tasksBatch.set(taskDocRef, convertToTimestamps(task));
      }

      for (const existingTaskId of currentTaskIds) {
        if (!nextTaskIds.has(existingTaskId)) {
          tasksBatch.delete(doc(tasksCollectionRef, existingTaskId));
        }
      }

      await tasksBatch.commit();

      // Upsert notification docs in root notifications collection.
      // We intentionally avoid deleting here to prevent removing unrelated docs.
      if (notifications.length > 0) {
        const notificationsBatch = writeBatch(db);
        for (const notification of notifications) {
          if (!notification.id) continue;
          notificationsBatch.set(
            doc(notificationsCollectionRef, String(notification.id)),
            removeUndefined(notification),
            { merge: true }
          );
        }
        await notificationsBatch.commit();
      }

      console.log('State saved successfully to new Firebase paths');
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

