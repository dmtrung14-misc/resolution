# This Year We Will

![banner](assets/banner.png)

A New Year resolution tracker built for couples to share and track their goals together.

## Motivation

This app was created as a way for me and my girlfriend to keep track of our personal and shared goals throughout the year. We wanted something fun, personal, and easy to use where we could both see our progress, cheer each other on, and celebrate our wins together.

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm
- A Firebase account

### Setup Steps

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Firebase Storage
   - Set up Security Rules (see `FIREBASE_SETUP.md` for details)

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your Firebase credentials:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Features

### Authentication
- [x] Custom authentication system with two fixed accounts
- [x] Browser-based session memory
- [x] Password protection with SHA-256 hashing
- [x] Change display names and passwords

### Task Management
- [x] Create regular tasks or countable goals
- [x] Assign tasks to yourself, partner, or both
- [x] Set deadlines and urgency levels
- [x] Add tags for better organization
- [x] Add descriptions to tasks
- [x] Edit and delete tasks

### Progress Tracking
- [x] Mark tasks as complete
- [x] Track progress for countable goals with increment/decrement buttons
- [x] Visual progress rings for countable goals
- [x] Subtasks for breaking down larger goals
- [x] Task completion tracking

### Collaboration
- [x] Comment threads on tasks
- [x] Reply to comments
- [x] React to comments with emojis
- [x] Upload photos to comments
- [x] Share GIFs via Tenor integration
- [x] Full emoji picker support

### Filtering and Sorting
- [x] Filter by your tasks, partner's tasks, or shared tasks
- [x] Sort by name, priority, deadline, or latest activity
- [x] Toggle between grid and list view

### Notifications
- [x] Get notified when partner comments on your task
- [x] Get notified when partner replies to your comment
- [x] Get notified when partner reacts to your comment
- [x] Get notified when partner completes a shared task
- [x] Get notified when partner creates a shared task
- [x] Get notified when partner adds subtasks to shared tasks

### Celebrations
- [x] Custom animations when completing tasks
- [x] Seasonal emoji animations when creating tasks
- [x] Tag-based emoji celebrations
- [x] Fun duck and dog parade animations

### Sharing
- [x] Copy shareable links to tasks
- [x] Deep linking to specific tasks

### Real-time Sync
- [x] Cloud-based storage with Firebase
- [x] Real-time synchronization across devices
- [x] Automatic save with visual sync status
- [x] Photo storage in Firebase Storage

### UI/UX
- [x] Clean blue-green gradient color scheme
- [x] Responsive design for all devices
- [x] Smooth animations and transitions
- [x] Custom scrollbar styling
- [x] Keyboard shortcuts
- [x] Dynamic seasonal emojis
- [x] Motivational quotes on loading screen

### Future Ideas
- [ ] Export tasks to calendar
- [ ] Dark mode toggle

## Tech Stack

- React 18 with TypeScript
- Vite
- Tailwind CSS
- Firebase (Firestore and Storage)
- date-fns
- emoji-picker-react
- Tenor GIF API
- Lucide icons

## Security Notes

- Never commit your `.env` file
- Change default passwords immediately after first login
- Keep your Firebase credentials private
- Review Firebase Security Rules before deploying

---

🔥❤️ made with love by dmtrung14
