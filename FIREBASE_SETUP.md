# Firebase Setup Guide 🔥

Follow these steps to set up Firebase for your Resolution app. This will enable:
- 🔄 Real-time sync between devices
- ☁️ Cloud storage for your resolutions
- 📸 Image storage for photos

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., `our-2025-resolutions`)
4. Disable Google Analytics (not needed for this app)
5. Click **"Create project"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Give it a nickname (e.g., `Resolution Web App`)
3. **Don't** check "Firebase Hosting" (not needed yet)
4. Click **"Register app"**
5. You'll see a configuration object - **keep this page open!**

## Step 3: Enable Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select a location closest to you (e.g., `us-central`)
5. Click **"Enable"**

## Step 4: Enable Firebase Storage

1. In the left sidebar, click **"Storage"**
2. Click **"Get started"**
3. Click **"Next"** on the security rules page (test mode)
4. Select the same location as your Firestore
5. Click **"Done"**

## Step 5: Configure Your App

1. Copy your Firebase config from Step 2 (the `firebaseConfig` object)
2. Open the `.env` file in your project root
3. Replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

4. Save the file

## Step 6: Update Security Rules (Important!)

### Firestore Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Resolutions data - accessible to everyone (since we have app-level auth)
    match /resolutions/{document=**} {
      allow read, write: if true;
    }
    
    // User profiles (doggo & ducko) - accessible to everyone
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### Storage Rules

1. Go to **Storage** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resolutions/{allPaths=**} {
      // Allow read/write access to everyone (for now)
      // Image files only
      allow read, write: if request.resource.size < 5 * 1024 * 1024
                         && request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. Click **"Publish"**

## Step 7: Test Your Setup

1. Restart your dev server:
```bash
npm run dev
```

2. Open the app in your browser
3. Try creating a resolution
4. Check Firebase Console → Firestore Database to see your data
5. Add a photo to a comment
6. Check Firebase Console → Storage to see your uploaded image

## Step 8: Use on Multiple Devices! 🎉

Now you and your partner can:
- Open the app on different devices
- Both see the same resolutions
- Add tasks and comments from anywhere
- Upload photos that sync everywhere

## Security Notes 🔒

The current setup allows anyone with the link to access your data. For better security:

1. **Option A: Keep it simple** - Just don't share your Firebase config publicly
2. **Option B: Add authentication** - Let me know if you want me to add simple email/password login
3. **Option C: Add a shared PIN** - I can add a PIN code that both of you need to enter

## Troubleshooting

### "Firebase: Error (auth/api-key-not-valid)"
- Check your `.env` file has the correct `VITE_FIREBASE_API_KEY`
- Make sure you restarted the dev server after editing `.env`

### "Firebase: Missing or insufficient permissions"
- Check that you published the Firestore and Storage rules above
- Make sure the rules allow `read, write: if true`

### Images not uploading
- Check Firebase Storage is enabled
- Check the Storage rules are published
- Check your Storage bucket name in `.env` is correct

### Data not syncing
- Open browser console (F12) and check for errors
- Verify Firestore rules are set correctly
- Check your internet connection

## What's Next?

Your app now has:
- ✅ Cloud database (Firestore)
- ✅ Image storage (Firebase Storage)
- ✅ Real-time sync
- ✅ Multi-device support

Optional improvements I can add:
- 🔐 User authentication
- 🔔 Push notifications for new comments
- 📱 Progressive Web App (install on phone)
- 🌙 Dark mode
- 📊 Statistics and insights

Just let me know what you'd like next! 🐕🦆

