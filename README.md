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
- [ ] Custom authentication system with two fixed accounts
- [ ] Browser-based session memory
- [ ] Password protection with SHA-256 hashing
- [ ] Change display names and passwords

### Task Management
- [ ] Create regular tasks or countable goals
- [ ] Assign tasks to yourself, partner, or both
- [ ] Set deadlines and urgency levels
- [ ] Add tags for better organization
- [ ] Add descriptions to tasks
- [ ] Edit and delete tasks

### Progress Tracking
- [ ] Mark tasks as complete
- [ ] Track progress for countable goals with increment/decrement buttons
- [ ] Visual progress rings for countable goals
- [ ] Subtasks for breaking down larger goals
- [ ] Task completion tracking

### Collaboration
- [ ] Comment threads on tasks
- [ ] Reply to comments
- [ ] React to comments with emojis
- [ ] Upload photos to comments
- [ ] Share GIFs via Tenor integration
- [ ] Full emoji picker support

### Filtering and Sorting
- [ ] Filter by your tasks, partner's tasks, or shared tasks
- [ ] Sort by name, priority, deadline, or latest activity
- [ ] Toggle between grid and list view

### Notifications
- [ ] Get notified when partner comments on your task
- [ ] Get notified when partner replies to your comment
- [ ] Get notified when partner reacts to your comment
- [ ] Get notified when partner completes a shared task
- [ ] Get notified when partner creates a shared task
- [ ] Get notified when partner adds subtasks to shared tasks

### Celebrations
- [ ] Custom animations when completing tasks
- [ ] Seasonal emoji animations when creating tasks
- [ ] Tag-based emoji celebrations
- [ ] Fun duck and dog parade animations

### Sharing
- [ ] Copy shareable links to tasks
- [ ] Deep linking to specific tasks

### Real-time Sync
- [ ] Cloud-based storage with Firebase
- [ ] Real-time synchronization across devices
- [ ] Automatic save with visual sync status
- [ ] Photo storage in Firebase Storage

### UI/UX
- [ ] Clean blue-green gradient color scheme
- [ ] Responsive design for all devices
- [ ] Smooth animations and transitions
- [ ] Custom scrollbar styling
- [ ] Keyboard shortcuts
- [ ] Dynamic seasonal emojis

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
