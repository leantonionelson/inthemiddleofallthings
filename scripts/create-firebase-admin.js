#!/usr/bin/env node

/**
 * Firebase Admin Account Creation Script
 * 
 * This script actually creates the admin account in Firebase Authentication.
 * Run this to set up the master admin credentials in Firebase.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('✅ Loaded environment variables from .env file');
} catch (error) {
  console.log('No .env file found, using process.env');
  envVars = process.env;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
  measurementId: envVars.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔧 Firebase Configuration:');
console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`Auth Domain: ${firebaseConfig.authDomain || '❌ Missing'}`);
console.log(`Project ID: ${firebaseConfig.projectId || '❌ Missing'}`);
console.log(`Storage Bucket: ${firebaseConfig.storageBucket || '❌ Missing'}`);
console.log(`Messaging Sender ID: ${firebaseConfig.messagingSenderId || '❌ Missing'}`);
console.log(`App ID: ${firebaseConfig.appId || '❌ Missing'}`);
console.log(`Measurement ID: ${firebaseConfig.measurementId || '❌ Missing'}\n`);

// Admin account configuration
const ADMIN_CONFIG = {
  email: 'admin@middleapp.com',
  password: 'MiddleApp2024!Admin',
  name: 'Admin User',
  role: 'admin'
};

console.log('🔐 Middle App - Firebase Admin Account Creation');
console.log('===============================================\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminAccount() {
  try {
    console.log('📋 Creating admin account with:');
    console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
    console.log(`🔑 Password: ${ADMIN_CONFIG.password}`);
    console.log(`👤 Name: ${ADMIN_CONFIG.name}`);
    console.log(`🎭 Role: ${ADMIN_CONFIG.role}\n`);

    // Try to create the account
    console.log('🚀 Creating Firebase user account...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      ADMIN_CONFIG.email, 
      ADMIN_CONFIG.password
    );
    
    const user = userCredential.user;
    console.log('✅ Firebase user created successfully!');
    console.log(`🆔 User ID: ${user.uid}`);

    // Create user profile in Firestore
    console.log('📝 Creating user profile in Firestore...');
    const userProfile = {
      uid: user.uid,
      email: ADMIN_CONFIG.email,
      name: ADMIN_CONFIG.name,
      isAnonymous: false,
      onboardingCompleted: true, // Admin skips onboarding
      role: ADMIN_CONFIG.role,
      createdAt: new Date(),
      lastActive: new Date(),
      subscriptionStatus: {
        isActive: true,
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'admin'
      }
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ User profile created in Firestore!');

    // Sign out after creation
    await auth.signOut();
    console.log('🔓 Signed out after account creation\n');

    console.log('🎉 Admin account setup complete!');
    console.log('🔥 You can now login with these credentials:');
    console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
    console.log(`🔑 Password: ${ADMIN_CONFIG.password}\n`);

    console.log('🚀 Next steps:');
    console.log('1. Open your app: http://localhost:5174/');
    console.log('2. Navigate to /auth');
    console.log('3. Use the credentials above to sign in');
    console.log('4. You should have full admin access!');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 The admin account already exists!');
      console.log('🔍 Testing login with existing credentials...');
      
      try {
        await signInWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password);
        console.log('✅ Login successful! Admin account is working.');
        await auth.signOut();
        console.log('🔓 Signed out after testing\n');
        
        console.log('🎉 Admin account is ready to use!');
        console.log('🔥 Login credentials:');
        console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
        console.log(`🔑 Password: ${ADMIN_CONFIG.password}`);
      } catch (loginError) {
        console.error('❌ Login failed:', loginError);
        console.log('\n💡 Possible solutions:');
        console.log('1. Check if the password is correct');
        console.log('2. Reset the password in Firebase Console');
        console.log('3. Delete the existing account and recreate it');
      }
    } else {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check your Firebase configuration');
      console.log('2. Ensure Firebase Authentication is enabled');
      console.log('3. Verify your environment variables');
      console.log('4. Check Firebase project permissions');
    }
  }
}

// Run the script
createAdminAccount()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
