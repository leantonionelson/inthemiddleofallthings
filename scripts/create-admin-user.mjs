#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script creates the admin user account using Firebase client SDK
 * and tests the login functionality.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.error('❌ Error loading environment variables:', error);
  process.exit(1);
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

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@middleapp.com',
  password: 'MiddleApp2024!Admin',
  name: 'Admin User'
};

console.log('🔐 Firebase Admin User Creation & Testing');
console.log('=========================================\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAndTestAdminUser() {
  try {
    console.log(`📧 Creating admin user: ${ADMIN_CREDENTIALS.email}`);
    
    // Try to create the user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      ADMIN_CREDENTIALS.email, 
      ADMIN_CREDENTIALS.password
    );
    
    const user = userCredential.user;
    console.log('✅ User created successfully!');
    console.log(`🆔 User ID: ${user.uid}`);
    
    // Create user profile in Firestore
    console.log('📝 Creating user profile...');
    const userProfile = {
      uid: user.uid,
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      isAnonymous: false,
      onboardingCompleted: true,
      role: 'admin',
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
    await signOut(auth);
    console.log('🔓 Signed out after creation\n');
    
    // Test login
    console.log('🧪 Testing login with admin credentials...');
    const loginCredential = await signInWithEmailAndPassword(
      auth, 
      ADMIN_CREDENTIALS.email, 
      ADMIN_CREDENTIALS.password
    );
    
    console.log('✅ Login test successful!');
    console.log(`🆔 Logged in as: ${loginCredential.user.uid}`);
    console.log(`📧 Email: ${loginCredential.user.email}`);
    
    // Sign out after test
    await signOut(auth);
    console.log('🔓 Signed out after testing\n');
    
    console.log('🎉 Admin account creation and testing complete!');
    console.log('📋 Admin Login Credentials:');
    console.log(`   📧 Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`   🔑 Password: ${ADMIN_CREDENTIALS.password}`);
    console.log('\n🚀 You can now login at: http://localhost:5175/auth');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin account already exists, testing login...\n');
      
      try {
        // Test existing account
        const loginCredential = await signInWithEmailAndPassword(
          auth, 
          ADMIN_CREDENTIALS.email, 
          ADMIN_CREDENTIALS.password
        );
        
        console.log('✅ Existing admin account login test successful!');
        console.log(`🆔 User ID: ${loginCredential.user.uid}`);
        console.log(`📧 Email: ${loginCredential.user.email}`);
        
        await signOut(auth);
        console.log('🔓 Signed out after testing\n');
        
        console.log('🎉 Admin account is ready to use!');
        console.log('📋 Admin Login Credentials:');
        console.log(`   📧 Email: ${ADMIN_CREDENTIALS.email}`);
        console.log(`   🔑 Password: ${ADMIN_CREDENTIALS.password}`);
        console.log('\n🚀 You can now login at: http://localhost:5175/auth');
        
      } catch (loginError) {
        console.error('❌ Login test failed:', loginError.message);
        if (loginError.code === 'auth/invalid-credential') {
          console.log('💡 The admin account exists but the password is incorrect.');
          console.log('🔧 You may need to reset the password in Firebase Console.');
        }
        throw loginError;
      }
    } else {
      console.error('❌ Error creating admin user:', error.message);
      console.log('\n💡 Possible solutions:');
      console.log('1. Ensure Firebase Authentication is enabled in Firebase Console');
      console.log('2. Check Email/Password sign-in method is enabled');
      console.log('3. Verify Firebase project configuration');
      throw error;
    }
  }
}

// Run the script
createAndTestAdminUser()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });