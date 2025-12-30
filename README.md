# Our 2025 Resolutions 🐕🦆

A beautiful, clean New Year resolution tracker built for couples (Doggo & Ducko!) to manage their goals together.

## ✨ Features

- 🔐 **Secure Authentication** - Two accounts: Doggo 🐕 & Ducko 🦆 with password protection
- 🎯 **Task Management** - Add resolutions with descriptions, assignees, deadlines, and urgency levels
- 📊 **Progress Tracking** - Visual progress bars and rings for countable goals (e.g., "Read 50 books")
- 💬 **Comment Threads** - Discuss, share recommendations, and upload photos for each resolution
- 🎉 **Celebrations** - Fun confetti animations when completing tasks and reaching milestones
- 👫 **Personalized** - Track who's working on what: Doggo 🐕, Ducko 🦆, or together
- ✏️ **Custom Display Names** - Change your display name anytime for inside jokes!
- ☁️ **Cloud Sync** - Real-time sync across all devices using Firebase
- 📸 **Photo Storage** - Upload and share photos in Firebase Storage
- 💾 **Browser Memory** - Stay logged in until you switch browsers or logout

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

**You need to set up Firebase to use this app!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database and Storage
4. Get your Firebase config
5. Copy `.env.example` to `.env` and fill in your Firebase credentials

📖 **See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed step-by-step instructions!**

### 3. Run Development Server

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (usually `http://localhost:5174`)

### 4. Build for Production

```bash
npm run build
```

## 📖 How to Use

1. **Login** - Choose your persona (Doggo 🐕 or Ducko 🦆) and enter your password
   - First time? Use default passwords: `ngongongo` (Doggo) or `dangdangdang` (Ducko)
   - Change your password immediately in Settings!
2. **Create Resolutions** - Click the + button to add a new resolution
   - Choose between regular tasks or countable goals
   - Set assignee (Doggo 🐕, Ducko 🦆, or Together 🐕🦆)
   - Add deadline and urgency
3. **Track Progress** - For countable goals, use the +/- buttons to update your count
4. **Add Comments** - Click "View Details" on any task to add comments and photos
5. **Settings** - Click ⚙️ to change display name, password, or logout
6. **Celebrate** - Watch the confetti fly when you complete tasks or reach milestones!

## 🎨 Design Features

- Clean, Atlassian-inspired minimalist design
- Warm orange/yellow color palette
- Dog 🐕 and duck 🦆 themed throughout
- Smooth animations and transitions
- Responsive design for all devices

## 🔥 Firebase Features

### Firestore Database
- Real-time sync across devices
- Automatic save with debouncing
- Persistent cloud storage

### Firebase Storage
- Upload and store photos
- Automatic compression
- Secure image URLs
- Max 5MB per image

### Sync Status
- Visual indicator in header
- "Syncing..." when saving
- "Synced" when complete

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development
- **Firebase** (Firestore + Storage)
- **Lucide Icons**
- **Canvas Confetti** for celebrations
- **date-fns** for date formatting

## 📱 Multi-Device Usage

Once Firebase is set up:
- Open the app on any device
- Both Doggo 🐕 and Ducko 🦆 can access from their own devices
- Changes sync in real-time
- Photos upload to cloud storage
- No need to share one device!

## 🔒 Security

The app has built-in authentication:

- ✅ **Two accounts only**: Doggo & Ducko
- ✅ **Password protected**: Each account has its own password
- ✅ **Hashed passwords**: SHA-256 encryption in Firebase
- ✅ **Browser memory**: Stays logged in per browser
- ✅ **Private data**: Only you two have access

**Important:**
1. **Change default passwords** immediately after first login
2. **Keep your `.env` file private** - Never commit it to git
3. **Don't share Firebase credentials** with others

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed security guide.

## 📂 Project Structure

```
resolution/
├── src/
│   ├── components/        # React components
│   ├── config/           # Firebase configuration
│   ├── services/         # Firebase service layer
│   ├── types.ts          # TypeScript types
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main app component
├── FIREBASE_SETUP.md     # Firebase setup guide
└── .env                  # Firebase credentials (create this!)
```

## 🐛 Troubleshooting

### App shows loading forever
- Check your `.env` file has correct Firebase credentials
- Verify Firestore and Storage are enabled in Firebase Console
- Check browser console for errors

### Photos not uploading
- Ensure Firebase Storage is enabled
- Check Storage rules allow uploads
- Verify internet connection

### Data not syncing
- Check Firestore rules allow read/write
- Verify internet connection
- Look for errors in browser console

## 💡 Future Ideas

- 🔐 User authentication
- 🔔 Push notifications
- 📱 Progressive Web App
- 🌙 Dark mode
- 📊 Statistics dashboard
- 🏆 Achievement system

---

Built with ❤️ for Doggo 🐕 & Ducko 🦆's 2025 journey together!
