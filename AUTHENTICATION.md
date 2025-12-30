# Authentication Guide 🔐

Your resolution app now has a custom authentication system designed specifically for Doggo 🐕 and Ducko 🦆!

## How It Works

### Two Accounts Only
- The app is hardcoded to only have **2 accounts**: `doggo` and `ducko`
- These are the only usernames that exist (no signup!)
- Each has their own password

### Default Passwords
When you first set up the app, the default passwords are:
- **Doggo**: `ngongongo`
- **Ducko**: `dangdangdang`

⚠️ **Change these immediately!** Go to Settings after your first login.

### Login Flow

1. **Choose Your Persona**
   - When you open the app, you'll see two options
   - Click on 🐕 Doggo or 🦆 Ducko

2. **Enter Password**
   - Enter your password
   - If it's your first time, use the default password shown

3. **Logged In!**
   - Your browser remembers you
   - Next time you open the app, you'll be automatically logged in
   - **Different browser?** You'll need to log in again

### Display Names

- Your **username** is always `doggo` or `ducko` (fixed)
- Your **display name** can be changed anytime!
- Perfect for inside jokes throughout the year
- Go to Settings → Display Name to change it

### Password Management

**Change Your Password:**
1. Click Settings (⚙️ icon)
2. Scroll to "Change Password"
3. Enter your current password
4. Enter new password twice
5. Click "Update Password"

**Password Requirements:**
- Minimum 4 characters
- Can be anything you want
- Stored securely (SHA-256 hashed in Firebase)

### Browser Memory

**How it works:**
- After logging in, your browser stores a token in `localStorage`
- Next time you visit, the app checks for this token
- If found, you're automatically logged in

**What triggers a new login:**
- Using a different browser
- Using incognito/private mode
- Clearing browser data/cookies
- Using a different device
- Clicking "Logout"

### Security Features

✅ **Passwords are hashed** - SHA-256 encryption  
✅ **No plaintext storage** - Passwords never stored as text  
✅ **Firebase secured** - Data stored in cloud database  
✅ **Per-browser auth** - Each device must authenticate separately  
✅ **Logout available** - Can sign out anytime  

### Settings

Access settings by clicking the ⚙️ icon in the header. You can:

1. **Change Display Name**
   - Update how your name appears
   - Great for seasonal jokes or nicknames
   - Takes effect immediately

2. **Change Password**
   - Must know current password
   - New password must be at least 4 characters
   - Confirm new password

3. **Logout**
   - Signs you out
   - Clears browser memory
   - Returns to login screen

## Common Scenarios

### "I forgot my password!"

Since you both have access to the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project → Firestore Database
3. Go to `users` collection
4. Find your document (`doggo` or `ducko`)
5. Delete the `passwordHash` field
6. The app will recreate it with the default password on next login
7. Then login with default password and change it immediately

### "My partner is logged in on my computer"

Just logout and login as yourself!

### "Can we add more people?"

The app is designed for just you two. To add more:
- You'd need to modify the code
- Add new user initialization
- Update the login screen
- Consider a different app design for more users

### "Should we use the same account?"

No! Each person should use their own account:
- **Doggo account** = whoever identifies as Doggo 🐕
- **Ducko account** = whoever identifies as Ducko 🦆
- Comments and activities are tracked per user
- Makes it more personal!

### "Is this secure enough?"

For a personal couples app:
- ✅ **Yes!** Passwords are properly hashed
- ✅ Data is in private Firebase project
- ✅ Each browser must authenticate

For public use:
- ❌ No rate limiting (could brute force)
- ❌ No 2FA (two-factor authentication)
- ❌ No email recovery

But since it's just for you two with non-obvious passwords, it's perfectly secure! 🔒

## Privacy

- All data stays in YOUR Firebase project
- Only you two have the passwords
- Only you two have access to Firebase Console
- No one else can see your resolutions or photos

## Tips

1. **Use strong passwords** after first login
2. **Don't share Firebase config** with others
3. **Each use your own account** for tracking
4. **Have fun with display names!** 🎉
5. **Change display names seasonally** for variety

---

Built with security and simplicity in mind for Doggo 🐕 & Ducko 🦆! 💕

