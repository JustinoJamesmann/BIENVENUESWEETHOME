# Firebase Setup Instructions

This app now uses Firebase Authentication and Firestore Database for secure, real-time data sync across all users and devices.

## Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name (e.g., "bienvenue-sweet-home")
4. Disable Google Analytics (optional)
5. Click "Create project"
6. Wait for project to be created, then click "Continue"

## Step 2: Enable Authentication

1. In the Firebase console, go to **Build** → **Authentication**
2. Click "Get Started"
3. Select **Email/Password** sign-in provider
4. Enable it and click "Save"

## Step 3: Create Firestore Database

1. In the Firebase console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select a location (choose one closest to your users)
4. Select **Start in Test Mode** (we'll add security rules later)
5. Click "Create"

## Step 4: Get Firebase Configuration

1. In the Firebase console, click the **gear icon** (⚙️) → **Project settings**
2. Scroll down to "Your apps" section
3. Click the **</>** icon (Web app)
4. Register your app (name it "BIENVENUE SWEET HOME")
5. Copy the `firebaseConfig` object

## Step 5: Update Firebase Configuration

1. Open `src/app/firebase.ts`
2. Replace the placeholder config with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 6: Set Up Firestore Security Rules

1. In the Firebase console, go to **Build** → **Firestore Database** → **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: Read-only for workers, full access for admins
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Orders: Read/write for authenticated users
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    
    // Users: Read/write for authenticated users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 7: Create Users in Firebase Console

1. In the Firebase console, go to **Build** → **Authentication**
2. Click **Users** tab
3. Click **Add user**
4. Create your admin user:
   - Email: `admin@bienvenuesweethome.com` (or your preferred email)
   - Password: `Bi!Swe!Ho123`
5. Create your worker user:
   - Email: `worker@bienvenuesweethome.com` (or your preferred email)
   - Password: `BSH!0123`

## Step 8: Set User Roles

After users are created, you need to set their roles. Since we're using simple role management:

1. Users will default to "worker" role
2. To make a user an admin, you need to manually update their role in Firestore:
   - Go to **Build** → **Firestore Database**
   - Find the user document in the `users` collection
   - Change the `role` field from `"worker"` to `"admin"`

## Step 9: Test the App

1. Run `npm run dev` locally
2. Open the app in your browser
3. Login with the admin credentials you created
4. Add some products
5. Open the app in a different browser or incognito window
6. Login with worker credentials
7. You should see the same products (real-time sync!)

## Features Now Available

✅ **Secure Authentication** - Firebase Auth with email/password
✅ **Real-time Sync** - All users see the same data instantly
✅ **Cross-device** - Works on any browser/device
✅ **Data Persistence** - Data stored in Firebase cloud database
✅ **Role-based Access** - Admin and worker roles
✅ **Production Ready** - Built on Firebase infrastructure

## Troubleshooting

**"Permission denied" errors:**
- Check Firestore security rules are properly configured
- Make sure users are authenticated

**Data not syncing:**
- Check your internet connection
- Verify Firebase configuration is correct
- Check browser console for errors

**Can't login:**
- Verify user exists in Firebase Authentication
- Check email and password are correct
- Make sure Email/Password sign-in is enabled

## Next Steps

- Consider adding Firebase Analytics for usage tracking
- Add Firebase Cloud Functions for server-side logic
- Implement more granular security rules as needed
- Add email verification for new users
