# Firestore Security Rules

This document contains the Firestore security rules needed to protect user data in Firebase.

## Rules Configuration

Go to Firebase Console → Firestore Database → Rules and paste the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own progress
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to manage their own user profile data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## What These Rules Do

1. **userProgress Collection**: Users can only read and write their own progress data. The document ID must match their user ID.

2. **users Collection**: Users can only read and write their own user profile data. The document ID must match their user ID.

## Clearing Existing Firebase Data

To clear existing Firebase data from the old app:

### Option 1: Firebase Console (Recommended)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `inthemiddleofallthings`
3. Navigate to **Firestore Database**
4. For each collection you want to delete:
   - Click on the collection
   - Select all documents (or use the checkbox at the top)
   - Click "Delete" and confirm

### Option 2: Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Use the Firebase Console to delete collections, or write a script using Admin SDK
```

### Option 3: Admin SDK Script

Create a script to delete all data:

```javascript
// scripts/clear-firebase-data.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllData() {
  const collections = ['userProgress', 'users']; // Add other collections as needed
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleared ${snapshot.size} documents from ${collectionName}`);
  }
  
  console.log('All data cleared!');
  process.exit(0);
}

clearAllData().catch(console.error);
```

**Note**: You'll need to download your service account key from Firebase Console → Project Settings → Service Accounts.

## Testing Rules

After setting up the rules, test them:

1. Sign up a new user in the app
2. Check that progress is saved to Firestore
3. Try accessing another user's data (should fail)
4. Verify that only the authenticated user can read/write their own data

